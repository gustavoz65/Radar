import type { TimeSeriesPoint } from '@/lib/types';

/** Deterministic PRNG so fixtures never change between renders. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A random walk ending exactly at `endValue`, so the last point always matches
 * the position's current value shown elsewhere in the UI.
 */
export function generateSeries(options: {
  seed: number;
  points: number;
  endValue: number;
  /** Daily/monthly volatility as a fraction, e.g. 0.02 = 2%. */
  volatility: number;
  /** Total drift across the whole series, e.g. 0.18 = +18% from start to end. */
  drift: number;
  step: 'day' | 'month';
  endDate: Date;
}): TimeSeriesPoint[] {
  const { seed, points, endValue, volatility, drift, step, endDate } = options;
  const random = mulberry32(seed);
  const startValue = endValue / (1 + drift);

  const raw: number[] = [];
  let value = startValue;
  for (let i = 0; i < points; i += 1) {
    const growth = drift / Math.max(points - 1, 1);
    const noise = (random() - 0.5) * 2 * volatility;
    value = value * (1 + growth + noise);
    raw.push(value);
  }

  // Rescale so the final point lands exactly on endValue.
  const correction = endValue / raw[raw.length - 1];

  return raw.map((point, index) => {
    const date = new Date(endDate);
    const stepsBack = points - 1 - index;
    if (step === 'day') {
      date.setUTCDate(date.getUTCDate() - stepsBack);
    } else {
      date.setUTCMonth(date.getUTCMonth() - stepsBack);
    }
    return {
      date: isoDate(date),
      value: Number((point * correction).toFixed(2)),
    };
  });
}

/** The "today" every fixture is anchored to, so the app is reproducible. */
export const REFERENCE_DATE = new Date('2026-07-26T12:00:00.000Z');
