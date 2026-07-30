import 'server-only';
import { db } from '@/lib/db/client';
import { bankAccounts, bankTransactions } from '@/lib/db/schema';
import { institutionForProviderCode } from '@/lib/pierre/institutions';
import type { NewBankAccount, NewBankTransaction } from '@/lib/pierre/mappers';
import type { Account } from '@/lib/types';

/** Drizzle returns decimal columns as strings to protect precision. */
function toNumber(value: string): number {
  return Number(value);
}

export async function upsertAccounts(accounts: NewBankAccount[]): Promise<void> {
  if (accounts.length === 0) return;

  for (const account of accounts) {
    await db
      .insert(bankAccounts)
      .values({
        externalId: account.externalId,
        providerCode: account.providerCode,
        name: account.name,
        type: account.type,
        balance: account.balance.toFixed(2),
        currencyCode: account.currencyCode,
        creditLimit: account.creditLimit?.toFixed(2) ?? null,
        availableCreditLimit: account.availableCreditLimit?.toFixed(2) ?? null,
        balanceDueDate: account.balanceDueDate ?? null,
        lastSyncedAt: account.lastSyncedAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          providerCode: account.providerCode,
          name: account.name,
          type: account.type,
          balance: account.balance.toFixed(2),
          currencyCode: account.currencyCode,
          creditLimit: account.creditLimit?.toFixed(2) ?? null,
          availableCreditLimit: account.availableCreditLimit?.toFixed(2) ?? null,
          balanceDueDate: account.balanceDueDate ?? null,
          lastSyncedAt: account.lastSyncedAt,
        },
      });
  }
}

/**
 * Returns how many rows were genuinely new. INSERT IGNORE, not ON DUPLICATE KEY
 * UPDATE: mysql2 sets FOUND_ROWS, so a no-op duplicate also reports affectedRows 1.
 */
export async function insertTransactions(txs: NewBankTransaction[]): Promise<number> {
  if (txs.length === 0) return 0;

  const [result] = await db
    .insert(bankTransactions)
    .ignore()
    .values(
      txs.map((tx) => ({
        externalId: tx.externalId,
        description: tx.description,
        category: tx.category,
        amount: tx.amount.toFixed(2),
        occurredAt: tx.occurredAt,
      })),
    );

  return result.affectedRows;
}

export async function listAccounts(): Promise<Account[]> {
  const rows = await db.select().from(bankAccounts).orderBy(bankAccounts.name);

  return rows.map((row) => ({
    id: String(row.id),
    institution: institutionForProviderCode(row.providerCode),
    type: row.type,
    balance: toNumber(row.balance),
    lastUpdated: row.lastSyncedAt.toISOString(),
    creditLimit: row.creditLimit === null ? null : toNumber(row.creditLimit),
    availableCreditLimit:
      row.availableCreditLimit === null ? null : toNumber(row.availableCreditLimit),
    balanceDueDate: row.balanceDueDate ? row.balanceDueDate.toISOString().slice(0, 10) : null,
  }));
}
