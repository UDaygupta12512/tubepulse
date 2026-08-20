"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Image as ImageIcon,
    Search,
    Key,
    BarChart2,
    TrendingUp,
    Sparkles,
    CreditCard,
    User,
    Zap,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    LineChart,
    Video,
    Users,
    Hash,
    LogOut,
    Activity,
    Eye,
    Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Autonomous Agent", icon: Bot, href: "/dashboard/autonomous-agent" },
    { name: "Analytics", icon: LineChart, href: "/dashboard/analytics" },
    { name: "Vision Analyzer", icon: Eye, href: "/dashboard/thumbnail-analyzer" },
    { name: "Thumbnail Forge", icon: ImageIcon, href: "/dashboard/thumbnail-generator" },
    { name: "Global Search", icon: Search, href: "/dashboard/thumbnail-search" },
    { name: "Magic Keywords", icon: Key, href: "/dashboard/keywords" },
    { name: "Hashtag Generator", icon: Hash, href: "/dashboard/hashtag-generator" },
    { name: "Script Generator", icon: Video, href: "/dashboard/script-generator" },
    { name: "Competitor Spy", icon: Users, href: "/dashboard/competitor-analysis" },
    { name: "Optimizer Pro", icon: BarChart2, href: "/dashboard/optimize" },
    { name: "Retention Predictor", icon: Activity, href: "/dashboard/retention" },
    { name: "Trend Outlier", icon: TrendingUp, href: "/dashboard/outlier" },
    { name: "AI Writer", icon: Sparkles, href: "/dashboard/content-generator" },
    { name: "Billing Hub", icon: CreditCard, href: "/dashboard/billing" },
    { name: "My Profile", icon: User, href: "/dashboard/profile" },
];

interface SidebarProps {
    onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const { data: session } = useSession();

    const isItemActive = (href: string) => {
        if (pathname === href) {
            return true;
        }

        // Keep parent route highlighted for future nested dashboard routes.
        return href !== "/dashboard" && pathname.startsWith(`${href}/`);
    };

    return (
        <aside
            className={cn(
                "h-screen bg-[#08080a] border-r border-white/5 flex flex-col transition-all duration-300 relative z-50",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-6">
                <div className="flex items-center gap-3 mb-10 overflow-hidden">
                    <Link href="/dashboard" className="flex items-center gap-3" onClick={onNavigate}>
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/10">
                            <Zap size={22} fill="currentColor" />
                        </div>
                        {!isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                <h1 className="text-xl font-black text-white tracking-tighter">TubePulse</h1>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
                                    Creator OS
                                </p>
                            </div>
                        )}
                    </Link>
                </div>

                <nav className="flex flex-col gap-1.5">
                    {menuItems.map((item) => {
                        const isActive = isItemActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                        : "text-gray-500 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <item.icon
                                    size={20}
                                    className={cn(
                                        "transition-colors flex-shrink-0",
                                        isActive ? "text-red-500" : "group-hover:text-white"
                                    )}
                                />
                                {!isCollapsed && (
                                    <span className="animate-in fade-in slide-in-from-left-2 duration-300">
                                        {item.name}
                                    </span>
                                )}

                                {isActive && <div className="absolute left-0 w-1 h-6 bg-red-500 rounded-r-full" />}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-white/5 bg-black/20">
                {!isCollapsed && (
                    <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Current Tier</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">Growth Plan</span>
                            <Link href="/dashboard/billing" className="text-[10px] font-black text-red-500 hover:text-red-400 transition-colors">
                                MANAGE
                            </Link>
                        </div>
                    </div>
                )}

                {!isCollapsed && (session?.user as { id?: string } | undefined)?.id && (
                    <p className="mb-3 text-[11px] text-gray-400 truncate" title={(session!.user as { id?: string }).id}>
                        ID: {(session!.user as { id?: string }).id}
                    </p>
                )}

                <button
                    type="button"
                    disabled={isSigningOut}
                    onClick={async () => {
                        setIsSigningOut(true);
                        await signOut({ callbackUrl: "/login" });
                    }}
                    className={cn(
                        "mb-3 w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold transition-all",
                        "text-gray-300 hover:text-white hover:border-red-500/50 hover:bg-red-500/10 disabled:opacity-60",
                        isCollapsed && "px-2"
                    )}
                >
                    <LogOut size={14} />
                    {!isCollapsed && (isSigningOut ? "Signing out..." : "Sign out")}
                </button>

                <p className={cn("text-[10px] text-gray-600 font-bold", isCollapsed && "text-center")}>
                    {isCollapsed ? "TP" : "Copyright 2026 TubePulse"}
                </p>
            </div>

            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                type="button"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </aside>
    );
}
