import Link from 'next/link';
import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';
import { RadarMark } from './radar-mark';
import { CurrentSection } from './current-section';
import { TerrainField } from '@/components/common/terrain';
import { PageTransition } from '@/components/common/page-transition';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <TerrainField />

      <header className="sticky top-0 z-40 border-b border-border bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <MobileNav />
          <Link
            href="/visao-geral"
            className="group flex items-center gap-2.5"
            aria-label="Radar — ir para a visão geral"
          >
            <RadarMark className="size-5 shrink-0" />
            <span className="font-mono text-sm tracking-[0.28em] text-text">RADAR</span>
          </Link>
          <div className="ml-6 flex-1">
            <DesktopNav />
          </div>
          {/* On mobile the nav collapses into the sheet, so the header is the
              only place left that answers "which screen am I on". */}
          <CurrentSection className="lg:hidden" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <PageTransition>{children}</PageTransition>
      </main>

      <footer className="mt-8 border-t border-border">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-1 px-4 py-6 sm:px-6">
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
            Radar · inteligência financeira pessoal
          </p>
          <p className="max-w-2xl text-xs leading-relaxed text-muted">
            Todo score é calculado por fórmula determinística e vem acompanhado dos fatores que o
            compõem. O Radar não recomenda a compra ou a venda de nenhum ativo.
          </p>
        </div>
      </footer>
    </div>
  );
}
