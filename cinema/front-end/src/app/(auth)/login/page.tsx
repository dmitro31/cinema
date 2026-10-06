import type { Metadata } from 'next';

import { LoginForm } from '@/features/auth/login';

export const metadata: Metadata = {
  title: 'Вхід',
};

export default function LoginPage() {
  return <LoginForm />;
}