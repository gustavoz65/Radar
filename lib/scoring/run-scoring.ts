import type { ExplainRequest, Explanation } from '@/lib/ai/nemotron';
import type { SignalToSave } from '@/lib/repositories/signals';
import { FORMULA_VERSION, scoreFixedIncome } from '@/lib/scoring/fixed-income';
import type { FixedIncomePosition, MarketRates, NewsItem } from '@/lib/types';

/** Fixed in code, never written by the model, and required on every signal. */
export const DISCLAIMER = 'Não é recomendação de compra. Reflete o cenário atual do mercado.';

const FALLBACK_SUMMARY = 'Resumo indisponível — score calculado normalmente.';

/** News the fixed-income pilot cares about. */
const RELEVANT_CATEGORIES = new Set(['selic', 'bancos']);

export interface ScoringDeps {
  fixedIncomePositions: () => Promise<FixedIncomePosition[]>;
  rates: () => Promise<MarketRates | null>;
  selicHistory: () => Promise<number[]>;
  news: () => Promise<NewsItem[]>;
  explain: (requests: ExplainRequest[]) => Promise<Explanation[]>;
  saveSignals: (signals: SignalToSave[], updatedAt: Date) => Promise<number>;
  pruneSignals: (keepPositionIds: number[]) => Promise<void>;
  now: () => Date;
}

export interface ScoringResult {
  scored: number;
  skipped: string[];
  explained: boolean;
}

/**
 * Recalculates the fixed-income signals after a sync. The formula runs first and
 * its number is final; the model only supplies wording afterwards, and if it fails
 * the score and breakdown are still saved with fixed prose.
 */
export async function runScoring(deps: ScoringDeps): Promise<ScoringResult> {
  const [positions, rates, selicHistory, news] = await Promise.all([
    deps.fixedIncomePositions(),
    deps.rates(),
    deps.selicHistory(),
    deps.news(),
  ]);

  const headlines = news
    .filter((item) => RELEVANT_CATEGORIES.has(item.category))
    .slice(0, 5)
    .map((item) => item.title);

  const exposureByInstitution = new Map<string, number>();
  for (const position of positions) {
    const key = position.institutionId || 'sem-instituicao';
    exposureByInstitution.set(key, (exposureByInstitution.get(key) ?? 0) + position.currentValue);
  }

  const skipped: string[] = [];
  const scored: {
    position: FixedIncomePosition;
    score: number;
    factors: SignalToSave['factors'];
  }[] = [];

  for (const position of positions) {
    const result = scoreFixedIncome({
      position,
      rates,
      selicHistory,
      institutionExposure:
        exposureByInstitution.get(position.institutionId || 'sem-instituicao') ?? 0,
      relevantNews: headlines.length,
    });

    if (result.unavailableReason) {
      skipped.push(`${position.name}: ${result.unavailableReason}`);
      continue;
    }
    scored.push({ position, score: result.score, factors: result.factors });
  }

  const explanations = await deps.explain(
    scored.map((entry) => ({
      id: entry.position.id,
      name: entry.position.name,
      factors: entry.factors.map((factor) => ({
        label: factor.label,
        direction: factor.direction,
      })),
      headlines,
    })),
  );

  const byId = new Map(explanations.map((explanation) => [explanation.id, explanation]));

  const signals: SignalToSave[] = scored.map((entry) => {
    const explanation = byId.get(entry.position.id);
    return {
      positionId: Number(entry.position.id),
      assetClass: 'rendaFixa',
      score: entry.score,
      formulaVersion: FORMULA_VERSION,
      title: explanation?.title ?? entry.position.name,
      summary: explanation?.summary ?? FALLBACK_SUMMARY,
      disclaimer: DISCLAIMER,
      factors: entry.factors,
    };
  });

  await deps.saveSignals(signals, deps.now());
  await deps.pruneSignals(signals.map((signal) => signal.positionId));

  return { scored: signals.length, skipped, explained: explanations.length > 0 };
}
