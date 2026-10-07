import type { Metadata } from 'next';

import { MoviesView } from '@/features/admin/components/MoviesView';

export const metadata: Metadata = { title: 'Фільми' };

export default function AdminMoviesPage() {
  return <MoviesView />;
}
