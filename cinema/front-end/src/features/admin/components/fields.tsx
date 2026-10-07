import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

const control = (error?: boolean) =>
  `w-full rounded-xl border bg-[#0E0E13] px-3.5 text-sm text-[#F4F4F5] outline-none transition placeholder:text-[#5E5E6B] [color-scheme:dark] focus:ring-4 ${
    error
      ? 'border-[#FF7A7A] focus:border-[#FF7A7A] focus:ring-[#FF7A7A]/15'
      : 'border-[#262631] focus:border-[#F2B544] focus:ring-[#F2B544]/15'
  }`;

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[#D8D8E0]">
        {label}
      </label>

      {children}

      {error ? (
        <p className="text-xs text-[#FF7A7A]">{error}</p>
      ) : (
        hint && <p className="text-xs text-[#6F6F7C]">{hint}</p>
      )}
    </div>
  );
}

export function TextInput({
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  ref?: Ref<HTMLInputElement>;
}) {
  return (
    <input
      {...props}
      aria-invalid={error}
      className={`h-11 ${control(error)} ${className}`}
    />
  );
}

export function TextArea({
  error,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={error}
      className={`min-h-28 resize-y py-2.5 ${control(error)} ${className}`}
    />
  );
}

export function SelectInput({
  error,
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={error}
      className={`h-11 ${control(error)} ${className}`}
    >
      {children}
    </select>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

const buttonBase =
  'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60';

function Spinner({ tone }: { tone: 'dark' | 'light' }) {
  return (
    <span
      className={`h-4 w-4 animate-spin rounded-full border-2 ${
        tone === 'dark'
          ? 'border-[#17130A]/30 border-t-[#17130A]'
          : 'border-white/30 border-t-white'
      }`}
    />
  );
}

export function PrimaryButton({
  loading = false,
  loadingText,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      className={`${buttonBase} bg-[#F2B544] text-[#17130A] hover:bg-[#FFC85C] focus-visible:ring-[#F2B544]/30 ${className}`}
    >
      {loading && <Spinner tone="dark" />}
      {loading ? (loadingText ?? children) : children}
    </button>
  );
}

export function SecondaryButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`${buttonBase} border border-[#262631] text-[#F4F4F5] hover:bg-white/5 focus-visible:ring-white/10 ${className}`}
    />
  );
}

export function DangerButton({
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      className={`${buttonBase} bg-[#D03B3B] text-white hover:bg-[#E04848] focus-visible:ring-[#D03B3B]/30 ${className}`}
    >
      {loading && <Spinner tone="light" />}
      {children}
    </button>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-[#5A2226] bg-[#2A1416] px-4 py-3 text-sm text-[#FF9A9A]"
    >
      {children}
    </div>
  );
}

export function FormActions({
  onCancel,
  submitting,
  submitLabel,
}: {
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <SecondaryButton onClick={onCancel}>Скасувати</SecondaryButton>

      <PrimaryButton type="submit" loading={submitting} loadingText="Збереження...">
        {submitLabel}
      </PrimaryButton>
    </div>
  );
}
