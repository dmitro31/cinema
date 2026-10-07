'use client';

import { useMemo } from 'react';

import { groupByRow } from '../lib/seats';
import type { SeatInfo } from '../types';

interface SeatMapProps {
  seats: SeatInfo[];
  selected: string[];
  onToggle: (id: string) => void;
  disabled?: boolean;
}

const statusLabel = { FREE: 'вільне', HELD: 'утримується', SOLD: 'продане' } as const;

function seatClass(seat: SeatInfo, isSelected: boolean) {
  const base =
    'flex h-8 w-8 items-center justify-center border text-[10px] font-semibold tabular-nums outline-none transition sm:h-9 sm:w-9 sm:text-xs focus-visible:ring-2 focus-visible:ring-[#D9AE4E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]';

  if (isSelected) return `${base} border-[#D9AE4E] bg-[#D9AE4E] text-[#14110A]`;
  if (seat.status === 'SOLD') {
    return `${base} cursor-not-allowed border-[#1F1F1F] bg-[#1A1A1A] text-[#4A4A4A] opacity-50`;
  }
  if (seat.status === 'HELD') {
    return `${base} cursor-not-allowed border-[#5A4A22] bg-[#2A2312] text-[#8A7335]`;
  }
  if (seat.type === 'VIP') {
    return `${base} border-[#D9AE4E]/60 bg-[#1A1608] text-[#D9AE4E] hover:bg-[#D9AE4E]/20`;
  }
  return `${base} border-[#3A3A3A] bg-[#161616] text-[#BDBDBD] hover:border-[#D9AE4E] hover:text-white`;
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className={`h-4 w-4 border ${className}`} />
      <span>{label}</span>
    </li>
  );
}

export function SeatMap({ seats, selected, onToggle, disabled }: SeatMapProps) {
  const rows = useMemo(() => groupByRow(seats), [seats]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div>
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto w-max min-w-full px-2">
          <div aria-hidden="true" className="mx-auto mb-10 max-w-md">
            <div className="h-1 bg-gradient-to-r from-transparent via-[#D9AE4E] to-transparent" />
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.5em] text-[#8C8C8C]">Екран</p>
          </div>

          <div role="group" aria-label="Схема залу" className="flex flex-col items-center gap-1.5">
            {rows.map(({ row, seats: rowSeats }) => (
              <div key={row} className="flex items-center gap-2">
                <span aria-hidden="true" className="w-6 text-right text-[11px] tabular-nums text-[#6A6A6A]">
                  {row}
                </span>
                <div className="flex gap-1.5">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSet.has(seat.id);
                    const unavailable = seat.status !== 'FREE';

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={disabled || unavailable}
                        aria-pressed={isSelected}
                        aria-label={`Ряд ${seat.row}, місце ${seat.number}${seat.type === 'VIP' ? ', VIP' : ''}, ${
                          isSelected ? 'обране' : statusLabel[seat.status]
                        }`}
                        onClick={() => onToggle(seat.id)}
                        className={seatClass(seat, isSelected)}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
                </div>
                <span aria-hidden="true" className="w-6 text-[11px] tabular-nums text-[#6A6A6A]">
                  {row}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-[#A8A8A8]">
        <LegendItem className="border-[#3A3A3A] bg-[#161616]" label="Вільне" />
        <LegendItem className="border-[#D9AE4E]/60 bg-[#1A1608]" label="VIP" />
        <LegendItem className="border-[#D9AE4E] bg-[#D9AE4E]" label="Обране" />
        <LegendItem className="border-[#5A4A22] bg-[#2A2312]" label="Утримується" />
        <LegendItem className="border-[#1F1F1F] bg-[#1A1A1A] opacity-50" label="Продане" />
      </ul>
    </div>
  );
}