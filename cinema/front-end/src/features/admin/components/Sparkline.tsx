'use client';

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

import { CHART } from '../lib/theme';

export function Sparkline({
  values,
  height = 48,
}: {
  values: number[];
  height?: number;
}) {
  const data = values.map((value, index) => ({ index, value }));

  return (
    <div style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <YAxis hide domain={[0, 'dataMax']} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={CHART.series}
            strokeWidth={2}
            fill={CHART.series}
            fillOpacity={0.1}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
