import type { ReactNode } from 'react';

export function PageHeading({ children }: { children: ReactNode }) {
  return (
    <h1 className="flex items-center justify-center gap-4 text-center text-2xl font-bold uppercase tracking-[0.18em] text-[#D9AE4E] sm:gap-8 sm:text-4xl sm:tracking-[0.3em]">
      <span aria-hidden="true" className="hidden h-px w-24 bg-[#D9AE4E]/40 sm:block lg:w-48" />
      <span>{children}</span>
      <span aria-hidden="true" className="hidden h-px w-24 bg-[#D9AE4E]/40 sm:block lg:w-48" />
    </h1>
  );
}