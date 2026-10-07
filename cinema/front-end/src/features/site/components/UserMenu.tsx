'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/provider/auth-provider';

import {
  ChevronDownIcon,
  LogoutIcon,
  ReceiptIcon,
  ShieldIcon,
  TicketIcon,
  UserIcon,
} from './icons';

const itemClass =
  'flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[#D8D8D8] outline-none transition hover:bg-white/5 hover:text-[#D9AE4E] focus-visible:bg-white/5 focus-visible:text-[#D9AE4E]';

export function UserAvatar({
  name,
  url,
  size = 'size-8',
}: {
  name: string;
  url: string | null;
  size?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${size} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${size} flex items-center justify-center rounded-full bg-[#D9AE4E] text-sm font-bold text-[#14110A]`}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export function UserMenu() {
  const { user, isAuth, isLoading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (isLoading) {
    return <div className="size-11 animate-pulse rounded-full bg-white/5 md:w-28 md:rounded-none" aria-hidden="true" />;
  }

  if (!isAuth || !user) {
    return (
      <Link
        href="/login"
        aria-label="Увійти"
        className="flex h-11 items-center gap-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#E4E4E4] outline-none transition hover:text-[#D9AE4E] focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
      >
        <UserIcon width={24} height={24} />
        <span className="hidden md:inline">Увійти</span>
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Акаунт"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-3 px-2 outline-none transition hover:text-[#D9AE4E] focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
      >
        <UserAvatar name={user.name} url={user.avatarUrl} size="size-9" />
        <span className="hidden max-w-32 truncate text-xs font-semibold uppercase tracking-[0.14em] md:inline">
          {user.name}
        </span>
        <ChevronDownIcon
          width={16}
          height={16}
          className={`hidden text-[#8C8C8C] transition md:block ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] w-64 border border-[#2A2A2A] bg-[#101010] py-2 shadow-2xl shadow-black"
        >
          <div className="border-b border-[#242424] px-4 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-[#8C8C8C]">{user.email}</p>
          </div>

          <div className="pt-2">
            <Link role="menuitem" href="/tickets" onClick={() => setOpen(false)} className={itemClass}>
              <TicketIcon className="text-[#8C8C8C]" />
              Мої квитки
            </Link>
            <Link role="menuitem" href="/orders" onClick={() => setOpen(false)} className={itemClass}>
              <ReceiptIcon className="text-[#8C8C8C]" />
              Мої замовлення
            </Link>
            {user.role === 'ADMIN' && (
              <Link role="menuitem" href="/admin" onClick={() => setOpen(false)} className={itemClass}>
                <ShieldIcon className="text-[#D9AE4E]" />
                Адмінка
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
              className={`${itemClass} text-[#FF8A8A]`}
            >
              <LogoutIcon />
              Вийти
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
