/**
 * Runs a real Pierre sync from the command line, against the development
 * database in .env.local.
 *
 * The app triggers a sync through POST /api/sync, which needs a browser session.
 * This is the same orchestration without one — for seeding the database and for
 * checking the live Pierre contract after a change. It prints counts and
 * institution names only: never a balance, never the API key.
 *
 * Usage: npm run sync
 *
 * Runs under `tsx --conditions=react-server` (see the npm script). That
 * condition makes the `server-only` marker resolve to its empty module instead
 * of the one that throws outside a React Server Component.
 */
import { config } from 'dotenv';

config({ path: '.env.local', quiet: true });

async function main() {
  if (!process.env.PIERRE_API_KEY) {
    console.error('PIERRE_API_KEY is not set — add it to .env.local.');
    process.exit(1);
  }

  // Imported after dotenv so the db client sees DATABASE_URL.
  const { getAccounts, getTransactions, manualUpdate } = await import('@/lib/pierre/client');
  const { insertTransactions, listAccounts, upsertAccounts } =
    await import('@/lib/repositories/accounts');
  const { snapshotPositions, upsertSyncedPositions } = await import('@/lib/repositories/positions');
  const { finishSync, lastSuccessfulSync, startSync } = await import('@/lib/repositories/sync-log');
  const { runSync } = await import('@/lib/sync/run-sync');

  const result = await runSync({
    manualUpdate,
    getAccounts,
    getTransactions,
    upsertAccounts,
    upsertSyncedPositions,
    insertTransactions,
    snapshotPositions,
    startSync,
    finishSync,
    lastSuccessfulSync,
    now: () => new Date(),
  });

  console.log(`status:       ${result.status}`);
  console.log(`accounts:     ${result.accounts}`);
  console.log(`transactions: ${result.transactions}`);
  if (result.error) console.log(`note:         ${result.error}`);

  const accounts = await listAccounts();
  console.log(`\n${accounts.length} accounts in the database:`);
  for (const account of accounts) {
    console.log(`  ${account.institution.name} — ${account.type}`);
  }

  process.exit(result.status === 'error' ? 1 : 0);
}

main().catch((error) => {
  console.error('sync failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
