import type { OrderStatus } from '../types';

export const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Очікує оплати',
  PAID: 'Оплачено',
  REFUNDING: 'Повернення',
  REFUNDED: 'Кошти повернено',
  CANCELLED: 'Скасовано',
  EXPIRED: 'Час вийшов',
};

export const closedTexts: Partial<Record<OrderStatus, string>> = {
  CANCELLED: 'Ви скасували це замовлення. Місця знову доступні для вибору.',
  EXPIRED: 'Час на оплату вийшов, місця звільнено.',
  REFUNDING: 'Повернення коштів у обробці.',
  REFUNDED: 'Кошти за це замовлення повернено.',
};

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}