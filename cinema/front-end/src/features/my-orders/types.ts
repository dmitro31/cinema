import type { Order, OrderStatus } from '@/features/order/types';

export interface OrdersPage {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersParams {
  page: number;
  limit: number;
  status?: OrderStatus;
}