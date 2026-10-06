'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getHomePath } from '@/lib/auth-redirect';
import { getErrorMessage } from '@/lib/get-error-message';
import {
  loginSchema,
  type LoginFormData,
} from '@/lib/validation/auth.schemas';
import { useAuth } from '@/provider/auth-provider';

import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthDivider,
  AuthField,
  AuthInput,
  AuthPasswordInput,
} from './auth-ui';
import { GoogleAuthButton } from './GoogleAuthButton';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const user = await login(data.email, data.password);
      router.replace(getHomePath(user));
      router.refresh();
    } catch (error) {
      setServerError(
        getErrorMessage(error, 'Не вдалося увійти. Спробуйте ще раз.'),
      );
    }
  };

  return (
    <AuthCard
      eyebrow="З поверненням"
      title="Вхід в акаунт"
      description="Увійдіть, щоб купувати квитки та переглядати свої замовлення."
      footer={
        <>
          Ще немає акаунта?{' '}
          <Link
            href="/register"
            className="font-semibold text-[#F2B544] transition hover:text-[#FFC85C]"
          >
            Зареєструватися
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthField label="Email" htmlFor="email" error={errors.email?.message}>
          <AuthInput
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            autoComplete="email"
            error={!!errors.email}
          />
        </AuthField>

        <AuthField
          label="Пароль"
          htmlFor="password"
          error={errors.password?.message}
        >
          <AuthPasswordInput
            id="password"
            {...register('password')}
            placeholder="••••••••"
            autoComplete="current-password"
            error={!!errors.password}
          />
        </AuthField>

        {serverError && <AuthAlert>{serverError}</AuthAlert>}

        <AuthButton type="submit" loading={isSubmitting} loadingText="Вхід...">
          Увійти
        </AuthButton>
      </form>

      <AuthDivider />

      <GoogleAuthButton />
    </AuthCard>
  );
}