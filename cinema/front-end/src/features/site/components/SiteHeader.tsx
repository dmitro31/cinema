'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { MenuIcon } from './icons';
import { Logo } from './Logo';
import { MenuOverlay } from './MenuOverlay';
import { UserMenu } from './UserMenu';

export function SiteHeader() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const menuOpen = menuPath === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => {
    setMenuPath(null);
    burgerRef.current?.focus();
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
        scrolled ? 'border-[#1F1F1F] bg-[#0A0A0A]/95 backdrop-blur' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-4 sm:px-8">
        <Logo />

        <div className="flex items-center gap-1">
          <UserMenu />

          <button
            ref={burgerRef}
            type="button"
            aria-label="Відкрити меню"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuPath(pathname)}
            className="flex size-11 items-center justify-center text-white outline-none transition hover:text-[#D9AE4E] focus-visible:ring-2 focus-visible:ring-[#D9AE4E]"
          >
            <MenuIcon width={28} height={28} />
          </button>
        </div>
      </div>

      <MenuOverlay open={menuOpen} onClose={closeMenu} pathname={pathname} />
    </header>
  );
}
