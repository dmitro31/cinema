import { CHART } from '../lib/theme';

export interface TooltipRow {
  label: string;
  value: string;
  primary?: boolean;
}

export interface TooltipContent {
  title: string;
  rows: TooltipRow[];
}

interface ChartTooltipProps<T> {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: T }>;
  build: (point: T) => TooltipContent;
}

export function ChartTooltip<T>({
  active,
  payload,
  build,
}: ChartTooltipProps<T>) {
  const point = payload?.[0]?.payload;

  if (!active || !point) return null;

  const { title, rows } = build(point);

  return (
    <div className="min-w-48 rounded-xl border border-[#2F2F3B] bg-[#17171F] px-3.5 py-3 shadow-xl shadow-black/50">
      <p className="mb-2 text-xs text-[#898781]">{title}</p>

      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{ background: row.primary ? CHART.series : CHART.baseline }}
            />
            <strong className="font-semibold text-[#F4F4F5]">{row.value}</strong>
            <span className="text-[#9A9AA8]">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
