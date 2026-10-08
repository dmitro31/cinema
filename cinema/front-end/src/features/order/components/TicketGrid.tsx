import { QRCodeSVG } from 'qrcode.react';

import { formatDate, formatTime } from '@/features/admin/lib/format';

import type { Order } from '../types';

export function TicketGrid({ order }: { order: Order }) {
  const seatById = new Map(order.seats.map((seat) => [seat.seatId, seat]));

  const tickets = [...order.tickets].sort((a, b) => {
    const seatA = seatById.get(a.seatId);
    const seatB = seatById.get(b.seatId);
    return (seatA?.row ?? 0) - (seatB?.row ?? 0) || (seatA?.number ?? 0) - (seatB?.number ?? 0);
  });

  if (tickets.length === 0) return null;

  return (
    <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {tickets.map((ticket) => {
        const seat = seatById.get(ticket.seatId);

        return (
          <li
            key={ticket.id}
            className={`flex gap-5 border border-[#242424] bg-[#101010] p-5 ${ticket.usedAt ? 'opacity-50' : ''}`}
          >
            <div className="h-fit shrink-0 bg-white p-2">
              <QRCodeSVG value={ticket.qrCode} size={112} level="M" bgColor="#FFFFFF" fgColor="#000000" />
            </div>

            <div className="min-w-0 text-sm">
              <p className="break-words font-bold uppercase tracking-[0.12em]">{order.session.movie.title}</p>
              <p className="mt-2 text-[#A8A8A8]">
                {formatDate(order.session.startAt)} · {formatTime(order.session.startAt)}
              </p>
              <p className="text-[#A8A8A8]">{order.session.hall.name}</p>
              {seat && (
                <p className="mt-3 font-semibold">
                  Ряд {seat.row} · Місце {seat.number}
                  {seat.type === 'VIP' && <span className="ml-2 text-xs text-[#D9AE4E]">VIP</span>}
                </p>
              )}
              {ticket.usedAt && (
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#8C8C8C]">Використано</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}