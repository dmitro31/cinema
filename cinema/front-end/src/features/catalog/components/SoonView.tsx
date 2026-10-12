'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { Movie } from '@/features/admin/catalog-types';
import { TrailerDialog } from '@/features/home/components/TrailerDialog';
import { getYouTubeEmbedUrl } from '@/features/home/lib/youtube';
import { PageHeading } from '@/features/site/components/PageHeading';
import { outlineButton } from '@/shared/button-classes';
import { getErrorMessage } from '@/lib/get-error-message';

import { useCatalogMovies } from '../hooks/use-catalog';
import { SoonCard } from './SoonCard';

const block = 'animate-pulse bg-white/5';

export function SoonView() {
  const query = useCatalogMovies();
  const [now] = useState(() => Date.now());
  const [trailer, setTrailer] = useState<Movie | null>(null);

  const movies = useMemo(
    () =>
      (query.data ?? [])
        .filter((movie) => movie.releaseDate && new Date(movie.releaseDate).getTime() > now)
        .sort(
          (a, b) =>
            new Date(a.releaseDate as string).getTime() - new Date(b.releaseDate as string).getTime(),
        ),
    [query.data, now],
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-8">
      <PageHeading>Скоро у кіно</PageHeading>

      <div className="mt-12">
        {query.isPending ? (
          <div aria-hidden="true" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className={`${block} aspect-[2/3]`} />
            ))}
          </div>
        ) : query.isError ? (
          <div role="alert" className="border border-dashed border-[#2A2A2A] px-6 py-16 text-center">
            <p className="text-sm text-[#A8A8A8]">
              {getErrorMessage(query.error, 'Не вдалося завантажити фільми.')}
            </p>
            <button type="button" onClick={() => void query.refetch()} className={`mt-6 ${outlineButton}`}>
              Спробувати ще раз
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="border border-dashed border-[#2A2A2A] px-6 py-16 text-center">
            <p className="text-sm text-[#A8A8A8]">Анонсів поки немає.</p>
            <Link href="/schedule" className={`mt-6 inline-block ${outlineButton}`}>
              Найближчий сеанс
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {movies.map((movie) => (
              <SoonCard key={movie.id} movie={movie} onTrailer={setTrailer} />
            ))}
          </ul>
        )}
      </div>

      <TrailerDialog
        title={trailer?.title ?? ''}
        embedUrl={trailer ? getYouTubeEmbedUrl(trailer.trailerUrl) : null}
        onClose={() => setTrailer(null)}
      />
    </div>
  );
}