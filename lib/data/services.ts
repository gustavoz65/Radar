import 'server-only';
import { listAccounts } from '@/lib/repositories/accounts';
import { latestQuotes, latestRates, listNews, listQuotes } from '@/lib/repositories/market';
import { listPortfolioHistory, listPositions } from '@/lib/repositories/positions';
import { findSignal, listSignals } from '@/lib/repositories/signals';
import { lastSync, lastSyncWithData } from '@/lib/repositories/sync-log';
import { effectiveAnnualRate } from '@/lib/market/rates';
import type {
  Account,
  AllocationSlice,
  CryptoPosition,
  EquityPosition,
  FixedIncomePosition,
  MarketQuote,
  MarketRates,
  NewsItem,
  PortfolioSummary,
  Position,
  Signal,
  SyncStatus,
} from '@/lib/types';

/**
 * The only module UI components read data from.
 *
 * Everything here is real except signals, which belong to sub-project 4.
 */

export async function getAccounts(): Promise<Account[]> {
  return listAccounts();
}

/**
 * Positions priced with the latest market quote.
 *
 * A manually entered unit value is what the user paid attention to once; the
 * quote is what the holding is worth now, so it wins wherever we have one.
 */
async function pricedPositions(): Promise<Position[]> {
  const [positions, rates, crypto, equities] = await Promise.all([
    listPositions(),
    latestRates(),
    latestQuotes('cripto'),
    latestQuotes('acoes'),
  ]);

  return positions.map((position) => {
    if (position.assetClass === 'rendaFixa') {
      return { ...position, effectiveAnnualRate: effectiveAnnualRate(position.rateLabel, rates) };
    }

    if (position.assetClass === 'cripto') {
      const quote = crypto.get(position.symbol.toUpperCase());
      if (!quote) return position;
      return {
        ...position,
        priceBrl: quote.priceBrl,
        change24h: quote.changePercent ?? 0,
        currentValue: Number((position.quantity * quote.priceBrl).toFixed(2)),
      };
    }

    const quote = equities.get(position.ticker.toUpperCase());
    if (!quote) return position;
    return {
      ...position,
      price: quote.priceBrl,
      changeDay: quote.changePercent ?? 0,
      currentValue: Number((position.quantity * quote.priceBrl).toFixed(2)),
    };
  });
}

export async function getFixedIncomePositions(): Promise<FixedIncomePosition[]> {
  const positions = await pricedPositions();
  return positions.filter((p): p is FixedIncomePosition => p.assetClass === 'rendaFixa');
}

export async function getCryptoPositions(): Promise<CryptoPosition[]> {
  const positions = await pricedPositions();
  return positions.filter((p): p is CryptoPosition => p.assetClass === 'cripto');
}

export async function getEquityPositions(): Promise<EquityPosition[]> {
  const positions = await pricedPositions();
  return positions.filter((p): p is EquityPosition => p.assetClass === 'acoes');
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const [positions, history, signals] = await Promise.all([
    pricedPositions(),
    listPortfolioHistory(),
    listSignals(),
  ]);

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

  return { totalValue, dayChangeValue, dayChangePercent, allocation, history, averageScore };
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

export async function getSignals(): Promise<Signal[]> {
  return listSignals();
}

export async function getSignalById(id: string): Promise<Signal | null> {
  return findSignal(id);
}

export async function getNews(): Promise<NewsItem[]> {
  return listNews();
}

/** Null until the first market sync collects the BCB series. */
export async function getMarketRates(): Promise<MarketRates | null> {
  return latestRates();
}

/**
 * The market itself, not the portfolio. Pierre covers banks; these tabs exist so
 * the user can see prices before deciding to buy anything.
 */
export async function getCryptoMarket(): Promise<MarketQuote[]> {
  return listQuotes('cripto');
}

export async function getEquityMarket(): Promise<MarketQuote[]> {
  return listQuotes('acoes');
}
