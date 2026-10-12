'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useHomeSessions } from '@/features/home/hooks/use-home';
import { dayLabel, isUpcoming, sessionDays, sessionsOfDay } from '@/features/home/lib/sessions';
import { PageHeading } from '@/features/site/components/PageHeading';
import { outlineButton } from '@/shared/button-classes';
import { getErrorMessage } from '@/lib/get-error-message';

import { useCatalogMovies } from '../hooks/use-catalog';
import { byStart } from '../lib/catalog';
import { ScheduleRow } from './ScheduleRow';

const MAX_DAYS = 14;

const block = 'animate-pulse bg-white/5';

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-6">
      <span aria-hidden="true" className="h-px flex-1 bg-[#242424]" />
      <h2 className="text-lg font-semibold text-[#D9AE4E] sm:text-xl">{label}</h2>
      <span aria-hidden="true" className="h-px flex-1 bg-[#242424]" />
    </div>
  );
}

export function ScheduleView() {
  const sessionsQuery = useHomeSessions();
  const moviesQuery = useCatalogMovies();
  const [hallId, setHallId] = useState<string | null>(null);

  const upcoming = useMemo(
    () => (sessionsQuery.data ?? []).filter((session) => isUpcoming(session)),
    [sessionsQuery.data],
  );

  const halls = useMemo(() => {
    const map = new Map<string, string>();
    for (const session of upcoming) {
      if (session.hall) map.set(session.hall.id, session.hall.name);
    }
    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], 'uk'))
      .map(([id, name]) => ({ id, name }));
  }, [upcoming]);

  const filtered = useMemo(
    () => (hallId ? upcoming.filter((session) => session.hallId === hallId) : upcoming),
    [upcoming, hallId],
  );

  const groups = useMemo(
    () =>
      sessionDays(filtered, MAX_DAYS).map((day) => ({
        day,
        sessions: [...sessionsOfDay(filtered, day).values()].flat().sort(byStart),
      })),
    [filtered],
  );

  const movieById = useMemo(
    () => new Map((moviesQuery.data ?? []).map((movie) => [movie.id, movie])),
    [moviesQuery.data],
  );

  const highlightId = groups[0]?.sessions[0]?.id;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-8">
      <PageHeading>Найближчий сеанс</PageHeading>

      {halls.length > 0 && (
        <div role="group" aria-label="Зал" className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#A8A8A8]">Зал:</span>
          {halls.map((hall) => {
            const active = hall.id === hallId;

            return (
              <button
                key={hall.id}
                type="button"
                aria-pressed={active}
                onClick={() => setHallId(active ? null : hall.id)}
                className={`rounded-full border px-5 py-2 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#D9AE4E] ${
                  active
                    ? 'border-[#D9AE4E] bg-[#D9AE4E] text-[#14110A]'
                    : 'border-[#2E2E2E] text-[#CFCFCF] hover:border-[#6A6A6A] hover:text-white'
                }`}
              >
                {hall.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        {sessionsQuery.isPending ? (
          <div aria-hidden="true" className="space-y-4">
            <div className={`${block} h-8 w-48`} />
            <div className={`${block} h-40`} />
            <div className={`${block} h-40`} />
          </div>
        ) : sessionsQuery.isError ? (
          <div role="alert" className="border border-dashed border-[#2A2A2A] px-6 py-16 text-center">
            <p className="text-sm text-[#A8A8A8]">
              {getErrorMessage(sessionsQuery.error, 'Не вдалося завантажити сеанси.')}
            </p>
            <button type="button" onClick={() => void sessionsQuery.refetch()} className={`mt-6 ${outlineButton}`}>
              Спробувати ще раз
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="border border-dashed border-[#2A2A2A] px-6 py-16 text-center">
            <p className="text-sm text-[#A8A8A8]">Найближчих сеансів поки немає.</p>
            <Link href="/soon" className={`mt-6 inline-block ${outlineButton}`}>
              Скоро у кіно
            </Link>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.day} className="mb-10">
              <DayDivider label={dayLabel(group.day)} />
              <ul className="mt-6 divide-y divide-[#1F1F1F] border border-[#242424] bg-[#101010]">
                {group.sessions.map((session) => (
                  <ScheduleRow
                    key={session.id}
                    session={session}
                    movie={movieById.get(session.movieId)}
                    highlighted={session.id === highlightId}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}