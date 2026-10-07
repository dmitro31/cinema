'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import { getErrorMessage } from '@/lib/get-error-message';

import { ErrorState } from './ui';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}

export function QueryBoundary<T>({
  query,
  skeleton,
  children,
}: QueryBoundaryProps<T>) {
  if (query.isPending) {
    return <>{skeleton}</>;
  }

  if (query.isError) {
    return (
      <ErrorState
        message={getErrorMessage(query.error, 'Не вдалося завантажити дані.')}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div
      className={`transition-opacity ${
        query.isPlaceholderData ? 'opacity-60' : ''
      }`}
    >
      {children(query.data)}
    </div>
  );
}
