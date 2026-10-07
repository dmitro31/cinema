'use client';

import { useState } from 'react';

import { getErrorMessage } from '@/lib/get-error-message';

import { usePayments } from '../hooks/use-admin-queries';
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  shortId,
} from '../lib/format';
import { PAYMENT_STATUS_OPTIONS } from '../lib/status';
import type { AdminPayment } from '../types';
import { DataTable, TableSkeleton, type Column } from './DataTable';
import { Pagination } from './Pagination';
import { StatusBadge } from './StatusBadge';
import { EmptyState, ErrorState, PageHeader, Panel, SelectField } from './ui';

const columns: Column<AdminPayment>[] = [
  {
    key: 'payment',
    header: 'Платіж',
    cell: (payment) => (
      <>
        <p className="font-mono text-xs text-[#F4F4F5]">#{shortId(payment.id)}</p>
        <p className="mt-0.5 text-xs text-[#6F6F7C]">{formatDateTime(payment.createdAt)}</p>
      </>
    ),
  },
  {
    key: 'order',
    header: 'Замовлення',
    cell: (payment) => (
      <span className="font-mono text-xs text-[#F4F4F5]">#{shortId(payment.orderId)}</span>
    ),
  },
  {
    key: 'provider',
    header: 'Провайдер',
    cell: (payment) => (
      <>
        <p className="text-[#F4F4F5]">{payment.provider}</p>
        {payment.providerStatus && (
          <p className="mt-0.5 text-xs text-[#6F6F7C]">{payment.providerStatus}</p>
        )}
      </>
    ),
  },
  {
    key: 'amount',
    header: 'Сума',
    align: 'right',
    cell: (payment) => (
      <span className="font-medium text-[#F4F4F5]">
        {formatMoney(payment.amount, payment.currency)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Статус',
    cell: (payment) => (
      <>
        <StatusBadge status={payment.status} />
        {payment.failureReason && (
          <p className="mt-1.5 max-w-64 text-xs text-[#6F6F7C]">
            {payment.failureReason}
          </p>
        )}
      </>
    ),
  },
];

export function PaymentsView() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState('');

  const query = usePayments({ page, limit, status: status || undefined });

  return (
    <>
      <PageHeader
        title="Платежі"
        description={query.data ? `Усього: ${formatNumber(query.data.total)}` : 'Усі платежі за замовленнями'}
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
          {PAYMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </div>

      <Panel>
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <div className="p-5">
            <ErrorState
              message={getErrorMessage(query.error, 'Не вдалося завантажити платежі.')}
              onRetry={() => void query.refetch()}
            />
          </div>
        ) : query.data.items.length === 0 ? (
          <EmptyState
            title="Платежів не знайдено"
            description="Спробуйте змінити фільтри."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={query.data.items}
              getKey={(payment) => payment.id}
              dimmed={query.isPlaceholderData}
              minWidth={680}
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
