import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { economicIndicators, marketPrices, newsItems } from '@/lib/db/schema';
import type { IndicatorReading, IndicatorSeries } from '@/lib/market/bcb';
import type { RawNews } from '@/lib/market/news';
import type { MarketQuote, MarketRates, NewsItem, TimeSeriesPoint } from '@/lib/types';

export interface Quote {
  ticker: string;
  priceBrl: number;
  changePercent: number | null;
}

function toNumber(value: string): number {
  return Number(value);
}

export async function saveIndicators(
  readings: IndicatorReading[],
  collectedAt: Date,
): Promise<number> {
  for (const reading of readings) {
    await db
      .insert(economicIndicators)
      .values({
        series: reading.series,
        value: reading.value.toFixed(4),
        referenceDate: reading.referenceDate,
        collectedAt,
      })
      .onDuplicateKeyUpdate({ set: { value: reading.value.toFixed(4), collectedAt } });
  }
  return readings.length;
}

async function latestIndicator(
  series: IndicatorSeries,
): Promise<{ value: number; at: Date } | null> {
  const [row] = await db
    .select({
      value: economicIndicators.value,
      referenceDate: economicIndicators.referenceDate,
      collectedAt: economicIndicators.collectedAt,
    })
    .from(economicIndicators)
    .where(eq(economicIndicators.series, series))
    .orderBy(desc(economicIndicators.referenceDate))
    .limit(1);

  return row ? { value: toNumber(row.value), at: row.collectedAt } : null;
}

/** Null when no indicator has ever been collected, so the UI can say so instead of showing zeros. */
export async function latestRates(): Promise<MarketRates | null> {
  const [selic, cdi, ipca, poupanca] = await Promise.all([
    latestIndicator('selic'),
    latestIndicator('cdi'),
    latestIndicator('ipca12m'),
    latestIndicator('poupanca'),
  ]);

  if (!selic && !cdi && !ipca && !poupanca) return null;

  const collected = [selic, cdi, ipca, poupanca]
    .filter((entry) => entry !== null)
    .map((entry) => entry.at.getTime());

  return {
    selic: selic?.value ?? 0,
    cdi: cdi?.value ?? 0,
    ipca12m: ipca?.value ?? 0,
    poupanca: poupanca?.value ?? 0,
    updatedAt: new Date(Math.max(...collected)).toISOString(),
  };
}

export async function saveQuotes(
  assetClass: 'cripto' | 'acoes',
  quotes: Quote[],
  collectedAt: Date,
): Promise<number> {
  if (quotes.length === 0) return 0;

  const [result] = await db
    .insert(marketPrices)
    .ignore()
    .values(
      quotes.map((quote) => ({
        assetClass,
        ticker: quote.ticker.toUpperCase(),
        priceBrl: quote.priceBrl.toFixed(8),
        changePercent: quote.changePercent === null ? null : quote.changePercent.toFixed(4),
        collectedAt,
      })),
    );

  return result.affectedRows;
}

/** Most recent quote per ticker, keyed by ticker. */
export async function latestQuotes(
  assetClass: 'cripto' | 'acoes',
): Promise<Map<string, { priceBrl: number; changePercent: number | null }>> {
  const rows = await db
    .select({
      ticker: marketPrices.ticker,
      priceBrl: marketPrices.priceBrl,
      changePercent: marketPrices.changePercent,
      collectedAt: marketPrices.collectedAt,
    })
    .from(marketPrices)
    .where(eq(marketPrices.assetClass, assetClass))
    .orderBy(desc(marketPrices.collectedAt));

  const latest = new Map<string, { priceBrl: number; changePercent: number | null }>();
  for (const row of rows) {
    if (latest.has(row.ticker)) continue;
    latest.set(row.ticker, {
      priceBrl: toNumber(row.priceBrl),
      changePercent: row.changePercent === null ? null : toNumber(row.changePercent),
    });
  }
  return latest;
}

/** Latest quote per ticker as a list, for the market tables. */
export async function listQuotes(assetClass: 'cripto' | 'acoes'): Promise<MarketQuote[]> {
  const rows = await db
    .select()
    .from(marketPrices)
    .where(eq(marketPrices.assetClass, assetClass))
    .orderBy(desc(marketPrices.collectedAt));

  const seen = new Set<string>();
  const quotes: MarketQuote[] = [];

  for (const row of rows) {
    if (seen.has(row.ticker)) continue;
    seen.add(row.ticker);
    quotes.push({
      ticker: row.ticker,
      priceBrl: toNumber(row.priceBrl),
      changePercent: row.changePercent === null ? null : toNumber(row.changePercent),
      collectedAt: row.collectedAt.toISOString(),
    });
  }

  return quotes.sort((a, b) => a.ticker.localeCompare(b.ticker));
}

/** One point per day per ticker, for the position history charts. */
export async function priceHistory(ticker: string): Promise<TimeSeriesPoint[]> {
  const rows = await db
    .select({
      day: sql<string>`date(${marketPrices.collectedAt})`,
      price: sql<string>`max(${marketPrices.priceBrl})`,
    })
    .from(marketPrices)
    .where(eq(marketPrices.ticker, ticker.toUpperCase()))
    .groupBy(sql`date(${marketPrices.collectedAt})`)
    .orderBy(sql`date(${marketPrices.collectedAt})`);

  return rows.map((row) => ({ date: String(row.day).slice(0, 10), value: Number(row.price) }));
}

export async function saveNews(items: RawNews[]): Promise<number> {
  if (items.length === 0) return 0;

  const [result] = await db
    .insert(newsItems)
    .ignore()
    .values(
      items.map((item) => ({
        externalId: item.externalId,
        title: item.title,
        source: item.source,
        url: item.url,
        publishedAt: item.publishedAt,
        category: item.category,
        summary: item.summary,
      })),
    );

  return result.affectedRows;
}

export async function listNews(limit = 30): Promise<NewsItem[]> {
  const rows = await db.select().from(newsItems).orderBy(desc(newsItems.publishedAt)).limit(limit);

  return rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    source: row.source,
    publishedAt: row.publishedAt.toISOString(),
    category: row.category,
    summary: row.summary ?? '',
  }));
}
