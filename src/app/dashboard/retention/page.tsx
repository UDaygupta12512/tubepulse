"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Flame,
    Layers,
    Lightbulb,
    Play,
    ShieldAlert,
    Sparkles,
    Target,
    TrendingDown,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { BackButton } from "@/components/BackButton";

interface Hazard {
    timestamp: string;
    type: string;
    severity: "critical" | "warning" | "optimal";
    dropRate: string;
    problem: string;
    directorFix: string;
}

interface Milestone {
    label: string;
    timestamp: string;
    retention: string;
    benchmarkComparison: string;
}

interface RetentionAnalysisData {
    curve: Array<{ minute: number; retentionPercentage: number; timestamp: string }>;
    summary: {
        averageViewDuration: string;
        overallScore: number;
        retentionCategory: "Viral Tier" | "Above Average" | "Average" | "High Drop-Off Risk";
        verdict: string;
    };
    hazards: Hazard[];
    milestones: Milestone[];
}

export default function RetentionPredictor() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<RetentionAnalysisData | null>(null);
    const { showToast } = useToast();

    // Form State
    const [videoLength, setVideoLength] = useState(10);
    const [hookStrength, setHookStrength] = useState(7);
    const [pacing, setPacing] = useState<"Fast" | "Normal" | "Slow">("Normal");
    const [category, setCategory] = useState<"Entertainment" | "Education" | "Gaming" | "Vlog" | "Other">("Entertainment");

    const generatePrediction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/retention", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoLengthMinutes: videoLength,
                    hookStrength,
                    pacing,
                    category,
                }),
            });

            if (!res.ok) throw new Error("Failed to generate prediction");

            const json = await res.json();
            setData(json);
            showToast("Polynomial retention decay analysis completed!", "success");
        } catch (error) {
            showToast("Failed to calculate retention curve.", "warning");
        } finally {
            setLoading(false);
        }
    };

    const getSeverityBadge = (severity: Hazard["severity"]) => {
        if (severity === "critical") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 border border-red-500/30 text-red-400">
                    <ShieldAlert size={12} /> Critical Drop
                </span>
            );
        }
        if (severity === "warning") {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                    <AlertTriangle size={12} /> Pacing Hazard
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 border border-green-500/30 text-green-400">
                <CheckCircle2 size={12} /> Strong Anchor
            </span>
        );
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <BackButton />
            </div>

            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                    <Activity size={14} className="text-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Local Mathematical Physics Model</span>
                </div>
                <h1 className="text-4xl font-black text-white flex items-center gap-3">
                    Predictive Retention Forecaster
                </h1>
                <p className="text-gray-400 mt-2 max-w-3xl">
                    Simulates audience drop-off using polynomial exponential decay calibrated on YouTube watch-time datasets. Identifies exact second-by-second drop-off hazards with 0 external API cost.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inputs Panel */}
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-400" />
                        Video Parameters
                    </h2>

                    <form onSubmit={generatePrediction} className="space-y-6">
                        {/* Length */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <label className="text-gray-300 flex items-center gap-2">
                                    <Clock size={15} className="text-cyan-400" /> Video Duration:
                                </label>
                                <span className="text-cyan-400 font-black">{videoLength} mins</span>
                            </div>
                            <input
                                type="range"
                                min="2"
                                max="60"
                                value={videoLength}
                                onChange={(e) => setVideoLength(Number(e.target.value))}
                                className="w-full accent-cyan-400 cursor-pointer"
                            />
                        </div>

                        {/* Hook Strength */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm font-medium">
                                <label className="text-gray-300 flex items-center gap-2">
                                    <Zap size={15} className="text-purple-400" /> Intro Hook Energy:
                                </label>
                                <span className="text-purple-400 font-black">{hookStrength} / 10</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={hookStrength}
                                onChange={(e) => setHookStrength(Number(e.target.value))}
                                className="w-full accent-purple-500 cursor-pointer"
                            />
                            <p className="text-xs text-gray-500">1 = Talking head monologue, 10 = High-stakes curiosity loop</p>
                        </div>

                        {/* Pacing */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Editing Pacing</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["Fast", "Normal", "Slow"] as const).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPacing(p)}
                                        className={cn(
                                            "py-2.5 rounded-xl text-xs font-bold transition-all",
                                            pacing === p
                                                ? "bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/20"
                                                : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Niche Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            >
                                <option value="Entertainment">Entertainment</option>
                                <option value="Education">Education / Tutorial</option>
                                <option value="Gaming">Gaming</option>
                                <option value="Vlog">Vlog / Lifestyle</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Play size={18} /> Run Retention Simulation
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Graph & Diagnostic Panel */}
                <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 lg:col-span-2 flex flex-col min-h-[520px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-cyan-400" />
                            Retention Curve
                        </h2>
                        {data && (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300">
                                <Flame size={13} /> {data.summary.retentionCategory}
                            </div>
                        )}
                    </div>

                    {data ? (
                        <div className="flex-1 flex flex-col space-y-6">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Avg View Duration</p>
                                    <p className="text-2xl md:text-3xl font-black text-white mt-1">{data.summary.averageViewDuration}</p>
                                </div>
                                <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Retention Score</p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <p className="text-2xl md:text-3xl font-black text-cyan-400">{data.summary.overallScore}</p>
                                        <p className="text-xs text-gray-500">/ 100</p>
                                    </div>
                                </div>
                                <div className="bg-slate-900/60 rounded-2xl p-4 border border-white/5 col-span-2 sm:col-span-1">
                                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Minute 1 Hook</p>
                                    <p className="text-2xl md:text-3xl font-black text-purple-400 mt-1">
                                        {data.curve[1]?.retentionPercentage ?? 0}%
                                    </p>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="w-full h-64 md:h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.curve} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis
                                            dataKey="minute"
                                            stroke="#ffffff50"
                                            tick={{ fill: "#ffffff50", fontSize: 12 }}
                                            tickFormatter={(val) => `${val}m`}
                                        />
                                        <YAxis
                                            stroke="#ffffff50"
                                            tick={{ fill: "#ffffff50", fontSize: 12 }}
                                            tickFormatter={(val) => `${val}%`}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "#0f172a",
                                                border: "1px solid rgba(255,255,255,0.15)",
                                                borderRadius: "14px",
                                                color: "#fff",
                                            }}
                                            itemStyle={{ color: "#06b6d4", fontWeight: "bold" }}
                                            formatter={(value: any) => [`${value}%`, "Retention"]}
                                            labelFormatter={(label) => `Minute ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="retentionPercentage"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRetention)"
                                            activeDot={{ r: 7, fill: "#06b6d4", stroke: "#fff", strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Verdict */}
                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 text-sm text-cyan-200 flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                <p>{data.summary.verdict}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-12">
                            <Activity className="w-16 h-16 text-cyan-400/50 mb-4 animate-pulse" />
                            <p className="text-lg text-gray-300 font-medium">Ready to Simulate</p>
                            <p className="text-sm text-gray-500 mt-1 max-w-sm">
                                Adjust your parameters on the left and calculate your mathematical retention curve.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Timeline Milestones & Hazards Section */}
            {data && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    {/* Retention Milestones */}
                    <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-xl font-bold text-white">Watch-Time Milestones vs YouTube Benchmarks</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {data.milestones.map((m, i) => (
                                <div key={i} className="bg-slate-900/60 rounded-2xl p-4 border border-white/10 space-y-2">
                                    <div className="text-xs font-bold text-gray-400">{m.label}</div>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-2xl font-black text-white">{m.retention}</span>
                                        <span className="text-xs text-cyan-400 font-semibold">{m.timestamp}</span>
                                    </div>
                                    <div className="text-xs text-emerald-400 font-medium">{m.benchmarkComparison}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Drop-Off Hazards & Director Fixes */}
                    <div className="glass-panel p-6 md:p-8 rounded-3xl border border-white/10 space-y-6">
                        <div className="flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-400" />
                            <h2 className="text-xl font-bold text-white">Timeline Hazard Diagnostics & Director Fixes</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {data.hazards.map((hazard, index) => (
                                <div
                                    key={index}
                                    className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                                                ⏱️ {hazard.timestamp}
                                            </span>
                                            {getSeverityBadge(hazard.severity)}
                                        </div>

                                        <h3 className="text-base font-bold text-white">{hazard.type}</h3>
                                        <p className="text-xs text-gray-400 leading-relaxed">{hazard.problem}</p>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 space-y-1 mt-2">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                                            <Lightbulb size={13} className="text-cyan-400" /> Director Fix:
                                        </div>
                                        <p className="text-xs text-gray-300 leading-relaxed">{hazard.directorFix}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
