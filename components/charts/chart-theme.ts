/**
 * Shared Recharts styling. Every chart used to declare its own tooltip box and
 * axis ticks, which is how three charts ended up with three different border
 * radii for the same popover. Colours are token references, never hex — the
 * rule holds inside a chart too.
 */

export const axisTickStyle = { fill: 'var(--text-muted)', fontSize: 11 } as const;

export const tooltipContentStyle = {
  backgroundColor: 'var(--surface-raised)',
  border: '1px solid var(--border-strong)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 12,
  boxShadow: '0 8px 24px rgb(0 0 0 / 0.45)',
} as const;

export const tooltipCursorStyle = { stroke: 'var(--border-strong)', strokeWidth: 1 } as const;

export const gridStyle = {
  stroke: 'var(--border)',
  strokeDasharray: '2 6',
} as const;

/** Matches `--dur-4` and `--ease-out`; Recharts cannot read CSS variables. */
export const CHART_DURATION_MS = 900;
export const CHART_EASING = 'ease-out' as const;
