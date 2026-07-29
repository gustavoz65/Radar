import { describe, expect, it } from 'vitest';
import { CRYPTO_WATCHLIST, EQUITY_WATCHLIST, withWatchlist } from '@/lib/market/watchlist';

describe('withWatchlist', () => {
  it('quotes the watchlist even when the user holds nothing', () => {
    // The whole point: someone deciding whether to buy owns nothing yet.
    expect(withWatchlist(['BTC', 'ETH'], [])).toEqual(['BTC', 'ETH']);
  });

  it('adds held assets that are not on the list', () => {
    expect(withWatchlist(['BTC'], ['PEPE'])).toEqual(['BTC', 'PEPE']);
  });

  it('does not quote the same asset twice', () => {
    expect(withWatchlist(['BTC', 'ETH'], ['btc'])).toEqual(['BTC', 'ETH']);
  });
});

describe('watchlists', () => {
  it('carry no duplicates', () => {
    expect(new Set(CRYPTO_WATCHLIST).size).toBe(CRYPTO_WATCHLIST.length);
    expect(new Set(EQUITY_WATCHLIST).size).toBe(EQUITY_WATCHLIST.length);
  });

  it('are upper case, which is how quotes are keyed', () => {
    for (const symbol of [...CRYPTO_WATCHLIST, ...EQUITY_WATCHLIST]) {
      expect(symbol).toBe(symbol.toUpperCase());
    }
  });
});
