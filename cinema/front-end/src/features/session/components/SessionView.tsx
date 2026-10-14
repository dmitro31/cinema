'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useMemo, useState } from 'react';

import {
  formatDate,
  formatMoney,
  formatTime,
} from '@/features/admin/lib/format';
import { Poster } from '@/features/home/components/Poster';
import { isUpcoming } from '@/features/home/lib/sessions';
import { getErrorMessage } from '@/lib/get-error-message';

import {
  useHoldSeats,
  useSession,
  useSessionSeats,
} from '../hooks/use-session';
import { MAX_SEATS_PER_ORDER, seatPrice } from '../lib/seats';
import { SeatMap } from './SeatMap';

const block = 'animate-pulse bg-white/5';

const outlineButton =
  'border border-[#D9AE4E] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E]/10 focus-visible:ring-2 focus-visible:ring-[#D9AE4E] sm:px-6 sm:tracking-[0.2em]';

function Message({
  title,
  text,
  onRetry,
}: {
  title: string;
  text: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60vh] max-w-[1400px] flex-col items-center justify-center gap-4 px-4 py-20 text-center"
    >
      <h1 className="text-xl font-bold uppercase tracking-[0.12em] sm:text-2xl sm:tracking-[0.18em]">
        {title}
      </h1>

      <p className="max-w-md text-sm leading-relaxed text-[#A8A8A8]">
        {text}
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={outlineButton}
          >
            Спробувати ще раз
          </button>
        )}

        <Link
          href="/"
          className="bg-[#D9AE4E] px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-[#14110A] outline-none transition hover:bg-[#E8C46A] focus-visible:ring-2 focus-visible:ring-[#E8C46A] sm:tracking-[0.2em]"
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

    const free = new Set(
      seats
        .filter((seat) => seat.status === 'FREE')
        .map((seat) => seat.id),
    );

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
      <div
        aria-hidden="true"
        className="mx-auto max-w-[1400px] px-4 pb-20 pt-24 sm:px-8"
      >
        <div className={`${block} h-4 w-48`} />
        <div className={`${block} mt-6 h-10 w-full max-w-xl`} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          <div className={`${block} h-96 rounded`} />
          <div className={`${block} h-96 rounded`} />
        </div>
      </div>
    );
  }

  if (sessionQuery.isError) {
    const notFound =
      isAxiosError(sessionQuery.error) &&
      sessionQuery.error.response?.status === 404;

    return notFound ? (
      <Message
        title="Сеанс не знайдено"
        text="Можливо, його вже скасували."
      />
    ) : (
      <Message
        title="Не вдалося завантажити"
        text={getErrorMessage(
          sessionQuery.error,
          'Спробуйте ще раз трохи пізніше.',
        )}
        onRetry={() => void sessionQuery.refetch()}
      />
    );
  }

  const session = sessionQuery.data;
  const upcoming = isUpcoming(session);

  const total = selectedSeats.reduce(
    (sum, seat) => sum + seatPrice(session, seat.type),
    0,
  );

  const toggle = (seatId: string) => {
    setHoldError(null);

    if (effectiveSelected.includes(seatId)) {
      setSelectedIds(
        effectiveSelected.filter((item) => item !== seatId),
      );
      return;
    }

    if (effectiveSelected.length >= MAX_SEATS_PER_ORDER) return;

    setSelectedIds([...effectiveSelected, seatId]);
  };

  const submit = () => {
    if (!upcoming || effectiveSelected.length === 0 || hold.isPending) {
      return;
    }

    setHoldError(null);

    hold.mutate(
      {
        sessionId: id,
        seatIds: effectiveSelected,
      },
      {
        onSuccess: (order) => {
          router.push(`/orders/${order.id}`);
        },
        onError: (error) => {
          if (
            isAxiosError(error) &&
            error.response?.status === 401
          ) {
            router.push(
              `/login?next=${encodeURIComponent(`/sessions/${id}`)}`,
            );
            return;
          }

          setHoldError(
            getErrorMessage(error, 'Не вдалося забронювати місця.'),
          );
        },
      },
    );
  };

  return (
    <main className="mx-auto w-full min-w-0 max-w-[1400px] px-4 pb-28 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
      {/* Breadcrumbs */}
      <nav
        aria-label="Навігація"
        className="mb-6 block overflow-x-auto whitespace-nowrap text-[10px] uppercase tracking-[0.12em] text-[#8C8C8C] scrollbar-none sm:text-xs sm:tracking-[0.2em]"
      >
        <Link
          href="/#schedule"
          className="outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]"
        >
          Афіша
        </Link>

        <span className="mx-2 sm:mx-3" aria-hidden="true">
          /
        </span>

        <Link
          href={`/movies/${session.movie.id}`}
          className="outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]"
        >
          {session.movie.title}
        </Link>

        <span className="mx-2 sm:mx-3" aria-hidden="true">
          /
        </span>

        <span aria-current="page" className="text-[#D8D8D8]">
          Вибір місць
        </span>
      </nav>

      {/* Session heading */}
      <header className="min-w-0">
        <h1 className="break-words text-balance text-2xl font-bold uppercase leading-tight tracking-wide sm:text-3xl lg:text-4xl">
          {session.movie.title}
        </h1>

        <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs leading-relaxed text-[#A8A8A8] sm:text-sm">
          <span>{formatDate(session.startAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatTime(session.startAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{session.hall.name}</span>
        </p>
      </header>

      {/* Seat map and order */}
      <div className="mt-7 grid min-w-0 grid-cols-1 items-start gap-6 sm:mt-8 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
        {/* Seat map */}
        <section
          aria-label="Схема залу"
          className="w-full min-w-0 overflow-hidden rounded border border-[#242424] bg-[#0E0E0E]"
        >
          <div className="overflow-x-auto px-3 py-6 scrollbar-thin sm:px-6 sm:py-8">
            <div className="min-w-[600px] lg:min-w-0">
              {seatsQuery.isPending ? (
                <div
                  aria-hidden="true"
                  className={`${block} h-96 rounded`}
                />
              ) : seatsQuery.isError ? (
                <div role="alert" className="px-4 py-16 text-center">
                  <p className="text-sm leading-relaxed text-[#A8A8A8]">
                    {getErrorMessage(
                      seatsQuery.error,
                      'Не вдалося завантажити схему залу.',
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() => void seatsQuery.refetch()}
                    className={`mt-6 ${outlineButton}`}
                  >
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
            </div>
          </div>

          <div className="border-t border-[#242424] px-4 py-3 text-center text-[10px] text-[#777] sm:text-xs">
            На телефоні прокручуйте схему залу горизонтально.
          </div>
        </section>

        {/* Order summary */}
        <aside
          aria-label="Ваше замовлення"
          className="w-full min-w-0 rounded border border-[#242424] bg-[#101010] p-4 sm:p-6 lg:sticky lg:top-24"
        >
          {/* Movie details */}
          <div className="flex min-w-0 gap-4">
            <div className="w-[72px] shrink-0 overflow-hidden border border-[#2A2A2A] sm:w-20">
              <Poster
                id={session.movie.id}
                title={session.movie.title}
                url={session.movie.posterUrl}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-bold uppercase leading-tight tracking-[0.08em] sm:tracking-[0.12em]">
                {session.movie.title}
              </p>

              <p className="mt-2 text-xs text-[#A8A8A8] sm:text-sm">
                {formatDate(session.startAt)}
              </p>

              <p className="text-xs text-[#A8A8A8] sm:text-sm">
                {formatTime(session.startAt)} – {formatTime(session.endAt)}
              </p>

              <p className="text-xs text-[#A8A8A8] sm:text-sm">
                {session.hall.name}
              </p>
            </div>
          </div>

          {/* Selected seats */}
          <div className="mt-6 border-t border-[#242424] pt-5 sm:pt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8C8C8C] sm:tracking-[0.2em]">
              Обрані місця
            </h2>

            {selectedSeats.length === 0 ? (
              <p className="mt-4 text-sm leading-relaxed text-[#8C8C8C]">
                Оберіть місця на схемі залу.
              </p>
            ) : (
              <ul className="mt-4 max-h-40 space-y-3 overflow-y-auto pr-1 text-sm scrollbar-thin">
                {selectedSeats.map((seat) => (
                  <li
                    key={seat.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="min-w-0 break-words">
                      Ряд {seat.row} · Місце {seat.number}

                      {seat.type === 'VIP' && (
                        <span className="ml-2 text-xs font-bold text-[#D9AE4E]">
                          VIP
                        </span>
                      )}
                    </span>

                    <span className="shrink-0 tabular-nums text-[#CFCFCF]">
                      {formatMoney(
                        seatPrice(session, seat.type).toFixed(2),
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-xs text-[#6A6A6A]">
              Обрано {selectedSeats.length} з {MAX_SEATS_PER_ORDER}
            </p>
          </div>

          {/* Total */}
          <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-[#242424] pt-5 sm:mt-6 sm:pt-6">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8C8C8C] sm:tracking-[0.2em]">
              Разом
            </span>

            <span className="text-xl font-bold tabular-nums sm:text-2xl">
              {formatMoney(total.toFixed(2))}
            </span>
          </div>

          {/* Errors */}
          {holdError && (
            <p
              role="alert"
              className="mt-4 break-words text-sm leading-relaxed text-red-400"
            >
              {holdError}
            </p>
          )}

          {!upcoming && (
            <p className="mt-4 text-sm text-[#A8A8A8]">
              Сеанс уже розпочався.
            </p>
          )}

          {/* Single booking button */}
          <button
            type="button"
            onClick={submit}
            disabled={
              !upcoming ||
              selectedSeats.length === 0 ||
              hold.isPending
            }
            className="
              mt-6 min-h-12 w-full
              bg-[#D9AE4E] px-4 py-4
              text-xs font-bold uppercase tracking-[0.16em]
              text-[#14110A] outline-none transition
              hover:bg-[#E8C46A]
              focus-visible:ring-4 focus-visible:ring-[#D9AE4E]/40
              disabled:cursor-not-allowed disabled:opacity-40
              disabled:hover:bg-[#D9AE4E]
              sm:text-sm sm:tracking-[0.2em]
            "
          >
            {hold.isPending ? 'Бронюємо…' : 'Забронювати'}
          </button>

          <p className="mt-3 text-center text-[11px] leading-relaxed text-[#777] sm:text-xs">
            Місця утримуються 10 хвилин для оплати.
          </p>
        </aside>
      </div>
    </main>
  );
}
