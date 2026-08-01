'use client';

import { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipValueType,
} from 'recharts';
import type { TimeSeriesPoint } from '@/lib/types';
import { formatBRL, formatCompactBRL } from '@/lib/format/money';
import { formatChartDate } from '@/lib/format/date';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import {
  CHART_DURATION_MS,
  CHART_EASING,
  axisTickStyle,
  gridStyle,
  tooltipContentStyle,
  tooltipCursorStyle,
} from './chart-theme';

interface AreaHistoryChartProps {
  data: TimeSeriesPoint[];
  color?: string;
  height?: number;
}

export function AreaHistoryChart({
  data,
  color = 'var(--accent)',
  height = 280,
}: AreaHistoryChartProps) {
  const gradientId = `area-fill-${useId()}`;
  const reducedMotion = useReducedMotion();

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.24} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Horizontal only: the x axis is time, and a vertical rule per month
              would fight the terrain grid already showing behind the card. */}
          <CartesianGrid {...gridStyle} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDate}
            tick={axisTickStyle}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={formatCompactBRL}
            tick={axisTickStyle}
            axisLine={false}
            tickLine={false}
            width={78}
          />
          <Tooltip
            cursor={tooltipCursorStyle}
            contentStyle={tooltipContentStyle}
            labelFormatter={(label: React.ReactNode) => formatChartDate(String(label))}
            formatter={(value: TooltipValueType | undefined) => [formatBRL(Number(value)), 'Valor']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            activeDot={{ r: 3.5, fill: color, stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={!reducedMotion}
            animationDuration={CHART_DURATION_MS}
            animationEasing={CHART_EASING}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
