import Link from 'next/link';

import { formatTime } from '@/features/admin/lib/format';
import type { Session } from '@/features/admin/catalog-types';

import { isUpcoming } from '../lib/sessions';

interface SessionChipsProps {
  sessions: Session[];
  align?: 'start' | 'center';
}

export function SessionChips({ sessions, align = 'start' }: SessionChipsProps) {
  return (
    <ul className={`flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
      {sessions.map((session) => {
        const time = formatTime(session.startAt);

        return (
          <li key={session.id}>
            {isUpcoming(session) ? (
              <Link
                href={`/sessions/${session.id}`}
                aria-label={`Сеанс о ${time}`}
                className="flex h-11 min-w-[76px] items-center justify-center border border-[#3A3A3A] bg-black/40 px-4 text-base font-medium tabular-nums text-white outline-none transition hover:border-[#D9AE4E] hover:text-[#D9AE4E] focus-visible:border-[#D9AE4E] focus-visible:ring-2 focus-visible:ring-[#D9AE4E]/40"
              >
                {time}
              </Link>
            ) : (
              <span
                aria-label={`Сеанс о ${time} вже розпочався`}
                className="flex h-11 min-w-[76px] items-center justify-center border border-[#232323] px-4 text-base tabular-nums text-[#4A4A4A]"
              >
                {time}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
