import { describe, expect, it } from 'vitest';
import {
  getAccounts,
  getCryptoPositions,
  getEquityPositions,
  getFixedIncomePositions,
  getMarketRates,
  getNews,
  getPortfolioSummary,
  getSignalById,
  getSignals,
} from '@/lib/data/services';

describe('getPortfolioSummary', () => {
  it('returns twelve monthly history points', async () => {
    const summary = await getPortfolioSummary();
    expect(summary.history).toHaveLength(12);
  });

  it('returns an allocation covering the three asset classes', async () => {
    const summary = await getPortfolioSummary();
    expect(summary.allocation.map((slice) => slice.assetClass).sort()).toEqual([
      'acoes',
      'cripto',
      'rendaFixa',
    ]);
  });

  it('returns allocation percentages summing to about one hundred', async () => {
    const summary = await getPortfolioSummary();
    const total = summary.allocation.reduce((sum, slice) => sum + slice.percent, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it('returns a total value equal to the sum of the allocation slices', async () => {
    const summary = await getPortfolioSummary();
    const total = summary.allocation.reduce((sum, slice) => sum + slice.value, 0);
    expect(summary.totalValue).toBeCloseTo(total, 2);
  });

  it('is deterministic across calls', async () => {
    const [first, second] = await Promise.all([getPortfolioSummary(), getPortfolioSummary()]);
    expect(first).toEqual(second);
  });
});

describe('position services', () => {
  it('returns only fixed income positions', async () => {
    const positions = await getFixedIncomePositions();
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((p) => p.assetClass === 'rendaFixa')).toBe(true);
  });

  it('returns only crypto positions', async () => {
    const positions = await getCryptoPositions();
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((p) => p.assetClass === 'cripto')).toBe(true);
  });

  it('returns only equity positions', async () => {
    const positions = await getEquityPositions();
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((p) => p.assetClass === 'acoes')).toBe(true);
  });

  it('gives every position a history series', async () => {
    const positions = await getCryptoPositions();
    expect(positions.every((p) => p.history.length >= 30)).toBe(true);
  });
});

describe('getAccounts', () => {
  it('returns the four mocked institutions', async () => {
    const accounts = await getAccounts();
    const names = [...new Set(accounts.map((a) => a.institution.name))].sort();
    expect(names).toEqual(['Banco do Brasil', 'Mercado Pago', 'Nubank', 'Sicredi']);
  });

  it('gives every institution two-character initials', async () => {
    const accounts = await getAccounts();
    expect(accounts.every((a) => a.institution.initials.length === 2)).toBe(true);
  });
});

describe('getSignals', () => {
  it('returns signals with a score inside zero to one hundred', async () => {
    const signals = await getSignals();
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((s) => s.score >= 0 && s.score <= 100)).toBe(true);
  });

  it('never returns a signal without factors or a disclaimer', async () => {
    const signals = await getSignals();
    expect(signals.every((s) => s.factors.length >= 2)).toBe(true);
    expect(signals.every((s) => s.disclaimer.trim().length > 0)).toBe(true);
  });
});

describe('getSignalById', () => {
  it('finds an existing signal', async () => {
    const [first] = await getSignals();
    await expect(getSignalById(first.id)).resolves.toEqual(first);
  });

  it('returns null for an unknown id', async () => {
    await expect(getSignalById('does-not-exist')).resolves.toBeNull();
  });
});

describe('getNews', () => {
  it('returns items sorted newest first', async () => {
    const news = await getNews();
    const timestamps = news.map((item) => new Date(item.publishedAt).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });
});

describe('getMarketRates', () => {
  it('anchors on the july 2026 selic and cdi', async () => {
    const rates = await getMarketRates();
    expect(rates.selic).toBe(14.25);
    expect(rates.cdi).toBe(14.15);
  });
});
