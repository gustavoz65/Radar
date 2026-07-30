import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { formatChartDate, formatDate, formatDateTime } from '@/lib/format/date';

// Pinned so the suite does not depend on the machine's zone.
const previousZone = process.env.APP_TIME_ZONE;
beforeAll(() => {
  process.env.APP_TIME_ZONE = 'America/Cuiaba';
});
afterAll(() => {
  process.env.APP_TIME_ZONE = previousZone;
});

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
  it('shows an instant in the reader zone, not in UTC', () => {
    expect(formatDateTime('2026-07-26T09:12:00.000Z')).toBe('26/07/2026 05:12');
  });

  it('does not show tomorrow for a sync that happened tonight', () => {
    // The bug this fixes: the gauge read "30/07 00:34" on the evening of the 29th.
    expect(formatDateTime('2026-07-30T00:34:00.000Z')).toBe('29/07/2026 20:34');
  });

  it('keeps a mid-morning instant on its own day', () => {
    expect(formatDateTime('2026-07-25T14:05:00.000Z')).toBe('25/07/2026 10:05');
  });
});

describe('calendar dates versus instants', () => {
  it('never shifts a maturity date, whatever the reader zone', () => {
    // A vencimento has no time; moving it by an offset would change the day.
    expect(formatDate('2028-03-15')).toBe('15/03/2028');
    expect(formatChartDate('2026-01-01')).toBe('01/01');
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
