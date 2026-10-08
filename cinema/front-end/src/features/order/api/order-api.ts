import { apiClient } from '@/lib/api-client';

import type { Checkout, Order } from '../types';

export async function getOrder(id: string) {
  const { data } = await apiClient.get<Order>(`/booking/orders/${id}`);
  return data;
}

export async function cancelOrder(id: string) {
  await apiClient.delete(`/booking/orders/${id}`);
}

export async function devPayOrder(id: string) {
  const { data } = await apiClient.post<Order>(`/booking/orders/${id}/dev-pay`);
  return data;
}

export async function createCheckout(orderId: string) {
  const { data } = await apiClient.post<Checkout>('/payments/checkout', { orderId });
  return data;
}

export async function refundOrder(orderId: string) {
  await apiClient.post(`/payments/orders/${orderId}/refund`);
}