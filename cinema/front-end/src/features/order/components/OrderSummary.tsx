import Link from 'next/link';

import { formatDate, formatMoney, formatTime } from '@/features/admin/lib/format';
import { Poster } from '@/features/home/components/Poster';

import type { Order } from '../types';

export function OrderSummary({ order }: { order: Order }) {
  const { session } = order;

  return (
    <section aria-label="Деталі замовлення" className="border border-[#242424] bg-[#101010] p-6 sm:p-8">
      <div className="flex gap-5 sm:gap-8">
        <div className="w-24 shrink-0 border border-[#2A2A2A] sm:w-32">
          <div className="aspect-[2/3]">
            <Poster id={session.movie.id} title={session.movie.title} url={session.movie.posterUrl} />
          </div>
        </div>

        <div className="min-w-0">
          <Link
            href={`/movies/${session.movie.id}`}
            className="break-words text-xl font-bold uppercase tracking-[0.12em] outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E] sm:text-2xl"
          >
            {session.movie.title}
          </Link>

          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="uppercase tracking-[0.18em] text-[#8C8C8C]">Дата</dt>
            <dd>{formatDate(session.startAt)}</dd>
            <dt className="uppercase tracking-[0.18em] text-[#8C8C8C]">Час</dt>
            <dd className="tabular-nums">
              {formatTime(session.startAt)} – {formatTime(session.endAt)}
            </dd>
            <dt className="uppercase tracking-[0.18em] text-[#8C8C8C]">Зал</dt>
            <dd>{session.hall.name}</dd>
          </dl>
        </div>
      </div>

      <div className="mt-8 border-t border-[#242424] pt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">Місця</h2>

        <ul className="mt-4 divide-y divide-[#1F1F1F] text-sm">
          {order.seats.map((seat) => (
            <li key={seat.seatId} className="flex items-center justify-between gap-4 py-3">
              <span>
                Ряд {seat.row} · Місце {seat.number}
                {seat.type === 'VIP' && <span className="ml-2 text-xs text-[#D9AE4E]">VIP</span>}
              </span>
              <span className="tabular-nums text-[#CFCFCF]">{formatMoney(seat.price)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-baseline justify-between border-t border-[#242424] pt-4">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">Разом</span>
          <span className="text-2xl font-bold tabular-nums">{formatMoney(order.total)}</span>
        </div>
      </div>
    </section>
  );
}