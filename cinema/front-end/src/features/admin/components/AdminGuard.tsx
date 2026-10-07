'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/provider/auth-provider';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const allowed = user?.role === 'ADMIN';

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
    } else if (!allowed) {
      router.replace('/');
    }
  }, [user, allowed, isLoading, router]);

  if (isLoading || !allowed) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B0B0F]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#262631] border-t-[#F2B544]" />
      </div>
    );
  }

  return <>{children}</>;
}
