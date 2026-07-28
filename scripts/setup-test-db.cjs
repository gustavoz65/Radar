/**
 * Creates the database the integration suites run against, grants the app user
 * access to it, and applies the migrations.
 *
 * The suites truncate every table they touch. Pointed at the development
 * database that means `npm test` silently deletes real synced accounts and
 * transactions — which is exactly what happened once. Tests get their own
 * schema, named after the dev one with a `_test` suffix, and `vitest.config.ts`
 * rewrites DATABASE_URL to match.
 *
 * Creating a database needs more privilege than the app user has, so this
 * connects as an admin. It defaults to the root credentials from
 * docker-compose.yml — deliberately committed local-only values — and honours
 * DATABASE_ADMIN_URL when MySQL lives somewhere else.
 *
 * Usage: npm run db:setup:test
 */
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local', quiet: true });

const COMPOSE_ROOT_PASSWORD = 'radar';

function testUrlFor(raw) {
  const url = new URL(raw);
  if (!url.pathname.endsWith('_test')) url.pathname = `${url.pathname}_test`;
  return url;
}

function adminUrlFor(target) {
  if (process.env.DATABASE_ADMIN_URL) return new URL(process.env.DATABASE_ADMIN_URL);

  const admin = new URL(target.toString());
  admin.username = 'root';
  admin.password = process.env.MYSQL_ROOT_PASSWORD || COMPOSE_ROOT_PASSWORD;
  admin.pathname = '/';
  return admin;
}

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set — copy .env.example to .env.local first.');
    process.exit(1);
  }

  const target = testUrlFor(process.env.DATABASE_URL);
  const name = target.pathname.slice(1);
  const appUser = decodeURIComponent(target.username);

  const conn = await mysql.createConnection(adminUrlFor(target).toString());
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\``);
  await conn.query(`GRANT ALL PRIVILEGES ON \`${name}\`.* TO '${appUser}'@'%'`);
  await conn.query('FLUSH PRIVILEGES');
  await conn.end();
  console.log(`test database ready: ${name} (granted to ${appUser})`);

  // drizzle-kit reads DATABASE_URL; dotenv does not override an existing value,
  // so setting it here wins over .env.local.
  // Run drizzle-kit's entry script with the current node binary. Going through
  // `npx` spawns a .cmd shim, which Node refuses with EINVAL on Windows; and
  // require.resolve cannot reach bin.cjs because the package's exports map does
  // not list it.
  const drizzleKit = path.join(__dirname, '..', 'node_modules', 'drizzle-kit', 'bin.cjs');
  execFileSync(process.execPath, [drizzleKit, 'migrate'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: target.toString() },
  });
  console.log(`migrations applied to ${name}`);
})().catch((error) => {
  console.error('failed:', error.code || '', error.message);
  process.exit(1);
});
