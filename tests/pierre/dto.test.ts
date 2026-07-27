import { describe, expect, it } from 'vitest';
import {
  PierreContractError,
  parsePierre,
  pierreAccountsResponse,
  pierreBalanceResponse,
  pierreManualUpdateResponse,
  pierreTransactionsResponse,
} from '@/lib/pierre/dto';

const accountsPayload = {
  success: true,
  data: [
    {
      accountId: 'acc_123456789',
      providerCode: 'NUBANK',
      accountName: 'Conta Corrente',
      accountType: 'BANK',
      accountSubtype: 'CHECKING_ACCOUNT',
      accountBalance: 1500.5,
      accountCurrencyCode: 'BRL',
      accountMarketingName: 'Nubank Conta',
    },
  ],
  count: 1,
  timestamp: '2024-01-15T10:30:00Z',
};

describe('pierreAccountsResponse', () => {
  it('accepts the documented accounts payload', () => {
    const parsed = parsePierre(pierreAccountsResponse, accountsPayload, 'get-accounts');
    expect(parsed.data[0].accountId).toBe('acc_123456789');
    expect(parsed.data[0].accountBalance).toBe(1500.5);
  });

  it('tolerates unknown extra fields the docs did not mention', () => {
    const withExtra = {
      ...accountsPayload,
      data: [{ ...accountsPayload.data[0], somethingNew: 'x' }],
    };
    expect(() => parsePierre(pierreAccountsResponse, withExtra, 'get-accounts')).not.toThrow();
  });

  it('tolerates a missing accountMarketingName', () => {
    const account = { ...accountsPayload.data[0] };
    delete (account as Record<string, unknown>).accountMarketingName;
    const payload = { ...accountsPayload, data: [account] };
    expect(() => parsePierre(pierreAccountsResponse, payload, 'get-accounts')).not.toThrow();
  });

  it('throws a PierreContractError naming the endpoint and field when accountId is missing', () => {
    const account = { ...accountsPayload.data[0] };
    delete (account as Record<string, unknown>).accountId;
    const payload = { ...accountsPayload, data: [account] };

    try {
      parsePierre(pierreAccountsResponse, payload, 'get-accounts');
      throw new Error('expected parsePierre to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(PierreContractError);
      expect((error as PierreContractError).message).toContain('get-accounts');
      expect((error as PierreContractError).message).toContain('accountId');
    }
  });

  it('throws when the balance is a string instead of a number', () => {
    const payload = {
      ...accountsPayload,
      data: [{ ...accountsPayload.data[0], accountBalance: '1500.50' }],
    };
    expect(() => parsePierre(pierreAccountsResponse, payload, 'get-accounts')).toThrow(
      PierreContractError,
    );
  });
});

describe('pierreBalanceResponse', () => {
  it('accepts the documented snake_case balance payload', () => {
    const parsed = parsePierre(
      pierreBalanceResponse,
      {
        success: true,
        data: {
          total_balance: 2500.75,
          accounts: [
            {
              name: 'Conta Corrente',
              balance: 1500.5,
              account_type: 'BANK',
              account_subtype: 'CHECKING_ACCOUNT',
            },
          ],
        },
        timestamp: '2024-01-15T10:30:00Z',
      },
      'get-balance',
    );
    expect(parsed.data.total_balance).toBe(2500.75);
    expect(parsed.data.accounts[0].account_subtype).toBe('CHECKING_ACCOUNT');
  });
});

describe('pierreTransactionsResponse', () => {
  it('accepts the documented transactions payload', () => {
    const parsed = parsePierre(
      pierreTransactionsResponse,
      {
        success: true,
        data: [
          {
            id: 'txn_123456789',
            description: 'Pagamento de conta',
            category: 'Contas',
            amount: -150,
            date: '2024-01-15',
            type: 'DEBIT',
            status: 'POSTED',
          },
        ],
        count: 1,
        timestamp: '2024-01-15T10:30:00Z',
      },
      'get-transactions',
    );
    expect(parsed.data[0].amount).toBe(-150);
  });

  it('accepts an empty transaction list', () => {
    const parsed = parsePierre(
      pierreTransactionsResponse,
      { success: true, data: [], count: 0, timestamp: '2024-01-15T10:30:00Z' },
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
            date: '2024-01-15',
            type: 'CREDIT',
            status: 'POSTED',
          },
        ],
        count: 1,
        timestamp: '2024-01-15T10:30:00Z',
      },
      'get-transactions',
    );
    expect(parsed.data[0].category).toBeNull();
  });
});

describe('pierreManualUpdateResponse', () => {
  it('accepts the documented manual update payload', () => {
    const parsed = parsePierre(
      pierreManualUpdateResponse,
      {
        success: true,
        message: 'Manual sync initiated',
        connectedAccounts: 3,
        timestamp: '2024-01-15T10:30:00Z',
      },
      'manual-update',
    );
    expect(parsed.connectedAccounts).toBe(3);
  });
});
