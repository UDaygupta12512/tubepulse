"use client";

export default function DashboardLoading() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-3">
                <div className="w-32 h-8 bg-white/5 rounded-full animate-pulse" />
                <div className="w-64 h-12 bg-white/10 rounded-2xl animate-pulse" />
                <div className="w-96 h-6 bg-white/5 rounded-xl animate-pulse" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Side Panel Skeleton */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 h-96 animate-pulse bg-white/5" />
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 h-48 animate-pulse bg-white/5" />
                </div>

                {/* Main Content Skeleton */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 h-32 animate-pulse bg-white/5" />
                        <div className="glass-panel p-6 rounded-2xl border border-white/5 h-32 animate-pulse bg-white/5" />
                    </div>
                    <div className="glass-panel p-6 rounded-3xl border border-white/5 h-[400px] animate-pulse bg-white/5" />
                </div>
            </div>
        </div>
    );
}
