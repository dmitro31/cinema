'use client';

import Link from 'next/link';
import { isAxiosError } from 'axios';

import { StateMessage } from '@/features/site/components/StateMessage';
import { filledButton, outlineButton } from '@/shared/button-classes'
import { getErrorMessage } from '@/lib/get-error-message';

import { useOrder } from '../hooks/use-order';
import { closedTexts, statusLabels } from '../lib/order';
import type { Order } from '../types';
import { OrderSummary } from './OrderSummary';
import { PendingActions } from './PendingActions';
import { RefundButton } from '../RefundButton';
import { Tickets } from './Tickets';

const block = 'animate-pulse bg-white/5';

function StatusPanel({ order }: { order: Order }) {
  const paid = order.status === 'PAID';

  return (
    <aside
      aria-label="Статус замовлення"
      className="border border-[#242424] bg-[#101010] p-6 lg:sticky lg:top-24"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">Статус</p>
      <p className={`mt-2 text-xl font-bold uppercase tracking-[0.12em] ${paid ? 'text-[#D9AE4E]' : ''}`}>
        {statusLabels[order.status]}
      </p>
      <p className="mt-4 text-sm text-[#A8A8A8]">
        {paid ? 'Оплату підтверджено. Ваші квитки нижче.' : closedTexts[order.status]}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {paid ? (
          <Link href="/#schedule" className={`text-center ${filledButton}`}>
            До афіші
          </Link>
        ) : (
          <Link href={`/sessions/${order.session.id}`} className={`text-center ${filledButton}`}>
            Обрати місця знову
          </Link>
        )}
        <Link href="/orders" className={`text-center ${outlineButton}`}>
          Мої замовлення
        </Link>
      </div>

      {paid && <RefundButton order={order} />}
    </aside>
  );
}

function OrderContent({ order }: { order: Order }) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-8">
      <nav aria-label="Навігація" className="mb-6 text-xs uppercase tracking-[0.2em] text-[#8C8C8C]">
        <Link href="/orders" className="outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]">
          Мої замовлення
        </Link>
        <span className="mx-3" aria-hidden="true">/</span>
        <span aria-current="page" className="text-[#D8D8D8]">{order.session.movie.title}</span>
      </nav>

      <h1 className="text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl">Замовлення</h1>
      <p className="mt-3 text-sm tabular-nums text-[#A8A8A8]">№ {order.id.slice(0, 8).toUpperCase()}</p>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_360px]">
        <OrderSummary order={order} />
        {order.status === 'PENDING' ? <PendingActions order={order} /> : <StatusPanel order={order} />}
      </div>

      {order.status === 'PAID' && <Tickets order={order} />}
    </div>
  );
}

export function OrderView({ id }: { id: string }) {
  const query = useOrder(id);

  if (query.isPending) {
    return (
      <div aria-hidden="true" className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-8">
        <div className={`${block} h-6 w-64`} />
        <div className={`${block} mt-6 h-12 w-1/3`} />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className={`${block} h-[26rem]`} />
          <div className={`${block} h-[20rem]`} />
        </div>
      </div>
    );
  }

  if (query.isError) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined;

    if (status === 401 || status === 403) {
      return (
        <StateMessage
          title="Потрібен вхід"
          text="Увійдіть в акаунт, щоб переглянути замовлення."
          loginHref={`/login?next=${encodeURIComponent(`/orders/${id}`)}`}
        />
      );
    }

    if (status === 404) {
      return <StateMessage title="Замовлення не знайдено" text="Перевірте посилання або відкрийте афішу." />;
    }

    return (
      <StateMessage
        title="Не вдалося завантажити"
        text={getErrorMessage(query.error, 'Спробуйте ще раз трохи пізніше.')}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return <OrderContent order={query.data} />;
}