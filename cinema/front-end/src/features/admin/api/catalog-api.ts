import { apiClient } from '@/lib/api-client';

import type {
  Genre,
  GenrePayload,
  Hall,
  HallPayload,
  HallRenamePayload,
  ListQuery,
  Movie,
  MoviePayload,
  Session,
  SessionPayload,
} from '../catalog-types';
import type { Page } from '../types';

type ListResponse<T> = T[] | Page<T>;

function toItems<T>(data: ListResponse<T>): T[] {
  return Array.isArray(data) ? data : data.items;
}

function toPage<T>(data: ListResponse<T>, query: ListQuery): Page<T> {
  if (!Array.isArray(data)) return data;

  const start = (query.page - 1) * query.limit;

  return {
    items: data.slice(start, start + query.limit),
    total: data.length,
    page: query.page,
    limit: query.limit,
  };
}

export async function getGenres() {
  const { data } = await apiClient.get<ListResponse<Genre>>('/genres');
  return toItems(data);
}

export const createGenre = (payload: GenrePayload) =>
  apiClient.post<Genre>('/genres', payload);

export const updateGenre = (id: string, payload: GenrePayload) =>
  apiClient.patch<Genre>(`/genres/${id}`, payload);

export const deleteGenre = (id: string) => apiClient.delete(`/genres/${id}`);

export async function getHalls() {
  const { data } = await apiClient.get<ListResponse<Hall>>('/halls');
  return toItems(data);
}

export const createHall = (payload: HallPayload) =>
  apiClient.post<Hall>('/halls', payload);

export const renameHall = (id: string, payload: HallRenamePayload) =>
  apiClient.patch<Hall>(`/halls/${id}`, payload);

export const deleteHall = (id: string) => apiClient.delete(`/halls/${id}`);

export async function getMovies(query: ListQuery) {
  const { data } = await apiClient.get<ListResponse<Movie>>('/movies', {
    params: query,
  });

  return toPage(data, query);
}

export const createMovie = (payload: MoviePayload) =>
  apiClient.post<Movie>('/movies', payload);

export const updateMovie = (id: string, payload: MoviePayload) =>
  apiClient.patch<Movie>(`/movies/${id}`, payload);

export const deleteMovie = (id: string) => apiClient.delete(`/movies/${id}`);

export async function getSessions(query: ListQuery) {
  const { data } = await apiClient.get<ListResponse<Session>>('/sessions', {
    params: query,
  });

  return toPage(data, query);
}

export const createSession = (payload: SessionPayload) =>
  apiClient.post<Session>('/sessions', payload);

export const updateSession = (id: string, payload: SessionPayload) =>
  apiClient.patch<Session>(`/sessions/${id}`, payload);

export const deleteSession = (id: string) => apiClient.delete(`/sessions/${id}`);

export async function validateTicket(code: string) {
  const { data } = await apiClient.post<unknown>('/tickets/validate', { code });
  return data;
}
