import 'server-only';
import { cached } from '@/lib/cache/redis';
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

/**
 * Cache TTLs in seconds, doubling as a debounce on "Atualizar agora".
 * manual-update holds far longer: it asks the banks to refresh, and they do not
 * re-answer within seconds.
 */
const TTL = {
  manualUpdate: 5 * 60,
  reads: 60,
} as const;

/** Bump when a DTO changes shape, so entries cached under the old schema are abandoned. */
const CACHE_VERSION = 'v1';

function cacheKey(...parts: string[]): string {
  return ['pierre', CACHE_VERSION, ...parts].join(':');
}

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
  return cached(cacheKey('get-accounts'), TTL.reads, async () => {
    const payload = await request('get-accounts', 'GET');
    return parsePierre(pierreAccountsResponse, payload, 'get-accounts').data;
  });
}

export async function getBalance(): Promise<PierreBalance> {
  return cached(cacheKey('get-balance'), TTL.reads, async () => {
    const payload = await request('get-balance', 'GET');
    return parsePierre(pierreBalanceResponse, payload, 'get-balance').data;
  });
}

export async function getTransactions(range: {
  startDate?: string;
  endDate?: string;
}): Promise<PierreTransaction[]> {
  const params = new URLSearchParams();
  if (range.startDate) params.set('startDate', range.startDate);
  if (range.endDate) params.set('endDate', range.endDate);

  const query = params.toString();

  // The range is part of the key: two different windows are two different answers.
  return cached(
    cacheKey('get-transactions', range.startDate ?? 'all', range.endDate ?? 'now'),
    TTL.reads,
    async () => {
      const payload = await request(`get-transactions${query ? `?${query}` : ''}`, 'GET');
      return parsePierre(pierreTransactionsResponse, payload, 'get-transactions').data;
    },
  );
}

/**
 * A connection that did not refresh. `kind` decides the wording: telling someone
 * to reconnect their bank when Pierre merely rate-limited us sends them chasing a
 * problem that does not exist.
 */
export interface PierreConnectionIssue {
  connectorName: string | null;
  reason: string | null;
  kind: 'throttled' | 'actionable';
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
  issues: PierreConnectionIssue[];
}

/**
 * Pierre's own wallet reports `WALLET_NOT_SYNCABLE` on every refresh: it is not a
 * bank connection, so there is nothing to sync. Counting it as a failure made the
 * dashboard warn about stale balances after every single sync.
 */
const NOT_A_FAILURE = new Set(['WALLET_NOT_SYNCABLE']);

/** Pierre pacing us, not a broken connection — nothing for the user to fix. */
const THROTTLED = [/already in progress/i, /limit exceeded/i, /too many requests/i];

function classify(reason: string | null): PierreConnectionIssue['kind'] {
  return reason && THROTTLED.some((pattern) => pattern.test(reason)) ? 'throttled' : 'actionable';
}

/**
 * Asks Pierre to pull fresh data from the banks. A 200 does not mean every bank
 * answered — a connection can be failed or awaiting MFA — so the counts come back
 * for the sync to report instead of claiming success over stale data.
 */
export async function manualUpdate(): Promise<PierreUpdateStatus> {
  return cached(cacheKey('manual-update'), TTL.manualUpdate, requestManualUpdate);
}

async function requestManualUpdate(): Promise<PierreUpdateStatus> {
  const payload = await request('manual-update', 'POST');
  const parsed = parsePierre(pierreManualUpdateResponse, payload, 'manual-update');
  const details = parsed.details;

  const issues: PierreConnectionIssue[] = [
    ...(details?.failed?.items ?? []),
    ...(details?.loginErrors?.items ?? []),
  ]
    .filter((item) => !NOT_A_FAILURE.has(item.codeDescription ?? ''))
    .map((item) => {
      const reason = item.error ?? item.codeDescription ?? null;
      return { connectorName: item.connectorName ?? null, reason, kind: classify(reason) };
    });

  return {
    totalItems: details?.totalItems ?? null,
    completed: details?.completed?.count ?? null,
    inProgress: details?.inProgress?.count ?? null,
    needsUserInput: details?.needsUserInput?.count ?? null,
    failed: issues.length || null,
    issues,
  };
}
