'use client';

import { useMemo, useState } from 'react';

import type { Movie, Session } from '@/features/admin/catalog-types';

import { dayLabel, sessionDays, sessionsOfDay } from '../lib/sessions';
import { MovieRow } from './MovieRow';

interface ScheduleProps {
  movies: Movie[];
  sessions: Session[];
  onTrailer: (movie: Movie) => void;
}

export function Schedule({ movies, sessions, onTrailer }: ScheduleProps) {
  const days = useMemo(() => sessionDays(sessions), [sessions]);
  const [selected, setSelected] = useState<string | null>(null);
  const moviesById = useMemo(() => new Map(movies.map((movie) => [movie.id, movie])), [movies]);

  const activeDay = selected && days.includes(selected) ? selected : days[0];
  const rows = activeDay
    ? [...sessionsOfDay(sessions, activeDay)].filter(([movieId]) => moviesById.has(movieId))
    : [];

  return (
    <section id="schedule" aria-labelledby="schedule-title" className="mx-auto max-w-[1400px] scroll-mt-20 px-4 pt-16 sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <h2 id="schedule-title" className="text-2xl font-bold uppercase tracking-[0.18em] sm:text-3xl">
          {activeDay ? `${dayLabel(activeDay)} у кіно` : 'Афіша'}
        </h2>

        {days.length > 0 && (
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
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 border border-dashed border-[#2A2A2A] py-20 text-center text-sm text-[#8C8C8C]">
          Сеансів поки немає. Загляньте пізніше.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {rows.map(([movieId, items]) => (
            <MovieRow key={movieId} movie={moviesById.get(movieId)!} sessions={items} onTrailer={onTrailer} />
          ))}
        </div>
      )}
    </section>
  );
}
