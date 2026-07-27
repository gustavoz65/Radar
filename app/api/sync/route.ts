import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { getAccounts, getTransactions, manualUpdate } from '@/lib/pierre/client';
import { insertTransactions, upsertAccounts } from '@/lib/repositories/accounts';
import { snapshotPositions } from '@/lib/repositories/positions';
import { finishSync, lastSuccessfulSync, startSync } from '@/lib/repositories/sync-log';
import { runSync } from '@/lib/sync/run-sync';

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
    insertTransactions,
    snapshotPositions,
    startSync,
    finishSync,
    lastSuccessfulSync,
    now: () => new Date(),
  });

  if (result.status !== 'error') {
    revalidatePath('/visao-geral');
    revalidatePath('/posicoes');
  }

  return NextResponse.json(result, { status: result.status === 'error' ? 500 : 200 });
}
