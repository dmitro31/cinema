import Link from 'next/link';

import type { Movie, Session } from '@/features/admin/catalog-types';
import { formatMoney, formatTime } from '@/features/admin/lib/format';
import { Poster } from '@/features/home/components/Poster';

import { genreNames } from '../lib/catalog';

interface ScheduleRowProps {
  session: Session;
  movie?: Movie;
  highlighted: boolean;
}

export function ScheduleRow({ session, movie, highlighted }: ScheduleRowProps) {
  const title = movie?.title ?? session.movie?.title ?? 'Фільм';
  const hall = session.hall?.name ?? 'Зал';
  const genres = movie ? genreNames(movie) : '';

  const meta = [movie?.ageRating, movie ? `${movie.durationMin}хв` : null, genres].filter(
    (item): item is string => Boolean(item),
  );

  return (
    <li
      className={`flex flex-wrap items-center gap-x-5 gap-y-4 px-4 py-4 sm:flex-nowrap sm:gap-x-8 sm:px-6 ${
        highlighted ? 'border-l-2 border-[#D9AE4E] bg-[#131108]' : ''
      }`}
    >
      <div className="w-24 shrink-0 sm:w-28">
        <p className="text-3xl font-bold tabular-nums text-[#D9AE4E] sm:text-4xl">
          {formatTime(session.startAt)}
        </p>
        <p className="mt-1 text-xs tabular-nums text-[#6A6A6A]">
          {formatTime(session.startAt)} — {formatTime(session.endAt)}
        </p>
      </div>

      <div className="w-16 shrink-0 border border-[#2A2A2A] sm:w-20">
        <div className="aspect-[2/3]">
          <Poster id={session.movieId} title={title} url={movie?.posterUrl ?? null} />
        </div>
      </div>

      <div className="min-w-0 flex-1 basis-40">
        <Link
          href={`/movies/${session.movieId}`}
          className="break-words text-base font-bold uppercase tracking-[0.08em] outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E] sm:text-lg"
        >
          {title}
        </Link>

        {meta.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm uppercase text-[#8C8C8C]">
            {meta.map((item, index) => (
              <span key={item} className="flex items-center gap-3">
                {index > 0 && <span aria-hidden="true" className="h-4 w-px bg-[#2E2E2E]" />}
                {item}
              </span>
            ))}
          </p>
        )}

        <p className="mt-2 text-sm text-[#A8A8A8] sm:hidden">
          {hall} · від {formatMoney(session.price)}
        </p>
      </div>

      <div className="hidden w-36 shrink-0 sm:block">
        <p className="text-xs uppercase tracking-[0.18em] text-[#6A6A6A]">Зал</p>
        <p className="mt-1 font-semibold text-[#D9AE4E]">{hall}</p>
      </div>

      <div className="hidden w-36 shrink-0 sm:block">
        <p className="text-xs uppercase tracking-[0.18em] text-[#6A6A6A]">Вартість</p>
        <p className="mt-1 font-bold tabular-nums text-[#D9AE4E]">від {formatMoney(session.price)}</p>
      </div>

      <Link
        href={`/sessions/${session.id}`}
        className="w-full shrink-0 border border-[#D9AE4E] px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E] hover:text-[#14110A] focus-visible:ring-2 focus-visible:ring-[#D9AE4E] sm:w-auto sm:px-8"
      >
        Купити квиток
      </Link>
    </li>
  );
}