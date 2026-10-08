import { apiClient } from '@/lib/api-client';

import type { OrdersPage, OrdersParams } from '../types';

export async function getMyOrders({ page, limit, status }: OrdersParams) {
  const { data } = await apiClient.get<OrdersPage>('/booking/orders', {
    params: { page, limit, ...(status ? { status } : {}) },
  });
  return data;
}