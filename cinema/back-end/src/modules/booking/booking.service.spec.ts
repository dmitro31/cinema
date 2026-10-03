// src/modules/booking/booking.service.spec.ts
import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HOLD_TTL_SEC, MAX_PENDING_ORDERS_PER_USER } from './booking.constants';
import { BookingService } from './booking.service';

const HOUR = 3_600_000;

const sessionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  hallId: 'hall-1',
  startAt: new Date(Date.now() + 2 * HOUR),
  price: '100.00',
  vipPrice: '180.00',
  ...overrides,
});

const seatRecords = [
  { id: 'seat-1', row: 1, number: 1, type: 'STANDARD' },
  { id: 'seat-2', row: 8, number: 1, type: 'VIP' },
];

const orderRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  userId: 'user-1',
  sessionId: 'session-1',
  status: 'PENDING',
  total: '280.00',
  expiresAt: new Date(Date.now() + 600_000),
  createdAt: new Date(),
  session: { id: 'session-1' },
  items: [
    { seatId: 'seat-1', price: '100.00', seat: { row: 1, number: 1, type: 'STANDARD' } },
    { seatId: 'seat-2', price: '180.00', seat: { row: 8, number: 1, type: 'VIP' } },
  ],
  tickets: [],
  ...overrides,
});

const createPrismaMock = () => {
  const prisma = {
    session: { findUnique: vi.fn() },
    seat: { findMany: vi.fn() },
    order: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    ticket: { findMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  prisma.$transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === 'function'
      ? (arg as (client: typeof prisma) => unknown)(prisma)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return prisma;
};

describe('BookingService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let redis: {
    holdSeats: ReturnType<typeof vi.fn>;
    releaseSeats: ReturnType<typeof vi.fn>;
  };
  let service: BookingService;

  const dto = { sessionId: 'session-1', seatIds: ['seat-1', 'seat-2'] };

  beforeEach(() => {
    prisma = createPrismaMock();
    redis = {
      holdSeats: vi.fn().mockResolvedValue(true),
      releaseSeats: vi.fn().mockResolvedValue(undefined),
    };
    prisma.session.findUnique.mockResolvedValue(sessionRecord());
    prisma.seat.findMany.mockResolvedValue(seatRecords);
    prisma.order.count.mockResolvedValue(0);
    prisma.ticket.findMany.mockResolvedValue([]);
    prisma.order.create.mockImplementation(async ({ data }: { data: { id: string } }) =>
      orderRecord({ id: data.id }),
    );
    service = new BookingService(prisma as never, redis as never);
  });

  describe('hold', () => {
    it('holds the seats in Redis and creates a pending order with the correct total', async () => {
      const result = await service.hold('user-1', dto);

      const [sessionId, seatIds, ownerId, ttl] = redis.holdSeats.mock.calls[0];
      expect(sessionId).toBe('session-1');
      expect(seatIds).toEqual(dto.seatIds);
      expect(ttl).toBe(HOLD_TTL_SEC);

      const data = prisma.order.create.mock.calls[0][0].data;
      expect(data.id).toBe(ownerId);
      expect(data.userId).toBe('user-1');
      expect(data.sessionId).toBe('session-1');
      expect(data.total).toBe(280);
      expect(data.items.create).toEqual(
        expect.arrayContaining([
          { seatId: 'seat-1', price: 100 },
          { seatId: 'seat-2', price: 180 },
        ]),
      );
      expect(data.expiresAt.getTime()).toBeGreaterThan(Date.now() + (HOLD_TTL_SEC - 5) * 1000);

      expect(result.total).toBe(280);
      expect(result.seats).toHaveLength(2);
    });

    it('charges the regular price for VIP seats when vipPrice is not set', async () => {
      prisma.session.findUnique.mockResolvedValue(sessionRecord({ vipPrice: null }));

      await service.hold('user-1', dto);

      const data = prisma.order.create.mock.calls[0][0].data;
      expect(data.total).toBe(200);
    });

    it('throws when the session does not exist', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.hold('user-1', dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(redis.holdSeats).not.toHaveBeenCalled();
    });

    it('rejects a session that has already started', async () => {
      prisma.session.findUnique.mockResolvedValue(
        sessionRecord({ startAt: new Date(Date.now() - HOUR) }),
      );

      await expect(service.hold('user-1', dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(redis.holdSeats).not.toHaveBeenCalled();
    });

    it('rejects seats that do not belong to the hall of the session', async () => {
      prisma.seat.findMany.mockResolvedValue([seatRecords[0]]);

      await expect(service.hold('user-1', dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(redis.holdSeats).not.toHaveBeenCalled();
    });

    it('answers 429 when the user has too many pending orders', async () => {
      prisma.order.count.mockResolvedValue(MAX_PENDING_ORDERS_PER_USER);

      const error = await service.hold('user-1', dto).catch((caught) => caught);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect(redis.holdSeats).not.toHaveBeenCalled();
    });

    it('rejects seats that are already sold', async () => {
      prisma.ticket.findMany.mockResolvedValue([{ seatId: 'seat-1' }]);

      await expect(service.hold('user-1', dto)).rejects.toBeInstanceOf(ConflictException);
      expect(redis.holdSeats).not.toHaveBeenCalled();
    });

    it('rejects when another customer holds a seat', async () => {
      redis.holdSeats.mockResolvedValue(false);

      await expect(service.hold('user-1', dto)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it('releases the holds when the order cannot be saved', async () => {
      prisma.order.create.mockRejectedValue(new Error('db down'));

      await expect(service.hold('user-1', dto)).rejects.toThrow('db down');

      const ownerId = redis.holdSeats.mock.calls[0][2];
      expect(redis.releaseSeats).toHaveBeenCalledWith('session-1', dto.seatIds, ownerId);
    });
  });

  describe('getOrder', () => {
    it('returns only the order of the given user', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRecord());

      const result = await service.getOrder('user-1', 'order-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'order-1', userId: 'user-1' } }),
      );
      expect(result.id).toBe('order-1');
      expect(result.total).toBe(280);
    });

    it('throws when the order belongs to someone else', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.getOrder('user-2', 'order-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('listMine', () => {
    it('filters by user and status and paginates', async () => {
      prisma.order.findMany.mockResolvedValue([orderRecord()]);
      prisma.order.count.mockResolvedValue(1);

      const result = await service.listMine('user-1', { page: 2, limit: 5, status: 'PAID' });

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', status: 'PAID' },
          skip: 5,
          take: 5,
        }),
      );
      expect(result).toMatchObject({ total: 1, page: 2, limit: 5 });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('cancel', () => {
    const cancellable = () => ({ ...orderRecord(), items: [{ seatId: 'seat-1' }, { seatId: 'seat-2' }] });

    it('throws when the order belongs to someone else', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.cancel('user-2', 'order-1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('rejects cancelling an order that is not pending', async () => {
      prisma.order.findFirst.mockResolvedValue(cancellable());
      prisma.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.cancel('user-1', 'order-1')).rejects.toBeInstanceOf(ConflictException);
      expect(redis.releaseSeats).not.toHaveBeenCalled();
    });

    it('cancels the order and releases the seats', async () => {
      prisma.order.findFirst.mockResolvedValue(cancellable());
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      await service.cancel('user-1', 'order-1');

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
      expect(redis.releaseSeats).toHaveBeenCalledWith(
        'session-1',
        ['seat-1', 'seat-2'],
        'order-1',
      );
    });
  });

  describe('confirmPayment', () => {
    it('throws when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.confirmPayment('order-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('is idempotent for an already paid order', async () => {
      prisma.order.findUnique.mockResolvedValue(orderRecord({ status: 'PAID' }));

      const result = await service.confirmPayment('order-1');

      expect(result.status).toBe('PAID');
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.ticket.createMany).not.toHaveBeenCalled();
    });

    it('rejects a cancelled order', async () => {
      prisma.order.findUnique.mockResolvedValue(orderRecord({ status: 'CANCELLED' }));

      await expect(service.confirmPayment('order-1')).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.ticket.createMany).not.toHaveBeenCalled();
    });

    it('marks an overdue pending order as expired and rejects it', async () => {
      prisma.order.findUnique.mockResolvedValue(
        orderRecord({ expiresAt: new Date(Date.now() - 1_000) }),
      );
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.confirmPayment('order-1')).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });
      expect(prisma.ticket.createMany).not.toHaveBeenCalled();
    });

    it('marks the order paid, issues one ticket per seat and releases the holds', async () => {
      prisma.order.findUnique
        .mockResolvedValueOnce(orderRecord())
        .mockResolvedValueOnce(orderRecord({ status: 'PAID' }));
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.ticket.createMany.mockResolvedValue({ count: 2 });

      const result = await service.confirmPayment('order-1');

      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: 'PENDING' },
        data: { status: 'PAID' },
      });
      const tickets: { seatId: string; qrCode: string; sessionId: string; orderId: string }[] =
        prisma.ticket.createMany.mock.calls[0][0].data;
      expect(tickets).toHaveLength(2);
      expect(tickets.map((ticket) => ticket.seatId).sort()).toEqual(['seat-1', 'seat-2']);
      expect(tickets.every((ticket) => ticket.sessionId === 'session-1')).toBe(true);
      expect(tickets.every((ticket) => ticket.orderId === 'order-1')).toBe(true);
      expect(new Set(tickets.map((ticket) => ticket.qrCode)).size).toBe(2);
      expect(tickets.every((ticket) => ticket.qrCode.length >= 20)).toBe(true);
      expect(redis.releaseSeats).toHaveBeenCalledWith(
        'session-1',
        ['seat-1', 'seat-2'],
        'order-1',
      );
      expect(result.status).toBe('PAID');
    });

    it('maps a unique violation on tickets to 409', async () => {
      prisma.order.findUnique.mockResolvedValue(orderRecord());
      prisma.order.updateMany.mockResolvedValue({ count: 1 });
      prisma.ticket.createMany.mockRejectedValue({ code: 'P2002' });

      await expect(service.confirmPayment('order-1')).rejects.toBeInstanceOf(ConflictException);
      expect(redis.releaseSeats).not.toHaveBeenCalled();
    });

    it('does not issue tickets when the order is no longer pending', async () => {
      prisma.order.findUnique.mockResolvedValue(orderRecord());
      prisma.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.confirmPayment('order-1')).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.ticket.createMany).not.toHaveBeenCalled();
    });
  });

  describe('expirePendingOrders', () => {
    it('marks overdue pending orders as expired and returns the count', async () => {
      prisma.order.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.expirePendingOrders();

      expect(count).toBe(3);
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { status: 'PENDING', expiresAt: { lt: expect.any(Date) } },
        data: { status: 'EXPIRED' },
      });
    });
  });
});