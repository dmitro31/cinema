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
  'flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D8D8D8] outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E] sm:gap-3 sm:text-xs sm:tracking-[0.2em]';

export function Hero({
  movies,
  sessions,
  onTrailer,
  trailerOpen,
}: HeroProps) {
  const next = useMemo(() => nextSessionByMovie(sessions), [sessions]);
  const featured = useMemo(() => pickFeatured(movies, next), [movies, next]);

  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const count = featured.length;
  const paused = hovered || trailerOpen;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % count);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [count, paused]);

  const movie = featured[index % Math.max(count, 1)];

  const slot = useMemo(
    () =>
      movie
        ? heroSessions(sessions, movie.id)
        : { day: null, items: [] as Session[] },
    [sessions, movie],
  );

  if (!movie) return null;

  const hasTrailer = getYouTubeEmbedUrl(movie.trailerUrl) !== null;

  const step = (delta: number) => {
    if (count <= 1) return;
    setIndex((prevIndex) => (prevIndex + delta + count) % count);
  };

  const label = slot.day ? dayLabel(slot.day) : null;

  return (
    <section
      aria-roledescription="карусель"
      aria-label="Рекомендовані фільми"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="
        relative isolate -mt-16
        h-[min(820px,calc(100svh+64px))]
        min-h-[650px]
        w-full min-w-0
        overflow-hidden bg-[#0A0A0A]
        sm:h-[min(860px,calc(100svh+64px))]
        sm:min-h-[700px]
        lg:h-[min(900px,calc(100svh+64px))]
      "
    >
      {/* Background slides */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        {featured.map((item, itemIndex) => (
          <Backdrop
            key={item.id}
            movie={item}
            active={itemIndex === index % count}
          />
        ))}
      </div>

      {/* Readability overlays */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 via-[42%] to-black/15"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-36 bg-gradient-to-b from-black/75 to-transparent sm:h-44"
        aria-hidden="true"
      />

      {/* Desktop arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Попередній фільм"
            onClick={() => step(-1)}
            className="
              absolute left-3 top-1/2 z-30 hidden size-12
              -translate-y-1/2 items-center justify-center
              text-[#D9AE4E] outline-none transition hover:scale-110
              focus-visible:ring-2 focus-visible:ring-[#D9AE4E]
              sm:flex lg:left-8 lg:size-14 xl:left-12
            "
          >
            <svg
              viewBox="0 0 24 48"
              width="22"
              height="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M18 4L6 24l12 20" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Наступний фільм"
            onClick={() => step(1)}
            className="
              absolute right-3 top-1/2 z-30 hidden size-12
              -translate-y-1/2 items-center justify-center
              text-[#D9AE4E] outline-none transition hover:scale-110
              focus-visible:ring-2 focus-visible:ring-[#D9AE4E]
              sm:flex lg:right-8 lg:size-14 xl:right-12
            "
          >
            <svg
              viewBox="0 0 24 48"
              width="22"
              height="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M6 4l12 20L6 44" />
            </svg>
          </button>
        </>
      )}

      {/* Main content */}
      <div
        className="
          absolute inset-x-0 bottom-0 z-20
          flex w-full min-w-0 flex-col items-center
          px-4 pb-24 pt-24 text-center
          sm:px-8 sm:pb-24 sm:pt-28
          md:px-12 md:pb-28
          lg:px-24
        "
      >
        <div className="w-full min-w-0 max-w-4xl">
          <h1
            className="
              mx-auto max-w-full break-words text-balance
              text-3xl font-bold uppercase leading-[1.08]
              tracking-wide text-white
              drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]
              min-[380px]:text-4xl
              sm:text-5xl
              lg:text-6xl
            "
          >
            {movie.title}
          </h1>

          <MovieMeta
            movie={movie}
            badge
            className="mt-4 flex-wrap justify-center gap-x-3 gap-y-2 sm:mt-5 sm:gap-x-5"
          />

          {slot.items.length > 0 && (
            <div className="mt-5 min-w-0 space-y-2 sm:mt-6">
              {label && label !== 'Сьогодні' && (
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#A8A8A8] sm:text-xs sm:tracking-[0.2em]">
                  {label}
                </p>
              )}

              <div className="flex min-w-0 justify-center">
                <SessionChips
                  sessions={slot.items.slice(0, 6)}
                  align="center"
                />
              </div>
            </div>
          )}

          {/* Buy ticket */}
          <Link
            href={`/movies/${movie.id}`}
            className="
              mx-auto mt-6 flex min-h-14 w-full max-w-[420px]
              items-center justify-center
              bg-[#D9AE4E] px-5 py-4
              text-center text-xs font-bold uppercase
              tracking-[0.16em] text-[#14110A]
              outline-none transition hover:bg-[#E8C46A]
              focus-visible:ring-4 focus-visible:ring-[#D9AE4E]/40
              min-[380px]:tracking-[0.22em]
              sm:mt-7 sm:px-8 sm:text-sm
            "
          >
            Купити квиток
          </Link>

          {/* Mobile secondary links */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:hidden">
            {hasTrailer && (
              <button
                type="button"
                onClick={() => onTrailer(movie)}
                className={cornerLink}
              >
                <PlayIcon width={14} height={14} />
                Трейлер
              </button>
            )}

            <Link href={`/movies/${movie.id}`} className={cornerLink}>
              Про фільм
            </Link>
          </div>
        </div>
      </div>

      {/* Desktop trailer link */}
      {hasTrailer && (
        <button
          type="button"
          onClick={() => onTrailer(movie)}
          className="
            absolute bottom-12 left-6 z-30 hidden
            flex-col items-center gap-3
            md:flex lg:bottom-14 lg:left-16 xl:left-24
          "
        >
          <span className={`${cornerLink} flex-col`}>
            <span className="flex size-10 items-center justify-center rounded-full border border-current lg:size-12">
              <PlayIcon width={16} height={16} />
            </span>
            Трейлер
          </span>
        </button>
      )}

      {/* Desktop details link */}
      <Link
        href={`/movies/${movie.id}`}
        className="
          absolute bottom-12 right-6 z-30 hidden
          flex-col items-center gap-3
          md:flex lg:bottom-14 lg:right-16 xl:right-24
        "
      >
        <span className={`${cornerLink} flex-col`}>
          <span className="flex size-10 items-center justify-center rounded-full border border-current text-lg font-semibold normal-case lg:size-12">
            i
          </span>
          Про фільм
        </span>
      </Link>

      {/* Slide indicators */}
      {count > 1 && (
        <div
          className="
            absolute inset-x-0 bottom-5 z-30
            flex items-center justify-center gap-3
            sm:bottom-6
          "
          role="tablist"
          aria-label="Слайди"
        >
          {featured.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={itemIndex === index % count}
              aria-label={item.title}
              onClick={() => setIndex(itemIndex)}
              className={`
                h-3 rounded-full outline-none transition-all
                focus-visible:ring-2 focus-visible:ring-[#D9AE4E]
                ${
                  itemIndex === index % count
                    ? 'w-10 bg-[#D9AE4E] sm:w-12'
                    : 'w-3 bg-[#6A6A6A] hover:bg-[#9A9A9A]'
                }
              `}
            />
          ))}
        </div>
      )}
    </section>
  );
}
