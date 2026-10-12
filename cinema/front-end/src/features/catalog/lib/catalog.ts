import type { Movie } from '@/features/admin/catalog-types';

export function genreNames(movie: Pick<Movie, 'genres'>) {
  return (movie.genres ?? [])
    .map((link) => ('genre' in link ? link.genre.name : link.name))
    .join(', ');
}

export function formatReleaseDay(value: string) {
  return new Date(value)
    .toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })
    .toUpperCase();
}

export const byStart = (a: { startAt: string }, b: { startAt: string }) =>
  new Date(a.startAt).getTime() - new Date(b.startAt).getTime();