import { describe, expect, it } from 'vitest';
import { BrapiError, parseEquityQuotes } from '@/lib/market/equities';

/** Field names captured from a live brapi response. */
const payload = {
  results: [
    { symbol: 'PETR4', regularMarketPrice: 38.42, regularMarketChangePercent: 1.27 },
    { symbol: 'mglu3', regularMarketPrice: 7.1, regularMarketChangePercent: null },
  ],
};

describe('parseEquityQuotes', () => {
  it('reads price and day change, upper-casing the ticker', () => {
    const [petr, mglu] = parseEquityQuotes(payload);

    expect(petr).toEqual({ ticker: 'PETR4', priceBrl: 38.42, changePercent: 1.27 });
    expect(mglu.ticker).toBe('MGLU3');
    expect(mglu.changePercent).toBeNull();
  });

  it('skips a result with no price rather than storing a zero', () => {
    expect(parseEquityQuotes({ results: [{ symbol: 'XPTO3' }] })).toEqual([]);
  });

  it('returns nothing when brapi answers with an empty result set', () => {
    expect(parseEquityQuotes({ results: [] })).toEqual([]);
    expect(parseEquityQuotes({})).toEqual([]);
  });

  it('throws when the payload is not the documented shape', () => {
    expect(() => parseEquityQuotes({ results: 'nope' })).toThrow(BrapiError);
  });
});
