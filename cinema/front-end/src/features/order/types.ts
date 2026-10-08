import type { Money } from '@/features/admin/types';

export type OrderStatus = 'PENDING' | 'PAID' | 'REFUNDING' | 'REFUNDED' | 'CANCELLED' | 'EXPIRED';

export type SeatType = 'STANDARD' | 'VIP';

export interface OrderSeat {
  seatId: string;
  price: Money;
  row: number;
  number: number;
  type: SeatType;
}

export interface OrderTicket {
  id: string;
  seatId: string;
  qrCode: string;
  usedAt: string | null;
}

export interface Order {
  id: string;
  status: OrderStatus;
  total: Money;
  expiresAt: string;
  createdAt: string;
  session: {
    id: string;
    startAt: string;
    endAt: string;
    movie: { id: string; title: string; posterUrl: string | null };
    hall: { id: string; name: string };
  };
  seats: OrderSeat[];
  tickets: OrderTicket[];
}

export interface Checkout {
  paymentId: string;
  amount: Money;
  currency: string;
  data: string;
  signature: string;
  checkoutUrl?: string;
  url?: string;
  action?: string;
}