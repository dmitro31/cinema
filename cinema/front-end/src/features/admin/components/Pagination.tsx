const LIMITS = [10, 20, 50];

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const buttonClass =
    'h-9 rounded-lg border border-[#262631] px-3.5 text-sm font-medium text-[#F4F4F5] transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#262631] px-5 py-4">
      <p className="text-sm text-[#9A9AA8]">
        <span className="tabular-nums text-[#F4F4F5]">
          {from}–{to}
        </span>{' '}
        з <span className="tabular-nums text-[#F4F4F5]">{total}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[#9A9AA8]">
          На сторінці
          <select
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-9 rounded-lg border border-[#262631] bg-[#0E0E13] px-2 text-sm text-[#F4F4F5] outline-none [color-scheme:dark] focus:border-[#F2B544]"
          >
            {LIMITS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={buttonClass}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Назад
          </button>

          <span className="min-w-24 text-center text-sm tabular-nums text-[#9A9AA8]">
            {page} / {pages}
          </span>

          <button
            type="button"
            className={buttonClass}
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            Далі
          </button>
        </div>
      </div>
    </div>
  );
}
