'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navLinks } from './nav-links';

/**
 * Navigation on this app is a server round-trip to MySQL, so a click can sit
 * for a beat with nothing to show for it. `useLinkStatus` only reports for the
 * `<Link>` it is rendered inside, which is exactly the granularity wanted: the
 * item you clicked is the one that scans.
 */
function LinkScan() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span aria-hidden className="absolute inset-x-1 bottom-0 h-px overflow-hidden">
      <span className="animate-scan block h-px w-1/4 bg-accent" />
    </span>
  );
}

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="hidden lg:flex lg:items-center lg:gap-0.5">
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
              'relative rounded-md px-3 py-2.5 text-sm transition-colors duration-(--dur-1)',
              active ? 'text-text' : 'text-muted hover:text-text',
            )}
          >
            {link.label}
            {/* The active marker grows from the left rather than fading in, so
                switching tabs reads as travel along the bar. */}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-2 -bottom-px h-px origin-left bg-accent transition-transform duration-(--dur-2) ease-(--ease-out-radar)',
                active ? 'scale-x-100' : 'scale-x-0',
              )}
            />
            <LinkScan />
          </Link>
        );
      })}
    </nav>
  );
}
