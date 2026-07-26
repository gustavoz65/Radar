import { describe, expect, it } from 'vitest';
import { formatPercent, formatSignedPercent, percentChange } from '@/lib/format/percent';

describe('percentChange', () => {
  it('computes a positive change', () => {
    expect(percentChange(100, 105.32)).toBeCloseTo(5.32, 10);
  });

  it('computes a negative change', () => {
    expect(percentChange(200, 180)).toBeCloseTo(-10, 10);
  });

  it('returns zero when the base is zero', () => {
    expect(percentChange(0, 500)).toBe(0);
  });
});

describe('formatPercent', () => {
  it('formats with a comma decimal separator', () => {
    expect(formatPercent(14.25)).toBe('14,25%');
  });

  it('honours the fraction digits argument', () => {
    expect(formatPercent(14.25, 1)).toBe('14,3%');
  });
});

describe('formatSignedPercent', () => {
  it('prefixes a plus sign for gains', () => {
    expect(formatSignedPercent(5.32)).toBe('+5,32%');
  });

  it('keeps the minus sign for losses', () => {
    expect(formatSignedPercent(-1.4)).toBe('-1,40%');
  });

  it('does not sign zero', () => {
    expect(formatSignedPercent(0)).toBe('0,00%');
  });
});
