import type { Metadata } from 'next';

import { RegisterForm } from '@/features/auth/register';

export const metadata: Metadata = {
  title: 'Реєстрація',
};

export default function RegisterPage() {
  return <RegisterForm />;
}