// src/modules/payments/payments.service.spec.ts
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentsService } from './payments.service';

const paymentRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'payment-1',
  orderId: 'order-1',
  status: 'PENDING',
  amount: '400.00',
  currency: 'UAH',
  ...overrides,
});

const payloadOf = (overrides: Record<string, unknown> = {}) => ({
  order_id: 'payment-1',
  status: 'success',
  amount: 400,
  currency: 'UAH',
  payment_id: 777,
  ...overrides,
});

const createPrismaMock = () => ({
  order: { findFirst: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
  payment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
});

const createLiqPayMock = () => ({
  currency: 'UAH',
  sandbox: true,
  verify: vi.fn().mockReturnValue(true),
  decode: vi.fn(),
  buildCheckout: vi.fn().mockReturnValue({
    checkoutUrl: 'https://www.liqpay.ua/api/3/checkout',
    data: 'encoded-data',
    signature: 'encoded-signature',
  }),
  refund: vi.fn().mockResolvedValue(true),
});

describe('PaymentsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let liqpay: ReturnType<typeof createLiqPayMock>;
  let booking: { confirmPayment: ReturnType<typeof vi.fn> };
  let service: PaymentsService;

  const receive = (payload: Record<string, unknown>) => {
    liqpay.decode.mockReturnValue(payload);
    return service.handleCallback('data', 'signature');
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    liqpay = createLiqPayMock();
    booking = { confirmPayment: vi.fn().mockResolvedValue({}) };
    prisma.payment.findUnique.mockResolvedValue(paymentRecord());
    prisma.order.updateMany.mockResolvedValue({ count: 1 });
    service = new PaymentsService(prisma as never, booking as never, liqpay as never);
  });

  describe('createCheckout', () => {
    const orderRecord = (overrides: Record<string, unknown> = {}) => ({
      id: 'order-1',
      status: 'PENDING',
      total: '400.00',
      expiresAt: new Date(Date.now() + 600_000),
      ...overrides,
    });

    it('throws when the order belongs to someone else', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.createCheckout('user-1', 'order-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('rejects an order that is not pending', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRecord({ status: 'PAID' }));

      await expect(service.createCheckout('user-1', 'order-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('rejects an expired order', async () => {
      prisma.order.findFirst.mockResolvedValue(
        orderRecord({ expiresAt: new Date(Date.now() - 1_000) }),
      );

      await expect(service.createCheckout('user-1', 'order-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('creates a payment for the order total and returns the checkout data', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRecord());
      prisma.payment.create.mockResolvedValue({ id: 'payment-1' });

      const result = await service.createCheckout('user-1', 'order-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'order-1', userId: 'user-1' } }),
      );
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { orderId: 'order-1', amount: 400, currency: 'UAH' },
        }),
      );
      expect(liqpay.buildCheckout).toHaveBeenCalledWith({
        paymentId: 'payment-1',
        orderId: 'order-1',
        amount: 400,
        description: expect.stringContaining('order-1'),
      });
      expect(result).toEqual({
        paymentId: 'payment-1',
        amount: 400,
        currency: 'UAH',
        checkoutUrl: 'https://www.liqpay.ua/api/3/checkout',
        data: 'encoded-data',
        signature: 'encoded-signature',
      });
    });
  });

  describe('getPayment', () => {
    it('returns the payment of the user with a numeric amount', async () => {
      prisma.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        status: 'SUCCEEDED',
        amount: '400.00',
        currency: 'UAH',
        failureReason: null,
        createdAt: new Date(),
      });

      const result = await service.getPayment('user-1', 'payment-1');

      expect(prisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'payment-1', order: { userId: 'user-1' } } }),
      );
      expect(result.amount).toBe(400);
      expect(result.status).toBe('SUCCEEDED');
    });

    it('throws when the payment belongs to someone else', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(service.getPayment('user-2', 'payment-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('handleCallback', () => {
    it('rejects an invalid signature before touching anything', async () => {
      liqpay.verify.mockReturnValue(false);

      await expect(service.handleCallback('data', 'bad')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(liqpay.decode).not.toHaveBeenCalled();
      expect(prisma.payment.findUnique).not.toHaveBeenCalled();
    });

    it('rejects data that cannot be decoded', async () => {
      liqpay.decode.mockImplementation(() => {
        throw new Error('bad json');
      });

      await expect(service.handleCallback('data', 'signature')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('throws for an unknown payment', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(receive(payloadOf())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('confirms the order, claims it and marks the payment as succeeded', async () => {
      const result = await receive(payloadOf());

      expect(result).toEqual({ received: true });
      expect(booking.confirmPayment).toHaveBeenCalledWith('order-1');
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', paidByPaymentId: null },
        data: { paidByPaymentId: 'payment-1' },
      });
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { in: ['PENDING', 'FAILED'] } },
        data: {
          status: 'SUCCEEDED',
          providerPaymentId: '777',
          providerStatus: 'success',
          failureReason: null,
        },
      });
      expect(liqpay.refund).not.toHaveBeenCalled();
    });

    it('ignores a callback for a payment that is already succeeded', async () => {
      prisma.payment.findUnique.mockResolvedValue(paymentRecord({ status: 'SUCCEEDED' }));

      const result = await receive(payloadOf());

      expect(result).toEqual({ received: true });
      expect(booking.confirmPayment).not.toHaveBeenCalled();
      expect(liqpay.refund).not.toHaveBeenCalled();
      expect(prisma.payment.updateMany).not.toHaveBeenCalled();
    });

    it('marks the payment as failed on a failure status', async () => {
      await receive(payloadOf({ status: 'failure', err_description: 'Card declined' }));

      expect(booking.confirmPayment).not.toHaveBeenCalled();
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: 'PENDING' },
        data: { status: 'FAILED', providerStatus: 'failure', failureReason: 'Card declined' },
      });
    });

    it('only records intermediate statuses', async () => {
      await receive(payloadOf({ status: 'processing' }));

      expect(booking.confirmPayment).not.toHaveBeenCalled();
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: { providerStatus: 'processing' },
      });
    });

    it('accepts the sandbox status when sandbox mode is enabled', async () => {
      liqpay.sandbox = true;

      await receive(payloadOf({ status: 'sandbox' }));

      expect(booking.confirmPayment).toHaveBeenCalledWith('order-1');
    });

    it('rejects the sandbox status when sandbox mode is disabled', async () => {
      liqpay.sandbox = false;

      await receive(payloadOf({ status: 'sandbox' }));

      expect(booking.confirmPayment).not.toHaveBeenCalled();
      expect(prisma.payment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
      );
    });

    it('refunds when the paid amount differs from the expected one', async () => {
      await receive(payloadOf({ amount: 100 }));

      expect(booking.confirmPayment).not.toHaveBeenCalled();
      expect(liqpay.refund).toHaveBeenCalledWith('payment-1', 400);
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { in: ['PENDING', 'FAILED'] } },
        data: expect.objectContaining({
          status: 'REFUNDED',
          failureReason: 'Amount or currency mismatch',
        }),
      });
    });

    it('refunds when the currency differs', async () => {
      await receive(payloadOf({ currency: 'USD' }));

      expect(booking.confirmPayment).not.toHaveBeenCalled();
      expect(liqpay.refund).toHaveBeenCalledWith('payment-1', 400);
    });

    it('refunds when the order can no longer be confirmed', async () => {
      booking.confirmPayment.mockRejectedValue(new ConflictException('Order has expired'));

      await receive(payloadOf());

      expect(liqpay.refund).toHaveBeenCalledWith('payment-1', 400);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { in: ['PENDING', 'FAILED'] } },
        data: expect.objectContaining({ status: 'REFUNDED', failureReason: 'Order has expired' }),
      });
    });

    it('refunds when the order does not exist', async () => {
      booking.confirmPayment.mockRejectedValue(new NotFoundException('Order not found'));

      await receive(payloadOf());

      expect(liqpay.refund).toHaveBeenCalled();
    });

    it('flags the payment for manual handling when the refund fails', async () => {
      booking.confirmPayment.mockRejectedValue(new ConflictException('Order has expired'));
      liqpay.refund.mockResolvedValue(false);

      await receive(payloadOf());

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { in: ['PENDING', 'FAILED'] } },
        data: expect.objectContaining({
          status: 'REFUND_FAILED',
          failureReason: 'Order has expired',
        }),
      });
    });

    it('rethrows unexpected errors without refunding', async () => {
      booking.confirmPayment.mockRejectedValue(new Error('db down'));

      await expect(receive(payloadOf())).rejects.toThrow('db down');
      expect(liqpay.refund).not.toHaveBeenCalled();
    });

    it('refunds a duplicate payment for an order that another payment already paid', async () => {
      prisma.order.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.findUnique.mockResolvedValue({ paidByPaymentId: 'payment-0' });

      await receive(payloadOf());

      expect(liqpay.refund).toHaveBeenCalledWith('payment-1', 400);
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { in: ['PENDING', 'FAILED'] } },
        data: expect.objectContaining({
          status: 'REFUNDED',
          failureReason: expect.stringContaining('already paid'),
        }),
      });
    });

    it('completes a retried callback of the payment that already paid the order', async () => {
      prisma.order.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.findUnique.mockResolvedValue({ paidByPaymentId: 'payment-1' });

      await receive(payloadOf());

      expect(liqpay.refund).not.toHaveBeenCalled();
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { in: ['PENDING', 'FAILED'] } },
        data: expect.objectContaining({ status: 'SUCCEEDED' }),
      });
    });

    it('still processes a success that arrives for a payment marked as failed', async () => {
      prisma.payment.findUnique.mockResolvedValue(paymentRecord({ status: 'FAILED' }));

      await receive(payloadOf());

      expect(booking.confirmPayment).toHaveBeenCalledWith('order-1');
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { in: ['PENDING', 'FAILED'] } },
        data: expect.objectContaining({ status: 'SUCCEEDED' }),
      });
    });

    it('marks a reversed payment as refunded', async () => {
      prisma.payment.findUnique.mockResolvedValue(paymentRecord({ status: 'SUCCEEDED' }));

      await receive(payloadOf({ status: 'reversed' }));

      expect(booking.confirmPayment).not.toHaveBeenCalled();
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { not: 'REFUNDED' } },
        data: { status: 'REFUNDED', providerStatus: 'reversed' },
      });
    });

    it('updates a payment that failed to refund once LiqPay reports the reversal', async () => {
      prisma.payment.findUnique.mockResolvedValue(paymentRecord({ status: 'REFUND_FAILED' }));

      await receive(payloadOf({ status: 'reversed' }));

      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'payment-1', status: { not: 'REFUNDED' } },
        data: { status: 'REFUNDED', providerStatus: 'reversed' },
      });
    });
  });
});