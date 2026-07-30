import 'server-only';
import { asc, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { signalFactors, signalRecords } from '@/lib/db/schema';
import type { AssetClass, Signal, SignalFactor } from '@/lib/types';

export interface SignalToSave {
  positionId: number;
  assetClass: AssetClass;
  score: number;
  formulaVersion: string;
  title: string;
  summary: string;
  disclaimer: string;
  factors: SignalFactor[];
}

/** Replaces the stored signal for a position, factors included. */
export async function saveSignals(signals: SignalToSave[], updatedAt: Date): Promise<number> {
  for (const signal of signals) {
    await db
      .insert(signalRecords)
      .values({
        positionId: signal.positionId,
        assetClass: signal.assetClass,
        score: signal.score,
        formulaVersion: signal.formulaVersion,
        title: signal.title,
        summary: signal.summary,
        disclaimer: signal.disclaimer,
        updatedAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          score: signal.score,
          formulaVersion: signal.formulaVersion,
          title: signal.title,
          summary: signal.summary,
          disclaimer: signal.disclaimer,
          updatedAt,
        },
      });

    const [stored] = await db
      .select({ id: signalRecords.id })
      .from(signalRecords)
      .where(eq(signalRecords.positionId, signal.positionId))
      .limit(1);
    if (!stored) continue;

    await db.delete(signalFactors).where(eq(signalFactors.signalId, stored.id));
    if (signal.factors.length > 0) {
      await db.insert(signalFactors).values(
        signal.factors.map((factor, index) => ({
          signalId: stored.id,
          label: factor.label,
          direction: factor.direction,
          weight: factor.weight,
          position: index,
        })),
      );
    }
  }

  return signals.length;
}

/** Drops signals whose position is gone, so the tab never shows an orphan. */
export async function pruneSignals(keepPositionIds: number[]): Promise<void> {
  const stored = await db
    .select({ id: signalRecords.id, positionId: signalRecords.positionId })
    .from(signalRecords);

  const stale = stored.filter((row) => !keepPositionIds.includes(row.positionId));
  if (stale.length === 0) return;

  await db.delete(signalFactors).where(
    inArray(
      signalFactors.signalId,
      stale.map((row) => row.id),
    ),
  );
  await db.delete(signalRecords).where(
    inArray(
      signalRecords.id,
      stale.map((row) => row.id),
    ),
  );
}

export async function listSignals(): Promise<Signal[]> {
  const records = await db.select().from(signalRecords).orderBy(desc(signalRecords.score));
  if (records.length === 0) return [];

  const factors = await db
    .select()
    .from(signalFactors)
    .where(
      inArray(
        signalFactors.signalId,
        records.map((record) => record.id),
      ),
    )
    .orderBy(asc(signalFactors.position));

  return records.map((record) => ({
    id: String(record.id),
    title: record.title,
    assetClass: record.assetClass,
    score: record.score,
    factors: factors
      .filter((factor) => factor.signalId === record.id)
      .map((factor) => ({
        label: factor.label,
        direction: factor.direction,
        weight: factor.weight,
      })),
    summary: record.summary,
    disclaimer: record.disclaimer,
    updatedAt: record.updatedAt.toISOString(),
  }));
}

export async function findSignal(id: string): Promise<Signal | null> {
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return null;

  const signals = await listSignals();
  return signals.find((signal) => signal.id === String(numeric)) ?? null;
}
