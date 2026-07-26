import { describe, expect, it } from 'vitest';
import { futureValue, monthlyRate, projectionSeries } from '@/lib/tools/projection';

describe('monthlyRate', () => {
  it('compounds an annual rate down to a monthly rate', () => {
    expect(monthlyRate(12.6825)).toBeCloseTo(0.01, 6); // (1.01)^12 - 1
  });

  it('returns zero for a zero annual rate', () => {
    expect(monthlyRate(0)).toBe(0);
  });
});

describe('futureValue', () => {
  it('keeps the initial amount when the rate is zero and there are no contributions', () => {
    expect(
      futureValue({ initial: 1000, monthlyContribution: 0, annualRatePercent: 0, months: 24 }),
    ).toBeCloseTo(1000, 2);
  });

  it('sums plain contributions when the rate is zero', () => {
    expect(
      futureValue({ initial: 1000, monthlyContribution: 100, annualRatePercent: 0, months: 12 }),
    ).toBeCloseTo(2200, 2);
  });

  it('compounds the initial amount over one year', () => {
    expect(
      futureValue({
        initial: 1000,
        monthlyContribution: 0,
        annualRatePercent: 12.6825,
        months: 12,
      }),
    ).toBeCloseTo(1126.83, 1);
  });

  it('compounds contributions made at the end of each month', () => {
    // 100 per month at 1% a.m. for 3 months: 100*1.01^2 + 100*1.01 + 100
    expect(
      futureValue({ initial: 0, monthlyContribution: 100, annualRatePercent: 12.6825, months: 3 }),
    ).toBeCloseTo(303.01, 1);
  });
});

describe('projectionSeries', () => {
  it('returns one point per month plus the starting point', () => {
    const series = projectionSeries({
      initial: 1000,
      monthlyContribution: 100,
      annualRatePercent: 10,
      months: 12,
    });
    expect(series).toHaveLength(13);
  });

  it('starts at the initial amount', () => {
    const series = projectionSeries({
      initial: 1000,
      monthlyContribution: 100,
      annualRatePercent: 10,
      months: 6,
    });
    expect(series[0].value).toBeCloseTo(1000, 2);
  });

  it('ends at the future value', () => {
    const options = {
      initial: 1000,
      monthlyContribution: 100,
      annualRatePercent: 10,
      months: 6,
    };
    const series = projectionSeries(options);
    expect(series[series.length - 1].value).toBeCloseTo(futureValue(options), 1);
  });

  it('increases monotonically with positive contributions', () => {
    const series = projectionSeries({
      initial: 500,
      monthlyContribution: 250,
      annualRatePercent: 14.15,
      months: 24,
    });
    for (let i = 1; i < series.length; i += 1) {
      expect(series[i].value).toBeGreaterThan(series[i - 1].value);
    }
  });
});
