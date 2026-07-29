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

async function fetchOne(ticker: string): Promise<EquityQuote[]> {
  const token = process.env.BRAPI;
  const query = token ? `?token=${encodeURIComponent(token)}` : '';

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${ticker}${query}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new BrapiError(`${ticker}: não foi possível alcançar a API`);
  }

  if (response.status === 401 || response.status === 403) {
    throw new BrapiError('token rejeitado — confira BRAPI no .env.local');
  }
  if (!response.ok) throw new BrapiError(`${ticker}: status ${response.status}`);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new BrapiError(`${ticker}: a resposta não é JSON válido`);
  }

  return parseEquityQuotes(payload);
}

/**
 * Quotes B3 tickers one request at a time: the free brapi plan rejects a batch
 * with "Seu plano permite no máximo 1 ativo(s) por requisição".
 *
 * A ticker that fails is skipped rather than failing the batch; only a total
 * wipeout throws, since that means the token or the API is the problem.
 */
export async function fetchEquityQuotes(tickers: string[]): Promise<EquityQuote[]> {
  if (tickers.length === 0) return [];

  const settled = await Promise.allSettled(tickers.map(fetchOne));
  const quotes = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));

  if (quotes.length === 0) {
    const [first] = settled;
    const reason = first?.status === 'rejected' ? first.reason : null;
    throw new BrapiError(reason instanceof Error ? reason.message : 'nenhuma cotação retornada');
  }

  return quotes;
}
