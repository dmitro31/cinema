import type { Metadata } from 'next';

import { PaymentsView } from '@/features/admin/components/PaymentsView';

export const metadata: Metadata = { title: 'Платежі' };

export default function AdminPaymentsPage() {
  return <PaymentsView />;
}
