'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipValueType,
} from 'recharts';
import type { TimeSeriesPoint } from '@/lib/types';
import { formatBRL, formatCompactBRL } from '@/lib/format/money';
import { formatChartDate } from '@/lib/format/date';

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
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDate}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={formatCompactBRL}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={78}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 12,
            }}
            labelFormatter={(label: React.ReactNode) => formatChartDate(String(label))}
            formatter={(value: TooltipValueType | undefined) => [formatBRL(Number(value)), 'Valor']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#areaFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
