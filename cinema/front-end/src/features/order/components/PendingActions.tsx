'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { formatMoney } from '@/features/admin/lib/format';
import { getErrorMessage } from '@/lib/get-error-message';

import { useCountdown } from '../hooks/use-countdown';
import { orderKey, useCancelOrder, useCheckout, useDevPay } from '../hooks/use-order';
import { submitLiqPayForm } from '../lib/liqpay';
import { formatCountdown } from '../lib/order';
import type { Order } from '../types';

const showDevPay = process.env.NODE_ENV !== 'production';

const panel = 'border border-[#242424] bg-[#101010] p-6 lg:sticky lg:top-24';
const label = 'text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]';

export function PendingActions({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const remaining = useCountdown(order.expiresAt);
  const expired = remaining <= 0;

  const checkout = useCheckout();
  const cancel = useCancelOrder(order.id, order.session.id);
  const devPay = useDevPay(order.id);

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expired) void queryClient.invalidateQueries({ queryKey: orderKey(order.id) });
  }, [expired, queryClient, order.id]);

  const busy = checkout.isPending || cancel.isPending || devPay.isPending;

  const pay = () => {
    setError(null);
    checkout.mutate(order.id, {
      onSuccess: (data) => submitLiqPayForm(data),
      onError: (err) => setError(getErrorMessage(err, 'Не вдалося почати оплату.')),
    });
  };

  const payDev = () => {
    setError(null);
    devPay.mutate(undefined, {
      onError: (err) => setError(getErrorMessage(err, 'Не вдалося підтвердити оплату.')),
    });
  };

  const cancelOrder = () => {
    setError(null);
    cancel.mutate(undefined, {
      onError: (err) => {
        setConfirming(false);
        setError(getErrorMessage(err, 'Не вдалося скасувати замовлення.'));
      },
    });
  };

  if (expired) {
    return (
      <aside aria-label="Оплата" className={panel}>
        <p className={label}>Статус</p>
        <p className="mt-2 text-xl font-bold uppercase tracking-[0.12em]">Час вийшов</p>
        <p className="mt-4 text-sm text-[#A8A8A8]">Час на оплату вичерпано, місця звільнено.</p>
        <Link
          href={`/sessions/${order.session.id}`}
          className="mt-6 block bg-[#D9AE4E] px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.22em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-4 focus-visible:ring-[#D9AE4E]/40"
        >
          Обрати місця знову
        </Link>
      </aside>
    );
  }

  return (
    <aside aria-label="Оплата" className={panel}>
      <p className={label}>Час на оплату</p>
      <p
        role="timer"
        className={`mt-2 text-4xl font-bold tabular-nums ${remaining < 60_000 ? 'text-red-400' : 'text-[#D9AE4E]'}`}
      >
        {formatCountdown(remaining)}
      </p>
      <p className="mt-3 text-sm text-[#A8A8A8]">Після закінчення таймера місця звільняться.</p>

      <div className="mt-6 flex items-baseline justify-between border-t border-[#242424] pt-6">
        <span className={label}>До сплати</span>
        <span className="text-2xl font-bold tabular-nums">{formatMoney(order.total)}</span>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="mt-6 w-full bg-[#D9AE4E] px-8 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-4 focus-visible:ring-[#D9AE4E]/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#D9AE4E]"
      >
        {checkout.isPending ? 'Переходимо до оплати…' : 'Оплатити'}
      </button>

      {showDevPay && (
        <button
          type="button"
          onClick={payDev}
          disabled={busy}
          className="mt-3 w-full border border-dashed border-[#6A6A6A] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#A8A8A8] outline-none transition hover:border-[#D9AE4E] hover:text-[#D9AE4E] focus-visible:ring-2 focus-visible:ring-[#D9AE4E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {devPay.isPending ? 'Підтверджуємо…' : 'Dev: підтвердити оплату'}
        </button>
      )}

      {confirming ? (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={cancelOrder}
            disabled={busy}
            className="flex-1 border border-red-400 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-red-400 outline-none transition hover:bg-red-400/10 focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cancel.isPending ? 'Скасовуємо…' : 'Так, скасувати'}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy}
            className="flex-1 border border-[#2E2E2E] px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#A8A8A8] outline-none transition hover:border-[#6A6A6A] hover:text-white focus-visible:ring-2 focus-visible:ring-[#D9AE4E] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ні
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy}
          className="mt-4 w-full py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8C8C8C] outline-none transition hover:text-white focus-visible:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Скасувати замовлення
        </button>
      )}
    </aside>
  );
}