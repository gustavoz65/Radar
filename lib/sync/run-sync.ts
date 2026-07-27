import type { PierreAccount, PierreTransaction } from '@/lib/pierre/dto';
import { mapPierreAccount, mapPierreTransaction } from '@/lib/pierre/mappers';
import type { NewBankAccount, NewBankTransaction } from '@/lib/pierre/mappers';

const FALLBACK_WINDOW_DAYS = 90;

export interface SyncDeps {
  manualUpdate: () => Promise<{ connectedAccounts: number | null }>;
  getAccounts: () => Promise<PierreAccount[]>;
  getTransactions: (range: {
    startDate?: string;
    endDate?: string;
  }) => Promise<PierreTransaction[]>;
  upsertAccounts: (accounts: NewBankAccount[]) => Promise<void>;
  insertTransactions: (txs: NewBankTransaction[]) => Promise<number>;
  snapshotPositions: (capturedAt: Date) => Promise<void>;
  startSync: () => Promise<number>;
  finishSync: (
    id: number,
    status: 'success' | 'partial' | 'error',
    error?: string,
  ) => Promise<void>;
  lastSuccessfulSync: () => Promise<Date | null>;
  now: () => Date;
}

export interface SyncResult {
  status: 'success' | 'partial' | 'error';
  accounts: number;
  transactions: number;
  error: string | null;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Redacts anything that looks like a Pierre key before the message is stored or
 * shown. Belt and braces: the client already builds key-free messages.
 */
function safeMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Erro desconhecido durante a sincronização.';
  return raw.replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]');
}

export async function runSync(deps: SyncDeps): Promise<SyncResult> {
  const startedAt = deps.now();
  const logId = await deps.startSync();

  let accountsWritten = 0;

  try {
    await deps.manualUpdate();

    const pierreAccounts = await deps.getAccounts();
    const accounts = pierreAccounts.map((account) => mapPierreAccount(account, startedAt));
    await deps.upsertAccounts(accounts);
    accountsWritten = accounts.length;
  } catch (error) {
    const message = safeMessage(error);
    await deps.finishSync(logId, 'error', message);
    return { status: 'error', accounts: 0, transactions: 0, error: message };
  }

  // Accounts are in. A transactions failure from here on is partial, not total.
  let transactionsWritten = 0;
  try {
    const since = await deps.lastSuccessfulSync();
    const fallback = new Date(startedAt);
    fallback.setUTCDate(fallback.getUTCDate() - FALLBACK_WINDOW_DAYS);

    const pierreTransactions = await deps.getTransactions({
      startDate: isoDate(since ?? fallback),
      endDate: isoDate(startedAt),
    });

    transactionsWritten = await deps.insertTransactions(
      pierreTransactions.map(mapPierreTransaction),
    );
  } catch (error) {
    const message = safeMessage(error);
    await deps.finishSync(logId, 'partial', message);
    return { status: 'partial', accounts: accountsWritten, transactions: 0, error: message };
  }

  await deps.snapshotPositions(startedAt);
  await deps.finishSync(logId, 'success', undefined);

  return {
    status: 'success',
    accounts: accountsWritten,
    transactions: transactionsWritten,
    error: null,
  };
}
