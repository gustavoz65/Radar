import { describe, expect, it } from 'vitest';
import { institutionForProviderCode } from '@/lib/pierre/institutions';
import { mapAccountType, mapPierreAccount, mapPierreTransaction } from '@/lib/pierre/mappers';

describe('institutionForProviderCode', () => {
  it('maps the four known providers to their branded badge', () => {
    expect(institutionForProviderCode('NUBANK').name).toBe('Nubank');
    expect(institutionForProviderCode('BANCO_DO_BRASIL').name).toBe('Banco do Brasil');
    expect(institutionForProviderCode('SICREDI').name).toBe('Sicredi');
    expect(institutionForProviderCode('MERCADO_PAGO').name).toBe('Mercado Pago');
  });

  it('is case-insensitive about the provider code', () => {
    expect(institutionForProviderCode('nubank').id).toBe('nubank');
  });

  it('always returns two-character initials', () => {
    for (const code of ['NUBANK', 'BANCO_DO_BRASIL', 'SICREDI', 'MERCADO_PAGO', 'WHATEVER_BANK']) {
      expect(institutionForProviderCode(code).initials).toHaveLength(2);
    }
  });

  it('falls back to a generated badge for an unknown provider rather than throwing', () => {
    const unknown = institutionForProviderCode('BANCO_INEXISTENTE');
    expect(unknown.name).toBe('Banco Inexistente');
    expect(unknown.initials).toBe('BI');
    expect(unknown.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('handles a single-word unknown provider', () => {
    const unknown = institutionForProviderCode('XPTO');
    expect(unknown.initials).toHaveLength(2);
  });
});

describe('mapAccountType', () => {
  it('maps a checking account', () => {
    expect(mapAccountType('BANK', 'CHECKING_ACCOUNT')).toBe('corrente');
  });

  it('maps a savings account', () => {
    expect(mapAccountType('BANK', 'SAVINGS_ACCOUNT')).toBe('poupanca');
  });

  it('maps an investment account', () => {
    expect(mapAccountType('INVESTMENT', null)).toBe('investimento');
  });

  it('defaults an unrecognised bank subtype to corrente', () => {
    expect(mapAccountType('BANK', 'SOMETHING_NEW')).toBe('corrente');
  });

  it('defaults an entirely unrecognised type to corrente', () => {
    expect(mapAccountType('MYSTERY', null)).toBe('corrente');
  });
});

describe('mapPierreAccount', () => {
  const syncedAt = new Date('2026-07-26T12:00:00.000Z');

  it('maps the documented account shape onto the persistence shape', () => {
    const mapped = mapPierreAccount(
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
      syncedAt,
    );

    expect(mapped).toEqual({
      externalId: 'acc_123456789',
      providerCode: 'NUBANK',
      name: 'Nubank Conta',
      type: 'corrente',
      balance: 1500.5,
      currencyCode: 'BRL',
      lastSyncedAt: syncedAt,
    });
  });

  it('falls back to accountName when the marketing name is absent', () => {
    const mapped = mapPierreAccount(
      {
        accountId: 'acc_2',
        providerCode: 'SICREDI',
        accountName: 'Poupança',
        accountType: 'BANK',
        accountSubtype: 'SAVINGS_ACCOUNT',
        accountBalance: 10,
        accountCurrencyCode: null,
        accountMarketingName: null,
      },
      syncedAt,
    );
    expect(mapped.name).toBe('Poupança');
    expect(mapped.type).toBe('poupanca');
  });

  it('defaults the currency to BRL when Pierre omits it', () => {
    const mapped = mapPierreAccount(
      {
        accountId: 'acc_3',
        providerCode: 'NUBANK',
        accountName: 'x',
        accountType: 'BANK',
        accountSubtype: null,
        accountBalance: 0,
        accountCurrencyCode: null,
        accountMarketingName: null,
      },
      syncedAt,
    );
    expect(mapped.currencyCode).toBe('BRL');
  });
});

describe('mapPierreTransaction', () => {
  it('maps a debit, preserving the sign', () => {
    const mapped = mapPierreTransaction({
      id: 'txn_123456789',
      description: 'Pagamento de conta',
      category: 'Contas',
      amount: -150,
      date: '2024-01-15',
      type: 'DEBIT',
      status: 'POSTED',
    });

    expect(mapped.externalId).toBe('txn_123456789');
    expect(mapped.amount).toBe(-150);
    expect(mapped.category).toBe('Contas');
    expect(mapped.occurredAt.toISOString()).toBe('2024-01-15T00:00:00.000Z');
  });

  it('turns a null category into null, not the string "null"', () => {
    const mapped = mapPierreTransaction({
      id: 'txn_2',
      description: 'x',
      category: null,
      amount: 1,
      date: '2024-01-15',
      type: 'CREDIT',
      status: 'POSTED',
    });
    expect(mapped.category).toBeNull();
  });

  it('parses a date-only string as UTC midnight, not local midnight', () => {
    const mapped = mapPierreTransaction({
      id: 'txn_3',
      description: 'x',
      category: null,
      amount: 1,
      date: '2024-12-31',
      type: 'CREDIT',
      status: 'POSTED',
    });
    expect(mapped.occurredAt.toISOString()).toBe('2024-12-31T00:00:00.000Z');
  });
});
