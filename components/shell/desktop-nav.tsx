'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navLinks } from './nav-links';

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="hidden lg:flex lg:items-center lg:gap-1">
      {navLinks.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              // py-2.5 makes the target ~40px: still comfortable with a mouse and
              // no longer cramped on a tablet, which also lands on the lg breakpoint.
              'rounded-md px-3 py-2.5 text-sm transition-colors',
              active ? 'bg-surface text-text' : 'text-muted hover:bg-surface/60 hover:text-text',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
