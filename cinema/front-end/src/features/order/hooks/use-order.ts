'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelOrder, createCheckout, devPayOrder, getOrder, refundOrder } from '../api/order-api';

export const orderKey = (id: string) => ['site', 'order', id] as const;

const ordersKey = ['site', 'orders'] as const;

const seatsKey = (sessionId: string) => ['site', 'session', sessionId, 'seats'] as const;

export const useOrder = (id: string) =>
  useQuery({
    queryKey: orderKey(id),
    queryFn: () => getOrder(id),
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return !(status === 401 || status === 403 || status === 404) && count < 1;
    },
    refetchInterval: (query) => {
      const order = query.state.data;
      if (!order) return false;
      if (order.status === 'REFUNDING') return 3_000;
      if (order.status !== 'PENDING') return false;
      return new Date(order.expiresAt).getTime() > Date.now() ? 3_000 : false;
    },
  });

export function useCheckout() {
  return useMutation({ mutationFn: createCheckout });
}

export function useCancelOrder(orderId: string, sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKey(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersKey }),
        queryClient.invalidateQueries({ queryKey: seatsKey(sessionId) }),
      ]),
  });
}

export function useDevPay(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => devPayOrder(orderId),
    onSuccess: async (order) => {
      queryClient.setQueryData(orderKey(orderId), order);
      await queryClient.invalidateQueries({ queryKey: ordersKey });
    },
  });
}

export function useRefundOrder(orderId: string, sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refundOrder(orderId),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: orderKey(orderId) }),
        queryClient.invalidateQueries({ queryKey: ordersKey }),
        queryClient.invalidateQueries({ queryKey: seatsKey(sessionId) }),
      ]),
  });
}