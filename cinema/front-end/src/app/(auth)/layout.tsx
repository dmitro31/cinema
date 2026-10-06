import type { ReactNode } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { GuestGuard } from '@/features/auth/GuestGuard';
import { TrailerPanel } from '@/features/auth/TrailerPanel';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}
    >
      <GuestGuard>
        <div className="min-h-screen bg-[#0B0B0F] text-[#F4F4F5] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#F2B544]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-[#7A1F2B]/20 blur-3xl" />

            <div className="relative w-full max-w-md">{children}</div>
          </main>

          <aside className="hidden p-6 lg:block">
            <div className="sticky top-6 h-[calc(100vh-3rem)]">
              <TrailerPanel />
            </div>
          </aside>
        </div>
      </GuestGuard>
    </GoogleOAuthProvider>
  );
}