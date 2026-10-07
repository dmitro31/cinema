'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { formatMoney, formatTime } from '@/features/admin/lib/format';
import type { Session } from '@/features/admin/catalog-types';

import { dayLabel } from '../lib/sessions';

const MAX_DAYS = 7;

function groupByDay(sessions: Session[]): Map<string, Session[]> {
  const groups = new Map<string, Session[]>();

  for (const session of sessions) {
    const day = new Date(session.startAt).toISOString().slice(0, 10);
    const daySessions = groups.get(day) ?? [];
    daySessions.push(session);
    groups.set(day, daySessions);
  }

  return groups;
}

interface UpcomingSessionsProps {
  sessions: Session[];
  titles: Map<string, string>;
}

export function UpcomingSessions({ sessions, titles }: UpcomingSessionsProps) {
  const groups = useMemo(() => groupByDay(sessions), [sessions]);
  const days = useMemo(() => [...groups.keys()].slice(0, MAX_DAYS), [groups]);
  const [selected, setSelected] = useState<string | null>(null);

  if (days.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#262631] py-16 text-center text-sm text-[#6F6F7C]">
        Найближчих сеансів поки немає.
      </p>
    );
  }

  const activeDay = selected && days.includes(selected) ? selected : days[0];
  const daySessions = groups.get(activeDay) ?? [];

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
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize outline-none transition focus-visible:ring-2 focus-visible:ring-[#F2B544] ${
              day === activeDay
                ? 'border-[#F2B544] bg-[#F2B544]/10 text-[#F2B544]'
                : 'border-[#262631] bg-[#121218] text-[#B8B8C4] hover:border-[#3A3A48] hover:text-white'
            }`}
          >
            {dayLabel(day)}
          </button>
        ))}
      </div>

      <ul className="mt-5 divide-y divide-[#1E1E28] overflow-hidden rounded-2xl border border-[#262631] bg-[#121218]">
        {daySessions.map((session) => (
          <li key={session.id}>
            <Link
              href={`/sessions/${session.id}`}
              className="flex items-center gap-4 px-4 py-4 outline-none transition hover:bg-white/[0.03] focus-visible:bg-white/[0.04] sm:gap-6 sm:px-6"
            >
              <div className="w-16 shrink-0 sm:w-20">
                <p className="text-xl font-bold tabular-nums">{formatTime(session.startAt)}</p>
                <p className="text-xs tabular-nums text-[#6F6F7C]">до {formatTime(session.endAt)}</p>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">
                  {session.movie?.title ?? titles.get(session.movieId) ?? 'Фільм'}
                </p>
                <p className="truncate text-sm text-[#6F6F7C]">{session.hall?.name ?? 'Зал'}</p>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-xs text-[#6F6F7C]">від</p>
                <p className="text-sm font-semibold tabular-nums">{formatMoney(session.price)}</p>
              </div>

              <span className="shrink-0 rounded-xl bg-[#F2B544] px-4 py-2 text-sm font-semibold text-[#17130A]">
                Квитки
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
