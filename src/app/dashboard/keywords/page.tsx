"use client";

import { useState, useRef } from "react";
import { Key, Search, TrendingUp, Target, Zap, Star, Download, RefreshCw } from "lucide-react";
import { exportToCSV } from "@/lib/generators";
import { useToast } from "@/components/Toast";
import { copyTextToClipboard, normalizeInputText } from "@/lib/utils";
import { useDraftStore } from "@/store/useDraftStore";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

interface KeywordResult {
    keyword: string;
    volume: string;
    difficulty: string;
    trend: string;
    competition: number;
    opportunity: number;
    emoji: string;
}

export default function Keywords() {
    const draft = useDraftStore((state) => state.keywords);
    const setDraft = useDraftStore((state) => state.setKeywordsDraft);
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<KeywordResult[]>([]);
    const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
    const [variations, setVariations] = useState<KeywordResult[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { showToast } = useToast();

    const parseCompactToThousands = (value: string) => {
        const numeric = Number.parseFloat(String(value).replace(/,/g, ""));
        if (!Number.isFinite(numeric)) return 0;
        if (value.toUpperCase().includes("M")) return numeric * 1000;
        if (value.toUpperCase().includes("K")) return numeric;
        return numeric / 1000;
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedKeyword = normalizeInputText(draft.keyword);
        if (!normalizedKeyword) {
            showToast("Enter a seed keyword first.", "warning");
            return;
        }

        setDraft({ keyword: normalizedKeyword });
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setSearching(true);
        try {
            const res = await fetchWithRetry(`/api/keywords/live?q=${encodeURIComponent(normalizedKeyword)}`, { signal: abortControllerRef.current.signal });
            if (!res.ok) throw new Error("Failed to fetch keywords");
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                setResults(data.results);
                showToast("Keywords discovered!");
            } else {
                setResults([]);
                showToast("No keywords found. Try a broader topic.", "warning");
            }
            setVariations([]);
            setSelectedKeyword(null);
        } catch (error) {
            console.error(error);
            showToast("Error finding keywords. Please try again later.", "warning");
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleExportCSV = () => {
        if (results.length === 0) {
            showToast("Run a keyword search before exporting.", "warning");
            return;
        }

        const normalizedKeyword = normalizeInputText(draft.keyword) || "keyword research";
        const headers = ["Keyword", "Volume", "Difficulty", "Trend", "Competition %", "Opportunity Score"];
        const rows = results.map(r => [r.keyword, r.volume, r.difficulty, r.trend, String(r.competition), String(r.opportunity)]);
        exportToCSV(headers, rows, `keywords-${normalizedKeyword.replace(/\s+/g, "-").toLowerCase()}.csv`);
        showToast("CSV exported!");
    };

    const getDifficultyColor = (diff: string) => {
        if (diff === "Low") return "text-green-500 bg-green-500/10";
        if (diff === "Medium") return "text-yellow-500 bg-yellow-500/10";
        return "text-red-500 bg-red-500/10";
    };

    const handleUseKeyword = async (kw: string) => {
        const copied = await copyTextToClipboard(kw);
        setSelectedKeyword(kw);
        showToast(
            copied
                ? `"${kw}" copied! Use it in your next video title or description.`
                : `Could not copy "${kw}" automatically. Please copy it manually.`,
            copied ? "success" : "warning"
        );
    };

    const handleViewVariations = async (kw: string) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setSearching(true);
        try {
            const res = await fetchWithRetry(`/api/keywords/live?q=${encodeURIComponent(kw + " variations")}`, { signal: abortControllerRef.current.signal });
            if (!res.ok) throw new Error("Failed to fetch variations");
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                setVariations(data.results);
                setSelectedKeyword(kw);
                showToast(`${data.results.length} keyword variations found!`);
            } else {
                showToast("No variations found.", "info");
            }
        } catch {
            showToast("Error finding variations.", "warning");
        } finally {
            setSearching(false);
        }
    };

    const handleAnalyzeCompetitors = async (kw: string) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setSearching(true);
        try {
            const res = await fetchWithRetry(`/api/keywords/live?q=${encodeURIComponent(kw + " vs")}`, { signal: abortControllerRef.current.signal });
            if (!res.ok) throw new Error("Failed to fetch competitor keywords");
            const data = await res.json();
            
            if (data.results && data.results.length > 0) {
                const existingKeywords = new Set(results.map((item) => item.keyword.toLowerCase()));
                const newKeywords = data.results
                    .slice(0, 3)
                    .filter((item: KeywordResult) => !existingKeywords.has(item.keyword.toLowerCase()));

                if (newKeywords.length === 0) {
                    showToast(`No new competitor keywords found for "${kw}".`, "info");
                    return;
                }

                setResults((prev) => [...prev, ...newKeywords]);
                showToast(`${newKeywords.length} competitor keyword${newKeywords.length > 1 ? "s" : ""} added for "${kw}"!`);
            } else {
                showToast(`No competitor keywords found.`, "info");
            }
        } catch {
            showToast("Error analyzing competitors.", "warning");
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header with 3D Characters */}
            <div className="relative">
                <div className="absolute -top-10 right-0 hidden lg:flex gap-4">
                    <div className="text-8xl animate-float">🔑</div>
                    <div className="text-8xl animate-float-delayed">🧙‍♀️</div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
                    <Key size={14} className="text-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-green-400">Magic Algorithm</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Magic Keywords</h1>
                <p className="text-gray-400 text-xl">Discover hidden search opportunities before your competition</p>
            </div>

            {/* 3D Character Helper */}
            <div className="glass-card p-6 rounded-2xl border border-green-500/20 bg-gradient-to-r from-green-500/5 to-blue-500/5">
                <div className="flex items-center gap-4">
                    <div className="text-7xl animate-bounce-slow">🧙‍♂️</div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">Your AI Keyword Wizard is Ready!</h3>
                        <p className="text-gray-400 text-sm">I&apos;ll help you find blue ocean keywords with high search volume and low competition</p>
                    </div>
                </div>
            </div>

            {/* Search Form */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <form onSubmit={handleSearch} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Enter Your Seed Keyword or Topic</label>
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    value={draft.keyword}
                                    onChange={(e) => setDraft({ keyword: e.target.value })}
                                    placeholder="Ex: AI tools, coding tutorial, passive income..."
                                    className="w-full bg-background-card border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-lg"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={searching}
                                className="btn-premium px-8 py-4 text-lg disabled:opacity-50"
                            >
                                {searching ? (
                                    <>
                                        <RefreshCw className="animate-spin mr-2" size={20} />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={20} className="mr-2" />
                                        Find Magic
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Quick Suggestions */}
                    <div>
                        <p className="text-xs text-gray-500 mb-2">🔥 Trending Topics:</p>
                        <div className="flex flex-wrap gap-2">
                            {["AI automation", "ChatGPT hacks", "make money online", "coding for beginners", "passive income"].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => setDraft({ keyword: suggestion })}
                                    className="px-3 py-1.5 rounded-full bg-background-card border border-white/10 text-gray-400 text-sm hover:text-white hover:border-green-500 transition-all"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </form>
            </div>

            {/* Results */}
            {results.length > 0 ? (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-black text-white">Magical Opportunities Found! ✨</h2>
                            <p className="text-gray-400 text-lg">{results.length} high-potential keywords categorized for you</p>
                        </div>
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-green-500 transition-all">
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>

                    {/* AI Analysis Cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="glass-card p-6 rounded-2xl text-center border border-white/5">
                            <div className="text-5xl mb-3">💎</div>
                            <div className="text-3xl font-black text-white mb-2">{Math.round(results.reduce((a, r) => a + r.opportunity, 0) / results.length)}</div>
                            <div className="text-sm text-gray-400 font-semibold">Avg Opportunity</div>
                            <div className="text-xs text-green-500 mt-1">Excellent potential</div>
                        </div>
                        <div className="glass-card p-6 rounded-2xl text-center border border-white/5">
                            <div className="text-5xl mb-3">📈</div>
                            <div className="text-3xl font-black text-white mb-2">{Math.round(results.reduce((a, r) => a + parseCompactToThousands(r.volume), 0) / results.length)}K</div>
                            <div className="text-sm text-gray-400 font-semibold">Avg Search Volume</div>
                            <div className="text-xs text-blue-500 mt-1">High traffic</div>
                        </div>
                        <div className="glass-card p-6 rounded-2xl text-center border border-white/5">
                            <div className="text-5xl mb-3">🚀</div>
                            <div className="text-3xl font-black text-white mb-2">+{Math.round(results.reduce((a, r) => a + parseInt(r.trend.replace('+', '').replace('%', '')), 0) / results.length)}%</div>
                            <div className="text-sm text-gray-400 font-semibold">Avg Trend Growth</div>
                            <div className="text-xs text-orange-500 mt-1">Rapidly growing</div>
                        </div>
                    </div>

                    {/* Categorized Keyword Groups */}
                    <div className="space-y-8">
                        {[
                            {
                                id: "blue-ocean",
                                title: "🌊 Blue Ocean (Low Comp, High Opp)",
                                desc: "Keywords your competitors are ignoring.",
                                filter: (r: KeywordResult) => r.competition < 50 && r.opportunity >= 65
                            },
                            {
                                id: "trending",
                                title: "🔥 Rapidly Trending",
                                desc: "High velocity topics to jump on right now.",
                                filter: (r: KeywordResult) => parseInt(r.trend.replace('+', '').replace('%', '')) >= 40
                            },
                            {
                                id: "evergreen",
                                title: "🌲 Steady Evergreen",
                                desc: "Reliable search terms for long-term traffic.",
                                filter: (r: KeywordResult) => parseInt(r.trend.replace('+', '').replace('%', '')) < 40 && r.competition >= 50
                            }
                        ].map(category => {
                            const categoryResults = results.filter(category.filter);
                            if (categoryResults.length === 0) return null;
                            
                            return (
                                <div key={category.id} className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{category.title}</h3>
                                        <p className="text-sm text-gray-400">{category.desc}</p>
                                    </div>
                                    <div className="grid gap-4">
                                        {categoryResults.map((result, i) => (
                            <div key={i} className="glass-card p-6 rounded-2xl border border-white/5 hover:border-green-500/30 transition-all group">
                                <div className="flex items-start gap-6">
                                    {/* Emoji Icon */}
                                    <div className="text-6xl group-hover:scale-110 transition-transform">
                                        {result.emoji}
                                    </div>

                                    {/* Keyword info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-2xl font-black text-white mb-2 group-hover:text-green-500 transition-colors">
                                                    {result.keyword}
                                                </h3>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(result.difficulty)}`}>
                                                        {result.difficulty} Difficulty
                                                    </span>
                                                    <span className="text-green-500 font-bold text-sm flex items-center gap-1">
                                                        <TrendingUp size={14} />
                                                        {result.trend} trending
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-4xl font-black text-white mb-1">{result.opportunity}</div>
                                                <div className="text-xs text-gray-500 font-semibold">Opportunity Score</div>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                                                    <Search size={12} /> Monthly Searches
                                                </div>
                                                <div className="text-white font-black text-xl">{result.volume}</div>
                                            </div>
                                            <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                                                    <Target size={12} /> Competition
                                                </div>
                                                <div className="text-white font-black text-xl">{result.competition}%</div>
                                            </div>
                                            <div className="bg-background-card p-4 rounded-xl border border-white/5">
                                                <div className="text-gray-400 text-xs mb-1 flex items-center gap-1">
                                                    <Star size={12} /> Potential Views
                                                </div>
                                                <div className="text-green-500 font-black text-xl">{(parseCompactToThousands(result.volume) * 0.3).toFixed(1)}K</div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button onClick={() => handleUseKeyword(result.keyword)} className="px-4 py-2 rounded-xl bg-green-500/10 text-green-500 font-semibold text-sm hover:bg-green-500/20 transition-all">
                                                Use This Keyword
                                            </button>
                                            <button onClick={() => handleViewVariations(result.keyword)} className="px-4 py-2 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-all">
                                                View Variations
                                            </button>
                                            <button onClick={() => handleAnalyzeCompetitors(result.keyword)} className="px-4 py-2 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-all">
                                                Analyze Competitors
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Keyword Variations */}
                    {variations.length > 0 && selectedKeyword && (
                        <div className="glass-panel p-6 rounded-3xl border border-green-500/20 bg-gradient-to-r from-green-500/5 to-blue-500/5">
                            <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                                <span className="text-2xl">✨</span>
                                Variations for &ldquo;{selectedKeyword}&rdquo;
                            </h3>
                            <div className="grid md:grid-cols-2 gap-3">
                                {variations.map((v, i) => (
                                    <div key={i} className="bg-background-card p-4 rounded-xl border border-white/5 flex items-center justify-between group hover:border-green-500/20 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{v.emoji}</span>
                                            <div>
                                                <div className="text-white font-semibold text-sm">{v.keyword}</div>
                                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                                    <span>{v.volume} searches</span>
                                                    <span className="text-green-500">{v.trend}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleUseKeyword(v.keyword)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 rounded-lg bg-green-500/10 text-green-500 text-xs font-bold"
                                        >
                                            Use
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-panel min-h-[400px] rounded-3xl border border-white/10 flex items-center justify-center">
                    <div className="text-center p-12">
                        <div className="flex justify-center gap-4 mb-6">
                            <div className="text-7xl animate-float">✨</div>
                            <div className="text-7xl animate-float-delayed">🔍</div>
                            <div className="text-7xl animate-float-slow">🚀</div>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-3">Ready to Unlock Magic Keywords?</h3>
                        <p className="text-gray-400 text-lg max-w-md mx-auto">
                            Enter a topic above and let our AI wizard find hidden opportunities with massive potential
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
