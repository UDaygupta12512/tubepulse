"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Eye, Download, AlertCircle, TrendingUp } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/components/Toast";
import { PageLoadingSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { exportToCSV } from "@/lib/generators";
import { normalizeInputText } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type CompetitorAnalysisData = {
    channel: {
        name: string;
        subscribers: string;
        videos: number | string;
        totalViews: string;
        joinedDate: string;
        uploadFrequency: string;
        avgViews: string;
        emoji: string;
    };
    strengths: Array<{ title: string; description: string; impact: string; icon: string }>;
    weaknesses: Array<{ title: string; description: string; opportunity: string; icon: string }>;
    topVideos: Array<{ title: string; views: string; ctr: string; engagement: string; emoji: string; velocity?: string }>;
    contentThemes: Array<{ theme: string; percentage: number; videos: number }>;
    postingSchedule: { bestDays: string[]; bestTimes: string[]; avgDuration: string };
    recommendations: string[];
    viewTrendData: Array<{ date: string; views: number; title: string }>;
};

export default function CompetitorAnalysis() {
    const didAutoAnalyze = useRef(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [channelUrl, setChannelUrl] = useState("");
    const [question, setQuestion] = useState("");
    const [analysis, setAnalysis] = useState<CompetitorAnalysisData & { aiAnswer?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        if (didAutoAnalyze.current) {
            return;
        }

        didAutoAnalyze.current = true;
        const query = new URLSearchParams(window.location.search);
        const channel = normalizeInputText(query.get("channel"));
        if (!channel) {
            return;
        }

        setChannelUrl(channel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        runAnalysis(channel);
    }, [showToast]);

    const runAnalysis = async (channel: string, customQuestion: string = "") => {
        setAnalyzing(true);
        setError(null);
        try {
            const params = new URLSearchParams({ channel });
            if (customQuestion) params.append("question", customQuestion);
            const res = await fetch(`/api/competitor/live?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch competitor data");
            const data = await res.json();
            setAnalysis(data);
            showToast(`Loaded competitor analysis for ${channel}.`, "info");
        } catch {
            setError("Channel not found or API failed.");
            setAnalysis(null);
            showToast("Error loading competitor data.", "warning");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedChannel = normalizeInputText(channelUrl);
        if (!normalizedChannel) {
            showToast("Enter a channel handle or URL first.", "warning");
            return;
        }

        runAnalysis(normalizedChannel, question.trim());
    };

    const handleExportAnalysis = () => {
        if (!analysis) return;
        exportToCSV(
            ["Metric", "Value"],
            [
                ["Channel", analysis.channel.name],
                ["Subscribers", analysis.channel.subscribers],
                ["Total Videos", String(analysis.channel.videos)],
                ["Total Views", analysis.channel.totalViews],
                ["Avg Views", analysis.channel.avgViews],
                ["Upload Frequency", analysis.channel.uploadFrequency],
                ...analysis.topVideos.map((v) => [`Top Video: ${v.title}`, `${v.views} views, ${v.ctr} CTR`]),
                ...analysis.recommendations.map((r: string, i: number) => [`Recommendation ${i + 1}`, r]),
            ],
            `competitor-analysis-${channelUrl.replace(/[^a-zA-Z0-9]/g, '-')}.csv`
        );
        showToast("Analysis report exported!");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <BackButton />
            </div>

            <div className="relative">
                <div className="absolute -top-10 right-0 hidden lg:flex gap-4">
                    <div className="text-8xl animate-float">🔎</div>
                    <div className="text-8xl animate-float-delayed">📊</div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-4">
                    <Users size={14} className="text-violet-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-400">Spy Mode</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Competitor Analysis</h1>
                <p className="text-gray-400 text-xl">Deep dive into competitor strategies and steal their winning playbook</p>
            </div>

            {/* Input Form */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <form onSubmit={handleAnalyze} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Competitor Channel URL</label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={channelUrl}
                                onChange={(e) => setChannelUrl(e.target.value)}
                                placeholder="e.g., @channelname or https://youtube.com/@channelname"
                                className="flex-1 bg-background-card border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={analyzing}
                                className="btn-premium px-8 disabled:opacity-50"
                            >
                                {analyzing ? "Analyzing..." : "Analyze"}
                            </button>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-2">🔥 Quick Suggestions:</p>
                        <div className="flex flex-wrap gap-2">
                            {["@mkbhd", "@mrwhosetheboss", "@veritasium", "@fireship", "@garyvee"].map((ch) => (
                                <button
                                    key={ch}
                                    type="button"
                                    onClick={() => setChannelUrl(ch)}
                                    className="px-3 py-1.5 rounded-full bg-background-card border border-white/10 text-gray-400 text-sm hover:text-white hover:border-violet-500 transition-all"
                                >
                                    {ch}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Specific Question (Optional but Powerful)</label>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="e.g. Why did their views drop last month? What are they doing differently in their intros?"
                            className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all h-20 resize-none"
                        />
                    </div>
                    {!analysis && !analyzing && (
                        <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2">
                            <span className="text-xs text-gray-500 font-semibold self-center mr-2">Try analyzing:</span>
                            {["@MrBeast", "@MKBHD", "@AliAbdaal", "@ThinkMedia"].map(handle => (
                                <button
                                    key={handle}
                                    type="button"
                                    onClick={() => {
                                        setChannelUrl(handle);
                                        runAnalysis(handle, "");
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-violet-400 font-medium hover:text-white hover:bg-violet-500/20 hover:border-violet-500/30 transition-all"
                                >
                                    {handle}
                                </button>
                            ))}
                        </div>
                    )}
                </form>
            </div>

            {analyzing && (
                <div className="mt-8">
                    <PageLoadingSkeleton />
                </div>
            )}

            {error && !analyzing && (
                <div className="mt-8">
                    <EmptyState 
                        type="error"
                        icon="🚫"
                        title="Analysis Failed"
                        description="We couldn't analyze that channel. It might not exist, or it has zero videos."
                        action={{ label: "Try Another", onClick: () => setError(null) }}
                    />
                </div>
            )}

            {analysis && !analyzing && !error && (
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="text-violet-500" />
                            <h2 className="text-2xl font-black text-white">Analysis Results for {analysis.channel.name}</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleExportAnalysis} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all text-sm">
                                <Download size={16} /> Export CSV
                            </button>
                        </div>
                    </div>

                    {/* AI Direct Answer (If question was asked) */}
                    {analysis.aiAnswer && (
                        <div className="glass-panel p-8 rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent mb-8">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-violet-500/20 text-violet-400 rounded-2xl">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white mb-2">AI Direct Answer</h3>
                                    <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">{analysis.aiAnswer}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Channel Overview */}
                    <div className="glass-card p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
                        <div className="flex items-center gap-6">
                            <div className="text-8xl">{analysis.channel.emoji}</div>
                            <div className="flex-1">
                                <h2 className="text-4xl font-black text-white mb-2">{analysis.channel.name}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <div className="text-2xl font-black text-white">{analysis.channel.subscribers}</div>
                                        <div className="text-sm text-gray-400">Subscribers</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">{analysis.channel.videos}</div>
                                        <div className="text-sm text-gray-400">Videos</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">{analysis.channel.totalViews}</div>
                                        <div className="text-sm text-gray-400">Total Views</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-white">{analysis.channel.avgViews}</div>
                                        <div className="text-sm text-gray-400">Avg Views</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Strengths */}
                        <div className="glass-panel p-8 rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                <span className="text-4xl">💪</span>
                                Key Strengths
                            </h3>
                            <div className="space-y-4">
                                {analysis.strengths.map((strength, i: number) => (
                                    <div key={i} className="bg-background-card p-4 rounded-xl border border-white/5">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="text-3xl">{strength.icon}</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white mb-1">{strength.title}</div>
                                                <p className="text-sm text-gray-400">{strength.description}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${strength.impact === 'High' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                                }`}>
                                                {strength.impact}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Weaknesses */}
                        <div className="glass-panel p-8 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-red-500/5">
                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                <span className="text-4xl">🎯</span>
                                Opportunities to Beat Them
                            </h3>
                            <div className="space-y-4">
                                {analysis.weaknesses.map((weakness, i: number) => (
                                    <div key={i} className="bg-background-card p-4 rounded-xl border border-white/5">
                                        <div className="flex items-start gap-3 mb-2">
                                            <div className="text-3xl">{weakness.icon}</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white mb-1">{weakness.title}</div>
                                                <p className="text-sm text-gray-400 mb-2">{weakness.description}</p>
                                                <div className="text-xs text-orange-500 font-bold flex items-center gap-1">
                                                    <AlertCircle size={12} />
                                                    {weakness.opportunity}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top Performing Videos & Trend Chart */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Interactive View Trend Chart */}
                        <div className="glass-panel p-8 rounded-3xl border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-white">Recent Views Trend</h3>
                                <TrendingUp className="text-violet-500" />
                            </div>
                            <div className="h-[300px] w-full">
                                {analysis.viewTrendData && analysis.viewTrendData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analysis.viewTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                            <XAxis 
                                                dataKey="date" 
                                                stroke="rgba(255,255,255,0.5)" 
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis 
                                                stroke="rgba(255,255,255,0.5)" 
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                                itemStyle={{ color: '#fff' }}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                                formatter={(value: any) => [new Intl.NumberFormat('en-US').format(Number(value)), 'Views']}
                                                labelFormatter={(label, payload) => {
                                                    if (payload && payload[0]) return payload[0].payload.title;
                                                    return label;
                                                }}
                                            />
                                            <Area 
                                                type="monotone" 
                                                dataKey="views" 
                                                stroke="#8b5cf6" 
                                                strokeWidth={3}
                                                fillOpacity={1} 
                                                fill="url(#colorViews)" 
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500">Not enough recent data</div>
                                )}
                            </div>
                        </div>

                        {/* Top Videos List */}
                        <div className="glass-panel p-8 rounded-3xl border border-white/10">
                            <h3 className="text-2xl font-black text-white mb-6">Top Performing Videos</h3>
                            <div className="space-y-4">
                                {analysis.topVideos.map((video, i: number) => (
                                    <div key={i} className="flex items-center gap-4 p-4 bg-background-card rounded-xl hover:bg-background-card/80 transition-all">
                                        <div className="text-5xl">{video.emoji}</div>
                                        <div className="flex-1">
                                            <div className="font-bold text-white mb-1">{video.title}</div>
                                            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                                <span className="flex items-center gap-1"><Eye size={14} /> {video.views} views</span>
                                                <span>CTR: {video.ctr}</span>
                                                <span>Eng: {video.engagement}</span>
                                                {video.velocity && (
                                                    <span className="px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold text-xs">
                                                        ⚡ {video.velocity}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Content Themes & Posting Schedule */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="glass-panel p-8 rounded-3xl border border-white/10">
                            <h3 className="text-xl font-black text-white mb-6">Content Distribution</h3>
                            <div className="space-y-4">
                                {analysis.contentThemes.map((theme, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-white font-semibold">{theme.theme}</span>
                                            <span className="text-gray-400">{theme.percentage}% ({theme.videos} videos)</span>
                                        </div>
                                        <progress
                                            value={theme.percentage}
                                            max={100}
                                            className="w-full h-3 rounded-full overflow-hidden bg-background-card accent-violet-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-panel p-8 rounded-3xl border border-white/10">
                            <h3 className="text-xl font-black text-white mb-6">Posting Strategy</h3>
                            <div className="space-y-4">
                                <div className="bg-background-card p-4 rounded-xl">
                                    <div className="text-sm text-gray-400 mb-1">Best Days to Post</div>
                                    <div className="text-white font-bold">{analysis.postingSchedule.bestDays.join(", ")}</div>
                                </div>
                                <div className="bg-background-card p-4 rounded-xl">
                                    <div className="text-sm text-gray-400 mb-1">Optimal Times</div>
                                    <div className="text-white font-bold">{analysis.postingSchedule.bestTimes.join(", ")}</div>
                                </div>
                                <div className="bg-background-card p-4 rounded-xl">
                                    <div className="text-sm text-gray-400 mb-1">Avg Video Duration</div>
                                    <div className="text-white font-bold">{analysis.postingSchedule.avgDuration}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actionable Recommendations */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                        <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="text-4xl">🚀</span>
                            Your Action Plan to Outperform
                        </h3>
                        <ul className="space-y-3">
                            {analysis.recommendations.map((rec: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-gray-300">
                                    <div className="text-green-500 font-bold mt-1">{i + 1}.</div>
                                    <span className="text-lg">{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {!analysis && !analyzing && !error && (
                <EmptyState 
                    icon="🕵️‍♂️"
                    title="Ready to Spy on Competitors?"
                    description="Enter a competitor's channel URL above to uncover their secrets and strategies."
                />
            )}
        </div>
    );
}
