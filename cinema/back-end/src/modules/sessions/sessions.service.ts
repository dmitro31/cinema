import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hasPrismaCode } from '../../common/utils/prisma-errors';
import { PrismaService } from '../../core/database/prisma.service';
import { RedisService } from '../../core/redis/redis.service';
import { HallsService } from '../halls/halls.service';
import { MoviesService } from '../movies/movies.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionsDto } from './dto/query-sessions.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SESSION_BUFFER_MIN } from './sessions.constants';

const sessionInclude = {
  movie: {
    select: { id: true, title: true, posterUrl: true, durationMin: true, ageRating: true },
  },
  hall: { select: { id: true, name: true } },
} as const;

type SeatStatus = 'FREE' | 'HELD' | 'SOLD';

@Injectable()
export class SessionsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private movies: MoviesService,
    private halls: HallsService,
  ) {}

  async list({ page, limit, movieId, hallId, from, to }: QuerySessionsDto) {
    const where = {
      ...(movieId ? { movieId } : {}),
      ...(hallId ? { hallId } : {}),
      startAt: { gte: from ?? new Date(), ...(to ? { lte: to } : {}) },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({
        where,
        include: sessionInclude,
        orderBy: { startAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.session.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: sessionInclude,
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getSeats(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      select: {
        id: true,
        hallId: true,
        hall: { select: { rows: true, seatsPerRow: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');

    const [seats, tickets] = await Promise.all([
      this.prisma.seat.findMany({
        where: { hallId: session.hallId },
        select: { id: true, row: true, number: true, type: true },
        orderBy: [{ row: 'asc' }, { number: 'asc' }],
      }),
      this.prisma.ticket.findMany({
        where: { sessionId: session.id },
        select: { seatId: true },
      }),
    ]);

    const sold = new Set(tickets.map((ticket) => ticket.seatId));
    const held = await this.redis.getHeldSeatIds(
      session.id,
      seats.map((seat) => seat.id),
    );

    return {
      sessionId: session.id,
      rows: session.hall.rows,
      seatsPerRow: session.hall.seatsPerRow,
      seats: seats.map((seat) => {
        const status: SeatStatus = sold.has(seat.id)
          ? 'SOLD'
          : held.has(seat.id)
            ? 'HELD'
            : 'FREE';
        return { ...seat, status };
      }),
    };
  }

  async create(dto: CreateSessionDto) {
    if (dto.startAt.getTime() <= Date.now()) {
      throw new BadRequestException('Session must start in the future');
    }

    const durationMin = await this.movies.getDuration(dto.movieId);
    await this.halls.assertExists(dto.hallId);

    const endAt = this.computeEnd(dto.startAt, durationMin);
    await this.assertNoOverlap(dto.hallId, dto.startAt, endAt);

    return this.prisma.session.create({
      data: {
        movieId: dto.movieId,
        hallId: dto.hallId,
        startAt: dto.startAt,
        endAt,
        price: dto.price,
        vipPrice: dto.vipPrice,
      },
      include: sessionInclude,
    });
  }

  async update(id: string, dto: UpdateSessionDto) {
    const existing = await this.prisma.session.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Session not found');

    if (dto.startAt && dto.startAt.getTime() <= Date.now()) {
      throw new BadRequestException('Session must start in the future');
    }

    const timeOrPlaceChanged =
      (dto.movieId !== undefined && dto.movieId !== existing.movieId) ||
      (dto.hallId !== undefined && dto.hallId !== existing.hallId) ||
      (dto.startAt !== undefined && dto.startAt.getTime() !== existing.startAt.getTime());

    if (timeOrPlaceChanged && (await this.hasActiveOrders(id))) {
      throw new ConflictException('Session has active orders');
    }

    const movieId = dto.movieId ?? existing.movieId;
    const hallId = dto.hallId ?? existing.hallId;
    const startAt = dto.startAt ?? existing.startAt;

    if (dto.hallId) await this.halls.assertExists(hallId);
    const durationMin = await this.movies.getDuration(movieId);

    const endAt = this.computeEnd(startAt, durationMin);
    await this.assertNoOverlap(hallId, startAt, endAt, id);

    return this.prisma.session.update({
      where: { id },
      data: {
        movieId,
        hallId,
        startAt,
        endAt,
        price: dto.price ?? undefined,
        vipPrice: dto.vipPrice,
      },
      include: sessionInclude,
    });
  }

  async remove(id: string) {
    if (await this.hasActiveOrders(id)) {
      throw new ConflictException('Session has active orders');
    }

    try {
      await this.prisma.session.delete({ where: { id } });
    } catch (error) {
      if (hasPrismaCode(error, 'P2025')) throw new NotFoundException('Session not found');
      if (hasPrismaCode(error, 'P2003')) throw new ConflictException('Session has order history');
      throw error;
    }
  }

  private async hasActiveOrders(sessionId: string) {
    const count = await this.prisma.order.count({
      where: {
        sessionId,
        OR: [{ status: 'PAID' }, { status: 'PENDING', expiresAt: { gt: new Date() } }],
      },
    });
    return count > 0;
  }

  private computeEnd(startAt: Date, durationMin: number) {
    return new Date(startAt.getTime() + (durationMin + SESSION_BUFFER_MIN) * 60_000);
  }

  private async assertNoOverlap(hallId: string, startAt: Date, endAt: Date, excludeId?: string) {
    const conflict = await this.prisma.session.findFirst({
      where: {
        hallId,
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) throw new ConflictException('Hall is busy at this time');
  }
}