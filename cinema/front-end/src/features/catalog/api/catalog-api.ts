import type { Movie } from '@/features/admin/catalog-types';
import { apiClient } from '@/lib/api-client';

interface MoviesPage {
  items: Movie[];
  total?: number;
}

const PAGE_SIZE = 20;
const MAX_PAGES = 25;

export async function getAllMovies() {
  const movies: Movie[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data } = await apiClient.get<Movie[] | MoviesPage>('/movies', {
      params: { page, limit: PAGE_SIZE },
    });

    if (Array.isArray(data)) return data;

    movies.push(...data.items);

    if (data.items.length < PAGE_SIZE) break;
    if (data.total !== undefined && movies.length >= data.total) break;
  }

  return movies;
}