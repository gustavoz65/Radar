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
  balance: number;
  currencyCode: string;
  lastSyncedAt: Date;
}

export interface NewBankTransaction {
  externalId: string;
  description: string;
  category: string | null;
  amount: number;
  occurredAt: Date;
}

/**
 * Pierre's type vocabulary is open-ended; anything unrecognised is treated as a
 * current account.
 *
 * A credit card is a real connected account but not an asset, so it gets its own
 * type rather than being folded into `corrente` — the balance there is a bill,
 * not money held.
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

export function mapPierreAccount(account: PierreAccount, syncedAt: Date): NewBankAccount {
  return {
    externalId: account.id,
    providerCode: account.connectorName
      ? normalizeProviderCode(account.connectorName)
      : PIERRE_WALLET_PROVIDER_CODE,
    // The nickname the user set wins; Pierre's own `name` is the next best thing
    // and is usually the product name ("OUROCARD FACIL VISA"). marketingName is
    // last because it is often a longer legal-entity string.
    name: account.customName || account.name || account.marketingName || 'Conta',
    type: mapAccountType(account.type, account.subtype),
    balance: toAmount(account.balance),
    currencyCode: account.currencyCode ?? 'BRL',
    lastSyncedAt: syncedAt,
  };
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
