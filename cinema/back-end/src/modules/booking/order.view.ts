import { toMoney } from '../../common/utils/money';

export const orderInclude = {
  session: {
    select: {
      id: true,
      startAt: true,
      endAt: true,
      movie: { select: { id: true, title: true, posterUrl: true } },
      hall: { select: { id: true, name: true } },
    },
  },
  items: {
    select: {
      seatId: true,
      price: true,
      seat: { select: { row: true, number: true, type: true } },
    },
  },
  tickets: { select: { id: true, seatId: true, qrCode: true, usedAt: true } },
} as const;

type OrderRecord = {
  id: string;
  status: string;
  total: unknown;
  expiresAt: Date;
  createdAt: Date;
  session: unknown;
  items: {
    seatId: string;
    price: unknown;
    seat: { row: number; number: number; type: string };
  }[];
  tickets: { id: string; seatId: string; qrCode: string; usedAt: Date | null }[];
};

export const toOrderView = ({ items, total, ...order }: OrderRecord) => ({
  ...order,
  total: toMoney(total),
  seats: items
    .map(({ seatId, price, seat }) => ({ seatId, price: toMoney(price), ...seat }))
    .sort((a, b) => a.row - b.row || a.number - b.number),
});