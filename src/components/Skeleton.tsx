"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-rose-border/50 rounded ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl mb-6" />
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-40 rounded-xl col-span-2" />
      </div>
    </div>
  );
}

export function TasksSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><Skeleton className="h-8 w-32 mb-2" /><Skeleton className="h-4 w-24" /></div>
        <div className="flex gap-3"><Skeleton className="h-9 w-24 rounded-lg" /><Skeleton className="h-9 w-36 rounded-lg" /><Skeleton className="h-9 w-28 rounded-lg" /></div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <Skeleton className="h-12 rounded-t-xl" />
            <div className="border border-t-0 rounded-b-xl p-3 space-y-3 min-h-[300px]">
              {[1, 2].map((j) => <Skeleton key={j} className="h-28 rounded-lg" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto flex gap-6 h-[calc(100vh-8rem)]">
      <div className="w-80 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg mb-3" />
        <Skeleton className="h-9 w-full rounded-lg mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      </div>
      <Skeleton className="flex-1 rounded-xl" />
    </div>
  );
}

export function TodaySkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl mb-8" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-6">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
