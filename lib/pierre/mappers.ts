import type { PierreAccount, PierreTransaction } from './dto';

export type BankAccountType = 'corrente' | 'poupanca' | 'investimento';

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

/** Pierre's type vocabulary is open-ended; anything unrecognised is treated as a current account. */
export function mapAccountType(
  accountType: string,
  accountSubtype?: string | null,
): BankAccountType {
  if (accountType.toUpperCase() === 'INVESTMENT') return 'investimento';
  if ((accountSubtype ?? '').toUpperCase() === 'SAVINGS_ACCOUNT') return 'poupanca';
  return 'corrente';
}

export function mapPierreAccount(account: PierreAccount, syncedAt: Date): NewBankAccount {
  return {
    externalId: account.accountId,
    providerCode: account.providerCode,
    // Falsy check, not nullish: Pierre may send an empty string for
    // accountMarketingName, and a blank account name is worse than falling
    // back to the plain accountName.
    name: account.accountMarketingName || account.accountName,
    type: mapAccountType(account.accountType, account.accountSubtype),
    balance: account.accountBalance,
    currencyCode: account.accountCurrencyCode ?? 'BRL',
    lastSyncedAt: syncedAt,
  };
}

export function mapPierreTransaction(tx: PierreTransaction): NewBankTransaction {
  // Pierre sends date-only strings; anchor them at UTC midnight so the stored
  // day never shifts with the server's timezone.
  const occurredAt = new Date(tx.date.includes('T') ? tx.date : `${tx.date}T00:00:00.000Z`);

  return {
    externalId: tx.id,
    description: tx.description,
    category: tx.category ?? null,
    amount: tx.amount,
    occurredAt,
  };
}
