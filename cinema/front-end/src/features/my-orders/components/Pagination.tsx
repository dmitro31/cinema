interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}

const control =
  'border border-[#2E2E2E] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#A8A8A8] outline-none transition hover:border-[#D9AE4E] hover:text-white focus-visible:ring-2 focus-visible:ring-[#D9AE4E] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[#2E2E2E] disabled:hover:text-[#A8A8A8]';

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / limit));

  if (pages <= 1) return null;

  return (
    <nav aria-label="Сторінки" className="mt-8 flex items-center justify-center gap-4">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className={control}>
        Назад
      </button>
      <span className="text-xs tabular-nums text-[#A8A8A8]" aria-current="page">
        {page} / {pages}
      </span>
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className={control}>
        Далі
      </button>
    </nav>
  );
}