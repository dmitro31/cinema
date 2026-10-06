
import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({
  label,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[#171A18]">
        {label}
      </label>

      {children}

      {error && (
        <p className="text-xs text-[#B3261E]">
          {error}
        </p>
      )}
    </div>
  );
}

