import { z } from 'zod';

/**
 * Thrown when Pierre's response does not match these schemas, which were written
 * against live responses because docs.pierre.finance documents different field
 * names. This is how the next drift announces itself instead of corrupting data.
 */
export class PierreContractError extends Error {
  constructor(
    readonly endpoint: string,
    readonly issues: string,
  ) {
    super(`Pierre ${endpoint} returned an unexpected shape: ${issues}`);
    this.name = 'PierreContractError';
  }
}

/**
 * How a reserved balance is remunerated, e.g. 119.9987% of the CDI.
 * `postFixedIndexerPercentage` is a ratio (1.199987), not a percentage.
 */
const pierreRemuneration = z.object({
  indexer: z.string().nullish(),
  postFixedIndexerPercentage: z.number().nullish(),
  preFixedRate: z.number().nullish(),
});

/**
 * A "caixinha": money held inside a checking account but set aside, usually
 * earning interest. It is NOT part of the account's `balance` — Mercado Pago
 * reports a 0.00 balance alongside a 1258.17 reserved pot.
 */
const pierreReservedBalance = z.object({
  name: z.string().nullish(),
  identification: z.string().nullish(),
  availableAmounts: z
    .array(
      z.object({
        amount: z.number(),
        currencyCode: z.string().nullish(),
        remuneration: pierreRemuneration.nullish(),
      }),
    )
    .nullish(),
});

const pierreBankData = z.object({
  closingBalance: z.number().nullish(),
  reservedBalances: z.array(pierreReservedBalance).nullish(),
  automaticallyInvestedBalance: z.number().nullish(),
  overdraftContractedLimit: z.number().nullish(),
});

/** Credit-card limits. Pierre's own dashboard shows `availableCreditLimit`, not `balance`. */
const pierreCreditData = z.object({
  brand: z.string().nullish(),
  level: z.string().nullish(),
  creditLimit: z.number().nullish(),
  availableCreditLimit: z.number().nullish(),
  balanceDueDate: z.string().nullish(),
  minimumPayment: z.number().nullish(),
});

const pierreAccount = z.object({
  id: z.string(),
  name: z.string(),
  /** 'BANK' | 'CREDIT' | 'INVESTMENT' — open-ended, mapped in mappers.ts. */
  type: z.string(),
  /** 'CHECKING_ACCOUNT' | 'SAVINGS' | 'CREDIT_CARD' — note: not 'SAVINGS_ACCOUNT'. */
  subtype: z.string().nullish(),
  /** For a CREDIT account this is the amount USED, i.e. the current bill. */
  balance: z.union([z.string(), z.number()]),
  currencyCode: z.string().nullish(),
  /** The institution's display name, e.g. 'Banco do Brasil'. Null for Pierre's own wallet. */
  connectorName: z.string().nullish(),
  /** User-chosen nickname, when they set one. */
  customName: z.string().nullish(),
  marketingName: z.string().nullish(),
  itemIsActive: z.boolean().nullish(),
  bankData: pierreBankData.nullish(),
  creditData: pierreCreditData.nullish(),
});

export type PierreReservedBalance = z.infer<typeof pierreReservedBalance>;

export const pierreAccountsResponse = z.object({
  success: z.boolean(),
  data: z.array(pierreAccount),
  count: z.number().nullish(),
  timestamp: z.string().nullish(),
});

/** get-balance uses snake_case while get-accounts uses camelCase. This is Pierre's, not ours. */
const pierreBalanceAccount = z.object({
  id: z.string().nullish(),
  name: z.string(),
  balance: z.number(),
  account_type: z.string(),
  account_subtype: z.string().nullish(),
});

export const pierreBalanceResponse = z.object({
  success: z.boolean(),
  data: z.object({
    total_balance: z.number(),
    accounts: z.array(pierreBalanceAccount),
  }),
  timestamp: z.string().nullish(),
});

const pierreTransaction = z.object({
  id: z.string(),
  /** Links the transaction back to a get-accounts row. */
  account_id: z.string().nullish(),
  description: z.string(),
  category: z.string().nullish(),
  amount: z.number(),
  /** Full ISO datetime in practice, e.g. '2026-07-26T03:16:36.854Z'. */
  date: z.string(),
  type: z.string().nullish(),
  status: z.string().nullish(),
});

export const pierreTransactionsResponse = z.object({
  success: z.boolean(),
  data: z.array(pierreTransaction),
  count: z.number().nullish(),
  timestamp: z.string().nullish(),
});

/** One bucket of the manual-update report, e.g. `failed: { count, items }`. */
const updateBucket = z
  .object({
    count: z.number().nullish(),
    items: z
      .array(
        z.object({
          itemId: z.string().nullish(),
          connectorName: z.string().nullish(),
          error: z.string().nullish(),
          codeDescription: z.string().nullish(),
        }),
      )
      .nullish(),
  })
  .nullish();

/**
 * manual-update does NOT return `connectedAccounts` as documented. It returns a
 * per-connection report, which matters: a connection can be failed or awaiting
 * the user's MFA while the call itself succeeds.
 */
export const pierreManualUpdateResponse = z.object({
  success: z.boolean(),
  message: z.string().nullish(),
  details: z
    .object({
      totalItems: z.number().nullish(),
      completed: updateBucket,
      inProgress: updateBucket,
      needsUserInput: updateBucket,
      loginErrors: updateBucket,
      outdated: updateBucket,
      partialSuccess: updateBucket,
      failed: updateBucket,
    })
    .nullish(),
  timestamp: z.string().nullish(),
});

export type PierreAccount = z.infer<typeof pierreAccount>;
export type PierreBalance = z.infer<typeof pierreBalanceResponse>['data'];
export type PierreTransaction = z.infer<typeof pierreTransaction>;

export function parsePierre<T>(schema: z.ZodType<T>, payload: unknown, endpoint: string): T {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
  throw new PierreContractError(endpoint, issues);
}
