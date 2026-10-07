'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import type { OccupancySession } from '../types';
import { formatDateTime, formatNumber, formatPercent } from '../lib/format';
import { DataTable, type Column } from './DataTable';
import { MeterBar } from './MeterBar';
import { EmptyState, Panel } from './ui';

const STEP = 8;

export function SessionsTable({ sessions }: { sessions: OccupancySession[] }) {
  const [visible, setVisible] = useState(STEP);

  const sorted = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
      ),
    [sessions],
  );

  const columns: Column<OccupancySession>[] = [
    {
      key: 'movie',
      header: 'Фільм',
      cell: (row) => (
        <span className="font-medium text-[#F4F4F5]">{row.movie.title}</span>
      ),
    },
    { key: 'hall', header: 'Зал', cell: (row) => row.hall.name },
    {
      key: 'start',
      header: 'Початок',
      cell: (row) => (
        <span className="whitespace-nowrap">{formatDateTime(row.startAt)}</span>
      ),
    },
    {
      key: 'tickets',
      header: 'Квитки',
      align: 'right',
      cell: (row) => `${formatNumber(row.ticketsSold)} / ${formatNumber(row.seatsTotal)}`,
    },
    {
      key: 'occupancy',
      header: 'Заповненість',
      cell: (row) => (
        <div className="flex min-w-40 items-center gap-3">
          <div className="flex-1">
            <MeterBar ratio={row.occupancy} label={`Заповненість: ${row.movie.title}`} />
          </div>

          <span className="w-12 text-right tabular-nums text-[#F4F4F5]">
            {formatPercent(row.occupancy)}
          </span>
        </div>
      ),
    },
    {
      key: 'orders',
      header: '',
      align: 'right',
      cell: (row) => (
        <Link
          href={`/admin/orders?sessionId=${row.sessionId}`}
          className="whitespace-nowrap text-sm font-medium text-[#F2B544] transition hover:text-[#FFC85C]"
        >
          Замовлення
        </Link>
      ),
    },
  ];

  return (
    <Panel>
      <div className="p-5 pb-3 sm:p-6 sm:pb-3">
        <h2 className="text-base font-semibold text-[#F4F4F5]">Сеанси</h2>
        <p className="mt-1 text-sm text-[#9A9AA8]">Від найновіших до старіших</p>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="Немає сеансів у цьому періоді" />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={sorted.slice(0, visible)}
            getKey={(row) => row.sessionId}
            minWidth={840}
          />

          {visible < sorted.length && (
            <div className="border-t border-[#262631] p-4 text-center">
              <button
                type="button"
                onClick={() => setVisible((value) => value + STEP)}
                className="h-9 rounded-lg border border-[#262631] px-4 text-sm font-medium text-[#F4F4F5] transition hover:bg-white/5"
              >
                Показати ще ({sorted.length - visible})
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
