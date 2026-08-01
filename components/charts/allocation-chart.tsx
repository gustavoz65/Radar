'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipValueType } from 'recharts';
import type { AllocationSlice } from '@/lib/types';
import { formatBRL } from '@/lib/format/money';
import { formatPercent } from '@/lib/format/percent';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { staggerClass } from '@/components/common/motion';
import { CHART_DURATION_MS, CHART_EASING, tooltipContentStyle } from './chart-theme';
import { cn } from '@/lib/utils';

/** Asset-class tokens, declared in `app/globals.css`. No raw hex in here. */
const sliceColors: Record<AllocationSlice['assetClass'], string> = {
  rendaFixa: 'var(--asset-fixed-income)',
  cripto: 'var(--asset-crypto)',
  acoes: 'var(--asset-equity)',
};

export function AllocationChart({ slices }: { slices: AllocationSlice[] }) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={2}
              isAnimationActive={!reducedMotion}
              animationDuration={CHART_DURATION_MS}
              animationEasing={CHART_EASING}
            >
              {slices.map((slice) => (
                <Cell
                  key={slice.assetClass}
                  fill={sliceColors[slice.assetClass]}
                  stroke="var(--surface)"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipContentStyle}
              formatter={(value: TooltipValueType | undefined, _name, item) => [
                formatBRL(Number(value)),
                (item?.payload as AllocationSlice)?.label ?? '',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className={cn('w-full space-y-2.5', staggerClass)}>
        {slices.map((slice) => (
          <li key={slice.assetClass} className="flex items-center gap-3">
            {/* A bar rather than a dot: it reads as a sample of the ring's
                stroke, and gives the class colour enough area to be told apart
                from its neighbour at a glance. */}
            <span
              aria-hidden
              className="h-3.5 w-0.5 shrink-0 rounded-full"
              style={{ backgroundColor: sliceColors[slice.assetClass] }}
            />
            <span className="flex-1 text-sm text-text">{slice.label}</span>
            <span className="tabular font-mono text-sm text-muted">
              {formatPercent(slice.percent, 1)}
            </span>
            <span className="tabular hidden font-mono text-sm text-text sm:inline">
              {formatBRL(slice.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
