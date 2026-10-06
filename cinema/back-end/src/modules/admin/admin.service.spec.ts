import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminService } from './admin.service';

const DAY_MS = 86_400_000;

const ticketRecord = (overrides: Record<string, unknown> = {}) => ({
  orderId: 'order-1',
  price: '150.00',
  createdAt: new Date('2026-10-01T10:00:00.000Z'),
  session: { movieId: 'movie-1', movie: { title: 'Dune' } },
  ...overrides,
});

const createPrismaMock = () => ({
  ticket: { findMany: vi.fn().mockResolvedValue([]), groupBy: vi.fn().mockResolvedValue([]) },
  session: { findMany: vi.fn().mockResolvedValue([]) },
  order: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
  payment: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) },
  $transaction: vi.fn(async (queries: Promise<unknown>[]) => Promise.all(queries)),
});

describe('AdminService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AdminService;

  const from = new Date('2026-10-01T00:00:00.000Z');
  const to = new Date('2026-10-08T00:00:00.000Z');

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AdminService(prisma as never);
  });

  describe('salesReport', () => {
    it('returns zeros and empty lists when nothing was sold', async () => {
      const report = await service.salesReport({ from, to });

      expect(report.totals).toEqual({ revenue: 0, tickets: 0, orders: 0 });
      expect(report.byDay).toEqual([]);
      expect(report.byMovie).toEqual([]);
    });

    it('queries tickets created inside the range', async () => {
      await service.salesReport({ from, to });

      expect(prisma.ticket.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { createdAt: { gte: from, lt: to } } }),
      );
    });

    it('sums revenue in cents and counts tickets and distinct orders', async () => {
      prisma.ticket.findMany.mockResolvedValue([
        ticketRecord({ price: '150.00' }),
        ticketRecord({ price: '250.00' }),
        ticketRecord({ orderId: 'order-2', price: '99.99' }),
      ]);

      const report = await service.salesReport({ from, to });

      expect(report.totals).toEqual({ revenue: 499.99, tickets: 3, orders: 2 });
    });

    it('groups sales by day in UTC by default', async () => {
      prisma.ticket.findMany.mockResolvedValue([
        ticketRecord({ createdAt: new Date('2026-10-01T22:30:00.000Z') }),
        ticketRecord({ createdAt: new Date('2026-10-01T09:00:00.000Z'), orderId: 'order-2' }),
        ticketRecord({ createdAt: new Date('2026-10-02T01:00:00.000Z'), orderId: 'order-3' }),
      ]);

      const report = await service.salesReport({ from, to });

      expect(report.range.timezone).toBe('UTC');
      expect(report.byDay).toEqual([
        { date: '2026-10-01', revenue: 300, tickets: 2, orders: 2 },
        { date: '2026-10-02', revenue: 150, tickets: 1, orders: 1 },
      ]);
    });

    it('groups sales by day in the requested timezone', async () => {
      prisma.ticket.findMany.mockResolvedValue([
        ticketRecord({ createdAt: new Date('2026-10-01T22:30:00.000Z') }),
      ]);

      const report = await service.salesReport({ from, to, timezone: 'Europe/Kyiv' });

      expect(report.byDay).toEqual([{ date: '2026-10-02', revenue: 150, tickets: 1, orders: 1 }]);
    });

    it('counts an order once per day even when it has several tickets', async () => {
      prisma.ticket.findMany.mockResolvedValue([
        ticketRecord({ orderId: 'order-1' }),
        ticketRecord({ orderId: 'order-1' }),
      ]);

      const report = await service.salesReport({ from, to });

      expect(report.byDay[0]).toMatchObject({ tickets: 2, orders: 1 });
    });

    it('ranks movies by revenue', async () => {
      prisma.ticket.findMany.mockResolvedValue([
        ticketRecord({ price: '100.00' }),
        ticketRecord({
          price: '300.00',
          session: { movieId: 'movie-2', movie: { title: 'Orbit' } },
        }),
        ticketRecord({ price: '100.00' }),
      ]);

      const report = await service.salesReport({ from, to });

      expect(report.byMovie).toEqual([
        { movieId: 'movie-2', title: 'Orbit', revenue: 300, tickets: 1 },
        { movieId: 'movie-1', title: 'Dune', revenue: 200, tickets: 2 },
      ]);
    });

    it('defaults to the last 30 days', async () => {
      await service.salesReport({});

      const where = prisma.ticket.findMany.mock.calls[0][0].where.createdAt;
      expect(where.lt.getTime() - where.gte.getTime()).toBe(30 * DAY_MS);
      expect(Math.abs(where.lt.getTime() - Date.now())).toBeLessThan(5_000);
    });

    it('rejects a range where from is not earlier than to', async () => {
      await expect(service.salesReport({ from: to, to: from })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.ticket.findMany).not.toHaveBeenCalled();
    });

    it('rejects a range longer than 366 days', async () => {
      const longFrom = new Date(to.getTime() - 400 * DAY_MS);

      await expect(service.salesReport({ from: longFrom, to })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an unknown timezone', async () => {
      await expect(
        service.salesReport({ from, to, timezone: 'Mars/Base' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.ticket.findMany).not.toHaveBeenCalled();
    });
  });

  describe('occupancyReport', () => {
    const sessionRecord = (id: string, hallId: string, hallName: string, rows: number, seats: number) => ({
      id,
      startAt: new Date('2026-10-02T10:00:00.000Z'),
      movie: { id: 'movie-1', title: 'Dune' },
      hall: { id: hallId, name: hallName, rows, seatsPerRow: seats },
    });

    it('does not count tickets when there are no sessions', async () => {
      const report = await service.occupancyReport({ from, to });

      expect(prisma.ticket.groupBy).not.toHaveBeenCalled();
      expect(report.sessions).toEqual([]);
      expect(report.byHall).toEqual([]);
    });

    it('computes occupancy per session', async () => {
      prisma.session.findMany.mockResolvedValue([sessionRecord('s1', 'h1', 'Hall 1', 8, 10)]);
      prisma.ticket.groupBy.mockResolvedValue([{ sessionId: 's1', _count: { _all: 2 } }]);

      const report = await service.occupancyReport({ from, to });

      expect(report.sessions[0]).toMatchObject({
        sessionId: 's1',
        seatsTotal: 80,
        ticketsSold: 2,
        occupancy: 0.025,
      });
    });

    it('treats sessions without tickets as empty', async () => {
      prisma.session.findMany.mockResolvedValue([sessionRecord('s1', 'h1', 'Hall 1', 8, 10)]);

      const report = await service.occupancyReport({ from, to });

      expect(report.sessions[0]).toMatchObject({ ticketsSold: 0, occupancy: 0 });
    });

    it('aggregates occupancy per hall', async () => {
      prisma.session.findMany.mockResolvedValue([
        sessionRecord('s1', 'h1', 'Hall 1', 8, 10),
        sessionRecord('s2', 'h1', 'Hall 1', 8, 10),
        sessionRecord('s3', 'h2', 'IMAX', 10, 14),
      ]);
      prisma.ticket.groupBy.mockResolvedValue([
        { sessionId: 's1', _count: { _all: 40 } },
        { sessionId: 's2', _count: { _all: 20 } },
        { sessionId: 's3', _count: { _all: 14 } },
      ]);

      const report = await service.occupancyReport({ from, to });

      expect(report.byHall).toEqual([
        { hallId: 'h1', name: 'Hall 1', sessions: 2, seatsTotal: 160, ticketsSold: 60, occupancy: 0.375 },
        { hallId: 'h2', name: 'IMAX', sessions: 1, seatsTotal: 140, ticketsSold: 14, occupancy: 0.1 },
      ]);
    });

    it('queries sessions that start inside the range', async () => {
      await service.occupancyReport({ from, to });

      expect(prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { startAt: { gte: from, lt: to } } }),
      );
    });

    it('rejects an invalid range', async () => {
      await expect(service.occupancyReport({ from: to, to: from })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('listOrders', () => {
    it('filters, paginates and converts totals to numbers', async () => {
      prisma.order.findMany.mockResolvedValue([{ id: 'order-1', total: '400.00' }]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.listOrders({
        page: 2,
        limit: 10,
        status: 'REFUNDING',
        sessionId: 'session-1',
      });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'REFUNDING', sessionId: 'session-1' },
          skip: 10,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toMatchObject({ total: 1, page: 2, limit: 10 });
      expect(result.items[0].total).toBe(400);
    });

    it('does not filter when no filters are given', async () => {
      await service.listOrders({ page: 1, limit: 20 });

      expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
  });

  describe('listPayments', () => {
    it('filters by status and converts amounts to numbers', async () => {
      prisma.payment.findMany.mockResolvedValue([{ id: 'payment-1', amount: '150.00' }]);
      prisma.payment.count.mockResolvedValue(1);

      const result = await service.listPayments({ page: 1, limit: 20, status: 'REFUND_FAILED' });

      expect(prisma.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'REFUND_FAILED' }, skip: 0, take: 20 }),
      );
      expect(result.items[0].amount).toBe(150);
      expect(result.total).toBe(1);
    });
  });
});
