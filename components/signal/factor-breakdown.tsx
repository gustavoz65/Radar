import type { SignalFactor } from '@/lib/types';
import { cn } from '@/lib/utils';

const directionStyles: Record<
  SignalFactor['direction'],
  { bar: string; sign: string; label: string }
> = {
  positive: { bar: 'bg-positive', sign: '+', label: 'fator favorável' },
  negative: { bar: 'bg-negative', sign: '−', label: 'fator desfavorável' },
  neutral: { bar: 'bg-muted', sign: '=', label: 'fator neutro' },
};

export function FactorBreakdown({ factors }: { factors: SignalFactor[] }) {
  return (
    <div>
      <h3 className="mb-3 text-xs uppercase tracking-wider text-muted">Fatores do score</h3>
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
