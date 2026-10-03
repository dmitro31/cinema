// src/modules/payments/payments.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { toCents, toMoney } from '../../common/utils/money';
import { PrismaService } from '../../core/database/prisma.service';
import { BookingService } from '../booking/booking.service';
import { LiqPayService } from './liqpay.service';
import type { LiqPayCallbackPayload } from './liqpay.types';

type PaymentRecord = {
  id: string;
  orderId: string;
  status: string;
  amount: unknown;
  currency: string;
};

const SETTLED_STATUSES = ['SUCCEEDED', 'REFUNDED', 'REFUND_FAILED'];

const providerIdOf = (payload: LiqPayCallbackPayload) =>
  payload.payment_id === undefined ? null : String(payload.payment_id);

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private booking: BookingService,
    private liqpay: LiqPayService,
  ) {}

  async createCheckout(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true, total: true, expiresAt: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING') {
      throw new ConflictException(`Order is ${order.status.toLowerCase()}`);
    }
    if (order.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException('Order has expired');
    }

    const amount = toMoney(order.total);
    const payment = await this.prisma.payment.create({
      data: { orderId: order.id, amount, currency: this.liqpay.currency },
      select: { id: true },
    });

    const checkout = this.liqpay.buildCheckout({
      paymentId: payment.id,
      orderId: order.id,
      amount,
      description: `Cinema order ${order.id}`,
    });

    return { paymentId: payment.id, amount, currency: this.liqpay.currency, ...checkout };
  }

  async getPayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, order: { userId } },
      select: {
        id: true,
        orderId: true,
        status: true,
        amount: true,
        currency: true,
        failureReason: true,
        createdAt: true,
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return { ...payment, amount: toMoney(payment.amount) };
  }

  async handleCallback(data: string, signature: string) {
    if (!this.liqpay.verify(data, signature)) {
      throw new BadRequestException('Invalid signature');
    }

    let payload: LiqPayCallbackPayload;
    try {
      payload = this.liqpay.decode<LiqPayCallbackPayload>(data);
    } catch {
      throw new BadRequestException('Invalid callback data');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: String(payload.order_id) },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payload.status === 'reversed') {
      await this.markReversed(payment);
      return { received: true };
    }

    if (SETTLED_STATUSES.includes(payment.status)) return { received: true };

    switch (this.classify(payload.status)) {
      case 'SUCCESS':
        await this.settleSuccess(payment, payload);
        break;
      case 'FAILED':
        await this.markFailed(payment, payload);
        break;
      default:
        await this.recordProviderStatus(payment, payload);
    }

    return { received: true };
  }

  private classify(status: string): 'SUCCESS' | 'FAILED' | 'PENDING' {
    if (status === 'success') return 'SUCCESS';
    if (status === 'sandbox') return this.liqpay.sandbox ? 'SUCCESS' : 'FAILED';
    if (status === 'failure' || status === 'error') return 'FAILED';
    return 'PENDING';
  }

  private async settleSuccess(payment: PaymentRecord, payload: LiqPayCallbackPayload) {
    const amountMatches = toCents(payload.amount) === toCents(payment.amount);
    const currencyMatches = payload.currency === payment.currency;
    if (!amountMatches || !currencyMatches) {
      await this.refundPayment(payment, payload, 'Amount or currency mismatch');
      return;
    }

    try {
      await this.booking.confirmPayment(payment.orderId);
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        await this.refundPayment(payment, payload, error.message);
        return;
      }
      throw error;
    }

    const claimed = await this.prisma.order.updateMany({
      where: { id: payment.orderId, paidByPaymentId: null },
      data: { paidByPaymentId: payment.id },
    });
    if (claimed.count === 0) {
      const current = await this.prisma.order.findUnique({
        where: { id: payment.orderId },
        select: { paidByPaymentId: true },
      });
      if (current?.paidByPaymentId !== payment.id) {
        await this.refundPayment(payment, payload, 'Order is already paid by another payment');
        return;
      }
    }

    await this.prisma.payment.updateMany({
      where: { id: payment.id, status: { in: ['PENDING', 'FAILED'] } },
      data: {
        status: 'SUCCEEDED',
        providerPaymentId: providerIdOf(payload),
        providerStatus: payload.status,
        failureReason: null,
      },
    });
  }

  private async refundPayment(
    payment: PaymentRecord,
    payload: LiqPayCallbackPayload,
    reason: string,
  ) {
    const refunded = await this.liqpay.refund(payment.id, toMoney(payment.amount));

    await this.prisma.payment.updateMany({
      where: { id: payment.id, status: { in: ['PENDING', 'FAILED'] } },
      data: {
        status: refunded ? 'REFUNDED' : 'REFUND_FAILED',
        providerPaymentId: providerIdOf(payload),
        providerStatus: payload.status,
        failureReason: reason,
      },
    });

    if (!refunded) {
      this.logger.error(`Refund failed for payment ${payment.id}: ${reason}`);
    }
  }

  private async markFailed(payment: PaymentRecord, payload: LiqPayCallbackPayload) {
    await this.prisma.payment.updateMany({
      where: { id: payment.id, status: 'PENDING' },
      data: {
        status: 'FAILED',
        providerStatus: payload.status,
        failureReason: payload.err_description ?? payload.err_code ?? payload.status,
      },
    });
  }

  private async recordProviderStatus(payment: PaymentRecord, payload: LiqPayCallbackPayload) {
    await this.prisma.payment.updateMany({
      where: { id: payment.id },
      data: { providerStatus: payload.status },
    });
  }

  private async markReversed(payment: PaymentRecord) {
    const result = await this.prisma.payment.updateMany({
      where: { id: payment.id, status: { not: 'REFUNDED' } },
      data: { status: 'REFUNDED', providerStatus: 'reversed' },
    });

    if (result.count > 0 && payment.status === 'SUCCEEDED') {
      this.logger.warn(`Payment ${payment.id} was reversed outside of the refund flow`);
    }
  }
}