import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import { LIQPAY_API_URL, LIQPAY_CHECKOUT_URL, LIQPAY_VERSION } from './payments.constants';

@Injectable()
export class LiqPayService {
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly apiPublicUrl: string;
  private readonly frontUrl: string;
  readonly currency: string;
  readonly sandbox: boolean;
  readonly mockRefunds: boolean;

  constructor(config: ConfigService) {
    this.publicKey = config.getOrThrow<string>('LIQPAY_PUBLIC_KEY');
    this.privateKey = config.getOrThrow<string>('LIQPAY_PRIVATE_KEY');
    this.apiPublicUrl = config.getOrThrow<string>('API_PUBLIC_URL').replace(/\/+$/, '');
    this.frontUrl = config.getOrThrow<string>('FRONT_URL').replace(/\/+$/, '');
    this.currency = config.get<string>('LIQPAY_CURRENCY') ?? 'UAH';
    
    const sandboxRaw = config.get<string | boolean>('LIQPAY_SANDBOX');
    this.sandbox = sandboxRaw === true || sandboxRaw === 'true' || sandboxRaw === '1';
    this.mockRefunds = config.get<string>('LIQPAY_REFUND_MODE') === 'mock';
  }

  encode(payload: object): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  decode<T>(data: string): T {
    return JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as T;
  }

  sign(data: string): string {
    return createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');
  }

  verify(data: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(data));
    const received = Buffer.from(signature);
    return expected.length === received.length && timingSafeEqual(expected, received);
  }

  buildCheckout(params: {
    paymentId: string;
    orderId: string;
    amount: number;
    description: string;
  }) {
    const payload: Record<string, any> = {
      version: LIQPAY_VERSION,
      public_key: this.publicKey,
      action: 'pay',
      amount: params.amount,
      currency: this.currency,
      description: params.description,
      order_id: params.paymentId,
      language: 'uk',
      result_url: `${this.frontUrl}/payment/result?orderId=${params.orderId}`,
      server_url: `${this.apiPublicUrl}/api/v1/payments/liqpay/callback`,
    };

    if (this.sandbox) {
      payload.sandbox = 1;
    }

    const data = this.encode(payload);

    return { checkoutUrl: LIQPAY_CHECKOUT_URL, data, signature: this.sign(data) };
  }

  async refund(paymentId: string, amount: number): Promise<boolean> {
    if (this.mockRefunds) return true;

    const payload: Record<string, any> = {
      version: LIQPAY_VERSION,
      public_key: this.publicKey,
      action: 'refund',
      order_id: paymentId,
      amount,
    };

    if (this.sandbox) {
      payload.sandbox = 1;
    }

    const data = this.encode(payload);
    const signature = this.sign(data);

    try {
      const response = await fetch(LIQPAY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ data, signature }).toString(),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) return false;

      const result = (await response.json()) as { result?: string; status?: string };
      return result.result === 'ok' || result.status === 'reversed';
    } catch {
      return false;
    }
  }
}