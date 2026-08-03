import {
  GAUGE_ARC_LENGTH,
  GAUGE_PATH,
  GAUGE_TICKS,
  gaugeDashOffset,
  scoreLabel,
} from '@/lib/charts/gauge';
import { cn } from '@/lib/utils';

interface ConfidenceGaugeProps {
  score: number;
  size?: 'mini' | 'large';
  className?: string;
}

/**
 * The signature arc gauge. `--signature-gold` is reserved for this component:
 * confidence is never expressed with the positive/negative price colors.
 *
 * The arc draws itself in on mount — the one chart animation that earns its
 * keep, because watching the arc travel is what makes the number read as a
 * measurement rather than a badge. `strokeDashoffset` is also set as an
 * attribute so the final state is correct before any CSS runs.
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
        {GAUGE_TICKS.map((tick, index) => (
          <line
            key={index}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />
        ))}
        <path
          d={GAUGE_PATH}
          fill="none"
          stroke="var(--border)"
          strokeWidth={large ? 9 : 8}
          strokeLinecap="round"
        />
        <path
          className="motion-draw"
          style={
            {
              '--draw-from': GAUGE_ARC_LENGTH,
              '--draw-to': gaugeDashOffset(score),
            } as React.CSSProperties
          }
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
          className="motion-fade fill-[var(--text)] font-mono"
          fontSize={large ? 26 : 22}
        >
          {rounded}
        </text>
      </svg>
      <figcaption
        className={cn(
          'font-mono uppercase tracking-[0.14em] text-faint',
          large ? '-mt-1 text-xs' : '-mt-2 text-[0.625rem]',
        )}
      >
        Confiança {scoreLabel(score).toLowerCase()}
      </figcaption>
    </figure>
  );
}
