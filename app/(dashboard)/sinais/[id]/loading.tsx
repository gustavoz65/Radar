import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40 bg-surface" />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Skeleton className="h-64 bg-surface" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4 bg-surface" />
          <Skeleton className="h-20 bg-surface" />
          <Skeleton className="h-56 bg-surface" />
        </div>
      </div>
    </div>
  );
}
