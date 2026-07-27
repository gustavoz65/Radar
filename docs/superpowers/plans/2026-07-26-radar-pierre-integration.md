# Radar — Pierre Integration, Auth and Persistence (sub-project 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mocked account data with real Open Finance data from Pierre, add manual CRUD for investment positions, persist everything in MySQL, and put the whole app behind a single-user login.

**Architecture:** Next.js Route Handlers act as a backend-for-frontend so the Pierre API key never leaves the server. Data flows Pierre → validated DTO → domain mapper → MySQL, and the UI reads only from MySQL through the existing `lib/data/services.ts`, whose function signatures do not change. Auth.js guards every route. A user-triggered sync writes a new snapshot; there is no cron in this phase.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, MySQL 8 via Docker Compose, Drizzle ORM (`drizzle-orm/mysql2`) + drizzle-kit, Auth.js v5 (credentials), Zod for boundary validation, Vitest.

## Global Constraints

- **Source of truth:** `docs/superpowers/specs/2026-07-26-radar-pierre-integration-design.md`. Do not add features it does not describe.
- **The product is read-only over the user's financial data.** No payment, transfer, or any write to a bank account, ever.
- **`lib/data/services.ts` remains the ONLY module UI components read data from.** Its exported function signatures must not change — only their bodies. No component may import a repository, the Drizzle client, or the Pierre client.
- **The Pierre API key lives only in a server-side env var.** It must never appear in a client component, a `NEXT_PUBLIC_*` var, a log line, an error message returned to the browser, or a commit.
- **Pierre API contract** (confirmed from `docs.pierre.finance`):
  - Base URL `https://pierre.finance/tools/api/`
  - Auth header `Authorization: Bearer sk-...`
  - `GET /get-accounts` → `{ success, data: [{ accountId, providerCode, accountName, accountType, accountSubtype, accountBalance, accountCurrencyCode, accountMarketingName }], count, timestamp }`
  - `GET /get-balance` → `{ success, data: { total_balance, accounts: [{ name, balance, account_type, account_subtype }] }, timestamp }` — **note the snake_case here versus camelCase in get-accounts; this inconsistency is real, do not "normalise" it away in the DTO layer**
  - `GET /get-transactions?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` → `{ success, data: [{ id, description, category, amount, date, type, status }], count, timestamp }`
  - `POST /manual-update` → `{ success, message, connectedAccounts, timestamp }`
  - **There is no investment-positions endpoint.** `accountType` may be `"INVESTMENT"`, but that is an account type, not a holdings list. Investment positions are entered manually by the user.
- **The exact response shapes above come from documentation, not from a live call** — no API key exists yet. Every Pierre response is therefore parsed through a Zod schema at the boundary so a contract mismatch fails loudly with the offending field named, instead of corrupting the database.
- **Amounts:** money is stored as `decimal(15,2)` in MySQL and handled as `number` in TypeScript. Never store money in a float column.
- **Dates:** stored as `datetime` (UTC). Formatting is only ever done by `lib/format/date.ts`.
- UI strings Portuguese (pt-BR); code identifiers, file names, commit messages and comments in English.
- Conventional Commits, small commits. Quality gate: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

---

## Prerequisite the human must do

**Docker Desktop must be running.** The CLI is installed (Docker 29.2.1, Compose v5.0.2) but the daemon was not reachable when this plan was written. Task 1 cannot complete without it. If `docker ps` fails, stop and report — do not try to install or start Docker yourself.

---

## File Structure

```
docker-compose.yml               # MySQL 8 service, named volume, port 3306
.env.example                     # documented placeholders, committed
.env.local                       # real values, gitignored, never committed
drizzle.config.ts                # drizzle-kit config
drizzle/                         # generated SQL migrations (committed)

auth.ts                          # Auth.js config; exports handlers, auth, signIn, signOut
middleware.ts                    # route protection
app/api/auth/[...nextauth]/route.ts
app/login/page.tsx               # outside (dashboard) — no shell, no nav

lib/db/
  client.ts                      # drizzle client over a mysql2 pool (server-only)
  schema.ts                      # all five tables
lib/repositories/
  accounts.ts                    # bank_account reads/writes
  positions.ts                   # investment_position CRUD + snapshots
  sync-log.ts                    # sync_log reads/writes
lib/pierre/
  client.ts                      # HTTP calls, key injection, error taxonomy
  dto.ts                         # Zod schemas for the four responses
  mappers.ts                     # Pierre DTO -> domain types (pure)
  institutions.ts                # providerCode -> Institution (name/initials/colour)

app/api/sync/route.ts            # POST: run a Pierre sync
app/api/positions/route.ts       # POST create
app/api/positions/[id]/route.ts  # PATCH update, DELETE remove

app/(dashboard)/posicoes/
  page.tsx  loading.tsx          # manual position CRUD screen
components/positions/
  position-form.tsx              # client: create/edit form
  positions-table.tsx            # list with edit/delete
components/sync/
  sync-button.tsx                # client: "Atualizar agora"
  sync-status.tsx                # last successful sync + failure warning

lib/data/services.ts             # MODIFIED: bodies now read the DB
lib/data/fixtures/               # signals + news + rates stay; accounts/positions removed

tests/pierre/dto.test.ts
tests/pierre/mappers.test.ts
tests/pierre/client.test.ts
tests/repositories/positions.test.ts     # integration, needs MySQL
tests/repositories/accounts.test.ts      # integration, needs MySQL
tests/api/sync.test.ts                   # sync orchestration, Pierre mocked
tests/data/services.test.ts              # MODIFIED
```

**Task order rationale:** infrastructure (1) → auth gate (2) → the pure Pierre layer, fully testable with no DB and no key (3, 4) → persistence (5) → orchestration (6) → the service-layer swap that makes the UI real (7) → the manual-position UI (8) → the sync UI (9) → closing pass (10).

---

### Task 1: MySQL via Docker Compose, Drizzle client and schema

**Files:**

- Create: `docker-compose.yml`, `.env.example`, `drizzle.config.ts`, `lib/db/client.ts`, `lib/db/schema.ts`
- Modify: `package.json` (deps + db scripts), `.gitignore`
- Test: `tests/db/schema.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `db` — the Drizzle client, from `@/lib/db/client`
  - Table objects from `@/lib/db/schema`: `bankAccounts`, `bankTransactions`, `investmentPositions`, `positionSnapshots`, `syncLogs`
  - npm scripts `db:generate`, `db:migrate`, `db:push`, `db:studio`
  - env vars `DATABASE_URL`, `PIERRE_API_KEY`, `AUTH_SECRET`, `AUTH_USER_EMAIL`, `AUTH_USER_PASSWORD_HASH`

Note on the schema: the spec lists four tables. This plan adds a fifth, `position_snapshots`, because the spec also requires "histórico de snapshots" and `PortfolioSummary.history` needs a real time series — a manually-entered position has no history otherwise. Portfolio-level history is derived by grouping snapshots by `capturedAt`, so there is no separate portfolio table.

- [ ] **Step 1: Install dependencies**

```bash
npm install drizzle-orm mysql2 zod
npm install -D drizzle-kit
```

- [ ] **Step 2: Add db scripts to `package.json`**

Merge into the existing `"scripts"` object, keeping everything already there:

```json
{
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio"
}
```

- [ ] **Step 3: Create `docker-compose.yml`**

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: radar-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: radar
      MYSQL_DATABASE: radar
      MYSQL_USER: radar
      MYSQL_PASSWORD: radar
    ports:
      # Loopback only. A bare '3306:3306' binds 0.0.0.0, which would expose a
      # database with a well-known password to every network the host joins.
      - '127.0.0.1:3306:3306'
    volumes:
      - radar-mysql-data:/var/lib/mysql
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-uroot', '-pradar']
      interval: 5s
      timeout: 5s
      retries: 20

volumes:
  radar-mysql-data:
```

These are local development credentials for a container bound to the loopback interface only — note the `127.0.0.1:` prefix on the port mapping, which is what actually makes that true. They are deliberately committed so `docker compose up` works with no setup. Production hosting is explicitly out of scope for this spec.

- [ ] **Step 4: Create `.env.example` and extend `.gitignore`**

`.env.example` (committed):

```bash
# MySQL — matches docker-compose.yml
DATABASE_URL="mysql://radar:radar@localhost:3306/radar"

# Pierre API key from https://pierre.finance/api-key — format sk-...
# NEVER commit the real value.
PIERRE_API_KEY=""

# Auth.js — generate with: npx auth secret
AUTH_SECRET=""

# The single permitted user.
AUTH_USER_EMAIL=""
# bcrypt hash of the password, NOT the password itself.
AUTH_USER_PASSWORD_HASH=""
```

`.gitignore` already ignores `.env` and `.env.*` with a `!.env.example` exception — verify that is still true and change nothing if so.

- [ ] **Step 5: Create `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

If drizzle-kit rejects `dialect: 'mysql'`, check the installed version's config shape with `npx drizzle-kit --help` before changing anything — do not silently fall back to the deprecated `driver: 'mysql2'` form without saying so in your report.

- [ ] **Step 6: Create `lib/db/schema.ts`**

```ts
import {
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';

/** Bank accounts mirrored from Pierre. Never written to by the user. */
export const bankAccounts = mysqlTable(
  'bank_account',
  {
    id: int('id').primaryKey().autoincrement(),
    /** Pierre's accountId — the sync upsert key. */
    externalId: varchar('external_id', { length: 128 }).notNull(),
    /** Pierre's providerCode, e.g. "NUBANK". */
    providerCode: varchar('provider_code', { length: 64 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: mysqlEnum('type', ['corrente', 'poupanca', 'investimento']).notNull(),
    balance: decimal('balance', { precision: 15, scale: 2 }).notNull(),
    currencyCode: varchar('currency_code', { length: 8 }).notNull().default('BRL'),
    lastSyncedAt: datetime('last_synced_at').notNull(),
  },
  (table) => [uniqueIndex('bank_account_external_id_idx').on(table.externalId)],
);

/** Transactions mirrored from Pierre. */
export const bankTransactions = mysqlTable(
  'bank_transaction',
  {
    id: int('id').primaryKey().autoincrement(),
    accountId: int('account_id'),
    /** Pierre's transaction id — the dedupe key. */
    externalId: varchar('external_id', { length: 128 }).notNull(),
    description: varchar('description', { length: 512 }).notNull(),
    category: varchar('category', { length: 128 }),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    occurredAt: datetime('occurred_at').notNull(),
  },
  (table) => [
    uniqueIndex('bank_transaction_external_id_idx').on(table.externalId),
    index('bank_transaction_occurred_at_idx').on(table.occurredAt),
  ],
);

/** Investment holdings. Entered by hand — Pierre exposes no positions endpoint. */
export const investmentPositions = mysqlTable('investment_position', {
  id: int('id').primaryKey().autoincrement(),
  assetClass: mysqlEnum('asset_class', ['rendaFixa', 'cripto', 'acoes']).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  /** Ticker for equities, symbol for crypto, null for fixed income. */
  ticker: varchar('ticker', { length: 32 }),
  institutionCode: varchar('institution_code', { length: 64 }),
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
  unitValue: decimal('unit_value', { precision: 15, scale: 2 }).notNull(),
  investedValue: decimal('invested_value', { precision: 15, scale: 2 }).notNull(),
  /** Fixed income only: the contracted rate label, e.g. "110% do CDI". */
  contractedRate: varchar('contracted_rate', { length: 128 }),
  maturityDate: datetime('maturity_date'),
  purchasedAt: datetime('purchased_at').notNull(),
  notes: text('notes'),
  updatedAt: datetime('updated_at').notNull(),
});

/** One row per position per sync — this is what builds the history charts. */
export const positionSnapshots = mysqlTable(
  'position_snapshot',
  {
    id: int('id').primaryKey().autoincrement(),
    positionId: int('position_id').notNull(),
    capturedAt: datetime('captured_at').notNull(),
    value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  },
  (table) => [index('position_snapshot_captured_at_idx').on(table.capturedAt)],
);

/** Audit trail for every sync attempt, successful or not. */
export const syncLogs = mysqlTable('sync_log', {
  id: int('id').primaryKey().autoincrement(),
  source: mysqlEnum('source', ['pierre']).notNull(),
  status: mysqlEnum('status', ['success', 'partial', 'error']).notNull(),
  startedAt: datetime('started_at').notNull(),
  finishedAt: datetime('finished_at'),
  /** Human-readable, safe to show the user. Must never contain the API key. */
  error: text('error'),
});
```

- [ ] **Step 7: Create `lib/db/client.ts`**

```ts
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
```

Install `server-only` if it is not already present: `npm install server-only`. Its whole job is to make the build fail if a client component ever imports this file.

- [ ] **Step 8: Start MySQL and generate the migration**

```bash
docker compose up -d
docker compose ps
cp .env.example .env.local
```

Then set `DATABASE_URL` in `.env.local` to the value from `.env.example` and run:

```bash
npm run db:generate
npm run db:migrate
```

Expected: a SQL file appears under `drizzle/`, and migrate reports the five tables created. If `docker compose up` fails because the daemon is not running, STOP and report — that is the human's to fix.

- [ ] **Step 9: Write the schema smoke test**

`tests/db/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  bankAccounts,
  bankTransactions,
  investmentPositions,
  positionSnapshots,
  syncLogs,
} from '@/lib/db/schema';
import { getTableName } from 'drizzle-orm';

describe('schema', () => {
  it('names every table as the spec does', () => {
    expect(getTableName(bankAccounts)).toBe('bank_account');
    expect(getTableName(bankTransactions)).toBe('bank_transaction');
    expect(getTableName(investmentPositions)).toBe('investment_position');
    expect(getTableName(positionSnapshots)).toBe('position_snapshot');
    expect(getTableName(syncLogs)).toBe('sync_log');
  });

  it('stores money as decimal, never float', () => {
    expect(bankAccounts.balance.dataType).toBe('string');
    expect(investmentPositions.unitValue.dataType).toBe('string');
    expect(positionSnapshots.value.dataType).toBe('string');
  });
});
```

Drizzle returns `decimal` columns as strings to avoid float precision loss — that is why `dataType` is `'string'`. Every repository must therefore convert with `Number(...)` on read and pass strings on write. This test exists to pin that fact so nobody "fixes" it into a float later.

- [ ] **Step 10: Run the gate and commit**

```bash
npm test
npm run typecheck
npm run lint
git add -A
git commit -m "feat: add mysql via docker compose, drizzle schema and client"
```

---

### Task 2: Single-user authentication with Auth.js

**Files:**

- Create: `auth.ts`, `middleware.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/login/page.tsx`, `lib/auth/password.ts`
- Modify: `package.json`
- Test: `tests/auth/password.test.ts`

**Interfaces:**

- Consumes: the env vars from Task 1.
- Produces:
  - `auth`, `signIn`, `signOut`, `handlers` from `@/auth`
  - `verifyPassword(plain: string, hash: string): Promise<boolean>` and `hashPassword(plain: string): Promise<string>` from `@/lib/auth/password`
  - Every route except `/login` and `/api/auth/*` requires a session.

- [ ] **Step 1: Install**

```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

`next-auth@beta` is Auth.js v5, which is the version whose API this task uses.

- [ ] **Step 2: Write the failing password test**

`tests/auth/password.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('password hashing', () => {
  it('verifies a correct password against its hash', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('wrong password', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time for the same input', async () => {
    const a = await hashPassword('same input');
    const b = await hashPassword('same input');
    expect(a).not.toBe(b);
  });

  it('returns false for an empty or malformed hash instead of throwing', async () => {
    await expect(verifyPassword('anything', '')).resolves.toBe(false);
    await expect(verifyPassword('anything', 'not-a-bcrypt-hash')).resolves.toBe(false);
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
npm test -- tests/auth/password.test.ts
```

Expected: FAIL, cannot resolve `@/lib/auth/password`.

- [ ] **Step 4: Implement `lib/auth/password.ts`**

```ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Returns false rather than throwing on a malformed hash — a bad env var must not 500. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
```

- [ ] **Step 5: Run it and watch it pass**

```bash
npm test -- tests/auth/password.test.ts
```

Expected: 4/4 PASS.

- [ ] **Step 6: Create `auth.ts`**

```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/auth/password';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = typeof credentials?.email === 'string' ? credentials.email : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        const allowedEmail = process.env.AUTH_USER_EMAIL;
        const passwordHash = process.env.AUTH_USER_PASSWORD_HASH;
        if (!allowedEmail || !passwordHash) return null;

        // Single-user app: the email must match exactly and the password must verify.
        if (email.toLowerCase() !== allowedEmail.toLowerCase()) return null;
        if (!(await verifyPassword(password, passwordHash))) return null;

        return { id: 'radar-user', email: allowedEmail, name: 'Radar' };
      },
    }),
  ],
});
```

- [ ] **Step 7: Create the route handler and middleware**

`app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

`middleware.ts`:

```ts
export { auth as middleware } from '@/auth';

export const config = {
  // Everything except Next internals, static assets and the auth endpoints.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)'],
};
```

- [ ] **Step 8: Create `app/login/page.tsx`**

It sits outside `app/(dashboard)/`, so it renders without the nav shell.

```tsx
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { auth, signIn } from '@/auth';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/visao-geral');

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6">
        <div className="mb-6 flex items-center gap-2">
          <span className="size-2 rounded-full bg-gold" aria-hidden />
          <span className="font-mono text-sm tracking-widest text-text">RADAR</span>
        </div>
        <h1 className="mb-1 text-lg font-semibold text-text">Entrar</h1>
        <p className="mb-5 text-sm text-muted">Acesso restrito ao dono da conta.</p>

        <form
          className="space-y-4"
          action={async (formData: FormData) => {
            'use server';
            try {
              await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                redirectTo: '/visao-geral',
              });
            } catch (error) {
              if (error instanceof AuthError) redirect('/login?erro=1');
              throw error;
            }
          }}
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs uppercase tracking-wider text-muted">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs uppercase tracking-wider text-muted">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
```

The gold dot beside the wordmark is the same sanctioned exception used in the header — it is the brand mark, not a score.

- [ ] **Step 9: Generate a real secret and a password hash for `.env.local`**

```bash
npx auth secret
node -e "require('bcryptjs').hash(process.argv[1],12).then(h=>console.log(h))" "CHOOSE-A-PASSWORD"
```

Put the outputs in `AUTH_SECRET` and `AUTH_USER_PASSWORD_HASH`, and set `AUTH_USER_EMAIL`. **Do not print the chosen password into your report, and do not commit `.env.local`.**

- [ ] **Step 10: Verify the gate over HTTP**

Start `npm run dev`, then with `curl`:

- `curl -i http://localhost:3000/visao-geral` → expect a redirect to `/login` (302/307), not a 200.
- `curl -i http://localhost:3000/login` → expect 200 with the form markup.

Kill the dev server afterwards. Report the actual status codes.

- [ ] **Step 11: Run the gate and commit**

```bash
npm test && npm run typecheck && npm run lint && npm run build
git add -A
git commit -m "feat: add single-user authentication with auth.js"
```

---

### Task 3: Pierre response validation (DTO layer)

**Files:**

- Create: `lib/pierre/dto.ts`
- Test: `tests/pierre/dto.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces, from `@/lib/pierre/dto`:
  - `pierreAccountsResponse`, `pierreBalanceResponse`, `pierreTransactionsResponse`, `pierreManualUpdateResponse` — Zod schemas
  - `PierreAccount`, `PierreBalance`, `PierreTransaction` — inferred types
  - `parsePierre<T>(schema: z.ZodType<T>, payload: unknown, endpoint: string): T` — parses or throws a `PierreContractError` naming the endpoint and the failing field path

This is TDD and it is the most important defensive layer in the sub-project: the shapes below are transcribed from documentation, never verified against a live call. When the real key arrives, a mismatch must produce one clear error, not silent bad data.

- [ ] **Step 1: Write the failing tests**

`tests/pierre/dto.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  PierreContractError,
  parsePierre,
  pierreAccountsResponse,
  pierreBalanceResponse,
  pierreManualUpdateResponse,
  pierreTransactionsResponse,
} from '@/lib/pierre/dto';

const accountsPayload = {
  success: true,
  data: [
    {
      accountId: 'acc_123456789',
      providerCode: 'NUBANK',
      accountName: 'Conta Corrente',
      accountType: 'BANK',
      accountSubtype: 'CHECKING_ACCOUNT',
      accountBalance: 1500.5,
      accountCurrencyCode: 'BRL',
      accountMarketingName: 'Nubank Conta',
    },
  ],
  count: 1,
  timestamp: '2024-01-15T10:30:00Z',
};

describe('pierreAccountsResponse', () => {
  it('accepts the documented accounts payload', () => {
    const parsed = parsePierre(pierreAccountsResponse, accountsPayload, 'get-accounts');
    expect(parsed.data[0].accountId).toBe('acc_123456789');
    expect(parsed.data[0].accountBalance).toBe(1500.5);
  });

  it('tolerates unknown extra fields the docs did not mention', () => {
    const withExtra = {
      ...accountsPayload,
      data: [{ ...accountsPayload.data[0], somethingNew: 'x' }],
    };
    expect(() => parsePierre(pierreAccountsResponse, withExtra, 'get-accounts')).not.toThrow();
  });

  it('tolerates a missing accountMarketingName', () => {
    const account = { ...accountsPayload.data[0] };
    delete (account as Record<string, unknown>).accountMarketingName;
    const payload = { ...accountsPayload, data: [account] };
    expect(() => parsePierre(pierreAccountsResponse, payload, 'get-accounts')).not.toThrow();
  });

  it('throws a PierreContractError naming the endpoint and field when accountId is missing', () => {
    const account = { ...accountsPayload.data[0] };
    delete (account as Record<string, unknown>).accountId;
    const payload = { ...accountsPayload, data: [account] };

    try {
      parsePierre(pierreAccountsResponse, payload, 'get-accounts');
      throw new Error('expected parsePierre to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(PierreContractError);
      expect((error as PierreContractError).message).toContain('get-accounts');
      expect((error as PierreContractError).message).toContain('accountId');
    }
  });

  it('throws when the balance is a string instead of a number', () => {
    const payload = {
      ...accountsPayload,
      data: [{ ...accountsPayload.data[0], accountBalance: '1500.50' }],
    };
    expect(() => parsePierre(pierreAccountsResponse, payload, 'get-accounts')).toThrow(
      PierreContractError,
    );
  });
});

describe('pierreBalanceResponse', () => {
  it('accepts the documented snake_case balance payload', () => {
    const parsed = parsePierre(
      pierreBalanceResponse,
      {
        success: true,
        data: {
          total_balance: 2500.75,
          accounts: [
            {
              name: 'Conta Corrente',
              balance: 1500.5,
              account_type: 'BANK',
              account_subtype: 'CHECKING_ACCOUNT',
            },
          ],
        },
        timestamp: '2024-01-15T10:30:00Z',
      },
      'get-balance',
    );
    expect(parsed.data.total_balance).toBe(2500.75);
    expect(parsed.data.accounts[0].account_subtype).toBe('CHECKING_ACCOUNT');
  });
});

describe('pierreTransactionsResponse', () => {
  it('accepts the documented transactions payload', () => {
    const parsed = parsePierre(
      pierreTransactionsResponse,
      {
        success: true,
        data: [
          {
            id: 'txn_123456789',
            description: 'Pagamento de conta',
            category: 'Contas',
            amount: -150,
            date: '2024-01-15',
            type: 'DEBIT',
            status: 'POSTED',
          },
        ],
        count: 1,
        timestamp: '2024-01-15T10:30:00Z',
      },
      'get-transactions',
    );
    expect(parsed.data[0].amount).toBe(-150);
  });

  it('accepts an empty transaction list', () => {
    const parsed = parsePierre(
      pierreTransactionsResponse,
      { success: true, data: [], count: 0, timestamp: '2024-01-15T10:30:00Z' },
      'get-transactions',
    );
    expect(parsed.data).toHaveLength(0);
  });

  it('tolerates a null category', () => {
    const parsed = parsePierre(
      pierreTransactionsResponse,
      {
        success: true,
        data: [
          {
            id: 'txn_1',
            description: 'x',
            category: null,
            amount: 1,
            date: '2024-01-15',
            type: 'CREDIT',
            status: 'POSTED',
          },
        ],
        count: 1,
        timestamp: '2024-01-15T10:30:00Z',
      },
      'get-transactions',
    );
    expect(parsed.data[0].category).toBeNull();
  });
});

describe('pierreManualUpdateResponse', () => {
  it('accepts the documented manual update payload', () => {
    const parsed = parsePierre(
      pierreManualUpdateResponse,
      {
        success: true,
        message: 'Manual sync initiated',
        connectedAccounts: 3,
        timestamp: '2024-01-15T10:30:00Z',
      },
      'manual-update',
    );
    expect(parsed.connectedAccounts).toBe(3);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
npm test -- tests/pierre/dto.test.ts
```

Expected: FAIL, cannot resolve `@/lib/pierre/dto`.

- [ ] **Step 3: Implement `lib/pierre/dto.ts`**

```ts
import { z } from 'zod';

/**
 * Thrown when Pierre's response does not match the documented contract.
 * These schemas were transcribed from docs.pierre.finance, never verified
 * against a live call — this error is how a contract drift announces itself.
 */
export class PierreContractError extends Error {
  constructor(
    readonly endpoint: string,
    readonly issues: string,
  ) {
    super(`Pierre ${endpoint} returned an unexpected shape: ${issues}`);
    this.name = 'PierreContractError';
  }
}

/** Unknown extra fields are allowed everywhere — Pierre may add fields without notice. */
const pierreAccount = z.object({
  accountId: z.string(),
  providerCode: z.string(),
  accountName: z.string(),
  accountType: z.string(),
  accountSubtype: z.string().nullish(),
  accountBalance: z.number(),
  accountCurrencyCode: z.string().nullish(),
  accountMarketingName: z.string().nullish(),
});

export const pierreAccountsResponse = z.object({
  success: z.boolean(),
  data: z.array(pierreAccount),
  count: z.number().nullish(),
  timestamp: z.string().nullish(),
});

/** get-balance uses snake_case while get-accounts uses camelCase. This is Pierre's, not ours. */
const pierreBalanceAccount = z.object({
  name: z.string(),
  balance: z.number(),
  account_type: z.string(),
  account_subtype: z.string().nullish(),
});

export const pierreBalanceResponse = z.object({
  success: z.boolean(),
  data: z.object({
    total_balance: z.number(),
    accounts: z.array(pierreBalanceAccount),
  }),
  timestamp: z.string().nullish(),
});

const pierreTransaction = z.object({
  id: z.string(),
  description: z.string(),
  category: z.string().nullish(),
  amount: z.number(),
  date: z.string(),
  type: z.string().nullish(),
  status: z.string().nullish(),
});

export const pierreTransactionsResponse = z.object({
  success: z.boolean(),
  data: z.array(pierreTransaction),
  count: z.number().nullish(),
  timestamp: z.string().nullish(),
});

export const pierreManualUpdateResponse = z.object({
  success: z.boolean(),
  message: z.string().nullish(),
  connectedAccounts: z.number().nullish(),
  timestamp: z.string().nullish(),
});

export type PierreAccount = z.infer<typeof pierreAccount>;
export type PierreBalance = z.infer<typeof pierreBalanceResponse>['data'];
export type PierreTransaction = z.infer<typeof pierreTransaction>;

export function parsePierre<T>(schema: z.ZodType<T>, payload: unknown, endpoint: string): T {
  const result = schema.safeParse(payload);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
  throw new PierreContractError(endpoint, issues);
}
```

- [ ] **Step 4: Run and watch it pass**

```bash
npm test -- tests/pierre/dto.test.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pierre/dto.ts tests/pierre/dto.test.ts
git commit -m "feat: add zod validation for the pierre api contract"
```

---

### Task 4: Pierre → domain mappers

**Files:**

- Create: `lib/pierre/institutions.ts`, `lib/pierre/mappers.ts`
- Test: `tests/pierre/mappers.test.ts`

**Interfaces:**

- Consumes: `PierreAccount`, `PierreTransaction` (Task 3); `Account`, `Institution` from `@/lib/types`.
- Produces, from `@/lib/pierre/mappers`:
  - `mapAccountType(accountType: string, accountSubtype?: string | null): 'corrente' | 'poupanca' | 'investimento'`
  - `mapPierreAccount(account: PierreAccount, syncedAt: Date): NewBankAccount` where `NewBankAccount = { externalId, providerCode, name, type, balance, currencyCode, lastSyncedAt }` with `balance` a `number`
  - `mapPierreTransaction(tx: PierreTransaction): NewBankTransaction` where `NewBankTransaction = { externalId, description, category, amount, occurredAt }`
- Produces, from `@/lib/pierre/institutions`:
  - `institutionForProviderCode(code: string): Institution` — always returns an Institution, falling back to a generated one for unknown codes

The frontend already ships `lib/data/fixtures/institutions.ts` with the four known institutions and their colours. That file's data moves here and becomes the real mapping; the fixture is deleted in Task 7.

- [ ] **Step 1: Write the failing tests**

`tests/pierre/mappers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { institutionForProviderCode } from '@/lib/pierre/institutions';
import { mapAccountType, mapPierreAccount, mapPierreTransaction } from '@/lib/pierre/mappers';

describe('institutionForProviderCode', () => {
  it('maps the four known providers to their branded badge', () => {
    expect(institutionForProviderCode('NUBANK').name).toBe('Nubank');
    expect(institutionForProviderCode('BANCO_DO_BRASIL').name).toBe('Banco do Brasil');
    expect(institutionForProviderCode('SICREDI').name).toBe('Sicredi');
    expect(institutionForProviderCode('MERCADO_PAGO').name).toBe('Mercado Pago');
  });

  it('is case-insensitive about the provider code', () => {
    expect(institutionForProviderCode('nubank').id).toBe('nubank');
  });

  it('always returns two-character initials', () => {
    for (const code of ['NUBANK', 'BANCO_DO_BRASIL', 'SICREDI', 'MERCADO_PAGO', 'WHATEVER_BANK']) {
      expect(institutionForProviderCode(code).initials).toHaveLength(2);
    }
  });

  it('falls back to a generated badge for an unknown provider rather than throwing', () => {
    const unknown = institutionForProviderCode('BANCO_INEXISTENTE');
    expect(unknown.name).toBe('Banco Inexistente');
    expect(unknown.initials).toBe('BI');
    expect(unknown.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('handles a single-word unknown provider', () => {
    const unknown = institutionForProviderCode('XPTO');
    expect(unknown.initials).toHaveLength(2);
  });
});

describe('mapAccountType', () => {
  it('maps a checking account', () => {
    expect(mapAccountType('BANK', 'CHECKING_ACCOUNT')).toBe('corrente');
  });

  it('maps a savings account', () => {
    expect(mapAccountType('BANK', 'SAVINGS_ACCOUNT')).toBe('poupanca');
  });

  it('maps an investment account', () => {
    expect(mapAccountType('INVESTMENT', null)).toBe('investimento');
  });

  it('defaults an unrecognised bank subtype to corrente', () => {
    expect(mapAccountType('BANK', 'SOMETHING_NEW')).toBe('corrente');
  });

  it('defaults an entirely unrecognised type to corrente', () => {
    expect(mapAccountType('MYSTERY', null)).toBe('corrente');
  });
});

describe('mapPierreAccount', () => {
  const syncedAt = new Date('2026-07-26T12:00:00.000Z');

  it('maps the documented account shape onto the persistence shape', () => {
    const mapped = mapPierreAccount(
      {
        accountId: 'acc_123456789',
        providerCode: 'NUBANK',
        accountName: 'Conta Corrente',
        accountType: 'BANK',
        accountSubtype: 'CHECKING_ACCOUNT',
        accountBalance: 1500.5,
        accountCurrencyCode: 'BRL',
        accountMarketingName: 'Nubank Conta',
      },
      syncedAt,
    );

    expect(mapped).toEqual({
      externalId: 'acc_123456789',
      providerCode: 'NUBANK',
      name: 'Nubank Conta',
      type: 'corrente',
      balance: 1500.5,
      currencyCode: 'BRL',
      lastSyncedAt: syncedAt,
    });
  });

  it('falls back to accountName when the marketing name is absent', () => {
    const mapped = mapPierreAccount(
      {
        accountId: 'acc_2',
        providerCode: 'SICREDI',
        accountName: 'Poupança',
        accountType: 'BANK',
        accountSubtype: 'SAVINGS_ACCOUNT',
        accountBalance: 10,
        accountCurrencyCode: null,
        accountMarketingName: null,
      },
      syncedAt,
    );
    expect(mapped.name).toBe('Poupança');
    expect(mapped.type).toBe('poupanca');
  });

  it('defaults the currency to BRL when Pierre omits it', () => {
    const mapped = mapPierreAccount(
      {
        accountId: 'acc_3',
        providerCode: 'NUBANK',
        accountName: 'x',
        accountType: 'BANK',
        accountSubtype: null,
        accountBalance: 0,
        accountCurrencyCode: null,
        accountMarketingName: null,
      },
      syncedAt,
    );
    expect(mapped.currencyCode).toBe('BRL');
  });
});

describe('mapPierreTransaction', () => {
  it('maps a debit, preserving the sign', () => {
    const mapped = mapPierreTransaction({
      id: 'txn_123456789',
      description: 'Pagamento de conta',
      category: 'Contas',
      amount: -150,
      date: '2024-01-15',
      type: 'DEBIT',
      status: 'POSTED',
    });

    expect(mapped.externalId).toBe('txn_123456789');
    expect(mapped.amount).toBe(-150);
    expect(mapped.category).toBe('Contas');
    expect(mapped.occurredAt.toISOString()).toBe('2024-01-15T00:00:00.000Z');
  });

  it('turns a null category into null, not the string "null"', () => {
    const mapped = mapPierreTransaction({
      id: 'txn_2',
      description: 'x',
      category: null,
      amount: 1,
      date: '2024-01-15',
      type: 'CREDIT',
      status: 'POSTED',
    });
    expect(mapped.category).toBeNull();
  });

  it('parses a date-only string as UTC midnight, not local midnight', () => {
    const mapped = mapPierreTransaction({
      id: 'txn_3',
      description: 'x',
      category: null,
      amount: 1,
      date: '2024-12-31',
      type: 'CREDIT',
      status: 'POSTED',
    });
    expect(mapped.occurredAt.toISOString()).toBe('2024-12-31T00:00:00.000Z');
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
npm test -- tests/pierre/mappers.test.ts
```

Expected: FAIL, cannot resolve the two modules.

- [ ] **Step 3: Implement `lib/pierre/institutions.ts`**

```ts
import type { Institution } from '@/lib/types';

/**
 * Pierre identifies banks by providerCode. These four are the user's connected
 * institutions; the colours match the badges the frontend already used.
 * No official logos — an initials badge is the whole visual identity.
 */
const known: Record<string, Institution> = {
  BANCO_DO_BRASIL: { id: 'bb', name: 'Banco do Brasil', initials: 'BB', color: '#f5c518' },
  NUBANK: { id: 'nubank', name: 'Nubank', initials: 'NU', color: '#820ad1' },
  SICREDI: { id: 'sicredi', name: 'Sicredi', initials: 'SI', color: '#3fa110' },
  MERCADO_PAGO: { id: 'mercadopago', name: 'Mercado Pago', initials: 'MP', color: '#00a1e0' },
};

const FALLBACK_COLOR = '#4b5563';

function titleCase(code: string): string {
  return code
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function initialsFor(code: string): string {
  const words = code.split('_').filter(Boolean);
  const letters =
    words.length >= 2 ? `${words[0][0]}${words[1][0]}` : (words[0] ?? 'XX').slice(0, 2);
  return letters.toUpperCase().padEnd(2, 'X').slice(0, 2);
}

/** Never throws: an unknown provider still gets a usable badge. */
export function institutionForProviderCode(code: string): Institution {
  const normalized = code.trim().toUpperCase();
  const match = known[normalized];
  if (match) return match;

  return {
    id: normalized.toLowerCase(),
    name: titleCase(normalized),
    initials: initialsFor(normalized),
    color: FALLBACK_COLOR,
  };
}
```

- [ ] **Step 4: Implement `lib/pierre/mappers.ts`**

```ts
import type { PierreAccount, PierreTransaction } from './dto';

export type BankAccountType = 'corrente' | 'poupanca' | 'investimento';

export interface NewBankAccount {
  externalId: string;
  providerCode: string;
  name: string;
  type: BankAccountType;
  balance: number;
  currencyCode: string;
  lastSyncedAt: Date;
}

export interface NewBankTransaction {
  externalId: string;
  description: string;
  category: string | null;
  amount: number;
  occurredAt: Date;
}

/** Pierre's type vocabulary is open-ended; anything unrecognised is treated as a current account. */
export function mapAccountType(
  accountType: string,
  accountSubtype?: string | null,
): BankAccountType {
  if (accountType.toUpperCase() === 'INVESTMENT') return 'investimento';
  if ((accountSubtype ?? '').toUpperCase() === 'SAVINGS_ACCOUNT') return 'poupanca';
  return 'corrente';
}

export function mapPierreAccount(account: PierreAccount, syncedAt: Date): NewBankAccount {
  return {
    externalId: account.accountId,
    providerCode: account.providerCode,
    // `||` not `??`: Pierre may send an empty string, and an account with a
    // blank name is worse than falling back to the plain accountName.
    name: account.accountMarketingName || account.accountName,
    type: mapAccountType(account.accountType, account.accountSubtype),
    balance: account.accountBalance,
    currencyCode: account.accountCurrencyCode ?? 'BRL',
    lastSyncedAt: syncedAt,
  };
}

export function mapPierreTransaction(tx: PierreTransaction): NewBankTransaction {
  // Pierre sends date-only strings; anchor them at UTC midnight so the stored
  // day never shifts with the server's timezone.
  const occurredAt = new Date(tx.date.includes('T') ? tx.date : `${tx.date}T00:00:00.000Z`);

  return {
    externalId: tx.id,
    description: tx.description,
    category: tx.category ?? null,
    amount: tx.amount,
    occurredAt,
  };
}
```

- [ ] **Step 5: Run and watch it pass**

```bash
npm test -- tests/pierre/mappers.test.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/pierre tests/pierre
git commit -m "feat: map pierre accounts and transactions onto domain types"
```

---

### Task 5: Pierre HTTP client

**Files:**

- Create: `lib/pierre/client.ts`
- Test: `tests/pierre/client.test.ts`

**Interfaces:**

- Consumes: the DTO schemas and `parsePierre` (Task 3).
- Produces, from `@/lib/pierre/client`:
  - `PierreAuthError`, `PierreHttpError`, `PierreNetworkError` — error classes
  - `getAccounts(): Promise<PierreAccount[]>`
  - `getBalance(): Promise<PierreBalance>`
  - `getTransactions(range: { startDate?: string; endDate?: string }): Promise<PierreTransaction[]>`
  - `manualUpdate(): Promise<{ connectedAccounts: number | null }>`

All four read `PIERRE_API_KEY` from the environment at call time (not module load, so tests can set it). Tests inject a fake `fetch` — no network call is ever made in the suite.

- [ ] **Step 1: Write the failing tests**

`tests/pierre/client.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PierreAuthError,
  PierreHttpError,
  PierreNetworkError,
  getAccounts,
  getTransactions,
  manualUpdate,
} from '@/lib/pierre/client';
import { PierreContractError } from '@/lib/pierre/dto';

const ACCOUNTS_OK = {
  success: true,
  data: [
    {
      accountId: 'acc_1',
      providerCode: 'NUBANK',
      accountName: 'Conta',
      accountType: 'BANK',
      accountSubtype: 'CHECKING_ACCOUNT',
      accountBalance: 100,
      accountCurrencyCode: 'BRL',
      accountMarketingName: 'Nubank Conta',
    },
  ],
  count: 1,
  timestamp: '2026-07-26T10:00:00Z',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.PIERRE_API_KEY = 'sk-test-key';
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.PIERRE_API_KEY;
});

describe('getAccounts', () => {
  it('calls the documented URL with a bearer token', async () => {
    fetchMock.mockResolvedValue(jsonResponse(ACCOUNTS_OK));

    await getAccounts();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://pierre.finance/tools/api/get-accounts');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer sk-test-key');
  });

  it('returns the parsed account list', async () => {
    fetchMock.mockResolvedValue(jsonResponse(ACCOUNTS_OK));
    const accounts = await getAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].accountId).toBe('acc_1');
  });

  it('throws PierreAuthError on 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'unauthorized' }, 401));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreAuthError);
  });

  it('throws PierreAuthError on 403', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'forbidden' }, 403));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreAuthError);
  });

  it('throws PierreHttpError on 500', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'boom' }, 500));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreHttpError);
  });

  it('throws PierreNetworkError when fetch itself rejects', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreNetworkError);
  });

  it('throws PierreContractError when the payload does not match the contract', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: [{ nope: 1 }] }));
    await expect(getAccounts()).rejects.toBeInstanceOf(PierreContractError);
  });

  it('throws when the API key is missing', async () => {
    delete process.env.PIERRE_API_KEY;
    await expect(getAccounts()).rejects.toThrow(/PIERRE_API_KEY/);
  });

  it('never puts the api key in an error message', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'unauthorized' }, 401));
    await expect(getAccounts()).rejects.toSatisfy(
      (error: Error) => !error.message.includes('sk-test-key'),
    );
  });
});

describe('getTransactions', () => {
  it('passes the date range as query parameters', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: [], count: 0, timestamp: 'x' }),
    );

    await getTransactions({ startDate: '2026-07-01', endDate: '2026-07-26' });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('https://pierre.finance/tools/api/get-transactions?');
    expect(url).toContain('startDate=2026-07-01');
    expect(url).toContain('endDate=2026-07-26');
  });

  it('omits the query string entirely when no range is given', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, data: [], count: 0, timestamp: 'x' }),
    );

    await getTransactions({});

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://pierre.finance/tools/api/get-transactions');
  });
});

describe('manualUpdate', () => {
  it('POSTs and returns the connected account count', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        message: 'Manual sync initiated',
        connectedAccounts: 3,
        timestamp: 'x',
      }),
    );

    const result = await manualUpdate();

    expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    expect(result.connectedAccounts).toBe(3);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
npm test -- tests/pierre/client.test.ts
```

Expected: FAIL, cannot resolve `@/lib/pierre/client`.

- [ ] **Step 3: Implement `lib/pierre/client.ts`**

```ts
import 'server-only';
import {
  type PierreAccount,
  type PierreBalance,
  type PierreTransaction,
  PierreContractError,
  parsePierre,
  pierreAccountsResponse,
  pierreBalanceResponse,
  pierreManualUpdateResponse,
  pierreTransactionsResponse,
} from './dto';

const BASE_URL = 'https://pierre.finance/tools/api';

/** The API key is rejected or expired. The user must generate a new one. */
export class PierreAuthError extends Error {
  constructor() {
    super('Pierre rejeitou a chave de API. Gere uma nova em pierre.finance/api-key.');
    this.name = 'PierreAuthError';
  }
}

/** Pierre answered, but with an error status. */
export class PierreHttpError extends Error {
  constructor(readonly status: number) {
    super(`Pierre respondeu com status ${status}.`);
    this.name = 'PierreHttpError';
  }
}

/** The request never reached Pierre. */
export class PierreNetworkError extends Error {
  constructor() {
    super('Não foi possível alcançar a Pierre. Verifique a conexão.');
    this.name = 'PierreNetworkError';
  }
}

function apiKey(): string {
  const key = process.env.PIERRE_API_KEY;
  if (!key) {
    throw new Error('PIERRE_API_KEY is not set — add it to .env.local');
  }
  return key;
}

/**
 * Every Pierre call goes through here. Error messages are deliberately built
 * from the status alone: the key must never reach a log line or the browser.
 */
async function request(path: string, method: 'GET' | 'POST'): Promise<unknown> {
  const key = apiKey();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    throw new PierreNetworkError();
  }

  if (response.status === 401 || response.status === 403) throw new PierreAuthError();
  if (!response.ok) throw new PierreHttpError(response.status);

  // A 2xx whose body will not parse is still Pierre answering wrongly. Keep it
  // inside the taxonomy — the sync orchestrator routes on these classes, and a
  // raw SyntaxError escaping here would bypass that routing entirely.
  try {
    return await response.json();
  } catch {
    throw new PierreContractError(path, 'a resposta não é JSON válido');
  }
}

export async function getAccounts(): Promise<PierreAccount[]> {
  const payload = await request('get-accounts', 'GET');
  return parsePierre(pierreAccountsResponse, payload, 'get-accounts').data;
}

export async function getBalance(): Promise<PierreBalance> {
  const payload = await request('get-balance', 'GET');
  return parsePierre(pierreBalanceResponse, payload, 'get-balance').data;
}

export async function getTransactions(range: {
  startDate?: string;
  endDate?: string;
}): Promise<PierreTransaction[]> {
  const params = new URLSearchParams();
  if (range.startDate) params.set('startDate', range.startDate);
  if (range.endDate) params.set('endDate', range.endDate);

  const query = params.toString();
  const payload = await request(`get-transactions${query ? `?${query}` : ''}`, 'GET');
  return parsePierre(pierreTransactionsResponse, payload, 'get-transactions').data;
}

export async function manualUpdate(): Promise<{ connectedAccounts: number | null }> {
  const payload = await request('manual-update', 'POST');
  const parsed = parsePierre(pierreManualUpdateResponse, payload, 'manual-update');
  return { connectedAccounts: parsed.connectedAccounts ?? null };
}
```

`server-only` will make the test import fail unless Vitest can resolve it. If that happens, add an alias in `vitest.config.ts` mapping `server-only` to an empty module:

```ts
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./', import.meta.url)),
    'server-only': fileURLToPath(new URL('./tests/stubs/server-only.ts', import.meta.url)),
  },
},
```

with `tests/stubs/server-only.ts` containing `export {};`.

- [ ] **Step 4: Run and watch it pass**

```bash
npm test -- tests/pierre/client.test.ts
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/pierre/client.ts tests/pierre vitest.config.ts tests/stubs
git commit -m "feat: add the pierre http client with a typed error taxonomy"
```

---

### Task 6: Repositories

**Files:**

- Create: `lib/repositories/accounts.ts`, `lib/repositories/positions.ts`, `lib/repositories/sync-log.ts`
- Test: `tests/repositories/accounts.test.ts`, `tests/repositories/positions.test.ts`

**Interfaces:**

- Consumes: `db` and the tables (Task 1); `NewBankAccount`, `NewBankTransaction` (Task 4).
- Produces:
  - From `@/lib/repositories/accounts`: `upsertAccounts(accounts: NewBankAccount[]): Promise<void>`, `insertTransactions(txs: NewBankTransaction[]): Promise<number>` (returns rows inserted, ignoring duplicates), `listAccounts(): Promise<Account[]>`
  - From `@/lib/repositories/positions`: `listPositions(): Promise<Position[]>`, `createPosition(input: PositionInput): Promise<number>`, `updatePosition(id: number, input: PositionInput): Promise<void>`, `deletePosition(id: number): Promise<void>`, `snapshotPositions(capturedAt: Date): Promise<void>`, `listPortfolioHistory(): Promise<TimeSeriesPoint[]>`
  - From `@/lib/repositories/sync-log`: `startSync(): Promise<number>`, `finishSync(id: number, status: 'success' | 'partial' | 'error', error?: string): Promise<void>`, `lastSuccessfulSync(): Promise<Date | null>`, `lastSync(): Promise<{ status: string; finishedAt: Date | null; error: string | null } | null>`
  - `PositionInput` — `{ assetClass: AssetClass; name: string; ticker?: string | null; institutionCode?: string | null; quantity: number; unitValue: number; investedValue: number; contractedRate?: string | null; maturityDate?: Date | null; purchasedAt: Date; notes?: string | null }`

**These are integration tests against the real MySQL from Task 1.** They connect, write, read back, and clean up after themselves. Guard the suite so it skips cleanly when `DATABASE_URL` is unset, so a contributor without Docker still gets a green unit suite:

```ts
const describeDb = process.env.DATABASE_URL ? describe : describe.skip;
```

Load `.env.local` in the test setup so `DATABASE_URL` is present. Add to `vitest.config.ts`:

```ts
import { config } from 'dotenv';
config({ path: '.env.local' });
```

after `npm install -D dotenv`.

- [ ] **Step 1: Write the failing accounts test**

`tests/repositories/accounts.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { bankAccounts, bankTransactions } from '@/lib/db/schema';
import { insertTransactions, listAccounts, upsertAccounts } from '@/lib/repositories/accounts';

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;
const syncedAt = new Date('2026-07-26T12:00:00.000Z');

describeDb('accounts repository', () => {
  beforeEach(async () => {
    await db.delete(bankTransactions);
    await db.delete(bankAccounts);
  });

  afterEach(async () => {
    await db.delete(bankTransactions);
    await db.delete(bankAccounts);
  });

  it('inserts new accounts', async () => {
    await upsertAccounts([
      {
        externalId: 'acc_1',
        providerCode: 'NUBANK',
        name: 'Nubank Conta',
        type: 'corrente',
        balance: 1500.5,
        currencyCode: 'BRL',
        lastSyncedAt: syncedAt,
      },
    ]);

    const accounts = await listAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].balance).toBe(1500.5);
  });

  it('updates the balance of an account it has already seen instead of duplicating it', async () => {
    const base = {
      externalId: 'acc_1',
      providerCode: 'NUBANK',
      name: 'Nubank Conta',
      type: 'corrente' as const,
      currencyCode: 'BRL',
      lastSyncedAt: syncedAt,
    };

    await upsertAccounts([{ ...base, balance: 100 }]);
    await upsertAccounts([{ ...base, balance: 250.75 }]);

    const accounts = await listAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].balance).toBe(250.75);
  });

  it('maps the provider code to an institution badge on read', async () => {
    await upsertAccounts([
      {
        externalId: 'acc_1',
        providerCode: 'NUBANK',
        name: 'Nubank Conta',
        type: 'corrente',
        balance: 1,
        currencyCode: 'BRL',
        lastSyncedAt: syncedAt,
      },
    ]);

    const [account] = await listAccounts();
    expect(account.institution.name).toBe('Nubank');
    expect(account.institution.initials).toBe('NU');
  });

  it('returns an empty array when there are no accounts', async () => {
    await expect(listAccounts()).resolves.toEqual([]);
  });

  it('inserts transactions and ignores ones it already has', async () => {
    const tx = {
      externalId: 'txn_1',
      description: 'Pagamento',
      category: 'Contas',
      amount: -150,
      occurredAt: new Date('2026-07-20T00:00:00.000Z'),
    };

    expect(await insertTransactions([tx])).toBe(1);
    expect(await insertTransactions([tx])).toBe(0);
  });

  it('inserts nothing and reports zero for an empty batch', async () => {
    expect(await insertTransactions([])).toBe(0);
  });
});
```

- [ ] **Step 2: Write the failing positions test**

`tests/repositories/positions.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { investmentPositions, positionSnapshots } from '@/lib/db/schema';
import {
  createPosition,
  deletePosition,
  listPortfolioHistory,
  listPositions,
  snapshotPositions,
  updatePosition,
} from '@/lib/repositories/positions';

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

const cdb = {
  assetClass: 'rendaFixa' as const,
  name: 'CDB Banco do Brasil 2028',
  institutionCode: 'BANCO_DO_BRASIL',
  quantity: 1,
  unitValue: 34120.45,
  investedValue: 30000,
  contractedRate: '110% do CDI',
  maturityDate: new Date('2028-03-15T00:00:00.000Z'),
  purchasedAt: new Date('2025-03-15T00:00:00.000Z'),
};

describeDb('positions repository', () => {
  beforeEach(async () => {
    await db.delete(positionSnapshots);
    await db.delete(investmentPositions);
  });

  afterEach(async () => {
    await db.delete(positionSnapshots);
    await db.delete(investmentPositions);
  });

  it('creates a fixed income position and reads it back as a domain Position', async () => {
    await createPosition(cdb);

    const positions = await listPositions();
    expect(positions).toHaveLength(1);
    const [position] = positions;
    expect(position.assetClass).toBe('rendaFixa');
    expect(position.name).toBe('CDB Banco do Brasil 2028');
    expect(position.currentValue).toBe(34120.45);
    expect(position.investedValue).toBe(30000);
  });

  it('computes currentValue as quantity times unitValue', async () => {
    await createPosition({
      assetClass: 'cripto',
      name: 'Bitcoin',
      ticker: 'BTC',
      quantity: 0.5,
      unitValue: 600000,
      investedValue: 250000,
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const [position] = await listPositions();
    expect(position.currentValue).toBe(300000);
  });

  it('updates a position in place', async () => {
    const id = await createPosition(cdb);
    await updatePosition(id, { ...cdb, unitValue: 35000 });

    const [position] = await listPositions();
    expect(position.currentValue).toBe(35000);
  });

  it('deletes a position', async () => {
    const id = await createPosition(cdb);
    await deletePosition(id);
    await expect(listPositions()).resolves.toEqual([]);
  });

  it('returns an empty array when there are no positions', async () => {
    await expect(listPositions()).resolves.toEqual([]);
  });

  it('records one snapshot per position and builds history from them', async () => {
    await createPosition(cdb);
    await snapshotPositions(new Date('2026-06-26T12:00:00.000Z'));
    await snapshotPositions(new Date('2026-07-26T12:00:00.000Z'));

    const history = await listPortfolioHistory();
    expect(history).toHaveLength(2);
    expect(history[0].date).toBe('2026-06-26');
    expect(history[1].date).toBe('2026-07-26');
    expect(history[1].value).toBe(34120.45);
  });

  it('sums every position into a single history point per capture', async () => {
    await createPosition(cdb);
    await createPosition({
      assetClass: 'acoes',
      name: 'Petrobras PN',
      ticker: 'PETR4',
      quantity: 100,
      unitValue: 40,
      investedValue: 3500,
      purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await snapshotPositions(new Date('2026-07-26T12:00:00.000Z'));

    const history = await listPortfolioHistory();
    expect(history).toHaveLength(1);
    expect(history[0].value).toBe(34120.45 + 4000);
  });

  it('returns an empty history when nothing has ever been snapshotted', async () => {
    await expect(listPortfolioHistory()).resolves.toEqual([]);
  });
});
```

- [ ] **Step 3: Run both and watch them fail**

```bash
npm test -- tests/repositories
```

Expected: FAIL, cannot resolve the repository modules. If instead they SKIP, `DATABASE_URL` is not reaching Vitest — fix the dotenv wiring before continuing, because a silently skipped suite proves nothing.

- [ ] **Step 4: Implement `lib/repositories/sync-log.ts`**

```ts
import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { syncLogs } from '@/lib/db/schema';

export async function startSync(): Promise<number> {
  const [result] = await db.insert(syncLogs).values({
    source: 'pierre',
    status: 'error', // pessimistic: only a successful finish flips this
    startedAt: new Date(),
  });
  return result.insertId;
}

export async function finishSync(
  id: number,
  status: 'success' | 'partial' | 'error',
  error?: string,
): Promise<void> {
  await db
    .update(syncLogs)
    .set({ status, finishedAt: new Date(), error: error ?? null })
    .where(eq(syncLogs.id, id));
}

export async function lastSuccessfulSync(): Promise<Date | null> {
  const [row] = await db
    .select({ finishedAt: syncLogs.finishedAt })
    .from(syncLogs)
    .where(eq(syncLogs.status, 'success'))
    .orderBy(desc(syncLogs.finishedAt))
    .limit(1);
  return row?.finishedAt ?? null;
}

export async function lastSync(): Promise<{
  status: string;
  finishedAt: Date | null;
  error: string | null;
} | null> {
  const [row] = await db
    .select({ status: syncLogs.status, finishedAt: syncLogs.finishedAt, error: syncLogs.error })
    .from(syncLogs)
    .orderBy(desc(syncLogs.id))
    .limit(1);
  return row ?? null;
}
```

- [ ] **Step 5: Implement `lib/repositories/accounts.ts`**

```ts
import 'server-only';
import { db } from '@/lib/db/client';
import { bankAccounts, bankTransactions } from '@/lib/db/schema';
import { institutionForProviderCode } from '@/lib/pierre/institutions';
import type { NewBankAccount, NewBankTransaction } from '@/lib/pierre/mappers';
import type { Account } from '@/lib/types';

/** Drizzle returns decimal columns as strings to protect precision. */
function toNumber(value: string): number {
  return Number(value);
}

export async function upsertAccounts(accounts: NewBankAccount[]): Promise<void> {
  if (accounts.length === 0) return;

  for (const account of accounts) {
    await db
      .insert(bankAccounts)
      .values({
        externalId: account.externalId,
        providerCode: account.providerCode,
        name: account.name,
        type: account.type,
        balance: account.balance.toFixed(2),
        currencyCode: account.currencyCode,
        lastSyncedAt: account.lastSyncedAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          providerCode: account.providerCode,
          name: account.name,
          type: account.type,
          balance: account.balance.toFixed(2),
          currencyCode: account.currencyCode,
          lastSyncedAt: account.lastSyncedAt,
        },
      });
  }
}

/** Returns the number of genuinely new rows; duplicates by externalId are ignored. */
export async function insertTransactions(txs: NewBankTransaction[]): Promise<number> {
  if (txs.length === 0) return 0;

  let inserted = 0;
  for (const tx of txs) {
    const [result] = await db
      .insert(bankTransactions)
      .values({
        externalId: tx.externalId,
        description: tx.description,
        category: tx.category,
        amount: tx.amount.toFixed(2),
        occurredAt: tx.occurredAt,
      })
      .onDuplicateKeyUpdate({ set: { externalId: tx.externalId } });
    // MySQL reports affectedRows 1 for an insert and 0 for a no-op duplicate update.
    if (result.affectedRows === 1) inserted += 1;
  }
  return inserted;
}

export async function listAccounts(): Promise<Account[]> {
  const rows = await db.select().from(bankAccounts).orderBy(bankAccounts.name);

  return rows.map((row) => ({
    id: String(row.id),
    institution: institutionForProviderCode(row.providerCode),
    type: row.type,
    balance: toNumber(row.balance),
    lastUpdated: row.lastSyncedAt.toISOString(),
  }));
}
```

- [ ] **Step 6: Implement `lib/repositories/positions.ts`**

```ts
import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { investmentPositions, positionSnapshots } from '@/lib/db/schema';
import type { AssetClass, Position, TimeSeriesPoint } from '@/lib/types';

export interface PositionInput {
  assetClass: AssetClass;
  name: string;
  ticker?: string | null;
  institutionCode?: string | null;
  quantity: number;
  unitValue: number;
  investedValue: number;
  contractedRate?: string | null;
  maturityDate?: Date | null;
  purchasedAt: Date;
  notes?: string | null;
}

function toNumber(value: string): number {
  return Number(value);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function createPosition(input: PositionInput): Promise<number> {
  const [result] = await db.insert(investmentPositions).values({
    assetClass: input.assetClass,
    name: input.name,
    ticker: input.ticker ?? null,
    institutionCode: input.institutionCode ?? null,
    quantity: input.quantity.toFixed(8),
    unitValue: input.unitValue.toFixed(2),
    investedValue: input.investedValue.toFixed(2),
    contractedRate: input.contractedRate ?? null,
    maturityDate: input.maturityDate ?? null,
    purchasedAt: input.purchasedAt,
    notes: input.notes ?? null,
    updatedAt: new Date(),
  });
  return result.insertId;
}

export async function updatePosition(id: number, input: PositionInput): Promise<void> {
  await db
    .update(investmentPositions)
    .set({
      assetClass: input.assetClass,
      name: input.name,
      ticker: input.ticker ?? null,
      institutionCode: input.institutionCode ?? null,
      quantity: input.quantity.toFixed(8),
      unitValue: input.unitValue.toFixed(2),
      investedValue: input.investedValue.toFixed(2),
      contractedRate: input.contractedRate ?? null,
      maturityDate: input.maturityDate ?? null,
      purchasedAt: input.purchasedAt,
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(investmentPositions.id, id));
}

export async function deletePosition(id: number): Promise<void> {
  await db.delete(positionSnapshots).where(eq(positionSnapshots.positionId, id));
  await db.delete(investmentPositions).where(eq(investmentPositions.id, id));
}

/**
 * Reads every position and shapes it into the domain union the UI already consumes.
 * `history` is per-position and comes from the snapshot table; it is empty until
 * the first sync runs, which the UI must tolerate.
 */
export async function listPositions(): Promise<Position[]> {
  const rows = await db.select().from(investmentPositions).orderBy(asc(investmentPositions.name));
  const snapshots = await db
    .select()
    .from(positionSnapshots)
    .orderBy(asc(positionSnapshots.capturedAt));

  return rows.map((row) => {
    const quantity = toNumber(row.quantity);
    const unitValue = toNumber(row.unitValue);
    const currentValue = Number((quantity * unitValue).toFixed(2));

    const history: TimeSeriesPoint[] = snapshots
      .filter((snapshot) => snapshot.positionId === row.id)
      .map((snapshot) => ({
        date: isoDate(snapshot.capturedAt),
        value: toNumber(snapshot.value),
      }));

    const base = {
      id: String(row.id),
      name: row.name,
      institutionId: row.institutionCode ?? '',
      quantity,
      investedValue: toNumber(row.investedValue),
      currentValue,
      history,
    };

    if (row.assetClass === 'rendaFixa') {
      return {
        ...base,
        assetClass: 'rendaFixa',
        issuer: row.institutionCode ?? '',
        index: 'CDI',
        rateLabel: row.contractedRate ?? '',
        effectiveAnnualRate: 0,
        maturity: row.maturityDate ? isoDate(row.maturityDate) : '',
        liquidity: 'vencimento',
      };
    }

    if (row.assetClass === 'cripto') {
      return {
        ...base,
        assetClass: 'cripto',
        symbol: row.ticker ?? '',
        priceBrl: unitValue,
        change24h: 0,
      };
    }

    return {
      ...base,
      assetClass: 'acoes',
      ticker: row.ticker ?? '',
      kind: 'acao',
      price: unitValue,
      changeDay: 0,
      dividendYield: 0,
    };
  });
}

/** Writes one snapshot row per position at a single capture instant. */
export async function snapshotPositions(capturedAt: Date): Promise<void> {
  const rows = await db.select().from(investmentPositions);
  if (rows.length === 0) return;

  await db.insert(positionSnapshots).values(
    rows.map((row) => ({
      positionId: row.id,
      capturedAt,
      value: (toNumber(row.quantity) * toNumber(row.unitValue)).toFixed(2),
    })),
  );
}

/** Portfolio history = the sum of all position snapshots at each capture instant. */
export async function listPortfolioHistory(): Promise<TimeSeriesPoint[]> {
  const rows = await db
    .select({
      capturedAt: positionSnapshots.capturedAt,
      total: sql<string>`sum(${positionSnapshots.value})`,
    })
    .from(positionSnapshots)
    .groupBy(positionSnapshots.capturedAt)
    .orderBy(asc(positionSnapshots.capturedAt));

  return rows.map((row) => ({ date: isoDate(row.capturedAt), value: Number(row.total) }));
}
```

The zeroed fields (`effectiveAnnualRate`, `change24h`, `changeDay`, `dividendYield`) are placeholders that sub-project 3 fills from real market data. They are zero rather than invented, so nothing on screen claims a return the app cannot substantiate.

- [ ] **Step 7: Run both suites and watch them pass**

```bash
npm test -- tests/repositories
npm run typecheck
```

Expected: all PASS, none skipped.

- [ ] **Step 8: Commit**

```bash
git add lib/repositories tests/repositories vitest.config.ts
git commit -m "feat: add account, position and sync-log repositories"
```

---

### Task 7: Sync orchestration route

**Files:**

- Create: `app/api/sync/route.ts`, `lib/sync/run-sync.ts`
- Test: `tests/sync/run-sync.test.ts`

**Interfaces:**

- Consumes: the Pierre client (Task 5) and all three repositories (Task 6).
- Produces:
  - `runSync(deps: SyncDeps): Promise<SyncResult>` from `@/lib/sync/run-sync`, where
    `SyncDeps = { manualUpdate, getAccounts, getTransactions, upsertAccounts, insertTransactions, snapshotPositions, startSync, finishSync, lastSuccessfulSync, now }`
    and `SyncResult = { status: 'success' | 'partial' | 'error'; accounts: number; transactions: number; error: string | null }`
  - `POST /api/sync` → `{ status, accounts, transactions, error }`, 200 on success or partial, 500 on error, 401 when unauthenticated.

`runSync` takes its dependencies as an argument so it is testable without a database or a network. The route wires the real implementations in.

**Why `getBalance()` is not called here, even though the spec's flow names it.** `get-accounts` already returns `accountBalance` for every account, keyed by the stable `accountId` that the upsert depends on. `get-balance` returns balances keyed only by a display `name`, with no id — there is no reliable way to match its rows back to `bank_account` rows, and calling it would fetch the same numbers a second time in a shape we cannot use. The client still exposes `getBalance()` (Task 5) because the spec names the endpoint and a later sub-project may want the `total_balance` figure directly; it is deliberately unused by the sync. Do not "fix" this by wiring it in — say so in your report if a reviewer flags it as dead code.

- [ ] **Step 1: Write the failing test**

`tests/sync/run-sync.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { runSync } from '@/lib/sync/run-sync';
import { PierreAuthError } from '@/lib/pierre/client';

const NOW = new Date('2026-07-26T12:00:00.000Z');

function deps(overrides: Partial<Parameters<typeof runSync>[0]> = {}) {
  return {
    manualUpdate: vi.fn().mockResolvedValue({ connectedAccounts: 4 }),
    getAccounts: vi.fn().mockResolvedValue([
      {
        accountId: 'acc_1',
        providerCode: 'NUBANK',
        accountName: 'Conta',
        accountType: 'BANK',
        accountSubtype: 'CHECKING_ACCOUNT',
        accountBalance: 100,
        accountCurrencyCode: 'BRL',
        accountMarketingName: 'Nubank Conta',
      },
    ]),
    getTransactions: vi.fn().mockResolvedValue([
      {
        id: 'txn_1',
        description: 'Pagamento',
        category: 'Contas',
        amount: -150,
        date: '2026-07-20',
        type: 'DEBIT',
        status: 'POSTED',
      },
    ]),
    upsertAccounts: vi.fn().mockResolvedValue(undefined),
    insertTransactions: vi.fn().mockResolvedValue(1),
    snapshotPositions: vi.fn().mockResolvedValue(undefined),
    startSync: vi.fn().mockResolvedValue(7),
    finishSync: vi.fn().mockResolvedValue(undefined),
    lastSuccessfulSync: vi.fn().mockResolvedValue(new Date('2026-07-01T00:00:00.000Z')),
    now: () => NOW,
    ...overrides,
  };
}

describe('runSync', () => {
  it('reports success and the counts on the happy path', async () => {
    const result = await runSync(deps());
    expect(result).toEqual({ status: 'success', accounts: 1, transactions: 1, error: null });
  });

  it('opens and closes a sync log entry', async () => {
    const d = deps();
    await runSync(d);
    expect(d.startSync).toHaveBeenCalledOnce();
    expect(d.finishSync).toHaveBeenCalledWith(7, 'success', undefined);
  });

  it('asks Pierre to refresh before reading', async () => {
    const d = deps();
    await runSync(d);
    expect(d.manualUpdate).toHaveBeenCalledOnce();
    expect(d.manualUpdate.mock.invocationCallOrder[0]).toBeLessThan(
      d.getAccounts.mock.invocationCallOrder[0],
    );
  });

  it('requests transactions since the last successful sync', async () => {
    const d = deps();
    await runSync(d);
    expect(d.getTransactions).toHaveBeenCalledWith({
      startDate: '2026-07-01',
      endDate: '2026-07-26',
    });
  });

  it('falls back to a 90-day window when there has never been a successful sync', async () => {
    const d = deps({ lastSuccessfulSync: vi.fn().mockResolvedValue(null) });
    await runSync(d);
    expect(d.getTransactions).toHaveBeenCalledWith({
      startDate: '2026-04-27',
      endDate: '2026-07-26',
    });
  });

  it('snapshots positions so the history series gains a point', async () => {
    const d = deps();
    await runSync(d);
    expect(d.snapshotPositions).toHaveBeenCalledWith(NOW);
  });

  it('records an error status and a safe message when Pierre rejects the key', async () => {
    const d = deps({ manualUpdate: vi.fn().mockRejectedValue(new PierreAuthError()) });
    const result = await runSync(d);

    expect(result.status).toBe('error');
    expect(result.error).toContain('chave de API');
    expect(d.finishSync).toHaveBeenCalledWith(7, 'error', expect.stringContaining('chave de API'));
  });

  it('does not write anything when the accounts call fails', async () => {
    const d = deps({ getAccounts: vi.fn().mockRejectedValue(new PierreAuthError()) });
    await runSync(d);
    expect(d.upsertAccounts).not.toHaveBeenCalled();
    expect(d.insertTransactions).not.toHaveBeenCalled();
  });

  it('reports partial when accounts succeed but transactions fail', async () => {
    const d = deps({ getTransactions: vi.fn().mockRejectedValue(new Error('timeout')) });
    const result = await runSync(d);

    expect(result.status).toBe('partial');
    expect(result.accounts).toBe(1);
    expect(result.transactions).toBe(0);
    expect(d.upsertAccounts).toHaveBeenCalledOnce();
  });

  it('never leaks an api key into the recorded error', async () => {
    const d = deps({
      manualUpdate: vi.fn().mockRejectedValue(new Error('failed with key sk-secret-value')),
    });
    const result = await runSync(d);
    expect(result.error).not.toContain('sk-secret-value');
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
npm test -- tests/sync/run-sync.test.ts
```

Expected: FAIL, cannot resolve `@/lib/sync/run-sync`.

- [ ] **Step 3: Implement `lib/sync/run-sync.ts`**

```ts
import type { PierreAccount, PierreTransaction } from '@/lib/pierre/dto';
import { mapPierreAccount, mapPierreTransaction } from '@/lib/pierre/mappers';
import type { NewBankAccount, NewBankTransaction } from '@/lib/pierre/mappers';

const FALLBACK_WINDOW_DAYS = 90;

export interface SyncDeps {
  manualUpdate: () => Promise<{ connectedAccounts: number | null }>;
  getAccounts: () => Promise<PierreAccount[]>;
  getTransactions: (range: {
    startDate?: string;
    endDate?: string;
  }) => Promise<PierreTransaction[]>;
  upsertAccounts: (accounts: NewBankAccount[]) => Promise<void>;
  insertTransactions: (txs: NewBankTransaction[]) => Promise<number>;
  snapshotPositions: (capturedAt: Date) => Promise<void>;
  startSync: () => Promise<number>;
  finishSync: (
    id: number,
    status: 'success' | 'partial' | 'error',
    error?: string,
  ) => Promise<void>;
  lastSuccessfulSync: () => Promise<Date | null>;
  now: () => Date;
}

export interface SyncResult {
  status: 'success' | 'partial' | 'error';
  accounts: number;
  transactions: number;
  error: string | null;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Redacts anything that looks like a Pierre key before the message is stored or
 * shown. Belt and braces: the client already builds key-free messages.
 */
function safeMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Erro desconhecido durante a sincronização.';
  return raw.replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]');
}

export async function runSync(deps: SyncDeps): Promise<SyncResult> {
  const startedAt = deps.now();
  const logId = await deps.startSync();

  let accountsWritten = 0;

  try {
    await deps.manualUpdate();

    const pierreAccounts = await deps.getAccounts();
    const accounts = pierreAccounts.map((account) => mapPierreAccount(account, startedAt));
    await deps.upsertAccounts(accounts);
    accountsWritten = accounts.length;
  } catch (error) {
    const message = safeMessage(error);
    await deps.finishSync(logId, 'error', message);
    return { status: 'error', accounts: 0, transactions: 0, error: message };
  }

  // Accounts are in. A transactions failure from here on is partial, not total.
  let transactionsWritten = 0;
  try {
    const since = await deps.lastSuccessfulSync();
    const fallback = new Date(startedAt);
    fallback.setUTCDate(fallback.getUTCDate() - FALLBACK_WINDOW_DAYS);

    const pierreTransactions = await deps.getTransactions({
      startDate: isoDate(since ?? fallback),
      endDate: isoDate(startedAt),
    });

    transactionsWritten = await deps.insertTransactions(
      pierreTransactions.map(mapPierreTransaction),
    );
  } catch (error) {
    const message = safeMessage(error);
    await deps.finishSync(logId, 'partial', message);
    return { status: 'partial', accounts: accountsWritten, transactions: 0, error: message };
  }

  await deps.snapshotPositions(startedAt);
  await deps.finishSync(logId, 'success', undefined);

  return {
    status: 'success',
    accounts: accountsWritten,
    transactions: transactionsWritten,
    error: null,
  };
}
```

- [ ] **Step 4: Run and watch it pass**

```bash
npm test -- tests/sync/run-sync.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Create `app/api/sync/route.ts`**

```ts
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
```

- [ ] **Step 6: Run the gate and commit**

```bash
npm test && npm run typecheck && npm run lint && npm run build
git add lib/sync app/api/sync tests/sync
git commit -m "feat: add the pierre sync orchestration and route"
```

---

### Task 8: Point the service layer at the database

**Files:**

- Modify: `lib/data/services.ts`, `tests/data/services.test.ts`
- Delete: `lib/data/fixtures/accounts.ts`, `lib/data/fixtures/institutions.ts`, `lib/data/fixtures/crypto.ts`, `lib/data/fixtures/equities.ts`, `lib/data/fixtures/fixed-income.ts`, `lib/data/fixtures/portfolio.ts`

**Interfaces:**

- Consumes: `listAccounts` (Task 6), `listPositions`, `listPortfolioHistory` (Task 6).
- Produces: **the same nine exported function signatures as today.** No UI component changes in this task.

This is the moment the app stops being a mock. Four services become real; five stay mocked because their data belongs to sub-projects 3 and 4:

| Service                            | After this task                               |
| ---------------------------------- | --------------------------------------------- |
| `getAccounts()`                    | **real** — `bank_account`                     |
| `getFixedIncomePositions()`        | **real** — `investment_position` filtered     |
| `getCryptoPositions()`             | **real** — `investment_position` filtered     |
| `getEquityPositions()`             | **real** — `investment_position` filtered     |
| `getPortfolioSummary()`            | **real** — derived from positions + snapshots |
| `getSignals()` / `getSignalById()` | still mocked — sub-project 4                  |
| `getNews()`                        | still mocked — sub-project 3                  |
| `getMarketRates()`                 | still mocked — sub-project 3                  |

`lib/data/fixtures/signals.ts`, `news.ts`, `rates.ts` and `lib/data/random.ts` stay. The six fixture files listed above are deleted because nothing reads them any more.

- [ ] **Step 1: Rewrite `tests/data/services.test.ts`**

The old suite asserted fixture contents. Replace it with a suite that asserts the contract the UI depends on, against an empty and a populated database:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/db/client';
import { bankAccounts, investmentPositions, positionSnapshots } from '@/lib/db/schema';
import { createPosition, snapshotPositions } from '@/lib/repositories/positions';
import { upsertAccounts } from '@/lib/repositories/accounts';
import {
  getAccounts,
  getCryptoPositions,
  getEquityPositions,
  getFixedIncomePositions,
  getMarketRates,
  getNews,
  getPortfolioSummary,
  getSignalById,
  getSignals,
} from '@/lib/data/services';

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb('services over a real database', () => {
  beforeEach(async () => {
    await db.delete(positionSnapshots);
    await db.delete(investmentPositions);
    await db.delete(bankAccounts);
  });

  afterEach(async () => {
    await db.delete(positionSnapshots);
    await db.delete(investmentPositions);
    await db.delete(bankAccounts);
  });

  describe('with an empty database', () => {
    it('returns no accounts rather than throwing', async () => {
      await expect(getAccounts()).resolves.toEqual([]);
    });

    it('returns no positions in any asset class', async () => {
      await expect(getFixedIncomePositions()).resolves.toEqual([]);
      await expect(getCryptoPositions()).resolves.toEqual([]);
      await expect(getEquityPositions()).resolves.toEqual([]);
    });

    it('returns a zeroed portfolio summary without dividing by zero', async () => {
      const summary = await getPortfolioSummary();
      expect(summary.totalValue).toBe(0);
      expect(summary.dayChangeValue).toBe(0);
      expect(summary.dayChangePercent).toBe(0);
      expect(summary.history).toEqual([]);
      expect(summary.allocation.every((slice) => slice.percent === 0)).toBe(true);
      expect(summary.allocation.every((slice) => Number.isFinite(slice.percent))).toBe(true);
    });
  });

  describe('with positions', () => {
    beforeEach(async () => {
      await createPosition({
        assetClass: 'rendaFixa',
        name: 'CDB BB 2028',
        quantity: 1,
        unitValue: 30000,
        investedValue: 28000,
        purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      await createPosition({
        assetClass: 'cripto',
        name: 'Bitcoin',
        ticker: 'BTC',
        quantity: 0.1,
        unitValue: 100000,
        investedValue: 8000,
        purchasedAt: new Date('2026-01-01T00:00:00.000Z'),
      });
    });

    it('filters each asset class into its own service', async () => {
      await expect(getFixedIncomePositions()).resolves.toHaveLength(1);
      await expect(getCryptoPositions()).resolves.toHaveLength(1);
      await expect(getEquityPositions()).resolves.toHaveLength(0);
    });

    it('totals the portfolio from the positions', async () => {
      const summary = await getPortfolioSummary();
      expect(summary.totalValue).toBe(40000);
    });

    it('produces allocation percentages that sum to one hundred', async () => {
      const summary = await getPortfolioSummary();
      const total = summary.allocation.reduce((sum, slice) => sum + slice.percent, 0);
      expect(total).toBeCloseTo(100, 6);
    });

    it('builds history from snapshots', async () => {
      await snapshotPositions(new Date('2026-07-26T12:00:00.000Z'));
      const summary = await getPortfolioSummary();
      expect(summary.history).toHaveLength(1);
      expect(summary.history[0].value).toBe(40000);
    });

    it('computes the day change from the two most recent snapshots', async () => {
      await snapshotPositions(new Date('2026-07-25T12:00:00.000Z'));
      await snapshotPositions(new Date('2026-07-26T12:00:00.000Z'));
      const summary = await getPortfolioSummary();
      // Both snapshots have the same value, so the change is exactly zero.
      expect(summary.dayChangeValue).toBe(0);
      expect(summary.dayChangePercent).toBe(0);
    });
  });

  describe('with bank accounts', () => {
    it('returns accounts with their institution badge', async () => {
      await upsertAccounts([
        {
          externalId: 'acc_1',
          providerCode: 'NUBANK',
          name: 'Nubank Conta',
          type: 'corrente',
          balance: 1500.5,
          currencyCode: 'BRL',
          lastSyncedAt: new Date('2026-07-26T12:00:00.000Z'),
        },
      ]);

      const accounts = await getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].institution.initials).toBe('NU');
    });
  });
});

describe('services still backed by fixtures', () => {
  it('still returns mocked signals until sub-project 4 exists', async () => {
    const signals = await getSignals();
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((signal) => signal.factors.length >= 2)).toBe(true);
    expect(signals.every((signal) => signal.disclaimer.trim().length > 0)).toBe(true);
  });

  it('still resolves a signal by id', async () => {
    const [first] = await getSignals();
    await expect(getSignalById(first.id)).resolves.toEqual(first);
  });

  it('still returns mocked news newest first', async () => {
    const news = await getNews();
    const times = news.map((item) => new Date(item.publishedAt).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('still returns the july 2026 rate anchors', async () => {
    const rates = await getMarketRates();
    expect(rates.selic).toBe(14.25);
    expect(rates.cdi).toBe(14.15);
  });
});
```

- [ ] **Step 2: Run and watch the database suite fail**

```bash
npm test -- tests/data/services.test.ts
```

Expected: the "over a real database" describes FAIL (services still return fixtures); the "still backed by fixtures" describes PASS.

- [ ] **Step 3: Rewrite `lib/data/services.ts`**

```ts
import 'server-only';
import { listAccounts } from '@/lib/repositories/accounts';
import { listPortfolioHistory, listPositions } from '@/lib/repositories/positions';
import { news } from './fixtures/news';
import { marketRates } from './fixtures/rates';
import { signals } from './fixtures/signals';
import type {
  Account,
  AllocationSlice,
  CryptoPosition,
  EquityPosition,
  FixedIncomePosition,
  MarketRates,
  NewsItem,
  PortfolioSummary,
  Signal,
} from '@/lib/types';

/**
 * The only module UI components read data from.
 *
 * Accounts and positions are real (sub-project 2). Signals, news and market
 * rates are still fixtures — they belong to sub-projects 3 and 4. When those
 * land, only the bodies below change; no component is touched.
 */

export async function getAccounts(): Promise<Account[]> {
  return listAccounts();
}

export async function getFixedIncomePositions(): Promise<FixedIncomePosition[]> {
  const positions = await listPositions();
  return positions.filter((p): p is FixedIncomePosition => p.assetClass === 'rendaFixa');
}

export async function getCryptoPositions(): Promise<CryptoPosition[]> {
  const positions = await listPositions();
  return positions.filter((p): p is CryptoPosition => p.assetClass === 'cripto');
}

export async function getEquityPositions(): Promise<EquityPosition[]> {
  const positions = await listPositions();
  return positions.filter((p): p is EquityPosition => p.assetClass === 'acoes');
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  const [positions, history] = await Promise.all([listPositions(), listPortfolioHistory()]);

  const sumFor = (assetClass: string) =>
    Number(
      positions
        .filter((position) => position.assetClass === assetClass)
        .reduce((total, position) => total + position.currentValue, 0)
        .toFixed(2),
    );

  const fixedIncome = sumFor('rendaFixa');
  const crypto = sumFor('cripto');
  const equities = sumFor('acoes');
  const totalValue = Number((fixedIncome + crypto + equities).toFixed(2));

  // A brand-new install has no positions. Percent must be 0, never NaN.
  const percentOf = (value: number) => (totalValue === 0 ? 0 : (value / totalValue) * 100);

  const allocation: AllocationSlice[] = [
    {
      assetClass: 'rendaFixa',
      label: 'Renda fixa',
      value: fixedIncome,
      percent: percentOf(fixedIncome),
    },
    { assetClass: 'cripto', label: 'Cripto', value: crypto, percent: percentOf(crypto) },
    { assetClass: 'acoes', label: 'Ações e FIIs', value: equities, percent: percentOf(equities) },
  ];

  // Day change compares the two most recent snapshots. Fewer than two means no
  // basis for comparison, so it reports zero rather than inventing a movement.
  const previous = history.length >= 2 ? history[history.length - 2].value : null;
  const latest = history.length >= 1 ? history[history.length - 1].value : null;
  const dayChangeValue =
    previous !== null && latest !== null ? Number((latest - previous).toFixed(2)) : 0;
  const dayChangePercent =
    previous !== null && previous !== 0 ? (dayChangeValue / previous) * 100 : 0;

  const averageScore =
    signals.length === 0
      ? 0
      : Math.round(signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length);

  return {
    totalValue,
    dayChangeValue,
    dayChangePercent,
    allocation,
    history,
    averageScore,
  };
}

/** Still mocked — sub-project 4 replaces this body. */
export async function getSignals(): Promise<Signal[]> {
  return signals;
}

/** Still mocked — sub-project 4 replaces this body. */
export async function getSignalById(id: string): Promise<Signal | null> {
  return signals.find((signal) => signal.id === id) ?? null;
}

/** Still mocked — sub-project 3 replaces this body. */
export async function getNews(): Promise<NewsItem[]> {
  return [...news].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** Still mocked — sub-project 3 replaces this body. */
export async function getMarketRates(): Promise<MarketRates> {
  return marketRates;
}
```

The simulated-latency `respond()` helper is gone: the database provides real latency now, and the mocked services should not pretend to be slow.

- [ ] **Step 4: Delete the six dead fixture files**

```bash
git rm lib/data/fixtures/accounts.ts lib/data/fixtures/institutions.ts \
       lib/data/fixtures/crypto.ts lib/data/fixtures/equities.ts \
       lib/data/fixtures/fixed-income.ts lib/data/fixtures/portfolio.ts
```

If `npm run typecheck` then reports a file still importing one of them, that import is a rule violation — fix the importer, do not restore the fixture.

**`lib/data/random.ts` stays but loses most of its users.** `REFERENCE_DATE` is still imported by `lib/tools/projection.ts` (the Ferramentas simulator anchors its projection to it), so the file cannot be deleted. `mulberry32` and `generateSeries` existed only to build the deleted fixtures and are now dead. Delete those two exports and keep `REFERENCE_DATE`, so the file shrinks to the one thing still in use. Run `npm run typecheck` afterwards to confirm nothing else referenced them.

- [ ] **Step 5: Run the gate**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all PASS, no skipped database suites.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: read accounts and positions from the database"
```

---

### Task 9: Manual position CRUD

**Files:**

- Create: `app/api/positions/route.ts`, `app/api/positions/[id]/route.ts`, `lib/validation/position.ts`, `app/(dashboard)/posicoes/page.tsx`, `app/(dashboard)/posicoes/loading.tsx`, `components/positions/position-form.tsx`, `components/positions/positions-table.tsx`
- Modify: `components/shell/nav-links.ts`
- Test: `tests/validation/position.test.ts`

**Interfaces:**

- Consumes: `createPosition`, `updatePosition`, `deletePosition`, `listPositions` (Task 6); `auth` (Task 2).
- Produces:
  - `positionSchema` and `parsePositionInput(payload: unknown): PositionInput` from `@/lib/validation/position`
  - `POST /api/positions`, `PATCH /api/positions/[id]`, `DELETE /api/positions/[id]` — all 401 without a session, 400 on validation failure with the field errors
  - A `/posicoes` route added to `navLinks` as the eighth tab, labelled `Posições`

- [ ] **Step 1: Write the failing validation test**

`tests/validation/position.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parsePositionInput } from '@/lib/validation/position';

const valid = {
  assetClass: 'rendaFixa',
  name: 'CDB Banco do Brasil 2028',
  quantity: 1,
  unitValue: 34120.45,
  investedValue: 30000,
  contractedRate: '110% do CDI',
  maturityDate: '2028-03-15',
  purchasedAt: '2025-03-15',
};

describe('parsePositionInput', () => {
  it('accepts a valid fixed income position', () => {
    const parsed = parsePositionInput(valid);
    expect(parsed.assetClass).toBe('rendaFixa');
    expect(parsed.unitValue).toBe(34120.45);
    expect(parsed.purchasedAt.toISOString()).toBe('2025-03-15T00:00:00.000Z');
  });

  it('rejects an unknown asset class', () => {
    expect(() => parsePositionInput({ ...valid, assetClass: 'imoveis' })).toThrow();
  });

  it('rejects an empty name', () => {
    expect(() => parsePositionInput({ ...valid, name: '   ' })).toThrow();
  });

  it('rejects a negative quantity', () => {
    expect(() => parsePositionInput({ ...valid, quantity: -1 })).toThrow();
  });

  it('rejects a zero quantity', () => {
    expect(() => parsePositionInput({ ...valid, quantity: 0 })).toThrow();
  });

  it('rejects a negative unit value', () => {
    expect(() => parsePositionInput({ ...valid, unitValue: -0.01 })).toThrow();
  });

  it('rejects a negative invested value', () => {
    expect(() => parsePositionInput({ ...valid, investedValue: -1 })).toThrow();
  });

  it('accepts a zero invested value', () => {
    expect(() => parsePositionInput({ ...valid, investedValue: 0 })).not.toThrow();
  });

  it('treats an omitted maturity date as null', () => {
    const payload = { ...valid };
    delete (payload as Record<string, unknown>).maturityDate;
    expect(parsePositionInput(payload).maturityDate).toBeNull();
  });

  it('parses dates as UTC midnight so the stored day never shifts', () => {
    const parsed = parsePositionInput({ ...valid, purchasedAt: '2026-12-31' });
    expect(parsed.purchasedAt.toISOString()).toBe('2026-12-31T00:00:00.000Z');
  });

  it('rejects a malformed date', () => {
    expect(() => parsePositionInput({ ...valid, purchasedAt: 'ontem' })).toThrow();
  });

  it('trims the name', () => {
    expect(parsePositionInput({ ...valid, name: '  CDB  ' }).name).toBe('CDB');
  });
});
```

- [ ] **Step 2: Run and watch it fail**

```bash
npm test -- tests/validation/position.test.ts
```

Expected: FAIL, cannot resolve `@/lib/validation/position`.

- [ ] **Step 3: Implement `lib/validation/position.ts`**

```ts
import { z } from 'zod';
import type { PositionInput } from '@/lib/repositories/positions';

/** Accepts 'YYYY-MM-DD' and anchors it at UTC midnight. */
const utcDate = z
  .string()
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()), {
    message: 'Data inválida',
  })
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

export const positionSchema = z.object({
  assetClass: z.enum(['rendaFixa', 'cripto', 'acoes']),
  name: z.string().trim().min(1, 'Informe um nome'),
  ticker: z.string().trim().min(1).nullish(),
  institutionCode: z.string().trim().min(1).nullish(),
  quantity: z.number().positive('A quantidade precisa ser maior que zero'),
  unitValue: z.number().nonnegative('O valor unitário não pode ser negativo'),
  investedValue: z.number().nonnegative('O valor investido não pode ser negativo'),
  contractedRate: z.string().trim().min(1).nullish(),
  maturityDate: utcDate.nullish(),
  purchasedAt: utcDate,
  notes: z.string().trim().min(1).nullish(),
});

export function parsePositionInput(payload: unknown): PositionInput {
  const parsed = positionSchema.parse(payload);
  return {
    ...parsed,
    ticker: parsed.ticker ?? null,
    institutionCode: parsed.institutionCode ?? null,
    contractedRate: parsed.contractedRate ?? null,
    maturityDate: parsed.maturityDate ?? null,
    notes: parsed.notes ?? null,
  };
}
```

- [ ] **Step 4: Run and watch it pass**

```bash
npm test -- tests/validation/position.test.ts
```

Expected: 12/12 PASS.

- [ ] **Step 5: Create the API routes**

`app/api/positions/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { createPosition } from '@/lib/repositories/positions';
import { parsePositionInput } from '@/lib/validation/position';

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  try {
    const id = await createPosition(parsePositionInput(await request.json()));
    revalidatePath('/posicoes');
    revalidatePath('/visao-geral');
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: z.treeifyError(error) }, { status: 400 });
    }
    throw error;
  }
}
```

If `z.treeifyError` is unavailable in the installed Zod version, use `error.flatten()` instead and note the substitution in your report.

`app/api/positions/[id]/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { deletePosition, updatePosition } from '@/lib/repositories/positions';
import { parsePositionInput } from '@/lib/validation/position';

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const id = parseId((await context.params).id);
  if (id === null) return NextResponse.json({ error: 'Id inválido.' }, { status: 400 });

  try {
    await updatePosition(id, parsePositionInput(await request.json()));
    revalidatePath('/posicoes');
    revalidatePath('/visao-geral');
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: z.treeifyError(error) }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const id = parseId((await context.params).id);
  if (id === null) return NextResponse.json({ error: 'Id inválido.' }, { status: 400 });

  await deletePosition(id);
  revalidatePath('/posicoes');
  revalidatePath('/visao-geral');
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Add the tab to `components/shell/nav-links.ts`**

Insert between `acoes` and `sinais`:

```ts
{ href: '/posicoes', label: 'Posições' },
```

- [ ] **Step 7: Build the CRUD screen**

> **This step is specified by requirement rather than by literal code — the only step in the plan that is.** Every other code step gives you the exact source to transcribe. Here the two components are ordinary CRUD forms with no novel logic, and the requirements below are binding: treat each bullet as a checklist item a reviewer will verify, not as a suggestion. If you find yourself making a design decision the bullets do not cover, make the smallest choice consistent with the existing screens and say what you chose in your report.

`components/positions/position-form.tsx` — a Client Component with `'use client'`, holding local form state and POSTing or PATCHing to the routes above. Requirements, all of which must be met:

- Fields: asset class (select: Renda fixa / Cripto / Ações e FIIs), name, ticker, institution code, quantity, unit value, invested value, contracted rate, maturity date, purchase date, notes.
- The fixed-income-only fields (contracted rate, maturity date) are hidden unless the asset class is `rendaFixa`; the ticker field is hidden for `rendaFixa`.
- Number inputs clamp at zero with `Math.max(0, Number(value) || 0)` so a cleared field never yields `NaN`, matching the guard the Ferramentas tools already use.
- Every input has a `<label htmlFor>`; the form is keyboard-operable.
- On a 400 response, render the returned field errors next to the offending inputs rather than a generic message.
- On success, call `router.refresh()` so the Server Component list re-reads the database.
- Styling uses the existing tokens: `border-border`, `bg-bg`, `text-text`, `text-muted`, and `bg-accent` for the submit button. **No gold** — this screen shows no confidence score.

`components/positions/positions-table.tsx` — renders the existing `DataTable` primitive (`components/common/data-table.tsx`, `Column<T> = { key, header, cell, align? }`) with columns for name, asset class, quantity, unit value, current value and invested value, plus an actions cell holding Edit and Delete buttons. Delete asks for confirmation before firing.

`app/(dashboard)/posicoes/page.tsx` — a Server Component that awaits `getFixedIncomePositions()`, `getCryptoPositions()` and `getEquityPositions()` concurrently with `Promise.all`, concatenates them, and renders `SectionHeader` + the create form + the table. When there are no positions at all it renders the `EmptyState` primitive with an inviting message, e.g. title `Nenhuma posição cadastrada ainda` and description `Cadastre um CDB, uma ação ou uma cripto para ver seu patrimônio consolidado na visão geral.`

`app/(dashboard)/posicoes/loading.tsx` — one line using the shared skeleton primitive: `<TabSkeleton statCount={0} body="table" />` (check `components/common/tab-skeleton.tsx` for the exact prop names before writing this).

- [ ] **Step 8: Verify the routes over HTTP**

With `npm run dev` running and no session cookie:

```bash
curl -i -X POST http://localhost:3000/api/positions -H 'content-type: application/json' -d '{}'
```

Expect **401**, not 400 — an unauthenticated caller must never reach validation. Kill the dev server afterwards and report the status you saw.

- [ ] **Step 9: Run the gate and commit**

```bash
npm test && npm run typecheck && npm run lint && npm run build
git add -A
git commit -m "feat: add manual investment position crud"
```

---

### Task 10: Sync UI, empty states and closing pass

**Files:**

- Create: `components/sync/sync-button.tsx`, `components/sync/sync-status.tsx`
- Modify: `app/(dashboard)/visao-geral/page.tsx`, `components/overview/accounts-list.tsx`, `README.md`, `CLAUDE.md`
- Test: none new — this task is composition over already-tested code.

**Interfaces:**

- Consumes: `lastSync`, `lastSuccessfulSync` (Task 6); `POST /api/sync` (Task 7).
- Produces: `<SyncButton />` (client) and `<SyncStatus lastSync={...} />` (server), both rendered on Visão Geral.

- [ ] **Step 1: Create `components/sync/sync-button.tsx`**

A Client Component that POSTs to `/api/sync`, disables itself while in flight with a `Sincronizando…` label, calls `router.refresh()` on success, and on failure surfaces the `error` string the route returned. Requirements:

- Uses `useState` for the pending flag and the error message; no global state.
- The button is `type="button"` with an accessible label; while pending it sets `aria-busy="true"` and stays focusable.
- Error text renders in `text-negative`, success needs no banner — the refreshed numbers are the feedback.
- Styling: `bg-accent text-bg` for the button, tokens only, **no gold**.

- [ ] **Step 2: Create `components/sync/sync-status.tsx`**

A Server Component taking the result of `lastSync()` and rendering, per the spec's error-handling rule:

- Never-synced: `Nunca sincronizado.`
- Last attempt succeeded: `Última atualização: {formatDateTime(finishedAt)}` in `text-muted`.
- Last attempt failed but an earlier one succeeded: the last successful timestamp **plus** a warning in `text-negative` naming the failure, e.g. `Última tentativa falhou: {error}`. The spec is explicit that a failure must never blank the screen or show zeroed data — it shows the last good state with a warning.

Dates go through `formatDateTime` from `lib/format/date.ts`. Do not write a new formatter.

- [ ] **Step 3: Wire both into Visão Geral**

In `app/(dashboard)/visao-geral/page.tsx`, add `lastSync()` to the existing `Promise.all` and render `<SyncStatus />` and `<SyncButton />` in the header row beside `SectionHeader`, stacking below it on mobile. Do not disturb the existing gauge card link to `/sinais` or any other section.

- [ ] **Step 4: Fix the accounts empty state**

`components/overview/accounts-list.tsx` currently renders a bare bordered box when `accounts` is empty. That was harmless with fixtures that always had six accounts; with a real database it is the **default first-run experience**. Add an empty branch using the existing `EmptyState` primitive:

- title: `Nenhuma conta conectada ainda`
- description: `Clique em "Atualizar agora" para buscar suas contas na Pierre.`

- [ ] **Step 5: Update the docs**

`CLAUDE.md` — extend the Comandos section with the new scripts:

```markdown
- `docker compose up -d` — sobe o MySQL local
- `npm run db:generate` — gera migration a partir do schema Drizzle
- `npm run db:migrate` — aplica as migrations
- `npm run db:studio` — abre o Drizzle Studio
```

Also update "Como o projeto está dividido" to mark sub-project 2 as built, and adjust the data-layer rule to state that accounts and positions now come from MySQL while signals, news and rates remain fixtures.

`README.md` — add a "Como rodar" section covering: copy `.env.example` to `.env.local`, start Docker, run the migrations, generate the auth secret and password hash, and the note that **without a `PIERRE_API_KEY` the sync button will fail with a clear error and everything else still works**. Be accurate: do not imply the Pierre integration has been tested against the live API, because it has not.

- [ ] **Step 6: Full verification**

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
```

All five must pass. Then boot the dev server and sweep every route with `curl`, logged out and logged in:

| Route                                                                      | Logged out     | Logged in                                        |
| -------------------------------------------------------------------------- | -------------- | ------------------------------------------------ |
| `/login`                                                                   | 200            | 302 → `/visao-geral`                             |
| `/visao-geral`                                                             | 302 → `/login` | 200                                              |
| `/posicoes`                                                                | 302 → `/login` | 200                                              |
| `/renda-fixa`, `/cripto`, `/acoes`, `/sinais`, `/noticias`, `/ferramentas` | 302 → `/login` | 200                                              |
| `POST /api/sync`                                                           | 401            | 500 with a clear error (no `PIERRE_API_KEY` set) |
| `POST /api/positions`                                                      | 401            | 400 on an empty body                             |

Report the actual status codes in a table. Kill the dev server when done.

**Pixel-level layout, mobile stacking and horizontal scroll at 390px remain unverified** — there is no browser automation in this environment, as was true throughout sub-project 1. Say so plainly; do not claim otherwise.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add sync controls, account empty state and setup docs"
```

---

## Spec Coverage Check

| Spec requirement                                                                    | Task                                        |
| ----------------------------------------------------------------------------------- | ------------------------------------------- |
| Simple auth protecting the app before real data is exposed                          | 2                                           |
| Pierre integration: accounts, balance, transactions                                 | 3, 4, 5                                     |
| Manual CRUD of investment positions                                                 | 9                                           |
| Real persistence with snapshot history, replacing fixtures                          | 1, 6, 8                                     |
| On-demand sync ("Atualizar agora"), no cron                                         | 7, 10                                       |
| Next.js Route Handlers as BFF; key only server-side                                 | 5, 7, 9                                     |
| MySQL self-hosted via Docker Compose                                                | 1                                           |
| Auth.js credentials, single user from env, httpOnly cookie                          | 2                                           |
| `bank_account` table                                                                | 1, 6                                        |
| `bank_transaction` table                                                            | 1, 6                                        |
| `investment_position` table with full CRUD                                          | 1, 6, 9                                     |
| `sync_log` audit table                                                              | 1, 6, 7                                     |
| Sync flow: manual-update → accounts + balance + transactions → write → revalidate   | 7                                           |
| Positions have no sync; edited directly by the user                                 | 9                                           |
| Failure shows last successful sync with a warning, never zeroed data                | 7, 10                                       |
| Unit tests: Pierre parsing/normalisation                                            | 3, 4                                        |
| Unit tests: consolidated balance across accounts                                    | 8 (`getPortfolioSummary`)                   |
| Integration test: sync route with Pierre mocked, success and partial failure        | 7                                           |
| Position CRUD validation and session enforcement on every route                     | 9                                           |
| Read-only over financial data — no writes to the bank                               | Global constraint; no write endpoint exists |
| Out of scope: consent flow, expense categorisation, undocumented endpoint discovery | Not implemented, by design                  |
