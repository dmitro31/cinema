'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DayPoint } from '../types';
import {
  formatCompact,
  formatDay,
  formatLongDay,
  formatMoney,
  formatNumber,
} from '../lib/format';
import { CHART } from '../lib/theme';
import { ChartCard } from './ChartCard';
import { ChartTable } from './ChartTable';
import { ChartTooltip } from './ChartTooltip';
import { EmptyState, Segmented } from './ui';

type Metric = 'revenue' | 'tickets' | 'orders';

const METRICS: { value: Metric; label: string }[] = [
  { value: 'revenue', label: 'Виручка' },
  { value: 'tickets', label: 'Квитки' },
  { value: 'orders', label: 'Замовлення' },
];

const tick = { fill: CHART.inkMuted, fontSize: 12 };

const formatMetric = (metric: Metric, value: number) =>
  metric === 'revenue' ? formatMoney(value) : formatNumber(value);

export function RevenueChart({ data }: { data: DayPoint[] }) {
  const [metric, setMetric] = useState<Metric>('revenue');

  const label = METRICS.find((item) => item.value === metric)?.label ?? '';
  const isEmpty = data.every(
    (point) => point.revenue === 0 && point.tickets === 0 && point.orders === 0,
  );

  const build = (point: DayPoint) => ({
    title: formatLongDay(point.date),
    rows: [...METRICS]
      .sort((a, b) => Number(b.value === metric) - Number(a.value === metric))
      .map((item) => ({
        label: item.label,
        value: formatMetric(item.value, point[item.value]),
        primary: item.value === metric,
      })),
  });

  const chart = isEmpty ? (
    <div className="h-72">
      <EmptyState
        title="Немає продажів за цей період"
        description="Спробуйте обрати більший діапазон дат."
      />
    </div>
  ) : (
    <div
      className="h-72"
      role="img"
      aria-label={`Графік: ${label.toLowerCase()} по днях. Ті самі дані доступні у вигляді таблиці.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />

          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={tick}
            tickLine={false}
            axisLine={{ stroke: CHART.baseline }}
            tickMargin={8}
            minTickGap={36}
          />

          <YAxis
            tickFormatter={(value: number) => formatCompact(value)}
            tick={tick}
            tickLine={false}
            axisLine={false}
            width={64}
          />

          <Tooltip
            cursor={{ stroke: CHART.cursor, strokeWidth: 1 }}
            content={<ChartTooltip<DayPoint> build={build} />}
          />

          <Area
            type="monotone"
            dataKey={metric}
            stroke={CHART.series}
            strokeWidth={2}
            fill={CHART.series}
            fillOpacity={0.1}
            dot={false}
            activeDot={{
              r: 5,
              fill: CHART.series,
              stroke: CHART.surface,
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const table = (
    <ChartTable
      headers={['Дата', 'Виручка', 'Квитки', 'Замовлення']}
      rows={[...data]
        .reverse()
        .map((point) => [
          formatLongDay(point.date),
          formatMoney(point.revenue),
          formatNumber(point.tickets),
          formatNumber(point.orders),
        ])}
    />
  );

  return (
    <ChartCard
      title="Динаміка продажів"
      description="По днях за обраний період"
      actions={
        <Segmented
          ariaLabel="Показник"
          options={METRICS}
          value={metric}
          onChange={setMetric}
        />
      }
      chart={chart}
      table={table}
    />
  );
}
