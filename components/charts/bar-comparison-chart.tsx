'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipValueType,
} from 'recharts';
import { formatPercent } from '@/lib/format/percent';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import {
  CHART_DURATION_MS,
  CHART_EASING,
  axisTickStyle,
  gridStyle,
  tooltipContentStyle,
} from './chart-theme';

export interface ComparisonBar {
  label: string;
  value: number;
  highlight?: boolean;
}

export function BarComparisonChart({
  data,
  height = 300,
}: {
  data: ComparisonBar[];
  height?: number;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          {/* Vertical only: the measured axis is the rate, so the rules run
              along it and the category rows stay clean. */}
          <CartesianGrid {...gridStyle} horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatPercent(value, 0)}
            tick={axisTickStyle}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            width={150}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-raised)', opacity: 0.6 }}
            contentStyle={tooltipContentStyle}
            formatter={(value: TooltipValueType | undefined) => [
              formatPercent(Number(value)),
              'Taxa a.a.',
            ]}
          />
          <Bar
            dataKey="value"
            radius={[0, 3, 3, 0]}
            barSize={18}
            isAnimationActive={!reducedMotion}
            animationDuration={CHART_DURATION_MS}
            animationEasing={CHART_EASING}
          >
            {data.map((bar) => (
              <Cell
                key={bar.label}
                fill={bar.highlight ? 'var(--asset-fixed-income)' : 'var(--border-strong)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
