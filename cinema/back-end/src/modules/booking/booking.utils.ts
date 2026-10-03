import { toCents } from '../../common/utils/money';

export const seatPriceCents = (
  session: { price: unknown; vipPrice: unknown },
  type: string,
): number =>
  toCents(
    type === 'VIP' && session.vipPrice !== null && session.vipPrice !== undefined
      ? session.vipPrice
      : session.price,
  );