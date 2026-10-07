'use client';

import { useState } from 'react';

import {
  customRange,
  toDateInput,
  presetRange,
  type DateRange,
  type RangePreset,
} from '../lib/date-range';
import { RefreshIcon } from './icons';
import { Segmented } from './ui';

const OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 7, label: '7 днів' },
  { value: 30, label: '30 днів' },
  { value: 90, label: '90 днів' },
  { value: 365, label: 'Рік' },
  { value: 'custom', label: 'Період' },
];

interface RangePickerProps {
  range: DateRange;
  onChange: (range: DateRange) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const dateInputClass =
  'h-10 rounded-xl border border-[#262631] bg-[#0E0E13] px-3 text-sm text-[#F4F4F5] outline-none transition [color-scheme:dark] focus:border-[#F2B544] focus:ring-4 focus:ring-[#F2B544]/15';

export function RangePicker({
  range,
  onChange,
  onRefresh,
  refreshing,
}: RangePickerProps) {
  const [fromDay, setFromDay] = useState(() => toDateInput(range.from));
  const [toDay, setToDay] = useState(() => toDateInput(range.to));
  const [error, setError] = useState<string | null>(null);

  const selectPreset = (preset: RangePreset) => {
    setError(null);

    if (preset === 'custom') {
      const from = toDateInput(range.from);
      const to = toDateInput(range.to);
      setFromDay(from);
      setToDay(to);

      const { range: next } = customRange(from, to);
      if (next) onChange(next);
      return;
    }

    onChange(presetRange(preset));
  };

  const updateCustom = (from: string, to: string) => {
    setFromDay(from);
    setToDay(to);

    const { range: next, error: message } = customRange(from, to);
    setError(message);
    if (next) onChange(next);
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Період"
          options={OPTIONS}
          value={range.preset}
          onChange={selectPreset}
        />

        {range.preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Початок періоду"
              value={fromDay}
              max={toDay}
              onChange={(event) => updateCustom(event.target.value, toDay)}
              className={dateInputClass}
            />

            <span className="text-[#6F6F7C]">—</span>

            <input
              type="date"
              aria-label="Кінець періоду"
              value={toDay}
              min={fromDay}
              onChange={(event) => updateCustom(fromDay, event.target.value)}
              className={dateInputClass}
            />
          </div>
        )}

        <button
          type="button"
          onClick={onRefresh}
          aria-label="Оновити дані"
          title="Оновити дані"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#262631] text-[#9A9AA8] transition hover:bg-white/5 hover:text-[#F4F4F5]"
        >
          <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-[#FF9A9A]">
          {error}
        </p>
      )}
    </div>
  );
}
