import { DataLabel } from '@/components/common/typography';
import { interactiveSurfaceClass, surfaceCardClass } from '@/components/common/surface';
import { cn } from '@/lib/utils';

/**
 * `tone` paints the card's top edge with the asset class the figure belongs to,
 * so a tab's stat row carries the same colour as its slice in the allocation
 * chart. `score` is the one place outside the gauge that may use the signature
 * gold, because the figure it marks *is* a confidence score.
 */
export type StatTone = 'neutral' | 'fixed-income' | 'crypto' | 'equity' | 'score';

const toneEdge: Record<StatTone, string> = {
  neutral: 'bg-border-strong',
  'fixed-income': 'bg-asset-fixed-income',
  crypto: 'bg-asset-crypto',
  equity: 'bg-asset-equity',
  score: 'bg-gold',
};

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string;
  /** A node, not a string, so a call site can pass an animated `<Readout>`. */
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className={cn(surfaceCardClass, interactiveSurfaceClass, 'relative overflow-hidden')}>
      {/* Short and inset past the corner radius: a full-width bar would read as
          a progress meter on a card whose number is not a proportion, and a
          corner-anchored one detaches visually where the border curves away. */}
      <span
        aria-hidden
        className={cn('absolute top-0 left-4 h-px w-8 sm:left-5', toneEdge[tone])}
      />
      <DataLabel>{label}</DataLabel>
      <p className="tabular mt-3 font-mono text-[1.375rem] leading-none tracking-[-0.02em] text-text sm:text-[1.625rem]">
        {value}
      </p>
      {hint ? <div className="mt-2.5 text-sm">{hint}</div> : null}
    </div>
  );
}
