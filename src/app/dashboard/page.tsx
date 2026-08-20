"use client";

import Link from "next/link";
import {
    Image as ImageIcon,
    Search,
    Sparkles,
    TrendingUp,
    BarChart2,
    ArrowRight,
    Zap,
    Users,
    Eye,
    Clock,
    ThumbsUp,
    Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

interface DashboardStat {
    label: string;
    value: string;
    change: string;
    icon: typeof Eye;
    color: string;
    bg: string;
}

interface LiveDashboardResponse {
    analytics: {
        stats: Array<{ label: string; value: string; change: string; icon: "Eye" | "Clock" | "Users" | "ThumbsUp"; color: "blue" | "purple" | "green" | "orange" | "red" }>;
        generatedAt: string;
    };
}

export default function Dashboard() {
    const [channelInput, setChannelInput] = useState(() => {
        if (typeof window === "undefined") return "@MrBeast";
        return localStorage.getItem("tubepulse_channel_id") || "@MrBeast";
    });
    const [activeChannel, setActiveChannel] = useState(() => {
        if (typeof window === "undefined") return "@MrBeast";
        return localStorage.getItem("tubepulse_channel_id") || "@MrBeast";
    });
    const [liveStats, setLiveStats] = useState<LiveDashboardResponse["analytics"]["stats"]>([]);
    const [syncedAt, setSyncedAt] = useState<string>("");
    const [loadingStats, setLoadingStats] = useState(false);

    const loadDashboardData = async (targetChannel: string) => {
        setLoadingStats(true);
        try {
            const analyticsRes = await fetch(`/api/analytics/live?channelId=${encodeURIComponent(targetChannel)}&timeRange=30d`);
            const analyticsBody = (await analyticsRes.json()) as LiveDashboardResponse | { message?: string };
            if (analyticsRes.ok && "analytics" in analyticsBody) {
                setLiveStats(analyticsBody.analytics.stats);
                setSyncedAt(analyticsBody.analytics.generatedAt);
            }
        } catch {
            // keep UI functional even on API failure
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        void loadDashboardData(activeChannel);
    }, [activeChannel]);

    const handleConnectChannel = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = channelInput.trim();
        if (!trimmed) return;
        setActiveChannel(trimmed);
        if (typeof window !== "undefined") {
            localStorage.setItem("tubepulse_channel_id", trimmed);
        }
    };

    const statCards: DashboardStat[] = useMemo(() => {
        const iconByName: Record<string, typeof Eye> = { Eye, Users, Clock, ThumbsUp };
        const colorByName: Record<string, { color: string; bg: string }> = {
            blue: { color: "text-blue-500", bg: "bg-blue-500/10" },
            purple: { color: "text-purple-500", bg: "bg-purple-500/10" },
            green: { color: "text-green-500", bg: "bg-green-500/10" },
            orange: { color: "text-orange-500", bg: "bg-orange-500/10" },
            red: { color: "text-red-500", bg: "bg-red-500/10" },
        };
        return liveStats.slice(0, 4).map((stat) => ({
            label: stat.label,
            value: stat.value,
            change: stat.change,
            icon: iconByName[stat.icon] || Eye,
            color: colorByName[stat.color]?.color || "text-blue-500",
            bg: colorByName[stat.color]?.bg || "bg-blue-500/10",
        }));
    }, [liveStats]);

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-16">
            {/* Top Channel Bar */}
            <div className="glass-panel p-4 md:p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                        <Users size={20} />
                    </div>
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Connected YouTube Channel</div>
                        <div className="text-lg font-black text-white flex items-center gap-2">
                            {activeChannel}
                            {loadingStats && <span className="text-xs text-red-400 font-medium animate-pulse">Syncing...</span>}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleConnectChannel} className="flex items-center gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        value={channelInput}
                        onChange={(e) => setChannelInput(e.target.value)}
                        placeholder="Enter @handle or channel URL..."
                        className="bg-background-card border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 w-full md:w-64"
                    />
                    <button
                        type="submit"
                        disabled={loadingStats}
                        className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all whitespace-nowrap"
                    >
                        Switch Channel
                    </button>
                </form>
            </div>

            {/* Header / Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loadingStats ? (
                    // Skeleton Loaders
                    Array(4).fill(0).map((_, i) => (
                        <div key={`skel-${i}`} className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl animate-pulse">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-white/10" />
                                <div className="w-16 h-6 rounded-full bg-white/5" />
                            </div>
                            <div className="h-10 w-24 bg-white/10 rounded-lg mb-2" />
                            <div className="h-4 w-32 bg-white/5 rounded-full mb-4" />
                            <div className="h-6 w-full bg-white/5 rounded-lg mt-2" />
                        </div>
                    ))
                ) : (
                    statCards.map((stat, i) => {
                        // "So What?" Educational UX Logic
                        let advice = "Trending normally";
                        let adviceColor = "text-gray-400 bg-white/5 border-white/10";
                        const valLower = stat.label.toLowerCase();
                        
                        if (valLower.includes("view")) {
                            advice = "Good baseline. Try 1 trending keyword next.";
                            adviceColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                        } else if (valLower.includes("sub") || valLower.includes("audience")) {
                            advice = "Growth is steady. Do a community poll!";
                            adviceColor = "text-green-400 bg-green-500/10 border-green-500/20";
                        } else if (valLower.includes("time") || valLower.includes("retention")) {
                            advice = "Watch time is stable. Review the 30s hook.";
                            adviceColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
                        } else if (valLower.includes("ctr") || valLower.includes("click")) {
                            const num = parseFloat(stat.value.replace(/[^0-9.]/g, ''));
                            if (!isNaN(num) && num < 5) {
                                advice = "⚠️ Below Average: Try higher contrast background";
                                adviceColor = "text-orange-400 bg-orange-500/10 border-orange-500/20";
                            } else {
                                advice = "🔥 High Performance: Replicate this style";
                                adviceColor = "text-green-400 bg-green-500/10 border-green-500/20";
                            }
                        }

                        return (
                            <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl hover:scale-105 transition-transform duration-300 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                                        <stat.icon className={stat.color} size={24} />
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-1 rounded-full",
                                        stat.change.startsWith("+") ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                                    )}>
                                        {stat.change}
                                    </span>
                                </div>
                                <h3 className="text-4xl font-black text-white mb-1">{stat.value}</h3>
                                <p className="text-sm font-semibold text-gray-400 mb-4">{stat.label}</p>
                                
                                {/* Educational UX Badge */}
                                <div className={cn("mt-auto px-3 py-2 rounded-lg text-[11px] font-bold border leading-tight", adviceColor)}>
                                    {advice}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            <p className="text-xs text-gray-500 -mt-6">Live sync: {syncedAt ? new Date(syncedAt).toLocaleString() : "Pending"} | Channel Source: {activeChannel}</p>

            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-red-500 to-orange-600 p-10 md:p-14 text-white shadow-2xl group">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md mb-6 border border-white/30">
                        <Zap size={16} fill="currentColor" className="animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">AI Cockpit Ready</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                        Your Content, <br />Enhanced by Intelligence.
                    </h1>
                    <p className="text-xl text-white/90 leading-relaxed font-medium mb-8">
                        Everything you need to master the algorithm and grow your impact and reach.
                        Start using our AI tools to optimize your strategy today.
                    </p>
                    <Link href="/dashboard/analytics" className="inline-flex items-center gap-2 bg-white text-red-600 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl">
                        View Analytics
                        <ArrowRight size={20} />
                    </Link>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px] group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-[60px]" />
                <div className="absolute top-1/2 right-10 lg:right-20 -translate-y-1/2 hidden lg:block">
                    <div className="text-8xl animate-float">🚀</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                    { label: "Generate Thumbnail", icon: "🎨", href: "/dashboard/thumbnail-generator", color: "red" },
                    { label: "Script Generator", icon: "🎬", href: "/dashboard/script-generator", color: "indigo" },
                    { label: "Content Ideas", icon: "✨", href: "/dashboard/content-generator", color: "purple" },
                ].map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        className="glass-card p-6 rounded-2xl text-center hover:-translate-y-2 transition-all duration-300 border border-white/5"
                    >
                        <div className="text-5xl mb-3">{action.icon}</div>
                        <p className="text-white font-bold text-sm">{action.label}</p>
                    </Link>
                ))}
            </div>

            {/* AI Tools Grid */}
            <div className="mt-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight">AI Power Tools</h2>
                        <p className="text-gray-400 font-semibold mt-2 text-lg">High-performance tools for precision creation.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Thumbnail Forge */}
                    <Link href="/dashboard/thumbnail-generator" className="glass-card group relative p-8 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px] overflow-hidden hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 pointer-events-none">
                            <ImageIcon size={160} />
                        </div>
                        <div>
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border-2 border-red-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                <ImageIcon className="text-red-500" size={32} />
                            </div>
                            <div className="text-4xl mb-4">🎨</div>
                            <h3 className="text-2xl font-black text-white mb-3">Thumbnail Forge</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">AI-driven visuals built to dominate the recommendation feed and boost CTR.</p>
                        </div>
                        <div className="flex items-center gap-2 text-red-500 font-bold mt-6 group-hover:gap-4 transition-all">
                            Launch Tool <ArrowRight size={20} />
                        </div>
                    </Link>

                    {/* Global Search */}
                    <Link href="/dashboard/thumbnail-search" className="glass-card group relative p-8 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px] overflow-hidden hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 pointer-events-none">
                            <Search size={160} />
                        </div>
                        <div>
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border-2 border-blue-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                                <Search className="text-blue-500" size={32} />
                            </div>
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-2xl font-black text-white mb-3">Global Search</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">Reverse engineer competing thumbnails and analyze their winning DNA.</p>
                        </div>
                        <div className="flex items-center gap-2 text-blue-500 font-bold mt-6 group-hover:gap-4 transition-all">
                            Launch Tool <ArrowRight size={20} />
                        </div>
                    </Link>

                    {/* Writer Pro */}
                    <Link href="/dashboard/content-generator" className="glass-card group relative p-8 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px] overflow-hidden hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
                            <Sparkles size={160} />
                        </div>
                        <div>
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border-2 border-purple-500/20 group-hover:scale-110 group-hover:rotate-12 transition-all">
                                <Sparkles className="text-purple-500" size={32} />
                            </div>
                            <div className="text-4xl mb-4">✨</div>
                            <h3 className="text-2xl font-black text-white mb-3">Writer Pro</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">Turn ideas into viral scripts, titles, and meta-data in seconds.</p>
                        </div>
                        <div className="flex items-center gap-2 text-purple-500 font-bold mt-6 group-hover:gap-4 transition-all">
                            Launch Tool <ArrowRight size={20} />
                        </div>
                    </Link>

                    {/* Keyword Intelligence */}
                    <Link href="/dashboard/keywords" className="glass-card group relative p-8 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px] overflow-hidden hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                            <Key size={160} />
                        </div>
                        <div>
                            <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 border-2 border-green-500/20 group-hover:scale-110 transition-all">
                                <Key className="text-green-500" size={32} />
                            </div>
                            <div className="text-4xl mb-4">🔑</div>
                            <h3 className="text-2xl font-black text-white mb-3">Keyword Intelligence</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">Discover untapped search volume and trending topics before anyone else.</p>
                        </div>
                        <div className="flex items-center gap-2 text-green-500 font-bold mt-6 group-hover:gap-4 transition-all">
                            Launch Tool <ArrowRight size={20} />
                        </div>
                    </Link>

                    {/* Outlier Analysis */}
                    <Link href="/dashboard/outlier" className="glass-card group relative p-8 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px] overflow-hidden hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                            <TrendingUp size={160} />
                        </div>
                        <div>
                            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 border-2 border-orange-500/20 group-hover:scale-110 transition-all">
                                <TrendingUp className="text-orange-500" size={32} />
                            </div>
                            <div className="text-4xl mb-4">🔥</div>
                            <h3 className="text-2xl font-black text-white mb-3">Outlier Analysis</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">Spot viral opportunities and understand what makes content explode.</p>
                        </div>
                        <div className="flex items-center gap-2 text-orange-500 font-bold mt-6 group-hover:gap-4 transition-all">
                            Launch Tool <ArrowRight size={20} />
                        </div>
                    </Link>

                    {/* Channel Optimizer */}
                    <Link href="/dashboard/optimize" className="glass-card group relative p-8 rounded-3xl border border-white/5 flex flex-col justify-between min-h-[320px] overflow-hidden hover:-translate-y-2 transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                            <BarChart2 size={160} />
                        </div>
                        <div>
                            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 border-2 border-cyan-500/20 group-hover:scale-110 transition-all">
                                <BarChart2 className="text-cyan-500" size={32} />
                            </div>
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-2xl font-black text-white mb-3">Channel Optimizer</h3>
                            <p className="text-gray-400 font-medium leading-relaxed">Deep analytics and actionable insights to accelerate your growth.</p>
                        </div>
                        <div className="flex items-center gap-2 text-cyan-500 font-bold mt-6 group-hover:gap-4 transition-all">
                            Launch Tool <ArrowRight size={20} />
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
