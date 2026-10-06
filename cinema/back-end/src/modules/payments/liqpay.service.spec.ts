import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiqPayService } from './liqpay.service';
import { LIQPAY_API_URL } from './payments.constants';

const baseValues: Record<string, unknown> = {
  LIQPAY_PUBLIC_KEY: 'public-key',
  LIQPAY_PRIVATE_KEY: 'private-key',
  API_PUBLIC_URL: 'https://api.example.com/',
  FRONT_URL: 'https://cinema.example.com',
  LIQPAY_CURRENCY: 'UAH',
  LIQPAY_SANDBOX: true,
};

const createService = (overrides: Record<string, unknown> = {}) => {
  const values = { ...baseValues, ...overrides };
  const config = {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      if (values[key] === undefined) throw new Error(`Missing ${key}`);
      return values[key];
    },
  };
  return new LiqPayService(config as never);
};

describe('LiqPayService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('signature', () => {
    it('signs as base64(sha1(private + data + private))', () => {
      const service = createService();
      const expected = createHash('sha1').update('private-keydatapayloadprivate-key').digest('base64');

      expect(service.sign('datapayload')).toBe(expected);
    });

    it('verifies a correct signature', () => {
      const service = createService();

      expect(service.verify('payload', service.sign('payload'))).toBe(true);
    });

    it('rejects a wrong signature', () => {
      const service = createService();
      const other = createHash('sha1').update('other').digest('base64');

      expect(service.verify('payload', other)).toBe(false);
    });

    it('rejects a signature of a different length without throwing', () => {
      const service = createService();

      expect(service.verify('payload', 'short')).toBe(false);
      expect(service.verify('payload', '')).toBe(false);
    });
  });

  describe('encode and decode', () => {
    it('round-trips a payload including non-ASCII text', () => {
      const service = createService();
      const payload = { status: 'success', description: 'Квиток', amount: 150.5 };

      expect(service.decode(service.encode(payload))).toEqual(payload);
    });
  });

  describe('buildCheckout', () => {
    const params = { paymentId: 'payment-1', orderId: 'order-1', amount: 400, description: 'Order' };

    it('builds a signed payload for the hosted checkout', () => {
      const service = createService();

      const result = service.buildCheckout(params);
      const payload = service.decode<Record<string, unknown>>(result.data);

      expect(payload).toMatchObject({
        version: 3,
        public_key: 'public-key',
        action: 'pay',
        amount: 400,
        currency: 'UAH',
        order_id: 'payment-1',
        language: 'uk',
        sandbox: 1,
      });
      expect(service.verify(result.data, result.signature)).toBe(true);
      expect(result.checkoutUrl).toBe('https://www.liqpay.ua/api/3/checkout');
    });

    it('points server_url to the callback and result_url to the front', () => {
      const service = createService();

      const payload = service.decode<Record<string, string>>(service.buildCheckout(params).data);

      expect(payload.server_url).toBe('https://api.example.com/api/v1/payments/liqpay/callback');
      expect(payload.result_url).toBe('https://cinema.example.com/payment/result?orderId=order-1');
    });

    it('omits the sandbox flag when sandbox is disabled', () => {
      const service = createService({ LIQPAY_SANDBOX: 'false' });

      const payload = service.decode<Record<string, unknown>>(service.buildCheckout(params).data);

      expect(service.sandbox).toBe(false);
      expect(payload.sandbox).toBeUndefined();
    });

    it('understands the sandbox flag given as a string', () => {
      expect(createService({ LIQPAY_SANDBOX: 'true' }).sandbox).toBe(true);
    });
  });

  describe('refund', () => {
    it('sends a signed refund request and returns true on ok', async () => {
      const service = createService();
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok', status: 'reversed' }) });

      const result = await service.refund('payment-1', 400);

      expect(result).toBe(true);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(LIQPAY_API_URL);
      expect(init.method).toBe('POST');
      const body = init.body as URLSearchParams;
      const payload = service.decode<Record<string, unknown>>(body.get('data') as string);
      expect(payload).toMatchObject({
        version: 3,
        public_key: 'public-key',
        action: 'refund',
        order_id: 'payment-1',
        amount: 400,
      });
      expect(service.verify(body.get('data') as string, body.get('signature') as string)).toBe(true);
    });

    it('returns false when LiqPay answers with an error', async () => {
      const service = createService();
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'error' }) });

      expect(await service.refund('payment-1', 400)).toBe(false);
    });

    it('returns false on a non-2xx response', async () => {
      const service = createService();
      fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

      expect(await service.refund('payment-1', 400)).toBe(false);
    });

    it('returns false when the network fails', async () => {
      const service = createService();
      fetchMock.mockRejectedValue(new Error('network down'));

      expect(await service.refund('payment-1', 400)).toBe(false);
    });

    it('succeeds without calling LiqPay in mock refund mode', async () => {
      const service = createService({ LIQPAY_REFUND_MODE: 'mock' });

      expect(service.mockRefunds).toBe(true);
      expect(await service.refund('payment-1', 400)).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('calls LiqPay in live refund mode', async () => {
      const service = createService({ LIQPAY_REFUND_MODE: 'live' });
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ result: 'ok' }) });

      expect(service.mockRefunds).toBe(false);
      await service.refund('payment-1', 400);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
