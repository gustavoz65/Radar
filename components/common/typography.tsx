import { cn } from '@/lib/utils';

/**
 * The heading ladder: DisplayTitle (route title) > PanelTitle (inside a card) >
 * SubsectionTitle (a region) > DataLabel (one value), with Eyebrow as the mono
 * kicker that sits above a display title. Every heading picks a step, because
 * styling `<h2>` ad hoc is how one element ended up with three weights.
 *
 * The display step is deliberately quieter than white: a 3rem headline in
 * `--text` competes with the numbers it introduces, so it renders in
 * `--text-dim` and lets `emphasis` promote the one word that matters.
 */

type PanelTitleTag = 'h2' | 'h3';

export const displayTitleClass =
  'font-sans text-[clamp(1.875rem,1.1rem+2.9vw,3rem)] leading-[1.04] font-medium tracking-[-0.035em] text-dim';

export function DisplayTitle({
  as: Tag = 'h1',
  highlight,
  className,
  children,
}: {
  as?: 'h1' | 'h2';
  /** Substring promoted to full `--text` — the word the eye should land on. */
  highlight?: string;
  className?: string;
  children: string;
}) {
  const at = highlight ? children.indexOf(highlight) : -1;

  return (
    <Tag className={cn(displayTitleClass, className)}>
      {at === -1 ? (
        children
      ) : (
        <>
          {children.slice(0, at)}
          <span className="text-text">{highlight}</span>
          {children.slice(at + highlight!.length)}
        </>
      )}
    </Tag>
  );
}

export const eyebrowClass =
  'inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-faint';

export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p className={cn(eyebrowClass, className)}>
      <span aria-hidden className="inline-block h-px w-4 bg-border-strong" />
      {children}
    </p>
  );
}

export function PanelTitle({
  as: Tag = 'h2',
  size = 'md',
  className,
  children,
}: {
  as?: PanelTitleTag;
  size?: 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={cn(
        'leading-snug tracking-[-0.01em] text-text',
        size === 'lg' ? 'text-lg font-semibold' : 'text-base font-medium',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * The leading tick is a `::before` rather than a flex child so the class keeps
 * working on callers that pass `block` or set their own margins.
 */
export const subsectionTitleClass =
  "text-xs font-semibold uppercase tracking-[0.14em] text-text before:mr-2.5 before:inline-block before:h-3 before:w-px before:bg-border-strong before:align-[-0.1em] before:content-['']";

export function SubsectionTitle({
  as: Tag = 'h2',
  className,
  children,
}: {
  as?: PanelTitleTag;
  className?: string;
  children: React.ReactNode;
}) {
  return <Tag className={cn(subsectionTitleClass, className)}>{children}</Tag>;
}

/**
 * Exported as a string too, because some places need to apply the style to an
 * element that already exists (`<th>`, shadcn's `<Label>`) rather than render one.
 */
export const dataLabelClass =
  'font-mono text-[0.6875rem] font-normal uppercase tracking-[0.14em] text-faint';

export function DataLabel({
  as: Tag = 'p',
  className,
  children,
}: {
  as?: 'p' | 'span' | 'dt';
  className?: string;
  children: React.ReactNode;
}) {
  return <Tag className={cn(dataLabelClass, className)}>{children}</Tag>;
}
