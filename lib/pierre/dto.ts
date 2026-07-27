import { z } from 'zod';

/**
 * Thrown when Pierre's response does not match the documented contract.
 * These schemas were transcribed from docs.pierre.finance, never verified
 * against a live call — this error is how a contract drift announces itself.
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

/** Unknown extra fields are allowed everywhere — Pierre may add fields without notice. */
const pierreAccount = z.object({
  accountId: z.string(),
  providerCode: z.string(),
  accountName: z.string(),
  accountType: z.string(),
  accountSubtype: z.string().nullish(),
  accountBalance: z.number(),
  accountCurrencyCode: z.string().nullish(),
  accountMarketingName: z.string().nullish(),
});

export const pierreAccountsResponse = z.object({
  success: z.boolean(),
  data: z.array(pierreAccount),
  count: z.number().nullish(),
  timestamp: z.string().nullish(),
});

/** get-balance uses snake_case while get-accounts uses camelCase. This is Pierre's, not ours. */
const pierreBalanceAccount = z.object({
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
  description: z.string(),
  category: z.string().nullish(),
  amount: z.number(),
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

export const pierreManualUpdateResponse = z.object({
  success: z.boolean(),
  message: z.string().nullish(),
  connectedAccounts: z.number().nullish(),
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
