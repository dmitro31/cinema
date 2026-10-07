import type { DayPoint } from '../types';

export type RangePreset = 7 | 30 | 90 | 365 | 'custom';

export interface DateRange {
  from: string;
  to: string;
  preset: RangePreset;
}

export const MAX_RANGE_DAYS = 366;
export const UPCOMING_DAYS = 7;

const DAY_MS = 86_400_000;

export const getTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export function presetRange(days: 7 | 30 | 90 | 365): DateRange {
  const to = new Date();
  const from = new Date(to.getTime() - days * DAY_MS);

  return { from: from.toISOString(), to: to.toISOString(), preset: days };
}

export function previousRange(range: { from: string; to: string }) {
  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();

  return {
    from: new Date(from - (to - from)).toISOString(),
    to: new Date(from).toISOString(),
  };
}

export function occupancyRange(range: DateRange) {
  if (range.preset === 'custom') {
    return { from: range.from, to: range.to };
  }

  const from = new Date(range.from).getTime();
  const to = new Date(range.to).getTime();
  const limit = from + MAX_RANGE_DAYS * DAY_MS - 1000;

  return {
    from: range.from,
    to: new Date(Math.min(to + UPCOMING_DAYS * DAY_MS, limit)).toISOString(),
  };
}

export function rangeLengthDays(range: { from: string; to: string }) {
  return Math.round(
    (new Date(range.to).getTime() - new Date(range.from).getTime()) / DAY_MS,
  );
}

const dayInput = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const toDateInput = (iso: string) => dayInput.format(new Date(iso));

export function customRange(
  fromDay: string,
  toDay: string,
): { range: DateRange | null; error: string | null } {
  if (!fromDay || !toDay) {
    return { range: null, error: null };
  }

  const start = new Date(`${fromDay}T00:00:00`);
  const end = new Date(`${toDay}T23:59:59.999`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { range: null, error: 'Невалідна дата' };
  }

  if (start.getTime() >= end.getTime()) {
    return { range: null, error: 'Початок має бути раніше за кінець' };
  }

  if (end.getTime() - start.getTime() > MAX_RANGE_DAYS * DAY_MS) {
    return { range: null, error: `Максимум ${MAX_RANGE_DAYS} днів` };
  }

  return {
    range: {
      from: start.toISOString(),
      to: end.toISOString(),
      preset: 'custom',
    },
    error: null,
  };
}

export function fillDays(
  items: DayPoint[],
  range: { from: string; to: string },
  timezone: string,
): DayPoint[] {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const known = new Map(items.map((item) => [item.date, item]));
  const keys: string[] = [];
  const seen = new Set<string>();
  const end = new Date(range.to).getTime();

  for (let t = new Date(range.from).getTime(); t <= end; t += DAY_MS / 2) {
    const key = formatter.format(t);

    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }

  const lastKey = formatter.format(end);

  if (!seen.has(lastKey)) {
    keys.push(lastKey);
  }

  return keys.map(
    (date) => known.get(date) ?? { date, revenue: 0, tickets: 0, orders: 0 },
  );
}
