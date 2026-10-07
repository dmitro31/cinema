'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Movie, Session } from '@/features/admin/catalog-types';
import { PlayIcon } from '@/features/site/components/icons';

import { pickFeatured } from '../lib/movies';
import { dayLabel, heroSessions, nextSessionByMovie } from '../lib/sessions';
import { getYouTubeEmbedUrl } from '../lib/youtube';
import { Backdrop } from './Backdrop';
import { MovieMeta } from './MovieMeta';
import { SessionChips } from './SessionChips';

const ROTATE_MS = 8000;

interface HeroProps {
  movies: Movie[];
  sessions: Session[];
  onTrailer: (movie: Movie) => void;
  trailerOpen: boolean;
}

const cornerLink =
  'flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#D8D8D8] outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]';

export function Hero({ movies, sessions, onTrailer, trailerOpen }: HeroProps) {
  const next = useMemo(() => nextSessionByMovie(sessions), [sessions]);
  const featured = useMemo(() => pickFeatured(movies, next), [movies, next]);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const count = featured.length;
  const paused = hovered || trailerOpen;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  const movie = featured[index % Math.max(count, 1)];
  const slot = useMemo(
    () => (movie ? heroSessions(sessions, movie.id) : { day: null, items: [] as Session[] }),
    [sessions, movie],
  );

  if (!movie) return null;

  const hasTrailer = getYouTubeEmbedUrl(movie.trailerUrl) !== null;
  const step = (delta: number) => setIndex((index + delta + count) % count);
  const label = slot.day ? dayLabel(slot.day) : null;

  return (
    <section
      aria-roledescription="карусель"
      aria-label="Рекомендовані фільми"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative -mt-16 h-[clamp(620px,92vh,860px)] overflow-hidden bg-[#0A0A0A]"
    >
      {featured.map((item, itemIndex) => (
        <Backdrop key={item.id} movie={item} active={itemIndex === index % count} />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/55 via-35% to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" aria-hidden="true" />

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Попередній фільм"
            onClick={() => step(-1)}
            className="absolute left-3 top-1/2 hidden size-14 -translate-y-1/2 items-center justify-center text-[#D9AE4E] outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#D9AE4E] sm:flex lg:left-10"
          >
            <svg viewBox="0 0 24 48" width="22" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M18 4L6 24l12 20" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Наступний фільм"
            onClick={() => step(1)}
            className="absolute right-3 top-1/2 hidden size-14 -translate-y-1/2 items-center justify-center text-[#D9AE4E] outline-none transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#D9AE4E] sm:flex lg:right-10"
          >
            <svg viewBox="0 0 24 48" width="22" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M6 4l12 20L6 44" />
            </svg>
          </button>
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-24 text-center sm:pb-20">
        <h1 className="max-w-4xl text-balance text-3xl font-bold uppercase leading-tight tracking-wide text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] sm:text-5xl lg:text-6xl">
          {movie.title}
        </h1>

        <MovieMeta movie={movie} badge className="mt-5 justify-center" />

        {slot.items.length > 0 && (
          <div className="mt-6 space-y-2">
            {label && label !== 'Сьогодні' && (
              <p className="text-xs uppercase tracking-[0.2em] text-[#A8A8A8]">{label}</p>
            )}
            <SessionChips sessions={slot.items.slice(0, 6)} align="center" />
          </div>
        )}

        <Link
          href={`/movies/${movie.id}`}
          className="mt-7 w-full max-w-[320px] bg-[#D9AE4E] px-8 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-4 focus-visible:ring-[#D9AE4E]/40"
        >
          Купити квиток
        </Link>

        <div className="mt-5 flex items-center gap-8 md:hidden">
          {hasTrailer && (
            <button type="button" onClick={() => onTrailer(movie)} className={cornerLink}>
              Трейлер
            </button>
          )}
          <Link href={`/movies/${movie.id}`} className={cornerLink}>
            Про фільм
          </Link>
        </div>
      </div>

      {hasTrailer && (
        <button
          type="button"
          onClick={() => onTrailer(movie)}
          className={`${cornerLink} absolute bottom-10 left-10 hidden flex-col md:flex lg:left-24`}
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-current">
            <PlayIcon width={16} height={16} />
          </span>
          Трейлер
        </button>
      )}

      <Link
        href={`/movies/${movie.id}`}
        className={`${cornerLink} absolute bottom-10 right-10 hidden flex-col md:flex lg:right-24`}
      >
        <span className="flex size-12 items-center justify-center rounded-full border border-current text-lg font-semibold normal-case">
          i
        </span>
        Про фільм
      </Link>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3" role="tablist" aria-label="Слайди">
          {featured.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={itemIndex === index % count}
              aria-label={item.title}
              onClick={() => setIndex(itemIndex)}
              className={`h-3 rounded-full outline-none transition-all focus-visible:ring-2 focus-visible:ring-[#D9AE4E] ${
                itemIndex === index % count ? 'w-12 bg-[#D9AE4E]' : 'w-3 bg-[#6A6A6A] hover:bg-[#9A9A9A]'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
