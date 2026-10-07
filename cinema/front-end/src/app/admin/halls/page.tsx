import type { Metadata } from 'next';

import { HallsView } from '@/features/admin/components/HallsView';

export const metadata: Metadata = { title: 'Зали' };

export default function AdminHallsPage() {
  return <HallsView />;
}
