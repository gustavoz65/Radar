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
  globalForDb.pool ??= mysql.createPool(process.env.DATABASE_URL);
  return globalForDb.pool;
}

export const db = drizzle(getPool(), { schema, mode: 'default' });
