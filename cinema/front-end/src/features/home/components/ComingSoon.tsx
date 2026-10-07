import Link from 'next/link';

import { formatDate } from '@/features/admin/lib/format';
import type { Movie } from '@/features/admin/catalog-types';

import { Poster } from './Poster';

export function ComingSoon({ movies }: { movies: Movie[] }) {
  if (movies.length === 0) return null;

  return (
    <section id="soon" aria-labelledby="soon-title" className="mx-auto max-w-[1400px] scroll-mt-20 px-4 pt-20 sm:px-8">
      <h2 id="soon-title" className="text-2xl font-bold uppercase tracking-[0.18em] sm:text-3xl">
        Скоро в кіно
      </h2>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((movie) => (
          <Link
            key={movie.id}
            href={`/movies/${movie.id}`}
            className="group block outline-none focus-visible:ring-2 focus-visible:ring-[#D9AE4E] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0A0A0A]"
          >
            <div className="aspect-[2/3] overflow-hidden border border-[#242424] transition group-hover:border-[#D9AE4E]">
              <Poster id={movie.id} title={movie.title} url={movie.posterUrl} />
            </div>
            <h3 className="mt-3 line-clamp-2 text-sm font-bold uppercase tracking-wide">{movie.title}</h3>
            {movie.releaseDate && (
              <p className="mt-1 text-xs uppercase tracking-wide text-[#8C8C8C]">
                {formatDate(movie.releaseDate)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
