import { cn } from '@/lib/utils';

/**
 * The motion vocabulary. Three verbs, no more:
 *   rise    something arrives (a route, a card, a row)
 *   fade    something arrives without moving (text under a heading that rose)
 *   stagger a set arrives in reading order
 *
 * All three are pure CSS, so they work inside server components and cost no
 * JavaScript. Durations, easing and the stagger step live in `app/globals.css`;
 * the reduced-motion block there is the single switch that disables them.
 */

/** Put on a container to animate its direct children in sequence. */
export const staggerClass = 'stagger';

export function Reveal({
  as: Tag = 'div',
  variant = 'rise',
  index = 0,
  className,
  children,
}: {
  as?: 'div' | 'section' | 'li' | 'article';
  variant?: 'rise' | 'fade';
  /** Position in a sequence; multiplied by `--stagger-step` for the delay. */
  index?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      style={index ? ({ '--stagger-index': index } as React.CSSProperties) : undefined}
      className={cn(variant === 'rise' ? 'motion-rise' : 'motion-fade', className)}
    >
      {children}
    </Tag>
  );
}
