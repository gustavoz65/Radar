import type { IndicatorReading } from '@/lib/market/bcb';
import type { CryptoQuote } from '@/lib/market/crypto';
import type { EquityQuote } from '@/lib/market/equities';
import type { RawNews } from '@/lib/market/news';
import type { Quote } from '@/lib/repositories/market';

export interface HeldAssets {
  crypto: string[];
  equities: string[];
}

export interface MarketSyncDeps {
  heldAssets: () => Promise<HeldAssets>;
  fetchIndicators: () => Promise<{ readings: IndicatorReading[]; failures: string[] }>;
  fetchCryptoQuotes: (symbols: string[]) => Promise<CryptoQuote[]>;
  fetchEquityQuotes: (tickers: string[]) => Promise<EquityQuote[]>;
  fetchNews: () => Promise<{ items: RawNews[]; failures: string[] }>;
  saveIndicators: (readings: IndicatorReading[], collectedAt: Date) => Promise<number>;
  saveQuotes: (
    assetClass: 'cripto' | 'acoes',
    quotes: Quote[],
    collectedAt: Date,
  ) => Promise<number>;
  saveNews: (items: RawNews[]) => Promise<number>;
  now: () => Date;
}

export interface MarketSyncResult {
  indicators: number;
  cryptoQuotes: number;
  equityQuotes: number;
  news: number;
  failures: string[];
}

/**
 * Collects the four market sources independently: a dead feed or a flaky BCB
 * series costs only its own data, never the whole refresh.
 */
export async function runMarketSync(deps: MarketSyncDeps): Promise<MarketSyncResult> {
  const collectedAt = deps.now();
  const failures: string[] = [];

  const record = async <T>(label: string, task: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await task();
    } catch (error) {
      failures.push(`${label}: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
      return fallback;
    }
  };

  const held = await record('carteira', deps.heldAssets, { crypto: [], equities: [] });

  const [indicators, cryptoQuotes, equityQuotes, news] = await Promise.all([
    record(
      'indicadores',
      async () => {
        const { readings, failures: partial } = await deps.fetchIndicators();
        failures.push(...partial);
        return deps.saveIndicators(readings, collectedAt);
      },
      0,
    ),
    record(
      'cripto',
      async () => {
        const quotes = await deps.fetchCryptoQuotes(held.crypto);
        return deps.saveQuotes(
          'cripto',
          quotes.map((quote) => ({ ticker: quote.symbol, ...quote })),
          collectedAt,
        );
      },
      0,
    ),
    record(
      'ações',
      async () => {
        const quotes = await deps.fetchEquityQuotes(held.equities);
        return deps.saveQuotes('acoes', quotes, collectedAt);
      },
      0,
    ),
    record(
      'notícias',
      async () => {
        const { items, failures: partial } = await deps.fetchNews();
        failures.push(...partial);
        return deps.saveNews(items);
      },
      0,
    ),
  ]);

  return { indicators, cryptoQuotes, equityQuotes, news, failures };
}
