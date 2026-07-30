import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PierreAuthError,
  PierreHttpError,
  PierreNetworkError,
  getAccounts,
  getTransactions,
  manualUpdate,
} from '@/lib/pierre/client';
import { PierreContractError } from '@/lib/pierre/dto';

const ACCOUNTS_OK = {
  success: true,
  data: [
    {
      id: 'acc_1',
      name: 'Conta',
      type: 'BANK',
      subtype: 'CHECKING_ACCOUNT',
      balance: '100.00',
      currencyCode: 'BRL',
      connectorName: 'Nubank',
      customName: null,
      marketingName: null,
      itemIsActive: true,
    },
  ],
  count: 1,
  timestamp: '2026-07-26T10:00:00Z',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.PIERRE_API_KEY = 'sk-test-key';
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.PIERRE_API_KEY;
});

describe('getAccounts', () => {
  it('calls the documented URL with a bearer token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(ACCOUNTS_OK));

    await getAccounts();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://pierre.finance/tools/api/get-accounts');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer sk-test-key');
  });

  it('returns the parsed account list', async () => {
    fetchMock.mockResolvedValue(jsonResponse(ACCOUNTS_OK));
    const accounts = await getAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].id).toBe('acc_1');
  });

  it('throws PierreAuthError on 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'unauthorized' }, 401));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreAuthError);
  });

  it('throws PierreAuthError on 403', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'forbidden' }, 403));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreAuthError);
  });

  it('throws PierreHttpError on 500', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'boom' }, 500));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreHttpError);
  });

  it('throws PierreNetworkError when fetch itself rejects', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreNetworkError);
  });

  it('throws PierreContractError when the payload does not match the contract', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [{ nope: 1 }] }));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreContractError);
  });

  it('throws when the API key is missing', async () => {
    delete process.env.PIERRE_API_KEY;
    await expect(getAccounts()).rejects.toThrow(/PIERRE_API_KEY/);
  });

  it('never puts the api key in an error message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'unauthorized' }, 401));
    await expect(getAccounts()).rejects.toSatisfy(
      (error: Error) => !error.message.includes('sk-test-key'),
    );
  });

  it('throws PierreContractError when a 200 response body is not valid JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>not json</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreContractError);
  });

  it('never puts the api key in the non-JSON-body error message', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>not json</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
    await expect(getAccounts()).rejects.toSatisfy(
      (error: Error) => !error.message.includes('sk-test-key'),
    );
  });
});

describe('getTransactions', () => {
  it('passes the date range as query parameters', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: [], count: 0, timestamp: 'x' }),
    );

    await getTransactions({ startDate: '2026-07-01', endDate: '2026-07-26' });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('https://pierre.finance/tools/api/get-transactions?');
    expect(url).toContain('startDate=2026-07-01');
    expect(url).toContain('endDate=2026-07-26');
  });

  it('omits the query string entirely when no range is given', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: [], count: 0, timestamp: 'x' }),
    );

    await getTransactions({});

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://pierre.finance/tools/api/get-transactions');
  });
});

describe('manualUpdate', () => {
  const report = (details: Record<string, unknown>) => ({
    success: true,
    message: 'Manual sync initiated',
    details,
    timestamp: 'x',
  });

  it('POSTs and summarises the per-connection report', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        report({
          totalItems: 5,
          completed: { count: 0, items: [] },
          inProgress: { count: 1, items: [] },
          needsUserInput: { count: 0, items: [] },
          loginErrors: { count: 0, items: [] },
          failed: {
            count: 4,
            items: [
              { connectorName: 'Nubank', error: 'boom' },
              { connectorName: 'Sicredi', error: 'boom' },
              { connectorName: 'Banco do Brasil', error: 'boom' },
              { connectorName: 'Mercado Pago', error: 'boom' },
            ],
          },
        }),
      ),
    );

    const result = await manualUpdate();

    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(result.totalItems).toBe(5);
    expect(result.inProgress).toBe(1);
    expect(result.failed).toBe(4);
  });

  it('does not count Pierre own wallet as a failed connection', async () => {
    // WALLET_NOT_SYNCABLE arrives on every refresh: the in-app wallet is not a
    // bank, so counting it warned about stale balances after every sync.
    fetchMock.mockResolvedValue(
      jsonResponse(
        report({
          totalItems: 5,
          inProgress: { count: 4, items: [] },
          failed: {
            count: 1,
            items: [
              { itemId: 'w1', error: 'Sync not allowed', codeDescription: 'WALLET_NOT_SYNCABLE' },
            ],
          },
        }),
      ),
    );

    const result = await manualUpdate();
    expect(result.failed).toBeNull();
    expect(result.issues).toEqual([]);
  });

  it('names the bank and the reason for a real failure', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        report({
          totalItems: 5,
          failed: {
            count: 1,
            items: [{ itemId: 'i1', connectorName: 'Nubank', error: 'Invalid credentials' }],
          },
        }),
      ),
    );

    const result = await manualUpdate();
    expect(result.failed).toBe(1);
    expect(result.issues).toEqual([
      { connectorName: 'Nubank', reason: 'Invalid credentials', kind: 'actionable' },
    ]);
  });

  it('marks a rate limit as throttled, not as something to reconnect', async () => {
    // "Sync limit exceeded" is not in Pierre's docs at all — it is a server-side
    // limit, and telling the user to reconnect their bank over it is wrong.
    fetchMock.mockResolvedValue(
      jsonResponse(
        report({
          totalItems: 5,
          failed: {
            count: 2,
            items: [
              { connectorName: 'Nubank', error: 'Sync limit exceeded' },
              { connectorName: 'Sicredi', error: 'Sync already in progress' },
            ],
          },
        }),
      ),
    );

    const result = await manualUpdate();
    expect(result.issues.every((issue) => issue.kind === 'throttled')).toBe(true);
  });

  it('counts a login error alongside a failure', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        report({
          totalItems: 2,
          failed: { count: 1, items: [{ connectorName: 'Sicredi', error: 'boom' }] },
          loginErrors: { count: 1, items: [{ connectorName: 'Nubank', error: 'senha inválida' }] },
        }),
      ),
    );

    await expect(manualUpdate()).resolves.toMatchObject({ failed: 2 });
  });

  it('reports nulls rather than throwing when Pierre omits the details block', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, message: 'ok', timestamp: 'x' }));

    await expect(manualUpdate()).resolves.toEqual({
      totalItems: null,
      completed: null,
      inProgress: null,
      needsUserInput: null,
      failed: null,
      issues: [],
    });
  });
});
