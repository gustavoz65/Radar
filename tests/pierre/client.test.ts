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
      accountId: 'acc_1',
      providerCode: 'NUBANK',
      accountName: 'Conta',
      accountType: 'BANK',
      accountSubtype: 'CHECKING_ACCOUNT',
      accountBalance: 100,
      accountCurrencyCode: 'BRL',
      accountMarketingName: 'Nubank Conta',
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
    expect(accounts[0].accountId).toBe('acc_1');
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
  it('POSTs and returns the connected account count', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        message: 'Manual sync initiated',
        connectedAccounts: 3,
        timestamp: 'x',
      }),
    );

    const result = await manualUpdate();

    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(result.connectedAccounts).toBe(3);
  });
});
