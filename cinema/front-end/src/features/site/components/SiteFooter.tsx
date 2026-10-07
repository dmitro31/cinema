import Link from 'next/link';

import { Logo } from './Logo';

const link = 'block text-sm text-[#A8A8A8] transition hover:text-[#D9AE4E]';
const heading = 'mb-4 text-xs font-bold uppercase tracking-[0.22em] text-white';

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-[#1F1F1F] bg-black">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-5">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-[#8C8C8C]">
            Обирайте фільм, місце в залі й отримуйте квиток із QR-кодом на пошту та в особистому кабінеті.
          </p>
        </div>

        <nav aria-label="Кіно">
          <p className={heading}>Кіно</p>
          <div className="space-y-3">
            <Link href="/#schedule" className={link}>Афіша</Link>
            <Link href="/#soon" className={link}>Скоро в кіно</Link>
          </div>
        </nav>

        <nav aria-label="Акаунт">
          <p className={heading}>Акаунт</p>
          <div className="space-y-3">
            <Link href="/tickets" className={link}>Мої квитки</Link>
            <Link href="/orders" className={link}>Мої замовлення</Link>
          </div>
        </nav>
      </div>

      <div className="border-t border-[#1F1F1F] py-5 text-center text-xs text-[#6A6A6A]">
        © {new Date().getFullYear()} Cinema
      </div>
    </footer>
  );
}
