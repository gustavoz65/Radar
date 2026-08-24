'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { navLinks } from './nav-links';
import { eyebrowClass } from '@/components/common/typography';
import { staggerClass } from '@/components/common/motion';
import { wellClass } from '@/components/common/surface';

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Abrir menu"
        className="rounded-md p-2 text-muted transition-colors duration-(--dur-1) hover:bg-surface hover:text-text lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-border bg-surface p-0">
        <SheetTitle className={cn('border-b border-border px-5 py-4', eyebrowClass)}>
          Navegação
        </SheetTitle>
        <nav aria-label="Navegação principal" className={cn('flex flex-col p-2', staggerClass)}>
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative rounded-md px-3 py-3 text-base transition-colors duration-(--dur-1)',
                  active
                    ? cn(wellClass, 'border-transparent text-text')
                    : 'text-muted hover:bg-well hover:text-text',
                )}
              >
                {active ? (
                  <span aria-hidden className="absolute inset-y-2 left-0 w-px bg-accent" />
                ) : null}
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
