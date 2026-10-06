import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({
  error = false,
  className = '',
  ...props
}: InputProps) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border bg-white px-4 text-sm text-[#171A18] outline-none transition placeholder:text-[#9A9F99] focus:ring-2 ${
        error
          ? 'border-[#B3261E] focus:border-[#B3261E] focus:ring-[#FBEDEC]'
          : 'border-[#DFE3DC] focus:border-[#24493B] focus:ring-[#E7EEE9]'
      } ${className}`}
    />
  );
}
