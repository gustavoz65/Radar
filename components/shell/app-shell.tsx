import Link from 'next/link';
import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <MobileNav />
          <Link href="/visao-geral" className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-gold" aria-hidden />
            <span className="font-mono text-sm tracking-widest text-text">RADAR</span>
          </Link>
          <div className="ml-6 flex-1">
            <DesktopNav />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
