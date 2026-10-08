import Link from 'next/link';

import { filledButton, outlineButton } from "@/shared/button-classes"

interface StateMessageProps {
  title: string;
  text: string;
  onRetry?: () => void;
  loginHref?: string;
}

export function StateMessage({ title, text, onRetry, loginHref }: StateMessageProps) {
  return (
    <div role="alert" className="mx-auto flex max-w-[1400px] flex-col items-center gap-4 px-4 py-40 text-center">
      <h1 className="text-2xl font-bold uppercase tracking-[0.18em]">{title}</h1>
      <p className="text-sm text-[#A8A8A8]">{text}</p>
      <div className="mt-2 flex gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className={outlineButton}>
            Спробувати ще раз
          </button>
        )}
        {loginHref && (
          <Link href={loginHref} className={filledButton}>
            Увійти
          </Link>
        )}
        <Link href="/" className={loginHref ? outlineButton : filledButton}>
          На головну
        </Link>
      </div>
    </div>
  );
}