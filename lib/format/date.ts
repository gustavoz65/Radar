/**
 * The only date formatters in the codebase, split by what the value means.
 *
 * A calendar date (vencimento, maturidade) has no time and formats in UTC, where
 * it was anchored — an offset would move the day. An instant (hora de um sync,
 * publicação) formats in the reader's zone: 00:34 UTC é 20:34 do dia anterior em
 * Cuiabá, e formatar isso em UTC mostrava a data de amanhã.
 */

/**
 * The runtime's zone, which is the user's machine in dev. APP_TIME_ZONE overrides
 * it for a deploy, where the server runs in UTC and would show the wrong evening.
 */
function appTimeZone(): string {
  return process.env.APP_TIME_ZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function toDate(iso: string): Date {
  return new Date(iso.includes('T') ? iso : `${iso}T00:00:00.000Z`);
}

const calendarDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const chartDate = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

const instantByZone = new Map<string, Intl.DateTimeFormat>();

function instantFormatter(): Intl.DateTimeFormat {
  const zone = appTimeZone();
  let formatter = instantByZone.get(zone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: zone,
    });
    instantByZone.set(zone, formatter);
  }

  return formatter;
}

/** A calendar date: '2028-03-15' -> '15/03/2028'. */
export function formatDate(iso: string): string {
  return calendarDate.format(toDate(iso));
}

/** A moment in time, in the reader's zone: '2026-07-30T00:34:00.000Z' -> '29/07/2026 20:34' at UTC-4. */
export function formatDateTime(iso: string): string {
  return instantFormatter().format(toDate(iso)).replace(',', '');
}

/** A calendar date, compact for a chart axis: '2026-07-26' -> '26/07'. */
export function formatChartDate(iso: string): string {
  return chartDate.format(toDate(iso));
}
