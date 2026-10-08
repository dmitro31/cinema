'use client';

import Link from 'next/link';
import { useState } from 'react';

import { formatDate, formatMoney, formatTime } from '@/features/admin/lib/format';
import { Poster } from '@/features/home/components/Poster';
import { statusLabels } from '@/features/order/lib/order';
import type { Order } from '@/features/order/types';

import { effectiveStatus, formatSeats, statusTone } from '../lib/orders';

export function OrderCard({ order }: { order: Order }) {
  const [now] = useState(() => Date.now());
  const status = effectiveStatus(order, now);
  const { session } = order;

  return (
    <li>
      <Link
        href={`/orders/${order.id}`}
        className="flex gap-4 border border-[#242424] bg-[#101010] p-4 outline-none transition hover:border-[#D9AE4E]/60 focus-visible:ring-2 focus-visible:ring-[#D9AE4E] sm:gap-6 sm:p-5"
      >
        <div className="w-16 shrink-0 self-start border border-[#2A2A2A] sm:w-20">
          <div className="aspect-[2/3]">
            <Poster id={session.movie.id} title={session.movie.title} url={session.movie.posterUrl} />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="break-words text-base font-bold uppercase tracking-[0.12em] sm:text-lg">
              {session.movie.title}
            </p>
            <span
              className={`shrink-0 border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${statusTone[status]}`}
            >
              {statusLabels[status]}
            </span>
          </div>

          <p className="mt-2 text-sm text-[#A8A8A8]">
            {formatDate(session.startAt)} · {formatTime(session.startAt)} · {session.hall.name}
          </p>
          <p className="mt-1 text-sm text-[#8C8C8C]">{formatSeats(order.seats)}</p>
          <p className="mt-3 text-lg font-bold tabular-nums">{formatMoney(order.total)}</p>
        </div>
      </Link>
    </li>
  );
}