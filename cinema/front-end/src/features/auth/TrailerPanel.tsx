'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

import { TRAILERS } from '@/lib/trailers';

const ROTATE_MS = 25_000;

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const buildSrc = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3`;

export function TrailerPanel() {
  const [index, setIndex] = useState(0);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const canPlay = isDesktop && !reducedMotion;

  const trailer = TRAILERS[index];

  useEffect(() => {
    if (!canPlay || TRAILERS.length < 2) return;

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % TRAILERS.length);
    }, ROTATE_MS);

    return () => clearTimeout(timer);
  }, [index, canPlay]);

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-[#262631] bg-[radial-gradient(circle_at_30%_20%,#1D1D27,#0E0E13_70%)] [container-type:size]">
      {canPlay && (
        <iframe
          key={trailer.youtubeId}
          src={buildSrc(trailer.youtubeId)}
          title={trailer.title}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          aria-hidden="true"
          onLoad={() => setLoadedId(trailer.youtubeId)}
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-700 ${
            loadedId === trailer.youtubeId ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/40 to-[#0B0B0F]/30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/60 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-8">
        <p className="text-sm font-medium text-[#F2B544]">{trailer.meta}</p>

        <h2 className="mt-2 max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
          {trailer.title}
        </h2>

        <p className="mt-3 max-w-sm text-sm leading-6 text-[#B8B8C4]">
          Увійдіть, щоб обрати найкращі місця та придбати квитки за кілька
          кліків.
        </p>

        {TRAILERS.length > 1 && (
          <div className="mt-7 flex items-center gap-2">
            {TRAILERS.map((item, i) => (
              <button
                key={item.youtubeId}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Трейлер: ${item.title}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? 'w-10 bg-[#F2B544]'
                    : 'w-2.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}