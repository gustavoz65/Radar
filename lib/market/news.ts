import 'server-only';
import { XMLParser } from 'fast-xml-parser';
import type { NewsCategory } from '@/lib/types';

export interface RawNews {
  externalId: string;
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: NewsCategory;
  summary: string | null;
}

/** Feeds verified to return items; InfoMoney's section feeds are published but empty. */
const FEEDS: { source: string; url: string }[] = [
  { source: 'InfoMoney', url: 'https://www.infomoney.com.br/feed/' },
  { source: 'Investing.com', url: 'https://br.investing.com/rss/news.rss' },
  { source: 'Investing.com', url: 'https://br.investing.com/rss/stock.rss' },
];

const KEYWORDS: { category: NewsCategory; terms: string[] }[] = [
  {
    category: 'selic',
    terms: ['selic', 'copom', 'juros', 'ipca', 'inflação', 'banco central', 'política monetária'],
  },
  {
    category: 'cripto',
    terms: ['cripto', 'bitcoin', 'btc', 'ethereum', 'blockchain', 'stablecoin', 'binance'],
  },
  {
    category: 'bancos',
    terms: ['nubank', 'itaú', 'bradesco', 'santander', 'caixa econômica', 'banco do brasil'],
  },
  {
    category: 'acoes',
    terms: ['ibovespa', 'b3', 'dividendo', 'fii', 'bolsa', 'ação', 'ações', 'balanço'],
  },
];

/**
 * Deterministic keyword match, no AI. Order matters: monetary policy has to win
 * over the generic "banco" in "Banco Central". Unmatched news goes to `mercado` —
 * defaulting to `acoes` filed geopolitics under Brazilian equities.
 */
export function categorise(title: string, tags: string[] = []): NewsCategory {
  const haystack = `${title} ${tags.join(' ')}`.toLowerCase();

  for (const { category, terms } of KEYWORDS) {
    if (terms.some((term) => haystack.includes(term))) return category;
  }
  return 'mercado';
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^<>]*>/g, ' ')
    .replace(/&[a-z]{2,8};/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: 'cdata',
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** RSS text nodes arrive as a string, a number, or a `{ cdata }` wrapper. */
function text(node: unknown): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (node && typeof node === 'object' && 'cdata' in node) {
    const inner = (node as { cdata: unknown }).cdata;
    return typeof inner === 'string' || typeof inner === 'number' ? String(inner) : '';
  }
  return '';
}

export function parseFeed(xml: string, source: string): RawNews[] {
  const doc = parser.parse(xml) as { rss?: { channel?: { item?: unknown } } };
  const items = asArray(doc.rss?.channel?.item) as Record<string, unknown>[];

  return items.flatMap((item) => {
    const title = stripHtml(text(item.title));
    const url = text(item.link).trim();
    const published = new Date(text(item.pubDate));

    if (!title || !url || Number.isNaN(published.getTime())) return [];

    const tags = asArray(item.category as unknown).map(text);
    const summary = stripHtml(text(item.description)).slice(0, 500);

    return [
      {
        externalId: url,
        title: title.slice(0, 500),
        source,
        url: url.slice(0, 500),
        publishedAt: published,
        category: categorise(title, tags),
        summary: summary || null,
      },
    ];
  });
}

/** Reads every feed, tolerating individual failures; one dead feed is not an outage. */
export async function fetchNews(): Promise<{ items: RawNews[]; failures: string[] }> {
  const settled = await Promise.allSettled(
    FEEDS.map(async ({ source, url }) => {
      const response = await fetch(url, {
        headers: { 'user-agent': 'radar/1.0', Accept: 'application/rss+xml, application/xml' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`${source}: status ${response.status}`);
      return parseFeed(await response.text(), source);
    }),
  );

  const items: RawNews[] = [];
  const failures: string[] = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') items.push(...result.value);
    else failures.push(result.reason instanceof Error ? result.reason.message : 'feed falhou');
  }

  // Two feeds can carry the same article; the URL is the identity.
  const unique = new Map(items.map((item) => [item.externalId, item]));
  return { items: [...unique.values()], failures };
}
