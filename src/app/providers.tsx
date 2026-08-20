"use client";

import { useState } from "react";
import { ToastProvider } from "@/components/Toast";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: Infinity, // Keep data fresh across tabs for the whole session
                refetchOnWindowFocus: false, // Don't refetch AI generations when window focuses
            }
        }
    }));

    return (
        <SessionProvider>
            <QueryClientProvider client={queryClient}>
                <ToastProvider>{children}</ToastProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}
