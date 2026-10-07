import { toNumber } from '@/features/admin/lib/format';
import type { Session } from '@/features/admin/catalog-types';

import type { SeatInfo, SeatType } from '../types';

export const MAX_SEATS_PER_ORDER = 10;

export function groupByRow(seats: SeatInfo[]) {
  const map = new Map<number, SeatInfo[]>();

  for (const seat of seats) {
    const list = map.get(seat.row);
    if (list) list.push(seat);
    else map.set(seat.row, [seat]);
  }

  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([row, items]) => ({
      row,
      seats: [...items].sort((a, b) => a.number - b.number),
    }));
}

export function seatPrice(session: Pick<Session, 'price' | 'vipPrice'>, type: SeatType) {
  if (type === 'VIP' && session.vipPrice != null && toNumber(session.vipPrice) > 0) {
    return toNumber(session.vipPrice);
  }

  return toNumber(session.price);
}