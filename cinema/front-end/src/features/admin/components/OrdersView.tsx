'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { getErrorMessage } from '@/lib/get-error-message';

import { useOrders } from '../hooks/use-admin-queries';
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  shortId,
} from '../lib/format';
import { ORDER_STATUS_OPTIONS } from '../lib/status';
import type { AdminOrder } from '../types';
import { DataTable, TableSkeleton, type Column } from './DataTable';
import { CrossIcon } from './icons';
import { Pagination } from './Pagination';
import { StatusBadge } from './StatusBadge';
import { EmptyState, ErrorState, PageHeader, Panel, SelectField } from './ui';

const columns: Column<AdminOrder>[] = [
  {
    key: 'order',
    header: 'Замовлення',
    cell: (order) => (
      <>
        <p className="font-mono text-xs text-[#F4F4F5]">#{shortId(order.id)}</p>
        <p className="mt-0.5 text-xs text-[#6F6F7C]">{formatDateTime(order.createdAt)}</p>
      </>
    ),
  },
  {
    key: 'customer',
    header: 'Клієнт',
    cell: (order) => (
      <>
        <p className="text-[#F4F4F5]">{order.user.name}</p>
        <p className="mt-0.5 text-xs text-[#6F6F7C]">{order.user.email}</p>
      </>
    ),
  },
  {
    key: 'session',
    header: 'Фільм і сеанс',
    cell: (order) => (
      <>
        <p className="text-[#F4F4F5]">{order.session.movie.title}</p>
        <p className="mt-0.5 text-xs text-[#6F6F7C]">
          {order.session.hall.name} · {formatDateTime(order.session.startAt)}
        </p>
      </>
    ),
  },
  {
    key: 'tickets',
    header: 'Квитків',
    align: 'right',
    cell: (order) => formatNumber(order._count.tickets),
  },
  {
    key: 'total',
    header: 'Сума',
    align: 'right',
    cell: (order) => (
      <span className="font-medium text-[#F4F4F5]">{formatMoney(order.total)}</span>
    ),
  },
  {
    key: 'status',
    header: 'Статус',
    cell: (order) => <StatusBadge status={order.status} />,
  },
];

export function OrdersView({ initialSessionId }: { initialSessionId?: string }) {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState('');
  const [sessionId, setSessionId] = useState(initialSessionId);

  const query = useOrders({
    page,
    limit,
    status: status || undefined,
    sessionId,
  });

  const clearSession = () => {
    setSessionId(undefined);
    setPage(1);
    router.replace('/admin/orders');
  };

  return (
    <>
      <PageHeader
        title="Замовлення"
        description={query.data ? `Усього: ${formatNumber(query.data.total)}` : 'Усі замовлення клієнтів'}
      />

      <div className="mb-5 flex flex-wrap items-end gap-4">
        <SelectField
          label="Статус"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Усі статуси</option>
          {ORDER_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        {sessionId && (
          <button
            type="button"
            onClick={clearSession}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#262631] bg-[#17171F] px-3.5 text-sm text-[#F4F4F5] transition hover:bg-white/5"
          >
            Сеанс #{shortId(sessionId)}
            <CrossIcon className="h-3.5 w-3.5 text-[#9A9AA8]" />
          </button>
        )}
      </div>

      <Panel>
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <div className="p-5">
            <ErrorState
              message={getErrorMessage(query.error, 'Не вдалося завантажити замовлення.')}
              onRetry={() => void query.refetch()}
            />
          </div>
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="Замовлень не знайдено"
            description="Спробуйте змінити фільтри."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={query.data.items}
              getKey={(order) => order.id}
              dimmed={query.isPlaceholderData}
            />

            <Pagination
              page={page}
              limit={limit}
              total={query.data.total}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
            />
          </>
        )}
      </Panel>
    </>
  );
}
