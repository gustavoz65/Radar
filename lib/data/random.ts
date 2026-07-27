/**
 * The "today" the remaining fixtures and the Ferramentas projection are anchored
 * to, so the app stays reproducible.
 *
 * This file used to also export `mulberry32` and `generateSeries`, which existed
 * only to synthesise the account and position fixtures. Those fixtures are gone —
 * accounts and positions come from the database now — so the generators went with
 * them.
 */
export const REFERENCE_DATE = new Date('2026-07-26T12:00:00.000Z');
