import Link from 'next/link';

import { formatDuration } from '@/features/admin/lib/format';
import { movieGenres } from '@/features/admin/lib/catalog';
import type { Movie, Session } from '@/features/admin/catalog-types';

import { sessionMoment } from '../lib/sessions';
import { Poster } from './Poster'; // Переконайтеся, що шлях до Poster правильний

interface MovieCardProps {
  movie: Movie;
  next?: Session;
}

export function MovieCard({ movie, next }: MovieCardProps) {
  const genres = movieGenres(movie)
    .slice(0, 2)
    .map((genre) => genre.name)
    .join(' · ');

  return (
    <Link
      href={`/movies/${movie.id}`}
      className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#F2B544] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B0B0F]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-[#121218] ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60 group-hover:ring-[#F2B544]/50">
        <div className="h-full w-full transition duration-500 group-hover:scale-[1.04]">
          <Poster id={movie.id} title={movie.title} url={movie.posterUrl} />
        </div>

        {movie.ageRating && (
          <span className="absolute left-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur">
            {movie.ageRating}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 px-0.5">
        <h3 className="line-clamp-1 text-base font-semibold text-[#F4F4F5]">{movie.title}</h3>
        <p className="line-clamp-1 text-sm text-[#6F6F7C]">
          {[genres, formatDuration(movie.durationMin)].filter(Boolean).join(' · ')}
        </p>
        {next && (
          <p className="line-clamp-1 pt-0.5 text-sm font-medium text-[#F2B544]">
            {sessionMoment(next.startAt)}
          </p>
        )}
      </div>
    </Link>
  );
}
