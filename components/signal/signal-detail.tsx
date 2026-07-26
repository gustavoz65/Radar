import Link from 'next/link';
import type { Signal } from '@/lib/types';
import { ConfidenceGauge } from './confidence-gauge';
import { FactorBreakdown } from './factor-breakdown';
import { SignalDisclaimer } from './signal-disclaimer';
import { assetClassLabels } from './asset-class-labels';
import { formatDateTime } from '@/lib/format/date';

export function SignalDetail({ signal }: { signal: Signal }) {
  return (
    <div className="space-y-6">
      <Link href="/sinais" className="inline-block text-sm text-accent hover:underline">
        ← Voltar para os sinais
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6">
          <ConfidenceGauge score={signal.score} size="large" />
          <p className="text-xs uppercase tracking-wider text-muted">
            {assetClassLabels[signal.assetClass]}
          </p>
          <p className="text-xs text-muted">Atualizado em {formatDateTime(signal.updatedAt)}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl leading-snug font-semibold text-text">{signal.title}</h1>
            <p className="leading-relaxed text-muted">{signal.summary}</p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <FactorBreakdown factors={signal.factors} />
          </div>

          <SignalDisclaimer text={signal.disclaimer} />
        </div>
      </div>
    </div>
  );
}
