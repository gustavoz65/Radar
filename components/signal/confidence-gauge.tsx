import { GAUGE_ARC_LENGTH, GAUGE_PATH, gaugeDashOffset, scoreLabel } from '@/lib/charts/gauge';
import { cn } from '@/lib/utils';

interface ConfidenceGaugeProps {
  score: number;
  size?: 'mini' | 'large';
  className?: string;
}

/**
 * The signature arc gauge. `--signature-gold` is reserved for this component:
 * confidence is never expressed with the positive/negative price colors.
 */
export function ConfidenceGauge({ score, size = 'mini', className }: ConfidenceGaugeProps) {
  const rounded = Math.round(score);
  const large = size === 'large';

  return (
    <figure
      className={cn('flex flex-col items-center', className)}
      role="img"
      aria-label={`Score de confiança ${rounded} de 100 — confiança ${scoreLabel(score).toLowerCase()}`}
    >
      <svg
        viewBox="0 0 120 70"
        className={cn(large ? 'w-52' : 'w-28')}
        aria-hidden
        focusable="false"
      >
        <path
          d={GAUGE_PATH}
          fill="none"
          stroke="var(--border)"
          strokeWidth={large ? 9 : 8}
          strokeLinecap="round"
        />
        <path
          d={GAUGE_PATH}
          fill="none"
          stroke="var(--signature-gold)"
          strokeWidth={large ? 9 : 8}
          strokeLinecap="round"
          strokeDasharray={GAUGE_ARC_LENGTH}
          strokeDashoffset={gaugeDashOffset(score)}
        />
        <text
          x="60"
          y="54"
          textAnchor="middle"
          className="fill-[var(--text)] font-mono"
          fontSize={large ? 26 : 22}
        >
          {rounded}
        </text>
      </svg>
      <figcaption className={cn('text-muted', large ? '-mt-1 text-sm' : '-mt-2 text-xs')}>
        Confiança {scoreLabel(score).toLowerCase()}
      </figcaption>
    </figure>
  );
}
