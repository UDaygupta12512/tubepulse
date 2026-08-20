"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-white/5 rounded-lg",
                className
            )}
            style={style}
        />
    );
}

export function PageLoadingSkeleton() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Header skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-6 w-32 rounded-full" />
                <Skeleton className="h-12 w-80" />
                <Skeleton className="h-6 w-64" />
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="glass-card p-6 rounded-2xl border border-white/5">
                        <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                        <Skeleton className="h-8 w-24 mb-2" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>

            {/* Content skeleton */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function CardLoadingSkeleton() {
    return (
        <div className="glass-card p-6 rounded-2xl border border-white/5 animate-pulse">
            <Skeleton className="h-48 w-full rounded-xl mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    );
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="flex gap-4 pb-4 border-b border-white/10">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                ))}
            </div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                    {[...Array(5)].map((_, j) => (
                        <Skeleton key={j} className="h-6 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function ChartLoadingSkeleton() {
    // Generate deterministic array of random-looking heights based on index
    // so it doesn't cause a hydration mismatch or impurity warning.
    const heights = [45, 78, 34, 89, 56, 92, 41, 67, 33, 84, 52, 70];
    
    return (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 animate-pulse">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
                {heights.map((height, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t-lg"
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function FormLoadingSkeleton() {
    return (
        <div className="glass-panel p-8 rounded-3xl border border-white/10 animate-pulse space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        </div>
    );
}

export function ContentGeneratorSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <Skeleton className="h-6 w-48 mb-2" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
            
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="flex flex-wrap gap-2">
                    {[...Array(12)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function ScriptGeneratorSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                    <div key={i} className="glass-panel p-6 rounded-2xl border border-white/5">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-20 w-full rounded-xl mb-3" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                ))}
            </div>
            
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
                <div className="bg-slate-900/50 p-4 border-b border-white/5">
                    <Skeleton className="h-6 w-48" />
                </div>
                <div className="grid grid-cols-12 gap-px bg-white/5">
                    <div className="col-span-1 p-4 bg-slate-950"><Skeleton className="h-4 w-full" /></div>
                    <div className="col-span-3 p-4 bg-slate-950"><Skeleton className="h-4 w-full" /></div>
                    <div className="col-span-5 p-4 bg-slate-950"><Skeleton className="h-4 w-full" /></div>
                    <div className="col-span-3 p-4 bg-slate-950"><Skeleton className="h-4 w-full" /></div>
                </div>
                <div className="divide-y divide-white/5">
                    {[1, 2, 3, 4, 5, 6].map((row) => (
                        <div key={row} className="grid grid-cols-12 gap-px bg-white/5">
                            <div className="col-span-1 p-4 bg-slate-950 flex justify-center"><Skeleton className="h-6 w-6 rounded-full" /></div>
                            <div className="col-span-3 p-4 bg-slate-950"><Skeleton className="h-16 w-full rounded-lg" /></div>
                            <div className="col-span-5 p-4 bg-slate-950"><Skeleton className="h-20 w-full rounded-lg" /></div>
                            <div className="col-span-3 p-4 bg-slate-950"><Skeleton className="h-12 w-full rounded-lg" /></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
