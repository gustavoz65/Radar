# Radar Frontend MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete, navigable Radar dashboard (7 tabs, final visuals, desktop + mobile) running entirely on a mocked async data layer that mirrors the shape the real backend will produce.

**Architecture:** A single Next.js 15 App Router app at the repository root. Every screen is a Server Component that `await`s a function from `lib/data/services.ts`; those functions sleep 300–800ms and return deterministic fixtures. Client Components are used only for local interaction (mobile menu, tab filters, expandable score breakdown, calculator inputs). Swapping mocks for the real backend later changes only the bodies of the service functions.

**Tech Stack:** Next.js 15 (App Router), TypeScript (strict), Tailwind CSS v4, shadcn/ui, Recharts, Geist Sans + Geist Mono, Vitest for unit tests, ESLint + Prettier.

## Global Constraints

- **Source of truth:** `docs/superpowers/specs/2026-07-26-radar-frontend-mvp-design.md`. Do not add features it does not describe.
- **Node:** 24.x, npm 11.x (already installed on the machine).
- **App location:** repository root. The existing root `package.json` (husky, commitlint, lint-staged, prettier) is **extended**, never replaced.
- **Language of the UI:** Portuguese (pt-BR). Code identifiers, file names, commit messages, and comments in English.
- **Design tokens (exact hex, never hardcode a color outside `app/globals.css`):**
  | Token              | Hex       |
  | ------------------ | --------- |
  | `--bg`             | `#0a0e14` |
  | `--surface`        | `#0d1117` |
  | `--border`         | `#21262d` |
  | `--text`           | `#e6edf3` |
  | `--text-muted`     | `#8b949e` |
  | `--positive`       | `#3fb950` |
  | `--negative`       | `#f85149` |
  | `--accent`         | `#58a6ff` |
  | `--signature-gold` | `#f5b942` |
- **`--signature-gold` is reserved exclusively for confidence scores.** Price up/down uses `--positive` / `--negative`. Never mix.
- **Every `Signal` rendered anywhere must show its factor breakdown and the disclaimer.** No score without visible justification.
- **No direct network calls in components.** All data reads go through `lib/data/services.ts`. Never import a fixture file from a UI component.
- **No official bank logos.** Institutions render as an initials badge with their own color.
- **Money always formatted as BRL** via `formatBRL`. Numeric/tabular values use Geist Mono.
- **Dates only ever formatted by `lib/format/date.ts`**, always in UTC. No component defines its own `Intl.DateTimeFormat` — fixtures carry no real timezone in this phase, so a viewer's offset must never shift a displayed date.
- **Responsiveness is not a follow-up.** Every screen task ends with both the desktop and mobile layout implemented and checked.
- **Market anchors for fixtures:** Selic 14,25% a.a., CDI 14,15% a.a. (July 2026).
- **Conventional Commits**, small commits. Commit at the end of every task.
- **Quality gate:** `npm run typecheck`, `npm run lint`, `npm test` must pass before each commit.

---

## File Structure

```
package.json                        # extended: Next/React/Tailwind deps + app scripts
tsconfig.json                       # strict TS, @/* path alias
next.config.ts
postcss.config.mjs                  # Tailwind v4 plugin
eslint.config.mjs                   # next/core-web-vitals + TS
vitest.config.ts                    # node env, @/* alias
components.json                     # shadcn/ui config

app/
  layout.tsx                        # <html>, fonts, <body> tokens
  globals.css                       # design tokens + Tailwind theme mapping
  page.tsx                          # redirect -> /visao-geral
  (dashboard)/
    layout.tsx                      # AppShell wrapper (nav + main)
    visao-geral/page.tsx  loading.tsx
    renda-fixa/page.tsx   loading.tsx
    cripto/page.tsx       loading.tsx
    acoes/page.tsx        loading.tsx
    sinais/page.tsx       loading.tsx
    sinais/[id]/page.tsx  loading.tsx
    noticias/page.tsx     loading.tsx
    ferramentas/page.tsx

lib/
  types/index.ts                    # Account, Position, Signal, NewsItem, ...
  format/money.ts                   # formatBRL, formatCompactBRL
  format/percent.ts                 # percentChange, formatPercent, formatSignedPercent
  format/date.ts                    # formatDate, formatDateTime, formatChartDate (UTC)
  charts/gauge.ts                   # GAUGE_ARC_LENGTH, gaugeDashOffset, scoreLabel
  data/random.ts                    # mulberry32 seeded PRNG + series generator
  data/fixtures/institutions.ts
  data/fixtures/accounts.ts
  data/fixtures/portfolio.ts        # 12-month equity curve + allocation
  data/fixtures/fixed-income.ts
  data/fixtures/crypto.ts
  data/fixtures/equities.ts
  data/fixtures/signals.ts
  data/fixtures/news.ts
  data/fixtures/rates.ts            # Selic / CDI / IPCA / poupança
  data/services.ts                  # the ONLY module UI imports data from

components/
  ui/                               # shadcn/ui primitives (generated)
  shell/app-shell.tsx               # server: nav frame
  shell/nav-links.ts                # the 7 tabs, single source of truth
  shell/desktop-nav.tsx             # client: active-route highlighting
  shell/mobile-nav.tsx              # client: hamburger sheet
  common/stat-card.tsx
  common/trend-value.tsx            # +/- colored, mono
  common/institution-badge.tsx
  common/section-header.tsx
  common/empty-state.tsx
  common/data-table.tsx             # responsive table -> stacked cards on mobile
  signal/confidence-gauge.tsx       # THE signature arc gauge (mini | large)
  signal/factor-breakdown.tsx
  signal/signal-disclaimer.tsx
  signal/asset-class-labels.ts      # shared by signal-card and signal-detail
  signal/signal-card.tsx
  charts/area-history-chart.tsx     # client: Recharts area
  charts/allocation-chart.tsx       # client: Recharts donut
  charts/bar-comparison-chart.tsx   # client: Recharts bars
  tools/cdb-comparator.tsx          # client
  tools/contribution-simulator.tsx  # client

lib/tools/projection.ts             # future-value math (pure, tested)

tests/
  format/money.test.ts
  format/percent.test.ts
  format/date.test.ts
  charts/gauge.test.ts
  tools/projection.test.ts
  data/services.test.ts
```

**Task order rationale:** foundations (1) → pure logic (2) → data layer (3) → shell (4) → shared visual primitives (5) → one task per tab (6–12) → polish and final verification (13). Tasks 6–12 each depend only on 1–5, so a reviewer can accept or reject any single tab independently.

---

### Task 1: Scaffold the Next.js app at the repository root

**Files:**

- Modify: `package.json`
- Create: `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `next-env.d.ts` (generated), `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Modify: `.gitignore`
- Test: `tests/smoke.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: the `@/*` path alias resolving to the repo root; npm scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`; the CSS custom properties listed in Global Constraints, exposed to Tailwind as `bg-bg`, `bg-surface`, `border-border`, `text-text`, `text-muted`, `text-positive`, `text-negative`, `text-accent`, `text-gold` and their `bg-*` counterparts; the font variables `--font-geist-sans` and `--font-geist-mono` mapped to Tailwind `font-sans` / `font-mono`.

Do **not** run `create-next-app` — it refuses to scaffold into a directory with an existing `package.json` and would drop the husky/commitlint tooling. Scaffold by hand as below.

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
npm install next@15 react@19 react-dom@19 recharts geist clsx tailwind-merge lucide-react
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss@4 @tailwindcss/postcss eslint eslint-config-next @eslint/eslintrc vitest
```

- [ ] **Step 2: Add app scripts to `package.json`**

Merge these into the existing `"scripts"` object, keeping `prepare`, `format`, and `format:check`:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

Also update `"description"` to `"Radar — personal financial intelligence dashboard."` and extend `lint-staged` so TS/TSX files are covered (they already match the existing glob — verify, do not duplicate).

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create the build configs**

`next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

`postcss.config.mjs`:

```js
const config = {
  plugins: { '@tailwindcss/postcss': {} },
};

export default config;
```

`eslint.config.mjs`:

```js
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  { ignores: ['.next/**', 'node_modules/**', 'coverage/**'] },
];
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
});
```

- [ ] **Step 5: Create `app/globals.css` with the design tokens**

```css
@import 'tailwindcss';

:root {
  --bg: #0a0e14;
  --surface: #0d1117;
  --border: #21262d;
  --text: #e6edf3;
  --text-muted: #8b949e;
  --positive: #3fb950;
  --negative: #f85149;
  --accent: #58a6ff;
  --signature-gold: #f5b942;
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-muted: var(--text-muted);
  --color-positive: var(--positive);
  --color-negative: var(--negative);
  --color-accent: var(--accent);
  --color-gold: var(--signature-gold);

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

html {
  color-scheme: dark;
}

body {
  background-color: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

/* Tabular figures everywhere numbers are compared vertically. */
.tabular {
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 6: Create `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'Radar',
  description: 'Inteligência financeira pessoal — cenários de mercado com score explicável.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh bg-bg font-sans text-text antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create `app/page.tsx`**

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/visao-geral');
}
```

- [ ] **Step 8: Add `next-env.d.ts` and `.next/` handling to `.gitignore`**

`.next/` and `node_modules/` are already ignored. Append:

```
# Next.js generated types
next-env.d.ts
```

- [ ] **Step 9: Write a smoke test proving the toolchain and alias work**

`tests/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('toolchain', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 10: Run the full gate**

```bash
npm test
npm run typecheck
npm run build
```

Expected: test passes; `tsc` clean; `next build` succeeds and reports the `/` route. If `next build` complains about a missing `next-env.d.ts`, run `npx next build` once to generate it, then re-run.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold next.js app with radar design tokens"
```

---

### Task 2: Pure formatting and gauge math

**Files:**

- Create: `lib/format/money.ts`, `lib/format/percent.ts`, `lib/format/date.ts`, `lib/charts/gauge.ts`
- Test: `tests/format/money.test.ts`, `tests/format/percent.test.ts`, `tests/format/date.test.ts`, `tests/charts/gauge.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces:
  - `formatBRL(value: number): string` — e.g. `1234.5` → `'R$ 1.234,50'` (normal U+0020 space, not U+00A0).
  - `formatCompactBRL(value: number): string` — e.g. `1234567` → `'R$ 1,23 mi'`; thresholds: `>= 1e6` → `mi`, `>= 1e3` → `mil`, else `formatBRL`.
  - `percentChange(from: number, to: number): number` — returns a percentage number (`5.32`, not `0.0532`); returns `0` when `from === 0`.
  - `formatPercent(value: number, fractionDigits = 2): string` — `14.25` → `'14,25%'`.
  - `formatSignedPercent(value: number, fractionDigits = 2): string` — `5.32` → `'+5,32%'`, `-1.4` → `'-1,40%'`, `0` → `'0,00%'`.
  - `GAUGE_ARC_LENGTH: number` — length of the semicircular gauge arc (radius 50).
  - `gaugeDashOffset(score: number): number` — stroke-dashoffset for a score in 0–100, clamped.
  - `scoreLabel(score: number): 'Baixa' | 'Moderada' | 'Alta'` — `< 40` Baixa, `< 70` Moderada, else Alta.
  - `formatDate(iso: string): string` — `'2028-03-15'` → `'15/03/2028'`.
  - `formatDateTime(iso: string): string` — `'2026-07-26T09:12:00.000Z'` → `'26/07/2026 09:12'`.
  - `formatChartDate(iso: string): string` — compact axis label, `'2026-07-26'` → `'26/07'`.

All three date helpers accept a date-only (`'YYYY-MM-DD'`) or a full ISO datetime string, and format in **UTC** — fixtures carry no real timezone in this phase, so rendering must not shift dates by the viewer's offset. These three are the only date formatters in the codebase; no component defines its own.

The gauge is a fixed semicircle: `viewBox="0 0 120 70"`, center `(60, 60)`, radius `50`, path `M 10 60 A 50 50 0 0 1 110 60`. Only the dash offset varies with the score, which is why the math is a pure function.

- [ ] **Step 1: Write the failing tests**

`tests/format/money.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatBRL, formatCompactBRL } from '@/lib/format/money';

describe('formatBRL', () => {
  it('formats a value with two decimals and pt-BR separators', () => {
    expect(formatBRL(1234.5)).toBe('R$ 1.234,50');
  });

  it('uses a regular space after the currency symbol', () => {
    expect(formatBRL(10)).not.toMatch(/[\u00a0\u202f]/);
    expect(formatBRL(10)).toBe('R$ 10,00');
  });

  it('formats negative values', () => {
    expect(formatBRL(-42.1)).toBe('-R$ 42,10');
  });

  it('formats zero', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
  });
});

describe('formatCompactBRL', () => {
  it('abbreviates millions', () => {
    expect(formatCompactBRL(1234567)).toBe('R$ 1,23 mi');
  });

  it('abbreviates thousands', () => {
    expect(formatCompactBRL(45230)).toBe('R$ 45,23 mil');
  });

  it('falls back to the full format below one thousand', () => {
    expect(formatCompactBRL(870.4)).toBe('R$ 870,40');
  });
});
```

`tests/format/percent.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatPercent, formatSignedPercent, percentChange } from '@/lib/format/percent';

describe('percentChange', () => {
  it('computes a positive change', () => {
    expect(percentChange(100, 105.32)).toBeCloseTo(5.32, 10);
  });

  it('computes a negative change', () => {
    expect(percentChange(200, 180)).toBeCloseTo(-10, 10);
  });

  it('returns zero when the base is zero', () => {
    expect(percentChange(0, 500)).toBe(0);
  });
});

describe('formatPercent', () => {
  it('formats with a comma decimal separator', () => {
    expect(formatPercent(14.25)).toBe('14,25%');
  });

  it('honours the fraction digits argument', () => {
    expect(formatPercent(14.25, 1)).toBe('14,3%');
  });
});

describe('formatSignedPercent', () => {
  it('prefixes a plus sign for gains', () => {
    expect(formatSignedPercent(5.32)).toBe('+5,32%');
  });

  it('keeps the minus sign for losses', () => {
    expect(formatSignedPercent(-1.4)).toBe('-1,40%');
  });

  it('does not sign zero', () => {
    expect(formatSignedPercent(0)).toBe('0,00%');
  });
});
```

`tests/format/date.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { formatChartDate, formatDate, formatDateTime } from '@/lib/format/date';

describe('formatDate', () => {
  it('formats a date-only string as dd/MM/yyyy', () => {
    expect(formatDate('2028-03-15')).toBe('15/03/2028');
  });

  it('accepts a full ISO datetime', () => {
    expect(formatDate('2026-07-26T09:12:00.000Z')).toBe('26/07/2026');
  });

  it('does not shift the day for a late-evening UTC timestamp', () => {
    expect(formatDate('2026-07-25T22:05:00.000Z')).toBe('25/07/2026');
  });
});

describe('formatDateTime', () => {
  it('formats date and time in UTC', () => {
    expect(formatDateTime('2026-07-26T09:12:00.000Z')).toBe('26/07/2026 09:12');
  });

  it('keeps a late-evening UTC time on its own day', () => {
    expect(formatDateTime('2026-07-25T22:05:00.000Z')).toBe('25/07/2026 22:05');
  });
});

describe('formatChartDate', () => {
  it('formats a compact dd/MM axis label', () => {
    expect(formatChartDate('2026-07-26')).toBe('26/07');
  });

  it('accepts a full ISO datetime', () => {
    expect(formatChartDate('2026-01-05T00:00:00.000Z')).toBe('05/01');
  });
});
```

`tests/charts/gauge.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GAUGE_ARC_LENGTH, gaugeDashOffset, scoreLabel } from '@/lib/charts/gauge';

describe('GAUGE_ARC_LENGTH', () => {
  it('is the length of a radius-50 semicircle', () => {
    expect(GAUGE_ARC_LENGTH).toBeCloseTo(Math.PI * 50, 6);
  });
});

describe('gaugeDashOffset', () => {
  it('hides the whole arc at score zero', () => {
    expect(gaugeDashOffset(0)).toBeCloseTo(GAUGE_ARC_LENGTH, 6);
  });

  it('fills the whole arc at score one hundred', () => {
    expect(gaugeDashOffset(100)).toBeCloseTo(0, 6);
  });

  it('fills half the arc at score fifty', () => {
    expect(gaugeDashOffset(50)).toBeCloseTo(GAUGE_ARC_LENGTH / 2, 6);
  });

  it('clamps scores below zero', () => {
    expect(gaugeDashOffset(-20)).toBeCloseTo(GAUGE_ARC_LENGTH, 6);
  });

  it('clamps scores above one hundred', () => {
    expect(gaugeDashOffset(140)).toBeCloseTo(0, 6);
  });
});

describe('scoreLabel', () => {
  it('labels low confidence', () => {
    expect(scoreLabel(0)).toBe('Baixa');
    expect(scoreLabel(39)).toBe('Baixa');
  });

  it('labels moderate confidence', () => {
    expect(scoreLabel(40)).toBe('Moderada');
    expect(scoreLabel(69)).toBe('Moderada');
  });

  it('labels high confidence', () => {
    expect(scoreLabel(70)).toBe('Alta');
    expect(scoreLabel(100)).toBe('Alta');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `@/lib/format/money`, `@/lib/format/percent`, `@/lib/format/date`, `@/lib/charts/gauge`.

- [ ] **Step 3: Implement `lib/format/money.ts`**

```ts
const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Intl inserts a narrow/non-breaking space after "R$"; normalise it so output is predictable. */
function normalizeSpaces(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, ' ');
}

export function formatBRL(value: number): string {
  return normalizeSpaces(brl.format(value));
}

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCompactBRL(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    return `${sign}R$ ${decimal.format(abs / 1_000_000)} mi`;
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${decimal.format(abs / 1_000)} mil`;
  }
  return formatBRL(value);
}
```

- [ ] **Step 4: Implement `lib/format/percent.ts`**

```ts
export function percentChange(from: number, to: number): number {
  if (from === 0) return 0;
  return ((to - from) / Math.abs(from)) * 100;
}

export function formatPercent(value: number, fractionDigits = 2): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
  return `${formatted}%`;
}

export function formatSignedPercent(value: number, fractionDigits = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatPercent(value, fractionDigits)}`;
}
```

- [ ] **Step 5: Implement `lib/charts/gauge.ts`**

```ts
/** Fixed gauge geometry: semicircle of radius 50 in a 120x70 viewBox, centred at (60, 60). */
export const GAUGE_RADIUS = 50;
export const GAUGE_ARC_LENGTH = Math.PI * GAUGE_RADIUS;
export const GAUGE_PATH = 'M 10 60 A 50 50 0 0 1 110 60';

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}

/** stroke-dashoffset for the filled portion of the arc. */
export function gaugeDashOffset(score: number): number {
  return GAUGE_ARC_LENGTH * (1 - clampScore(score) / 100);
}

export function scoreLabel(score: number): 'Baixa' | 'Moderada' | 'Alta' {
  const value = clampScore(score);
  if (value < 40) return 'Baixa';
  if (value < 70) return 'Moderada';
  return 'Alta';
}
```

- [ ] **Step 6: Implement `lib/format/date.ts`**

```ts
/**
 * The only date formatters in the codebase. All format in UTC: fixtures carry
 * no real timezone in this phase, so a viewer's offset must never shift a date.
 */
function toDate(iso: string): Date {
  return new Date(iso.includes('T') ? iso : `${iso}T00:00:00.000Z`);
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const chartDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

/** '2028-03-15' -> '15/03/2028' */
export function formatDate(iso: string): string {
  return dateFormatter.format(toDate(iso));
}

/** '2026-07-26T09:12:00.000Z' -> '26/07/2026 09:12' */
export function formatDateTime(iso: string): string {
  const date = toDate(iso);
  return `${dateFormatter.format(date)} ${timeFormatter.format(date)}`;
}

/** '2026-07-26' -> '26/07' — compact enough for a chart axis. */
export function formatChartDate(iso: string): string {
  return chartDateFormatter.format(toDate(iso));
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npm test
npm run typecheck
```

Expected: all tests PASS, `tsc` clean. If a date assertion is off by one day, `timeZone: 'UTC'` is missing from a formatter.

- [ ] **Step 8: Commit**

```bash
git add lib/format lib/charts tests/format tests/charts
git commit -m "feat: add brl formatting, percent, date helpers and gauge math"
```

---

### Task 3: Domain types, fixtures and the mocked service layer

**Files:**

- Create: `lib/types/index.ts`, `lib/data/random.ts`, `lib/data/fixtures/*.ts` (institutions, accounts, portfolio, fixed-income, crypto, equities, signals, news, rates), `lib/data/services.ts`
- Test: `tests/data/services.test.ts`

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: every type and every service function used by Tasks 4–12. This is the contract for the whole UI.

```ts
// lib/types/index.ts — the exact shape later tasks rely on
export type AssetClass = 'rendaFixa' | 'cripto' | 'acoes';
export type FactorDirection = 'positive' | 'negative' | 'neutral';

export interface TimeSeriesPoint {
  date: string; // ISO 'YYYY-MM-DD'
  value: number;
}

export interface Institution {
  id: string;
  name: string;
  initials: string; // 2 chars, used by InstitutionBadge
  color: string; // hex, the badge background
}

export interface Account {
  id: string;
  institution: Institution;
  type: 'corrente' | 'poupanca' | 'investimento';
  balance: number;
  lastUpdated: string; // ISO datetime
}

export interface BasePosition {
  id: string;
  assetClass: AssetClass;
  name: string;
  institutionId: string;
  quantity: number;
  investedValue: number;
  currentValue: number;
  history: TimeSeriesPoint[];
}

export interface FixedIncomePosition extends BasePosition {
  assetClass: 'rendaFixa';
  issuer: string;
  index: 'CDI' | 'SELIC' | 'IPCA' | 'PRE';
  rateLabel: string; // '110% do CDI', 'IPCA + 6,20%'
  effectiveAnnualRate: number; // 15.57 -> % a.a., used for the CDI comparison chart
  maturity: string; // ISO 'YYYY-MM-DD'
  liquidity: 'diaria' | 'vencimento';
}

export interface CryptoPosition extends BasePosition {
  assetClass: 'cripto';
  symbol: string; // 'BTC'
  priceBrl: number;
  change24h: number; // percentage number
}

export interface EquityPosition extends BasePosition {
  assetClass: 'acoes';
  ticker: string; // 'PETR4'
  kind: 'acao' | 'fii';
  price: number;
  changeDay: number; // percentage number
  dividendYield: number; // percentage number, a.a.
}

export type Position = FixedIncomePosition | CryptoPosition | EquityPosition;

export interface SignalFactor {
  label: string;
  direction: FactorDirection;
  weight: number; // 0-100, relative contribution shown as a bar
}

export interface Signal {
  id: string;
  title: string;
  assetClass: AssetClass;
  score: number; // 0-100
  factors: SignalFactor[];
  summary: string;
  disclaimer: string;
  updatedAt: string; // ISO datetime
}

export type NewsCategory = 'selic' | 'cripto' | 'acoes' | 'bancos';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string; // ISO datetime
  category: NewsCategory;
  summary: string;
}

export interface AllocationSlice {
  assetClass: AssetClass;
  label: string;
  value: number;
  percent: number;
}

export interface PortfolioSummary {
  totalValue: number;
  dayChangeValue: number;
  dayChangePercent: number;
  allocation: AllocationSlice[];
  history: TimeSeriesPoint[]; // 12 monthly points
  averageScore: number;
}

export interface MarketRates {
  selic: number; // 14.25
  cdi: number; // 14.15
  ipca12m: number;
  poupanca: number;
  updatedAt: string;
}
```

```ts
// lib/data/services.ts — the ONLY data entry point for UI code
export function getPortfolioSummary(): Promise<PortfolioSummary>;
export function getAccounts(): Promise<Account[]>;
export function getFixedIncomePositions(): Promise<FixedIncomePosition[]>;
export function getCryptoPositions(): Promise<CryptoPosition[]>;
export function getEquityPositions(): Promise<EquityPosition[]>;
export function getSignals(): Promise<Signal[]>;
export function getSignalById(id: string): Promise<Signal | null>;
export function getNews(): Promise<NewsItem[]>;
export function getMarketRates(): Promise<MarketRates>;
```

Fixture data must be **deterministic** — the history series are generated with a seeded PRNG, not `Math.random()`, so a page refresh does not change the numbers.

- [ ] **Step 1: Write the failing tests**

`tests/data/services.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
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

describe('getPortfolioSummary', () => {
  it('returns twelve monthly history points', async () => {
    const summary = await getPortfolioSummary();
    expect(summary.history).toHaveLength(12);
  });

  it('returns an allocation covering the three asset classes', async () => {
    const summary = await getPortfolioSummary();
    expect(summary.allocation.map((slice) => slice.assetClass).sort()).toEqual([
      'acoes',
      'cripto',
      'rendaFixa',
    ]);
  });

  it('returns allocation percentages summing to about one hundred', async () => {
    const summary = await getPortfolioSummary();
    const total = summary.allocation.reduce((sum, slice) => sum + slice.percent, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it('returns a total value equal to the sum of the allocation slices', async () => {
    const summary = await getPortfolioSummary();
    const total = summary.allocation.reduce((sum, slice) => sum + slice.value, 0);
    expect(summary.totalValue).toBeCloseTo(total, 2);
  });

  it('is deterministic across calls', async () => {
    const [first, second] = await Promise.all([getPortfolioSummary(), getPortfolioSummary()]);
    expect(first).toEqual(second);
  });
});

describe('position services', () => {
  it('returns only fixed income positions', async () => {
    const positions = await getFixedIncomePositions();
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((p) => p.assetClass === 'rendaFixa')).toBe(true);
  });

  it('returns only crypto positions', async () => {
    const positions = await getCryptoPositions();
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((p) => p.assetClass === 'cripto')).toBe(true);
  });

  it('returns only equity positions', async () => {
    const positions = await getEquityPositions();
    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((p) => p.assetClass === 'acoes')).toBe(true);
  });

  it('gives every position a history series', async () => {
    const positions = await getCryptoPositions();
    expect(positions.every((p) => p.history.length >= 30)).toBe(true);
  });
});

describe('getAccounts', () => {
  it('returns the four mocked institutions', async () => {
    const accounts = await getAccounts();
    const names = [...new Set(accounts.map((a) => a.institution.name))].sort();
    expect(names).toEqual(['Banco do Brasil', 'Mercado Pago', 'Nubank', 'Sicredi']);
  });

  it('gives every institution two-character initials', async () => {
    const accounts = await getAccounts();
    expect(accounts.every((a) => a.institution.initials.length === 2)).toBe(true);
  });
});

describe('getSignals', () => {
  it('returns signals with a score inside zero to one hundred', async () => {
    const signals = await getSignals();
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.every((s) => s.score >= 0 && s.score <= 100)).toBe(true);
  });

  it('never returns a signal without factors or a disclaimer', async () => {
    const signals = await getSignals();
    expect(signals.every((s) => s.factors.length >= 2)).toBe(true);
    expect(signals.every((s) => s.disclaimer.trim().length > 0)).toBe(true);
  });
});

describe('getSignalById', () => {
  it('finds an existing signal', async () => {
    const [first] = await getSignals();
    await expect(getSignalById(first.id)).resolves.toEqual(first);
  });

  it('returns null for an unknown id', async () => {
    await expect(getSignalById('does-not-exist')).resolves.toBeNull();
  });
});

describe('getNews', () => {
  it('returns items sorted newest first', async () => {
    const news = await getNews();
    const timestamps = news.map((item) => new Date(item.publishedAt).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });
});

describe('getMarketRates', () => {
  it('anchors on the july 2026 selic and cdi', async () => {
    const rates = await getMarketRates();
    expect(rates.selic).toBe(14.25);
    expect(rates.cdi).toBe(14.15);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `@/lib/data/services`.

- [ ] **Step 3: Create `lib/types/index.ts`**

Copy the type block from the **Interfaces** section above verbatim.

- [ ] **Step 4: Create `lib/data/random.ts`**

```ts
import type { TimeSeriesPoint } from '@/lib/types';

/** Deterministic PRNG so fixtures never change between renders. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * A random walk ending exactly at `endValue`, so the last point always matches
 * the position's current value shown elsewhere in the UI.
 */
export function generateSeries(options: {
  seed: number;
  points: number;
  endValue: number;
  /** Daily/monthly volatility as a fraction, e.g. 0.02 = 2%. */
  volatility: number;
  /** Total drift across the whole series, e.g. 0.18 = +18% from start to end. */
  drift: number;
  step: 'day' | 'month';
  endDate: Date;
}): TimeSeriesPoint[] {
  const { seed, points, endValue, volatility, drift, step, endDate } = options;
  const random = mulberry32(seed);
  const startValue = endValue / (1 + drift);

  const raw: number[] = [];
  let value = startValue;
  for (let i = 0; i < points; i += 1) {
    const growth = drift / Math.max(points - 1, 1);
    const noise = (random() - 0.5) * 2 * volatility;
    value = value * (1 + growth + noise);
    raw.push(value);
  }

  // Rescale so the final point lands exactly on endValue.
  const correction = endValue / raw[raw.length - 1];

  return raw.map((point, index) => {
    const date = new Date(endDate);
    const stepsBack = points - 1 - index;
    if (step === 'day') {
      date.setUTCDate(date.getUTCDate() - stepsBack);
    } else {
      date.setUTCMonth(date.getUTCMonth() - stepsBack);
    }
    return {
      date: isoDate(date),
      value: Number((point * correction).toFixed(2)),
    };
  });
}

/** The "today" every fixture is anchored to, so the app is reproducible. */
export const REFERENCE_DATE = new Date('2026-07-26T12:00:00.000Z');
```

- [ ] **Step 5: Create the fixtures**

`lib/data/fixtures/institutions.ts`:

```ts
import type { Institution } from '@/lib/types';

export const institutions: Institution[] = [
  { id: 'bb', name: 'Banco do Brasil', initials: 'BB', color: '#f5c518' },
  { id: 'nubank', name: 'Nubank', initials: 'NU', color: '#820ad1' },
  { id: 'sicredi', name: 'Sicredi', initials: 'SI', color: '#3fa110' },
  { id: 'mercadopago', name: 'Mercado Pago', initials: 'MP', color: '#00a1e0' },
];

export function institutionById(id: string): Institution {
  const found = institutions.find((institution) => institution.id === id);
  if (!found) throw new Error(`Unknown institution: ${id}`);
  return found;
}
```

`lib/data/fixtures/rates.ts`:

```ts
import type { MarketRates } from '@/lib/types';

/** July 2026 anchors, per the design spec. */
export const marketRates: MarketRates = {
  selic: 14.25,
  cdi: 14.15,
  ipca12m: 4.62,
  poupanca: 6.17,
  updatedAt: '2026-07-25T18:00:00.000Z',
};
```

`lib/data/fixtures/accounts.ts`:

```ts
import type { Account } from '@/lib/types';
import { institutionById } from './institutions';

export const accounts: Account[] = [
  {
    id: 'acc-bb-cc',
    institution: institutionById('bb'),
    type: 'corrente',
    balance: 4820.33,
    lastUpdated: '2026-07-26T09:12:00.000Z',
  },
  {
    id: 'acc-bb-inv',
    institution: institutionById('bb'),
    type: 'investimento',
    balance: 61240.0,
    lastUpdated: '2026-07-26T09:12:00.000Z',
  },
  {
    id: 'acc-nubank-cc',
    institution: institutionById('nubank'),
    type: 'corrente',
    balance: 2310.87,
    lastUpdated: '2026-07-26T08:47:00.000Z',
  },
  {
    id: 'acc-nubank-inv',
    institution: institutionById('nubank'),
    type: 'investimento',
    balance: 38790.5,
    lastUpdated: '2026-07-26T08:47:00.000Z',
  },
  {
    id: 'acc-sicredi-poup',
    institution: institutionById('sicredi'),
    type: 'poupanca',
    balance: 12500.0,
    lastUpdated: '2026-07-25T22:05:00.000Z',
  },
  {
    id: 'acc-mp-cc',
    institution: institutionById('mercadopago'),
    type: 'corrente',
    balance: 1985.24,
    lastUpdated: '2026-07-26T07:30:00.000Z',
  },
];
```

`lib/data/fixtures/fixed-income.ts`:

```ts
import type { FixedIncomePosition } from '@/lib/types';
import { REFERENCE_DATE, generateSeries } from '../random';

export const fixedIncomePositions: FixedIncomePosition[] = [
  {
    id: 'fi-cdb-bb',
    assetClass: 'rendaFixa',
    name: 'CDB Banco do Brasil 2028',
    institutionId: 'bb',
    issuer: 'Banco do Brasil',
    index: 'CDI',
    rateLabel: '110% do CDI',
    effectiveAnnualRate: 15.57,
    maturity: '2028-03-15',
    liquidity: 'vencimento',
    quantity: 1,
    investedValue: 30000,
    currentValue: 34120.45,
    history: generateSeries({
      seed: 101,
      points: 12,
      endValue: 34120.45,
      volatility: 0.002,
      drift: 0.137,
      step: 'month',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'fi-tesouro-selic',
    assetClass: 'rendaFixa',
    name: 'Tesouro Selic 2029',
    institutionId: 'nubank',
    issuer: 'Tesouro Nacional',
    index: 'SELIC',
    rateLabel: 'Selic + 0,08%',
    effectiveAnnualRate: 14.33,
    maturity: '2029-03-01',
    liquidity: 'diaria',
    quantity: 2.14,
    investedValue: 22000,
    currentValue: 24610.9,
    history: generateSeries({
      seed: 102,
      points: 12,
      endValue: 24610.9,
      volatility: 0.002,
      drift: 0.119,
      step: 'month',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'fi-lci-sicredi',
    assetClass: 'rendaFixa',
    name: 'LCI Sicredi 2027',
    institutionId: 'sicredi',
    issuer: 'Sicredi',
    index: 'CDI',
    rateLabel: '96% do CDI (isento de IR)',
    effectiveAnnualRate: 13.58,
    maturity: '2027-09-10',
    liquidity: 'vencimento',
    quantity: 1,
    investedValue: 15000,
    currentValue: 16483.2,
    history: generateSeries({
      seed: 103,
      points: 12,
      endValue: 16483.2,
      volatility: 0.002,
      drift: 0.099,
      step: 'month',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'fi-tesouro-ipca',
    assetClass: 'rendaFixa',
    name: 'Tesouro IPCA+ 2035',
    institutionId: 'bb',
    issuer: 'Tesouro Nacional',
    index: 'IPCA',
    rateLabel: 'IPCA + 6,20%',
    effectiveAnnualRate: 11.11,
    maturity: '2035-05-15',
    liquidity: 'diaria',
    quantity: 4.8,
    investedValue: 18000,
    currentValue: 19245.6,
    history: generateSeries({
      seed: 104,
      points: 12,
      endValue: 19245.6,
      volatility: 0.012,
      drift: 0.069,
      step: 'month',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'fi-cdb-mp',
    assetClass: 'rendaFixa',
    name: 'CDB Mercado Pago liquidez diária',
    institutionId: 'mercadopago',
    issuer: 'Mercado Pago',
    index: 'CDI',
    rateLabel: '100% do CDI',
    effectiveAnnualRate: 14.15,
    maturity: '2027-01-20',
    liquidity: 'diaria',
    quantity: 1,
    investedValue: 8000,
    currentValue: 8570.15,
    history: generateSeries({
      seed: 105,
      points: 12,
      endValue: 8570.15,
      volatility: 0.002,
      drift: 0.071,
      step: 'month',
      endDate: REFERENCE_DATE,
    }),
  },
];
```

`lib/data/fixtures/crypto.ts`:

```ts
import type { CryptoPosition } from '@/lib/types';
import { REFERENCE_DATE, generateSeries } from '../random';

export const cryptoPositions: CryptoPosition[] = [
  {
    id: 'cr-btc',
    assetClass: 'cripto',
    name: 'Bitcoin',
    symbol: 'BTC',
    institutionId: 'mercadopago',
    quantity: 0.184,
    priceBrl: 612430.0,
    change24h: 2.41,
    investedValue: 78000,
    currentValue: 112687.12,
    history: generateSeries({
      seed: 201,
      points: 90,
      endValue: 112687.12,
      volatility: 0.03,
      drift: 0.44,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'cr-eth',
    assetClass: 'cripto',
    name: 'Ethereum',
    symbol: 'ETH',
    institutionId: 'mercadopago',
    quantity: 2.6,
    priceBrl: 21870.4,
    change24h: -1.18,
    investedValue: 52000,
    currentValue: 56863.04,
    history: generateSeries({
      seed: 202,
      points: 90,
      endValue: 56863.04,
      volatility: 0.035,
      drift: 0.094,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'cr-sol',
    assetClass: 'cripto',
    name: 'Solana',
    symbol: 'SOL',
    institutionId: 'nubank',
    quantity: 48,
    priceBrl: 1142.75,
    change24h: 5.62,
    investedValue: 41000,
    currentValue: 54852.0,
    history: generateSeries({
      seed: 203,
      points: 90,
      endValue: 54852.0,
      volatility: 0.05,
      drift: 0.338,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'cr-usdc',
    assetClass: 'cripto',
    name: 'USD Coin',
    symbol: 'USDC',
    institutionId: 'mercadopago',
    quantity: 3200,
    priceBrl: 5.42,
    change24h: 0.09,
    investedValue: 17100,
    currentValue: 17344.0,
    history: generateSeries({
      seed: 204,
      points: 90,
      endValue: 17344.0,
      volatility: 0.004,
      drift: 0.014,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
];
```

`lib/data/fixtures/equities.ts`:

```ts
import type { EquityPosition } from '@/lib/types';
import { REFERENCE_DATE, generateSeries } from '../random';

export const equityPositions: EquityPosition[] = [
  {
    id: 'eq-petr4',
    assetClass: 'acoes',
    name: 'Petrobras PN',
    ticker: 'PETR4',
    kind: 'acao',
    institutionId: 'nubank',
    quantity: 400,
    price: 42.18,
    changeDay: 1.32,
    dividendYield: 11.4,
    investedValue: 15200,
    currentValue: 16872.0,
    history: generateSeries({
      seed: 301,
      points: 90,
      endValue: 16872.0,
      volatility: 0.018,
      drift: 0.11,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'eq-itub4',
    assetClass: 'acoes',
    name: 'Itaú Unibanco PN',
    ticker: 'ITUB4',
    kind: 'acao',
    institutionId: 'bb',
    quantity: 500,
    price: 39.64,
    changeDay: -0.47,
    dividendYield: 7.2,
    investedValue: 17800,
    currentValue: 19820.0,
    history: generateSeries({
      seed: 302,
      points: 90,
      endValue: 19820.0,
      volatility: 0.014,
      drift: 0.113,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'eq-wege3',
    assetClass: 'acoes',
    name: 'WEG ON',
    ticker: 'WEGE3',
    kind: 'acao',
    institutionId: 'nubank',
    quantity: 220,
    price: 58.9,
    changeDay: 0.86,
    dividendYield: 1.6,
    investedValue: 14100,
    currentValue: 12958.0,
    history: generateSeries({
      seed: 303,
      points: 90,
      endValue: 12958.0,
      volatility: 0.016,
      drift: -0.081,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'eq-hglg11',
    assetClass: 'acoes',
    name: 'CSHG Logística FII',
    ticker: 'HGLG11',
    kind: 'fii',
    institutionId: 'bb',
    quantity: 95,
    price: 162.4,
    changeDay: 0.21,
    dividendYield: 9.1,
    investedValue: 14600,
    currentValue: 15428.0,
    history: generateSeries({
      seed: 304,
      points: 90,
      endValue: 15428.0,
      volatility: 0.008,
      drift: 0.057,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
  {
    id: 'eq-mxrf11',
    assetClass: 'acoes',
    name: 'Maxi Renda FII',
    ticker: 'MXRF11',
    kind: 'fii',
    institutionId: 'sicredi',
    quantity: 1400,
    price: 10.32,
    changeDay: -0.29,
    dividendYield: 12.3,
    investedValue: 14000,
    currentValue: 14448.0,
    history: generateSeries({
      seed: 305,
      points: 90,
      endValue: 14448.0,
      volatility: 0.007,
      drift: 0.032,
      step: 'day',
      endDate: REFERENCE_DATE,
    }),
  },
];
```

`lib/data/fixtures/signals.ts` — the standard disclaimer text is defined once and reused:

```ts
import type { Signal } from '@/lib/types';

export const SIGNAL_DISCLAIMER =
  'Não é recomendação de compra. Reflete o cenário atual do mercado.';

export const signals: Signal[] = [
  {
    id: 'sig-cdb-longo',
    title: 'Janela favorável para travar CDI longo',
    assetClass: 'rendaFixa',
    score: 82,
    summary:
      'Com a Selic em 14,25% e o mercado precificando cortes a partir do primeiro trimestre de 2027, prefixar ou travar percentual de CDI acima de 110% em prazos longos tende a ficar mais raro nos próximos meses.',
    factors: [
      {
        label: 'Selic mantida em 14,25% há 3 reuniões do Copom',
        direction: 'positive',
        weight: 30,
      },
      {
        label: 'Curva de juros futuros aponta corte a partir de 2027',
        direction: 'positive',
        weight: 26,
      },
      { label: 'IPCA 12m em 4,62%, dentro da banda da meta', direction: 'positive', weight: 18 },
      {
        label: 'Liquidez apenas no vencimento reduz flexibilidade',
        direction: 'negative',
        weight: 16,
      },
      { label: 'Risco de crédito do emissor acima do Tesouro', direction: 'neutral', weight: 10 },
    ],
    disclaimer: SIGNAL_DISCLAIMER,
    updatedAt: '2026-07-26T06:00:00.000Z',
  },
  {
    id: 'sig-btc-concentracao',
    title: 'Concentração em Bitcoin acima do usual da carteira',
    assetClass: 'cripto',
    score: 47,
    summary:
      'A alta recente elevou a fatia de BTC na carteira sem novos aportes. O cenário segue construtivo, mas a concentração amplifica o efeito de uma correção sobre o patrimônio total.',
    factors: [
      { label: 'BTC acumula +44% em 90 dias', direction: 'positive', weight: 28 },
      {
        label: 'Fluxo positivo em ETFs à vista nas últimas 4 semanas',
        direction: 'positive',
        weight: 22,
      },
      {
        label: 'Participação de cripto subiu para 1/3 do patrimônio',
        direction: 'negative',
        weight: 30,
      },
      {
        label: 'Volatilidade de 90 dias acima da média histórica',
        direction: 'negative',
        weight: 20,
      },
    ],
    disclaimer: SIGNAL_DISCLAIMER,
    updatedAt: '2026-07-26T06:00:00.000Z',
  },
  {
    id: 'sig-fii-juros',
    title: 'FIIs de tijolo pressionados pelo juro real',
    assetClass: 'acoes',
    score: 38,
    summary:
      'Juro real elevado mantém a renda fixa competitiva frente ao dividend yield dos FIIs. O prêmio atual não compensa o risco de vacância no curto prazo.',
    factors: [
      {
        label: 'Juro real acima de 9% torna a renda fixa competitiva',
        direction: 'negative',
        weight: 34,
      },
      { label: 'Vacância do setor logístico em leve alta', direction: 'negative', weight: 24 },
      {
        label: 'Dividend yield de 9,1% acima da média do setor',
        direction: 'positive',
        weight: 24,
      },
      {
        label: 'Contratos atípicos dão previsibilidade de receita',
        direction: 'neutral',
        weight: 18,
      },
    ],
    disclaimer: SIGNAL_DISCLAIMER,
    updatedAt: '2026-07-25T06:00:00.000Z',
  },
  {
    id: 'sig-petr-dividendos',
    title: 'Ciclo de dividendos de estatais em revisão',
    assetClass: 'acoes',
    score: 61,
    summary:
      'O yield projetado segue entre os maiores da bolsa, mas mudanças na política de distribuição e no plano de investimentos adicionam incerteza à previsibilidade do fluxo.',
    factors: [
      { label: 'Dividend yield projetado de 11,4%', direction: 'positive', weight: 32 },
      { label: 'Brent estável na faixa dos últimos 60 dias', direction: 'positive', weight: 22 },
      {
        label: 'Revisão do plano de investimentos pressiona o payout',
        direction: 'negative',
        weight: 28,
      },
      { label: 'Risco político recorrente em estatais', direction: 'negative', weight: 18 },
    ],
    disclaimer: SIGNAL_DISCLAIMER,
    updatedAt: '2026-07-24T06:00:00.000Z',
  },
];
```

`lib/data/fixtures/news.ts` — at least 10 items spread across the four categories, already sorted newest first:

```ts
import type { NewsItem } from '@/lib/types';

export const news: NewsItem[] = [
  {
    id: 'nw-01',
    title: 'Copom mantém Selic em 14,25% pela terceira reunião consecutiva',
    source: 'Banco Central',
    publishedAt: '2026-07-25T21:30:00.000Z',
    category: 'selic',
    summary:
      'Comitê cita inflação de serviços resistente e sinaliza que a manutenção deve durar enquanto as expectativas não convergirem à meta.',
  },
  {
    id: 'nw-02',
    title: 'Fluxo em ETFs de Bitcoin soma quarta semana positiva',
    source: 'Radar Cripto',
    publishedAt: '2026-07-25T14:10:00.000Z',
    category: 'cripto',
    summary:
      'Entrada líquida acumulada no mês reforça a demanda institucional, embora o volume semanal venha desacelerando.',
  },
  {
    id: 'nw-03',
    title: 'Ibovespa fecha em alta puxado por bancos e petróleo',
    source: 'Mercado Hoje',
    publishedAt: '2026-07-25T21:05:00.000Z',
    category: 'acoes',
    summary:
      'Índice sobe com apoio das blue chips; giro financeiro fica acima da média de 30 dias.',
  },
  {
    id: 'nw-04',
    title: 'Bancos ampliam oferta de CDB com liquidez diária acima de 100% do CDI',
    source: 'Valor Investe',
    publishedAt: '2026-07-24T18:40:00.000Z',
    category: 'bancos',
    summary:
      'Disputa por captação leva emissores médios a elevar as taxas oferecidas ao investidor pessoa física.',
  },
  {
    id: 'nw-05',
    title: 'IPCA-15 de julho vem em 0,32% e desacelera na margem',
    source: 'IBGE',
    publishedAt: '2026-07-24T12:00:00.000Z',
    category: 'selic',
    summary: 'Alimentação no domicílio recua, mas serviços seguem pressionando o núcleo do índice.',
  },
  {
    id: 'nw-06',
    title: 'Ethereum avança em atualização de escalabilidade',
    source: 'Radar Cripto',
    publishedAt: '2026-07-23T16:25:00.000Z',
    category: 'cripto',
    summary:
      'Testnet conclui etapa prevista no roteiro; ativação em mainnet segue sem data confirmada.',
  },
  {
    id: 'nw-07',
    title: 'Fundos imobiliários registram saída líquida em julho',
    source: 'Mercado Hoje',
    publishedAt: '2026-07-23T13:15:00.000Z',
    category: 'acoes',
    summary:
      'Juro real elevado mantém a competição da renda fixa por recursos do investidor pessoa física.',
  },
  {
    id: 'nw-08',
    title: 'Open Finance ultrapassa marca de compartilhamentos ativos recorde',
    source: 'Banco Central',
    publishedAt: '2026-07-22T19:00:00.000Z',
    category: 'bancos',
    summary: 'Crescimento vem principalmente de consentimentos para agregadores de investimentos.',
  },
  {
    id: 'nw-09',
    title: 'Tesouro Direto tem captação líquida positiva no semestre',
    source: 'Tesouro Nacional',
    publishedAt: '2026-07-22T11:20:00.000Z',
    category: 'selic',
    summary:
      'Tesouro Selic concentra a maior parte das aplicações, seguido pelos títulos indexados ao IPCA.',
  },
  {
    id: 'nw-10',
    title: 'Petrobras aprova distribuição trimestral dentro da política vigente',
    source: 'Valor Investe',
    publishedAt: '2026-07-21T22:45:00.000Z',
    category: 'acoes',
    summary:
      'Valor por ação fica em linha com as projeções; companhia reitera revisão do plano de investimentos.',
  },
];
```

`lib/data/fixtures/portfolio.ts`:

```ts
import type { AllocationSlice, PortfolioSummary } from '@/lib/types';
import { REFERENCE_DATE, generateSeries } from '../random';
import { cryptoPositions } from './crypto';
import { equityPositions } from './equities';
import { fixedIncomePositions } from './fixed-income';
import { signals } from './signals';

function sum(values: number[]): number {
  return Number(values.reduce((total, value) => total + value, 0).toFixed(2));
}

const fixedIncomeTotal = sum(fixedIncomePositions.map((p) => p.currentValue));
const cryptoTotal = sum(cryptoPositions.map((p) => p.currentValue));
const equityTotal = sum(equityPositions.map((p) => p.currentValue));
const totalValue = sum([fixedIncomeTotal, cryptoTotal, equityTotal]);

const allocation: AllocationSlice[] = [
  {
    assetClass: 'rendaFixa',
    label: 'Renda fixa',
    value: fixedIncomeTotal,
    percent: (fixedIncomeTotal / totalValue) * 100,
  },
  {
    assetClass: 'cripto',
    label: 'Cripto',
    value: cryptoTotal,
    percent: (cryptoTotal / totalValue) * 100,
  },
  {
    assetClass: 'acoes',
    label: 'Ações e FIIs',
    value: equityTotal,
    percent: (equityTotal / totalValue) * 100,
  },
];

const averageScore = Math.round(sum(signals.map((s) => s.score)) / signals.length);

export const portfolioSummary: PortfolioSummary = {
  totalValue,
  dayChangeValue: 1842.67,
  dayChangePercent: 0.51,
  allocation,
  history: generateSeries({
    seed: 1,
    points: 12,
    endValue: totalValue,
    volatility: 0.018,
    drift: 0.223,
    step: 'month',
    endDate: REFERENCE_DATE,
  }),
  averageScore,
};
```

- [ ] **Step 6: Create `lib/data/services.ts`**

```ts
import type {
  Account,
  CryptoPosition,
  EquityPosition,
  FixedIncomePosition,
  MarketRates,
  NewsItem,
  PortfolioSummary,
  Signal,
} from '@/lib/types';
import { accounts } from './fixtures/accounts';
import { cryptoPositions } from './fixtures/crypto';
import { equityPositions } from './fixtures/equities';
import { fixedIncomePositions } from './fixtures/fixed-income';
import { news } from './fixtures/news';
import { portfolioSummary } from './fixtures/portfolio';
import { marketRates } from './fixtures/rates';
import { signals } from './fixtures/signals';

/**
 * Mocked backend. Every function has the signature the real API will have, so
 * when specs 2-4 land only the bodies below change — no UI component is touched.
 *
 * Latency is skipped under test so the suite stays fast.
 */
const MIN_LATENCY_MS = 300;
const MAX_LATENCY_MS = 800;

async function respond<T>(payload: T): Promise<T> {
  if (process.env.NODE_ENV !== 'test') {
    const delay = MIN_LATENCY_MS + Math.random() * (MAX_LATENCY_MS - MIN_LATENCY_MS);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return payload;
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  return respond(portfolioSummary);
}

export async function getAccounts(): Promise<Account[]> {
  return respond(accounts);
}

export async function getFixedIncomePositions(): Promise<FixedIncomePosition[]> {
  return respond(fixedIncomePositions);
}

export async function getCryptoPositions(): Promise<CryptoPosition[]> {
  return respond(cryptoPositions);
}

export async function getEquityPositions(): Promise<EquityPosition[]> {
  return respond(equityPositions);
}

export async function getSignals(): Promise<Signal[]> {
  return respond(signals);
}

export async function getSignalById(id: string): Promise<Signal | null> {
  return respond(signals.find((signal) => signal.id === id) ?? null);
}

export async function getNews(): Promise<NewsItem[]> {
  const sorted = [...news].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
  return respond(sorted);
}

export async function getMarketRates(): Promise<MarketRates> {
  return respond(marketRates);
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npm test
npm run typecheck
```

Expected: all tests PASS. If the allocation-sum assertion fails, the fixture `currentValue` numbers are inconsistent — fix the fixtures, not the test.

- [ ] **Step 8: Commit**

```bash
git add lib/types lib/data tests/data
git commit -m "feat: add domain types, deterministic fixtures and mocked service layer"
```

---

### Task 4: App shell — responsive navigation and the seven routes

**Files:**

- Create: `components.json`, `components/shell/nav-links.ts`, `components/shell/desktop-nav.tsx`, `components/shell/mobile-nav.tsx`, `components/shell/app-shell.tsx`, `lib/utils.ts`
- Create: `app/(dashboard)/layout.tsx` and, for each of `visao-geral`, `renda-fixa`, `cripto`, `acoes`, `sinais`, `noticias`, `ferramentas`: `app/(dashboard)/<route>/page.tsx` plus `loading.tsx` (all except `ferramentas`, which loads no data).
- Modify: none.

**Interfaces:**

- Consumes: the Tailwind token classes from Task 1.
- Produces:
  - `navLinks: { href: string; label: string }[]` from `@/components/shell/nav-links` — the single source of truth for the 7 tabs, consumed by both navs.
  - `cn(...inputs: ClassValue[]): string` from `@/lib/utils`.
  - `<AppShell>{children}</AppShell>` — the page frame.
  - Routes reachable at `/visao-geral`, `/renda-fixa`, `/cripto`, `/acoes`, `/sinais`, `/noticias`, `/ferramentas`, each rendering a placeholder heading that Tasks 6–12 replace.

- [ ] **Step 1: Initialise shadcn/ui**

```bash
npx shadcn@latest init -d
```

When prompted for the base color choose `neutral`. Then verify `components.json` sets `"tsx": true`, `"rsc": true`, and aliases `@/components` and `@/lib/utils`. If `init` overwrites `app/globals.css`, restore the token block from Task 1 Step 5 and keep shadcn's additions below it.

- [ ] **Step 2: Add the shadcn primitives this project uses**

```bash
npx shadcn@latest add card badge button separator tabs sheet skeleton table progress input label
```

- [ ] **Step 3: Create `components/shell/nav-links.ts`**

```ts
export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: '/visao-geral', label: 'Visão geral' },
  { href: '/renda-fixa', label: 'Renda fixa' },
  { href: '/cripto', label: 'Cripto' },
  { href: '/acoes', label: 'Ações' },
  { href: '/sinais', label: 'Análise e sinais' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/ferramentas', label: 'Ferramentas' },
];
```

- [ ] **Step 4: Create `components/shell/desktop-nav.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navLinks } from './nav-links';

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="hidden lg:flex lg:items-center lg:gap-1">
      {navLinks.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm transition-colors',
              active ? 'bg-surface text-text' : 'text-muted hover:bg-surface/60 hover:text-text',
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Create `components/shell/mobile-nav.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { navLinks } from './nav-links';

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Abrir menu"
        className="rounded-md p-2 text-muted hover:bg-surface hover:text-text lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 border-border bg-surface p-0">
        <SheetTitle className="border-b border-border px-5 py-4 text-sm text-muted">
          Navegação
        </SheetTitle>
        <nav aria-label="Navegação principal" className="flex flex-col p-2">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-3 text-base transition-colors',
                  active ? 'bg-bg text-text' : 'text-muted hover:bg-bg hover:text-text',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 6: Create `components/shell/app-shell.tsx`**

```tsx
import Link from 'next/link';
import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <MobileNav />
          <Link href="/visao-geral" className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-gold" aria-hidden />
            <span className="font-mono text-sm tracking-widest text-text">RADAR</span>
          </Link>
          <div className="ml-6 flex-1">
            <DesktopNav />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 7: Create `app/(dashboard)/layout.tsx`**

```tsx
import { AppShell } from '@/components/shell/app-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 8: Create a placeholder page and loading file for each route**

For each of the seven routes create `app/(dashboard)/<route>/page.tsx` following this shape (substitute the title):

```tsx
export default function Page() {
  return <h1 className="text-2xl font-semibold text-text">Visão geral</h1>;
}
```

Titles: `Visão geral`, `Renda fixa`, `Cripto`, `Ações e FIIs`, `Análise e sinais`, `Notícias e radar de mercado`, `Ferramentas`.

For the six data-backed routes (all except `ferramentas`) also create `loading.tsx`:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56 bg-surface" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 bg-surface" />
        ))}
      </div>
      <Skeleton className="h-72 bg-surface" />
    </div>
  );
}
```

- [ ] **Step 9: Verify navigation manually at both breakpoints**

```bash
npm run dev
```

Check, in the browser at `http://localhost:3000`:

1. `/` redirects to `/visao-geral`.
2. At ≥1024px the seven tabs are visible in the header and the active one is highlighted.
3. At 390px width the tabs are hidden, the hamburger appears, opening it lists all seven tabs, and tapping one navigates and closes the sheet.
4. No horizontal scrollbar at 390px.

- [ ] **Step 10: Run the gate**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Expected: all pass; the build lists all seven routes.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add responsive app shell with seven dashboard routes"
```

---

### Task 5: Shared visual primitives, including the signature gauge

**Files:**

- Create: `components/signal/confidence-gauge.tsx`, `components/signal/factor-breakdown.tsx`, `components/signal/signal-disclaimer.tsx`, `components/signal/asset-class-labels.ts`, `components/signal/signal-card.tsx`, `components/common/stat-card.tsx`, `components/common/trend-value.tsx`, `components/common/institution-badge.tsx`, `components/common/section-header.tsx`, `components/common/empty-state.tsx`, `components/common/data-table.tsx`, `components/charts/area-history-chart.tsx`, `components/charts/allocation-chart.tsx`, `components/charts/bar-comparison-chart.tsx`

**Interfaces:**

- Consumes: `formatBRL`, `formatSignedPercent`, `formatPercent` (Task 2); `GAUGE_ARC_LENGTH`, `GAUGE_PATH`, `gaugeDashOffset`, `scoreLabel` (Task 2); types from `@/lib/types` (Task 3); `cn` (Task 4).
- Produces:
  - `<ConfidenceGauge score={number} size="mini" | "large" />`
  - `<FactorBreakdown factors={SignalFactor[]} />`
  - `<SignalDisclaimer text={string} />`
  - `<SignalCard signal={Signal} href?={string} />` — renders gauge + summary + breakdown + disclaimer together
  - `<StatCard label={string} value={string} hint?={ReactNode} />`
  - `<TrendValue value={number} format="percent" | "currency" />`
  - `<InstitutionBadge institution={Institution} />`
  - `<SectionHeader title={string} description?={string} />`
  - `<EmptyState title={string} description={string} />`
  - `<DataTable columns={Column<T>[]} rows={T[]} rowKey={(row: T) => string} />` where `Column<T> = { key: string; header: string; cell: (row: T) => ReactNode; align?: 'left' | 'right' }`
  - `<AreaHistoryChart data={TimeSeriesPoint[]} color?={string} />` (client)
  - `<AllocationChart slices={AllocationSlice[]} />` (client)
  - `<BarComparisonChart data={{ label: string; value: number; highlight?: boolean }[]} unit="percent" />` (client)

`ConfidenceGauge` is the product's signature element — it is the only component allowed to use `--signature-gold`.

- [ ] **Step 1: Create `components/signal/confidence-gauge.tsx`**

```tsx
import { GAUGE_ARC_LENGTH, GAUGE_PATH, gaugeDashOffset, scoreLabel } from '@/lib/charts/gauge';
import { cn } from '@/lib/utils';

interface ConfidenceGaugeProps {
  score: number;
  size?: 'mini' | 'large';
  className?: string;
}

/**
 * The signature arc gauge. `--signature-gold` is reserved for this component:
 * confidence is never expressed with the positive/negative price colors.
 */
export function ConfidenceGauge({ score, size = 'mini', className }: ConfidenceGaugeProps) {
  const rounded = Math.round(score);
  const large = size === 'large';

  return (
    <figure
      className={cn('flex flex-col items-center', className)}
      role="img"
      aria-label={`Score de confiança ${rounded} de 100 — confiança ${scoreLabel(score).toLowerCase()}`}
    >
      <svg
        viewBox="0 0 120 70"
        className={cn(large ? 'w-52' : 'w-28')}
        aria-hidden
        focusable="false"
      >
        <path
          d={GAUGE_PATH}
          fill="none"
          stroke="var(--border)"
          strokeWidth={large ? 9 : 8}
          strokeLinecap="round"
        />
        <path
          d={GAUGE_PATH}
          fill="none"
          stroke="var(--signature-gold)"
          strokeWidth={large ? 9 : 8}
          strokeLinecap="round"
          strokeDasharray={GAUGE_ARC_LENGTH}
          strokeDashoffset={gaugeDashOffset(score)}
        />
        <text
          x="60"
          y="54"
          textAnchor="middle"
          className="fill-[var(--text)] font-mono"
          fontSize={large ? 26 : 22}
        >
          {rounded}
        </text>
      </svg>
      <figcaption className={cn('text-muted', large ? '-mt-1 text-sm' : '-mt-2 text-xs')}>
        Confiança {scoreLabel(score).toLowerCase()}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 2: Create `components/signal/factor-breakdown.tsx`**

```tsx
import type { SignalFactor } from '@/lib/types';
import { cn } from '@/lib/utils';

const directionStyles: Record<
  SignalFactor['direction'],
  { bar: string; sign: string; label: string }
> = {
  positive: { bar: 'bg-positive', sign: '+', label: 'fator favorável' },
  negative: { bar: 'bg-negative', sign: '−', label: 'fator desfavorável' },
  neutral: { bar: 'bg-muted', sign: '=', label: 'fator neutro' },
};

export function FactorBreakdown({ factors }: { factors: SignalFactor[] }) {
  return (
    <div>
      <h3 className="mb-3 text-xs uppercase tracking-wider text-muted">Fatores do score</h3>
      <ul className="space-y-2.5">
        {factors.map((factor) => {
          const style = directionStyles[factor.direction];
          return (
            <li key={factor.label} className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm text-text">
                  <span aria-label={style.label} className="mr-1.5 font-mono text-muted">
                    {style.sign}
                  </span>
                  {factor.label}
                </span>
                <span className="tabular shrink-0 font-mono text-xs text-muted">
                  {factor.weight}%
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={cn('h-full rounded-full', style.bar)}
                  style={{ width: `${factor.weight}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/signal/signal-disclaimer.tsx`**

```tsx
export function SignalDisclaimer({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-border bg-bg px-3 py-2 text-xs leading-relaxed text-muted">
      {text}
    </p>
  );
}
```

- [ ] **Step 4: Create `components/signal/asset-class-labels.ts` and `components/signal/signal-card.tsx`**

`components/signal/asset-class-labels.ts` — shared by the card and, in Task 10, the detail view:

```ts
import type { AssetClass } from '@/lib/types';

export const assetClassLabels: Record<AssetClass, string> = {
  rendaFixa: 'Renda fixa',
  cripto: 'Cripto',
  acoes: 'Ações e FIIs',
};
```

`components/signal/signal-card.tsx`:

```tsx
import Link from 'next/link';
import type { Signal } from '@/lib/types';
import { ConfidenceGauge } from './confidence-gauge';
import { FactorBreakdown } from './factor-breakdown';
import { SignalDisclaimer } from './signal-disclaimer';
import { assetClassLabels } from './asset-class-labels';

/**
 * A Signal is never rendered without its factor breakdown and disclaimer.
 * Keeping all three in one component makes that impossible to forget.
 */
export function SignalCard({ signal, href }: { signal: Signal; href?: string }) {
  const title = href ? (
    <Link href={href} className="text-accent hover:underline">
      {signal.title}
    </Link>
  ) : (
    signal.title
  );

  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="shrink-0 self-center sm:self-start">
          <ConfidenceGauge score={signal.score} size="mini" />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs uppercase tracking-wider text-muted">
              {assetClassLabels[signal.assetClass]}
            </span>
            <h2 className="text-lg leading-snug font-semibold text-text">{title}</h2>
            <p className="text-sm leading-relaxed text-muted">{signal.summary}</p>
          </div>
          <FactorBreakdown factors={signal.factors} />
          <SignalDisclaimer text={signal.disclaimer} />
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 5: Create the common primitives**

`components/common/trend-value.tsx`:

```tsx
import { formatBRL } from '@/lib/format/money';
import { formatSignedPercent } from '@/lib/format/percent';
import { cn } from '@/lib/utils';

interface TrendValueProps {
  value: number;
  format: 'percent' | 'currency';
  className?: string;
}

/** Price movement uses --positive/--negative only. Never the signature gold. */
export function TrendValue({ value, format, className }: TrendValueProps) {
  const text =
    format === 'percent'
      ? formatSignedPercent(value)
      : `${value > 0 ? '+' : ''}${formatBRL(value)}`;

  return (
    <span
      className={cn(
        'tabular font-mono',
        value > 0 && 'text-positive',
        value < 0 && 'text-negative',
        value === 0 && 'text-muted',
        className,
      )}
    >
      {text}
    </span>
  );
}
```

`components/common/stat-card.tsx`:

```tsx
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="tabular mt-2 font-mono text-xl text-text sm:text-2xl">{value}</p>
      {hint ? <div className="mt-1.5 text-sm">{hint}</div> : null}
    </div>
  );
}
```

`components/common/institution-badge.tsx`:

```tsx
import type { Institution } from '@/lib/types';

/** Initials badge — the product never ships official bank logos. */
export function InstitutionBadge({
  institution,
  showName = false,
}: {
  institution: Institution;
  showName?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-xs font-semibold text-white"
        style={{ backgroundColor: institution.color }}
      >
        {institution.initials}
      </span>
      <span className={showName ? 'text-sm text-text' : 'sr-only'}>{institution.name}</span>
    </span>
  );
}
```

`components/common/section-header.tsx`:

```tsx
export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold text-text sm:text-2xl">{title}</h1>
      {description ? <p className="text-sm text-muted">{description}</p> : null}
    </div>
  );
}
```

`components/common/empty-state.tsx`:

```tsx
/** Empty states read as an invitation, never as an error. */
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <p className="text-base text-text">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
```

`components/common/data-table.tsx` — one definition, two layouts, so no screen has to hand-roll a mobile table:

```tsx
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
}

export function DataTable<T>({ columns, rows, rowKey }: DataTableProps<T>) {
  const [primary, ...rest] = columns;

  return (
    <>
      {/* Desktop: real table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted',
                    column.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border last:border-0">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-text',
                      column.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="rounded-lg border border-border bg-surface p-4">
            <div className="mb-3 text-text">{primary.cell(row)}</div>
            <dl className="space-y-1.5">
              {rest.map((column) => (
                <div key={column.key} className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs uppercase tracking-wider text-muted">{column.header}</dt>
                  <dd className="text-sm text-text">{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
```

- [ ] **Step 6: Create the three chart components**

`components/charts/area-history-chart.tsx`:

```tsx
'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimeSeriesPoint } from '@/lib/types';
import { formatBRL, formatCompactBRL } from '@/lib/format/money';
import { formatChartDate } from '@/lib/format/date';

interface AreaHistoryChartProps {
  data: TimeSeriesPoint[];
  color?: string;
  height?: number;
}

export function AreaHistoryChart({
  data,
  color = 'var(--accent)',
  height = 280,
}: AreaHistoryChartProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={formatChartDate}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tickFormatter={formatCompactBRL}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={78}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 12,
            }}
            labelFormatter={(label: string) => formatChartDate(label)}
            formatter={(value: number) => [formatBRL(value), 'Valor']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#areaFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

`components/charts/allocation-chart.tsx`:

```tsx
'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AllocationSlice } from '@/lib/types';
import { formatBRL } from '@/lib/format/money';
import { formatPercent } from '@/lib/format/percent';

const sliceColors: Record<AllocationSlice['assetClass'], string> = {
  rendaFixa: 'var(--accent)',
  cripto: '#a371f7',
  acoes: '#2ea043',
};

export function AllocationChart({ slices }: { slices: AllocationSlice[] }) {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" innerRadius={54} outerRadius={84} paddingAngle={2}>
              {slices.map((slice) => (
                <Cell
                  key={slice.assetClass}
                  fill={sliceColors[slice.assetClass]}
                  stroke="var(--surface)"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 12,
              }}
              formatter={(value: number, _name, item) => [
                formatBRL(value),
                (item?.payload as AllocationSlice)?.label ?? '',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full space-y-2">
        {slices.map((slice) => (
          <li key={slice.assetClass} className="flex items-center gap-3">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: sliceColors[slice.assetClass] }}
            />
            <span className="flex-1 text-sm text-text">{slice.label}</span>
            <span className="tabular font-mono text-sm text-muted">
              {formatPercent(slice.percent, 1)}
            </span>
            <span className="tabular hidden font-mono text-sm text-text sm:inline">
              {formatBRL(slice.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`components/charts/bar-comparison-chart.tsx`:

```tsx
'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPercent } from '@/lib/format/percent';

export interface ComparisonBar {
  label: string;
  value: number;
  highlight?: boolean;
}

export function BarComparisonChart({
  data,
  height = 300,
}: {
  data: ComparisonBar[];
  height?: number;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatPercent(value, 0)}
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={150}
          />
          <Tooltip
            cursor={{ fill: 'var(--border)', opacity: 0.3 }}
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              fontSize: 12,
            }}
            formatter={(value: number) => [formatPercent(value), 'Taxa a.a.']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
            {data.map((bar) => (
              <Cell key={bar.label} fill={bar.highlight ? 'var(--accent)' : 'var(--border)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 7: Verify the gauge renders by temporarily mounting it**

Replace the body of `app/(dashboard)/sinais/page.tsx` with:

```tsx
import { getSignals } from '@/lib/data/services';
import { SignalCard } from '@/components/signal/signal-card';

export default async function SinaisPage() {
  const signals = await getSignals();
  return (
    <div className="space-y-4">
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} />
      ))}
    </div>
  );
}
```

Run `npm run dev` and open `/sinais`. Confirm: the gold arc fills proportionally to each score, the number is centred, factor bars are green/red/grey (never gold), the disclaimer shows on every card, and the layout stacks correctly at 390px. Task 10 replaces this page properly.

- [ ] **Step 8: Run the gate**

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 9: Commit**

```bash
git add components lib
git commit -m "feat: add confidence gauge, shared primitives and chart components"
```

---

### Task 6: Visão Geral tab

**Files:**

- Create: `components/overview/accounts-list.tsx`
- Modify: `app/(dashboard)/visao-geral/page.tsx`

**Interfaces:**

- Consumes: `getPortfolioSummary`, `getAccounts`, `getSignals` (Task 3); `StatCard`, `TrendValue`, `InstitutionBadge`, `SectionHeader` (Task 5); `AllocationChart`, `AreaHistoryChart` (Task 5); `ConfidenceGauge` (Task 5); `formatBRL` (Task 2).
- Produces: `<AccountsList accounts={Account[]} />`.

Screen contents per spec: total consolidated net worth, day change, allocation by asset class, connected accounts (Pier), 12-month evolution chart, portfolio average score gauge.

- [ ] **Step 1: Create `components/overview/accounts-list.tsx`**

```tsx
import type { Account } from '@/lib/types';
import { InstitutionBadge } from '@/components/common/institution-badge';
import { formatBRL } from '@/lib/format/money';
import { formatDateTime } from '@/lib/format/date';

const accountTypeLabels: Record<Account['type'], string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  investimento: 'Investimentos',
};

export function AccountsList({ accounts }: { accounts: Account[] }) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {accounts.map((account) => (
        <li key={account.id} className="flex items-center gap-3 px-4 py-3">
          <InstitutionBadge institution={account.institution} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-text">{account.institution.name}</p>
            <p className="text-xs text-muted">
              {accountTypeLabels[account.type]} · atualizado {formatDateTime(account.lastUpdated)}
            </p>
          </div>
          <span className="tabular shrink-0 font-mono text-sm text-text">
            {formatBRL(account.balance)}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Rewrite `app/(dashboard)/visao-geral/page.tsx`**

```tsx
import { AllocationChart } from '@/components/charts/allocation-chart';
import { AreaHistoryChart } from '@/components/charts/area-history-chart';
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { AccountsList } from '@/components/overview/accounts-list';
import { ConfidenceGauge } from '@/components/signal/confidence-gauge';
import { formatBRL } from '@/lib/format/money';
import { getAccounts, getPortfolioSummary } from '@/lib/data/services';

export default async function VisaoGeralPage() {
  const [summary, accounts] = await Promise.all([getPortfolioSummary(), getAccounts()]);
  const investedTotal = summary.allocation.reduce((total, slice) => total + slice.value, 0);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Visão geral"
        description="Patrimônio consolidado a partir das contas conectadas via Open Finance."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Patrimônio total" value={formatBRL(summary.totalValue)} />
        <StatCard
          label="Variação do dia"
          value={formatBRL(summary.dayChangeValue)}
          hint={<TrendValue value={summary.dayChangePercent} format="percent" />}
        />
        <StatCard label="Total investido" value={formatBRL(investedTotal)} />
        <StatCard label="Contas conectadas" value={String(accounts.length)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-4 text-sm uppercase tracking-wider text-muted">
            Evolução do patrimônio · 12 meses
          </h2>
          <AreaHistoryChart data={summary.history} />
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-5">
          <h2 className="text-sm uppercase tracking-wider text-muted">Score médio da carteira</h2>
          <ConfidenceGauge score={summary.averageScore} size="large" />
          <p className="text-center text-xs leading-relaxed text-muted">
            Média dos sinais ativos. Não é recomendação de compra.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-4 text-sm uppercase tracking-wider text-muted">
            Alocação por classe de ativo
          </h2>
          <AllocationChart slices={summary.allocation} />
        </div>
        <div className="space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-muted">Contas conectadas</h2>
          <AccountsList accounts={accounts} />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify at both breakpoints**

`npm run dev`, open `/visao-geral`:

- Desktop (≥1280px): 4 stat cards in a row, chart + gauge side by side, allocation + accounts side by side.
- Mobile (390px): everything single-column, no horizontal scroll, chart legible, gauge centred.
- The loading skeleton appears briefly on first navigation (simulated latency).
- The gold appears **only** in the score gauge; the day change uses green/red.

- [ ] **Step 4: Run the gate**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/\(dashboard\)/visao-geral components/overview
git commit -m "feat: build visao geral dashboard tab"
```

---

### Task 7: Renda Fixa tab

**Files:**

- Create: `components/fixed-income/fixed-income-table.tsx`
- Modify: `app/(dashboard)/renda-fixa/page.tsx`

**Interfaces:**

- Consumes: `getFixedIncomePositions`, `getMarketRates` (Task 3); `DataTable`, `Column`, `StatCard`, `TrendValue`, `SectionHeader` (Task 5); `BarComparisonChart`, `ComparisonBar` (Task 5); `formatBRL`, `formatPercent`, `percentChange` (Task 2).
- Produces: `<FixedIncomeTable positions={FixedIncomePosition[]} />`.

Screen contents per spec: list of positions, return vs. CDI/Selic, visual comparison between them.

- [ ] **Step 1: Create `components/fixed-income/fixed-income-table.tsx`**

```tsx
import type { FixedIncomePosition } from '@/lib/types';
import { DataTable, type Column } from '@/components/common/data-table';
import { TrendValue } from '@/components/common/trend-value';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';
import { formatDate } from '@/lib/format/date';

const liquidityLabels: Record<FixedIncomePosition['liquidity'], string> = {
  diaria: 'Diária',
  vencimento: 'No vencimento',
};

const columns: Column<FixedIncomePosition>[] = [
  {
    key: 'name',
    header: 'Título',
    cell: (row) => (
      <div>
        <p className="text-sm font-medium text-text">{row.name}</p>
        <p className="text-xs text-muted">{row.issuer}</p>
      </div>
    ),
  },
  { key: 'rate', header: 'Taxa', cell: (row) => <span className="text-sm">{row.rateLabel}</span> },
  {
    key: 'effective',
    header: 'Equivalente a.a.',
    align: 'right',
    cell: (row) => (
      <span className="tabular font-mono text-sm">{formatPercent(row.effectiveAnnualRate)}</span>
    ),
  },
  {
    key: 'liquidity',
    header: 'Liquidez',
    cell: (row) => <span className="text-sm">{liquidityLabels[row.liquidity]}</span>,
  },
  {
    key: 'maturity',
    header: 'Vencimento',
    cell: (row) => <span className="tabular font-mono text-sm">{formatDate(row.maturity)}</span>,
  },
  {
    key: 'value',
    header: 'Valor atual',
    align: 'right',
    cell: (row) => <span className="tabular font-mono text-sm">{formatBRL(row.currentValue)}</span>,
  },
  {
    key: 'return',
    header: 'Rentabilidade',
    align: 'right',
    cell: (row) => (
      <TrendValue
        value={percentChange(row.investedValue, row.currentValue)}
        format="percent"
        className="text-sm"
      />
    ),
  },
];

export function FixedIncomeTable({ positions }: { positions: FixedIncomePosition[] }) {
  return <DataTable columns={columns} rows={positions} rowKey={(row) => row.id} />;
}
```

- [ ] **Step 2: Rewrite `app/(dashboard)/renda-fixa/page.tsx`**

```tsx
import { BarComparisonChart, type ComparisonBar } from '@/components/charts/bar-comparison-chart';
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { EmptyState } from '@/components/common/empty-state';
import { FixedIncomeTable } from '@/components/fixed-income/fixed-income-table';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';
import { getFixedIncomePositions, getMarketRates } from '@/lib/data/services';

export default async function RendaFixaPage() {
  const [positions, rates] = await Promise.all([getFixedIncomePositions(), getMarketRates()]);

  if (positions.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Renda fixa" />
        <EmptyState
          title="Nenhum título de renda fixa por aqui ainda"
          description="Assim que uma aplicação aparecer nas contas conectadas, ela entra nesta lista com a comparação frente ao CDI."
        />
      </div>
    );
  }

  const total = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const invested = positions.reduce((sum, position) => sum + position.investedValue, 0);
  const weightedRate =
    positions.reduce((sum, p) => sum + p.effectiveAnnualRate * p.currentValue, 0) / total;

  const comparison: ComparisonBar[] = [
    ...positions.map((position) => ({
      label: position.name,
      value: position.effectiveAnnualRate,
      highlight: true,
    })),
    { label: 'CDI', value: rates.cdi },
    { label: 'Selic', value: rates.selic },
    { label: 'Poupança', value: rates.poupanca },
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Renda fixa"
        description={`Comparação frente aos indicadores de referência — Selic ${formatPercent(rates.selic)} a.a. e CDI ${formatPercent(rates.cdi)} a.a.`}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total em renda fixa" value={formatBRL(total)} />
        <StatCard
          label="Rentabilidade acumulada"
          value={formatBRL(total - invested)}
          hint={<TrendValue value={percentChange(invested, total)} format="percent" />}
        />
        <StatCard label="Taxa média ponderada" value={`${formatPercent(weightedRate)} a.a.`} />
        <StatCard label="Títulos" value={String(positions.length)} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-wider text-muted">Posições</h2>
        <FixedIncomeTable positions={positions} />
      </section>

      <section className="rounded-lg border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-4 text-sm uppercase tracking-wider text-muted">
          Taxa equivalente a.a. vs. indicadores
        </h2>
        <BarComparisonChart data={comparison} height={340} />
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify at both breakpoints**

Open `/renda-fixa`. Desktop: real table with 7 columns. Mobile (390px): stacked cards, each with the title as heading and the remaining fields as label/value rows; the bar chart labels remain readable (they may truncate — acceptable, but no horizontal page scroll).

- [ ] **Step 4: Run the gate**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/\(dashboard\)/renda-fixa components/fixed-income
git commit -m "feat: build renda fixa tab with cdi comparison"
```

---

### Task 8: Cripto tab

**Files:**

- Create: `components/crypto/crypto-position-card.tsx`
- Modify: `app/(dashboard)/cripto/page.tsx`

**Interfaces:**

- Consumes: `getCryptoPositions` (Task 3); `StatCard`, `TrendValue`, `SectionHeader`, `EmptyState` (Task 5); `AreaHistoryChart` (Task 5); `formatBRL`, `percentChange` (Task 2).
- Produces: `<CryptoPositionCard position={CryptoPosition} />` — a card with symbol, holdings, price, 24h change, and a 90-day series chart.

- [ ] **Step 1: Create `components/crypto/crypto-position-card.tsx`**

```tsx
import type { CryptoPosition } from '@/lib/types';
import { AreaHistoryChart } from '@/components/charts/area-history-chart';
import { TrendValue } from '@/components/common/trend-value';
import { formatBRL } from '@/lib/format/money';
import { percentChange } from '@/lib/format/percent';

const quantityFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 });

export function CryptoPositionCard({ position }: { position: CryptoPosition }) {
  const totalReturn = percentChange(position.investedValue, position.currentValue);
  const trendColor = totalReturn >= 0 ? 'var(--positive)' : 'var(--negative)';

  return (
    <article className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-semibold text-text">{position.symbol}</span>
            <span className="text-sm text-muted">{position.name}</span>
          </div>
          <p className="tabular mt-1 font-mono text-xs text-muted">
            {quantityFormatter.format(position.quantity)} {position.symbol} ·{' '}
            {formatBRL(position.priceBrl)}
          </p>
        </div>
        <div className="text-right">
          <p className="tabular font-mono text-lg text-text">{formatBRL(position.currentValue)}</p>
          <p className="text-sm">
            <TrendValue value={position.change24h} format="percent" className="text-sm" />
            <span className="ml-1.5 text-xs text-muted">24h</span>
          </p>
        </div>
      </header>

      <div className="mt-4">
        <AreaHistoryChart data={position.history} color={trendColor} height={180} />
      </div>

      <footer className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
        <span className="text-muted">Resultado acumulado</span>
        <span className="flex items-baseline gap-2">
          <TrendValue
            value={position.currentValue - position.investedValue}
            format="currency"
            className="text-sm"
          />
          <TrendValue value={totalReturn} format="percent" className="text-xs" />
        </span>
      </footer>
    </article>
  );
}
```

- [ ] **Step 2: Rewrite `app/(dashboard)/cripto/page.tsx`**

```tsx
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { EmptyState } from '@/components/common/empty-state';
import { CryptoPositionCard } from '@/components/crypto/crypto-position-card';
import { formatBRL } from '@/lib/format/money';
import { percentChange } from '@/lib/format/percent';
import { getCryptoPositions } from '@/lib/data/services';

export default async function CriptoPage() {
  const positions = await getCryptoPositions();

  if (positions.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Cripto" />
        <EmptyState
          title="Nenhuma posição em cripto por enquanto"
          description="Quando um ativo digital aparecer nas contas conectadas, o histórico de preço e a variação entram aqui."
        />
      </div>
    );
  }

  const total = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const invested = positions.reduce((sum, position) => sum + position.investedValue, 0);
  const best = positions.reduce((top, position) =>
    position.change24h > top.change24h ? position : top,
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Cripto"
        description="Carteira de ativos digitais com preço em BRL e série dos últimos 90 dias."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total em cripto" value={formatBRL(total)} />
        <StatCard
          label="Resultado acumulado"
          value={formatBRL(total - invested)}
          hint={<TrendValue value={percentChange(invested, total)} format="percent" />}
        />
        <StatCard
          label="Maior alta em 24h"
          value={best.symbol}
          hint={<TrendValue value={best.change24h} format="percent" />}
        />
        <StatCard label="Ativos" value={String(positions.length)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {positions.map((position) => (
          <CryptoPositionCard key={position.id} position={position} />
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Verify at both breakpoints**

Open `/cripto`. Desktop: two cards per row. Mobile: one per row, chart still readable at 180px height, header wraps instead of overflowing.

- [ ] **Step 4: Run the gate**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/\(dashboard\)/cripto components/crypto
git commit -m "feat: build cripto tab with per-asset price history"
```

---

### Task 9: Ações e FIIs tab

**Files:**

- Create: `components/equities/equities-table.tsx`, `components/equities/kind-filter.tsx`
- Modify: `app/(dashboard)/acoes/page.tsx`

**Interfaces:**

- Consumes: `getEquityPositions` (Task 3); `DataTable`, `Column`, `StatCard`, `TrendValue`, `SectionHeader`, `EmptyState` (Task 5); `formatBRL`, `formatPercent`, `percentChange` (Task 2).
- Produces:
  - `<EquitiesTable positions={EquityPosition[]} />`
  - `<KindFilter positions={EquityPosition[]} />` — a Client Component owning the `'todos' | 'acao' | 'fii'` filter state and rendering `EquitiesTable` with the filtered rows.

- [ ] **Step 1: Create `components/equities/equities-table.tsx`**

```tsx
import type { EquityPosition } from '@/lib/types';
import { DataTable, type Column } from '@/components/common/data-table';
import { TrendValue } from '@/components/common/trend-value';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';

const kindLabels: Record<EquityPosition['kind'], string> = { acao: 'Ação', fii: 'FII' };

const columns: Column<EquityPosition>[] = [
  {
    key: 'ticker',
    header: 'Ativo',
    cell: (row) => (
      <div>
        <p className="font-mono text-sm font-semibold text-text">{row.ticker}</p>
        <p className="text-xs text-muted">
          {row.name} · {kindLabels[row.kind]}
        </p>
      </div>
    ),
  },
  {
    key: 'quantity',
    header: 'Quantidade',
    align: 'right',
    cell: (row) => <span className="tabular font-mono text-sm">{row.quantity}</span>,
  },
  {
    key: 'price',
    header: 'Preço',
    align: 'right',
    cell: (row) => <span className="tabular font-mono text-sm">{formatBRL(row.price)}</span>,
  },
  {
    key: 'changeDay',
    header: 'Dia',
    align: 'right',
    cell: (row) => <TrendValue value={row.changeDay} format="percent" className="text-sm" />,
  },
  {
    key: 'value',
    header: 'Valor atual',
    align: 'right',
    cell: (row) => <span className="tabular font-mono text-sm">{formatBRL(row.currentValue)}</span>,
  },
  {
    key: 'return',
    header: 'Resultado',
    align: 'right',
    cell: (row) => (
      <TrendValue
        value={percentChange(row.investedValue, row.currentValue)}
        format="percent"
        className="text-sm"
      />
    ),
  },
  {
    key: 'dy',
    header: 'DY a.a.',
    align: 'right',
    cell: (row) => (
      <span className="tabular font-mono text-sm text-muted">
        {formatPercent(row.dividendYield, 1)}
      </span>
    ),
  },
];

export function EquitiesTable({ positions }: { positions: EquityPosition[] }) {
  return <DataTable columns={columns} rows={positions} rowKey={(row) => row.id} />;
}
```

- [ ] **Step 2: Create `components/equities/kind-filter.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { EquityPosition } from '@/lib/types';
import { EquitiesTable } from './equities-table';
import { cn } from '@/lib/utils';

type Kind = 'todos' | 'acao' | 'fii';

const options: { value: Kind; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'acao', label: 'Ações' },
  { value: 'fii', label: 'FIIs' },
];

export function KindFilter({ positions }: { positions: EquityPosition[] }) {
  const [kind, setKind] = useState<Kind>('todos');
  const filtered = kind === 'todos' ? positions : positions.filter((p) => p.kind === kind);

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Filtrar por tipo de ativo" className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={kind === option.value}
            onClick={() => setKind(option.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              kind === option.value
                ? 'bg-surface text-text'
                : 'text-muted hover:bg-surface/60 hover:text-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <EquitiesTable positions={filtered} />
    </div>
  );
}
```

- [ ] **Step 3: Rewrite `app/(dashboard)/acoes/page.tsx`**

```tsx
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { TrendValue } from '@/components/common/trend-value';
import { EmptyState } from '@/components/common/empty-state';
import { KindFilter } from '@/components/equities/kind-filter';
import { formatBRL } from '@/lib/format/money';
import { formatPercent, percentChange } from '@/lib/format/percent';
import { getEquityPositions } from '@/lib/data/services';

export default async function AcoesPage() {
  const positions = await getEquityPositions();

  if (positions.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Ações e FIIs" />
        <EmptyState
          title="Nenhuma posição em renda variável ainda"
          description="Ações e fundos imobiliários das contas conectadas aparecem aqui com desempenho e dividend yield."
        />
      </div>
    );
  }

  const total = positions.reduce((sum, position) => sum + position.currentValue, 0);
  const invested = positions.reduce((sum, position) => sum + position.investedValue, 0);
  const weightedDy =
    positions.reduce((sum, p) => sum + p.dividendYield * p.currentValue, 0) / total;
  const dayChange = positions.reduce((sum, p) => sum + p.changeDay * p.currentValue, 0) / total;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Ações e FIIs"
        description="Carteira de renda variável com desempenho acumulado e dividend yield."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total em renda variável" value={formatBRL(total)} />
        <StatCard
          label="Resultado acumulado"
          value={formatBRL(total - invested)}
          hint={<TrendValue value={percentChange(invested, total)} format="percent" />}
        />
        <StatCard
          label="Variação do dia"
          value={formatPercent(dayChange)}
          hint={<TrendValue value={dayChange} format="percent" />}
        />
        <StatCard label="DY médio ponderado" value={`${formatPercent(weightedDy, 1)} a.a.`} />
      </section>

      <section>
        <KindFilter positions={positions} />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Verify at both breakpoints**

Open `/acoes`. Confirm the filter switches between 5 / 3 / 2 rows, the table becomes stacked cards on mobile, and the day-change column colors correctly.

- [ ] **Step 5: Run the gate**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add app/\(dashboard\)/acoes components/equities
git commit -m "feat: build acoes tab with asset kind filter"
```

---

### Task 10: Análise e Sinais tab, with signal detail route

**Files:**

- Create: `app/(dashboard)/sinais/[id]/page.tsx`, `app/(dashboard)/sinais/[id]/loading.tsx`, `components/signal/signal-detail.tsx`
- Modify: `app/(dashboard)/sinais/page.tsx` (replacing the Task 5 temporary version)

**Interfaces:**

- Consumes: `getSignals`, `getSignalById` (Task 3); `SignalCard`, `ConfidenceGauge`, `FactorBreakdown`, `SignalDisclaimer` (Task 5); `SectionHeader`, `EmptyState`, `StatCard` (Task 5).
- Produces: `<SignalDetail signal={Signal} />` — the large-gauge detail view.

This is the differentiating screen. Both the list and the detail show the breakdown and disclaimer.

- [ ] **Step 1: Rewrite `app/(dashboard)/sinais/page.tsx`**

```tsx
import { SectionHeader } from '@/components/common/section-header';
import { StatCard } from '@/components/common/stat-card';
import { EmptyState } from '@/components/common/empty-state';
import { SignalCard } from '@/components/signal/signal-card';
import { getSignals } from '@/lib/data/services';

export default async function SinaisPage() {
  const signals = await getSignals();

  if (signals.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader title="Análise e sinais" />
        <EmptyState
          title="Nenhum cenário relevante no momento"
          description="O radar continua acompanhando juros, cripto e renda variável. Assim que um cenário se formar, ele aparece aqui com o score e os fatores por trás dele."
        />
      </div>
    );
  }

  const average = Math.round(
    signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length,
  );
  const highest = signals.reduce((top, signal) => (signal.score > top.score ? signal : top));

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Análise e sinais"
        description="Cenários identificados a partir dos indicadores, do histórico de mercado e das notícias. Cada score vem com os fatores que o compõem."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Cenários ativos" value={String(signals.length)} />
        <StatCard label="Score médio" value={String(average)} />
        <StatCard label="Maior confiança" value={String(highest.score)} hint={highest.title} />
      </section>

      <section className="space-y-4">
        {signals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} href={`/sinais/${signal.id}`} />
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/signal/signal-detail.tsx`**

```tsx
import Link from 'next/link';
import type { Signal } from '@/lib/types';
import { ConfidenceGauge } from './confidence-gauge';
import { FactorBreakdown } from './factor-breakdown';
import { SignalDisclaimer } from './signal-disclaimer';
import { assetClassLabels } from './asset-class-labels';
import { formatDateTime } from '@/lib/format/date';

export function SignalDetail({ signal }: { signal: Signal }) {
  return (
    <div className="space-y-6">
      <Link href="/sinais" className="inline-block text-sm text-accent hover:underline">
        ← Voltar para os sinais
      </Link>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6">
          <ConfidenceGauge score={signal.score} size="large" />
          <p className="text-xs uppercase tracking-wider text-muted">
            {assetClassLabels[signal.assetClass]}
          </p>
          <p className="text-xs text-muted">Atualizado em {formatDateTime(signal.updatedAt)}</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl leading-snug font-semibold text-text">{signal.title}</h1>
            <p className="leading-relaxed text-muted">{signal.summary}</p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-5">
            <FactorBreakdown factors={signal.factors} />
          </div>

          <SignalDisclaimer text={signal.disclaimer} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/(dashboard)/sinais/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import { SignalDetail } from '@/components/signal/signal-detail';
import { getSignalById } from '@/lib/data/services';

export default async function SignalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = await getSignalById(id);

  if (!signal) notFound();

  return <SignalDetail signal={signal} />;
}
```

- [ ] **Step 4: Create `app/(dashboard)/sinais/[id]/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40 bg-surface" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-64 bg-surface" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4 bg-surface" />
          <Skeleton className="h-20 bg-surface" />
          <Skeleton className="h-56 bg-surface" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify at both breakpoints**

Open `/sinais`, click each signal title, confirm the detail loads with the large gauge, breakdown, and disclaimer, and the back link returns. Visit `/sinais/inexistente` and confirm the 404. On mobile the detail stacks: gauge card first, then title, breakdown, disclaimer.

Check the non-negotiable: no score anywhere on either screen appears without its factor list and disclaimer.

- [ ] **Step 6: Run the gate**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 7: Commit**

```bash
git add app/\(dashboard\)/sinais components/signal
git commit -m "feat: build sinais tab with signal detail route"
```

---

### Task 11: Notícias e Radar de Mercado tab

**Files:**

- Create: `components/news/news-feed.tsx`
- Modify: `app/(dashboard)/noticias/page.tsx`

**Interfaces:**

- Consumes: `getNews` (Task 3); `SectionHeader`, `EmptyState` (Task 5).
- Produces: `<NewsFeed items={NewsItem[]} />` — a Client Component owning the category filter state (`'todas' | NewsCategory`).

- [ ] **Step 1: Create `components/news/news-feed.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { NewsCategory, NewsItem } from '@/lib/types';
import { EmptyState } from '@/components/common/empty-state';
import { formatDateTime } from '@/lib/format/date';
import { cn } from '@/lib/utils';

type Filter = 'todas' | NewsCategory;

const filters: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'selic', label: 'Selic e Copom' },
  { value: 'cripto', label: 'Cripto' },
  { value: 'acoes', label: 'Ações' },
  { value: 'bancos', label: 'Bancos' },
];

const categoryLabels: Record<NewsCategory, string> = {
  selic: 'Selic e Copom',
  cripto: 'Cripto',
  acoes: 'Ações',
  bancos: 'Bancos',
};

export function NewsFeed({ items }: { items: NewsItem[] }) {
  const [filter, setFilter] = useState<Filter>('todas');
  const visible = filter === 'todas' ? items : items.filter((item) => item.category === filter);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors',
              filter === option.value
                ? 'bg-surface text-text'
                : 'text-muted hover:bg-surface/60 hover:text-text',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Nada nesta categoria por enquanto"
          description="Troque o filtro ou volte mais tarde — o feed é atualizado ao longo do dia."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li key={item.id} className="rounded-lg border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="rounded border border-border px-2 py-0.5 uppercase tracking-wider">
                  {categoryLabels[item.category]}
                </span>
                <span>{item.source}</span>
                <span aria-hidden>·</span>
                <time dateTime={item.publishedAt} className="tabular font-mono">
                  {formatDateTime(item.publishedAt)}
                </time>
              </div>
              <h2 className="mt-2 text-base leading-snug font-medium text-text">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `app/(dashboard)/noticias/page.tsx`**

```tsx
import { SectionHeader } from '@/components/common/section-header';
import { NewsFeed } from '@/components/news/news-feed';
import { getNews } from '@/lib/data/services';

export default async function NoticiasPage() {
  const items = await getNews();

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Notícias e radar de mercado"
        description="O contexto por trás dos sinais: juros, cripto, renda variável e sistema bancário."
      />
      <NewsFeed items={items} />
    </div>
  );
}
```

- [ ] **Step 3: Verify at both breakpoints**

Open `/noticias`. Confirm items are newest first, each filter narrows the list, an empty category shows the invitation-style empty state, and on mobile the filter row scrolls horizontally without the page scrolling.

- [ ] **Step 4: Run the gate**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add app/\(dashboard\)/noticias components/news
git commit -m "feat: build noticias tab with category filter"
```

---

### Task 12: Ferramentas tab — comparator, contribution simulator, projection

**Files:**

- Create: `lib/tools/projection.ts`, `components/tools/cdb-comparator.tsx`, `components/tools/contribution-simulator.tsx`
- Modify: `app/(dashboard)/ferramentas/page.tsx`
- Test: `tests/tools/projection.test.ts`

**Interfaces:**

- Consumes: `getMarketRates` (Task 3); `SectionHeader` (Task 5); `AreaHistoryChart` (Task 5); `BarComparisonChart`, `ComparisonBar` (Task 5); `formatBRL`, `formatPercent` (Task 2); `Input`, `Label` from shadcn (Task 4).
- Produces:
  - `monthlyRate(annualRatePercent: number): number` — compounded monthly rate as a fraction. `14.15` → `≈ 0.011072`.
  - `futureValue(options: { initial: number; monthlyContribution: number; annualRatePercent: number; months: number }): number`
  - `projectionSeries(options: same): TimeSeriesPoint[]` — one point per month, `date` counted forward from `REFERENCE_DATE`, length `months + 1` (month 0 = initial).
  - `<CdbComparator cdi={number} selic={number} poupanca={number} />` (client)
  - `<ContributionSimulator defaultAnnualRate={number} />` (client)

This is the only task with new business math, so it is test-first.

- [ ] **Step 1: Write the failing tests**

`tests/tools/projection.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { futureValue, monthlyRate, projectionSeries } from '@/lib/tools/projection';

describe('monthlyRate', () => {
  it('compounds an annual rate down to a monthly rate', () => {
    expect(monthlyRate(12.6825)).toBeCloseTo(0.01, 6); // (1.01)^12 - 1
  });

  it('returns zero for a zero annual rate', () => {
    expect(monthlyRate(0)).toBe(0);
  });
});

describe('futureValue', () => {
  it('keeps the initial amount when the rate is zero and there are no contributions', () => {
    expect(
      futureValue({ initial: 1000, monthlyContribution: 0, annualRatePercent: 0, months: 24 }),
    ).toBeCloseTo(1000, 2);
  });

  it('sums plain contributions when the rate is zero', () => {
    expect(
      futureValue({ initial: 1000, monthlyContribution: 100, annualRatePercent: 0, months: 12 }),
    ).toBeCloseTo(2200, 2);
  });

  it('compounds the initial amount over one year', () => {
    expect(
      futureValue({
        initial: 1000,
        monthlyContribution: 0,
        annualRatePercent: 12.6825,
        months: 12,
      }),
    ).toBeCloseTo(1126.83, 1);
  });

  it('compounds contributions made at the end of each month', () => {
    // 100 per month at 1% a.m. for 3 months: 100*1.01^2 + 100*1.01 + 100
    expect(
      futureValue({ initial: 0, monthlyContribution: 100, annualRatePercent: 12.6825, months: 3 }),
    ).toBeCloseTo(303.01, 1);
  });
});

describe('projectionSeries', () => {
  it('returns one point per month plus the starting point', () => {
    const series = projectionSeries({
      initial: 1000,
      monthlyContribution: 100,
      annualRatePercent: 10,
      months: 12,
    });
    expect(series).toHaveLength(13);
  });

  it('starts at the initial amount', () => {
    const series = projectionSeries({
      initial: 1000,
      monthlyContribution: 100,
      annualRatePercent: 10,
      months: 6,
    });
    expect(series[0].value).toBeCloseTo(1000, 2);
  });

  it('ends at the future value', () => {
    const options = {
      initial: 1000,
      monthlyContribution: 100,
      annualRatePercent: 10,
      months: 6,
    };
    const series = projectionSeries(options);
    expect(series[series.length - 1].value).toBeCloseTo(futureValue(options), 1);
  });

  it('increases monotonically with positive contributions', () => {
    const series = projectionSeries({
      initial: 500,
      monthlyContribution: 250,
      annualRatePercent: 14.15,
      months: 24,
    });
    for (let i = 1; i < series.length; i += 1) {
      expect(series[i].value).toBeGreaterThan(series[i - 1].value);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm test
```

Expected: FAIL — cannot resolve `@/lib/tools/projection`.

- [ ] **Step 3: Implement `lib/tools/projection.ts`**

```ts
import type { TimeSeriesPoint } from '@/lib/types';
import { REFERENCE_DATE } from '@/lib/data/random';

export interface ProjectionOptions {
  initial: number;
  monthlyContribution: number;
  annualRatePercent: number;
  months: number;
}

/** Annual percentage -> monthly compounded fraction. */
export function monthlyRate(annualRatePercent: number): number {
  return (1 + annualRatePercent / 100) ** (1 / 12) - 1;
}

/** Contributions are made at the end of each month. */
export function futureValue(options: ProjectionOptions): number {
  const { initial, monthlyContribution, annualRatePercent, months } = options;
  const rate = monthlyRate(annualRatePercent);

  let balance = initial;
  for (let month = 0; month < months; month += 1) {
    balance = balance * (1 + rate) + monthlyContribution;
  }
  return balance;
}

export function projectionSeries(options: ProjectionOptions): TimeSeriesPoint[] {
  const { initial, monthlyContribution, annualRatePercent, months } = options;
  const rate = monthlyRate(annualRatePercent);
  const series: TimeSeriesPoint[] = [];

  let balance = initial;
  for (let month = 0; month <= months; month += 1) {
    if (month > 0) balance = balance * (1 + rate) + monthlyContribution;
    const date = new Date(REFERENCE_DATE);
    date.setUTCMonth(date.getUTCMonth() + month);
    series.push({ date: date.toISOString().slice(0, 10), value: Number(balance.toFixed(2)) });
  }
  return series;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npm test
```

Expected: all PASS.

- [ ] **Step 5: Create `components/tools/cdb-comparator.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { BarComparisonChart, type ComparisonBar } from '@/components/charts/bar-comparison-chart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBRL } from '@/lib/format/money';
import { formatPercent } from '@/lib/format/percent';
import { futureValue } from '@/lib/tools/projection';

interface CdbComparatorProps {
  cdi: number;
  selic: number;
  poupanca: number;
}

export function CdbComparator({ cdi, selic, poupanca }: CdbComparatorProps) {
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(24);
  const [cdiPercent, setCdiPercent] = useState(110);

  const options = [
    { label: `CDB ${cdiPercent}% do CDI`, rate: (cdi * cdiPercent) / 100, highlight: true },
    { label: 'Tesouro Selic', rate: selic + 0.08 },
    { label: 'Poupança', rate: poupanca },
  ];

  const bars: ComparisonBar[] = options.map((option) => ({
    label: option.label,
    value: option.rate,
    highlight: option.highlight,
  }));

  return (
    <section className="space-y-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div>
        <h2 className="text-base font-medium text-text">Comparador CDB × Tesouro × poupança</h2>
        <p className="mt-1 text-sm text-muted">
          Comparação bruta de taxas, sem imposto de renda. Não é recomendação de compra.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cdb-amount" className="text-xs uppercase tracking-wider text-muted">
            Valor aplicado
          </Label>
          <Input
            id="cdb-amount"
            type="number"
            min={0}
            step={100}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value) || 0)}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdb-months" className="text-xs uppercase tracking-wider text-muted">
            Prazo (meses)
          </Label>
          <Input
            id="cdb-months"
            type="number"
            min={1}
            max={360}
            value={months}
            onChange={(event) => setMonths(Math.max(1, Number(event.target.value) || 1))}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cdb-percent" className="text-xs uppercase tracking-wider text-muted">
            % do CDI
          </Label>
          <Input
            id="cdb-percent"
            type="number"
            min={1}
            max={200}
            value={cdiPercent}
            onChange={(event) => setCdiPercent(Math.max(1, Number(event.target.value) || 1))}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
      </div>

      <BarComparisonChart data={bars} height={200} />

      <ul className="divide-y divide-border rounded-md border border-border">
        {options.map((option) => {
          const result = futureValue({
            initial: amount,
            monthlyContribution: 0,
            annualRatePercent: option.rate,
            months,
          });
          return (
            <li key={option.label} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm text-text">{option.label}</p>
                <p className="tabular font-mono text-xs text-muted">
                  {formatPercent(option.rate)} a.a.
                </p>
              </div>
              <div className="text-right">
                <p className="tabular font-mono text-sm text-text">{formatBRL(result)}</p>
                <p className="tabular font-mono text-xs text-muted">
                  +{formatBRL(result - amount)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 6: Create `components/tools/contribution-simulator.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { AreaHistoryChart } from '@/components/charts/area-history-chart';
import { StatCard } from '@/components/common/stat-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBRL } from '@/lib/format/money';
import { formatPercent } from '@/lib/format/percent';
import { futureValue, projectionSeries } from '@/lib/tools/projection';

export function ContributionSimulator({ defaultAnnualRate }: { defaultAnnualRate: number }) {
  const [initial, setInitial] = useState(20000);
  const [monthlyContribution, setMonthlyContribution] = useState(1500);
  const [years, setYears] = useState(10);
  const [annualRatePercent, setAnnualRatePercent] = useState(defaultAnnualRate);

  const months = years * 12;
  const options = { initial, monthlyContribution, annualRatePercent, months };
  const total = futureValue(options);
  const contributed = initial + monthlyContribution * months;
  const series = projectionSeries(options);

  return (
    <section className="space-y-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div>
        <h2 className="text-base font-medium text-text">Simulador de aporte mensal</h2>
        <p className="mt-1 text-sm text-muted">
          Projeção com taxa constante e aportes no fim de cada mês. Cenário ilustrativo, não é
          recomendação de compra.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="sim-initial" className="text-xs uppercase tracking-wider text-muted">
            Valor inicial
          </Label>
          <Input
            id="sim-initial"
            type="number"
            min={0}
            step={500}
            value={initial}
            onChange={(event) => setInitial(Number(event.target.value) || 0)}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-monthly" className="text-xs uppercase tracking-wider text-muted">
            Aporte mensal
          </Label>
          <Input
            id="sim-monthly"
            type="number"
            min={0}
            step={100}
            value={monthlyContribution}
            onChange={(event) => setMonthlyContribution(Number(event.target.value) || 0)}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-years" className="text-xs uppercase tracking-wider text-muted">
            Prazo (anos)
          </Label>
          <Input
            id="sim-years"
            type="number"
            min={1}
            max={40}
            value={years}
            onChange={(event) => setYears(Math.max(1, Number(event.target.value) || 1))}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sim-rate" className="text-xs uppercase tracking-wider text-muted">
            Taxa a.a. (%)
          </Label>
          <Input
            id="sim-rate"
            type="number"
            min={0}
            max={100}
            step={0.05}
            value={annualRatePercent}
            onChange={(event) => setAnnualRatePercent(Number(event.target.value) || 0)}
            className="tabular border-border bg-bg font-mono text-text"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Patrimônio projetado" value={formatBRL(total)} />
        <StatCard label="Total aportado" value={formatBRL(contributed)} />
        <StatCard
          label="Juros acumulados"
          value={formatBRL(total - contributed)}
          hint={
            <span className="text-muted">
              {formatPercent(contributed > 0 ? ((total - contributed) / contributed) * 100 : 0, 1)}{' '}
              sobre o aportado
            </span>
          }
        />
      </div>

      <AreaHistoryChart data={series} color="var(--accent)" height={260} />
    </section>
  );
}
```

- [ ] **Step 7: Rewrite `app/(dashboard)/ferramentas/page.tsx`**

```tsx
import { SectionHeader } from '@/components/common/section-header';
import { CdbComparator } from '@/components/tools/cdb-comparator';
import { ContributionSimulator } from '@/components/tools/contribution-simulator';
import { getMarketRates } from '@/lib/data/services';

export default async function FerramentasPage() {
  const rates = await getMarketRates();

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Ferramentas"
        description="Simulações com as taxas de referência do momento. Nenhuma delas é recomendação de compra."
      />
      <CdbComparator cdi={rates.cdi} selic={rates.selic} poupanca={rates.poupanca} />
      <ContributionSimulator defaultAnnualRate={rates.cdi} />
    </div>
  );
}
```

Note: this page awaits data, so add `app/(dashboard)/ferramentas/loading.tsx` using the same skeleton body as Task 4 Step 8.

- [ ] **Step 8: Verify at both breakpoints**

Open `/ferramentas`. Change each input and confirm the numbers and charts update live, that clearing an input does not produce `NaN`, and that at 390px the inputs stack one per row with no overflow.

- [ ] **Step 9: Run the gate**

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

- [ ] **Step 10: Commit**

```bash
git add app/\(dashboard\)/ferramentas components/tools lib/tools tests/tools
git commit -m "feat: build ferramentas tab with comparator and contribution simulator"
```

---

### Task 13: Final pass — README, commands documentation and full verification

**Files:**

- Modify: `README.md`, `CLAUDE.md`
- Create: `app/not-found.tsx`

**Interfaces:**

- Consumes: everything built so far.
- Produces: no new code interfaces.

- [ ] **Step 1: Create `app/not-found.tsx`**

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-mono text-sm tracking-widest text-muted">404</p>
      <h1 className="text-xl text-text">Essa tela não existe no radar</h1>
      <Link href="/visao-geral" className="text-sm text-accent hover:underline">
        Voltar para a visão geral
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Update the Commands section of `CLAUDE.md`**

Replace the current "## Comandos" section body with:

```markdown
## Comandos

- `npm run dev` — servidor de desenvolvimento em http://localhost:3000
- `npm run build` — build de produção
- `npm run lint` — ESLint (next/core-web-vitals + TypeScript)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — testes unitários (Vitest)
- `npm run format` — Prettier em todo o repositório
```

- [ ] **Step 3: Update `README.md`**

Document: what Radar is (one paragraph, taken from the spec's Contexto), the four sub-projects and which one is built, the commands above, and the note that all data is mocked in `lib/data/services.ts`.

- [ ] **Step 4: Full manual sweep at both breakpoints**

With `npm run dev` running, visit every route at 1440px and again at 390px:

`/`, `/visao-geral`, `/renda-fixa`, `/cripto`, `/acoes`, `/sinais`, `/sinais/sig-cdb-longo`, `/noticias`, `/ferramentas`, `/rota-inexistente`.

Confirm for each:

1. Loading skeleton appears then real content renders.
2. No horizontal page scroll at 390px.
3. Money is BRL-formatted everywhere; numbers use the mono font.
4. Gold appears only on confidence gauges.
5. Every score has a visible factor breakdown and disclaimer.
6. No bank logos — only initials badges.

- [ ] **Step 5: Run the full gate one last time**

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run format:check
```

All five must pass. Paste the actual output when reporting completion — do not claim success without it.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "docs: document radar frontend commands and add 404 page"
```

---

## Spec Coverage Check

| Spec requirement                                                   | Task                             |
| ------------------------------------------------------------------ | -------------------------------- |
| Next.js 15 App Router + TS + Tailwind + shadcn/ui                  | 1, 4                             |
| Geist Sans / Geist Mono                                            | 1                                |
| Recharts                                                           | 5                                |
| No global state; Server Components + local `useState`              | 4, 9, 11, 12                     |
| No auth; app opens straight on the dashboard                       | 1 (`/` → `/visao-geral`)         |
| App at repository root                                             | 1                                |
| Mocked service layer with 300–800ms latency                        | 3                                |
| `lib/data/fixtures/`, `lib/data/services.ts`, `lib/types/` layout  | 3                                |
| Account / Position / Signal / NewsItem contracts                   | 3                                |
| Four mocked institutions, initials badges, no logos                | 3, 5, 6                          |
| Simulated history (12 months + daily prices)                       | 3                                |
| Selic 14,25% / CDI 14,15% anchors                                  | 3, 7, 12                         |
| Nine design tokens, gold reserved for score                        | 1, 5                             |
| Arc gauge signature element (mini + large)                         | 2, 5, 10                         |
| Factor breakdown + disclaimer on every signal                      | 5, 10                            |
| Desktop top-nav, mobile hamburger                                  | 4                                |
| Genuine responsiveness on every screen                             | 4, 6, 7, 8, 9, 10, 11, 12, 13    |
| Tab 1 Visão Geral                                                  | 6                                |
| Tab 2 Renda Fixa                                                   | 7                                |
| Tab 3 Cripto                                                       | 8                                |
| Tab 4 Ações / FIIs                                                 | 9                                |
| Tab 5 Análise e Sinais                                             | 10                               |
| Tab 6 Notícias                                                     | 11                               |
| Tab 7 Simulador / Ferramentas                                      | 12                               |
| Real `loading.tsx` / Suspense skeletons                            | 4, 10, 12                        |
| Empty states as invitation                                         | 5, 7, 8, 9, 10, 11               |
| No API error handling this phase                                   | — (deliberate)                   |
| `tsc` + lint as quality gate                                       | every task                       |
| Unit tests: BRL formatting, percent change, gauge fill             | 2                                |
| Dates as ISO string in fixtures, no timezone to resolve this phase | 2 (UTC-only formatters), 3       |
| Omnia legacy deleted                                               | already done in commit `626a87c` |
