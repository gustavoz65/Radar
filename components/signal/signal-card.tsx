import Link from 'next/link';
import type { Signal } from '@/lib/types';
import { ConfidenceGauge } from './confidence-gauge';
import { FactorBreakdown } from './factor-breakdown';
import { SignalDisclaimer } from './signal-disclaimer';
import { assetClassLabels } from './asset-class-labels';

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
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 self-center sm:self-start">
          <ConfidenceGauge score={signal.score} size="mini" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-muted">
              {assetClassLabels[signal.assetClass]}
            </span>
            <h2 className="text-lg leading-snug font-semibold text-text">{title}</h2>
            <p className="text-sm leading-relaxed text-muted">{signal.summary}</p>
          </div>
          <FactorBreakdown factors={signal.factors} />
          <SignalDisclaimer text={signal.disclaimer} />
        </div>
      </div>
    </article>
  );
}
