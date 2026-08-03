'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navLinks } from './nav-links';

/** Reads the active tab's label out of the same list the nav renders from. */
export function CurrentSection({ className }: { className?: string }) {
  const pathname = usePathname();
  const current = navLinks.find((link) => pathname.startsWith(link.href));

  if (!current) return null;

  return (
    <span
      className={cn(
        'truncate font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-faint',
        className,
      )}
    >
      {current.label}
    </span>
  );
}
