import { formatTime } from '@/features/admin/lib/format';
import type { Session } from '@/features/admin/catalog-types';

const DAY_MS = 86_400_000;

const keyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const labelFormatter = new Intl.DateTimeFormat('uk-UA', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

export const dayKey = (iso: string | number) => keyFormatter.format(new Date(iso));

export const todayKey = () => dayKey(Date.now());

export function dayLabel(key: string) {
  const now = Date.now();

  if (key === dayKey(now)) return 'Сьогодні';
  if (key === dayKey(now + DAY_MS)) return 'Завтра';

  return labelFormatter.format(new Date(`${key}T12:00:00`));
}

export const sessionMoment = (iso: string) =>
  `${dayLabel(dayKey(iso))}, ${formatTime(iso)}`;

export const isUpcoming = (session: Session) =>
  new Date(session.startAt).getTime() > Date.now();

export function sessionDays(sessions: Session[], max = 7) {
  const today = todayKey();
  const days = new Set<string>();

  for (const session of sessions) {
    const key = dayKey(session.startAt);
    if (key >= today) days.add(key);
  }

  return [...days].sort().slice(0, max);
}

export function sessionsOfDay(sessions: Session[], day: string) {
  const byMovie = new Map<string, Session[]>();

  for (const session of sessions) {
    if (dayKey(session.startAt) !== day) continue;
    const bucket = byMovie.get(session.movieId);

    if (bucket) bucket.push(session);
    else byMovie.set(session.movieId, [session]);
  }

  return byMovie;
}

export function nextSessionByMovie(sessions: Session[]) {
  const result = new Map<string, Session>();

  for (const session of sessions) {
    if (isUpcoming(session) && !result.has(session.movieId)) {
      result.set(session.movieId, session);
    }
  }

  return result;
}

export function heroSessions(sessions: Session[], movieId: string) {
  const mine = sessions.filter((session) => session.movieId === movieId);
  const first = mine.find(isUpcoming);

  if (!first) return { day: null, items: [] as Session[] };

  const day = dayKey(first.startAt);

  return { day, items: mine.filter((session) => dayKey(session.startAt) === day) };
}
