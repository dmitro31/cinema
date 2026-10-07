'use client';

import {
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { Logo } from '../site/components/Logo';

interface AuthCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  return (
    <div className="w-full">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="rounded-3xl border border-[#262631] bg-[#121218]/90 p-7 shadow-2xl shadow-black/40 backdrop-blur sm:p-9">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#F2B544]">
          {eyebrow}
        </p>

        <h1 className="text-3xl font-bold tracking-tight text-[#F4F4F5]">
          {title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-[#9A9AA8]">
          {description}
        </p>

        <div className="mt-8">{children}</div>
      </div>

      {footer && (
        <div className="mt-6 text-center text-sm text-[#9A9AA8]">
          {footer}
        </div>
      )}
    </div>
  );
}

interface AuthFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export function AuthField({ label, htmlFor, error, children }: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[#D8D8E0]"
      >
        {label}
      </label>

      {children}

      {error && <p className="text-xs text-[#FF7A7A]">{error}</p>}
    </div>
  );
}

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function AuthInput({
  error = false,
  className = '',
  ...props
}: AuthInputProps) {
  return (
    <input
      {...props}
      aria-invalid={error}
      className={`h-12 w-full rounded-xl border bg-[#0E0E13] px-4 text-sm text-[#F4F4F5] outline-none transition placeholder:text-[#5E5E6B] focus:ring-4 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#0E0E13] [&:-webkit-autofill]:[-webkit-text-fill-color:#F4F4F5] ${
        error
          ? 'border-[#FF7A7A] focus:border-[#FF7A7A] focus:ring-[#FF7A7A]/15'
          : 'border-[#262631] focus:border-[#F2B544] focus:ring-[#F2B544]/15'
      } ${className}`}
    />
  );
}

export function AuthPasswordInput({
  className = '',
  ...props
}: Omit<AuthInputProps, 'type'>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <AuthInput
        {...props}
        type={visible ? 'text' : 'password'}
        className={`pr-12 ${className}`}
      />

      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? 'Сховати пароль' : 'Показати пароль'}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#6F6F7C] transition hover:text-[#F2B544]"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  );
}

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export function AuthButton({
  children,
  loading = false,
  loadingText = 'Завантаження...',
  disabled,
  className = '',
  ...props
}: AuthButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F2B544] px-5 text-sm font-semibold text-[#17130A] transition hover:bg-[#FFC85C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F2B544]/30 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#17130A]/30 border-t-[#17130A]" />
      )}
      {loading ? loadingText : children}
    </button>
  );
}

export function AuthAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[#5A2226] bg-[#2A1416] px-4 py-3 text-sm text-[#FF9A9A]"
    >
      {children}
    </div>
  );
}
export function AuthDivider({ label = 'або' }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#262631]" />
      <span className="text-xs uppercase tracking-widest text-[#6F6F7C]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[#262631]" />
    </div>
  );
}