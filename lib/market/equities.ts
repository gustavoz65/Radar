import 'server-only';
import { z } from 'zod';

const BASE_URL = 'https://brapi.dev/api/quote';

export interface EquityQuote {
  ticker: string;
  priceBrl: number;
  changePercent: number | null;
}

export class BrapiError extends Error {
  constructor(reason: string) {
    super(`brapi: ${reason}`);
    this.name = 'BrapiError';
  }
}

const brapiResponse = z.object({
  results: z
    .array(
      z.object({
        symbol: z.string(),
        regularMarketPrice: z.number().nullish(),
        regularMarketChangePercent: z.number().nullish(),
      }),
    )
    .nullish(),
});

export function parseEquityQuotes(payload: unknown): EquityQuote[] {
  const parsed = brapiResponse.safeParse(payload);
  if (!parsed.success) throw new BrapiError('resposta fora do formato esperado');

  return (parsed.data.results ?? []).flatMap((result) => {
    if (typeof result.regularMarketPrice !== 'number') return [];

    return [
      {
        ticker: result.symbol.toUpperCase(),
        priceBrl: result.regularMarketPrice,
        changePercent:
          typeof result.regularMarketChangePercent === 'number'
            ? result.regularMarketChangePercent
            : null,
      },
    ];
  });
}

/**
 * Quotes B3 tickers. Without a token brapi still answers for a handful of test
 * symbols, so the call is attempted either way and fails loudly on 401.
 */
export async function fetchEquityQuotes(tickers: string[]): Promise<EquityQuote[]> {
  if (tickers.length === 0) return [];

  const token = process.env.BRAPI;
  const query = token ? `?token=${encodeURIComponent(token)}` : '';

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${tickers.join(',')}${query}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new BrapiError('não foi possível alcançar a API');
  }

  if (response.status === 401 || response.status === 403) {
    throw new BrapiError('token rejeitado — confira BRAPI no .env.local');
  }
  if (!response.ok) throw new BrapiError(`status ${response.status}`);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new BrapiError('a resposta não é JSON válido');
  }

  return parseEquityQuotes(payload);
}
