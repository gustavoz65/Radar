import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { bankAccounts, investmentPositions, positionSnapshots } from '@/lib/db/schema';
import { createPosition, snapshotPositions } from '@/lib/repositories/positions';
import { upsertAccounts } from '@/lib/repositories/accounts';
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

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('services over a real database', () => {
  beforeEach(async () => {
    await db.delete(positionSnapshots);
    await db.delete(investmentPositions);
    await db.delete(bankAccounts);
  });

  afterEach(async () => {
    await db.delete(positionSnapshots);
    await db.delete(investmentPositions);
    await db.delete(bankAccounts);
  });

  describe('with an empty database', () => {
    it('returns no accounts rather than throwing', async () => {
      await expect(getAccounts()).resolves.toEqual([]);
    });

    it('returns no positions in any asset class', async () => {
      await expect(getFixedIncomePositions()).resolves.toEqual([]);
      await expect(getCryptoPositions()).resolves.toEqual([]);
      await expect(getEquityPositions()).resolves.toEqual([]);
    });

    it('returns a zeroed portfolio summary without dividing by zero', async () => {
      const summary = await getPortfolioSummary();
      expect(summary.totalValue).toBe(0);
      expect(summary.dayChangeValue).toBe(0);
      expect(summary.dayChangePercent).toBe(0);
      expect(summary.history).toEqual([]);
      expect(summary.allocation.every((slice) => slice.percent === 0)).toBe(true);
      expect(summary.allocation.every((slice) => Number.isFinite(slice.percent))).toBe(true);
    });
  });

  describe('with positions', () => {
    beforeEach(async () => {
      await createPosition({
        assetClass: 'rendaFixa',
        name: 'CDB BB 2028',
        quantity: 1,
        unitValue: 30000,
        investedValue: 28000,
        purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      await createPosition({
        assetClass: 'cripto',
        name: 'Bitcoin',
        ticker: 'BTC',
        quantity: 0.1,
        unitValue: 100000,
        investedValue: 8000,
        purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
    });

    it('filters each asset class into its own service', async () => {
      await expect(getFixedIncomePositions()).resolves.toHaveLength(1);
      await expect(getCryptoPositions()).resolves.toHaveLength(1);
      await expect(getEquityPositions()).resolves.toHaveLength(0);
    });

    it('totals the portfolio from the positions', async () => {
      const summary = await getPortfolioSummary();
      expect(summary.totalValue).toBe(40000);
    });

    it('produces allocation percentages that sum to one hundred', async () => {
      const summary = await getPortfolioSummary();
      const total = summary.allocation.reduce((sum, slice) => sum + slice.percent, 0);
      expect(total).toBeCloseTo(100, 6);
    });

    it('builds history from snapshots', async () => {
      await snapshotPositions(new Date('2026-07-26T12:00:00.000Z'));
      const summary = await getPortfolioSummary();
      expect(summary.history).toHaveLength(1);
      expect(summary.history[0].value).toBe(40000);
    });

    it('computes the day change from the two most recent snapshots', async () => {
      await snapshotPositions(new Date('2026-07-25T12:00:00.000Z'));
      await snapshotPositions(new Date('2026-07-26T12:00:00.000Z'));
      const summary = await getPortfolioSummary();
      // Both snapshots have the same value, so the change is exactly zero.
      expect(summary.dayChangeValue).toBe(0);
      expect(summary.dayChangePercent).toBe(0);
    });
  });

  describe('with bank accounts', () => {
    it('returns accounts with their institution badge', async () => {
      await upsertAccounts([
        {
          externalId: 'acc_1',
          providerCode: 'NUBANK',
          name: 'Nubank Conta',
          type: 'corrente',
          balance: 1500.5,
          currencyCode: 'BRL',
          lastSyncedAt: new Date('2026-07-26T12:00:00.000Z'),
        },
      ]);

      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].institution.initials).toBe('NU');
    });
  });
});

describe('services still backed by fixtures', () => {
  it('still returns mocked signals until sub-project 4 exists', async () => {
    const signals = await getSignals();
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((signal) => signal.factors.length >= 2)).toBe(true);
    expect(signals.every((signal) => signal.disclaimer.trim().length > 0)).toBe(true);
  });

  it('still resolves a signal by id', async () => {
    const [first] = await getSignals();
    await expect(getSignalById(first.id)).resolves.toEqual(first);
  });

  it('still returns mocked news newest first', async () => {
    const news = await getNews();
    const times = news.map((item) => new Date(item.publishedAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('still returns the july 2026 rate anchors', async () => {
    const rates = await getMarketRates();
    expect(rates.selic).toBe(14.25);
    expect(rates.cdi).toBe(14.15);
  });
});
