"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error in component:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="glass-panel p-8 rounded-3xl border border-red-500/20 bg-red-500/5 flex flex-col items-center justify-center text-center min-h-[400px]">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Something went wrong</h2>
                    <p className="text-gray-400 mb-6 max-w-md">
                        The AI returned an unexpected response that we couldn&apos;t render. Don&apos;t worry, the rest of the app is still working.
                    </p>
                    <div className="bg-black/30 rounded-lg p-4 text-left w-full max-w-md mb-6 overflow-auto max-h-32 border border-white/5">
                        <p className="text-red-400 font-mono text-xs break-words">
                            {this.state.error?.message || "Unknown rendering error"}
                        </p>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
