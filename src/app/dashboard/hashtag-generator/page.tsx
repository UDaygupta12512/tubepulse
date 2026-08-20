"use client";

import { useState } from "react";
import { Hash, TrendingUp, Copy, Check, Sparkles, Target, AlertTriangle } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/components/Toast";
import { copyTextToClipboard, normalizeInputText } from "@/lib/utils";

export default function HashtagGenerator() {
    const [generating, setGenerating] = useState(false);
    const [topic, setTopic] = useState("");
    const [hashtags, setHashtags] = useState<any>(null);
    const [copied, setCopied] = useState("");
    const { showToast } = useToast();

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedTopic = normalizeInputText(topic);
        if (!normalizedTopic) {
            showToast("Enter a topic to generate hashtags.", "warning");
            return;
        }

        setTopic(normalizedTopic);
        setGenerating(true);
        try {
            const res = await fetch(`/api/hashtags/live?topic=${encodeURIComponent(normalizedTopic)}`);
            if (!res.ok) throw new Error("Failed to fetch hashtags");
            const data = await res.json();
            
            setHashtags(data);
            showToast("Hashtags generated!");
        } catch (error) {
            console.error(error);
            showToast("Error generating hashtags. Please try again later.", "warning");
            setHashtags(null);
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = async (text: string, type: string) => {
        const copiedSuccessfully = await copyTextToClipboard(text);
        if (!copiedSuccessfully) {
            showToast("Unable to copy automatically. Please copy manually.", "warning");
            return;
        }

        setCopied(type);
        showToast("Copied to clipboard!");
        setTimeout(() => setCopied(""), 2000);
    };

    const copyCategory = async (tags: any[], categoryKey: string) => {
        const tagString = tags.map(t => t.tag).join(' ');
        const copiedSuccessfully = await copyTextToClipboard(tagString);
        if (!copiedSuccessfully) {
            showToast("Unable to copy tag set automatically. Please copy manually.", "warning");
            return;
        }

        setCopied(categoryKey);
        showToast("All tags copied!");
        setTimeout(() => setCopied(""), 2000);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Very High': return 'text-red-500 bg-red-500/10';
            case 'High': return 'text-orange-500 bg-orange-500/10';
            case 'Medium': return 'text-yellow-500 bg-yellow-500/10';
            case 'Low': return 'text-green-500 bg-green-500/10';
            case 'Very Low': return 'text-emerald-500 bg-emerald-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <BackButton />
            </div>

            <div className="relative">
                <div className="absolute -top-10 right-0 hidden lg:flex gap-4">
                    <div className="text-8xl animate-float">#️⃣</div>
                    <div className="text-8xl animate-float-delayed">📊</div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                    <Hash size={14} className="text-cyan-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Tag Engine</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Hashtag Generator</h1>
                <p className="text-gray-400 text-xl">Generate viral hashtags that maximize your discoverability</p>
            </div>

            {/* Input Form */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Video Topic or Niche</label>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., AI automation, Productivity hacks, Tech reviews"
                                className="flex-1 bg-background-card border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                                required
                            />
                            <button
                                type="submit"
                                disabled={generating}
                                className="btn-premium px-8 disabled:opacity-50"
                            >
                                {generating ? (
                                    <>
                                        <Sparkles className="animate-spin mr-2" size={20} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Hash size={20} className="mr-2" />
                                        Generate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {hashtags && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {/* SEO Cannibalization Alert */}
                    {hashtags.cannibalizationWarning && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-red-500 font-bold mb-1">SEO Alert</h4>
                                <p className="text-red-200 text-sm leading-relaxed">{hashtags.cannibalizationWarning}</p>
                            </div>
                        </div>
                    )}
                    {/* Hashtag Categories */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Trending Hashtags */}
                        <div className="glass-panel p-8 rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <span className="text-4xl">🔥</span>
                                    Trending Now
                                </h3>
                                <button
                                    onClick={() => copyCategory(hashtags.trending, 'trending')}
                                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    {copied === 'trending' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    Copy All
                                </button>
                            </div>
                            <div className="space-y-3">
                                {hashtags.trending.map((tag: any, i: number) => (
                                    <div key={i} className="bg-background-card p-4 rounded-xl border border-white/5 hover:border-red-500/20 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{tag.emoji}</span>
                                                <span className="text-lg font-bold text-white">{tag.tag}</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(tag.tag, tag.tag)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {copied === tag.tag ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400 hover:text-white" />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-400 flex items-center gap-1">
                                                <Target size={12} /> {tag.volume}
                                            </span>
                                            <span className="text-green-500 font-bold flex items-center gap-1">
                                                <TrendingUp size={12} /> {tag.trend}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getDifficultyColor(tag.difficulty)}`}>
                                                {tag.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Niche Hashtags */}
                        <div className="glass-panel p-8 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                                    <span className="text-4xl">🎯</span>
                                    Niche Focused
                                </h3>
                                <button
                                    onClick={() => copyCategory(hashtags.niche, 'niche')}
                                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                                >
                                    {copied === 'niche' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                    Copy All
                                </button>
                            </div>
                            <div className="space-y-3">
                                {hashtags.niche.map((tag: any, i: number) => (
                                    <div key={i} className="bg-background-card p-4 rounded-xl border border-white/5 hover:border-blue-500/20 transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{tag.emoji}</span>
                                                <span className="text-lg font-bold text-white">{tag.tag}</span>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(tag.tag, tag.tag)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                {copied === tag.tag ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400 hover:text-white" />}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-gray-400 flex items-center gap-1">
                                                <Target size={12} /> {tag.volume}
                                            </span>
                                            <span className="text-green-500 font-bold flex items-center gap-1">
                                                <TrendingUp size={12} /> {tag.trend}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getDifficultyColor(tag.difficulty)}`}>
                                                {tag.difficulty}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Long-tail & Branded */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Long-tail */}
                        <div className="glass-panel p-8 rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                <span className="text-4xl">🌱</span>
                                Low Competition Gold
                            </h3>
                            <div className="space-y-3">
                                {hashtags.longTail.map((tag: any, i: number) => (
                                    <div key={i} className="bg-background-card p-3 rounded-xl border border-white/5 flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{tag.emoji}</span>
                                            <span className="font-bold text-white">{tag.tag}</span>
                                            <span className="text-xs text-gray-400">{tag.volume}</span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(tag.tag, tag.tag)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {copied === tag.tag ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400 hover:text-white" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Branded */}
                        <div className="glass-panel p-8 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                            <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                <span className="text-4xl">👑</span>
                                Branded Tags
                            </h3>
                            <div className="space-y-3">
                                {hashtags.branded.map((tag: any, i: number) => (
                                    <div key={i} className="bg-background-card p-3 rounded-xl border border-white/5 flex items-center justify-between group">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{tag.emoji}</span>
                                            <span className="font-bold text-white">{tag.tag}</span>
                                            <span className="text-xs text-purple-400">{tag.volume}</span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(tag.tag, tag.tag)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {copied === tag.tag ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400 hover:text-white" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Best Combinations */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-cyan-500/5 to-blue-500/5">
                        <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                            <span className="text-4xl">🎨</span>
                            Recommended Tag Combinations
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {hashtags.bestCombinations.map((combo: any, i: number) => (
                                <div key={i} className="bg-background-card p-6 rounded-2xl border border-white/5">
                                    <h4 className="text-lg font-black text-white mb-3">{combo.name}</h4>
                                    <div className="space-y-2 mb-4">
                                        {combo.tags.map((tag: string, j: number) => (
                                            <div key={j} className="text-sm text-cyan-400 font-mono">
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-400">Reach: <span className="text-white font-bold">{combo.expectedReach}</span></span>
                                        <span className={`px-2 py-1 rounded-full font-bold ${getDifficultyColor(combo.difficulty)}`}>
                                            {combo.difficulty}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(combo.tags.join(' '), `combo-${i}`)}
                                        className="w-full mt-4 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-500 font-semibold hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {copied === `combo-${i}` ? <Check size={16} /> : <Copy size={16} />}
                                        Copy Set
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pro Tips */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10">
                        <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                            <span className="text-3xl">💡</span>
                            Pro Hashtag Tips
                        </h3>
                        <ul className="space-y-2">
                            {hashtags.tips.map((tip: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-gray-300">
                                    <span className="text-cyan-500 mt-1">▸</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {!hashtags && !generating && (
                <div className="glass-panel min-h-[400px] rounded-3xl border border-white/10 flex items-center justify-center">
                    <div className="text-center p-12">
                        <div className="flex justify-center gap-4 mb-6">
                            <div className="text-7xl animate-float">#️⃣</div>
                            <div className="text-7xl animate-float-delayed">✨</div>
                            <div className="text-7xl animate-float-slow">🎯</div>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-3">Ready to Go Viral?</h3>
                        <p className="text-gray-400 text-lg max-w-md mx-auto">
                            Enter your video topic above to generate powerful hashtags that boost discoverability
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
