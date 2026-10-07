'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import * as adminApi from '../api/admin-api';
import type { OrdersQuery, PaymentsQuery, ReportParams } from '../types';

const STALE_MS = 60_000;

export function useSalesReport(params: ReportParams) {
  return useQuery({
    queryKey: ['admin', 'sales', params],
    queryFn: () => adminApi.getSalesReport(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_MS,
  });
}

export function useOccupancyReport(params: ReportParams) {
  return useQuery({
    queryKey: ['admin', 'occupancy', params],
    queryFn: () => adminApi.getOccupancyReport(params),
    placeholderData: keepPreviousData,
    staleTime: STALE_MS,
  });
}

export function useOrders(query: OrdersQuery) {
  return useQuery({
    queryKey: ['admin', 'orders', query],
    queryFn: () => adminApi.getOrders(query),
    placeholderData: keepPreviousData,
  });
}

export function usePayments(query: PaymentsQuery) {
  return useQuery({
    queryKey: ['admin', 'payments', query],
    queryFn: () => adminApi.getPayments(query),
    placeholderData: keepPreviousData,
  });
}
