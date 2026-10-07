import type { Metadata } from 'next';

import { GenresView } from '@/features/admin/components/GenresView';

export const metadata: Metadata = { title: 'Жанри' };

export default function AdminGenresPage() {
  return <GenresView />;
}
