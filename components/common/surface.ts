/**
 * The single "surface card" recipe. It used to be copied across ~10 files with
 * three different padding strategies (`p-4`, `p-5`, `p-4 sm:p-5`) for the same
 * visual pattern — the responsive pair is the right one and is now the only one.
 *
 * Elevation (see also the comment in `app/globals.css`): `--bg` is the page
 * background *and* the recessed well inside a card (input, disclaimer, active
 * menu item); `--surface` is the card raised above the page.
 */
export const surfaceClass = 'rounded-lg border border-border bg-surface';

export const surfaceCardClass = `${surfaceClass} p-4 sm:p-5`;
