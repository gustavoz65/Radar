import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// The repository suites are integration tests against the local MySQL, so they
// need DATABASE_URL. Next loads .env.local on its own; Vitest does not.
config({ path: '.env.local', quiet: true });

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
