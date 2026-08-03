import Link from 'next/link';
import type { Signal } from '@/lib/types';
import { ConfidenceGauge } from './confidence-gauge';
import { FactorBreakdown } from './factor-breakdown';
import { SignalDisclaimer } from './signal-disclaimer';
import { assetClassLabels } from './asset-class-labels';
import { DataLabel, PanelTitle } from '@/components/common/typography';
import { instrumentCardClass, interactiveSurfaceClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';

/**
 * A Signal is never rendered without its factor breakdown and disclaimer.
 * Keeping all three in one component makes that impossible to forget.
 */
export function SignalCard({ signal, href }: { signal: Signal; href?: string }) {
  /* The card holds no other link, so the title stretches over the whole
     surface: the reader gets a card-sized target and a screen reader still
     gets the signal's name as the link text. */
  const title = href ? (
    <Link
      href={href}
      className="rounded-sm transition-colors duration-(--dur-1) after:absolute after:inset-0 after:content-[''] hover:text-accent"
    >
      {signal.title}
    </Link>
  ) : (
    signal.title
  );

  return (
    <article className={cn(instrumentCardClass, href && interactiveSurfaceClass)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 self-center sm:self-start">
          <ConfidenceGauge score={signal.score} size="mini" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <DataLabel as="span">{assetClassLabels[signal.assetClass]}</DataLabel>
            <PanelTitle size="lg">{title}</PanelTitle>
            <p className="text-sm leading-relaxed text-muted">{signal.summary}</p>
          </div>
          <FactorBreakdown factors={signal.factors} />
          <SignalDisclaimer text={signal.disclaimer} />
        </div>
      </div>
    </article>
  );
}
