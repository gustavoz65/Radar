import type { TimeSeriesPoint } from '@/lib/types';
import { REFERENCE_DATE } from '@/lib/data/random';

export interface ProjectionOptions {
  initial: number;
  monthlyContribution: number;
  annualRatePercent: number;
  months: number;
}

/** Annual percentage -> monthly compounded fraction. */
export function monthlyRate(annualRatePercent: number): number {
  return (1 + annualRatePercent / 100) ** (1 / 12) - 1;
}

/** Contributions are made at the end of each month. */
export function futureValue(options: ProjectionOptions): number {
  const { initial, monthlyContribution, annualRatePercent, months } = options;
  const rate = monthlyRate(annualRatePercent);

  let balance = initial;
  for (let month = 0; month < months; month += 1) {
    balance = balance * (1 + rate) + monthlyContribution;
  }
  return balance;
}

export function projectionSeries(options: ProjectionOptions): TimeSeriesPoint[] {
  const { initial, monthlyContribution, annualRatePercent, months } = options;
  const rate = monthlyRate(annualRatePercent);
  const series: TimeSeriesPoint[] = [];

  let balance = initial;
  for (let month = 0; month <= months; month += 1) {
    if (month > 0) balance = balance * (1 + rate) + monthlyContribution;
    const date = new Date(REFERENCE_DATE);
    date.setUTCMonth(date.getUTCMonth() + month);
    series.push({ date: date.toISOString().slice(0, 10), value: Number(balance.toFixed(2)) });
  }
  return series;
}
