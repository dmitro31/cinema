import type { Order, OrderSeat, OrderStatus } from '@/features/order/types';

export const statusTone: Record<OrderStatus, string> = {
  PENDING: 'border-[#D9AE4E]/60 text-[#D9AE4E]',
  PAID: 'border-[#D9AE4E] bg-[#D9AE4E] text-[#14110A]',
  REFUNDING: 'border-[#6A6A6A] text-[#CFCFCF]',
  REFUNDED: 'border-[#3A3A3A] text-[#8C8C8C]',
  CANCELLED: 'border-[#3A3A3A] text-[#8C8C8C]',
  EXPIRED: 'border-[#3A3A3A] text-[#8C8C8C]',
};

export function effectiveStatus(order: Pick<Order, 'status' | 'expiresAt'>, now: number): OrderStatus {
  if (order.status === 'PENDING' && new Date(order.expiresAt).getTime() <= now) return 'EXPIRED';
  return order.status;
}

export function formatSeats(seats: OrderSeat[]) {
  const rows = new Map<number, number[]>();

  for (const seat of seats) {
    const list = rows.get(seat.row);
    if (list) list.push(seat.number);
    else rows.set(seat.row, [seat.number]);
  }

  return [...rows.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, numbers]) => `Ряд ${row} · ${[...numbers].sort((a, b) => a - b).join(', ')}`)
    .join('; ');
}