import { formatDuration } from '@/features/admin/lib/format';
import { movieGenres } from '@/features/admin/lib/catalog';
import type { Movie } from '@/features/admin/catalog-types';

interface MovieMetaProps {
  movie: Movie;
  badge?: boolean;
  className?: string;
}

const Divider = () => <span className="h-4 w-px bg-[#3A3A3A]" aria-hidden="true" />;

export function MovieMeta({ movie, badge, className = '' }: MovieMetaProps) {
  const genres = movieGenres(movie)
    .map((genre) => genre.name)
    .join(', ');

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-sm uppercase tracking-wide text-[#A8A8A8] ${className}`}>
      {movie.ageRating &&
        (badge ? (
          <span className="bg-[#D9AE4E] px-2 py-1 text-sm font-bold leading-none text-[#14110A]">
            {movie.ageRating}
          </span>
        ) : (
          <span>{movie.ageRating}</span>
        ))}
      {movie.ageRating && <Divider />}
      <span>{formatDuration(movie.durationMin)}</span>
      {genres && <Divider />}
      {genres && <span>{genres}</span>}
    </div>
  );
}
