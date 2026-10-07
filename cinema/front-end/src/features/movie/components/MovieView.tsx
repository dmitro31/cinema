'use client';

import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import { movieGenres } from '@/features/admin/lib/catalog';
import { formatDate } from '@/features/admin/lib/format';
import { Backdrop } from '@/features/home/components/Backdrop';
import { MovieMeta } from '@/features/home/components/MovieMeta';
import { Poster } from '@/features/home/components/Poster';
import { TrailerDialog } from '@/features/home/components/TrailerDialog';
import { getYouTubeEmbedUrl } from '@/features/home/lib/youtube';
import { PlayIcon } from '@/features/site/components/icons';
import { getErrorMessage } from '@/lib/get-error-message';

import { useMovie, useMovieSessions } from '../hooks/use-movie';
import { SessionList } from './SessionList';

const block = 'animate-pulse bg-white/5';

function Message({ title, text, onRetry }: { title: string; text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-4 py-40 text-center">
      <h1 className="text-2xl font-bold uppercase tracking-[0.18em]">{title}</h1>
      <p className="text-sm text-[#A8A8A8]">{text}</p>
      <div className="mt-2 flex gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="border border-[#D9AE4E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E]/10 focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
          >
            Спробувати ще раз
          </button>
        )}
        <Link
          href="/"
          className="bg-[#D9AE4E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-2 focus-visible:ring-[#E8C46A]"
        >
          На головну
        </Link>
      </div>
    </div>
  );
}

export function MovieView({ id }: { id: string }) {
  const movieQuery = useMovie(id);
  const sessionsQuery = useMovieSessions(id);
  const [trailerOpen, setTrailerOpen] = useState(false);

  if (movieQuery.isPending) {
    return (
      <div aria-hidden="true" className="mx-auto max-w-[1400px] px-4 pt-28 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[280px_1fr]">
          <div className={`${block} aspect-[2/3]`} />
          <div className="space-y-5">
            <div className={`${block} h-12 w-2/3`} />
            <div className={`${block} h-5 w-1/3`} />
            <div className={`${block} h-32`} />
          </div>
        </div>
      </div>
    );
  }

  if (movieQuery.isError) {
    const notFound = isAxiosError(movieQuery.error) && movieQuery.error.response?.status === 404;

    return notFound ? (
      <Message title="Фільм не знайдено" text="Можливо, його вже прибрали з афіші." />
    ) : (
      <Message
        title="Не вдалося завантажити"
        text={getErrorMessage(movieQuery.error, 'Спробуйте ще раз трохи пізніше.')}
        onRetry={() => void movieQuery.refetch()}
      />
    );
  }

  const movie = movieQuery.data;
  const embedUrl = getYouTubeEmbedUrl(movie.trailerUrl);
  const genres = movieGenres(movie)
    .map((genre) => genre.name)
    .join(', ');

  return (
    <>
      <section className="relative -mt-16 overflow-hidden bg-[#0A0A0A]">
        <div className="absolute inset-0 h-full" aria-hidden="true">
          <Backdrop movie={movie} active />
          <div className="absolute inset-0 bg-[#0A0A0A]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 pb-16 pt-28 sm:px-8 lg:pt-36">
          <nav aria-label="Навігація" className="mb-8 text-xs uppercase tracking-[0.2em] text-[#8C8C8C]">
            <Link href="/#schedule" className="outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]">
              Афіша
            </Link>
            <span className="mx-3" aria-hidden="true">/</span>
            <span aria-current="page" className="text-[#D8D8D8]">{movie.title}</span>
          </nav>

          <div className="grid gap-10 md:grid-cols-[minmax(220px,300px)_1fr] lg:gap-16">
            <div className="mx-auto w-56 border border-[#2A2A2A] shadow-2xl shadow-black md:mx-0 md:w-full">
              <div className="aspect-[2/3]">
                <Poster id={movie.id} title={movie.title} url={movie.posterUrl} eager />
              </div>
            </div>

            <div className="flex flex-col">
              <h1 className="text-balance text-3xl font-bold uppercase leading-tight tracking-wide sm:text-5xl">
                {movie.title}
              </h1>

              <MovieMeta movie={movie} badge className="mt-5" />

              <dl className="mt-8 grid max-w-xl grid-cols-[auto_1fr] gap-x-8 gap-y-3 text-sm">
                {movie.releaseDate && (
                  <>
                    <dt className="uppercase tracking-[0.18em] text-[#8C8C8C]">Прем'єра</dt>
                    <dd>{formatDate(movie.releaseDate)}</dd>
                  </>
                )}
                {genres && (
                  <>
                    <dt className="uppercase tracking-[0.18em] text-[#8C8C8C]">Жанр</dt>
                    <dd>{genres}</dd>
                  </>
                )}
              </dl>

              <p className="mt-8 max-w-2xl whitespace-pre-line text-base leading-relaxed text-[#CFCFCF]">
                {movie.description}
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <a
                  href="#sessions"
                  className="w-full bg-[#D9AE4E] px-8 py-4 text-center text-sm font-bold uppercase tracking-[0.22em] text-[#14110A] outline-none sm:w-auto transition hover:bg-[#E8C46A] focus-visible:ring-4 focus-visible:ring-[#D9AE4E]/40"
                >
                  Обрати сеанс
                </a>
                {embedUrl && (
                  <button
                    type="button"
                    onClick={() => setTrailerOpen(true)}
                    className="flex w-full items-center justify-center gap-3 border border-[#D9AE4E] px-8 py-4 sm:w-auto text-sm font-bold uppercase tracking-[0.22em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E]/10 focus-visible:ring-4 focus-visible:ring-[#D9AE4E]/40"
                  >
                    <PlayIcon width={14} height={14} />
                    Трейлер
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sessions" aria-labelledby="sessions-title" className="mx-auto max-w-[1400px] scroll-mt-20 px-4 pt-12 sm:px-8">
        <h2 id="sessions-title" className="mb-8 text-2xl font-bold uppercase tracking-[0.18em] sm:text-3xl">
          Сеанси
        </h2>

        {sessionsQuery.isPending ? (
          <div className={`${block} h-72`} aria-hidden="true" />
        ) : sessionsQuery.isError ? (
          <div role="alert" className="border border-dashed border-[#2A2A2A] px-6 py-16 text-center">
            <p className="text-sm text-[#A8A8A8]">
              {getErrorMessage(sessionsQuery.error, 'Не вдалося завантажити сеанси.')}
            </p>
            <button
              type="button"
              onClick={() => void sessionsQuery.refetch()}
              className="mt-6 border border-[#D9AE4E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E]/10 focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
            >
              Спробувати ще раз
            </button>
          </div>
        ) : (
          <SessionList sessions={sessionsQuery.data ?? []} movieId={movie.id} />
        )}
      </section>

      <TrailerDialog
        title={movie.title}
        embedUrl={trailerOpen ? embedUrl : null}
        onClose={() => setTrailerOpen(false)}
      />
    </>
  );
}
