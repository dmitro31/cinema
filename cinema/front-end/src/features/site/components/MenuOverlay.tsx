'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode, type SVGProps } from 'react';

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
  external?: boolean;
}

const DURATION_MS = 300;

const CONTACTS = {
  address: 'м. Івано-Франківськ, вул. Прикладна 1',
  phone: '(000) 000 0000',
  phoneHref: 'tel:+380000000000',
};

const CINEMA_LINKS: MenuLink[] = [
  { href: '/#schedule', label: 'Зараз у кіно' },
  { href: '/schedule', label: 'Найближчий сеанс' },
  { href: '/soon', label: 'Скоро у кіно' },
];

const HELP_LINKS: MenuLink[] = [
  { href: '/orders', label: 'Повернення квитків' },
  { href: CONTACTS.phoneHref, label: "Зв'язатись з нами", external: true },
];

const heading =
  'border-b border-[#242424] pb-3 text-sm font-bold uppercase tracking-[0.22em] text-[#D9AE4E]';

const linkBase =
  'flex items-center gap-3 py-1 text-lg outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E]';

const reveal = (shown: boolean) =>
  `transition duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-none ${
    shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
  }`;

const delay = (shown: boolean, index: number) => ({
  transitionDelay: shown ? `${120 + index * 90}ms` : '0ms',
});

const isActive = (href: string, pathname: string) =>
  href === '/#schedule' ? pathname === '/' : href === pathname;

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const SOCIALS = [
  { href: 'https://www.instagram.com', label: 'Instagram', icon: InstagramIcon },
  { href: 'https://www.facebook.com', label: 'Facebook', icon: FacebookIcon },
];

function NavLink({
  item,
  active = false,
  onClose,
}: {
  item: MenuLink;
  active?: boolean;
  onClose: () => void;
}) {
  const className = `${linkBase} ${active ? 'font-semibold text-[#D9AE4E]' : 'text-[#CFCFCF]'}`;

  const content = (
    <>
      {active && <span className="size-2 rounded-full bg-[#D9AE4E]" aria-hidden="true" />}
      {item.label}
    </>
  );

  if (item.external) {
    return (
      <a href={item.href} onClick={onClose} className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClose}
      aria-current={active ? 'page' : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}

function Column({
  title,
  shown,
  index,
  children,
}: {
  title: string;
  shown: boolean;
  index: number;
  children: ReactNode;
}) {
  return (
    <nav aria-label={title} className={reveal(shown)} style={delay(shown, index)}>
      <h2 className={heading}>{title}</h2>
      {children}
    </nav>
  );
}

export function MenuOverlay({ open, onClose, pathname }: MenuOverlayProps) {
  const { user, isAuth, isLoading, logout } = useAuth();
  const ref = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);

  const shown = open && ready;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      dialog.getBoundingClientRect();
      const frame = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => {
      if (dialog.open) dialog.close();
      setReady(false);
    }, DURATION_MS);

    return () => window.clearTimeout(timer);
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
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-[#0C0C0C] p-0 text-white transition-opacity duration-300 ease-out backdrop:bg-black motion-reduce:transition-none ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
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

        <div className="grid flex-1 content-start gap-12 py-12 md:grid-cols-3 md:py-20 lg:gap-16">
          <Column title="Кіно" shown={shown} index={0}>
            <ul className="mt-6 space-y-4">
              {CINEMA_LINKS.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={isActive(item.href, pathname)} onClose={onClose} />
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Акаунт" shown={shown} index={1}>
            {isLoading ? (
              <div className="mt-6 space-y-4" aria-hidden="true">
                <div className="h-7 w-40 animate-pulse bg-white/5" />
                <div className="h-7 w-48 animate-pulse bg-white/5" />
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {accountLinks.map((item) => (
                  <li key={item.href}>
                    <NavLink item={item} active={isActive(item.href, pathname)} onClose={onClose} />
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
          </Column>

          <Column title="Допомога та контакти" shown={shown} index={2}>
            <ul className="mt-6 space-y-4">
              {HELP_LINKS.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} onClose={onClose} />
                </li>
              ))}
            </ul>
          </Column>
        </div>

        <div
          className={`border-t border-[#1F1F1F] py-8 ${reveal(shown)}`}
          style={delay(shown, 3)}
        >
          <p className="text-sm text-[#6A6A6A]">{CONTACTS.address}</p>
          <a
            href={CONTACTS.phoneHref}
            className="mt-2 inline-block text-base text-[#D9AE4E] outline-none transition hover:text-[#E8C46A] focus-visible:text-[#E8C46A]"
          >
            {CONTACTS.phone}
          </a>

          <ul className="mt-6 flex gap-3">
            {SOCIALS.map((social) => {
              const Icon = social.icon;

              return (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-12 items-center justify-center rounded-full border border-[#2A2A2A] text-[#CFCFCF] outline-none transition hover:border-[#D9AE4E] hover:text-[#D9AE4E] focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
                  >
                    <Icon width={22} height={22} />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </dialog>
  );
}