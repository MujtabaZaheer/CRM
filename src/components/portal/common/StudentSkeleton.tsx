import React from "react";

export const StudentCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-surface border border-subtle animate-pulse flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-xl bg-elevated shrink-0" />
            <div className="space-y-2 flex-1 max-w-md">
              <div className="h-4 bg-elevated rounded w-1/3" />
              <div className="h-3 bg-elevated/70 rounded w-2/3" />
              <div className="h-2.5 bg-elevated/50 rounded w-1/4" />
            </div>
          </div>
          <div className="w-24 h-8 bg-elevated rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
};

export const StudentMetricsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-surface border border-subtle animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 bg-elevated rounded w-1/2" />
            <div className="w-7 h-7 rounded-lg bg-elevated" />
          </div>
          <div className="h-7 bg-elevated rounded w-1/3" />
        </div>
      ))}
    </div>
  );
};
