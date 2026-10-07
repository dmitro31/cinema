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

function PosterImage({ id, title, url, className = '', eager }: PosterProps) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={title}
        loading={eager ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  const hue = posterHue(id);

  return (
    <div
      role="img"
      aria-label={title}
      style={{
        background: `linear-gradient(160deg, hsl(${hue} 42% 24%), hsl(${(hue + 50) % 360} 48% 9%))`,
      }}
      className={`flex h-full w-full items-end p-4 ${className}`}
    >
      <span className="min-w-0 break-words line-clamp-4 text-base font-bold leading-tight text-white/85 sm:text-lg">
        {title}
      </span>
    </div>
  );
}

export function Poster(props: PosterProps) {
  return <PosterImage key={props.url ?? 'none'} {...props} />;
}
