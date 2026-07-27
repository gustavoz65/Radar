import 'server-only';
import {
  type PierreAccount,
  type PierreBalance,
  type PierreTransaction,
  PierreContractError,
  parsePierre,
  pierreAccountsResponse,
  pierreBalanceResponse,
  pierreManualUpdateResponse,
  pierreTransactionsResponse,
} from './dto';

const BASE_URL = 'https://pierre.finance/tools/api';

/** The API key is rejected or expired. The user must generate a new one. */
export class PierreAuthError extends Error {
  constructor() {
    super('Pierre rejeitou a chave de API. Gere uma nova em pierre.finance/api-key.');
    this.name = 'PierreAuthError';
  }
}

/** Pierre answered, but with an error status. */
export class PierreHttpError extends Error {
  constructor(readonly status: number) {
    super(`Pierre respondeu com status ${status}.`);
    this.name = 'PierreHttpError';
  }
}

/** The request never reached Pierre. */
export class PierreNetworkError extends Error {
  constructor() {
    super('Não foi possível alcançar a Pierre. Verifique a conexão.');
    this.name = 'PierreNetworkError';
  }
}

function apiKey(): string {
  const key = process.env.PIERRE_API_KEY;
  if (!key) {
    throw new Error('PIERRE_API_KEY is not set — add it to .env.local');
  }
  return key;
}

/**
 * Every Pierre call goes through here. Error messages are deliberately built
 * from the status alone: the key must never reach a log line or the browser.
 */
async function request(path: string, method: 'GET' | 'POST'): Promise<unknown> {
  const key = apiKey();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new PierreNetworkError();
  }

  if (response.status === 401 || response.status === 403) throw new PierreAuthError();
  if (!response.ok) throw new PierreHttpError(response.status);

  // A 2xx whose body will not parse is still Pierre answering wrongly. Keep it
  // inside the taxonomy — the sync orchestrator routes on these classes, and a
  // raw SyntaxError escaping here would bypass that routing entirely.
  try {
    return await response.json();
  } catch {
    throw new PierreContractError(path, 'a resposta não é JSON válido');
  }
}

export async function getAccounts(): Promise<PierreAccount[]> {
  const payload = await request('get-accounts', 'GET');
  return parsePierre(pierreAccountsResponse, payload, 'get-accounts').data;
}

export async function getBalance(): Promise<PierreBalance> {
  const payload = await request('get-balance', 'GET');
  return parsePierre(pierreBalanceResponse, payload, 'get-balance').data;
}

export async function getTransactions(range: {
  startDate?: string;
  endDate?: string;
}): Promise<PierreTransaction[]> {
  const params = new URLSearchParams();
  if (range.startDate) params.set('startDate', range.startDate);
  if (range.endDate) params.set('endDate', range.endDate);

  const query = params.toString();
  const payload = await request(`get-transactions${query ? `?${query}` : ''}`, 'GET');
  return parsePierre(pierreTransactionsResponse, payload, 'get-transactions').data;
}

/** What a refresh actually achieved, per connected institution. */
export interface PierreUpdateStatus {
  totalItems: number | null;
  completed: number | null;
  inProgress: number | null;
  /** Connections waiting on the user (MFA, a new password). */
  needsUserInput: number | null;
  /** Connections Pierre could not refresh at all. */
  failed: number | null;
}

/**
 * Asks Pierre to pull fresh data from the banks.
 *
 * A 200 here does NOT mean every bank answered: the response reports each
 * connection separately, and one can be failed or awaiting MFA while the call
 * itself succeeds. The counts are returned so the sync can say so instead of
 * reporting a clean success over stale data.
 */
export async function manualUpdate(): Promise<PierreUpdateStatus> {
  const payload = await request('manual-update', 'POST');
  const parsed = parsePierre(pierreManualUpdateResponse, payload, 'manual-update');
  const details = parsed.details;

  return {
    totalItems: details?.totalItems ?? null,
    completed: details?.completed?.count ?? null,
    inProgress: details?.inProgress?.count ?? null,
    needsUserInput: details?.needsUserInput?.count ?? null,
    failed: (details?.failed?.count ?? 0) + (details?.loginErrors?.count ?? 0) || null,
  };
}
