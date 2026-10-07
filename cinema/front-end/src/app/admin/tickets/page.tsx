import type { Metadata } from 'next';

import { TicketValidatorView } from '@/features/admin/components/TicketValidatorView';

export const metadata: Metadata = { title: 'Перевірка квитків' };

export default function AdminTicketsPage() {
  return <TicketValidatorView />;
}
