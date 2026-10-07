import { CHART } from '../lib/theme';

export function MeterBar({ ratio, label }: { ratio: number; label: string }) {
  const value = Math.min(Math.max(ratio, 0), 1);

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-2 w-full overflow-hidden rounded-full"
      style={{ background: `${CHART.series}33` }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${value * 100}%`, background: CHART.series }}
      />
    </div>
  );
}
