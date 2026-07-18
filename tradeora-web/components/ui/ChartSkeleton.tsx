import { Skeleton } from './Skeleton';

export function ChartSkeleton() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between p-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-8 w-14" rounded="lg" />
          ))}
        </div>
      </div>
      {/* Chart Area */}
      <Skeleton className="w-full h-[400px] mx-0" rounded="sm" />
      {/* Indicators */}
      <div className="grid grid-cols-4 gap-3 p-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
