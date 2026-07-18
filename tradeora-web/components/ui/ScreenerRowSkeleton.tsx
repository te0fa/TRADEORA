import { Skeleton } from './Skeleton';

export function ScreenerRowSkeleton() {
  return (
    <div className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-white/5">
      <div className="space-y-1">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16 self-center" />
      <Skeleton className="h-4 w-12 self-center" />
      <Skeleton className="h-4 w-10 self-center hidden md:block" />
      <Skeleton className="h-5 w-16 self-center" rounded="full" />
      <Skeleton className="h-4 w-10 self-center hidden md:block" />
    </div>
  );
}
