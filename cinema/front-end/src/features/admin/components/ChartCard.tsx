'use client';

import { useState, type ReactNode } from 'react';

import { ChartIcon, TableIcon } from './icons';
import { Panel } from './ui';

interface ChartCardProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  chart: ReactNode;
  table: ReactNode;
  className?: string;
}

type View = 'chart' | 'table';

export function ChartCard({
  title,
  description,
  actions,
  chart,
  table,
  className = '',
}: ChartCardProps) {
  const [view, setView] = useState<View>('chart');

  const toggle = (value: View, label: string, icon: ReactNode) => (
    <button
      type="button"
      aria-pressed={view === value}
      aria-label={label}
      title={label}
      onClick={() => setView(value)}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
        view === value
          ? 'bg-[#262631] text-[#F4F4F5]'
          : 'text-[#9A9AA8] hover:bg-white/5 hover:text-[#F4F4F5]'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <Panel className={`p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#F4F4F5]">{title}</h2>

          {description && (
            <p className="mt-1 text-sm text-[#9A9AA8]">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}

          <div className="inline-flex rounded-xl border border-[#262631] bg-[#0E0E13] p-1">
            {toggle('chart', 'Графік', <ChartIcon className="h-4 w-4" />)}
            {toggle('table', 'Таблиця', <TableIcon className="h-4 w-4" />)}
          </div>
        </div>
      </div>

      <div className="mt-5">{view === 'chart' ? chart : table}</div>
    </Panel>
  );
}
