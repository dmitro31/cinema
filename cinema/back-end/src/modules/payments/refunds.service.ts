import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '../../generated/prisma/enums';
import { toMoney } from '../../common/utils/money';
import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { LiqPayService } from './liqpay.service';
import { REFUND_CUTOFF_MIN } from './payments.constants';

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(
    private prisma: PrismaService,
    private liqpay: LiqPayService,
    private redis: RedisService,
  ) {}

  async refundOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        status: true,
        sessionId: true,
        paidByPaymentId: true,
        session: { select: { startAt: true } },
        tickets: { select: { seatId: true, usedAt: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PAID') {
      throw new ConflictException('Only paid orders can be refunded');
    }
    if (order.tickets.some((ticket) => ticket.usedAt)) {
      throw new ConflictException('Some tickets were already used');
    }

    const deadline = order.session.startAt.getTime() - REFUND_CUTOFF_MIN * 60_000;
    if (Date.now() >= deadline) {
      throw new ConflictException('Refund is no longer available for this session');
    }

    const claimed = await this.prisma.order.updateMany({
      where: { id: orderId, status: 'PAID' },
      data: { status: OrderStatus.REFUNDED },
    });
    if (claimed.count === 0) {
      throw new ConflictException('Order is already being processed');
    }

    const payment = order.paidByPaymentId
      ? await this.prisma.payment.findUnique({
          where: { id: order.paidByPaymentId },
          select: { id: true, amount: true },
        })
      : null;
    const amount = payment ? toMoney(payment.amount) : 0;

    if (payment) {
      const refunded = await this.liqpay.refund(payment.id, amount);
      if (!refunded) {
        await this.prisma.order.updateMany({
          where: { id: orderId, status: 'REFUNDED' },
            data: { status: 'PAID' },
        });
        throw new BadGatewayException('Payment provider could not process the refund');
      }
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.ticket.deleteMany({ where: { orderId } });
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.REFUNDED },
        });
        if (payment) {
          await tx.payment.updateMany({
            where: { id: payment.id },
            data: { status: 'REFUNDED', providerStatus: 'reversed' },
          });
        }
      });
    } catch (error) {
      this.logger.error(`Order ${orderId} was refunded at the provider but the local update failed`);
      throw error;
    }

    const publishSeatsChanged = (
      this.redis as RedisService & {
        publishSeatsChanged: (sessionId: string, seatIds: string[]) => Promise<void>;
      }
    ).publishSeatsChanged;

    if (typeof publishSeatsChanged === 'function') {
      await publishSeatsChanged.call(this.redis, order.sessionId, order.tickets.map((ticket) => ticket.seatId));
    }

    return { orderId, status: 'REFUNDED' as const, refundedAmount: amount };
  }
}
