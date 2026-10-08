'use client';

import { useState } from 'react';

import { getErrorMessage } from '@/lib/get-error-message';

import { useRefundOrder } from './hooks/use-order';
import type { Order } from './types';

export function RefundButton({ order }: { order: Order }) {
  const refund = useRefundOrder(order.id, order.session.id);
  const [now] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const used = order.tickets.some((ticket) => ticket.usedAt);
  const started = new Date(order.session.startAt).getTime() <= now;

  if (used || started) {
    return (
      <p className="mt-6 border-t border-[#242424] pt-6 text-xs text-[#8C8C8C]">
        Повернення недоступне: {used ? 'квитки вже використано.' : 'сеанс уже розпочався.'}
      </p>
    );
  }

  const submit = () => {
    setError(null);
    refund.mutate(undefined, {
      onError: (err) => {
        setConfirming(false);
        setError(getErrorMessage(err, 'Не вдалося оформити повернення.'));
      },
    });
  };

  const working = refund.isPending || refund.isSuccess;

  return (
    <div className="mt-6 border-t border-[#242424] pt-6">
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {error}
        </p>
      )}

      {working ? (
        <p className="text-sm text-[#A8A8A8]">Оформлюємо повернення коштів…</p>
      ) : confirming ? (
        <div>
          <p className="text-sm text-[#A8A8A8]">
            Повернути кошти за всі квитки цього замовлення? Місця звільняться, дію не можна скасувати.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={submit}
              className="flex-1 border border-red-400 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-red-400 outline-none transition hover:bg-red-400/10 focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Так, повернути
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="flex-1 border border-[#2E2E2E] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#A8A8A8] outline-none transition hover:border-[#6A6A6A] hover:text-white focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
            >
              Ні
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="w-full border border-[#2E2E2E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#A8A8A8] outline-none transition hover:border-red-400 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-400"
        >
          Повернути квитки
        </button>
      )}
    </div>
  );
}