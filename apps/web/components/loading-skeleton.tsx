"use client";

import { cn } from "../lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  variant?: "text" | "card" | "button" | "avatar" | "form";
  delay?: number;
}

export function LoadingSkeleton({
  className,
  count = 1,
  variant = "text",
  delay = 0,
}: LoadingSkeletonProps) {
  const baseClasses =
    "animate-pulse bg-muted rounded transition-all duration-300 ease-in-out";

  const variantClasses = {
    text: "h-4",
    card: "h-32",
    button: "h-10 w-24",
    avatar: "h-10 w-10 rounded-full",
    form: "h-10",
  };

  const skeletonVariants = {
    text: (
      <div
        className={cn(baseClasses, variantClasses.text, className)}
        style={{ animationDelay: `${delay}ms` }}
      />
    ),
    card: (
      <div
        className={cn(baseClasses, variantClasses.card, className)}
        style={{ animationDelay: `${delay}ms` }}
      />
    ),
    button: (
      <div
        className={cn(baseClasses, variantClasses.button, className)}
        style={{ animationDelay: `${delay}ms` }}
      />
    ),
    avatar: (
      <div
        className={cn(baseClasses, variantClasses.avatar, className)}
        style={{ animationDelay: `${delay}ms` }}
      />
    ),
    form: (
      <div
        className={cn(baseClasses, variantClasses.form, className)}
        style={{ animationDelay: `${delay}ms` }}
      />
    ),
  };

  if (count === 1) {
    return skeletonVariants[variant];
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClasses, variantClasses[variant], className)}
          style={{ animationDelay: `${delay + i * 100}ms` }}
        />
      ))}
    </div>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <LoadingSkeleton variant="text" className="h-6 w-48" />
          <LoadingSkeleton variant="text" className="h-4 w-32" />
        </div>
        <LoadingSkeleton variant="button" />
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" />
        <LoadingSkeleton variant="text" />
      </div>

      <div className="flex items-center gap-4">
        <LoadingSkeleton variant="form" className="w-32" />
      </div>
    </div>
  );
}

export function VehicleFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <LoadingSkeleton variant="text" className="h-4 w-20" />
            <LoadingSkeleton variant="form" />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <LoadingSkeleton variant="text" className="h-4 w-32" />
        <LoadingSkeleton variant="card" />
      </div>

      <div className="flex gap-2">
        <LoadingSkeleton variant="button" className="w-32" />
        <LoadingSkeleton variant="button" className="w-24" />
      </div>
    </div>
  );
}

export function VehiclesListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  );
}
