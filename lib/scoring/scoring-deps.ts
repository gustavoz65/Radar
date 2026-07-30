import 'server-only';
import { explainSignals } from '@/lib/ai/nemotron';
import { getFixedIncomePositions, getMarketRates, getNews } from '@/lib/data/services';
import { indicatorHistory } from '@/lib/repositories/market';
import { pruneSignals, saveSignals } from '@/lib/repositories/signals';
import type { ScoringDeps } from '@/lib/scoring/run-scoring';

/** The real wiring, shared by the API route and the CLI script. */
export function scoringDeps(): ScoringDeps {
  return {
    fixedIncomePositions: getFixedIncomePositions,
    rates: getMarketRates,
    selicHistory: () => indicatorHistory('selic'),
    news: getNews,
    explain: explainSignals,
    saveSignals,
    pruneSignals,
    now: () => new Date(),
  };
}
