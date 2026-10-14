import type { SVGProps } from 'react';

import { SOCIAL_LINKS } from './lib/site-info';

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

const icons = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

export function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex gap-3 ${className}`}>
      {SOCIAL_LINKS.map((social) => {
        const Icon = icons[social.id];

        return (
          <li key={social.id}>
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
  );
}