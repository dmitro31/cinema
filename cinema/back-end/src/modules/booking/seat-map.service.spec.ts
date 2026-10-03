// src/modules/booking/seat-map.service.spec.ts
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeatMapService } from './seat-map.service';

const sessionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  startAt: new Date('2026-10-15T18:00:00.000Z'),
  endAt: new Date('2026-10-15T20:50:00.000Z'),
  price: '100.00',
  vipPrice: '180.00',
  movie: { id: 'movie-1', title: 'Dune' },
  hall: {
    id: 'hall-1',
    name: 'Hall 1',
    rows: 2,
    seatsPerRow: 2,
    seats: [
      { id: 's1', row: 1, number: 1, type: 'STANDARD' },
      { id: 's2', row: 1, number: 2, type: 'STANDARD' },
      { id: 's3', row: 2, number: 1, type: 'VIP' },
      { id: 's4', row: 2, number: 2, type: 'VIP' },
    ],
  },
  ...overrides,
});

describe('SeatMapService', () => {
  let prisma: {
    session: { findUnique: ReturnType<typeof vi.fn> };
    ticket: { findMany: ReturnType<typeof vi.fn> };
  };
  let redis: { getHeldSeatIds: ReturnType<typeof vi.fn> };
  let service: SeatMapService;

  beforeEach(() => {
    prisma = {
      session: { findUnique: vi.fn().mockResolvedValue(sessionRecord()) },
      ticket: { findMany: vi.fn().mockResolvedValue([]) },
    };
    redis = { getHeldSeatIds: vi.fn().mockResolvedValue(new Set<string>()) };
    service = new SeatMapService(prisma as never, redis as never);
  });

  it('throws when the session does not exist', async () => {
    prisma.session.findUnique.mockResolvedValue(null);

    await expect(service.getSeatMap('session-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('marks every seat as free when nothing is sold or held', async () => {
    const result = await service.getSeatMap('session-1');

    expect(result.seats).toHaveLength(4);
    expect(result.seats.every((seat) => seat.status === 'FREE')).toBe(true);
  });

  it('marks sold and held seats and lets sold win over held', async () => {
    prisma.ticket.findMany.mockResolvedValue([{ seatId: 's1' }]);
    redis.getHeldSeatIds.mockResolvedValue(new Set(['s1', 's2']));

    const result = await service.getSeatMap('session-1');

    const status = Object.fromEntries(result.seats.map((seat) => [seat.id, seat.status]));
    expect(status).toEqual({ s1: 'SOLD', s2: 'HELD', s3: 'FREE', s4: 'FREE' });
  });

  it('asks Redis about every seat of the hall', async () => {
    await service.getSeatMap('session-1');

    expect(redis.getHeldSeatIds).toHaveBeenCalledWith('session-1', ['s1', 's2', 's3', 's4']);
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sessionId: 'session-1' } }),
    );
  });

  it('prices VIP seats with vipPrice and the rest with price', async () => {
    const result = await service.getSeatMap('session-1');

    const prices = Object.fromEntries(result.seats.map((seat) => [seat.id, seat.price]));
    expect(prices).toEqual({ s1: 100, s2: 100, s3: 180, s4: 180 });
    expect(result.session.price).toBe(100);
    expect(result.session.vipPrice).toBe(180);
  });

  it('falls back to the regular price for VIP seats without vipPrice', async () => {
    prisma.session.findUnique.mockResolvedValue(sessionRecord({ vipPrice: null }));

    const result = await service.getSeatMap('session-1');

    expect(result.seats.find((seat) => seat.id === 's3')?.price).toBe(100);
    expect(result.session.vipPrice).toBeNull();
  });

  it('returns the hall layout without the seat list inside it', async () => {
    const result = await service.getSeatMap('session-1');

    expect(result.hall).toEqual({ id: 'hall-1', name: 'Hall 1', rows: 2, seatsPerRow: 2 });
  });
});