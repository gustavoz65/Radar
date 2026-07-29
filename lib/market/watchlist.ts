/**
 * What the Cripto and Ações tabs quote regardless of what the user owns.
 *
 * Pierre covers banks; crypto and equities are a separate market the app exists
 * to help decide about. Quoting only held assets would leave both tabs empty
 * for anyone who has not bought yet — exactly the person who needs the prices.
 *
 * Crypto symbols are Binance BRL pairs; equity tickers are B3.
 */
export const CRYPTO_WATCHLIST = [
  'BTC',
  'ETH',
  'SOL',
  'XRP',
  'BNB',
  'ADA',
  'DOGE',
  'LINK',
  'LTC',
  'USDT',
];

export const EQUITY_WATCHLIST = [
  'PETR4',
  'VALE3',
  'ITUB4',
  'BBAS3',
  'BBDC4',
  'ABEV3',
  'WEGE3',
  'B3SA3',
  'MGLU3',
  'ITSA4',
];

/** Watchlist first, then anything held that is not already on it. */
export function withWatchlist(watchlist: string[], held: string[]): string[] {
  const all = new Set(watchlist.map((item) => item.toUpperCase()));
  for (const item of held) all.add(item.toUpperCase());
  return [...all];
}
