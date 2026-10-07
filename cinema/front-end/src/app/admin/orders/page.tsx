import type { Metadata } from 'next';

import { OrdersView } from '@/features/admin/components/OrdersView';

export const metadata: Metadata = { title: 'Замовлення' };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>;
}) {
  const { sessionId } = await searchParams;

  return <OrdersView initialSessionId={sessionId} />;
}
