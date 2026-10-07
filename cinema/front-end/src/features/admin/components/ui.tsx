import type { ReactNode, SelectHTMLAttributes } from 'react';

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[#262631] bg-[#121218] ${className}`}
    >
      {children}
    </section>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#1B1B25] ${className}`} />;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F4F4F5] sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-1.5 text-sm text-[#9A9AA8]">{description}</p>
        )}
      </div>

      {actions}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Panel className="flex flex-col items-start gap-3 p-6">
      <p role="alert" className="text-sm text-[#FF9A9A]">
        {message}
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-9 rounded-lg border border-[#262631] px-4 text-sm font-medium text-[#F4F4F5] transition hover:bg-white/5"
        >
          Спробувати ще раз
        </button>
      )}
    </Panel>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <p className="text-sm font-medium text-[#F4F4F5]">{title}</p>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[#6F6F7C]">{description}</p>
      )}
    </div>
  );
}

interface SegmentedProps<T extends string | number> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex rounded-xl border border-[#262631] bg-[#0E0E13] p-1"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`h-8 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition ${
              active
                ? 'bg-[#262631] text-[#F4F4F5]'
                : 'text-[#9A9AA8] hover:bg-white/5 hover:text-[#F4F4F5]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-[#9A9AA8]">
      {label}

      <select
        {...props}
        className="h-10 min-w-44 rounded-xl border border-[#262631] bg-[#0E0E13] px-3 text-sm text-[#F4F4F5] outline-none transition [color-scheme:dark] focus:border-[#F2B544] focus:ring-4 focus:ring-[#F2B544]/15"
      >
        {children}
      </select>
    </label>
  );
}
