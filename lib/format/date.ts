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
