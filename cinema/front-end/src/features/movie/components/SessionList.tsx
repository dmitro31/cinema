'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { formatMoney, formatTime, toNumber } from '@/features/admin/lib/format';
import type { Session } from '@/features/admin/catalog-types';
import { dayLabel, isUpcoming, sessionDays, sessionsOfDay } from '@/features/home/lib/sessions';

const MAX_DAYS = 14;

export function SessionList({ sessions, movieId }: { sessions: Session[]; movieId: string }) {
  const days = useMemo(() => sessionDays(sessions, MAX_DAYS), [sessions]);
  const [selected, setSelected] = useState<string | null>(null);

  if (days.length === 0) {
    return (
      <div className="border border-dashed border-[#2A2A2A] px-6 py-16 text-center">
        <p className="text-sm text-[#A8A8A8]">На цей фільм поки немає сеансів.</p>
        <Link
          href="/#schedule"
          className="mt-6 inline-block border border-[#D9AE4E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E]/10 focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
        >
          Переглянути афішу
        </Link>
      </div>
    );
  }

  const activeDay = selected && days.includes(selected) ? selected : days[0];
  const daySessions = sessionsOfDay(sessions, activeDay).get(movieId) ?? [];

  return (
    <div>
      <div role="tablist" aria-label="День" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {days.map((day) => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={day === activeDay}
            onClick={() => setSelected(day)}
            className={`h-11 shrink-0 border px-5 text-xs font-semibold uppercase tracking-[0.18em] outline-none transition focus-visible:ring-2 focus-visible:ring-[#D9AE4E] ${
              day === activeDay
                ? 'border-[#D9AE4E] bg-[#D9AE4E] text-[#14110A]'
                : 'border-[#2E2E2E] text-[#A8A8A8] hover:border-[#6A6A6A] hover:text-white'
            }`}
          >
            {dayLabel(day)}
          </button>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-[#1F1F1F] border border-[#242424] bg-[#101010]">
        {daySessions.map((session) => {
          const upcoming = isUpcoming(session);
          const hasVip = session.vipPrice != null && toNumber(session.vipPrice) > 0;

          return (
            <li
              key={session.id}
              className={`flex items-center gap-4 px-4 py-4 sm:gap-8 sm:px-6 ${upcoming ? '' : 'opacity-40'}`}
            >
              <div className="w-20 shrink-0">
                <p className="text-2xl font-bold tabular-nums">{formatTime(session.startAt)}</p>
                <p className="text-xs tabular-nums text-[#8C8C8C]">до {formatTime(session.endAt)}</p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold uppercase tracking-[0.14em]">
                  {session.hall?.name ?? 'Зал'}
                </p>
                <p className="mt-1 text-sm text-[#A8A8A8]">
                  {formatMoney(session.price)}
                  {hasVip && <span className="text-[#8C8C8C]"> · VIP {formatMoney(session.vipPrice!)}</span>}
                </p>
              </div>

              {upcoming ? (
                <Link
                  href={`/sessions/${session.id}`}
                  className="shrink-0 bg-[#D9AE4E] px-4 py-3 text-[11px] sm:px-6 sm:text-xs font-bold uppercase tracking-[0.2em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-2 focus-visible:ring-[#E8C46A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]"
                >
                  Обрати місця
                </Link>
              ) : (
                <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-[#8C8C8C]">Розпочався</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
