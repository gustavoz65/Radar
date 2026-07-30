import type { PierreAccount, PierreTransaction } from './dto';
import { normalizeProviderCode } from './institutions';

export type BankAccountType = 'corrente' | 'poupanca' | 'investimento' | 'credito';

/** Pierre's own in-app wallet has no connector — it is not a third-party bank. */
export const PIERRE_WALLET_PROVIDER_CODE = 'PIERRE';

export interface NewBankAccount {
  externalId: string;
  providerCode: string;
  name: string;
  type: BankAccountType;
  /** For a `credito` account this is the bill, not money held. */
  balance: number;
  currencyCode: string;
  /** Credit cards only; absent on every cash account. */
  creditLimit?: number | null;
  availableCreditLimit?: number | null;
  balanceDueDate?: Date | null;
  lastSyncedAt: Date;
}

/**
 * A caixinha imported as a fixed-income holding. A reserved balance is invested
 * money paying a percentage of the CDI, and it is absent from the account balance,
 * so without this it is invisible everywhere.
 */
export interface NewSyncedPosition {
  externalId: string;
  name: string;
  institutionCode: string;
  amount: number;
  /** e.g. '120% do CDI', straight from Pierre's own remuneration block. */
  rateLabel: string | null;
}

export interface NewBankTransaction {
  externalId: string;
  description: string;
  category: string | null;
  amount: number;
  occurredAt: Date;
}

/**
 * Pierre's vocabulary is open-ended, so anything unrecognised becomes `corrente`.
 * A credit card gets its own type: folding it in would read a bill as money held.
 */
export function mapAccountType(
  accountType: string,
  accountSubtype?: string | null,
): BankAccountType {
  const type = accountType.toUpperCase();
  const subtype = (accountSubtype ?? '').toUpperCase();

  if (type === 'CREDIT' || subtype === 'CREDIT_CARD') return 'credito';
  if (type === 'INVESTMENT') return 'investimento';
  // Live Pierre sends 'SAVINGS'; the docs claimed 'SAVINGS_ACCOUNT'. Accept both.
  if (subtype === 'SAVINGS' || subtype === 'SAVINGS_ACCOUNT') return 'poupanca';
  return 'corrente';
}

/** `balance` is a decimal string on get-accounts and a number on get-balance. */
function toAmount(value: string | number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 'YYYY-MM-DD' at UTC midnight, or null when Pierre has no date for it. */
function toUtcDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value.includes('T') ? value : `${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function providerCodeFor(account: PierreAccount): string {
  return account.connectorName
    ? normalizeProviderCode(account.connectorName)
    : PIERRE_WALLET_PROVIDER_CODE;
}

export function mapPierreAccount(account: PierreAccount, syncedAt: Date): NewBankAccount {
  const credit = account.creditData;

  return {
    externalId: account.id,
    providerCode: providerCodeFor(account),
    // The nickname the user set wins; Pierre's own `name` is the next best thing
    // and is usually the product name ("OUROCARD FACIL VISA"). marketingName is
    // last because it is often a longer legal-entity string.
    name: account.customName || account.name || account.marketingName || 'Conta',
    type: mapAccountType(account.type, account.subtype),
    balance: toAmount(account.balance),
    currencyCode: account.currencyCode ?? 'BRL',
    creditLimit: credit?.creditLimit ?? null,
    availableCreditLimit: credit?.availableCreditLimit ?? null,
    balanceDueDate: toUtcDate(credit?.balanceDueDate),
    lastSyncedAt: syncedAt,
  };
}

/**
 * Turns Pierre's remuneration block into the label the UI already understands.
 * `postFixedIndexerPercentage` is a ratio: 1.199987 means 120% of the CDI.
 */
function rateLabelFrom(remuneration: {
  indexer?: string | null;
  postFixedIndexerPercentage?: number | null;
  preFixedRate?: number | null;
}): string | null {
  const { indexer, postFixedIndexerPercentage, preFixedRate } = remuneration;

  if (indexer && typeof postFixedIndexerPercentage === 'number') {
    // Trim the float noise Pierre carries (1.199987 -> "120%").
    const percent = Number((postFixedIndexerPercentage * 100).toFixed(2));
    return `${percent.toLocaleString('pt-BR')}% do ${indexer}`;
  }
  if (typeof preFixedRate === 'number') {
    return `${Number((preFixedRate * 100).toFixed(2)).toLocaleString('pt-BR')}% a.a.`;
  }
  return indexer ?? null;
}

/**
 * Extracts every caixinha as a position to import. The external id combines the
 * account and the pot's own identification so a re-sync updates the same row.
 * Empty pots are skipped — an empty caixinha is not a holding.
 */
export function mapReservedBalances(account: PierreAccount): NewSyncedPosition[] {
  const pots = account.bankData?.reservedBalances ?? [];
  const institutionCode = providerCodeFor(account);
  const institutionName = account.connectorName ?? 'Pierre';

  return pots.flatMap((pot, potIndex) => {
    const entries = pot.availableAmounts ?? [];

    return entries.flatMap((entry, entryIndex) => {
      if (!entry.amount || entry.amount <= 0) return [];

      const key = pot.identification ?? `${potIndex}-${entryIndex}`;
      const potName = pot.name?.trim() || 'Reserva';

      return [
        {
          externalId: `pierre:reserved:${account.id}:${key}`,
          name: `${institutionName} · ${potName}`,
          institutionCode,
          amount: entry.amount,
          rateLabel: entry.remuneration ? rateLabelFrom(entry.remuneration) : null,
        },
      ];
    });
  });
}

export function mapPierreTransaction(tx: PierreTransaction): NewBankTransaction {
  // Pierre sends full ISO datetimes in practice, but tolerate a date-only string
  // by anchoring it at UTC midnight so the stored day never shifts with the
  // server's timezone.
  const occurredAt = new Date(tx.date.includes('T') ? tx.date : `${tx.date}T00:00:00.000Z`);

  return {
    externalId: tx.id,
    description: tx.description,
    category: tx.category ?? null,
    amount: tx.amount,
    occurredAt,
  };
}
