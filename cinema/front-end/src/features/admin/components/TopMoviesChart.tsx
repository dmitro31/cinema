'use client';

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MovieSales } from '../types';
import {
  formatCompact,
  formatMoney,
  formatNumber,
  toNumber,
  truncate,
} from '../lib/format';
import { CHART } from '../lib/theme';
import { ChartCard } from './ChartCard';
import { ChartTable } from './ChartTable';
import { ChartTooltip } from './ChartTooltip';
import { EmptyState } from './ui';

const TOP = 7;
const ROW_HEIGHT = 44;

export function TopMoviesChart({ movies }: { movies: MovieSales[] }) {
  const rows = movies
    .map((movie) => ({ ...movie, revenue: toNumber(movie.revenue) }))
    .slice(0, TOP);

  const build = (movie: MovieSales) => ({
    title: movie.title,
    rows: [
      { label: 'Виручка', value: formatMoney(movie.revenue), primary: true },
      { label: 'Квитки', value: formatNumber(movie.tickets) },
    ],
  });

  const chart =
    rows.length === 0 ? (
      <div className="h-72">
        <EmptyState title="Немає продажів за цей період" />
      </div>
    ) : (
      <div
        role="img"
        aria-label="Діаграма: найкасовіші фільми за виручкою. Ті самі дані доступні у вигляді таблиці."
        style={{ height: Math.max(rows.length, 3) * ROW_HEIGHT + 8 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 72, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />

            <YAxis
              type="category"
              dataKey="title"
              width={132}
              tickLine={false}
              axisLine={{ stroke: CHART.baseline }}
              tick={{ fill: CHART.inkSecondary, fontSize: 13 }}
              tickFormatter={(value: string) => truncate(value, 18)}
            />

            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              content={<ChartTooltip<MovieSales> build={build} />}
            />

            <Bar
              dataKey="revenue"
              fill={CHART.series}
              barSize={18}
              radius={[0, 4, 4, 0]}
              activeBar={{ fill: CHART.seriesHover }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="revenue"
                position="right"
                fill={CHART.inkSecondary}
                fontSize={12}
                formatter={(value: unknown) => formatCompact(Number(value))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );

  const table = (
    <ChartTable
      headers={['Фільм', 'Виручка', 'Квитки']}
      rows={movies.map((movie) => [
        movie.title,
        formatMoney(movie.revenue),
        formatNumber(movie.tickets),
      ])}
    />
  );

  return (
    <ChartCard
      title="Найкасовіші фільми"
      description={`Топ-${TOP} за виручкою`}
      chart={chart}
      table={table}
      className="h-full"
    />
  );
}
