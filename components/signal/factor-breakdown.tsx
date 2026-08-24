import type { SignalFactor } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SubsectionTitle } from '@/components/common/typography';

const directionStyles: Record<
  SignalFactor['direction'],
  { bar: string; sign: string; label: string }
> = {
  positive: { bar: 'bg-positive', sign: '+', label: 'fator favorável' },
  negative: { bar: 'bg-negative', sign: '−', label: 'fator desfavorável' },
  neutral: { bar: 'bg-muted', sign: '=', label: 'fator neutro' },
};

/**
 * `headingLevel` exists so the breakdown never skips a heading level: inside
 * SignalCard it sits under the signal title (h2), while on the detail screen the
 * signal title is the page's h1 and the breakdown is its first subsection.
 */
export function FactorBreakdown({
  factors,
  headingLevel = 'h3',
}: {
  factors: SignalFactor[];
  headingLevel?: 'h2' | 'h3';
}) {
  return (
    <div>
      <SubsectionTitle as={headingLevel} className="mb-3 block">
        Fatores do score
      </SubsectionTitle>
      {/* The meter is a fixed width beside the label rather than a rule under
          it: stretched to the card's full width, a 4-row breakdown reads as
          coloured dividers and the weights stop being comparable at a glance. */}
      <ul className="space-y-2.5">
        {factors.map((factor, index) => {
          const style = directionStyles[factor.direction];
          return (
            <li key={factor.label} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 text-sm text-text">
                <span aria-label={style.label} className="mr-1.5 font-mono text-muted">
                  {style.sign}
                </span>
                {factor.label}
              </span>
              <div className="h-1 w-20 shrink-0 overflow-hidden rounded-full bg-border sm:w-40">
                {/* Each bar grows in turn, so the breakdown is read top-down as
                    a sequence of contributions rather than as a finished block. */}
                <div
                  className={cn('motion-grow-x h-full rounded-full', style.bar)}
                  style={
                    { width: `${factor.weight}%`, '--stagger-index': index } as React.CSSProperties
                  }
                />
              </div>
              <span className="tabular w-9 shrink-0 text-right font-mono text-xs text-muted">
                {factor.weight}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
