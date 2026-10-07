import type { ReactNode } from 'react';

import { AuthProvider } from '@/provider/auth-provider';

import './globals.css';
import { QueryProvider } from '@/provider/QueryProvider';
import { SiteHeader } from '@/features/site/components/SiteHeader';
import { SiteFooter } from '@/features/site/components/SiteFooter';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uk">
      
      <body>
       <QueryProvider> <AuthProvider><SiteHeader/>{children}<SiteFooter/></AuthProvider></QueryProvider>
       
      </body>
      
    </html>
  );
}
