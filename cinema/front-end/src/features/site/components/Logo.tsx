import Link from 'next/link';

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="Cinema — на головну"
      className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
    >
      <svg viewBox="0 0 32 32" width="34" height="34" fill="none" stroke="#D9AE4E" strokeWidth="2" aria-hidden="true">
        <circle cx="16" cy="16" r="13" />
        <circle cx="16" cy="8.5" r="2.2" fill="#D9AE4E" stroke="none" />
        <circle cx="23.5" cy="16" r="2.2" fill="#D9AE4E" stroke="none" />
        <circle cx="16" cy="23.5" r="2.2" fill="#D9AE4E" stroke="none" />
        <circle cx="8.5" cy="16" r="2.2" fill="#D9AE4E" stroke="none" />
      </svg>
      <span className="leading-none">
        <span className="block text-xl font-extrabold uppercase tracking-[0.08em] text-white">ASTRA</span>
        <span className="mt-1 block text-[11px] uppercase tracking-[0.28em] text-[#A8A8A8]">Кінотеатр</span>
      </span>
    </Link>
  );
}
