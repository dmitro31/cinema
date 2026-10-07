import type { ReactNode } from 'react';

import { formatSignedPercent } from '../lib/format';
import { STATUS_COLORS } from '../lib/theme';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from './icons';
import { Sparkline } from './Sparkline';
import { Panel } from './ui';

export function DeltaBadge({
  change,
  label,
}: {
  change: number | null;
  label: string;
}) {
  if (change === null) {
    return (
      <p className="text-xs text-[#6F6F7C]">Немає даних за попередній період</p>
    );
  }

  const tone = change > 0 ? 'success' : change < 0 ? 'danger' : 'neutral';
  const Icon = change > 0 ? ArrowUpIcon : change < 0 ? ArrowDownIcon : MinusIcon;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#9A9AA8]">
      <span className="inline-flex items-center gap-1 font-medium text-[#F4F4F5]">
        <Icon className="h-3.5 w-3.5" style={{ color: STATUS_COLORS[tone] }} />
        {formatSignedPercent(change)}
      </span>
      {label}
    </p>
  );
}

interface KpiProps {
  label: string;
  value: string;
  change?: number | null;
  compareLabel?: string;
  footnote?: ReactNode;
  spark?: number[];
}

export function HeroKpi({
  label,
  value,
  change = null,
  compareLabel = '',
  spark,
}: KpiProps) {
  return (
    <Panel className="flex flex-col justify-between overflow-hidden p-6 sm:p-8">
      <div>
        <p className="text-sm font-medium text-[#9A9AA8]">{label}</p>

        <p className="mt-3 text-5xl font-semibold tracking-tight text-[#F4F4F5] sm:text-6xl">
          {value}
        </p>

        <div className="mt-3">
          <DeltaBadge change={change} label={compareLabel} />
        </div>
      </div>

      {spark && spark.length > 1 && (
        <div className="mt-6">
          <Sparkline values={spark} height={120} />
        </div>
      )}
    </Panel>
  );
}

export function KpiTile({
  label,
  value,
  change = null,
  compareLabel = '',
  footnote,
  spark,
}: KpiProps) {
  return (
    <Panel className="flex flex-col justify-between p-5">
      <div>
        <p className="text-sm font-medium text-[#9A9AA8]">{label}</p>

        <p className="mt-2 text-3xl font-semibold tracking-tight text-[#F4F4F5]">
          {value}
        </p>

        <div className="mt-2">
          {footnote ?? <DeltaBadge change={change} label={compareLabel} />}
        </div>
      </div>

      {spark && spark.length > 1 && (
        <div className="mt-4">
          <Sparkline values={spark} height={44} />
        </div>
      )}
    </Panel>
  );
}
