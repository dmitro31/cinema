import { apiClient } from '@/lib/api-client';

import type {
  AdminOrder,
  AdminPayment,
  OccupancyReport,
  OrdersQuery,
  Page,
  PaymentsQuery,
  ReportParams,
  SalesReport,
} from '../types';

export async function getSalesReport(params: ReportParams) {
  const { data } = await apiClient.get<SalesReport>('/admin/reports/sales', {
    params,
  });

  return data;
}

export async function getOccupancyReport(params: ReportParams) {
  const { data } = await apiClient.get<OccupancyReport>(
    '/admin/reports/occupancy',
    { params },
  );

  return data;
}

export async function getOrders(query: OrdersQuery) {
  const { data } = await apiClient.get<Page<AdminOrder>>('/admin/orders', {
    params: query,
  });

  return data;
}

export async function getPayments(query: PaymentsQuery) {
  const { data } = await apiClient.get<Page<AdminPayment>>('/admin/payments', {
    params: query,
  });

  return data;
}
