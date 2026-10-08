'use client';

import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import type { OrderStatus } from '@/features/order/types';
import { StateMessage } from '@/features/site/components/StateMessage';
import { outlineButton } from '@/shared/button-classes';
import { getErrorMessage } from '@/lib/get-error-message';

import { useMyOrders } from '../hooks/use-my-orders';
import { OrderCard } from './OrderCard';
import { Pagination } from './Pagination';

const PAGE_SIZE = 8;

type Filter = 'ALL' | OrderStatus;

const filters: { value: Filter; label: string }[] = [
  { value: 'ALL', label: 'Усі' },
  { value: 'PENDING', label: 'Очікують' },
  { value: 'PAID', label: 'Оплачені' },
  { value: 'REFUNDED', label: 'Повернені' },
  { value: 'CANCELLED', label: 'Скасовані' },
  { value: 'EXPIRED', label: 'Прострочені' },
];

const block = 'animate-pulse bg-white/5';

export function MyOrdersView() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [page, setPage] = useState(1);

  const query = useMyOrders({
    page,
    limit: PAGE_SIZE,
    status: filter === 'ALL' ? undefined : filter,
  });

  if (query.isError && !query.data) {
    const status = isAxiosError(query.error) ? query.error.response?.status : undefined;

    if (status === 401 || status === 403) {
      return (
        <StateMessage
          title="Потрібен вхід"
          text="Увійдіть в акаунт, щоб переглянути свої замовлення."
          loginHref={`/login?next=${encodeURIComponent('/orders')}`}
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

  const changeFilter = (value: Filter) => {
    setFilter(value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl">Мої замовлення</h1>
        <Link href="/tickets" className={outlineButton}>
          Мої квитки
        </Link>
      </div>

      <div
        role="tablist"
        aria-label="Статус"
        className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={item.value === filter}
            onClick={() => changeFilter(item.value)}
            className={`h-11 shrink-0 border px-5 text-xs font-semibold uppercase tracking-[0.18em] outline-none transition focus-visible:ring-2 focus-visible:ring-[#D9AE4E] ${
              item.value === filter
                ? 'border-[#D9AE4E] bg-[#D9AE4E] text-[#14110A]'
                : 'border-[#2E2E2E] text-[#A8A8A8] hover:border-[#6A6A6A] hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {query.isPending ? (
          <div aria-hidden="true" className="space-y-4">
            <div className={`${block} h-36`} />
            <div className={`${block} h-36`} />
            <div className={`${block} h-36`} />
          </div>
        ) : query.data.items.length === 0 ? (
          <div className="border border-dashed border-[#2A2A2A] px-6 py-16 text-center">
            <p className="text-sm text-[#A8A8A8]">Тут поки порожньо.</p>
            <Link href="/#schedule" className={`mt-6 inline-block ${outlineButton}`}>
              Переглянути афішу
            </Link>
          </div>
        ) : (
          <>
            <ul className={`space-y-4 transition-opacity ${query.isPlaceholderData ? 'opacity-60' : ''}`}>
              {query.data.items.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </ul>
            <Pagination page={page} total={query.data.total} limit={PAGE_SIZE} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}