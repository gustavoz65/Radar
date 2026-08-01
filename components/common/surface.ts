/**
 * The surface recipes. One card pattern, one recess pattern, one instrument
 * pattern — a card used to be copied across ~10 files with three different
 * padding strategies for the same visual result.
 *
 * Elevation (see also `app/globals.css`): `--bg` is the page, `--surface` a
 * card raised above it, `--surface-raised` a hover/nested step, and `--well`
 * the recess *inside* a card (input, disclaimer, active menu item).
 */

export const surfaceClass = 'rounded-lg border border-border bg-surface';

export const surfaceCardClass = `${surfaceClass} p-4 sm:p-5`;

/** A recess inside a card: inputs, disclaimers, the selected item in a list. */
export const wellClass = 'rounded-md border border-border bg-well';

/**
 * Instrument panel — the card variant for a surface that carries a *reading*
 * (a score, the consolidated patrimônio) rather than a list. Corner brackets
 * brighten two opposite corners so it reads as framed, not merely bordered.
 * `relative` is part of the recipe because the brackets are positioned, and
 * the recipe never adds `overflow-hidden`: the brackets sit *on* the border at
 * -1px and clipping would eat them.
 */
export const instrumentCardClass = `${surfaceCardClass} bracketed relative`;

/** Cards that respond to the pointer. Kept apart so static cards stay inert. */
export const interactiveSurfaceClass =
  'transition-[border-color,background-color,transform] duration-(--dur-2) ease-(--ease-out-radar) hover:border-border-strong hover:bg-surface-raised';
