import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import {
  bankAccounts,
  economicIndicators,
  investmentPositions,
  newsItems,
  positionSnapshots,
  syncLogs,
} from '@/lib/db/schema';
import { saveIndicators, saveNews } from '@/lib/repositories/market';
import { createPosition, snapshotPositions } from '@/lib/repositories/positions';
import { upsertAccounts } from '@/lib/repositories/accounts';
import { finishSync, startSync } from '@/lib/repositories/sync-log';
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
  getSyncStatus,
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

  describe('sync status', () => {
    beforeEach(async () => {
      await db.delete(syncLogs);
    });

    afterEach(async () => {
      await db.delete(syncLogs);
    });

    it('reports nothing before the first sync', async () => {
      await expect(getSyncStatus()).resolves.toEqual({
        status: null,
        finishedAt: null,
        error: null,
        lastSuccessfulAt: null,
      });
    });

    it('counts a partial sync as an update', async () => {
      // A partial wrote the accounts and only failed to refresh a bank, so the
      // screen showing that data must not claim nothing ever completed.
      const id = await startSync();
      await finishSync(id, 'partial', '1 de 5 conexões não atualizaram.');

      const status = await getSyncStatus();
      expect(status.status).toBe('partial');
      expect(status.lastSuccessfulAt).not.toBeNull();
      expect(status.error).toContain('não atualizaram');
    });

    it('keeps the last good timestamp when a later attempt fails outright', async () => {
      const good = await startSync();
      await finishSync(good, 'success');
      const { lastSuccessfulAt: afterGood } = await getSyncStatus();

      const bad = await startSync();
      await finishSync(bad, 'error', 'Pierre rejeitou a chave de API.');

      const status = await getSyncStatus();
      expect(status.status).toBe('error');
      expect(status.error).toContain('chave de API');
      // The numbers on screen still came from the good run.
      expect(status.lastSuccessfulAt).toBe(afterGood);
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

describe('market data services', () => {
  beforeEach(async () => {
    await db.delete(economicIndicators);
    await db.delete(newsItems);
  });

  afterEach(async () => {
    await db.delete(economicIndicators);
    await db.delete(newsItems);
  });

  it('reports no rates before the first market sync instead of inventing zeros', async () => {
    await expect(getMarketRates()).resolves.toBeNull();
  });

  it('returns the collected rates once they exist', async () => {
    await saveIndicators(
      [
        { series: 'selic', value: 14.25, referenceDate: new Date('2026-08-05T00:00:00.000Z') },
        { series: 'cdi', value: 14.15, referenceDate: new Date('2026-07-01T00:00:00.000Z') },
      ],
      new Date('2026-07-28T12:00:00.000Z'),
    );

    const rates = await getMarketRates();
    expect(rates?.selic).toBe(14.25);
    expect(rates?.cdi).toBe(14.15);
  });

  it('returns news newest first', async () => {
    await saveNews([
      {
        externalId: 'https://example.com/a',
        title: 'Copom mantém a Selic',
        source: 'InfoMoney',
        url: 'https://example.com/a',
        publishedAt: new Date('2026-07-20T10:00:00.000Z'),
        category: 'selic',
        summary: null,
      },
      {
        externalId: 'https://example.com/b',
        title: 'Bitcoin sobe',
        source: 'InfoMoney',
        url: 'https://example.com/b',
        publishedAt: new Date('2026-07-27T10:00:00.000Z'),
        category: 'cripto',
        summary: null,
      },
    ]);

    const news = await getNews();
    expect(news.map((item) => item.title)).toEqual(['Bitcoin sobe', 'Copom mantém a Selic']);
  });
});

describe('signals, still the only fixture', () => {
  it('returns mocked signals until sub-project 4 exists', async () => {
    const signals = await getSignals();
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((signal) => signal.factors.length >= 2)).toBe(true);
    expect(signals.every((signal) => signal.disclaimer.trim().length > 0)).toBe(true);
  });

  it('resolves a signal by id', async () => {
    const [first] = await getSignals();
    await expect(getSignalById(first.id)).resolves.toEqual(first);
  });
});
