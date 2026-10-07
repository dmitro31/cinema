import type { Metadata } from 'next';

import { SessionsView } from '@/features/admin/components/SessionsView';

export const metadata: Metadata = { title: 'Сеанси' };

export default function AdminSessionsPage() {
  return <SessionsView />;
}
