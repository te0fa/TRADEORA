import { Skeleton } from './Skeleton';

export function StockCardSkeleton() {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex justify-between mb-3">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" rounded="full" />
        <Skeleton className="h-6 w-20" rounded="full" />
      </div>
    </div>
  );
}
