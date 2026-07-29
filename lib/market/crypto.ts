import 'server-only';
import ccxt, { type Exchange } from 'ccxt';

export interface CryptoQuote {
  symbol: string;
  priceBrl: number;
  changePercent: number | null;
}

/**
 * Binance quotes 60 BRL pairs and returns a 24h percentage; Mercado Bitcoin
 * lists more pairs but leaves `percentage` undefined, so it is the fallback.
 */
const EXCHANGE_ID = 'binance';

/**
 * The rate limiter lives on the instance, so recreating it per request resets
 * the throttle and eventually gets the IP banned. Reused across hot reloads for
 * the same reason the MySQL pool is.
 */
const globalForCcxt = globalThis as unknown as { exchange?: Exchange };

function exchange(): Exchange {
  // Never constructed with apiKey/secret: Radar is read-only over financial
  // data, and without credentials CCXT's trading methods cannot be called.
  globalForCcxt.exchange ??= new ccxt[EXCHANGE_ID]({ enableRateLimit: true });
  return globalForCcxt.exchange;
}

export function toPair(symbol: string): string {
  return `${symbol.trim().toUpperCase()}/BRL`;
}

/**
 * Quotes each symbol in BRL. Symbols the exchange does not list are skipped
 * rather than failing the batch — one delisted coin should not cost the rest.
 */
export async function fetchCryptoQuotes(symbols: string[]): Promise<CryptoQuote[]> {
  if (symbols.length === 0) return [];

  const ex = exchange();
  await ex.loadMarkets();

  const wanted = new Map(symbols.map((symbol) => [toPair(symbol), symbol]));
  const listed = [...wanted.keys()].filter((pair) => pair in ex.markets);
  if (listed.length === 0) return [];

  const tickers = await ex.fetchTickers(listed);

  return Object.entries(tickers).flatMap(([pair, ticker]) => {
    const symbol = wanted.get(pair);
    const price = ticker.last ?? ticker.close;
    if (!symbol || typeof price !== 'number' || !Number.isFinite(price)) return [];

    return [
      {
        symbol,
        priceBrl: price,
        changePercent: typeof ticker.percentage === 'number' ? ticker.percentage : null,
      },
    ];
  });
}
