import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// drizzle-kit runs outside Next, which is what loads .env.local everywhere else.
// Without this, `db:migrate` fails with "url: undefined" even though the
// variable is sitting in the file.
config({ path: '.env.local', quiet: true });

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
