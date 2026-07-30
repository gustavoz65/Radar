import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  getAccounts,
  getBillSummary,
  getInstallmentCommitment,
  getTransactions,
  manualUpdate,
} from '@/lib/pierre/client';
import {
  applyBillDetails,
  insertTransactions,
  saveInstallmentCommitment,
  upsertAccounts,
} from '@/lib/repositories/accounts';
import { snapshotPositions, upsertSyncedPositions } from '@/lib/repositories/positions';
import { finishSync, lastSuccessfulSync, startSync } from '@/lib/repositories/sync-log';
import { runSync } from '@/lib/sync/run-sync';
import { runMarketSync } from '@/lib/sync/run-market-sync';
import { marketSyncDeps } from '@/lib/sync/market-deps';
import { runScoring } from '@/lib/scoring/run-scoring';
import { scoringDeps } from '@/lib/scoring/scoring-deps';

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const result = await runSync({
    manualUpdate,
    getAccounts,
    getTransactions,
    upsertAccounts,
    getBillSummary,
    applyBillDetails,
    getInstallmentCommitment,
    saveInstallmentCommitment,
    upsertSyncedPositions,
    insertTransactions,
    snapshotPositions,
    startSync,
    finishSync,
    lastSuccessfulSync,
    now: () => new Date(),
  });

  // Market data is independent of Pierre: quotes, rates and news are worth
  // refreshing even when the bank connections are down.
  const market = await runMarketSync(marketSyncDeps());

  // Scoring runs last: it reads the rates and news the two syncs just wrote.
  const scoring = await runScoring(scoringDeps());

  if (result.status !== 'error') {
    for (const path of [
      '/visao-geral',
      '/posicoes',
      '/renda-fixa',
      '/cripto',
      '/acoes',
      '/noticias',
      '/ferramentas',
    ]) {
      revalidatePath(path);
    }
  }

  return NextResponse.json(
    { ...result, market, scoring },
    { status: result.status === 'error' ? 500 : 200 },
  );
}
