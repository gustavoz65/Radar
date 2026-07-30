import type { FixedIncomePosition, MarketRates, SignalFactor } from '@/lib/types';

/**
 * Bumped whenever a weight or a mapping changes, so a stored score can always be
 * traced back to the formula that produced it.
 */
export const FORMULA_VERSION = 'rf-1';

/** FGC covers up to R$ 250.000 per CPF per institution. */
export const FGC_LIMIT = 250_000;

/**
 * Only two factors move the number, and both are measurable.
 *
 * Liquidity and FGC exposure are reported but not scored: the spec calls the
 * first informative and the second an alert, and folding either into the number
 * would mean deciding that daily liquidity is "better", which it is not.
 * News is qualitative — scoring it would need sentiment, and sentiment from the
 * LLM would let the model move a number it is forbidden to touch.
 */
const WEIGHTS = { ratePremium: 70, selicTrend: 30 } as const;

const RATE_FLOOR = 0.8;
const RATE_CEILING = 1.3;
const TREND_RANGE_PP = 2;

export interface ScoringInput {
  position: FixedIncomePosition;
  rates: MarketRates | null;
  /** Selic readings oldest to newest, as collected from the BCB. */
  selicHistory: number[];
  /** Everything held at the same institution, for the FGC check. */
  institutionExposure: number;
  /** Headlines the AI layer will summarise; they never touch the number. */
  relevantNews: number;
}

export interface ScoreResult {
  score: number;
  factors: SignalFactor[];
  /** Null when the inputs are too thin to score honestly. */
  unavailableReason: string | null;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Maps the contracted rate against the CDI: 100% of the CDI sits mid-scale. */
function ratePremiumScore(effectiveAnnualRate: number, cdi: number): number {
  const ratio = effectiveAnnualRate / cdi;
  return clamp(((ratio - RATE_FLOOR) / (RATE_CEILING - RATE_FLOOR)) * 100);
}

/** A rising Selic favours a post-fixed holding; a falling one works against it. */
function selicTrendScore(history: number[]): number | null {
  if (history.length < 2) return null;

  const first = history[0];
  const last = history[history.length - 1];
  const deltaPp = last - first;

  return clamp(50 + (deltaPp / TREND_RANGE_PP) * 50);
}

function direction(score: number): SignalFactor['direction'] {
  if (score >= 60) return 'positive';
  if (score <= 40) return 'negative';
  return 'neutral';
}

/**
 * Scores one fixed-income holding. Same input, same output — no clock, no
 * randomness, no network.
 */
export function scoreFixedIncome(input: ScoringInput): ScoreResult {
  const { position, rates, selicHistory, institutionExposure, relevantNews } = input;
  const factors: SignalFactor[] = [];

  if (!rates?.cdi || position.effectiveAnnualRate === null) {
    return {
      score: 0,
      factors: [],
      unavailableReason:
        'Sem CDI coletado ou sem taxa equivalente para o título — score não calculado.',
    };
  }

  const rateScore = ratePremiumScore(position.effectiveAnnualRate, rates.cdi);
  const percentOfCdi = Math.round((position.effectiveAnnualRate / rates.cdi) * 100);
  factors.push({
    label: `Rende ${percentOfCdi}% do CDI (${position.rateLabel})`,
    direction: direction(rateScore),
    weight: WEIGHTS.ratePremium,
  });

  const trendScore = selicTrendScore(selicHistory);
  if (trendScore !== null) {
    const deltaPp = selicHistory[selicHistory.length - 1] - selicHistory[0];
    const movement = deltaPp > 0 ? 'em alta' : deltaPp < 0 ? 'em queda' : 'estável';
    factors.push({
      label: `Selic ${movement} nas últimas ${selicHistory.length} leituras`,
      direction: direction(trendScore),
      weight: WEIGHTS.selicTrend,
    });
  }

  factors.push({
    label:
      position.liquidity === 'diaria'
        ? 'Liquidez diária — resgate a qualquer momento'
        : 'Resgate somente no vencimento',
    direction: 'neutral',
    weight: 0,
  });

  if (institutionExposure > FGC_LIMIT) {
    factors.push({
      label: `Exposição de ${Math.round(institutionExposure / 1000)} mil na instituição excede o limite do FGC`,
      direction: 'negative',
      weight: 0,
    });
  }

  if (relevantNews > 0) {
    factors.push({
      label: `${relevantNews} notícia(s) recente(s) sobre juros e renda fixa`,
      direction: 'neutral',
      weight: 0,
    });
  }

  // Only weighted factors form the number; the rest are context.
  const weighted =
    trendScore === null
      ? rateScore
      : (rateScore * WEIGHTS.ratePremium + trendScore * WEIGHTS.selicTrend) /
        (WEIGHTS.ratePremium + WEIGHTS.selicTrend);

  return { score: Math.round(clamp(weighted)), factors, unavailableReason: null };
}
