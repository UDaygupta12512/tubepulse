"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "@/components/Toast";
import { CommandMenu } from "@/components/CommandMenu";
import { PageTransition } from "@/components/PageTransition";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpenPath, setSidebarOpenPath] = useState<string | null>(null);
    const pathname = usePathname();
    const isSidebarOpen = sidebarOpenPath === pathname;

    const openSidebar = () => {
        setSidebarOpenPath(pathname);
    };

    const closeSidebar = () => {
        setSidebarOpenPath(null);
    };

    useEffect(() => {
        if (!isSidebarOpen) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeSidebar();
            }
        };

        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isSidebarOpen]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isSidebarOpen]);

    return (
        <ToastProvider>
            <CommandMenu />
        <div className="flex min-h-screen bg-[#0a0a0f]">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:z-10
            `}>
                <Sidebar onNavigate={closeSidebar} />

                {/* Mobile Close Button */}
                <button
                    onClick={closeSidebar}
                    type="button"
                    className="absolute top-4 right-4 text-gray-400 hover:text-white md:hidden bg-[#12121a] rounded-full p-1 border border-white/10 z-50"
                    aria-label="Close sidebar"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen w-full relative">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#2a2a3a] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openSidebar}
                            type="button"
                            className="text-gray-300 hover:text-white p-1"
                            aria-label="Open sidebar"
                        >
                            <Menu size={24} />
                        </button>
                        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            TubePulse
                        </span>
                    </div>
                    <Link
                        href="/"
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500/20 transition-all border border-red-500/20"
                    >
                        Home
                    </Link>
                </div>

                {/* Desktop Header - Back to Home */}
                <div className="hidden md:block sticky top-0 z-20 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5 px-8 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-red-500/50 hover:bg-red-500/5 transition-all group"
                            >
                                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="font-semibold">Back to Home</span>
                            </Link>
                        </div>
                        <div className="text-sm text-gray-400">
                            Welcome to your <span className="text-white font-bold">AI Control Center</span> 🚀
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <PageTransition>{children}</PageTransition>
                </div>
            </main>
        </div>
        </ToastProvider>
    );
}
