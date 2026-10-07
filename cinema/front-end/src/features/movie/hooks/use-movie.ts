'use client';

import { useQuery } from '@tanstack/react-query';

import { useHomeSessions } from '@/features/home/hooks/use-home';

import { getMovie } from '../api/movie-api';

export const useMovie = (id: string) =>
  useQuery({
    queryKey: ['site', 'movie', id],
    queryFn: () => getMovie(id),
    staleTime: 60_000,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 404 && count < 1;
    },
  });

export function useMovieSessions(movieId: string) {
  const query = useHomeSessions();

  return {
    ...query,
    data: query.data?.filter((session) => session.movieId === movieId),
  };
}
