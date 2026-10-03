// src/modules/booking/booking.service.ts
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { fromCents } from '../../common/utils/money';
import { hasPrismaCode } from '../../common/utils/prisma-errors';
import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { HOLD_TTL_SEC, MAX_PENDING_ORDERS_PER_USER } from './booking.constants';
import { seatPriceCents } from './booking.utils';
import { HoldSeatsDto } from './dto/hold-seats.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { orderInclude, toOrderView } from './order.view';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async hold(userId: string, dto: HoldSeatsDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: dto.sessionId },
      select: { id: true, hallId: true, startAt: true, price: true, vipPrice: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.startAt.getTime() <= Date.now()) {
      throw new BadRequestException('Session has already started');
    }

    const seats = await this.prisma.seat.findMany({
      where: { id: { in: dto.seatIds }, hallId: session.hallId },
      select: { id: true, row: true, number: true, type: true },
    });
    if (seats.length !== dto.seatIds.length) {
      throw new BadRequestException('Some seats do not belong to the hall of this session');
    }

    const pendingCount = await this.prisma.order.count({
      where: { userId, status: 'PENDING', expiresAt: { gt: new Date() } },
    });
    if (pendingCount >= MAX_PENDING_ORDERS_PER_USER) {
      throw new HttpException('Too many pending orders', HttpStatus.TOO_MANY_REQUESTS);
    }

    const sold = await this.prisma.ticket.findMany({
      where: { sessionId: session.id, seatId: { in: dto.seatIds } },
      select: { seatId: true },
    });
    if (sold.length > 0) {
      throw new ConflictException({
        message: 'Some seats are already sold',
        seatIds: sold.map((ticket) => ticket.seatId),
      });
    }

    const orderId = randomUUID();
    const held = await this.redis.holdSeats(session.id, dto.seatIds, orderId, HOLD_TTL_SEC);
    if (!held) {
      throw new ConflictException('Some seats are being held by another customer');
    }

    const items = seats.map((seat) => ({
      seatId: seat.id,
      priceCents: seatPriceCents(session, seat.type),
    }));
    const totalCents = items.reduce((sum, item) => sum + item.priceCents, 0);

    try {
      const order = await this.prisma.order.create({
        data: {
          id: orderId,
          userId,
          sessionId: session.id,
          total: fromCents(totalCents),
          expiresAt: new Date(Date.now() + HOLD_TTL_SEC * 1000),
          items: {
            create: items.map((item) => ({
              seatId: item.seatId,
              price: fromCents(item.priceCents),
            })),
          },
        },
        include: orderInclude,
      });
      return toOrderView(order);
    } catch (error) {
      await this.redis.releaseSeats(session.id, dto.seatIds, orderId);
      throw error;
    }
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    return toOrderView(order);
  }

  async listMine(userId: string, { page, limit, status }: ListOrdersDto) {
    const where = { userId, ...(status ? { status } : {}) };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items: items.map(toOrderView), total, page, limit };
  }

  async cancel(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { select: { seatId: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    if (updated.count === 0) {
      throw new ConflictException('Only pending orders can be cancelled');
    }

    await this.redis.releaseSeats(
      order.sessionId,
      order.items.map((item) => item.seatId),
      orderId,
    );
  }

  async confirmPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'PAID') return toOrderView(order);
    if (order.status !== 'PENDING') {
      throw new ConflictException(`Order is ${order.status.toLowerCase()}`);
    }

    if (order.expiresAt.getTime() < Date.now()) {
      await this.prisma.order.updateMany({
        where: { id: orderId, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });
      throw new ConflictException('Order has expired');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: orderId, status: 'PENDING' },
          data: { status: 'PAID' },
        });
        if (updated.count === 0) throw new ConflictException('Order is no longer pending');

        await tx.ticket.createMany({
          data: order.items.map((item) => ({
            orderId,
            sessionId: order.sessionId,
            seatId: item.seatId,
            price: item.price,
            qrCode: randomBytes(24).toString('base64url'),
          })),
        });
      });
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        throw new ConflictException('Some seats are already sold');
      }
      throw error;
    }

    await this.redis.releaseSeats(
      order.sessionId,
      order.items.map((item) => item.seatId),
      orderId,
    );

    const paid = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!paid) throw new NotFoundException('Order not found');
    return toOrderView(paid);
  }

  async expirePendingOrders() {
    const { count } = await this.prisma.order.updateMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
    return count;
  }
}