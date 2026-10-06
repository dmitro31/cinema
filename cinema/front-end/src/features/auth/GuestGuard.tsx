'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { getHomePath } from '@/lib/auth-redirect';
import { useAuth } from '@/provider/auth-provider';

export function GuestGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(getHomePath(user));
    }
  }, [user, isLoading, router]);

  return <>{children}</>;
}