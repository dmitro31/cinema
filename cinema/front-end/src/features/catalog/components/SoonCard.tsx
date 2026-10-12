import Link from 'next/link';
import type { SVGProps } from 'react';

import type { Movie } from '@/features/admin/catalog-types';
import { Poster } from '@/features/home/components/Poster';
import { getYouTubeEmbedUrl } from '@/features/home/lib/youtube';
import { PlayIcon } from '@/features/site/components/icons';

import { formatReleaseDay } from '../lib/catalog';

function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9.5" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="12" y1="7.5" x2="12.01" y2="7.5" />
    </svg>
  );
}

const iconButton =
  'flex size-11 items-center justify-center text-[#A8A8A8] outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E] focus-visible:ring-2 focus-visible:ring-[#D9AE4E]';

interface SoonCardProps {
  movie: Movie;
  onTrailer: (movie: Movie) => void;
}

export function SoonCard({ movie, onTrailer }: SoonCardProps) {
  const hasTrailer = Boolean(getYouTubeEmbedUrl(movie.trailerUrl));

  return (
    <li className="flex flex-col overflow-hidden border border-[#242424] bg-[#101010]">
      <Link
        href={`/movies/${movie.id}`}
        aria-label={movie.title}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D9AE4E]"
      >
        <div className="aspect-[2/3]">
          <Poster id={movie.id} title={movie.title} url={movie.posterUrl} />
        </div>
        {movie.releaseDate && (
          <p className="bg-[#D9AE4E] py-4 text-center text-sm font-bold uppercase tracking-[0.2em] text-[#14110A]">
            {formatReleaseDay(movie.releaseDate)}
          </p>
        )}
      </Link>

      <div className="flex items-center justify-center gap-10 py-3">
        <Link href={`/movies/${movie.id}`} aria-label={`Детальніше: ${movie.title}`} className={iconButton}>
          <InfoIcon width={24} height={24} />
        </Link>
        {hasTrailer && (
          <button
            type="button"
            aria-label={`Трейлер: ${movie.title}`}
            onClick={() => onTrailer(movie)}
            className={iconButton}
          >
            <PlayIcon width={20} height={20} />
          </button>
        )}
      </div>
    </li>
  );
}