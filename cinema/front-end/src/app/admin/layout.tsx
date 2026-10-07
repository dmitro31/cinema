import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AdminGuard } from '@/features/admin/components/AdminGuard';
import { AdminShell } from '@/features/admin/components/AdminShell';
import { QueryProvider } from '@/provider/QueryProvider';

export const metadata: Metadata = {
  title: { default: 'Адмінка', template: '%s · Адмінка' },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AdminGuard>
        <AdminShell>{children}</AdminShell>
      </AdminGuard>
    </QueryProvider>
  );
}
