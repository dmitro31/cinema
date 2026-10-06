'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getHomePath } from '@/lib/auth-redirect';
import { getErrorMessage } from '@/lib/get-error-message';
import {
  registerSchema,
  type RegisterFormData,
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

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);

    try {
      const user = await registerUser(data);
      router.replace(getHomePath(user));
      router.refresh();
    } catch (error) {
      setServerError(
        getErrorMessage(error, 'Не вдалося зареєструвати акаунт.'),
      );
    }
  };

  return (
    <AuthCard
      eyebrow="Почнемо"
      title="Створіть акаунт"
      description="Купуйте квитки онлайн, обирайте місця в залі та зберігайте історію замовлень."
      footer={
        <>
          Вже маєте акаунт?{' '}
          <Link
            href="/login"
            className="font-semibold text-[#F2B544] transition hover:text-[#FFC85C]"
          >
            Увійти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthField label="Ім'я" htmlFor="name" error={errors.name?.message}>
          <AuthInput
            id="name"
            {...register('name')}
            placeholder="Дмитро"
            autoComplete="name"
            error={!!errors.name}
          />
        </AuthField>

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
            placeholder="Щонайменше 8 символів"
            autoComplete="new-password"
            error={!!errors.password}
          />
        </AuthField>

        {serverError && <AuthAlert>{serverError}</AuthAlert>}

        <AuthButton
          type="submit"
          loading={isSubmitting}
          loadingText="Створення акаунта..."
        >
          Створити акаунт
        </AuthButton>
      </form>

      <AuthDivider />

      <GoogleAuthButton />

      <p className="mt-6 text-center text-xs leading-5 text-[#6F6F7C]">
        Створюючи акаунт, ви погоджуєтесь з умовами використання сервісу.
      </p>
    </AuthCard>
  );
}