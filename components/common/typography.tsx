import { cn } from '@/lib/utils';

/**
 * The heading ladder: SectionHeader (route title) > PanelTitle (inside a card) >
 * SubsectionTitle (a region) > DataLabel (one value). Every heading picks a step,
 * because styling `<h2>` ad hoc is how one element ended up with three weights.
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
