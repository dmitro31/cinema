'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/provider/auth-provider';

import { CloseIcon } from './icons';
import { Logo } from './Logo';

interface MenuOverlayProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
}

interface MenuLink {
  href: string;
  label: string;
}

const CINEMA_LINKS: MenuLink[] = [
  { href: '/#schedule', label: 'Зараз у кіно' },
  { href: '/#soon', label: 'Скоро у кіно' },
];

const heading =
  'border-b border-[#242424] pb-3 text-sm font-bold uppercase tracking-[0.22em] text-[#D9AE4E]';

const linkBase =
  'flex items-center gap-3 py-1 text-lg outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]';

export function MenuOverlay({ open, onClose, pathname }: MenuOverlayProps) {
  const { user, isAuth, isLoading, logout } = useAuth();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const accountLinks: MenuLink[] = isAuth
    ? [
        { href: '/tickets', label: 'Мої квитки' },
        { href: '/orders', label: 'Мої замовлення' },
        ...(user?.role === 'ADMIN' ? [{ href: '/admin', label: 'Адмінка' }] : []),
      ]
    : [
        { href: '/login', label: 'Увійти' },
        { href: '/register', label: 'Реєстрація' },
      ];

  return (
    <dialog
      ref={ref}
      aria-label="Меню"
      onClose={onClose}
      className="m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-[#0C0C0C] p-0 text-white backdrop:bg-black"
    >
      <div className="mx-auto flex min-h-full max-w-[1400px] flex-col px-4 sm:px-8">
        <div className="flex h-16 items-center justify-between sm:h-20">
          <Logo />
          <button
            type="button"
            aria-label="Закрити меню"
            onClick={onClose}
            className="flex size-12 items-center justify-center rounded-full border border-[#D9AE4E] text-[#D9AE4E] outline-none transition hover:bg-[#D9AE4E] hover:text-[#14110A] focus-visible:ring-2 focus-visible:ring-[#D9AE4E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0C0C]"
          >
            <CloseIcon width={24} height={24} />
          </button>
        </div>

        <div className="grid flex-1 content-start gap-12 py-12 md:grid-cols-2 md:py-20 lg:gap-24">
          <nav aria-label="Кіно">
            <h2 className={heading}>Кіно</h2>
            <ul className="mt-6 space-y-4">
              {CINEMA_LINKS.map((item, index) => {
                const active = pathname === '/' && index === 0;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={`${linkBase} ${active ? 'font-semibold text-[#D9AE4E]' : 'text-[#CFCFCF]'}`}
                    >
                      {active && <span className="size-2 rounded-full bg-[#D9AE4E]" aria-hidden="true" />}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <nav aria-label="Акаунт">
            <h2 className={heading}>Акаунт</h2>
            {isLoading ? (
              <div className="mt-6 space-y-4" aria-hidden="true">
                <div className="h-7 w-40 animate-pulse bg-white/5" />
                <div className="h-7 w-48 animate-pulse bg-white/5" />
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {accountLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`${linkBase} text-[#CFCFCF]`}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                {isAuth && (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        void logout();
                      }}
                      className={`${linkBase} text-[#FF8A8A] hover:text-[#FFB0B0]`}
                    >
                      Вийти
                    </button>
                  </li>
                )}
              </ul>
            )}
          </nav>
        </div>

        <p className="border-t border-[#1F1F1F] py-6 text-xs text-[#6A6A6A]">
          © {new Date().getFullYear()} Cinema
        </p>
      </div>
    </dialog>
  );
}
