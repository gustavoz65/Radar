/**
 * The two button recipes this app actually uses. shadcn's `Button` is still
 * there for primitives that embed it (Sheet's close), but a screen's own
 * actions go through these so "the blue button" means one thing everywhere.
 */

const base =
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-[background-color,border-color,color,transform] duration-(--dur-1) ease-(--ease-out-radar) active:translate-y-px disabled:pointer-events-none disabled:opacity-60';

/** The one action a screen wants you to take. At most one per screen. */
export const primaryActionClass = `${base} bg-accent px-4 py-2 text-bg hover:bg-accent/85`;

/** Everything else: secondary, reversible, or repeated per row. */
export const secondaryActionClass = `${base} border border-border bg-surface px-4 py-2 text-text hover:border-border-strong hover:bg-surface-raised`;

/** Destructive actions stay text-weight — a red block invites a misclick. */
export const dangerActionClass = `${base} px-2 py-1 text-negative hover:bg-negative/10`;
