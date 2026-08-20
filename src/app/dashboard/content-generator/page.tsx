"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Copy, RefreshCw, Wand2, Check, Zap, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { downloadAsFile } from "@/lib/generators";
import { useToast } from "@/components/Toast";
import { copyTextToClipboard, normalizeInputText } from "@/lib/utils";
import { ContentGeneratorSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { GlassCard } from "@/components/ui/GlassCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useDraftStore } from "@/store/useDraftStore";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

export default function ContentGenerator() {
    const queryClient = useQueryClient();
    const draft = useDraftStore((state) => state.content);
    const setDraft = useDraftStore((state) => state.setContentDraft);

    
    const [copied, setCopied] = useState<string>("");
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    
    // This state actually triggers the fetch. We only want to fetch when the user hits 'Generate',
    // but we want useQuery to cache the result based on these specific triggered params.
    const [activeQuery, setActiveQuery] = useState<any>(null);

    const { showToast } = useToast();

    const tones = [
        { id: "professional", name: "Professional", emoji: "💼", desc: "Formal and educational" },
        { id: "casual", name: "Casual", emoji: "😊", desc: "Friendly and relaxed" },
        { id: "hype", name: "Hype", emoji: "🔥", desc: "Energetic and exciting" },
        { id: "storytelling", name: "Story", emoji: "📖", desc: "Narrative driven" },
    ];

    const fetchHistory = () => {
        try {
            const stored = localStorage.getItem("tubepulse_content_history");
            if (stored) setHistory(JSON.parse(stored));
        } catch { /* no-op */ }
    };

    useEffect(() => { fetchHistory(); }, []);

    // React Query handles caching automatically.
    const { data: result, isFetching: loading, error, refetch } = useQuery({
        queryKey: ['content', activeQuery?.topic, activeQuery?.tone, activeQuery?.audience, activeQuery?.channelStyle, activeQuery?.uniqueAngle],
        queryFn: async ({ signal }) => {
            if (!activeQuery) return null;
            const params = new URLSearchParams({
                topic: activeQuery.topic,
                tone: activeQuery.tone,
                ...(activeQuery.audience && { audience: activeQuery.audience }),
                ...(activeQuery.channelStyle && { channelStyle: activeQuery.channelStyle }),
                ...(activeQuery.uniqueAngle && { uniqueAngle: activeQuery.uniqueAngle }),
            });
            const res = await fetchWithRetry(`/api/content/live?${params.toString()}`, { signal });
            if (!res.ok) throw new Error("Failed to fetch content");
            const data = await res.json();
            
            // Auto-save to localStorage history
            const newItem = { id: Date.now().toString(), topic: activeQuery.topic, tone: activeQuery.tone, result: data, createdAt: new Date().toISOString() };
            const stored = localStorage.getItem("tubepulse_content_history");
            const prev = stored ? JSON.parse(stored) : [];
            const updated = [newItem, ...prev].slice(0, 10);
            localStorage.setItem("tubepulse_content_history", JSON.stringify(updated));
            setHistory(updated);
            
            showToast("Content generated successfully!");
            return data;
        },
        enabled: !!activeQuery, // Only run if we have an active query submitted
    });

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedTopic = normalizeInputText(draft.topic);
        if (!normalizedTopic) {
            showToast("Enter a video topic to generate content.", "warning");
            return;
        }

        setDraft({ topic: normalizedTopic });
        // Setting this state automatically triggers useQuery if the key is new, 
        // or instantly loads from cache if it exists!
        setActiveQuery({ topic: normalizedTopic, tone: draft.tone, audience: draft.audience, channelStyle: draft.channelStyle, uniqueAngle: draft.uniqueAngle });
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

    const handleDownloadAll = () => {
        if (!result) return;
        const normalizedTopic = normalizeInputText(draft.topic) || "content strategy";
        const titlesText = result.titles.map((t: any) => `[${t.predicted_ctr} CTR] ${t.title} (${t.angle})`).join("\n");
        const chaptersText = result.chapters ? result.chapters.map((c: any) => `${c.timestamp} - ${c.title}`).join("\n") : "";
        const engagementText = result.engagement_assets ? `PINNED COMMENT:\n${result.engagement_assets.pinned_comment}\n\nCOMMUNITY POST:\n${result.engagement_assets.community_post}` : "";
        
        const content = `TITLES:\n${titlesText}\n\nDESCRIPTION:\n${result.description}\n\nCHAPTERS:\n${chaptersText}\n\nENGAGEMENT:\n${engagementText}\n\nTAGS:\n${result.tags.join(" ")}\n\nTHUMBNAIL IDEAS:\n${result.thumbnailIdeas.join("\n")}`;
        downloadAsFile(content, `content-${normalizedTopic.replace(/\s+/g, "-").toLowerCase()}.txt`);
        showToast("Content downloaded!");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with 3D Characters */}
            <div className="relative">
                <div className="absolute -top-10 right-0 hidden lg:flex gap-4">
                    <div className="text-8xl animate-float">✨</div>
                    <div className="text-8xl animate-float-delayed">🎬</div>
                    <div className="text-8xl animate-float-slow">📝</div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-4">
                    <Sparkles size={14} className="text-purple-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">AI Content Wizard</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Magic Content Generator</h1>
                <p className="text-gray-400 text-xl">Transform ideas into viral scripts, titles, and descriptions instantly</p>
            </div>

            {/* 3D AI Writer Character */}
            <GlassCard className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="text-7xl animate-bounce-slow">🧙‍♀️</div>
                        <div className="absolute -top-2 -right-2 text-3xl animate-spin-slow">✨</div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">Your AI Writing Assistant is Ready!</h3>
                        <p className="text-gray-400 text-sm">Tell me your topic and I&apos;ll generate titles, descriptions, scripts, and more in seconds</p>
                    </div>
                </div>
            </GlassCard>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Input Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6">Configuration</h2>
                        <form onSubmit={handleGenerate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Video Topic</label>
                                <textarea
                                    value={draft.topic}
                                    onChange={(e) => setDraft({ topic: e.target.value })}
                                    placeholder="AI automation for content creators"
                                    className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all h-24 resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">Tone & Style</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {tones.map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setDraft({ tone: t.id })}
                                            className={`p-3 rounded-xl border-2 transition-all text-left ${draft.tone === t.id
                                                    ? "border-purple-500 bg-purple-500/10"
                                                    : "border-white/10 bg-background-card hover:border-white/20"
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{t.emoji}</div>
                                            <div className="text-xs font-bold text-white">{t.name}</div>
                                            <div className="text-[10px] text-gray-500">{t.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Personalization */}
                            <div className="border-t border-white/10 pt-5 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap size={14} className="text-yellow-400" />
                                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Personalize (Optional but Powerful)</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">🎯 Target Audience</label>
                                    <input
                                        type="text"
                                        value={draft.audience}
                                        onChange={(e) => setDraft({ audience: e.target.value })}
                                        placeholder="e.g. men 25-40 interested in investing"
                                        className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">✨ Channel Style Reference</label>
                                    <input
                                        type="text"
                                        value={draft.channelStyle}
                                        onChange={(e) => setDraft({ channelStyle: e.target.value })}
                                        placeholder="e.g. Ali Abdaal, MKBHD, MrBeast"
                                        className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">💡 Your Unique Angle / Hook</label>
                                    <textarea
                                        value={draft.uniqueAngle}
                                        onChange={(e) => setDraft({ uniqueAngle: e.target.value })}
                                        placeholder="e.g. Most people waste money on expensive iPhones. Here's what I actually use instead."
                                        className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/10 transition-all h-20 resize-none"
                                    />
                                    <p className="text-[10px] text-yellow-500/70 mt-1">⚡ The AI builds everything around this. Most impactful field!</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-premium text-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="animate-spin mr-2" size={20} />
                                        Generating Magic...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2" size={20} />
                                        Generate Content
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Quick Tips */}
                    <div className="glass-card p-6 rounded-2xl border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <span>💡</span> Pro Tips
                        </h3>
                        <ul className="space-y-2 text-xs text-gray-400">
                            <li>• Fill in &quot;Unique Angle&quot; for laser-targeted output</li>
                            <li>• Reference a channel style to match their energy</li>
                            <li>• Adding target audience tailors vocabulary & examples</li>
                            <li>• The more context, the better the output!</li>
                        </ul>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                    <ErrorBoundary>
                    {loading && (
                        <div className="mt-2">
                            <ContentGeneratorSkeleton />
                        </div>
                    )}
                    
                    {error && !loading && (
                        <div className="mt-2">
                            <EmptyState 
                                type="error"
                                icon="⚠️"
                                title="Generation Failed"
                                description={error}
                                action={{ label: "Try Again", onClick: () => setError(null) }}
                            />
                        </div>
                    )}

                    {!loading && !result && !error && (
                        <EmptyState 
                            icon="🪄"
                            title="Ready to Create?"
                            description="Enter your topic and let AI craft compelling content for your next viral video"
                        />
                    )}

                    {result && !loading && !error && (
                        <div className="space-y-6">
                            {/* Download All Button */}
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white">Generated Content ✨</h2>
                                <button
                                    onClick={handleDownloadAll}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/10 text-purple-500 font-semibold hover:bg-purple-500/20 transition-all text-sm"
                                >
                                    <Zap size={16} />
                                    Download All
                                </button>
                            </div>
                            
                            {/* Metadata Health Check */}
                            {result.metadata_health && (
                                <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <Zap size={20} className="text-blue-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-white">SEO Health Check</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-background-card rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                {result.metadata_health.is_title_optimized ? (
                                                    <Check size={16} className="text-green-500" />
                                                ) : (
                                                    <Sparkles size={16} className="text-yellow-500" />
                                                )}
                                                <span className="font-bold text-gray-200 text-sm">Title Optimization</span>
                                            </div>
                                            <p className="text-gray-400 text-sm">{result.metadata_health.title_length_check}</p>
                                        </div>
                                        <div className="p-4 bg-background-card rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Check size={16} className="text-green-500" />
                                                <span className="font-bold text-gray-200 text-sm">Description SEO</span>
                                            </div>
                                            <p className="text-gray-400 text-sm">{result.metadata_health.description_seo_check}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Titles */}
                            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">🎯</div>
                                        <h3 className="text-xl font-black text-white">Video Titles</h3>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(result.titles.map((t: any) => t.title).join('\n'), 'titles')}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-purple-500 transition-all text-sm"
                                    >
                                        {copied === 'titles' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        {copied === 'titles' ? 'Copied!' : 'Copy All'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {result.titles.map((t: any, i: number) => (
                                        <div key={i} className="group flex items-start gap-4 p-4 bg-background-card rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                                            <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                                <span className="text-green-400 font-black text-sm">{t.predicted_ctr}</span>
                                                <span className="text-[9px] text-purple-300 font-bold uppercase tracking-wider">CTR</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{t.angle}</span>
                                                </div>
                                                <div className="text-white font-bold text-lg leading-tight">{t.title}</div>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(t.title, `title-${i}`)}
                                                type="button"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/5 hover:bg-white/10 rounded-lg"
                                            >
                                                {copied === `title-${i}` ?
                                                    <Check size={16} className="text-green-500" /> :
                                                    <Copy size={16} className="text-gray-400" />
                                                }
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">📝</div>
                                        <h3 className="text-xl font-black text-white">Video Description</h3>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(result.description, 'description')}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-purple-500 transition-all text-sm"
                                    >
                                        {copied === 'description' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        {copied === 'description' ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div className="bg-background-card p-4 rounded-xl">
                                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{result.description}</pre>
                                </div>
                            </div>

                            {/* Chapters & Timeline */}
                            {result.chapters && result.chapters.length > 0 && (
                                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl">⏱️</div>
                                            <h3 className="text-xl font-black text-white">Video Chapters</h3>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(result.chapters.map((c: any) => `${c.timestamp} - ${c.title}`).join('\n'), 'chapters')}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-purple-500 transition-all text-sm"
                                        >
                                            {copied === 'chapters' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                            {copied === 'chapters' ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="bg-background-card p-4 rounded-xl space-y-2">
                                        {result.chapters.map((chapter: any, i: number) => (
                                            <div key={i} className="flex items-center gap-4 text-sm">
                                                <span className="text-purple-400 font-mono font-bold">{chapter.timestamp}</span>
                                                <span className="text-white">{chapter.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Engagement Assets */}
                            {result.engagement_assets && (
                                <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-3xl">💬</div>
                                            <h3 className="text-xl font-black text-white">Engagement Assets</h3>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-background-card p-4 rounded-xl border border-white/5 relative group">
                                            <div className="absolute top-4 right-4">
                                                <button onClick={() => copyToClipboard(result.engagement_assets.pinned_comment, 'pinned')} className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {copied === 'pinned' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                                                </button>
                                            </div>
                                            <div className="text-xs text-blue-400 font-bold mb-2 uppercase tracking-wider">📌 Recommended Pinned Comment</div>
                                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{result.engagement_assets.pinned_comment}</p>
                                        </div>
                                        <div className="bg-background-card p-4 rounded-xl border border-white/5 relative group">
                                            <div className="absolute top-4 right-4">
                                                <button onClick={() => copyToClipboard(result.engagement_assets.community_post, 'community')} className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {copied === 'community' ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                                                </button>
                                            </div>
                                            <div className="text-xs text-purple-400 font-bold mb-2 uppercase tracking-wider">📢 Community Tab Post</div>
                                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{result.engagement_assets.community_post}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tags & Thumbnail Ideas */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="text-3xl">#️⃣</div>
                                        <h3 className="text-lg font-black text-white">Hashtags</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {result.tags.map((tag: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-sm font-semibold border border-purple-500/20">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="text-3xl">🎨</div>
                                        <h3 className="text-lg font-black text-white">Thumbnail Ideas</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {result.thumbnailIdeas.map((idea: string, i: number) => (
                                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                                                <span className="text-purple-500 mt-0.5">•</span>
                                                <span>{idea}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    </ErrorBoundary>`n
                </div>`n            </div>

        {/* Generation History Panel */}
        {history.length > 0 && (
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
                <button
                    onClick={() => setShowHistory(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-purple-400" />
                        <span className="font-bold text-white">Generation History</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">
                            {history.length} saved
                        </span>
                    </div>
                    {showHistory ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {showHistory && (
                    <div className="px-6 pb-6 space-y-3 max-h-96 overflow-auto">
                        {history.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/30 transition-all group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{item.topic}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-gray-500 capitalize">{item.tone} tone</span>
                                        <span className="text-xs text-gray-600">•</span>
                                        <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setDraft({ topic: item.topic });
                                        setDraft({ tone: item.tone ?? "professional" });
                                        const queryArgs = { topic: item.topic, tone: item.tone ?? "professional", audience: "", channelStyle: "", uniqueAngle: "" };
                                        
                                        // Pre-seed the cache with the history data!
                                        queryClient.setQueryData(
                                            ['content', queryArgs.topic, queryArgs.tone, queryArgs.audience, queryArgs.channelStyle, queryArgs.uniqueAngle],
                                            item.result
                                        );
                                        
                                        setActiveQuery(queryArgs);
                                        showToast("Loaded from history!");
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="ml-4 shrink-0 px-4 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold hover:bg-purple-500/20 transition-all"
                                >
                                    Load
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
    );
}
