import { describe, expect, it } from 'vitest';
import { formatChartDate, formatDate, formatDateTime } from '@/lib/format/date';

describe('formatDate', () => {
  it('formats a date-only string as dd/MM/yyyy', () => {
    expect(formatDate('2028-03-15')).toBe('15/03/2028');
  });

  it('accepts a full ISO datetime', () => {
    expect(formatDate('2026-07-26T09:12:00.000Z')).toBe('26/07/2026');
  });

  it('does not shift the day for a late-evening UTC timestamp', () => {
    expect(formatDate('2026-07-25T22:05:00.000Z')).toBe('25/07/2026');
  });
});

describe('formatDateTime', () => {
  it('formats date and time in UTC', () => {
    expect(formatDateTime('2026-07-26T09:12:00.000Z')).toBe('26/07/2026 09:12');
  });

  it('keeps a late-evening UTC time on its own day', () => {
    expect(formatDateTime('2026-07-25T22:05:00.000Z')).toBe('25/07/2026 22:05');
  });
});

describe('formatChartDate', () => {
  it('formats a compact dd/MM axis label', () => {
    expect(formatChartDate('2026-07-26')).toBe('26/07');
  });

  it('accepts a full ISO datetime', () => {
    expect(formatChartDate('2026-01-05T00:00:00.000Z')).toBe('05/01');
  });
});
