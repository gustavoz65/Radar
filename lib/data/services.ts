import 'server-only';
import { listAccounts } from '@/lib/repositories/accounts';
import { listPortfolioHistory, listPositions } from '@/lib/repositories/positions';
import { lastSync, lastSyncWithData } from '@/lib/repositories/sync-log';
import { news } from './fixtures/news';
import { marketRates } from './fixtures/rates';
import { signals } from './fixtures/signals';
import type {
  Account,
  AllocationSlice,
  CryptoPosition,
  EquityPosition,
  FixedIncomePosition,
  MarketRates,
  NewsItem,
  PortfolioSummary,
  Signal,
  SyncStatus,
} from '@/lib/types';

/**
 * The only module UI components read data from.
 *
 * Accounts and positions are real (sub-project 2). Signals, news and market
 * rates are still fixtures — they belong to sub-projects 3 and 4. When those
 * land, only the bodies below change; no component is touched.
 */

export async function getAccounts(): Promise<Account[]> {
  return listAccounts();
}

export async function getFixedIncomePositions(): Promise<FixedIncomePosition[]> {
  const positions = await listPositions();
  return positions.filter((p): p is FixedIncomePosition => p.assetClass === 'rendaFixa');
}

export async function getCryptoPositions(): Promise<CryptoPosition[]> {
  const positions = await listPositions();
  return positions.filter((p): p is CryptoPosition => p.assetClass === 'cripto');
}

export async function getEquityPositions(): Promise<EquityPosition[]> {
  const positions = await listPositions();
  return positions.filter((p): p is EquityPosition => p.assetClass === 'acoes');
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const [positions, history] = await Promise.all([listPositions(), listPortfolioHistory()]);

  const sumFor = (assetClass: string) =>
    Number(
      positions
        .filter((position) => position.assetClass === assetClass)
        .reduce((total, position) => total + position.currentValue, 0)
        .toFixed(2),
    );

  const fixedIncome = sumFor('rendaFixa');
  const crypto = sumFor('cripto');
  const equities = sumFor('acoes');
  const totalValue = Number((fixedIncome + crypto + equities).toFixed(2));

  // A brand-new install has no positions. Percent must be 0, never NaN.
  const percentOf = (value: number) => (totalValue === 0 ? 0 : (value / totalValue) * 100);

  const allocation: AllocationSlice[] = [
    {
      assetClass: 'rendaFixa',
      label: 'Renda fixa',
      value: fixedIncome,
      percent: percentOf(fixedIncome),
    },
    { assetClass: 'cripto', label: 'Cripto', value: crypto, percent: percentOf(crypto) },
    { assetClass: 'acoes', label: 'Ações e FIIs', value: equities, percent: percentOf(equities) },
  ];

  // Day change compares the two most recent snapshots. Fewer than two means no
  // basis for comparison, so it reports zero rather than inventing a movement.
  const previous = history.length >= 2 ? history[history.length - 2].value : null;
  const latest = history.length >= 1 ? history[history.length - 1].value : null;
  const dayChangeValue =
    previous !== null && latest !== null ? Number((latest - previous).toFixed(2)) : 0;
  const dayChangePercent =
    previous !== null && previous !== 0 ? (dayChangeValue / previous) * 100 : 0;

  const averageScore =
    signals.length === 0
      ? 0
      : Math.round(signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length);

  return {
    totalValue,
    dayChangeValue,
    dayChangePercent,
    allocation,
    history,
    averageScore,
  };
}

/** Last sync attempt plus when data last landed, so a failure warns without blanking the screen. */
export async function getSyncStatus(): Promise<SyncStatus> {
  const [last, dataAt] = await Promise.all([lastSync(), lastSyncWithData()]);

  return {
    status: (last?.status as SyncStatus['status']) ?? null,
    finishedAt: last?.finishedAt?.toISOString() ?? null,
    error: last?.error ?? null,
    lastSuccessfulAt: dataAt?.toISOString() ?? null,
  };
}

/** Still mocked — sub-project 4 replaces this body. */
export async function getSignals(): Promise<Signal[]> {
  return signals;
}

/** Still mocked — sub-project 4 replaces this body. */
export async function getSignalById(id: string): Promise<Signal | null> {
  return signals.find((signal) => signal.id === id) ?? null;
}

/** Still mocked — sub-project 3 replaces this body. */
export async function getNews(): Promise<NewsItem[]> {
  return [...news].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** Still mocked — sub-project 3 replaces this body. */
export async function getMarketRates(): Promise<MarketRates> {
  return marketRates;
}
