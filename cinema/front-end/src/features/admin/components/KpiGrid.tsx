import type { DayPoint, OccupancyReport, SalesReport } from '../types';
import {
  formatMoney,
  formatNumber,
  formatPercent,
  toNumber,
} from '../lib/format';
import { HeroKpi, KpiTile } from './KpiCards';
import { Skeleton } from './ui';

const change = (current: number, previous: number | null) =>
  previous === null || previous === 0 ? null : (current - previous) / previous;

interface KpiGridProps {
  sales: SalesReport;
  previous?: SalesReport;
  occupancy?: OccupancyReport;
  days: DayPoint[];
  compareLabel: string;
}

export function KpiGrid({
  sales,
  previous,
  occupancy,
  days,
  compareLabel,
}: KpiGridProps) {
  const revenue = toNumber(sales.totals.revenue);
  const { orders, tickets } = sales.totals;
  const averageCheck = orders > 0 ? revenue / orders : 0;

  const previousRevenue = previous ? toNumber(previous.totals.revenue) : null;
  const previousOrders = previous ? previous.totals.orders : null;
  const previousTickets = previous ? previous.totals.tickets : null;
  const previousAverage =
    previousRevenue !== null && previousOrders ? previousRevenue / previousOrders : null;

  const seatsTotal = occupancy?.byHall.reduce((sum, hall) => sum + hall.seatsTotal, 0) ?? 0;
  const seatsSold = occupancy?.byHall.reduce((sum, hall) => sum + hall.ticketsSold, 0) ?? 0;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <HeroKpi
        label="Виручка"
        value={formatMoney(revenue)}
        change={change(revenue, previousRevenue)}
        compareLabel={compareLabel}
        spark={days.map((day) => toNumber(day.revenue))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiTile
          label="Замовлення"
          value={formatNumber(orders)}
          change={change(orders, previousOrders)}
          compareLabel={compareLabel}
          spark={days.map((day) => day.orders)}
        />

        <KpiTile
          label="Продано квитків"
          value={formatNumber(tickets)}
          change={change(tickets, previousTickets)}
          compareLabel={compareLabel}
          spark={days.map((day) => day.tickets)}
        />

        <KpiTile
          label="Середній чек"
          value={formatMoney(averageCheck)}
          change={change(averageCheck, previousAverage)}
          compareLabel={compareLabel}
        />

        <KpiTile
          label="Заповненість залів"
          value={seatsTotal > 0 ? formatPercent(seatsSold / seatsTotal) : '—'}
          footnote={
            <p className="text-xs text-[#6F6F7C]">
              {seatsTotal > 0
                ? `${formatNumber(seatsSold)} з ${formatNumber(seatsTotal)} місць`
                : 'Немає сеансів у періоді'}
            </p>
          }
        />
      </div>
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Skeleton className="h-72" />

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
    </div>
  );
}
