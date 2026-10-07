'use client';

import { useMemo, useState } from 'react';

import type { Movie } from '@/features/admin/catalog-types';
import { getErrorMessage } from '@/lib/get-error-message';

import { useHomeMovies, useHomeSessions } from '../hooks/use-home';
import { nextSessionByMovie } from '../lib/sessions';
import { getYouTubeEmbedUrl } from '../lib/youtube';
import { ComingSoon } from './ComingSoon';
import { Hero } from './Hero';
import { Schedule } from './Schedule';
import { TrailerDialog } from './TrailerDialog';

const block = 'animate-pulse bg-white/5';

function Notice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-4 py-32 text-center">
      <p className="text-sm text-[#A8A8A8]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="border border-[#D9AE4E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E]/10 focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
        >
          Спробувати ще раз
        </button>
      )}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={`${block} -mt-16 h-[clamp(620px,92vh,860px)]`} />
      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 pt-16 sm:px-8 xl:grid-cols-2">
        <div className={`${block} h-72`} />
        <div className={`${block} h-72`} />
      </div>
    </div>
  );
}

export function HomeView() {
  const moviesQuery = useHomeMovies();
  const sessionsQuery = useHomeSessions();
  const [trailer, setTrailer] = useState<Movie | null>(null);

  const movies = moviesQuery.data;
  const sessions = sessionsQuery.data;

  const soon = useMemo(() => {
    if (!movies || !sessions) return [];
    const withSessions = new Set(nextSessionByMovie(sessions).keys());
    return movies.filter((movie) => !withSessions.has(movie.id));
  }, [movies, sessions]);

  if (moviesQuery.isPending || sessionsQuery.isPending) return <PageSkeleton />;

  if (moviesQuery.isError) {
    return (
      <Notice
        message={getErrorMessage(moviesQuery.error, 'Не вдалося завантажити афішу.')}
        onRetry={() => void moviesQuery.refetch()}
      />
    );
  }

  if (sessionsQuery.isError) {
    return (
      <Notice
        message={getErrorMessage(sessionsQuery.error, 'Не вдалося завантажити сеанси.')}
        onRetry={() => void sessionsQuery.refetch()}
      />
    );
  }

  if (moviesQuery.data.length === 0) {
    return <Notice message="Афіша поки порожня. Загляньте пізніше." />;
  }

  return (
    <>
      <Hero
        movies={moviesQuery.data}
        sessions={sessionsQuery.data}
        onTrailer={setTrailer}
        trailerOpen={trailer !== null}
      />
      <Schedule movies={moviesQuery.data} sessions={sessionsQuery.data} onTrailer={setTrailer} />
      <ComingSoon movies={soon} />

      <TrailerDialog
        title={trailer?.title ?? ''}
        embedUrl={trailer ? getYouTubeEmbedUrl(trailer.trailerUrl) : null}
        onClose={() => setTrailer(null)}
      />
    </>
  );
}
