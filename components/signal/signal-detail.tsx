import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Signal } from '@/lib/types';
import { ConfidenceGauge } from './confidence-gauge';
import { FactorBreakdown } from './factor-breakdown';
import { SignalDisclaimer } from './signal-disclaimer';
import { assetClassLabels } from './asset-class-labels';
import { formatDateTime } from '@/lib/format/date';
import { DataLabel, DisplayTitle, Eyebrow } from '@/components/common/typography';
import { instrumentCardClass, surfaceCardClass } from '@/components/common/surface';
import { staggerClass } from '@/components/common/motion';
import { cn } from '@/lib/utils';

export function SignalDetail({ signal }: { signal: Signal }) {
  return (
    <div className="space-y-8">
      <Link
        href="/sinais"
        className="group inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-faint transition-colors duration-(--dur-1) hover:text-text"
      >
        <ArrowLeft
          className="size-3.5 transition-transform duration-(--dur-2) ease-(--ease-out-radar) group-hover:-translate-x-0.5"
          aria-hidden
        />
        Voltar para os sinais
      </Link>

      {/* The gauge column is a fixed width (px), not fluid (fr) like the overview:
          here it is an identification panel for the signal, with predictably sized
          content — not content that gains anything from growing with the screen. */}
      <div className={cn('grid gap-6 lg:grid-cols-[320px_1fr]', staggerClass)}>
        <div className={cn(instrumentCardClass, 'flex flex-col items-center gap-3')}>
          <ConfidenceGauge score={signal.score} size="large" />
          <DataLabel>{assetClassLabels[signal.assetClass]}</DataLabel>
          <p className="text-xs text-muted">Atualizado em {formatDateTime(signal.updatedAt)}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Eyebrow>Cenário</Eyebrow>
            {/* The signal's own title is the page's h1, so it takes the display
                step at a reduced size and in full text: it is a sentence, not a
                one-word route name. */}
            <DisplayTitle className="text-[clamp(1.5rem,1rem+1.8vw,2rem)] text-text">
              {signal.title}
            </DisplayTitle>
            <p className="max-w-2xl leading-relaxed text-muted">{signal.summary}</p>
          </div>

          <div className={surfaceCardClass}>
            <FactorBreakdown factors={signal.factors} headingLevel="h2" />
          </div>

          <SignalDisclaimer text={signal.disclaimer} />
        </div>
      </div>
    </div>
  );
}
