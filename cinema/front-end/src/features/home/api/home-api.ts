import { apiClient } from '@/lib/api-client';

import type { Movie, Session } from '@/features/admin/catalog-types';

type ListResponse<T> = T[] | { items: T[] };

const unwrap = <T>(data: ListResponse<T>) =>
  Array.isArray(data) ? data : data.items;

const LIST_LIMIT = 50;

export async function getHomeMovies() {
  const { data } = await apiClient.get<ListResponse<Movie>>('/movies', {
    params: { page: 1, limit: LIST_LIMIT },
  });

  return unwrap(data);
}

export async function getHomeSessions() {
  const { data } = await apiClient.get<ListResponse<Session>>('/sessions', {
    params: { page: 1, limit: LIST_LIMIT },
  });

  return unwrap(data);
}
