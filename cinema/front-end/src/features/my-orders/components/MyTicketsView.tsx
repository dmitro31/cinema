'use client';

import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import { formatDate, formatTime } from '@/features/admin/lib/format';
import { TicketGrid } from '@/features/order/components/TicketGrid';
import type { Order } from '@/features/order/types';
import { StateMessage } from '@/features/site/components/StateMessage';
import { outlineButton } from '@/shared/button-classes';
import { getErrorMessage } from '@/lib/get-error-message';

import { useMyOrders } from '../hooks/use-my-orders';
import { Pagination } from './Pagination';

const PAGE_SIZE = 6;

const block = 'animate-pulse bg-white/5';

function TicketOrder({ order }: { order: Order }) {
  const [now] = useState(() => Date.now());
  const past = new Date(order.session.endAt).getTime() < now;

  return (
    <li className={`border border-[#242424] bg-[#0E0E0E] p-5 sm:p-8 ${past ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/movies/${order.session.movie.id}`}
            className="break-words text-xl font-bold uppercase tracking-[0.12em] outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]"
          >
            {order.session.movie.title}
          </Link>
          <p className="mt-2 text-sm text-[#A8A8A8]">
            {formatDate(order.session.startAt)} · {formatTime(order.session.startAt)} · {order.session.hall.name}
          </p>
          {past && (
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8C8C8C]">Сеанс минув</p>
          )}
        </div>

        <Link href={`/orders/${order.id}`} className={outlineButton}>
          Деталі замовлення
        </Link>
      </div>

      <div className="mt-6">
        <TicketGrid order={order} />
      </div>
    </li>
  );
}

export function MyTicketsView() {
  const [page, setPage] = useState(1);
  const query = useMyOrders({ page, limit: PAGE_SIZE, status: 'PAID' });

  if (query.isError && !query.data) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined;

    if (status === 401 || status === 403) {
      return (
        <StateMessage
          title="Потрібен вхід"
          text="Увійдіть в акаунт, щоб переглянути свої квитки."
          loginHref={`/login?next=${encodeURIComponent('/tickets')}`}
        />
      );
    }

    return (
      <StateMessage
        title="Не вдалося завантажити"
        text={getErrorMessage(query.error, 'Спробуйте ще раз трохи пізніше.')}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl">Мої квитки</h1>
        <Link href="/orders" className={outlineButton}>
          Усі замовлення
        </Link>
      </div>

      <div className="mt-10">
        {query.isPending ? (
          <div aria-hidden="true" className="space-y-6">
            <div className={`${block} h-64`} />
            <div className={`${block} h-64`} />
          </div>
        ) : query.data.items.length === 0 ? (
          <div className="border border-dashed border-[#2A2A2A] px-6 py-16 text-center">
            <p className="text-sm text-[#A8A8A8]">У вас поки немає оплачених квитків.</p>
            <Link href="/#schedule" className={`mt-6 inline-block ${outlineButton}`}>
              Переглянути афішу
            </Link>
          </div>
        ) : (
          <>
            <ul className={`space-y-6 transition-opacity ${query.isPlaceholderData ? 'opacity-60' : ''}`}>
              {query.data.items.map((order) => (
                <TicketOrder key={order.id} order={order} />
              ))}
            </ul>
            <Pagination page={page} total={query.data.total} limit={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}