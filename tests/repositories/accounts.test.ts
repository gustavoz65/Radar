import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { bankAccounts, bankTransactions } from '@/lib/db/schema';
import { insertTransactions, listAccounts, upsertAccounts } from '@/lib/repositories/accounts';

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;
const syncedAt = new Date('2026-07-26T12:00:00.000Z');

describeDb('accounts repository', () => {
  beforeEach(async () => {
    await db.delete(bankTransactions);
    await db.delete(bankAccounts);
  });

  afterEach(async () => {
    await db.delete(bankTransactions);
    await db.delete(bankAccounts);
  });

  it('inserts new accounts', async () => {
    await upsertAccounts([
      {
        externalId: 'acc_1',
        providerCode: 'NUBANK',
        name: 'Nubank Conta',
        type: 'corrente',
        balance: 1500.5,
        currencyCode: 'BRL',
        lastSyncedAt: syncedAt,
      },
    ]);

    const accounts = await listAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].balance).toBe(1500.5);
  });

  it('updates the balance of an account it has already seen instead of duplicating it', async () => {
    const base = {
      externalId: 'acc_1',
      providerCode: 'NUBANK',
      name: 'Nubank Conta',
      type: 'corrente' as const,
      currencyCode: 'BRL',
      lastSyncedAt: syncedAt,
    };

    await upsertAccounts([{ ...base, balance: 100 }]);
    await upsertAccounts([{ ...base, balance: 250.75 }]);

    const accounts = await listAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].balance).toBe(250.75);
  });

  it('maps the provider code to an institution badge on read', async () => {
    await upsertAccounts([
      {
        externalId: 'acc_1',
        providerCode: 'NUBANK',
        name: 'Nubank Conta',
        type: 'corrente',
        balance: 1,
        currencyCode: 'BRL',
        lastSyncedAt: syncedAt,
      },
    ]);

    const [account] = await listAccounts();
    expect(account.institution.name).toBe('Nubank');
    expect(account.institution.initials).toBe('NU');
  });

  it('returns an empty array when there are no accounts', async () => {
    await expect(listAccounts()).resolves.toEqual([]);
  });

  it('inserts transactions and ignores ones it already has', async () => {
    const tx = {
      externalId: 'txn_1',
      description: 'Pagamento',
      category: 'Contas',
      amount: -150,
      occurredAt: new Date('2026-07-20T00:00:00.000Z'),
    };

    expect(await insertTransactions([tx])).toBe(1);
    expect(await insertTransactions([tx])).toBe(0);
  });

  it('inserts nothing and reports zero for an empty batch', async () => {
    expect(await insertTransactions([])).toBe(0);
  });
});
