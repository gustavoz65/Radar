import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// The repository suites are integration tests against the local MySQL, so they
// need DATABASE_URL. Next loads .env.local on its own; Vitest does not.
config({ path: '.env.local', quiet: true });

// ...but never against the DEVELOPMENT database. Those suites truncate every
// table they touch, so running them over the app's own schema deletes real
// synced accounts and transactions. Redirect to the parallel `_test` schema that
// `npm run db:setup:test` creates. DATABASE_URL_TEST overrides if you want the
// test database somewhere else entirely.
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
} else if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  if (!url.pathname.endsWith('_test')) url.pathname = `${url.pathname}_test`;
  process.env.DATABASE_URL = url.toString();
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Several suites are integration tests sharing one MySQL database and each
    // truncates the tables it uses. Run files one at a time so they cannot wipe
    // each other's rows mid-assertion.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
    },
  },
});
