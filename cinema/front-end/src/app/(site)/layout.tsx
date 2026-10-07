import { Montserrat } from 'next/font/google';
import type { ReactNode } from 'react';

import { SiteFooter } from '@/features/site/components/SiteFooter';
import { SiteHeader } from '@/features/site/components/SiteHeader';
import { QueryProvider } from '@/provider/QueryProvider';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
});

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${montserrat.className} min-h-screen bg-[#0A0A0A] text-[#F2F2F2]`}>
      <QueryProvider>
        <main>{children}</main>
      </QueryProvider>
    </div>
  );
}
