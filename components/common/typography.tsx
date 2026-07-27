import { cn } from '@/lib/utils';

/**
 * The heading ladder. Four steps, most to least prominent. Every heading and
 * every label picks one — an `<h2>` is never styled ad hoc, which is how the
 * same semantic element ended up with three different visual weights depending
 * on which component it was copied from.
 *
 * 1. `SectionHeader` (h1)  — the route title, one per page.
 * 2. `PanelTitle`          — the title of the *content inside* a card (news item,
 *    tool, signal). The loudest thing in the card it lives in.
 * 3. `SubsectionTitle`     — names a region of the page (a chart, a list). Quiet,
 *    but text-coloured and semibold so it outranks a data label.
 * 4. `DataLabel`           — names *one value* (stat card, table header, score
 *    factor). Smallest, muted, normal weight. Never used as a heading.
 *
 * Steps 3 and 4 share the uppercase/tracking treatment of the Terminal Escuro
 * direction; what tells them apart is size, weight and colour — not shape.
 */

type PanelTitleTag = 'h2' | 'h3';

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
        'leading-snug text-text',
        size === 'lg' ? 'text-lg font-semibold' : 'text-base font-medium',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export const subsectionTitleClass = 'text-sm font-semibold uppercase tracking-wider text-text';

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
export const dataLabelClass = 'text-xs font-normal uppercase tracking-wider text-muted';

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
