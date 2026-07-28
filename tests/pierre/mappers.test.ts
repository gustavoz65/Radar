import { describe, expect, it } from 'vitest';
import { institutionForProviderCode, normalizeProviderCode } from '@/lib/pierre/institutions';
import {
  mapAccountType,
  mapPierreAccount,
  mapPierreTransaction,
  mapReservedBalances,
} from '@/lib/pierre/mappers';

/** A real get-accounts row, trimmed to the fields the mapper reads. */
const account = {
  id: 'acc_1',
  name: 'BANCO DO BRASIL S/A',
  type: 'BANK',
  subtype: 'CHECKING_ACCOUNT',
  balance: '1500.50',
  currencyCode: 'BRL',
  connectorName: 'Banco do Brasil',
  customName: null,
  marketingName: null,
  itemIsActive: true,
};

describe('normalizeProviderCode', () => {
  it('turns the display name Pierre sends into the catalogue key', () => {
    expect(normalizeProviderCode('Banco do Brasil')).toBe('BANCO_DO_BRASIL');
    expect(normalizeProviderCode('Mercado Pago')).toBe('MERCADO_PAGO');
    expect(normalizeProviderCode('Nubank')).toBe('NUBANK');
  });

  it('is unfazed by stray whitespace and casing', () => {
    expect(normalizeProviderCode('  banco   do brasil ')).toBe('BANCO_DO_BRASIL');
  });
});

describe('institutionForProviderCode', () => {
  it('maps the four connected providers to their branded badge', () => {
    expect(institutionForProviderCode('NUBANK').name).toBe('Nubank');
    expect(institutionForProviderCode('BANCO_DO_BRASIL').name).toBe('Banco do Brasil');
    expect(institutionForProviderCode('SICREDI').name).toBe('Sicredi');
    expect(institutionForProviderCode('MERCADO_PAGO').name).toBe('Mercado Pago');
  });

  it('accepts the display name Pierre actually sends', () => {
    expect(institutionForProviderCode('Banco do Brasil').initials).toBe('BB');
    expect(institutionForProviderCode('Mercado Pago').initials).toBe('MP');
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

  it('gives the in-app Pierre wallet its own badge', () => {
    expect(institutionForProviderCode('PIERRE').initials).toHaveLength(2);
    expect(institutionForProviderCode('PIERRE').name).toBe('Pierre');
  });
});

describe('mapAccountType', () => {
  it('maps a checking account', () => {
    expect(mapAccountType('BANK', 'CHECKING_ACCOUNT')).toBe('corrente');
  });

  it('maps the SAVINGS subtype Pierre really sends', () => {
    expect(mapAccountType('BANK', 'SAVINGS')).toBe('poupanca');
  });

  it('still maps the SAVINGS_ACCOUNT subtype the docs claimed', () => {
    expect(mapAccountType('BANK', 'SAVINGS_ACCOUNT')).toBe('poupanca');
  });

  it('maps a credit card to its own type, never to corrente', () => {
    expect(mapAccountType('CREDIT', 'CREDIT_CARD')).toBe('credito');
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

  it('maps the real account shape onto the persistence shape', () => {
    expect(mapPierreAccount(account, syncedAt)).toEqual({
      externalId: 'acc_1',
      providerCode: 'BANCO_DO_BRASIL',
      name: 'BANCO DO BRASIL S/A',
      type: 'corrente',
      balance: 1500.5,
      currencyCode: 'BRL',
      creditLimit: null,
      availableCreditLimit: null,
      balanceDueDate: null,
      lastSyncedAt: syncedAt,
    });
  });

  it('parses the decimal string balance into a number', () => {
    const mapped = mapPierreAccount({ ...account, balance: '34120.45' }, syncedAt);
    expect(mapped.balance).toBe(34120.45);
  });

  it('prefers the nickname the user set over Pierre own name', () => {
    const mapped = mapPierreAccount({ ...account, customName: 'Conta principal' }, syncedAt);
    expect(mapped.name).toBe('Conta principal');
  });

  it('attributes an account with no connector to the Pierre wallet', () => {
    const mapped = mapPierreAccount(
      { ...account, connectorName: null, name: 'Carteira', subtype: 'SAVINGS' },
      syncedAt,
    );
    expect(mapped.providerCode).toBe('PIERRE');
    expect(mapped.type).toBe('poupanca');
  });

  it('maps a credit card', () => {
    const mapped = mapPierreAccount(
      {
        ...account,
        type: 'CREDIT',
        subtype: 'CREDIT_CARD',
        name: 'OUROCARD FACIL VISA',
        balance: '-842.10',
      },
      syncedAt,
    );
    expect(mapped.type).toBe('credito');
    expect(mapped.balance).toBe(-842.1);
  });

  it('defaults the currency to BRL when Pierre omits it', () => {
    const mapped = mapPierreAccount({ ...account, currencyCode: null }, syncedAt);
    expect(mapped.currencyCode).toBe('BRL');
  });

  it('falls back to a placeholder rather than an empty name', () => {
    const mapped = mapPierreAccount(
      { ...account, name: '', customName: null, marketingName: null },
      syncedAt,
    );
    expect(mapped.name).toBe('Conta');
  });

  it('treats an unparseable balance as zero instead of NaN', () => {
    const mapped = mapPierreAccount({ ...account, balance: 'indisponível' }, syncedAt);
    expect(mapped.balance).toBe(0);
  });
});

describe('mapPierreAccount credit data', () => {
  const syncedAt = new Date('2026-07-26T12:00:00.000Z');

  it('keeps the limit figures Pierre dashboard shows as "disponível"', () => {
    const mapped = mapPierreAccount(
      {
        ...account,
        type: 'CREDIT',
        subtype: 'CREDIT_CARD',
        balance: '2157.00',
        creditData: {
          creditLimit: 5950,
          availableCreditLimit: 3793,
          balanceDueDate: '2026-07-05',
        },
      },
      syncedAt,
    );

    // balance is the amount USED, and used + available === limit.
    expect(mapped.balance).toBe(2157);
    expect(mapped.creditLimit).toBe(5950);
    expect(mapped.availableCreditLimit).toBe(3793);
    expect(mapped.balance + mapped.availableCreditLimit!).toBe(mapped.creditLimit);
    expect(mapped.balanceDueDate?.toISOString()).toBe('2026-07-05T00:00:00.000Z');
  });

  it('leaves the credit fields null on a cash account', () => {
    const mapped = mapPierreAccount(account, syncedAt);
    expect(mapped.creditLimit).toBeNull();
    expect(mapped.availableCreditLimit).toBeNull();
    expect(mapped.balanceDueDate).toBeNull();
  });
});

describe('mapReservedBalances', () => {
  /** The real Mercado Pago "Grana" pot: 1258.17 at 120% of the CDI, in an account whose balance is 0. */
  const withPot = {
    ...account,
    id: 'acc_mp',
    connectorName: 'Mercado Pago',
    balance: '0.00',
    bankData: {
      reservedBalances: [
        {
          name: 'Grana',
          identification: '82a58611-1e60-4c16-ace2-ea6af8c9a0ed',
          availableAmounts: [
            {
              amount: 1258.17,
              currencyCode: 'BRL',
              remuneration: { indexer: 'CDI', postFixedIndexerPercentage: 1.199987 },
            },
          ],
        },
      ],
    },
  };

  it('turns a caixinha into an importable fixed income position', () => {
    const [position] = mapReservedBalances(withPot);

    expect(position.name).toBe('Mercado Pago · Grana');
    expect(position.amount).toBe(1258.17);
    expect(position.institutionCode).toBe('MERCADO_PAGO');
    expect(position.rateLabel).toBe('120% do CDI');
  });

  it('keys the position so a re-sync updates the same row', () => {
    const first = mapReservedBalances(withPot);
    const again = mapReservedBalances(withPot);
    expect(first[0].externalId).toBe(again[0].externalId);
    expect(first[0].externalId).toContain('acc_mp');
  });

  it('returns nothing for an account with no reserved balances', () => {
    expect(mapReservedBalances(account)).toEqual([]);
    expect(mapReservedBalances({ ...account, bankData: { reservedBalances: [] } })).toEqual([]);
  });

  it('skips an empty pot rather than importing a zero holding', () => {
    const empty = {
      ...withPot,
      bankData: {
        reservedBalances: [
          { name: 'Vazia', identification: 'x', availableAmounts: [{ amount: 0 }] },
        ],
      },
    };
    expect(mapReservedBalances(empty)).toEqual([]);
  });

  it('falls back to a plain name when the pot has none and no rate is given', () => {
    const bare = {
      ...withPot,
      bankData: {
        reservedBalances: [{ identification: 'p1', availableAmounts: [{ amount: 10 }] }],
      },
    };
    const [position] = mapReservedBalances(bare);
    expect(position.name).toBe('Mercado Pago · Reserva');
    expect(position.rateLabel).toBeNull();
  });
});

describe('mapPierreTransaction', () => {
  it('maps a debit, preserving the sign', () => {
    const mapped = mapPierreTransaction({
      id: 'txn_123456789',
      description: 'Pagamento de conta',
      category: 'Contas',
      amount: -150,
      date: '2026-07-26T03:16:36.854Z',
      type: 'DEBIT',
      status: 'POSTED',
    });

    expect(mapped.externalId).toBe('txn_123456789');
    expect(mapped.amount).toBe(-150);
    expect(mapped.category).toBe('Contas');
    expect(mapped.occurredAt.toISOString()).toBe('2026-07-26T03:16:36.854Z');
  });

  it('turns a null category into null, not the string "null"', () => {
    const mapped = mapPierreTransaction({
      id: 'txn_2',
      description: 'x',
      category: null,
      amount: 1,
      date: '2026-07-26T00:00:00.000Z',
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
