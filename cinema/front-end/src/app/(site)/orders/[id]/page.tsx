import { OrderView } from '@/features/order/components/OrderView';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <OrderView id={id} />;
}