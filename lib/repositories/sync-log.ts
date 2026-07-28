import 'server-only';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { syncLogs } from '@/lib/db/schema';

export async function startSync(): Promise<number> {
  const [result] = await db.insert(syncLogs).values({
    source: 'pierre',
    status: 'error', // pessimistic: only a successful finish flips this
    startedAt: new Date(),
  });
  return result.insertId;
}

export async function finishSync(
  id: number,
  status: 'success' | 'partial' | 'error',
  error?: string,
): Promise<void> {
  await db
    .update(syncLogs)
    .set({ status, finishedAt: new Date(), error: error ?? null })
    .where(eq(syncLogs.id, id));
}

export async function lastSuccessfulSync(): Promise<Date | null> {
  const [row] = await db
    .select({ finishedAt: syncLogs.finishedAt })
    .from(syncLogs)
    .where(eq(syncLogs.status, 'success'))
    .orderBy(desc(syncLogs.finishedAt))
    .limit(1);
  return row?.finishedAt ?? null;
}

/**
 * When data last actually landed. A `partial` counts: it wrote the accounts and
 * only failed to refresh some bank connection, so the screen is showing what it
 * fetched. `lastSuccessfulSync` stays stricter because it drives the
 * transactions window.
 */
export async function lastSyncWithData(): Promise<Date | null> {
  const [row] = await db
    .select({ finishedAt: syncLogs.finishedAt })
    .from(syncLogs)
    .where(inArray(syncLogs.status, ['success', 'partial']))
    .orderBy(desc(syncLogs.finishedAt))
    .limit(1);
  return row?.finishedAt ?? null;
}

export async function lastSync(): Promise<{
  status: string;
  finishedAt: Date | null;
  error: string | null;
} | null> {
  const [row] = await db
    .select({ status: syncLogs.status, finishedAt: syncLogs.finishedAt, error: syncLogs.error })
    .from(syncLogs)
    .orderBy(desc(syncLogs.id))
    .limit(1);
  return row ?? null;
}
