import 'server-only';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { pool?: mysql.Pool };

function getPool(): mysql.Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set — copy .env.example to .env.local');
  }
  // Reused across hot reloads in dev so we do not leak connections.
  //
  // `timezone: 'Z'` makes mysql2 read and write DATETIME columns as UTC. Without
  // it the driver converts using the server's local offset, so a date stored as
  // UTC midnight comes back shifted — harmless here at UTC-3, but a date-only
  // value like a card's due date would land on the wrong day east of Greenwich.
  globalForDb.pool ??= mysql.createPool({ uri: process.env.DATABASE_URL, timezone: 'Z' });
  return globalForDb.pool;
}

export const db = drizzle(getPool(), { schema, mode: 'default' });
