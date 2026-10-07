'use client';

import { useState } from 'react';

import type { Movie } from '@/features/admin/catalog-types';

import { posterHue } from '../lib/movies';
import { getYouTubeThumbnail } from '../lib/youtube';

export function Backdrop({ movie, active }: { movie: Movie; active: boolean }) {
  const thumbnail = getYouTubeThumbnail(movie.trailerUrl);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const hue = posterHue(movie.id);

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0'}`}
    >
      {thumbnail && !thumbnailFailed ? (
        <img
          src={thumbnail}
          alt=""
          loading={active ? 'eager' : 'lazy'}
          onError={() => setThumbnailFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : movie.posterUrl ? (
        <img src={movie.posterUrl} alt="" className="h-full w-full scale-125 object-cover opacity-50 blur-2xl" />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 35% 16%), #0A0A0A 70%)`,
          }}
        />
      )}
    </div>
  );
}
