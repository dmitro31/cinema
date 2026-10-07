'use client';

import { Fragment, useMemo } from 'react';

import type { OccupancySession } from '../types';
import { formatPercent } from '../lib/format';
import { HEAT_STEPS, heatStep } from '../lib/theme';
import { EmptyState, Panel } from './ui';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

interface Cell {
  sold: number;
  seats: number;
  sessions: number;
}

function buildGrid(sessions: OccupancySession[]) {
  if (sessions.length === 0) return null;

  const cells = new Map<string, Cell>();
  let minHour = 23;
  let maxHour = 0;

  for (const session of sessions) {
    const date = new Date(session.startAt);
    const day = (date.getDay() + 6) % 7;
    const hour = date.getHours();
    const key = `${day}-${hour}`;
    const cell = cells.get(key) ?? { sold: 0, seats: 0, sessions: 0 };

    cell.sold += session.ticketsSold;
    cell.seats += session.seatsTotal;
    cell.sessions += 1;
    cells.set(key, cell);

    minHour = Math.min(minHour, hour);
    maxHour = Math.max(maxHour, hour);
  }

  const hours = Array.from(
    { length: maxHour - minHour + 1 },
    (_, index) => minHour + index,
  );

  return { cells, hours };
}

export function OccupancyHeatmap({ sessions }: { sessions: OccupancySession[] }) {
  const grid = useMemo(() => buildGrid(sessions), [sessions]);

  return (
    <Panel className="h-full p-5 sm:p-6">
      <h2 className="text-base font-semibold text-[#F4F4F5]">
        Заповненість за днем і годиною
      </h2>
      <p className="mt-1 text-sm text-[#9A9AA8]">
        Середній відсоток проданих місць за початком сеансу
      </p>

      {!grid ? (
        <EmptyState title="Немає сеансів у цьому періоді" />
      ) : (
        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[560px]">
            <div
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `2.5rem repeat(${grid.hours.length}, minmax(0, 1fr))`,
              }}
            >
              <div />

              {grid.hours.map((hour) => (
                <div key={hour} className="pb-1 text-center text-xs text-[#898781]">
                  {String(hour).padStart(2, '0')}
                </div>
              ))}

              {WEEKDAYS.map((weekday, day) => (
                <Fragment key={weekday}>
                  <div className="flex items-center text-xs text-[#898781]">
                    {weekday}
                  </div>

                  {grid.hours.map((hour) => {
                    const cell = grid.cells.get(`${day}-${hour}`);

                    if (!cell) {
                      return (
                        <div key={hour} className="h-9 rounded-md bg-[#16161D]" />
                      );
                    }

                    const ratio = cell.seats > 0 ? cell.sold / cell.seats : 0;
                    const step = heatStep(ratio);
                    const description = `${weekday}, ${String(hour).padStart(2, '0')}:00 · сеансів: ${cell.sessions} · ${formatPercent(ratio)} (${cell.sold} з ${cell.seats} місць)`;

                    return (
                      <div
                        key={hour}
                        tabIndex={0}
                        title={description}
                        aria-label={description}
                        className="flex h-9 items-center justify-center rounded-md text-xs font-medium outline-none transition hover:brightness-125 focus-visible:ring-2 focus-visible:ring-white"
                        style={{ background: step.color, color: step.ink }}
                      >
                        {Math.round(ratio * 100)}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 text-xs text-[#898781]">
              <span>0%</span>

              <div className="flex gap-0.5">
                {HEAT_STEPS.map((step) => (
                  <span
                    key={step.color}
                    className="h-3 w-6 first:rounded-l-sm last:rounded-r-sm"
                    style={{ background: step.color }}
                  />
                ))}
              </div>

              <span>100%</span>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
