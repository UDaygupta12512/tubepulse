"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service if available
        console.error("Dashboard Error caught by boundary:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-in fade-in slide-in-from-bottom-4">
            <GlassPanel className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                
                <div>
                    <h2 className="text-2xl font-black text-white mb-2">Something went wrong!</h2>
                    <p className="text-gray-400 text-sm">
                        {error.message || "An unexpected error occurred while loading this tool."}
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button
                        onClick={reset}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all active:scale-95"
                    >
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                    
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-gray-300 bg-white/5 hover:bg-white/10 transition-all border border-white/5 active:scale-95"
                    >
                        <Home className="w-4 h-4" /> Back to Dashboard
                    </Link>
                </div>
            </GlassPanel>
        </div>
    );
}
