import { describe, expect, it } from 'vitest';
import {
  PierreContractError,
  parsePierre,
  pierreAccountsResponse,
  pierreBalanceResponse,
  pierreManualUpdateResponse,
  pierreTransactionsResponse,
} from '@/lib/pierre/dto';

/**
 * These payloads are trimmed copies of REAL responses from pierre.finance,
 * captured with a live key. The shapes documented on docs.pierre.finance were
 * wrong for get-accounts and manual-update — do not "restore" them.
 */
const accountsPayload = {
  success: true,
  data: [
    {
      id: 'acc_123456789',
      itemId: 'item_1',
      name: 'BANCO DO BRASIL S/A',
      type: 'BANK',
      subtype: 'CHECKING_ACCOUNT',
      number: '1234-5',
      currencyCode: 'BRL',
      balance: '1500.50',
      creditData: null,
      bankData: null,
      marketingName: null,
      taxNumber: null,
      owner: 'Fulano',
      customName: null,
      userId: 'user_1',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-07-26T00:00:00.000Z',
      connectorName: 'Banco do Brasil',
      connectorImageUrl: null,
      itemLastUpdatedAt: '2026-07-26T00:00:00.000Z',
      itemIsActive: true,
    },
  ],
  count: 1,
  timestamp: '2026-07-26T10:30:00Z',
};

describe('pierreAccountsResponse', () => {
  it('accepts the real accounts payload', () => {
    const parsed = parsePierre(pierreAccountsResponse, accountsPayload, 'get-accounts');
    expect(parsed.data[0].id).toBe('acc_123456789');
    expect(parsed.data[0].balance).toBe('1500.50');
    expect(parsed.data[0].connectorName).toBe('Banco do Brasil');
  });

  it('accepts a numeric balance as well as the string Pierre actually sends', () => {
    const payload = { ...accountsPayload, data: [{ ...accountsPayload.data[0], balance: 1500.5 }] };
    const parsed = parsePierre(pierreAccountsResponse, payload, 'get-accounts');
    expect(parsed.data[0].balance).toBe(1500.5);
  });

  it('tolerates unknown extra fields the response may grow', () => {
    const withExtra = {
      ...accountsPayload,
      data: [{ ...accountsPayload.data[0], somethingNew: 'x' }],
    };
    expect(() => parsePierre(pierreAccountsResponse, withExtra, 'get-accounts')).not.toThrow();
  });

  it('tolerates the null connectorName of the in-app Pierre wallet', () => {
    const payload = {
      ...accountsPayload,
      data: [{ ...accountsPayload.data[0], connectorName: null, customName: 'Carteira Pierre' }],
    };
    const parsed = parsePierre(pierreAccountsResponse, payload, 'get-accounts');
    expect(parsed.data[0].connectorName).toBeNull();
  });

  it('throws a PierreContractError naming the endpoint and field when id is missing', () => {
    const account = { ...accountsPayload.data[0] };
    delete (account as Record<string, unknown>).id;
    const payload = { ...accountsPayload, data: [account] };

    try {
      parsePierre(pierreAccountsResponse, payload, 'get-accounts');
      throw new Error('expected parsePierre to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(PierreContractError);
      expect((error as PierreContractError).message).toContain('get-accounts');
      expect((error as PierreContractError).message).toContain('id');
    }
  });

  it('throws when the balance is neither a string nor a number', () => {
    const payload = {
      ...accountsPayload,
      data: [{ ...accountsPayload.data[0], balance: { amount: 10 } }],
    };
    expect(() => parsePierre(pierreAccountsResponse, payload, 'get-accounts')).toThrow(
      PierreContractError,
    );
  });
});

describe('pierreBalanceResponse', () => {
  it('accepts the real snake_case balance payload', () => {
    const parsed = parsePierre(
      pierreBalanceResponse,
      {
        success: true,
        data: {
          total_balance: 2500.75,
          accounts: [
            {
              id: 'acc_1',
              name: 'Conta Corrente',
              balance: 1500.5,
              account_type: 'BANK',
              account_subtype: 'CHECKING_ACCOUNT',
            },
          ],
        },
        timestamp: '2026-07-26T10:30:00Z',
      },
      'get-balance',
    );
    expect(parsed.data.total_balance).toBe(2500.75);
    expect(parsed.data.accounts[0].account_subtype).toBe('CHECKING_ACCOUNT');
  });
});

describe('pierreTransactionsResponse', () => {
  it('accepts the real transactions payload with its extra fields', () => {
    const parsed = parsePierre(
      pierreTransactionsResponse,
      {
        success: true,
        data: [
          {
            id: 'txn_123456789',
            account_id: 'acc_123456789',
            description: 'Pagamento de conta',
            original_description: 'PAGAMENTO',
            category: 'Contas',
            amount: -150,
            date: '2026-07-26T03:16:36.854Z',
            type: 'DEBIT',
            status: 'POSTED',
            merchant: { name: null, category: 'utilities' },
          },
        ],
        count: 1,
        timestamp: '2026-07-26T10:30:00Z',
      },
      'get-transactions',
    );
    expect(parsed.data[0].amount).toBe(-150);
    expect(parsed.data[0].account_id).toBe('acc_123456789');
  });

  it('accepts an empty transaction list', () => {
    const parsed = parsePierre(
      pierreTransactionsResponse,
      { success: true, data: [], count: 0, timestamp: '2026-07-26T10:30:00Z' },
      'get-transactions',
    );
    expect(parsed.data).toHaveLength(0);
  });

  it('tolerates a null category', () => {
    const parsed = parsePierre(
      pierreTransactionsResponse,
      {
        success: true,
        data: [
          {
            id: 'txn_1',
            description: 'x',
            category: null,
            amount: 1,
            date: '2026-07-26T00:00:00.000Z',
            type: 'CREDIT',
            status: 'POSTED',
          },
        ],
        count: 1,
        timestamp: '2026-07-26T10:30:00Z',
      },
      'get-transactions',
    );
    expect(parsed.data[0].category).toBeNull();
  });
});

describe('pierreManualUpdateResponse', () => {
  it('accepts the real per-connection report', () => {
    const parsed = parsePierre(
      pierreManualUpdateResponse,
      {
        success: true,
        message: 'Manual sync initiated',
        details: {
          totalItems: 5,
          completed: { count: 0, items: [] },
          inProgress: { count: 1, items: [{ itemId: 'i1', connectorName: 'Nubank' }] },
          needsUserInput: { count: 0, items: [] },
          loginErrors: { count: 0, items: [] },
          outdated: { count: 0, items: [] },
          partialSuccess: { count: 0, items: [] },
          failed: { count: 4, items: [{ itemId: 'i2', error: 'boom' }] },
        },
        timestamp: '2026-07-26T10:30:00Z',
      },
      'manual-update',
    );
    expect(parsed.details?.failed?.count).toBe(4);
    expect(parsed.details?.totalItems).toBe(5);
  });

  it('accepts a bare success with no details block', () => {
    const parsed = parsePierre(
      pierreManualUpdateResponse,
      { success: true, message: 'ok', timestamp: '2026-07-26T10:30:00Z' },
      'manual-update',
    );
    expect(parsed.details).toBeUndefined();
  });
});
