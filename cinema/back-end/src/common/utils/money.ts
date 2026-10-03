export const toCents = (value: unknown): number => Math.round(Number(String(value)) * 100);

export const fromCents = (cents: number): number => cents / 100;

export const toMoney = (value: unknown): number => fromCents(toCents(value));