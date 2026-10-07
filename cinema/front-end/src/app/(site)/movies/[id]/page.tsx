import type { Metadata } from 'next';

import { MovieView } from '@/features/movie/components/MovieView';

export const metadata: Metadata = { title: 'Фільм · Cinema' };

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <MovieView id={id} />;
}
