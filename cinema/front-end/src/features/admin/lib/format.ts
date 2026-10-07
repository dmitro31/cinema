const LOCALE = 'uk-UA';

const integer = new Intl.NumberFormat(LOCALE);
const compact = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 1,
});
const signedPercent = new Intl.NumberFormat(LOCALE, {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
});
const dateTime = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const shortDay = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
});
const longDay = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const moneyFormatters = new Map<string, Intl.NumberFormat>();

export const toNumber = (value: number | string) =>
  typeof value === 'number' ? value : Number(value);

export function formatMoney(value: number | string, currency = 'UAH') {
  let formatter = moneyFormatters.get(currency);

  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    } catch {
      return `${toNumber(value)} ${currency}`;
    }

    moneyFormatters.set(currency, formatter);
  }

  return formatter.format(toNumber(value));
}

export const formatNumber = (value: number) => integer.format(value);

export const formatCompact = (value: number) => compact.format(value);

export const formatPercent = (ratio: number) => percent.format(ratio);

export const formatSignedPercent = (ratio: number) =>
  signedPercent.format(ratio);

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));

const parseDay = (day: string) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
};

export const formatDay = (day: string) => shortDay.format(parseDay(day));

export const formatLongDay = (day: string) => longDay.format(parseDay(day));

export const shortId = (id: string) => id.slice(0, 8);

export const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

const dateOnly = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeOnly = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (iso: string) => dateOnly.format(new Date(iso));

export const formatTime = (iso: string) => timeOnly.format(new Date(iso));

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return hours > 0 ? `${hours} год ${rest} хв` : `${rest} хв`;
}
