'use client';

import { useEffect, useRef, useState } from 'react';
import { formatBRL } from '@/lib/format/money';
import { formatPercent } from '@/lib/format/percent';
import { cn } from '@/lib/utils';

type ReadoutFormat = 'brl' | 'percent' | 'integer';

function render(value: number, format: ReadoutFormat): string {
  if (format === 'brl') return formatBRL(value);
  if (format === 'percent') return formatPercent(value);
  return String(Math.round(value));
}

const DURATION_MS = 700;

/** Matches `--ease-out` in globals so a counting number and a rising card agree. */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * A number that settles into place instead of appearing. The instrument
 * metaphor earns it: after a sync, every readout visibly re-reads from its
 * previous value to the new one, so a changed figure is impossible to miss.
 *
 * The server renders the final value, so the number is correct with JavaScript
 * disabled and never flashes a zero before hydration.
 */
export function Readout({
  value,
  format = 'brl',
  className,
}: {
  value: number;
  format?: ReadoutFormat;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const frame = useRef(0);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;

    if (from === value || prefersReducedMotion()) {
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION_MS);
      setDisplay(from + (value - from) * easeOut(progress));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [value]);

  return (
    <span className={cn('tabular', className)} suppressHydrationWarning>
      {render(display, format)}
    </span>
  );
}
