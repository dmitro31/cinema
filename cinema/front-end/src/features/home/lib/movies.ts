import { movieGenres } from '@/features/admin/lib/catalog';
import type { Genre, Movie, Session } from '@/features/admin/catalog-types';

export function collectGenres(movies: Movie[]) {
  const map = new Map<string, Genre>();

  for (const movie of movies) {
    for (const genre of movieGenres(movie)) map.set(genre.id, genre);
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'uk'));
}

export const hasGenre = (movie: Movie, genreId: string) =>
  movieGenres(movie).some((genre) => genre.id === genreId);

export function pickFeatured(movies: Movie[], next: Map<string, Session>) {
  const score = (movie: Movie) =>
    (movie.posterUrl ? 2 : 0) +
    (movie.trailerUrl ? 1 : 0) +
    (next.has(movie.id) ? 2 : 0);

  return [...movies].sort((a, b) => score(b) - score(a)).slice(0, 4);
}

export function releaseYear(movie: Movie) {
  if (!movie.releaseDate) return null;
  const year = new Date(movie.releaseDate).getFullYear();
  return Number.isNaN(year) ? null : year;
}

export function posterHue(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}
