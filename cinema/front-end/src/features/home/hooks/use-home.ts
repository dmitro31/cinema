'use client';

import { useQuery } from '@tanstack/react-query';

import { getHomeMovies, getHomeSessions } from '../api/home-api';

const STALE_TIME = 60_000;

export const useHomeMovies = () =>
  useQuery({
    queryKey: ['site', 'movies'],
    queryFn: getHomeMovies,
    staleTime: STALE_TIME,
  });

export const useHomeSessions = () =>
  useQuery({
    queryKey: ['site', 'sessions'],
    queryFn: getHomeSessions,
    staleTime: STALE_TIME,
    select: (sessions) =>
      [...sessions].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
  });
