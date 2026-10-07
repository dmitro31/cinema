export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export interface StatusOption {
  value: string;
  label: string;
}

const LABELS: Record<string, string> = {
  PENDING: 'Очікує оплати',
  PAID: 'Оплачено',
  REFUNDING: 'Повернення коштів',
  REFUNDED: 'Повернено',
  CANCELLED: 'Скасовано',
  EXPIRED: 'Прострочено',
  SUCCEEDED: 'Успішно',
  FAILED: 'Помилка',
  REFUND_FAILED: 'Помилка повернення',
};

const options = (values: string[]): StatusOption[] =>
  values.map((value) => ({ value, label: LABELS[value] }));

export const ORDER_STATUS_OPTIONS = options([
  'PENDING',
  'PAID',
  'REFUNDING',
  'REFUNDED',
  'CANCELLED',
  'EXPIRED',
]);

export const PAYMENT_STATUS_OPTIONS = options([
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'REFUND_FAILED',
]);

export function getStatusMeta(status: string): {
  label: string;
  tone: StatusTone;
} {
  const key = status.toUpperCase();
  const label = LABELS[key] ?? status;

  if (/FAIL|CANCEL|EXPIR|DECLIN|REJECT|ERROR/.test(key)) {
    return { label, tone: 'danger' };
  }
  if (key === 'REFUNDING' || /PEND|PROCESS|AWAIT|CREATED|NEW|INIT/.test(key)) {
    return { label, tone: 'warning' };
  }
  if (/REFUND/.test(key)) return { label, tone: 'neutral' };
  if (/PAID|SUCC|COMPLET|CONFIRM|CAPTURE|APPROV/.test(key)) {
    return { label, tone: 'success' };
  }

  return { label, tone: 'neutral' };
}
