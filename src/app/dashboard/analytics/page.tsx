"use client";

import { type ComponentType, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Users, Clock, ThumbsUp, Download, RefreshCw } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/components/Toast";
import { exportToCSV } from "@/lib/generators";

interface AnalyticsResponse {
    analytics: {
        stats: Array<{
            label: string;
            value: string;
            change: string;
            icon: "Eye" | "Clock" | "Users" | "ThumbsUp";
            color: "blue" | "purple" | "green" | "orange" | "red";
            trend: "up" | "down";
        }>;
        chartData: number[];
        topVideos: Array<{
            title: string;
            emoji: string;
            views: string;
            ctr: string;
            engagement: string;
            publishedAt: string;
        }>;
        trafficSources: Array<{
            source: string;
            percentage: number;
            color: "red" | "blue" | "green" | "purple" | "orange";
        }>;
        engagement: { likes: number; comments: number; shares: number; saves: number };
        generatedAt: string;
    };
}

interface JobResponse {
    job: {
        id: string;
        status: "queued" | "running" | "completed" | "failed";
        error?: string;
        result?: { analytics: AnalyticsResponse["analytics"] };
    };
}

interface AnomalyAlert {
    type: "CTR Drop" | "Retention Cliff" | "Upload-Time Shift";
    severity: "high" | "medium";
    summary: string;
    action: string;
}

function getAnomalyAlerts(data: AnalyticsResponse["analytics"]): AnomalyAlert[] {
    const alerts: AnomalyAlert[] = [];
    const ctrValues = data.topVideos.map((video) => parseFloat(video.ctr)).filter((v) => Number.isFinite(v));
    const minCtr = ctrValues.length > 0 ? Math.min(...ctrValues) : 0;
    const maxCtr = ctrValues.length > 0 ? Math.max(...ctrValues) : 0;
    const ctrSpread = maxCtr - minCtr;

    if (minCtr > 0 && (minCtr < 5 || ctrSpread > 3)) {
        alerts.push({
            type: "CTR Drop",
            severity: minCtr < 4.5 ? "high" : "medium",
            summary: `Recent video CTR spread is wide (${minCtr.toFixed(1)}% to ${maxCtr.toFixed(1)}%), indicating thumbnail/title inconsistency.`,
            action: "Rework lowest CTR video with 2 high-contrast variants and compare after 24-48 hours.",
        });
    }

    const chart = data.chartData;
    const dropDetected = chart.some((value, i) => i > 1 && value < chart[i - 1] - 18 && value < chart[i - 2] - 12);
    if (dropDetected) {
        alerts.push({
            type: "Retention Cliff",
            severity: "high",
            summary: "Performance bars show abrupt drop segments in recent uploads.",
            action: "Shorten intros and move strongest value hook to the first 15 seconds.",
        });
    }

    const sourceMap = Object.fromEntries(data.trafficSources.map((source) => [source.source, source.percentage]));
    const highEng = sourceMap["High Engagement Videos"] ?? 0;
    if (highEng < 25) {
        alerts.push({
            type: "Upload-Time Shift",
            severity: "medium",
            summary: "High-engagement content share is low in current window.",
            action: "Run a 2-week posting schedule test (two alternate slots) and compare first-24h velocity.",
        });
    }

    return alerts.slice(0, 3);
}

const defaultChannelId = "UC_x5XG1OV2P6uZZ5FSM9Ttw";

export default function Analytics() {
    const [timeRange, setTimeRange] = useState("30d");
    const [channelId, setChannelId] = useState(defaultChannelId);
    const [loading, setLoading] = useState(false);
    const [jobPolling, setJobPolling] = useState(false);
    const [data, setData] = useState<AnalyticsResponse["analytics"] | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const stored = localStorage.getItem("tubepulse_channel_id");
        if (stored) setChannelId(stored);
    }, []);

    const fetchLive = useCallback(async (id: string, range: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics/live?channelId=${encodeURIComponent(id)}&timeRange=${encodeURIComponent(range)}`);
            const body = (await res.json()) as AnalyticsResponse | { message?: string };
            if (!res.ok || !("analytics" in body)) {
                throw new Error("message" in body ? body.message : "Failed to load analytics.");
            }
            setData(body.analytics);
            localStorage.setItem("tubepulse_channel_id", id);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to load analytics.", "warning");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        void fetchLive(channelId, timeRange);
    }, [channelId, fetchLive, timeRange]);

    const startBackgroundRefresh = async () => {
        setJobPolling(true);
        try {
            const createRes = await fetch("/api/jobs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "analytics_refresh",
                    payload: { channelId, timeRange },
                }),
            });
            const createBody = (await createRes.json()) as { jobId?: string; message?: string };
            if (!createRes.ok || !createBody.jobId) throw new Error(createBody.message || "Failed to create job.");

            const maxPoll = 40;
            for (let i = 0; i < maxPoll; i++) {
                await new Promise((r) => setTimeout(r, 1200));
                const statusRes = await fetch(`/api/jobs/${createBody.jobId}`);
                const statusBody = (await statusRes.json()) as JobResponse | { message?: string };
                if (!statusRes.ok || !("job" in statusBody)) throw new Error("message" in statusBody ? statusBody.message : "Job polling failed.");

                if (statusBody.job.status === "completed") {
                    if (statusBody.job.result?.analytics) {
                        setData(statusBody.job.result.analytics);
                        localStorage.setItem("tubepulse_channel_id", channelId);
                    }
                    showToast("Background analytics refresh completed.");
                    return;
                }
                if (statusBody.job.status === "failed") {
                    throw new Error(statusBody.job.error || "Background job failed.");
                }
            }
            throw new Error("Background job timeout. Please try again.");
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Background refresh failed.", "warning");
        } finally {
            setJobPolling(false);
        }
    };

    const handleExport = () => {
        if (!data) return;
        exportToCSV(
            ["Metric", "Value", "Change"],
            data.stats.map((s) => [s.label, s.value, s.change]),
            `analytics-${timeRange}.csv`
        );
        showToast("Analytics report exported!");
    };

    const iconMap: Record<string, ComponentType<{ className?: string; size?: number }>> = { Eye, Clock, Users, ThumbsUp };
    const anomalyAlerts = useMemo(() => (data ? getAnomalyAlerts(data) : []), [data]);

    const colorClassMap: Record<string, { bg: string; text: string; border: string }> = {
        blue: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
        purple: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
        green: { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/20" },
        orange: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/20" },
        red: { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/20" },
    };

    const barColorMap: Record<string, string> = {
        green: "bg-gradient-to-r from-green-500 to-green-600",
        blue: "bg-gradient-to-r from-blue-500 to-blue-600",
        purple: "bg-gradient-to-r from-purple-500 to-purple-600",
        orange: "bg-gradient-to-r from-orange-500 to-orange-600",
        red: "bg-gradient-to-r from-red-500 to-red-600",
    };

    if (!data) {
        return (
            <div className="max-w-7xl mx-auto space-y-8">
                <BackButton />
                <div className="glass-panel rounded-3xl border border-white/10 p-8">
                    <h1 className="text-3xl font-black text-white mb-4">Live Analytics</h1>
                    <p className="text-gray-400 mb-4">Enter your YouTube Channel ID and load real analytics data.</p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={channelId}
                            onChange={(e) => setChannelId(e.target.value)}
                            className="flex-1 bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white"
                            placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
                        />
                        <button onClick={() => void fetchLive(channelId, timeRange)} className="btn-premium" disabled={loading}>
                            {loading ? "Loading..." : "Load"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <BackButton />
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="grid md:grid-cols-4 gap-3">
                    <input
                        type="text"
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        className="md:col-span-2 bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white"
                        placeholder="YouTube Channel ID"
                    />
                    <button onClick={() => void fetchLive(channelId, timeRange)} className="btn-premium" disabled={loading}>
                        {loading ? "Refreshing..." : "Fetch Live"}
                    </button>
                    <button
                        onClick={() => void startBackgroundRefresh()}
                        className="px-4 py-3 rounded-xl border border-cyan-500/30 text-cyan-300 font-bold hover:bg-cyan-500/10"
                        disabled={jobPolling}
                    >
                        {jobPolling ? <span className="inline-flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Job Running</span> : "Background Refresh"}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Data source: YouTube Data API. Last sync: {new Date(data.generatedAt).toLocaleString()}</p>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {["7d", "30d", "90d", "1y"].map((range) => (
                        <button
                            key={range}
                            onClick={() => {
                                setTimeRange(range);
                                void fetchLive(channelId, range);
                            }}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${timeRange === range
                                ? "bg-cyan-500 text-white"
                                : "bg-background-card text-gray-400 hover:text-white border border-white/10"
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-cyan-500 transition-all">
                    <Download size={16} />
                    Export Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {data.stats.map((stat, i) => {
                    const IconComp = iconMap[stat.icon] || Eye;
                    return (
                        <div key={i} className="glass-card p-6 rounded-2xl border border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${colorClassMap[stat.color]?.bg || "bg-blue-500/10"} flex items-center justify-center border ${colorClassMap[stat.color]?.border || "border-blue-500/20"}`}>
                                    <IconComp className={colorClassMap[stat.color]?.text || "text-blue-500"} size={24} />
                                </div>
                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-4xl font-black text-white mb-1">{stat.value}</h3>
                            <p className="text-sm font-semibold text-gray-400">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {anomalyAlerts.length > 0 && (
                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                    <h3 className="text-2xl font-black text-white mb-6">Anomaly Detection Alerts</h3>
                    <div className="space-y-4">
                        {anomalyAlerts.map((alert, i) => (
                            <div key={i} className={`rounded-2xl border p-4 ${alert.severity === "high" ? "border-red-500/40 bg-red-500/10" : "border-orange-500/35 bg-orange-500/10"}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold text-white">{alert.type}</p>
                                    <span className={`text-xs font-bold uppercase ${alert.severity === "high" ? "text-red-300" : "text-orange-300"}`}>{alert.severity}</span>
                                </div>
                                <p className="text-sm text-gray-300 mb-2">{alert.summary}</p>
                                <p className="text-xs text-cyan-300">Recommended action: {alert.action}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                    <h3 className="text-2xl font-black text-white mb-6">Views Over Recent Videos</h3>
                    <div className="h-64 flex items-end gap-2">
                        {data.chartData.map((height, i) => (
                            <div key={i} className="flex-1 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-lg opacity-80" style={{ height: `${height}%` }} />
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-white/10">
                    <h3 className="text-2xl font-black text-white mb-6">Engagement Metrics</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Likes", value: data.engagement.likes, color: "green" },
                            { label: "Comments", value: data.engagement.comments, color: "blue" },
                            { label: "Shares", value: data.engagement.shares, color: "purple" },
                            { label: "Saves", value: data.engagement.saves, color: "orange" },
                        ].map((metric, i) => (
                            <div key={i}>
                                <div className="flex justify-between mb-2">
                                    <span className="text-white font-semibold">{metric.label}</span>
                                    <span className="text-gray-400">{metric.value}%</span>
                                </div>
                                <div className="w-full bg-background-card rounded-full h-3 overflow-hidden">
                                    <div className={`h-full ${barColorMap[metric.color]} rounded-full`} style={{ width: `${metric.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <h3 className="text-2xl font-black text-white mb-6">Top Performing Videos</h3>
                <div className="space-y-4">
                    {data.topVideos.map((video, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-background-card rounded-xl">
                            <div className="text-5xl">{video.emoji}</div>
                            <div className="flex-1">
                                <div className="font-bold text-white mb-1">{video.title}</div>
                                <div className="flex gap-4 text-sm text-gray-400">
                                    <span>{video.views} views</span>
                                    <span>CTR-proxy: {video.ctr}</span>
                                    <span>Engagement: {video.engagement}</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">{new Date(video.publishedAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
