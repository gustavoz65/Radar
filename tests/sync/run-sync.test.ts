import { describe, expect, it, vi } from 'vitest';
import { runSync, type SyncDeps } from '@/lib/sync/run-sync';
import { PierreAuthError } from '@/lib/pierre/client';

const NOW = new Date('2026-07-26T12:00:00.000Z');

// Generic in the overrides so the keys that are *not* overridden keep their
// Mock type — a plain `Partial<SyncDeps>` widens every key to the bare
// function signature and puts `.mock` out of reach.
function deps<T extends Partial<SyncDeps>>(overrides = {} as T) {
  return {
    manualUpdate: vi.fn().mockResolvedValue({
      totalItems: 4,
      completed: 4,
      inProgress: 0,
      needsUserInput: 0,
      failed: 0,
    }),
    getAccounts: vi.fn().mockResolvedValue([
      {
        id: 'acc_1',
        name: 'Conta',
        type: 'BANK',
        subtype: 'CHECKING_ACCOUNT',
        balance: '100.00',
        currencyCode: 'BRL',
        connectorName: 'Nubank',
        customName: null,
        marketingName: null,
        itemIsActive: true,
      },
    ]),
    getTransactions: vi.fn().mockResolvedValue([
      {
        id: 'txn_1',
        description: 'Pagamento',
        category: 'Contas',
        amount: -150,
        date: '2026-07-20',
        type: 'DEBIT',
        status: 'POSTED',
      },
    ]),
    upsertAccounts: vi.fn().mockResolvedValue(undefined),
    upsertSyncedPositions: vi.fn().mockResolvedValue(0),
    insertTransactions: vi.fn().mockResolvedValue(1),
    snapshotPositions: vi.fn().mockResolvedValue(undefined),
    startSync: vi.fn().mockResolvedValue(7),
    finishSync: vi.fn().mockResolvedValue(undefined),
    lastSuccessfulSync: vi.fn().mockResolvedValue(new Date('2026-07-01T00:00:00.000Z')),
    now: () => NOW,
    ...overrides,
  };
}

describe('runSync', () => {
  it('reports success and the counts on the happy path', async () => {
    const result = await runSync(deps());
    expect(result).toEqual({ status: 'success', accounts: 1, transactions: 1, error: null });
  });

  it('opens and closes a sync log entry', async () => {
    const d = deps();
    await runSync(d);
    expect(d.startSync).toHaveBeenCalledOnce();
    expect(d.finishSync).toHaveBeenCalledWith(7, 'success', undefined);
  });

  it('asks Pierre to refresh before reading', async () => {
    const d = deps();
    await runSync(d);
    expect(d.manualUpdate).toHaveBeenCalledOnce();
    expect(d.manualUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      d.getAccounts.mock.invocationCallOrder[0],
    );
  });

  it('requests transactions since the last successful sync', async () => {
    const d = deps();
    await runSync(d);
    expect(d.getTransactions).toHaveBeenCalledWith({
      startDate: '2026-07-01',
      endDate: '2026-07-26',
    });
  });

  it('falls back to a 90-day window when there has never been a successful sync', async () => {
    const d = deps({ lastSuccessfulSync: vi.fn().mockResolvedValue(null) });
    await runSync(d);
    expect(d.getTransactions).toHaveBeenCalledWith({
      startDate: '2026-04-27',
      endDate: '2026-07-26',
    });
  });

  it('snapshots positions so the history series gains a point', async () => {
    const d = deps();
    await runSync(d);
    expect(d.snapshotPositions).toHaveBeenCalledWith(NOW);
  });

  it('records an error status and a safe message when Pierre rejects the key', async () => {
    const d = deps({ manualUpdate: vi.fn().mockRejectedValue(new PierreAuthError()) });
    const result = await runSync(d);

    expect(result.status).toBe('error');
    expect(result.error).toContain('chave de API');
    expect(d.finishSync).toHaveBeenCalledWith(7, 'error', expect.stringContaining('chave de API'));
  });

  it('does not write anything when the accounts call fails', async () => {
    const d = deps({ getAccounts: vi.fn().mockRejectedValue(new PierreAuthError()) });
    await runSync(d);
    expect(d.upsertAccounts).not.toHaveBeenCalled();
    expect(d.insertTransactions).not.toHaveBeenCalled();
  });

  it('reports partial when accounts succeed but transactions fail', async () => {
    const d = deps({ getTransactions: vi.fn().mockRejectedValue(new Error('timeout')) });
    const result = await runSync(d);

    expect(result.status).toBe('partial');
    expect(result.accounts).toBe(1);
    expect(result.transactions).toBe(0);
    expect(d.upsertAccounts).toHaveBeenCalledOnce();
  });

  it('reports partial when Pierre could not refresh some bank connections', async () => {
    const d = deps({
      manualUpdate: vi.fn().mockResolvedValue({
        totalItems: 5,
        completed: 3,
        inProgress: 0,
        needsUserInput: 1,
        failed: 1,
        issues: [
          { connectorName: 'Nubank', reason: 'senha inválida', kind: 'actionable' as const },
        ],
      }),
    });

    const result = await runSync(d);

    // The write path all worked, so the counts still stand — but the balances
    // for two institutions are stale and the status must not claim success.
    expect(result.status).toBe('partial');
    expect(result.accounts).toBe(1);
    expect(result.transactions).toBe(1);
    // Naming the bank is what makes the warning actionable.
    expect(result.error).toContain('Nubank');
    expect(result.error).toContain('senha inválida');
    expect(d.snapshotPositions).toHaveBeenCalledOnce();
  });

  it('tells the user to wait, not to reconnect, when Pierre is rate limiting', async () => {
    const d = deps({
      manualUpdate: vi.fn().mockResolvedValue({
        totalItems: 5,
        completed: 0,
        inProgress: 4,
        needsUserInput: 0,
        failed: 1,
        issues: [
          { connectorName: null, reason: 'Sync limit exceeded', kind: 'throttled' as const },
        ],
      }),
    });

    const result = await runSync(d);

    expect(result.status).toBe('partial');
    expect(result.error).toContain('limitou a frequência');
    expect(result.error).not.toContain('Reconecte');
  });

  it('still reports success when every connection refreshed cleanly', async () => {
    const d = deps({
      manualUpdate: vi.fn().mockResolvedValue({
        totalItems: 4,
        completed: 4,
        inProgress: 0,
        needsUserInput: 0,
        failed: null,
      }),
    });
    await expect(runSync(d)).resolves.toMatchObject({ status: 'success', error: null });
  });

  it('never leaks an api key into the recorded error', async () => {
    const d = deps({
      manualUpdate: vi.fn().mockRejectedValue(new Error('failed with key sk-secret-value')),
    });
    const result = await runSync(d);
    expect(result.error).not.toContain('sk-secret-value');
  });
});
