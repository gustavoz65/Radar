import Link from 'next/link';
import type { Signal } from '@/lib/types';
import { ConfidenceGauge } from './confidence-gauge';
import { FactorBreakdown } from './factor-breakdown';
import { SignalDisclaimer } from './signal-disclaimer';
import { assetClassLabels } from './asset-class-labels';
import { formatDateTime } from '@/lib/format/date';
import { DataLabel } from '@/components/common/typography';
import { surfaceCardClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';

export function SignalDetail({ signal }: { signal: Signal }) {
  return (
    <div className="space-y-6">
      <Link href="/sinais" className="inline-block text-sm text-accent hover:underline">
        ← Voltar para os sinais
      </Link>

      {/* The gauge column is a fixed width (px), not fluid (fr) like the overview:
          here it is an identification panel for the signal, with predictably sized
          content — not content that gains anything from growing with the screen. */}
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className={cn('flex flex-col items-center gap-3', surfaceCardClass)}>
          <ConfidenceGauge score={signal.score} size="large" />
          <DataLabel>{assetClassLabels[signal.assetClass]}</DataLabel>
          <p className="text-xs text-muted">Atualizado em {formatDateTime(signal.updatedAt)}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl leading-snug font-semibold text-text">{signal.title}</h1>
            <p className="leading-relaxed text-muted">{signal.summary}</p>
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
