'use client';

import { useQuery } from '@tanstack/react-query';

import { getAllMovies } from '../api/catalog-api';

export const useCatalogMovies = () =>
  useQuery({
    queryKey: ['site', 'catalog', 'movies'],
    queryFn: getAllMovies,
    staleTime: 60_000,
  });