import Link from 'next/link';

import type { Movie, Session } from '@/features/admin/catalog-types';

import { getYouTubeEmbedUrl } from '../lib/youtube';
import { MovieMeta } from './MovieMeta';
import { Poster } from './Poster';
import { SessionChips } from './SessionChips';

interface MovieRowProps {
  movie: Movie;
  sessions: Session[];
  onTrailer: (movie: Movie) => void;
}

export function MovieRow({ movie, sessions, onTrailer }: MovieRowProps) {
  const hasTrailer = getYouTubeEmbedUrl(movie.trailerUrl) !== null;

  return (
    <article className="flex border border-[#242424] bg-[#101010]">
      <Link
        href={`/movies/${movie.id}`}
        aria-label={movie.title}
        className="block w-[34%] max-w-[260px] shrink-0 self-stretch outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D9AE4E]"
      >
        <div className="relative h-full min-h-[240px]">
          <div className="absolute inset-0">
            <Poster id={movie.id} title={movie.title} url={movie.posterUrl} />
          </div>
        </div>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold uppercase leading-tight tracking-wide text-white sm:text-2xl">
            <Link href={`/movies/${movie.id}`} className="outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]">
              {movie.title}
            </Link>
          </h3>
          <MovieMeta movie={movie} />
        </div>

        <SessionChips sessions={sessions} />

        <p className="mt-auto line-clamp-3 border-t border-[#242424] pt-4 text-sm leading-relaxed text-[#A8A8A8]">
          {movie.description}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {hasTrailer ? (
            <button
              type="button"
              onClick={() => onTrailer(movie)}
              className="border border-[#D9AE4E] px-3 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E]/10 focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
            >
              Трейлер
            </button>
          ) : (
            <span />
          )}
          <Link
            href={`/movies/${movie.id}`}
            className="bg-[#D9AE4E] px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-2 focus-visible:ring-[#E8C46A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#101010]"
          >
            Більше
          </Link>
        </div>
      </div>
    </article>
  );
}
