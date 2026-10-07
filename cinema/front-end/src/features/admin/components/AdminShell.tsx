'use client';

import type { ComponentType, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/provider/auth-provider';

import {
  CalendarIcon,
  DashboardIcon,
  ExternalIcon,
  FilmIcon,
  HallIcon,
  LogoutIcon,
  OrdersIcon,
  PaymentsIcon,
  ScanIcon,
  TagIcon,
} from './icons';

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Аналітика',
    items: [
      { href: '/admin', label: 'Дашборд', exact: true, icon: DashboardIcon },
      { href: '/admin/orders', label: 'Замовлення', icon: OrdersIcon },
      { href: '/admin/payments', label: 'Платежі', icon: PaymentsIcon },
    ],
  },
  {
    title: 'Каталог',
    items: [
      { href: '/admin/movies', label: 'Фільми', icon: FilmIcon },
      { href: '/admin/sessions', label: 'Сеанси', icon: CalendarIcon },
      { href: '/admin/halls', label: 'Зали', icon: HallIcon },
      { href: '/admin/genres', label: 'Жанри', icon: TagIcon },
    ],
  },
  {
    title: 'Операції',
    items: [{ href: '/admin/tickets', label: 'Перевірка квитків', icon: ScanIcon }],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-lg font-bold tracking-tight text-[#F4F4F5]">CINEMA</span>
      <span className="rounded-md bg-[#F2B544]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#F2B544]">
        Admin
      </span>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#0B0B0F] text-[#F4F4F5]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#1E1E28] bg-[#0E0E13] lg:flex">
        <div className="px-6 py-6">
          <Brand />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3" aria-label="Адмін-меню">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-[#6F6F7C]">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                        active
                          ? 'bg-[#F2B544]/10 text-[#F2B544]'
                          : 'text-[#9A9AA8] hover:bg-white/5 hover:text-[#F4F4F5]'
                      }`}
                    >
                      <item.icon />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-[#1E1E28] p-4">
          <div className="flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2B544] text-sm font-bold text-[#17130A]">
              {user?.name.slice(0, 1).toUpperCase()}
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#F4F4F5]">{user?.name}</p>
              <p className="truncate text-xs text-[#6F6F7C]">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/"
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#262631] text-sm text-[#C3C2B7] transition hover:bg-white/5"
            >
              <ExternalIcon className="h-4 w-4" />
              На сайт
            </Link>

            <button
              type="button"
              onClick={() => void logout()}
              className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#262631] text-sm text-[#C3C2B7] transition hover:bg-white/5"
            >
              <LogoutIcon className="h-4 w-4" />
              Вийти
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-[#1E1E28] bg-[#0E0E13] lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Brand />

            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Вийти"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9A9AA8] transition hover:bg-white/5"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="Адмін-меню">
            {ALL_ITEMS.map((item) => {
              const active = isActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition ${
                    active
                      ? 'bg-[#F2B544]/10 text-[#F2B544]'
                      : 'text-[#9A9AA8] hover:bg-white/5'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
