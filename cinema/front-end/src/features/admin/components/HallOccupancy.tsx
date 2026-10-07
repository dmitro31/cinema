import type { HallOccupancy as HallOccupancyItem } from '../types';
import { formatNumber, formatPercent } from '../lib/format';
import { MeterBar } from './MeterBar';
import { EmptyState, Panel } from './ui';

export function HallOccupancy({ halls }: { halls: HallOccupancyItem[] }) {
  const sorted = [...halls].sort((a, b) => b.occupancy - a.occupancy);

  return (
    <Panel className="h-full p-5 sm:p-6">
      <h2 className="text-base font-semibold text-[#F4F4F5]">Заповненість залів</h2>
      <p className="mt-1 text-sm text-[#9A9AA8]">Проданих місць від усіх</p>

      {sorted.length === 0 ? (
        <EmptyState title="Немає сеансів у цьому періоді" />
      ) : (
        <ul className="mt-6 space-y-5">
          {sorted.map((hall) => (
            <li key={hall.hallId}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium text-[#F4F4F5]">{hall.name}</p>

                <p className="text-lg font-semibold text-[#F4F4F5]">
                  {formatPercent(hall.occupancy)}
                </p>
              </div>

              <MeterBar ratio={hall.occupancy} label={`Заповненість: ${hall.name}`} />

              <p className="mt-2 text-xs text-[#6F6F7C]">
                {formatNumber(hall.sessions)} сеансів ·{' '}
                {formatNumber(hall.ticketsSold)} з {formatNumber(hall.seatsTotal)} місць
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
