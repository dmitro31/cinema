import type { Metadata } from 'next';

import { DashboardView } from '@/features/admin/components/DashboardView';

export const metadata: Metadata = { title: 'Дашборд' };

export default function AdminDashboardPage() {
  return <DashboardView />;
}
