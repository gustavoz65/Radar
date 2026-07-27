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
      <ul className="space-y-2.5">
        {factors.map((factor) => {
          const style = directionStyles[factor.direction];
          return (
            <li key={factor.label} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-text">
                  <span aria-label={style.label} className="mr-1.5 font-mono text-muted">
                    {style.sign}
                  </span>
                  {factor.label}
                </span>
                <span className="tabular shrink-0 font-mono text-xs text-muted">
                  {factor.weight}%
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={cn('h-full rounded-full', style.bar)}
                  style={{ width: `${factor.weight}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
