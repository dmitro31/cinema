'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useMemo, useState } from 'react';

import { formatDate, formatMoney, formatTime } from '@/features/admin/lib/format';
import { Poster } from '@/features/home/components/Poster';
import { isUpcoming } from '@/features/home/lib/sessions';
import { getErrorMessage } from '@/lib/get-error-message';

import { useHoldSeats, useSession, useSessionSeats } from '../hooks/use-session'
import { MAX_SEATS_PER_ORDER, seatPrice } from '../lib/seats';
import { SeatMap } from './SeatMap';

const block = 'animate-pulse bg-white/5';

const outlineButton =
  'border border-[#D9AE4E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E]/10 focus-visible:ring-2 focus-visible:ring-[#D9AE4E]';

function Message({ title, text, onRetry }: { title: string; text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-4 py-40 text-center">
      <h1 className="text-2xl font-bold uppercase tracking-[0.18em]">{title}</h1>
      <p className="text-sm text-[#A8A8A8]">{text}</p>
      <div className="mt-2 flex gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className={outlineButton}>
            Спробувати ще раз
          </button>
        )}
        <Link
          href="/"
          className="bg-[#D9AE4E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-2 focus-visible:ring-[#E8C46A]"
        >
          На головну
        </Link>
      </div>
    </div>
  );
}

export function SessionView({ id }: { id: string }) {
  const router = useRouter();
  const sessionQuery = useSession(id);
  const seatsQuery = useSessionSeats(id);
  const hold = useHoldSeats(id);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [holdError, setHoldError] = useState<string | null>(null);

  const seats = seatsQuery.data?.seats;

  const effectiveSelected = useMemo(() => {
    if (!seats) return [];
    const free = new Set(seats.filter((seat) => seat.status === 'FREE').map((seat) => seat.id));
    return selectedIds.filter((seatId) => free.has(seatId));
  }, [seats, selectedIds]);

  const selectedSeats = useMemo(() => {
    if (!seats) return [];
    const chosen = new Set(effectiveSelected);
    return seats
      .filter((seat) => chosen.has(seat.id))
      .sort((a, b) => a.row - b.row || a.number - b.number);
  }, [seats, effectiveSelected]);

  if (sessionQuery.isPending) {
    return (
      <div aria-hidden="true" className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-8">
        <div className={`${block} h-6 w-64`} />
        <div className={`${block} mt-6 h-12 w-1/2`} />
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className={`${block} h-[28rem]`} />
          <div className={`${block} h-[28rem]`} />
        </div>
      </div>
    );
  }

  if (sessionQuery.isError) {
    const notFound = isAxiosError(sessionQuery.error) && sessionQuery.error.response?.status === 404;

    return notFound ? (
      <Message title="Сеанс не знайдено" text="Можливо, його вже скасували." />
    ) : (
      <Message
        title="Не вдалося завантажити"
        text={getErrorMessage(sessionQuery.error, 'Спробуйте ще раз трохи пізніше.')}
        onRetry={() => void sessionQuery.refetch()}
      />
    );
  }

  const session = sessionQuery.data;
  const upcoming = isUpcoming(session);
  const total = selectedSeats.reduce((sum, seat) => sum + seatPrice(session, seat.type), 0);

  const toggle = (seatId: string) => {
    setHoldError(null);

    if (effectiveSelected.includes(seatId)) {
      setSelectedIds(effectiveSelected.filter((item) => item !== seatId));
      return;
    }

    if (effectiveSelected.length >= MAX_SEATS_PER_ORDER) return;
    setSelectedIds([...effectiveSelected, seatId]);
  };

  const submit = () => {
    setHoldError(null);

    hold.mutate(
      { sessionId: id, seatIds: effectiveSelected },
      {
        onSuccess: (order) => router.push(`/orders/${order.id}`),
        onError: (error) => {
          if (isAxiosError(error) && error.response?.status === 401) {
            router.push(`/login?next=${encodeURIComponent(`/sessions/${id}`)}`);
            return;
          }
          setHoldError(getErrorMessage(error, 'Не вдалося забронювати місця.'));
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-20 pt-28 sm:px-8">
      <nav aria-label="Навігація" className="mb-6 text-xs uppercase tracking-[0.2em] text-[#8C8C8C]">
        <Link href="/#schedule" className="outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]">
          Афіша
        </Link>
        <span className="mx-3" aria-hidden="true">/</span>
        <Link
          href={`/movies/${session.movie.id}`}
          className="outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]"
        >
          {session.movie.title}
        </Link>
        <span className="mx-3" aria-hidden="true">/</span>
        <span aria-current="page" className="text-[#D8D8D8]">Вибір місць</span>
      </nav>

      <h1 className="text-balance text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl">
        {session.movie.title}
      </h1>
      <p className="mt-3 text-sm text-[#A8A8A8]">
        {formatDate(session.startAt)} · {formatTime(session.startAt)} · {session.hall.name}
      </p>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_360px]">
        <section aria-label="Схема залу" className="border border-[#242424] bg-[#0E0E0E] px-3 py-8 sm:px-6">
          {seatsQuery.isPending ? (
            <div aria-hidden="true" className={`${block} h-96`} />
          ) : seatsQuery.isError ? (
            <div role="alert" className="px-6 py-16 text-center">
              <p className="text-sm text-[#A8A8A8]">
                {getErrorMessage(seatsQuery.error, 'Не вдалося завантажити схему залу.')}
              </p>
              <button type="button" onClick={() => void seatsQuery.refetch()} className={`mt-6 ${outlineButton}`}>
                Спробувати ще раз
              </button>
            </div>
          ) : (
            <SeatMap
              seats={seatsQuery.data.seats}
              selected={effectiveSelected}
              onToggle={toggle}
              disabled={!upcoming || hold.isPending}
            />
          )}
        </section>

        <aside aria-label="Ваше замовлення" className="border border-[#242424] bg-[#101010] p-6 lg:sticky lg:top-24">
          <div className="flex gap-4">
            <div className="w-20 shrink-0 border border-[#2A2A2A]">
              <div className="aspect-[2/3]">
                <Poster id={session.movie.id} title={session.movie.title} url={session.movie.posterUrl} />
              </div>
            </div>
            <div className="min-w-0 text-sm">
              <p className="break-words font-bold uppercase tracking-[0.12em]">{session.movie.title}</p>
              <p className="mt-2 text-[#A8A8A8]">{formatDate(session.startAt)}</p>
              <p className="text-[#A8A8A8]">
                {formatTime(session.startAt)} – {formatTime(session.endAt)}
              </p>
              <p className="text-[#A8A8A8]">{session.hall.name}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-[#242424] pt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">Обрані місця</h2>

            {selectedSeats.length === 0 ? (
              <p className="mt-4 text-sm text-[#8C8C8C]">Оберіть місця на схемі залу.</p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm">
                {selectedSeats.map((seat) => (
                  <li key={seat.id} className="flex items-center justify-between gap-4">
                    <span>
                      Ряд {seat.row} · Місце {seat.number}
                      {seat.type === 'VIP' && <span className="ml-2 text-xs text-[#D9AE4E]">VIP</span>}
                    </span>
                    <span className="tabular-nums text-[#CFCFCF]">
                      {formatMoney(seatPrice(session, seat.type).toFixed(2))}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-xs text-[#6A6A6A]">
              Обрано {selectedSeats.length} з {MAX_SEATS_PER_ORDER}
            </p>
          </div>

          <div className="mt-6 flex items-baseline justify-between border-t border-[#242424] pt-6">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C8C8C]">Разом</span>
            <span className="text-2xl font-bold tabular-nums">{formatMoney(total.toFixed(2))}</span>
          </div>

          {holdError && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {holdError}
            </p>
          )}

          {!upcoming && <p className="mt-4 text-sm text-[#A8A8A8]">Сеанс уже розпочався.</p>}

          <button
            type="button"
            onClick={submit}
            disabled={!upcoming || selectedSeats.length === 0 || hold.isPending}
            className="mt-6 w-full bg-[#D9AE4E] px-8 py-4 text-sm font-bold uppercase tracking-[0.22em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-4 focus-visible:ring-[#D9AE4E]/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#D9AE4E]"
          >
            {hold.isPending ? 'Бронюємо…' : 'Забронювати'}
          </button>

          <p className="mt-4 text-center text-xs text-[#6A6A6A]">Місця утримуються 10 хвилин для оплати.</p>
        </aside>
      </div>
    </div>
  );
}