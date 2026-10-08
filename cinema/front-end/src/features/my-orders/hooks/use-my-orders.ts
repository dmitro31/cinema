'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getMyOrders } from '../api/my-orders-api';
import type { OrdersParams } from '../types';

export const useMyOrders = (params: OrdersParams) =>
  useQuery({
    queryKey: ['site', 'orders', params.page, params.limit, params.status ?? 'ALL'],
    queryFn: () => getMyOrders(params),
    placeholderData: keepPreviousData,
    retry: (count, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return !(status === 401 || status === 403) && count < 1;
    },
  });