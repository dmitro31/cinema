'use client';

import { useMemo, useState } from 'react';

import {
  useOccupancyReport,
  useSalesReport,
} from '../hooks/use-admin-queries';
import {
  fillDays,
  getTimezone,
  occupancyRange,
  presetRange,
  previousRange,
  rangeLengthDays,
  type DateRange,
} from '../lib/date-range';
import { HallOccupancy } from './HallOccupancy';
import { KpiGrid, KpiSkeleton } from './KpiGrid';
import { OccupancyHeatmap } from './OccupancyHeatmap';
import { QueryBoundary } from './QueryBoundary';
import { RangePicker } from './RangePicker';
import { RevenueChart } from './RevenueChart';
import { SessionsTable } from './SessionsTable';
import { TopMoviesChart } from './TopMoviesChart';
import { PageHeader, Skeleton } from './ui';

export function DashboardView() {
  const [range, setRange] = useState<DateRange>(() => presetRange(30));
  const [timezone] = useState(getTimezone);

  const previous = useMemo(() => previousRange(range), [range]);
  const sessionsRange = useMemo(() => occupancyRange(range), [range]);

  const sales = useSalesReport({ from: range.from, to: range.to, timezone });
  const previousSales = useSalesReport({ ...previous, timezone });
  const occupancy = useOccupancyReport({ ...sessionsRange, timezone });

  const days = useMemo(
    () =>
      sales.data ? fillDays(sales.data.byDay, sales.data.range, timezone) : [],
    [sales.data, timezone],
  );

  const refresh = () => {
    if (range.preset === 'custom') {
      void sales.refetch();
      void previousSales.refetch();
      void occupancy.refetch();
      return;
    }

    setRange(presetRange(range.preset));
  };

  return (
    <>
      <PageHeader
        title="Дашборд"
        description="Продажі та заповненість залів"
        actions={
          <RangePicker
            range={range}
            onChange={setRange}
            onRefresh={refresh}
            refreshing={sales.isFetching || occupancy.isFetching}
          />
        }
      />

      <div className="space-y-6">
        <QueryBoundary query={sales} skeleton={<KpiSkeleton />}>
          {(report) => (
            <KpiGrid
              sales={report}
              previous={previousSales.data}
              occupancy={occupancy.data}
              days={days}
              compareLabel={`vs попередні ${rangeLengthDays(range)} дн.`}
            />
          )}
        </QueryBoundary>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <QueryBoundary query={sales} skeleton={<Skeleton className="h-[26rem]" />}>
              {() => <RevenueChart data={days} />}
            </QueryBoundary>
          </div>

          <QueryBoundary query={sales} skeleton={<Skeleton className="h-[26rem]" />}>
            {(report) => <TopMoviesChart movies={report.byMovie} />}
          </QueryBoundary>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <QueryBoundary query={occupancy} skeleton={<Skeleton className="h-96" />}>
              {(report) => <OccupancyHeatmap sessions={report.sessions} />}
            </QueryBoundary>
          </div>

          <QueryBoundary query={occupancy} skeleton={<Skeleton className="h-96" />}>
            {(report) => <HallOccupancy halls={report.byHall} />}
          </QueryBoundary>
        </div>

        <QueryBoundary query={occupancy} skeleton={<Skeleton className="h-96" />}>
          {(report) => <SessionsTable sessions={report.sessions} />}
        </QueryBoundary>
      </div>
    </>
  );
}
