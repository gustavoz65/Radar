import 'server-only';
import { fetchIndicators } from '@/lib/market/bcb';
import { fetchCryptoQuotes } from '@/lib/market/crypto';
import { fetchEquityQuotes } from '@/lib/market/equities';
import { fetchNews } from '@/lib/market/news';
import { saveIndicators, saveNews, saveQuotes } from '@/lib/repositories/market';
import { heldAssets } from '@/lib/repositories/positions';
import type { MarketSyncDeps } from '@/lib/sync/run-market-sync';

/** The real wiring, shared by the API route and the CLI script. */
export function marketSyncDeps(): MarketSyncDeps {
  return {
    heldAssets,
    fetchIndicators,
    fetchCryptoQuotes,
    fetchEquityQuotes,
    fetchNews,
    saveIndicators,
    saveQuotes,
    saveNews,
    now: () => new Date(),
  };
}
