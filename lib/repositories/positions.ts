import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { investmentPositions, positionSnapshots } from '@/lib/db/schema';
import type { AssetClass, Position, TimeSeriesPoint } from '@/lib/types';

export interface PositionInput {
  assetClass: AssetClass;
  name: string;
  ticker?: string | null;
  institutionCode?: string | null;
  quantity: number;
  unitValue: number;
  investedValue: number;
  contractedRate?: string | null;
  maturityDate?: Date | null;
  purchasedAt: Date;
  notes?: string | null;
}

function toNumber(value: string): number {
  return Number(value);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function createPosition(input: PositionInput): Promise<number> {
  const [result] = await db.insert(investmentPositions).values({
    assetClass: input.assetClass,
    name: input.name,
    ticker: input.ticker ?? null,
    institutionCode: input.institutionCode ?? null,
    quantity: input.quantity.toFixed(8),
    unitValue: input.unitValue.toFixed(2),
    investedValue: input.investedValue.toFixed(2),
    contractedRate: input.contractedRate ?? null,
    maturityDate: input.maturityDate ?? null,
    purchasedAt: input.purchasedAt,
    notes: input.notes ?? null,
    updatedAt: new Date(),
  });
  return result.insertId;
}

export async function updatePosition(id: number, input: PositionInput): Promise<void> {
  await db
    .update(investmentPositions)
    .set({
      assetClass: input.assetClass,
      name: input.name,
      ticker: input.ticker ?? null,
      institutionCode: input.institutionCode ?? null,
      quantity: input.quantity.toFixed(8),
      unitValue: input.unitValue.toFixed(2),
      investedValue: input.investedValue.toFixed(2),
      contractedRate: input.contractedRate ?? null,
      maturityDate: input.maturityDate ?? null,
      purchasedAt: input.purchasedAt,
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(investmentPositions.id, id));
}

export async function deletePosition(id: number): Promise<void> {
  await db.delete(positionSnapshots).where(eq(positionSnapshots.positionId, id));
  await db.delete(investmentPositions).where(eq(investmentPositions.id, id));
}

/**
 * Reads every position and shapes it into the domain union the UI already consumes.
 * `history` is per-position and comes from the snapshot table; it is empty until
 * the first sync runs, which the UI must tolerate.
 */
export async function listPositions(): Promise<Position[]> {
  const rows = await db.select().from(investmentPositions).orderBy(asc(investmentPositions.name));
  const snapshots = await db
    .select()
    .from(positionSnapshots)
    .orderBy(asc(positionSnapshots.capturedAt));

  return rows.map((row) => {
    const quantity = toNumber(row.quantity);
    const unitValue = toNumber(row.unitValue);
    const currentValue = Number((quantity * unitValue).toFixed(2));

    const history: TimeSeriesPoint[] = snapshots
      .filter((snapshot) => snapshot.positionId === row.id)
      .map((snapshot) => ({
        date: isoDate(snapshot.capturedAt),
        value: toNumber(snapshot.value),
      }));

    const base = {
      id: String(row.id),
      name: row.name,
      institutionId: row.institutionCode ?? '',
      quantity,
      investedValue: toNumber(row.investedValue),
      currentValue,
      history,
    };

    if (row.assetClass === 'rendaFixa') {
      return {
        ...base,
        assetClass: 'rendaFixa',
        issuer: row.institutionCode ?? '',
        index: 'CDI',
        rateLabel: row.contractedRate ?? '',
        effectiveAnnualRate: 0,
        maturity: row.maturityDate ? isoDate(row.maturityDate) : '',
        liquidity: 'vencimento',
      };
    }

    if (row.assetClass === 'cripto') {
      return {
        ...base,
        assetClass: 'cripto',
        symbol: row.ticker ?? '',
        priceBrl: unitValue,
        change24h: 0,
      };
    }

    return {
      ...base,
      assetClass: 'acoes',
      ticker: row.ticker ?? '',
      kind: 'acao',
      price: unitValue,
      changeDay: 0,
      dividendYield: 0,
    };
  });
}

/** Writes one snapshot row per position at a single capture instant. */
export async function snapshotPositions(capturedAt: Date): Promise<void> {
  const rows = await db.select().from(investmentPositions);
  if (rows.length === 0) return;

  await db.insert(positionSnapshots).values(
    rows.map((row) => ({
      positionId: row.id,
      capturedAt,
      value: (toNumber(row.quantity) * toNumber(row.unitValue)).toFixed(2),
    })),
  );
}

/** Portfolio history = the sum of all position snapshots at each capture instant. */
export async function listPortfolioHistory(): Promise<TimeSeriesPoint[]> {
  const rows = await db
    .select({
      capturedAt: positionSnapshots.capturedAt,
      total: sql<string>`sum(${positionSnapshots.value})`,
    })
    .from(positionSnapshots)
    .groupBy(positionSnapshots.capturedAt)
    .orderBy(asc(positionSnapshots.capturedAt));

  return rows.map((row) => ({ date: isoDate(row.capturedAt), value: Number(row.total) }));
}
