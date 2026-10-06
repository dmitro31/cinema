import {
  BadGatewayException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REFUND_CUTOFF_MIN } from './payments.constants';
import { RefundsService } from './refunds.service';

const HOUR = 3_600_000;

const orderRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  status: 'PAID',
  sessionId: 'session-1',
  paidByPaymentId: 'payment-1',
  session: { startAt: new Date(Date.now() + 5 * HOUR) },
  tickets: [
    { seatId: 'seat-1', usedAt: null },
    { seatId: 'seat-2', usedAt: null },
  ],
  ...overrides,
});

describe('RefundsService', () => {
  let tx: {
    ticket: { deleteMany: ReturnType<typeof vi.fn> };
    order: { update: ReturnType<typeof vi.fn> };
    payment: { updateMany: ReturnType<typeof vi.fn> };
  };
  let prisma: {
    order: {
      findFirst: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    payment: { findUnique: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let liqpay: { refund: ReturnType<typeof vi.fn> };
  let redis: { publishSeatsChanged: ReturnType<typeof vi.fn> };
  let service: RefundsService;

  beforeEach(() => {
    tx = {
      ticket: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
      order: { update: vi.fn().mockResolvedValue({}) },
      payment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    prisma = {
      order: {
        findFirst: vi.fn().mockResolvedValue(orderRecord()),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      payment: {
        findUnique: vi.fn().mockResolvedValue({ id: 'payment-1', amount: '400.00' }),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    liqpay = { refund: vi.fn().mockResolvedValue(true) };
    redis = { publishSeatsChanged: vi.fn().mockResolvedValue(undefined) };
    service = new RefundsService(prisma as never, liqpay as never, redis as never);
  });

  it('throws when the order belongs to someone else', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(service.refundOrder('user-1', 'order-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'order-1', userId: 'user-1' } }),
    );
  });

  it('rejects an order that is not paid', async () => {
    prisma.order.findFirst.mockResolvedValue(orderRecord({ status: 'PENDING' }));

    await expect(service.refundOrder('user-1', 'order-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('rejects when a ticket was already used', async () => {
    prisma.order.findFirst.mockResolvedValue(
      orderRecord({
        tickets: [
          { seatId: 'seat-1', usedAt: new Date() },
          { seatId: 'seat-2', usedAt: null },
        ],
      }),
    );

    await expect(service.refundOrder('user-1', 'order-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(liqpay.refund).not.toHaveBeenCalled();
  });

  it('rejects when the session starts sooner than the refund cutoff', async () => {
    const startAt = new Date(Date.now() + (REFUND_CUTOFF_MIN - 10) * 60_000);
    prisma.order.findFirst.mockResolvedValue(orderRecord({ session: { startAt } }));

    await expect(service.refundOrder('user-1', 'order-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.order.updateMany).not.toHaveBeenCalled();
  });

  it('allows a refund just before the cutoff', async () => {
    const startAt = new Date(Date.now() + (REFUND_CUTOFF_MIN + 10) * 60_000);
    prisma.order.findFirst.mockResolvedValue(orderRecord({ session: { startAt } }));

    const result = await service.refundOrder('user-1', 'order-1');

    expect(result.status).toBe('REFUNDED');
  });

  it('rejects when another request already claimed the order', async () => {
    prisma.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.refundOrder('user-1', 'order-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(liqpay.refund).not.toHaveBeenCalled();
  });

  it('puts the order back to paid when the provider refuses the refund', async () => {
    liqpay.refund.mockResolvedValue(false);

    await expect(service.refundOrder('user-1', 'order-1')).rejects.toBeInstanceOf(
      BadGatewayException,
    );

    expect(prisma.order.updateMany).toHaveBeenNthCalledWith(1, {
      where: { id: 'order-1', status: 'PAID' },
      data: { status: 'REFUNDING' },
    });
    expect(prisma.order.updateMany).toHaveBeenNthCalledWith(2, {
      where: { id: 'order-1', status: 'REFUNDING' },
      data: { status: 'PAID' },
    });
    expect(tx.ticket.deleteMany).not.toHaveBeenCalled();
    expect(redis.publishSeatsChanged).not.toHaveBeenCalled();
  });

  it('refunds through the provider, deletes tickets and marks everything refunded', async () => {
    const result = await service.refundOrder('user-1', 'order-1');

    expect(liqpay.refund).toHaveBeenCalledWith('payment-1', 400);
    expect(tx.ticket.deleteMany).toHaveBeenCalledWith({ where: { orderId: 'order-1' } });
    expect(tx.order.update).toHaveBeenCalledWith({
      where: { id: 'order-1' },
      data: { status: 'REFUNDED' },
    });
    expect(tx.payment.updateMany).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: { status: 'REFUNDED', providerStatus: 'reversed' },
    });
    expect(redis.publishSeatsChanged).toHaveBeenCalledWith('session-1', ['seat-1', 'seat-2']);
    expect(result).toEqual({ orderId: 'order-1', status: 'REFUNDED', refundedAmount: 400 });
  });

  it('refunds an order without a payment locally without calling the provider', async () => {
    prisma.order.findFirst.mockResolvedValue(orderRecord({ paidByPaymentId: null }));

    const result = await service.refundOrder('user-1', 'order-1');

    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    expect(liqpay.refund).not.toHaveBeenCalled();
    expect(tx.payment.updateMany).not.toHaveBeenCalled();
    expect(tx.ticket.deleteMany).toHaveBeenCalled();
    expect(result.refundedAmount).toBe(0);
  });

  it('rethrows the error when the local update fails after the provider refunded', async () => {
    prisma.$transaction.mockRejectedValue(new Error('db down'));

    await expect(service.refundOrder('user-1', 'order-1')).rejects.toThrow('db down');

    expect(liqpay.refund).toHaveBeenCalled();
    expect(redis.publishSeatsChanged).not.toHaveBeenCalled();
  });
});
