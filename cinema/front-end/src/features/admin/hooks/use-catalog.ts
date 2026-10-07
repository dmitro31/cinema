'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import * as api from '../api/catalog-api';
import type {
  GenrePayload,
  HallPayload,
  HallRenamePayload,
  ListQuery,
  MoviePayload,
  SessionPayload,
} from '../catalog-types';

const OPTIONS_QUERY: ListQuery = { page: 1, limit: 50 };

export function useGenres() {
  return useQuery({ queryKey: ['catalog', 'genres'], queryFn: api.getGenres });
}

export function useHalls() {
  return useQuery({ queryKey: ['catalog', 'halls'], queryFn: api.getHalls });
}

export function useMovies(query: ListQuery) {
  return useQuery({
    queryKey: ['catalog', 'movies', query],
    queryFn: () => api.getMovies(query),
    placeholderData: keepPreviousData,
  });
}

export function useMovieOptions() {
  return useQuery({
    queryKey: ['catalog', 'movies', 'options'],
    queryFn: () => api.getMovies(OPTIONS_QUERY),
    select: (page) => page.items,
  });
}

export function useSessions(query: ListQuery) {
  return useQuery({
    queryKey: ['catalog', 'sessions', query],
    queryFn: () => api.getSessions(query),
    placeholderData: keepPreviousData,
  });
}

interface CrudApi<TCreate, TUpdate> {
  create: (input: TCreate) => Promise<unknown>;
  update: (id: string, input: TUpdate) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
}

function useCrud<TCreate, TUpdate>(
  scope: string,
  crud: CrudApi<TCreate, TUpdate>,
) {
  const client = useQueryClient();

  const onSuccess = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ['catalog', scope] }),
      client.invalidateQueries({ queryKey: ['admin'] }),
    ]);
  };

  const create = useMutation({ mutationFn: crud.create, onSuccess });

  const update = useMutation({
    mutationFn: (args: { id: string; input: TUpdate }) =>
      crud.update(args.id, args.input),
    onSuccess,
  });

  const remove = useMutation({ mutationFn: crud.remove, onSuccess });

  return { create, update, remove };
}

export const useGenreMutations = () =>
  useCrud<GenrePayload, GenrePayload>('genres', {
    create: api.createGenre,
    update: api.updateGenre,
    remove: api.deleteGenre,
  });

export const useHallMutations = () =>
  useCrud<HallPayload, HallRenamePayload>('halls', {
    create: api.createHall,
    update: api.renameHall,
    remove: api.deleteHall,
  });

export const useMovieMutations = () =>
  useCrud<MoviePayload, MoviePayload>('movies', {
    create: api.createMovie,
    update: api.updateMovie,
    remove: api.deleteMovie,
  });

export const useSessionMutations = () =>
  useCrud<SessionPayload, SessionPayload>('sessions', {
    create: api.createSession,
    update: api.updateSession,
    remove: api.deleteSession,
  });

export function useValidateTicket() {
  return useMutation({ mutationFn: api.validateTicket });
}
