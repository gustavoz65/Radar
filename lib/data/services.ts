import type {
  Account,
  CryptoPosition,
  EquityPosition,
  FixedIncomePosition,
  MarketRates,
  NewsItem,
  PortfolioSummary,
  Signal,
} from '@/lib/types';
import { accounts } from './fixtures/accounts';
import { cryptoPositions } from './fixtures/crypto';
import { equityPositions } from './fixtures/equities';
import { fixedIncomePositions } from './fixtures/fixed-income';
import { news } from './fixtures/news';
import { portfolioSummary } from './fixtures/portfolio';
import { marketRates } from './fixtures/rates';
import { signals } from './fixtures/signals';

/**
 * Mocked backend. Every function has the signature the real API will have, so
 * when specs 2-4 land only the bodies below change — no UI component is touched.
 *
 * Latency is skipped under test so the suite stays fast.
 */
const MIN_LATENCY_MS = 300;
const MAX_LATENCY_MS = 800;

async function respond<T>(payload: T): Promise<T> {
  if (process.env.NODE_ENV !== 'test') {
    const delay = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return payload;
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  return respond(portfolioSummary);
}

export async function getAccounts(): Promise<Account[]> {
  return respond(accounts);
}

export async function getFixedIncomePositions(): Promise<FixedIncomePosition[]> {
  return respond(fixedIncomePositions);
}

export async function getCryptoPositions(): Promise<CryptoPosition[]> {
  return respond(cryptoPositions);
}

export async function getEquityPositions(): Promise<EquityPosition[]> {
  return respond(equityPositions);
}

export async function getSignals(): Promise<Signal[]> {
  return respond(signals);
}

export async function getSignalById(id: string): Promise<Signal | null> {
  return respond(signals.find((signal) => signal.id === id) ?? null);
}

export async function getNews(): Promise<NewsItem[]> {
  const sorted = [...news].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  return respond(sorted);
}

export async function getMarketRates(): Promise<MarketRates> {
  return respond(marketRates);
}
