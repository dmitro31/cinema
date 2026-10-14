import Link from 'next/link';

import { CONTACTS } from './lib/site-info';
import { Logo } from './Logo';
import { SocialLinks } from './SocialLinks';

const link =
  'block text-sm text-[#A8A8A8] outline-none transition hover:text-[#D9AE4E] focus-visible:text-[#D9AE4E] focus-visible:underline';

const heading = 'mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#D9AE4E]';

export function SiteFooter() {
  return (
    <footer className="mt-28 border-t border-[#1F1F1F] bg-black">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-10">
        <div className="space-y-6">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-[#8C8C8C]">
            Обирайте фільм, місце в залі й отримуйте квиток із QR-кодом на пошту та в особистому кабінеті.
          </p>
          <SocialLinks />
        </div>

        <nav aria-label="Кіно">
          <h2 className={heading}>Кіно</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/#schedule" className={link}>Зараз у кіно</Link>
            </li>
            <li>
              <Link href="/schedule" className={link}>Найближчий сеанс</Link>
            </li>
            <li>
              <Link href="/soon" className={link}>Скоро у кіно</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Акаунт">
          <h2 className={heading}>Акаунт</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/tickets" className={link}>Мої квитки</Link>
            </li>
            <li>
              <Link href="/orders" className={link}>Мої замовлення</Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className={heading}>Допомога та контакти</h2>
          <ul className="space-y-3">
            <li>
              <Link href="/orders" className={link}>Повернення квитків</Link>
            </li>
          </ul>

          <address className="mt-6 space-y-2 text-sm not-italic">
            <p className="text-[#8C8C8C]">{CONTACTS.address}</p>
            <a
              href={CONTACTS.phoneHref}
              className="inline-block text-[#D9AE4E] outline-none transition hover:text-[#E8C46A] focus-visible:text-[#E8C46A] focus-visible:underline"
            >
              {CONTACTS.phone}
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-[#1F1F1F] py-5 text-center text-xs text-[#6A6A6A]">
        © {new Date().getFullYear()} Cinema
      </div>
    </footer>
  );
}