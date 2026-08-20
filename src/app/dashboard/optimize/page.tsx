/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { BarChart2, TrendingUp, Users, Eye, Play, Clock, ThumbsUp, MessageSquare, Target, Award, Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { exportToCSV } from "@/lib/generators";

export default function Optimize() {
    const [selectedPeriod, setSelectedPeriod] = useState("30d");
    const [data, setData] = useState<any>(null);
    const [actionPlan, setActionPlan] = useState<any[]>([]);
    const [aiAnswer, setAiAnswer] = useState<string | null>(null);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchOptimizationData = async (customQuestion: string = "") => {
        setLoading(true);
        try {
            const storedChannel = typeof window !== 'undefined' ? localStorage.getItem('tubepulse_channel_id') : null;
            const params = new URLSearchParams();
            if (storedChannel) params.append("channelId", storedChannel);
            if (customQuestion) params.append("question", customQuestion);
            
            const res = await fetch(`/api/optimize/live?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch optimization data");
            const json = await res.json();
            
            setData(json.data);
            setActionPlan(json.actionPlan || []);
            setAiAnswer(json.aiAnswer || null);
        } catch (error) {
            showToast("Failed to load real optimization data", "warning");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchOptimizationData();
    }, []);

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period);
        fetchOptimizationData(question);
    };

    const handleAudit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOptimizationData(question.trim());
    };

    const handleExport = () => {
        if (!data) return;
        exportToCSV(
            ["Metric", "Value", "Change", "Trend"],
            data.stats.map((s: any) => [s.label, s.value, s.change, s.trend]),
            `optimize-report-${selectedPeriod}.csv`
        );
        showToast("Optimization report exported!");
    };

    const iconMap: Record<string, any> = { Eye, Users, Clock, Play };

    const insightIcons = [Target, TrendingUp, ThumbsUp, MessageSquare, Clock, BarChart2];

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="animate-spin text-red-500 w-12 h-12" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white mb-2">Channel Optimization</h1>
                    <p className="text-gray-400 text-lg">Deep analytics and actionable insights to accelerate your growth</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-red-500 transition-all">
                        <Download size={16} />
                        Export
                    </button>
                    {["7d", "30d", "90d", "1y"].map((period) => (
                        <button
                            key={period}
                            onClick={() => handlePeriodChange(period)}
                            className={cn(
                                "px-4 py-2 rounded-xl font-semibold transition-all",
                                selectedPeriod === period
                                    ? "bg-red-500 text-white"
                                    : "bg-background-card text-gray-400 hover:text-white"
                            )}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Form */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <form onSubmit={handleAudit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Custom Audit Focus (Optional)</label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g. Why is my view duration dropping? What should I do for my next video?"
                                className="flex-1 bg-background-card border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50"
                            >
                                Audit Now
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* AI Direct Answer (If question was asked) */}
            {aiAnswer && (
                <div className="glass-panel p-8 rounded-3xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-transparent">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white mb-2">AI Direct Response</h3>
                            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{aiAnswer}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Channel Health Score */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Channel Health Score</h2>
                            <p className="text-gray-400">Overall performance rating based on key metrics</p>
                        </div>
                        <div className="text-center">
                            <div className="text-6xl font-black text-white mb-2">{data.health.overall}</div>
                            <div className="text-sm text-gray-400">/ 100</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: "Content Quality", value: data.health.content, icon: BarChart2 },
                            { label: "Engagement", value: data.health.engagement, icon: ThumbsUp },
                            { label: "Growth Rate", value: data.health.growth, icon: TrendingUp },
                            { label: "Retention", value: data.health.retention, icon: Users },
                        ].map((metric) => (
                            <div key={metric.label} className="text-center">
                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                                    <metric.icon size={24} className="text-red-500" />
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">{metric.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.stats.map((stat: any) => {
                    const StatIcon = iconMap[stat.color === "blue" ? "Eye" : stat.color === "green" ? "Users" : stat.color === "purple" ? "Clock" : "Play"] || Eye;
                    return (
                    <div key={stat.label} className="glass-card p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                stat.color === "blue" && "bg-blue-500/10",
                                stat.color === "green" && "bg-green-500/10",
                                stat.color === "purple" && "bg-purple-500/10",
                                stat.color === "orange" && "bg-orange-500/10"
                            )}>
                                <StatIcon className={cn(
                                    "w-6 h-6",
                                    stat.color === "blue" && "text-blue-500",
                                    stat.color === "green" && "text-green-500",
                                    stat.color === "purple" && "text-purple-500",
                                    stat.color === "orange" && "text-orange-500"
                                )} />
                            </div>
                            <span className={cn(
                                "text-sm font-bold",
                                stat.trend === "up" ? "text-green-500" : "text-red-500"
                            )}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                    );
                })}
            </div>

            {/* AI Action Plan */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <Award size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Your Step-by-Step Action Plan</h2>
                        <p className="text-gray-400 text-sm">Personalized, data-driven checklist to boost your channel today.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {actionPlan.map((action, i) => (
                        <div
                            key={i}
                            className="bg-background-card border border-white/5 rounded-2xl p-6 hover:border-red-500/30 transition-all group flex items-start gap-5"
                        >
                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                                <span className="font-black text-red-500">{action.step}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-white text-lg">{action.title}</h3>
                                    <span className={cn(
                                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                        action.priority === "high"
                                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                    )}>
                                        {action.priority} Priority
                                    </span>
                                </div>
                                <p className="text-gray-400 leading-relaxed text-sm">{action.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Performing Videos */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-6">Top Performing Videos ({selectedPeriod})</h2>
                <div className="space-y-4">
                    {data.topVideos.map((video: any, i: number) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 p-4 bg-background-card rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <div className="w-24 h-14 rounded-md overflow-hidden bg-white/5 flex-shrink-0">
                                {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-white/30">No Image</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-white mb-1 group-hover:text-red-500 transition-colors">
                                    {video.title}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Eye size={14} /> {video.views} views
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ThumbsUp size={14} /> {video.engagement} engagement
                                    </span>
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">#{i + 1}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
