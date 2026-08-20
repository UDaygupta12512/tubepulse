"use client";

import { useState } from "react";
import { TrendingUp, Flame, Eye, Clock, Target, Zap, Download, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { exportToCSV } from "@/lib/generators";
import { copyTextToClipboard } from "@/lib/utils";

interface OutlierResult {
    id: number;
    title: string;
    channel: string;
    cat: string;
    emoji: string;
    views: string;
    expectedViews: string;
    multiplier: string;
    uploadedDays: number;
    subscribers: string;
    viralScore: number;
    reason: string;
}

export default function Outlier() {
    const [analyzing, setAnalyzing] = useState(false);
    const [outliers, setOutliers] = useState<OutlierResult[]>([]);
    const [category, setCategory] = useState("all");
    const router = useRouter();
    const { showToast } = useToast();

    const parseCompactToMillions = (value: string) => {
        const numeric = Number.parseFloat(String(value).replace(/,/g, ""));
        if (!Number.isFinite(numeric)) return 0;
        if (value.toUpperCase().includes("M")) return numeric;
        if (value.toUpperCase().includes("K")) return numeric / 1000;
        return numeric / 1_000_000;
    };

    const fetchOutliers = async (cat: string) => {
        setAnalyzing(true);
        try {
            const res = await fetch(`/api/outliers/live?category=${cat}`);
            if (!res.ok) throw new Error("Failed to fetch outliers");
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                setOutliers(data.results);
                showToast("Viral outliers detected!");
            } else {
                setOutliers([]);
                showToast("No outliers found.", "info");
            }
        } catch (error) {
            console.error(error);
            showToast("Error generating outlier data. Please try again later.", "warning");
            setOutliers([]);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAnalyze = () => {
        fetchOutliers(category);
    };

    const handleCategoryChange = (cat: string) => {
        setCategory(cat);
        if (outliers.length > 0) {
            fetchOutliers(cat);
        }
    };

    const handleExport = () => {
        if (outliers.length === 0) return;
        exportToCSV(
            ["Title", "Channel", "Views", "Expected", "Multiplier", "Viral Score"],
            outliers.map(o => [o.title, o.channel, o.views, o.expectedViews, o.multiplier, String(o.viralScore)]),
            `outlier-analysis-${category}.csv`
        );
        showToast("Analysis exported as CSV!");
    };

    const handleCopyStrategy = async (title: string, reason: string) => {
        const copied = await copyTextToClipboard(`Strategy from "${title}": ${reason}`);
        showToast(copied ? "Strategy copied to clipboard!" : "Unable to copy strategy. Please copy manually.", copied ? "success" : "warning");
    };

    const handleWatchVideo = (title: string, channel: string) => {
        const query = encodeURIComponent(`${title} ${channel}`);
        window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank", "noopener,noreferrer");
        showToast("Opened matching videos in YouTube search.", "info");
    };

    const handleAnalyzeChannel = (channel: string) => {
        router.push(`/dashboard/competitor-analysis?channel=${encodeURIComponent(channel)}`);
        showToast(`Loading competitor analysis for ${channel}...`, "info");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with 3D Characters */}
            <div className="relative">
                <div className="absolute -top-10 right-0 hidden lg:flex gap-4">
                    <div className="text-8xl animate-float">🔥</div>
                    <div className="text-8xl animate-float-delayed">🚀</div>
                    <div className="text-8xl animate-float-slow">👀</div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
                    <Flame size={14} className="text-orange-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Viral Detection AI</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Trend Outlier Detector</h1>
                <p className="text-gray-400 text-xl">Spot viral content before it explodes and understand the winning formula</p>
            </div>

            {/* 3D Anime Scout Character */}
            <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-red-500/5">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="text-7xl animate-bounce-slow">🔍</div>
                        <div className="absolute -top-2 -right-2 text-3xl animate-ping">💫</div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">Viral Scout Activated! 🎯</h3>
                        <p className="text-gray-400 text-sm">I&apos;m scanning millions of videos to find outliers performing 10x above expectations</p>
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="btn-premium disabled:opacity-50"
                    >
                        {analyzing ? "Scanning..." : "Start Scan"}
                    </button>
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                {[
                    { id: "all", label: "All Niches", emoji: "🌐" },
                    { id: "tech", label: "Tech & AI", emoji: "🤖" },
                    { id: "business", label: "Business", emoji: "💼" },
                    { id: "education", label: "Education", emoji: "📚" },
                    { id: "lifestyle", label: "Lifestyle", emoji: "✨" },
                ].map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${category === cat.id
                                ? "bg-orange-500 text-white"
                                : "bg-background-card text-gray-400 hover:text-white border border-white/10"
                            }`}
                    >
                        <span>{cat.emoji}</span>
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Results */}
            {outliers.length > 0 ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-white">🔥 Viral Outliers Detected!</h2>
                            <p className="text-gray-400 text-lg">{outliers.length} videos performing exceptionally well</p>
                        </div>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-orange-500 transition-all">
                            <Download size={16} />
                            Export Analysis
                        </button>
                    </div>

                    {/* Outlier Cards */}
                    <div className="grid gap-6">
                        {outliers.map((outlier, i) => (
                            <div key={outlier.id} className="glass-card p-8 rounded-3xl border border-white/5 hover:border-orange-500/30 transition-all group">
                                <div className="flex items-start gap-6">
                                    {/* Viral Score Badge */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center relative group-hover:scale-110 transition-transform">
                                            <div className="text-4xl font-black text-white">{outlier.viralScore}</div>
                                            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-black text-xs">
                                                {i + 1}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 font-semibold">Viral Score</div>
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform inline-block">
                                                    {outlier.emoji}
                                                </div>
                                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-orange-500 transition-colors">
                                                    {outlier.title}
                                                </h3>
                                                <p className="text-gray-400 text-sm mb-3">
                                                    by <span className="text-white font-semibold">{outlier.channel}</span> • {outlier.subscribers} subscribers
                                                </p>
                                            </div>
                                        </div>

                                        {/* Performance Stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                                                    <Eye size={12} /> Actual Views
                                                </div>
                                                <div className="text-white font-black text-xl">{outlier.views}</div>
                                            </div>
                                            <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                                                    <Target size={12} /> Expected
                                                </div>
                                                <div className="text-gray-500 font-black text-xl">{outlier.expectedViews}</div>
                                            </div>
                                            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-xl border border-orange-500/30">
                                                <div className="text-orange-300 text-xs mb-1 flex items-center gap-1">
                                                    <TrendingUp size={12} /> Multiplier
                                                </div>
                                                <div className="text-orange-500 font-black text-xl">{outlier.multiplier}</div>
                                            </div>
                                            <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                                                    <Clock size={12} /> Uploaded
                                                </div>
                                                <div className="text-white font-black text-xl">{outlier.uploadedDays}d ago</div>
                                            </div>
                                        </div>

                                        {/* AI Analysis */}
                                        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4 rounded-xl border border-purple-500/20 mb-4">
                                            <div className="flex items-start gap-3">
                                                <div className="text-3xl">🧠</div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-purple-400 font-bold mb-1">AI ANALYSIS</div>
                                                    <p className="text-white text-sm leading-relaxed">{outlier.reason}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button onClick={() => handleWatchVideo(outlier.title, outlier.channel)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-500 font-semibold text-sm hover:bg-orange-500/20 transition-all">
                                                <Play size={14} />
                                                Watch Video
                                            </button>
                                            <button onClick={() => handleCopyStrategy(outlier.title, outlier.reason)} className="px-4 py-2 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-all">
                                                Copy Strategy
                                            </button>
                                            <button onClick={() => handleAnalyzeChannel(outlier.channel)} className="px-4 py-2 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-all">
                                                Analyze Channel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Avg Multiplier", value: outliers.length > 0 ? (outliers.reduce((a, o) => a + parseFloat(o.multiplier), 0) / outliers.length).toFixed(1) + "x" : "0x", emoji: "📊", color: "orange" },
                            { label: "Total Outlier Views", value: outliers.length > 0 ? (outliers.reduce((a, o) => a + parseCompactToMillions(o.views), 0)).toFixed(1) + "M" : "0", emoji: "👁️", color: "blue" },
                            { label: "Avg Upload Age", value: outliers.length > 0 ? Math.round(outliers.reduce((a, o) => a + o.uploadedDays, 0) / outliers.length) + " days" : "0", emoji: "⏱️", color: "purple" },
                            { label: "Avg Viral Score", value: outliers.length > 0 ? (outliers.reduce((a, o) => a + o.viralScore, 0) / outliers.length).toFixed(1) : "0", emoji: "⭐", color: "yellow" },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card p-6 rounded-2xl text-center border border-white/5">
                                <div className="text-5xl mb-3">{stat.emoji}</div>
                                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-400 font-semibold">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass-panel min-h-[500px] rounded-3xl border border-white/10 flex items-center justify-center">
                    <div className="text-center p-12">
                        <div className="flex justify-center gap-4 mb-6">
                            <div className="text-8xl animate-float">🔥</div>
                            <div className="text-8xl animate-float-delayed">🚀</div>
                            <div className="text-8xl animate-float-slow">💫</div>
                        </div>
                        <h3 className="text-4xl font-black text-white mb-4">Ready to Spot Viral Trends?</h3>
                        <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-8">
                            Click &quot;Start Scan&quot; above to analyze millions of videos and discover content that&apos;s defying expectations
                        </p>
                        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <Zap size={16} className="text-orange-500" />
                            <span className="text-orange-400 font-semibold">Real-time viral intelligence powered by AI</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
