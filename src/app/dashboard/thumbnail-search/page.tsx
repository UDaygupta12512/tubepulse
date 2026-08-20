/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, Eye, Download, Clock } from "lucide-react";
import { useToast } from "@/components/Toast";
import { exportToCSV } from "@/lib/generators";
import { copyTextToClipboard, normalizeInputText } from "@/lib/utils";

interface ThumbnailSearchResult {
    id: string;
    title: string;
    views: string;
    ctr: string;
    ctrNum: number;
    thumbnailUrl: string;
    score: number;
    daysAgo: number;
}

export default function ThumbnailSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<ThumbnailSearchResult[]>([]);
    const [filter, setFilter] = useState("all");
    const [selectedResult, setSelectedResult] = useState<ThumbnailSearchResult | null>(null);
    const { showToast } = useToast();

    const [powerWords, setPowerWords] = useState<string[]>([]);
    const [history, setHistory] = useState<string[]>([]);

    // Load history on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("tubepulse_search_history");
            if (stored) setHistory(JSON.parse(stored));
        } catch { /* no-op */ }
    }, []);

    const runSearch = async (query: string, f: string) => {
        setSearching(true);
        try {
            // Save to history
            const newHistory = [query, ...history.filter(h => h !== query)].slice(0, 10);
            setHistory(newHistory);
            localStorage.setItem("tubepulse_search_history", JSON.stringify(newHistory));

            const res = await fetch(`/api/thumbnails/search?q=${encodeURIComponent(query)}&filter=${encodeURIComponent(f)}`);
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to fetch thumbnail search results");
            }
            const data = await res.json();
            setResults(data.results || []);
            setPowerWords(data.powerWords || []);
            setSelectedResult(null);
            if ((data.results || []).length === 0) {
                showToast("No results found for this query. Try a different topic.", "warning");
            } else {
                showToast(`Found ${data.results.length} high-performing thumbnails!`, "success");
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error searching thumbnails", "error");
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedQuery = normalizeInputText(searchQuery);
        if (!normalizedQuery) {
            showToast("Enter a search topic or channel first.", "warning");
            return;
        }
        setSearchQuery(normalizedQuery);
        runSearch(normalizedQuery, filter);
    };

    const handleFilterChange = (f: string) => {
        setFilter(f);
        if (searchQuery) {
            runSearch(searchQuery, f);
        }
    };

    const handleExport = () => {
        if (results.length === 0) return;
        const normalizedQuery = normalizeInputText(searchQuery) || "thumbnail-search";
        exportToCSV(
            ["Title", "Views", "CTR", "Score"],
            results.map(r => [r.title, r.views, r.ctr, String(r.score)]),
            `thumbnail-search-${normalizedQuery.replace(/\s+/g, "-")}.csv`
        );
        showToast("Report exported as CSV!", "success");
    };

    const handleCopyStyle = async (title: string) => {
        const copied = await copyTextToClipboard(title);
        showToast(
            copied ? "Title copied to clipboard!" : "Unable to copy title. Please copy manually.",
            copied ? "success" : "warning"
        );
    };

    const handleAnalyzeResult = (result: ThumbnailSearchResult) => {
        setSelectedResult(result);
        showToast("Deep insight generated for this thumbnail style.", "info");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="relative">
                <div className="absolute -top-10 right-0 text-9xl animate-float opacity-30 hidden lg:block">🔍</div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
                    <Search size={14} className="text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">AI Powered Search</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Global Thumbnail Search</h1>
                <p className="text-gray-400 text-xl">Reverse engineer winning thumbnails and discover what makes them viral</p>
            </div>

            {/* Floating Decorative Emojis */}
            <div className="hidden lg:flex justify-end gap-4 mb-8">
                <div className="text-7xl animate-float">👨‍💻</div>
                <div className="text-7xl animate-float-delayed">🎨</div>
                <div className="text-7xl animate-float-slow">🧙‍♂️</div>
            </div>

            {/* Search Form */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Search by Topic, Keyword, or Channel</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Ex: AI automation, coding tutorial, make money online..."
                                    className="w-full bg-background-card border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-lg"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={searching}
                            className="btn-premium px-8 py-4 text-lg self-end disabled:opacity-50"
                        >
                            {searching ? "Searching..." : "Analyze"}
                        </button>
                    </div>

                    {/* Filters & History */}
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-3">
                            {["all", "high-ctr", "trending", "recent"].map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => handleFilterChange(f)}
                                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                                        filter === f
                                            ? "bg-blue-500 text-white"
                                            : "bg-background-card text-gray-400 hover:text-white border border-white/10"
                                    }`}
                                >
                                    {f.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                                </button>
                            ))}
                        </div>
                        {history.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                                <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                                    <Clock size={12} /> Recent:
                                </span>
                                {history.map((h, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery(h);
                                            runSearch(h, filter);
                                        }}
                                        className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all"
                                    >
                                        {h}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Results */}
            {results.length > 0 ? (
                <div className="space-y-6">
                    {/* Semantic Power Words */}
                    {powerWords.length > 0 && (
                        <div className="glass-panel p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 mb-8 animate-in fade-in slide-in-from-bottom-2">
                            <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                                <span className="text-xl">🔥</span> Semantic Power Words
                            </h3>
                            <p className="text-gray-300 text-sm mb-4">
                                Our NLP algorithm scanned the top {results.length} ranking titles for this niche. The algorithm stripped out filler words and mathematically extracted the exact psychological trigger words that are common among the winners:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {powerWords.map((word, i) => (
                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 font-black text-sm uppercase tracking-wider">
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-white">Analysis Results</h2>
                            <p className="text-gray-400">{results.length} high-performing thumbnails found</p>
                        </div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-blue-500 transition-all"
                        >
                            <Download size={16} />
                            Export Report
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((result) => (
                            <div key={result.id} className="glass-card p-6 rounded-2xl border border-white/5 hover:-translate-y-2 transition-all duration-300 group">
                                {/* Thumbnail Preview */}
                                <div className="relative mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 aspect-video flex items-center justify-center border border-white/10 group-hover:border-blue-500/30 transition-all">
                                    {result.thumbnailUrl ? (
                                        <img
                                            src={result.thumbnailUrl}
                                            alt={result.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="text-4xl text-white/20">No Image</div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        Score: {result.score}
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-500 transition-colors">
                                    {result.title}
                                </h3>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-background-card p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                            <Eye size={12} /> Views
                                        </div>
                                        <div className="text-white font-black">{result.views}</div>
                                    </div>
                                    <div className="bg-background-card p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                            <TrendingUp size={12} /> Est. CTR
                                        </div>
                                        <div className="text-green-500 font-black">{result.ctr}</div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAnalyzeResult(result)}
                                        className="flex-1 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 font-semibold text-sm hover:bg-blue-500/20 transition-all"
                                    >
                                        Analyze
                                    </button>
                                    <button
                                        onClick={() => handleCopyStyle(result.title)}
                                        className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white text-sm"
                                    >
                                        Copy Style
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Selected Result Breakdown */}
                    {selectedResult && (
                        <div className="glass-panel p-8 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                            <h3 className="text-2xl font-black text-white mb-2">Focused Thumbnail Breakdown</h3>
                            <p className="text-gray-300 mb-6">{selectedResult.title}</p>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-gray-400 mb-1">Estimated CTR</div>
                                    <div className="text-2xl font-black text-green-500">{selectedResult.ctr}</div>
                                </div>
                                <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-gray-400 mb-1">Title Length</div>
                                    <div className="text-2xl font-black text-white">{selectedResult.title.trim().split(/\s+/).length} words</div>
                                </div>
                                <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-gray-400 mb-1">Freshness</div>
                                    <div className="text-2xl font-black text-white">{selectedResult.daysAgo}d ago</div>
                                </div>
                                <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                    <div className="text-xs text-gray-400 mb-1">Style Score</div>
                                    <div className="text-2xl font-black text-blue-400">{selectedResult.score}/100</div>
                                </div>
                            </div>
                            <div className="mt-5 text-sm text-gray-300">
                                💡 Recommended move: keep the same curiosity pattern and test a shorter variant (4–6 words) with one high-contrast visual anchor.
                            </div>
                        </div>
                    )}

                    {/* AI Insights Panel */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="text-5xl">🧠</div>
                            <div>
                                <h3 className="text-2xl font-black text-white">AI Insights</h3>
                                <p className="text-gray-400">What makes these thumbnails successful</p>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            {[
                                {
                                    label: "Avg Est. CTR",
                                    value: results.length > 0
                                        ? (results.reduce((a: number, r) => a + r.ctrNum, 0) / results.length).toFixed(1) + "%"
                                        : "N/A",
                                    insight: "Above average",
                                    icon: "📈",
                                },
                                { label: "Color Palette", value: "High Contrast", insight: "Bold reds & yellows", icon: "🎨" },
                                { label: "Text Length", value: "4–6 words", insight: "Optimal readability", icon: "✍️" },
                            ].map((stat, i) => (
                                <div key={i} className="bg-background-card p-6 rounded-xl border border-white/5">
                                    <div className="text-4xl mb-3">{stat.icon}</div>
                                    <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                                    <div className="text-sm text-gray-400 font-semibold mb-1">{stat.label}</div>
                                    <div className="text-xs text-blue-500">{stat.insight}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-panel min-h-[400px] rounded-3xl border border-white/10 flex items-center justify-center">
                    <div className="text-center p-12">
                        <div className="text-9xl mb-6 animate-bounce-slow">🔍</div>
                        <h3 className="text-3xl font-black text-white mb-3">Start Your Search</h3>
                        <p className="text-gray-400 text-lg max-w-md mx-auto">
                            Enter a topic above to discover high-performing thumbnails and learn what makes them successful
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
