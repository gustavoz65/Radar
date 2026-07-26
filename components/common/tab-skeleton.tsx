import { Skeleton } from '@/components/ui/skeleton';

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

function ShapeBlock({ shape }: { shape: TabSkeletonShape }) {
  switch (shape.kind) {
    case 'chart':
      return <Skeleton className="h-72 bg-surface" />;
    case 'table':
      return <Skeleton className="h-72 bg-surface" />;
    case 'cards':
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-48 bg-surface" />
          <Skeleton className="h-48 bg-surface" />
        </div>
      );
    case 'list':
      return (
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 bg-surface" />
          <Skeleton className="h-24 bg-surface" />
          <Skeleton className="h-24 bg-surface" />
          <Skeleton className="h-24 bg-surface" />
        </div>
      );
    case 'panels':
      return (
        <div className="space-y-4">
          <Skeleton className="h-56 bg-surface" />
          <Skeleton className="h-56 bg-surface" />
        </div>
      );
    case 'chart-and-gauge':
      return (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Skeleton className="h-72 bg-surface" />
          <Skeleton className="h-72 bg-surface" />
        </div>
      );
  }
}

export function TabSkeleton({ statCount = 4, body }: TabSkeletonProps) {
  const shapes = Array.isArray(body) ? body : [body];

  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56 bg-surface" />
      {statCount > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: statCount }).map((_, index) => (
            <Skeleton key={`stat-${index}`} className="h-28 bg-surface" />
          ))}
        </div>
      )}
      {shapes.map((shape, index) => (
        <ShapeBlock key={`${shape.kind}-${index}`} shape={shape} />
      ))}
    </div>
  );
}
