import Link from 'next/link';
import type { Signal } from '@/lib/types';
import { ConfidenceGauge } from './confidence-gauge';
import { FactorBreakdown } from './factor-breakdown';
import { SignalDisclaimer } from './signal-disclaimer';
import { assetClassLabels } from './asset-class-labels';
import { DataLabel, PanelTitle } from '@/components/common/typography';
import { surfaceCardClass } from '@/components/common/surface';

/**
 * A Signal is never rendered without its factor breakdown and disclaimer.
 * Keeping all three in one component makes that impossible to forget.
 */
export function SignalCard({ signal, href }: { signal: Signal; href?: string }) {
  const title = href ? (
    <Link href={href} className="text-accent hover:underline">
      {signal.title}
    </Link>
  ) : (
    signal.title
  );

  return (
    <article className={surfaceCardClass}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 self-center sm:self-start">
          <ConfidenceGauge score={signal.score} size="mini" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1.5">
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
