import type { Money } from './types';

export interface Genre {
  id: string;
  name: string;
}

export interface Hall {
  id: string;
  name: string;
  rows: number;
  seatsPerRow: number;
  createdAt?: string;
}

export type MovieGenreLink = Genre | { genre: Genre };

export interface Movie {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  posterUrl: string | null;
  trailerUrl: string | null;
  ageRating: string | null;
  releaseDate: string | null;
  genres?: MovieGenreLink[];
}

export interface Session {
  id: string;
  movieId: string;
  hallId: string;
  startAt: string;
  endAt: string;
  price: Money;
  vipPrice: Money | null;
  movie?: { id: string; title: string };
  hall?: { id: string; name: string };
}

export interface ListQuery {
  page: number;
  limit: number;
}

export interface GenrePayload {
  name: string;
}

export interface HallPayload {
  name: string;
  rows: number;
  seatsPerRow: number;
  vipRows?: number[];
}

export interface HallRenamePayload {
  name: string;
}

export interface MoviePayload {
  title: string;
  description: string;
  durationMin: number;
  ageRating?: string;
  posterUrl?: string;
  trailerUrl?: string;
  releaseDate?: string;
  genreIds: string[];
}

export interface SessionPayload {
  movieId: string;
  hallId: string;
  startAt: string;
  price: number;
  vipPrice?: number;
}
