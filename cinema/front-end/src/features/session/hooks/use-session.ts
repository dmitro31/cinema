'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getSession, getSessionSeats, holdSeats } from '../api/session-api';

export const useSession = (id: string) =>
  useQuery({
    queryKey: ['site', 'session', id],
    queryFn: () => getSession(id),
    staleTime: 60_000,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 404 && count < 1;
    },
  });

export const useSessionSeats = (id: string) =>
  useQuery({
    queryKey: ['site', 'session', id, 'seats'],
    queryFn: () => getSessionSeats(id),
    staleTime: 0,
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  });

export function useHoldSeats(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: holdSeats,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['site', 'session', sessionId, 'seats'] }),
  });
}