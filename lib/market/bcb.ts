import 'server-only';
import { z } from 'zod';

const BASE_URL = 'https://api.bcb.gov.br/dados/serie';

export type IndicatorSeries = 'selic' | 'cdi' | 'ipca12m' | 'poupanca';

/**
 * SGS series codes, chosen against live responses.
 *
 * Series 11 and 12 hold the *daily* Selic and CDI (0.0525%), not the annual
 * figures the dashboard compares against — 432 and 4392 are those.
 */
const SERIES_CODE: Record<IndicatorSeries, number> = {
  selic: 432,
  cdi: 4392,
  ipca12m: 13522,
  poupanca: 195,
};

/** Poupança is published as a monthly yield; the dashboard compares annual rates. */
const MONTHS_PER_YEAR = 12;

const sgsResponse = z.array(z.object({ data: z.string(), valor: z.string() })).min(1);

export interface IndicatorReading {
  series: IndicatorSeries;
  value: number;
  referenceDate: Date;
}

export class BcbError extends Error {
  constructor(
    readonly series: IndicatorSeries,
    reason: string,
  ) {
    super(`BCB série ${series}: ${reason}`);
    this.name = 'BcbError';
  }
}

/** SGS dates are 'DD/MM/YYYY'; anchoring at UTC midnight keeps the day stable. */
function parseSgsDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function annualiseMonthly(monthlyPercent: number): number {
  const annual = (Math.pow(1 + monthlyPercent / 100, MONTHS_PER_YEAR) - 1) * 100;
  return Number(annual.toFixed(4));
}

export function parseIndicator(series: IndicatorSeries, payload: unknown): IndicatorReading {
  const parsed = sgsResponse.safeParse(payload);
  if (!parsed.success) {
    throw new BcbError(series, 'resposta fora do formato esperado');
  }

  const latest = parsed.data[parsed.data.length - 1];
  const value = Number(latest.valor);
  const referenceDate = parseSgsDate(latest.data);

  if (!Number.isFinite(value)) throw new BcbError(series, `valor inválido "${latest.valor}"`);
  if (!referenceDate) throw new BcbError(series, `data inválida "${latest.data}"`);

  return {
    series,
    value: series === 'poupanca' ? annualiseMonthly(value) : value,
    referenceDate,
  };
}

async function fetchSeries(series: IndicatorSeries): Promise<IndicatorReading> {
  const code = SERIES_CODE[series];
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}/bcdata.sgs.${code}/dados/ultimos/1?formato=json`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new BcbError(series, 'não foi possível alcançar o BCB');
  }

  if (!response.ok) throw new BcbError(series, `status ${response.status}`);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new BcbError(series, 'a resposta não é JSON válido');
  }

  return parseIndicator(series, payload);
}

/**
 * Reads every indicator, tolerating individual failures. The BCB answers 502
 * intermittently — observed live on the IPCA series — and one flaky series must
 * not cost the other three.
 */
export async function fetchIndicators(): Promise<{
  readings: IndicatorReading[];
  failures: string[];
}> {
  const series: IndicatorSeries[] = ['selic', 'cdi', 'ipca12m', 'poupanca'];
  const settled = await Promise.allSettled(series.map(fetchSeries));

  const readings: IndicatorReading[] = [];
  const failures: string[] = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') readings.push(result.value);
    else
      failures.push(result.reason instanceof Error ? result.reason.message : 'erro desconhecido');
  }

  return { readings, failures };
}
