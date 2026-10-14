'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { useCatalogMovies } from '@/features/catalog/hooks/use-catalog';
import { genreNames } from '@/features/catalog/lib/catalog';
import { getYouTubeId } from '@/features/catalog/lib/youtube-id';

const ROTATE_MS = 25_000;
const MAX_TRAILERS = 5;

interface PanelTrailer {
  id: string;
  youtubeId: string;
  title: string;
  meta: string;
}

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

const toTime = (value: string | null) => (value ? new Date(value).getTime() : 0);

export function TrailerPanel() {
  const query = useCatalogMovies();
  const [index, setIndex] = useState(0);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const canPlay = isDesktop && !reducedMotion;

  const trailers = useMemo<PanelTrailer[]>(() => {
    const list: PanelTrailer[] = [];
    const seen = new Set<string>();
    const sorted = [...(query.data ?? [])].sort((a, b) => toTime(b.releaseDate) - toTime(a.releaseDate));

    for (const movie of sorted) {
      const youtubeId = getYouTubeId(movie.trailerUrl);
      if (!youtubeId || seen.has(youtubeId)) continue;

      seen.add(youtubeId);
      list.push({
        id: movie.id,
        youtubeId,
        title: movie.title,
        meta: [movie.ageRating, `${movie.durationMin} хв`, genreNames(movie)]
          .filter(Boolean)
          .join(' · '),
      });

      if (list.length === MAX_TRAILERS) break;
    }

    return list;
  }, [query.data]);

  const trailer = trailers.length > 0 ? trailers[index % trailers.length] : undefined;

  useEffect(() => {
    if (!canPlay || trailers.length < 2) return;

    const timer = setTimeout(() => {
      setIndex((prev) => (prev + 1) % trailers.length);
    }, ROTATE_MS);

    return () => clearTimeout(timer);
  }, [index, canPlay, trailers.length]);

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-[#262631] bg-[radial-gradient(circle_at_30%_20%,#1D1D27,#0E0E13_70%)] [container-type:size]">
      {canPlay && trailer && (
        <iframe
          key={trailer.id}
          src={buildSrc(trailer.youtubeId)}
          title={trailer.title}
          allow="autoplay; encrypted-media"
          tabIndex={-1}
          aria-hidden="true"
          onLoad={() => setLoadedId(trailer.id)}
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-700 ${
            loadedId === trailer.id ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/40 to-[#0B0B0F]/30" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/60 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-8">
        {query.isPending ? (
          <div aria-hidden="true" className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-10 w-72 animate-pulse rounded bg-white/10" />
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-[#F2B544]">{trailer ? trailer.meta : 'Афіша та квитки'}</p>

            <h2 className="mt-2 max-w-md text-4xl font-bold leading-tight tracking-tight text-white">
              {trailer ? trailer.title : 'Cinema'}
            </h2>
          </>
        )}

        <p className="mt-3 max-w-sm text-sm leading-6 text-[#B8B8C4]">
          Увійдіть, щоб обрати найкращі місця та придбати квитки за кілька кліків.
        </p>

        {trailers.length > 1 && (
          <div className="mt-7 flex items-center gap-2">
            {trailers.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Трейлер: ${item.title}`}
                aria-current={i === index % trailers.length}
                className={`h-1.5 rounded-full transition-all ${
                  i === index % trailers.length ? 'w-10 bg-[#F2B544]' : 'w-2.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}