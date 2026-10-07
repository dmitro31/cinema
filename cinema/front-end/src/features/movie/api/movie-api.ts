import { apiClient } from '@/lib/api-client';

import type { Movie } from '@/features/admin/catalog-types';

export async function getMovie(id: string) {
  const { data } = await apiClient.get<Movie>(`/movies/${id}`);
  return data;
}
