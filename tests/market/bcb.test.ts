import { describe, expect, it } from 'vitest';
import { BcbError, parseIndicator } from '@/lib/market/bcb';

/** Shape captured from a live SGS call: value is a string, date is DD/MM/YYYY. */
const selic = [{ data: '05/08/2026', valor: '14.25' }];

describe('parseIndicator', () => {
  it('reads the annual rate and its reference date', () => {
    const reading = parseIndicator('selic', selic);
    expect(reading.value).toBe(14.25);
    expect(reading.referenceDate.toISOString()).toBe('2026-08-05T00:00:00.000Z');
  });

  it('parses DD/MM/YYYY without swapping day and month', () => {
    const reading = parseIndicator('cdi', [{ data: '01/07/2026', valor: '14.15' }]);
    expect(reading.referenceDate.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('annualises poupança, which the BCB publishes monthly', () => {
    // 0.6741% a month compounds to about 8.4% a year.
    const reading = parseIndicator('poupanca', [{ data: '27/07/2026', valor: '0.6741' }]);
    expect(reading.value).toBeCloseTo(8.396, 2);
  });

  it('leaves the already-annual series untouched', () => {
    expect(parseIndicator('ipca12m', [{ data: '01/06/2026', valor: '4.64' }]).value).toBe(4.64);
  });

  it('takes the last entry when several are returned', () => {
    const reading = parseIndicator('cdi', [
      { data: '01/06/2026', valor: '13.90' },
      { data: '01/07/2026', valor: '14.15' },
    ]);
    expect(reading.value).toBe(14.15);
  });

  it('throws on an empty series rather than inventing a zero', () => {
    expect(() => parseIndicator('selic', [])).toThrow(BcbError);
  });

  it('throws when the payload is the BCB HTML error page', () => {
    expect(() => parseIndicator('ipca12m', '<!doctype html>')).toThrow(BcbError);
  });

  it('throws on an unparseable value', () => {
    expect(() => parseIndicator('selic', [{ data: '05/08/2026', valor: 'n/d' }])).toThrow(BcbError);
  });

  it('throws on a malformed date', () => {
    expect(() => parseIndicator('selic', [{ data: '2026-08-05', valor: '14.25' }])).toThrow(
      BcbError,
    );
  });
});
