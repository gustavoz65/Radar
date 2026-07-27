import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { investmentPositions, positionSnapshots } from '@/lib/db/schema';
import {
  createPosition,
  deletePosition,
  listPortfolioHistory,
  listPositions,
  snapshotPositions,
  updatePosition,
} from '@/lib/repositories/positions';

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

const cdb = {
  assetClass: 'rendaFixa' as const,
  name: 'CDB Banco do Brasil 2028',
  institutionCode: 'BANCO_DO_BRASIL',
  quantity: 1,
  unitValue: 34120.45,
  investedValue: 30000,
  contractedRate: '110% do CDI',
  maturityDate: new Date('2028-03-15T00:00:00.000Z'),
  purchasedAt: new Date('2025-03-15T00:00:00.000Z'),
};

describeDb('positions repository', () => {
  beforeEach(async () => {
    await db.delete(positionSnapshots);
    await db.delete(investmentPositions);
  });

  afterEach(async () => {
    await db.delete(positionSnapshots);
    await db.delete(investmentPositions);
  });

  it('creates a fixed income position and reads it back as a domain Position', async () => {
    await createPosition(cdb);

    const positions = await listPositions();
    expect(positions).toHaveLength(1);
    const [position] = positions;
    expect(position.assetClass).toBe('rendaFixa');
    expect(position.name).toBe('CDB Banco do Brasil 2028');
    expect(position.currentValue).toBe(34120.45);
    expect(position.investedValue).toBe(30000);
  });

  it('computes currentValue as quantity times unitValue', async () => {
    await createPosition({
      assetClass: 'cripto',
      name: 'Bitcoin',
      ticker: 'BTC',
      quantity: 0.5,
      unitValue: 600000,
      investedValue: 250000,
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const [position] = await listPositions();
    expect(position.currentValue).toBe(300000);
  });

  it('updates a position in place', async () => {
    const id = await createPosition(cdb);
    await updatePosition(id, { ...cdb, unitValue: 35000 });

    const [position] = await listPositions();
    expect(position.currentValue).toBe(35000);
  });

  it('deletes a position', async () => {
    const id = await createPosition(cdb);
    await deletePosition(id);
    await expect(listPositions()).resolves.toEqual([]);
  });

  it('returns an empty array when there are no positions', async () => {
    await expect(listPositions()).resolves.toEqual([]);
  });

  it('records one snapshot per position and builds history from them', async () => {
    await createPosition(cdb);
    await snapshotPositions(new Date('2026-06-26T12:00:00.000Z'));
    await snapshotPositions(new Date('2026-07-26T12:00:00.000Z'));

    const history = await listPortfolioHistory();
    expect(history).toHaveLength(2);
    expect(history[0].date).toBe('2026-06-26');
    expect(history[1].date).toBe('2026-07-26');
    expect(history[1].value).toBe(34120.45);
  });

  it('sums every position into a single history point per capture', async () => {
    await createPosition(cdb);
    await createPosition({
      assetClass: 'acoes',
      name: 'Petrobras PN',
      ticker: 'PETR4',
      quantity: 100,
      unitValue: 40,
      investedValue: 3500,
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await snapshotPositions(new Date('2026-07-26T12:00:00.000Z'));

    const history = await listPortfolioHistory();
    expect(history).toHaveLength(1);
    expect(history[0].value).toBe(34120.45 + 4000);
  });

  it('returns an empty history when nothing has ever been snapshotted', async () => {
    await expect(listPortfolioHistory()).resolves.toEqual([]);
  });
});
