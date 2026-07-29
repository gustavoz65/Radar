import { describe, expect, it } from 'vitest';
import { categorise, parseFeed, stripHtml } from '@/lib/market/news';

/** Shape captured from the live InfoMoney feed. */
const feed = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item>
    <title>Copom mantém a Selic em 14,25%</title>
    <link>https://exemplo.com/copom</link>
    <pubDate>Tue, 28 Jul 2026 10:00:00 +0000</pubDate>
    <category><![CDATA[Economia]]></category>
    <description><![CDATA[<p><img src="x.jpg" />O comit&ecirc; decidiu manter.</p>]]></description>
  </item>
  <item>
    <title>Ir&#227; lan&#231;a m&#237;sseis</title>
    <link>https://exemplo.com/geopolitica</link>
    <pubDate>Tue, 28 Jul 2026 09:00:00 +0000</pubDate>
  </item>
</channel></rss>`;

describe('categorise', () => {
  it('files monetary policy under selic even though it says "Banco Central"', () => {
    expect(categorise('Banco Central sobe a Selic')).toBe('selic');
  });

  it('recognises crypto', () => {
    expect(categorise('Bitcoin supera os R$ 300 mil')).toBe('cripto');
  });

  it('recognises a named bank', () => {
    expect(categorise('Nubank anuncia resultado trimestral')).toBe('bancos');
  });

  it('recognises equities', () => {
    expect(categorise('Ibovespa fecha em alta')).toBe('acoes');
  });

  it('sends unmatched news to mercado, not to acoes', () => {
    // Filing geopolitics under Brazilian equities made the tab's filter useless.
    expect(categorise('Irã lança mísseis contra forças dos EUA')).toBe('mercado');
  });
});

describe('stripHtml', () => {
  it('removes tags and entities', () => {
    expect(stripHtml('<p>O comit&ecirc;  decidiu</p>')).toBe('O comit decidiu');
  });
});

describe('parseFeed', () => {
  it('reads every item with its date and category', () => {
    const items = parseFeed(feed, 'InfoMoney');

    expect(items).toHaveLength(2);
    expect(items[0].title).toBe('Copom mantém a Selic em 14,25%');
    expect(items[0].category).toBe('selic');
    expect(items[0].source).toBe('InfoMoney');
    expect(items[0].publishedAt.toISOString()).toBe('2026-07-28T10:00:00.000Z');
    expect(items[0].summary).toContain('decidiu manter');
  });

  it('keys an item by its url so two feeds do not duplicate it', () => {
    expect(parseFeed(feed, 'InfoMoney')[0].externalId).toBe('https://exemplo.com/copom');
  });

  it('tolerates an item with no description', () => {
    expect(parseFeed(feed, 'InfoMoney')[1].summary).toBeNull();
  });

  it('skips items missing a title, link or date instead of storing junk', () => {
    const broken = `<rss><channel><item><title>Sem link</title></item></channel></rss>`;
    expect(parseFeed(broken, 'X')).toEqual([]);
  });

  it('returns nothing for a feed with no items', () => {
    expect(parseFeed('<rss><channel></channel></rss>', 'X')).toEqual([]);
  });
});
