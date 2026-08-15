import * as React from "react";
import { cn } from "@/lib/utils";

function SkeletonBase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md",
        "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
        "bg-[length:400%_100%]",
        "animate-[skeleton-shimmer_1.8s_ease-in-out_infinite]",
        className,
      )}
    />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <SkeletonBase className={cn("h-4 w-full rounded-full", className)} />;
}

export function SkeletonTitle({ className }: { className?: string }) {
  return <SkeletonBase className={cn("h-7 w-48 rounded-full", className)} />;
}

export function SkeletonAvatar({ className }: { className?: string }) {
  return <SkeletonBase className={cn("h-10 w-10 rounded-full shrink-0", className)} />;
}

export function SkeletonBadge({ className }: { className?: string }) {
  return <SkeletonBase className={cn("h-5 w-16 rounded-full", className)} />;
}

export function SkeletonButton({ className }: { className?: string }) {
  return <SkeletonBase className={cn("h-9 w-24 rounded-xl", className)} />;
}

export function SkeletonCard({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("glass-card p-5 space-y-3", className)}>
      {children ?? (
        <>
          <SkeletonTitle className="w-32" />
          <SkeletonText className="w-full" />
          <SkeletonText className="w-3/4" />
        </>
      )}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="glass-card p-5 space-y-2">
      <SkeletonText className="h-3 w-24 rounded-full" />
      <SkeletonBase className="h-8 w-20 rounded-lg" />
      <SkeletonText className="h-3 w-16 rounded-full" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-white/5">
      <SkeletonAvatar className="h-8 w-8" />
      <SkeletonText className="flex-1 h-3" />
      <SkeletonText className="w-20 h-3" />
      <SkeletonBadge />
      <SkeletonButton className="w-16 h-7" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  const widths = ["w-32", "w-20", "w-16", "w-20", "w-12"];
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex gap-4 px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        {widths.map((w, i) => (
          <SkeletonBase key={i} className={cn("h-3 rounded-full", w)} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <SkeletonTitle className="w-48" />
        <SkeletonText className="w-64 h-3" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="p-5 md:p-8 space-y-6 animate-fade-in">
      <SkeletonDashboard />
    </div>
  );
}
