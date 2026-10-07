'use client';

import { useState } from 'react';

import type { Movie, Session } from '@/features/admin/catalog-types';

import { collectGenres, hasGenre } from '../lib/movies';
import { MovieCard } from './MovieCard';

interface NowShowingProps {
  movies: Movie[];
  nextByMovie: Map<string, Session>;
}

const chip = (active: boolean) =>
  `shrink-0 rounded-full border px-4 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[#F2B544] ${
    active
      ? 'border-[#F2B544] bg-[#F2B544] text-[#17130A]'
      : 'border-[#262631] bg-[#121218] text-[#B8B8C4] hover:border-[#3A3A48] hover:text-white'
  }`;

export function NowShowing({ movies, nextByMovie }: NowShowingProps) {
  const [genreId, setGenreId] = useState<string | null>(null);
  const genres = collectGenres(movies);
  const visible = genreId ? movies.filter((movie) => hasGenre(movie, genreId)) : movies;

  return (
    <section id="now" aria-labelledby="now-title" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14 sm:px-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="now-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Афіша
          </h2>
          <p className="mt-1 text-sm text-[#6F6F7C]">Фільмів у прокаті: {movies.length}</p>
        </div>

        {genres.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <button type="button" aria-pressed={genreId === null} onClick={() => setGenreId(null)} className={chip(genreId === null)}>
              Усі
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                aria-pressed={genreId === genre.id}
                onClick={() => setGenreId(genre.id)}
                className={chip(genreId === genre.id)}
              >
                {genre.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-[#262631] py-16 text-center text-sm text-[#6F6F7C]">
          У цьому жанрі поки немає фільмів.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((movie) => (
            <MovieCard key={movie.id} movie={movie} next={nextByMovie.get(movie.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
