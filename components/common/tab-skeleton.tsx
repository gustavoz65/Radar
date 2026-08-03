import { cn } from '@/lib/utils';
import { staggerClass } from '@/components/common/motion';

type TabSkeletonShape =
  | { kind: 'chart' }
  | { kind: 'table' }
  | { kind: 'cards' }
  | { kind: 'list' }
  | { kind: 'panels' }
  | { kind: 'chart-and-gauge' };

interface TabSkeletonProps {
  statCount?: number;
  body: TabSkeletonShape | TabSkeletonShape[];
}

/**
 * A placeholder that keeps the app's border and elevation instead of shadcn's
 * grey block, so the loading screen already has the shape of the screen that
 * replaces it. It breathes rather than pulses: `animate-pulse` swings opacity
 * hard enough to read as a flashing error on a dark field.
 */
function Block({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-shimmer rounded-lg border border-border bg-surface', className)}
    />
  );
}

function ShapeBlock({ shape }: { shape: TabSkeletonShape }) {
  switch (shape.kind) {
    case 'chart':
      return <Block className="h-72" />;
    case 'table':
      return <Block className="h-72" />;
    case 'cards':
      return (
        <div className={cn('grid gap-4 xl:grid-cols-2', staggerClass)}>
          <Block className="h-48" />
          <Block className="h-48" />
        </div>
      );
    case 'list':
      return (
        <div className={cn('space-y-3', staggerClass)}>
          <Block className="h-6 w-56 border-transparent bg-surface-raised" />
          <Block className="h-24" />
          <Block className="h-24" />
          <Block className="h-24" />
        </div>
      );
    case 'panels':
      return (
        <div className={cn('space-y-4', staggerClass)}>
          <Block className="h-56" />
          <Block className="h-56" />
        </div>
      );
    case 'chart-and-gauge':
      return (
        <div className={cn('grid gap-6 lg:grid-cols-[2fr_1fr]', staggerClass)}>
          <Block className="h-72" />
          <Block className="h-72" />
        </div>
      );
  }
}

export function TabSkeleton({ statCount = 4, body }: TabSkeletonProps) {
  const shapes = Array.isArray(body) ? body : [body];

  return (
    <div className="space-y-8" role="status" aria-label="Carregando">
      {/* Mirrors SectionHeader: eyebrow, display title, rule. */}
      <div className="space-y-5">
        <div className="space-y-3">
          <Block className="h-2.5 w-28 border-transparent bg-surface-raised" />
          <Block className="h-10 w-72 max-w-full border-transparent bg-surface-raised" />
        </div>
        <div className="h-px bg-border" />
      </div>
      {statCount > 0 && (
        <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', staggerClass)}>
          {Array.from({ length: statCount }).map((_, index) => (
            <Block key={`stat-${index}`} className="h-28" />
          ))}
        </div>
      )}
      {shapes.map((shape, index) => (
        <ShapeBlock key={`${shape.kind}-${index}`} shape={shape} />
      ))}
    </div>
  );
}
