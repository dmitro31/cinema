import { Injectable, NotFoundException } from '@nestjs/common';
import { toMoney } from '../../common/utils/money';
import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { seatPriceCents } from './booking.utils';

@Injectable()
export class SeatMapService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getSeatMap(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        price: true,
        vipPrice: true,
        movie: { select: { id: true, title: true } },
        hall: {
          select: {
            id: true,
            name: true,
            rows: true,
            seatsPerRow: true,
            seats: {
              orderBy: [{ row: 'asc' }, { number: 'asc' }],
              select: { id: true, row: true, number: true, type: true },
            },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');

    const seatIds = session.hall.seats.map((seat) => seat.id);
    const [soldTickets, heldIds] = await Promise.all([
      this.prisma.ticket.findMany({ where: { sessionId }, select: { seatId: true } }),
      this.redis.getHeldSeatIds(sessionId, seatIds),
    ]);
    const soldIds = new Set(soldTickets.map((ticket) => ticket.seatId));

    const seats = session.hall.seats.map((seat) => ({
      id: seat.id,
      row: seat.row,
      number: seat.number,
      type: seat.type,
      price: seatPriceCents(session, seat.type) / 100,
      status: soldIds.has(seat.id) ? 'SOLD' : heldIds.has(seat.id) ? 'HELD' : 'FREE',
    }));

    return {
      session: {
        id: session.id,
        startAt: session.startAt,
        endAt: session.endAt,
        price: toMoney(session.price),
        vipPrice: session.vipPrice === null ? null : toMoney(session.vipPrice),
        movie: session.movie,
      },
      hall: {
        id: session.hall.id,
        name: session.hall.name,
        rows: session.hall.rows,
        seatsPerRow: session.hall.seatsPerRow,
      },
      seats,
    };
  }
}