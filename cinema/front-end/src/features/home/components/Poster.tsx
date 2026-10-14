'use client';

import { useState } from 'react';
import { posterHue } from '../lib/movies';

interface PosterProps {
  id: string;
  title: string;
  url: string | null;
  className?: string;
  eager?: boolean;
}

function PosterImage({
  id,
  title,
  url,
  className = '',
  eager = false,
}: PosterProps) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={title}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        className={`block h-full w-full object-cover ${className}`}
      />
    );
  }

  const hue = posterHue(id);

  return (
    <div
      role="img"
      aria-label={title}
      style={{
        background: `linear-gradient(
          160deg,
          hsl(${hue} 42% 24%),
          hsl(${(hue + 50) % 360} 48% 9%)
        )`,
      }}
      className={`flex h-full w-full items-end overflow-hidden p-2 sm:p-3 md:p-4 ${className}`}
    >
      <span className="line-clamp-4 min-w-0 break-words text-sm font-bold leading-tight text-white/85 sm:text-base md:text-lg">
        {title}
      </span>
    </div>
  );
}

export function Poster(props: PosterProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-neutral-900"
      style={{ aspectRatio: '2 / 3' }}
    >
      <PosterImage key={props.url ?? 'none'} {...props} />
    </div>
  );
}
