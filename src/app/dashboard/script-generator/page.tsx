"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Video, Copy, Download, Sparkles, Clock, Target, Check, ChevronDown, ChevronUp, AlertTriangle, TrendingDown, Zap } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { downloadAsFile } from "@/lib/generators";
import { useToast } from "@/components/Toast";
import { copyTextToClipboard, normalizeInputText } from "@/lib/utils";
import { ScriptGeneratorSkeleton } from "@/components/LoadingSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useDraftStore } from "@/store/useDraftStore";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

export default function ScriptGenerator() {
    const queryClient = useQueryClient();
    const draft = useDraftStore((state) => state.script);
    const setDraft = useDraftStore((state) => state.setScriptDraft);
    
    const [copied, setCopied] = useState("");
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    
    // Streaming state
    const [streamMode, setStreamMode] = useState(false);
    const [streamedText, setStreamedText] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const streamAbortRef = useRef<AbortController | null>(null);
    
    const [activeQuery, setActiveQuery] = useState<any>(null);
    const { showToast } = useToast();

    const fetchHistory = () => {
        try {
            const stored = localStorage.getItem("tubepulse_script_history");
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch { /* no-op */ }
    };

    useEffect(() => { fetchHistory(); }, []);

    const { data: script, isFetching: generating, error, refetch } = useQuery({
        queryKey: ['script', activeQuery?.topic, activeQuery?.duration, activeQuery?.style, activeQuery?.audience, activeQuery?.channelStyle, activeQuery?.uniqueAngle],
        queryFn: async ({ signal }) => {
            if (!activeQuery) return null;
            const params = new URLSearchParams({
                topic: activeQuery.topic,
                duration: activeQuery.duration,
                style: activeQuery.style,
                ...(activeQuery.audience && { audience: activeQuery.audience }),
                ...(activeQuery.channelStyle && { channelStyle: activeQuery.channelStyle }),
                ...(activeQuery.uniqueAngle && { uniqueAngle: activeQuery.uniqueAngle }),
            });
            const res = await fetchWithRetry(`/api/script/live?${params.toString()}`, { signal });
            if (!res.ok) throw new Error("Failed to fetch script");
            const data = await res.json();
            
            // Auto-save to localStorage history
            const newItem = { id: Date.now().toString(), topic: activeQuery.topic, style: activeQuery.style, duration: activeQuery.duration, result: data, createdAt: new Date().toISOString() };
            const stored = localStorage.getItem("tubepulse_script_history");
            const prev = stored ? JSON.parse(stored) : [];
            const updated = [newItem, ...prev].slice(0, 10);
            localStorage.setItem("tubepulse_script_history", JSON.stringify(updated));
            setHistory(updated);
            
            showToast("Script generated successfully!");
            return data;
        },
        enabled: !!activeQuery, // Only run if we have an active query submitted
    });

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedTopic = normalizeInputText(draft.topic);
        if (!normalizedTopic) {
            showToast("Enter a topic to generate a script.", "warning");
            return;
        }

        setDraft({ topic: normalizedTopic });
        setActiveQuery({ topic: normalizedTopic, duration: draft.duration, style: draft.style, audience: draft.audience, channelStyle: draft.channelStyle, uniqueAngle: draft.uniqueAngle });
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

    const downloadScript = () => {
        if (!script) return;
        const normalizedTopic = normalizeInputText(draft.topic) || "video script";
        const hooksText = script.ab_hooks?.map((h: any) => `[${h.type}]\nAUDIO: ${h.text}\nVISUAL: ${h.visual_hook}\n`).join("\n") || "";
        const sectionsText = script.sections?.map((s: any) => `\n${"=".repeat(40)}\n${s.title} (${s.time})\n${"=".repeat(40)}\n${s.av_rows?.map((r: any) => `[${r.timestamp}] [${r.pacing_note}]\nAUDIO: ${r.audio}\nVISUAL: ${r.visual}\n`).join("\n")}`).join("\n") || "";
        const fullScript = `VIDEO SCRIPT: ${script.title}\nDuration: ${script.duration}\n\n${"=".repeat(40)}\nA/B HOOKS\n${"=".repeat(40)}\n${hooksText}${sectionsText}\n\n${"=".repeat(40)}\nENGAGEMENT BOOSTERS\n${"=".repeat(40)}\n${script.engagement_boosters?.map((b: string) => `• ${b}`).join("\n")}\n\n${"=".repeat(40)}\nKEYWORDS\n${"=".repeat(40)}\n${script.keywords?.join(", ")}`;

        downloadAsFile(fullScript, `script-${normalizedTopic.replace(/\s+/g, "-").toLowerCase()}.txt`);
        showToast("Script downloaded!");
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <BackButton />
                </div>
            </div>

            <div className="relative">
                <div className="absolute -top-10 right-0 hidden lg:flex gap-4">
                    <div className="text-8xl animate-float">🎬</div>
                    <div className="text-8xl animate-float-delayed">📝</div>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                    <Video size={14} className="text-indigo-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Script Workshop</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3 relative z-10">Video Script Generator</h1>
                <p className="text-gray-400 text-xl">Generate professional, engaging video scripts in seconds</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Input Panel */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-6 rounded-3xl border border-white/10 sticky top-8">
                        <h2 className="text-xl font-bold text-white mb-6">Script Settings</h2>
                        <form 
                            onSubmit={handleGenerate} 
                            className="space-y-6"
                            onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                    e.preventDefault();
                                    handleGenerate(e as any);
                                }
                            }}
                        >
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Video Topic</label>
                                <textarea
                                    value={draft.topic}
                                    onChange={(e) => setDraft({ topic: e.target.value })}
                                    placeholder="AI automation for beginners"
                                    className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all h-20 resize-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Video Duration</label>
                                <select
                                    value={draft.duration}
                                    onChange={(e) => setDraft({ duration: e.target.value })}
                                    title="Video Duration"
                                    aria-label="Video Duration"
                                    className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="5">5 minutes</option>
                                    <option value="10">10 minutes</option>
                                    <option value="15">15 minutes</option>
                                    <option value="20">20 minutes</option>
                                    <option value="30">30 minutes</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Content Style</label>
                                <select
                                    value={draft.style}
                                    onChange={(e) => setDraft({ style: e.target.value })}
                                    title="Content Style"
                                    aria-label="Content Style"
                                    className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="educational">Educational</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="vlog">Vlog Style</option>
                                    <option value="documentary">Documentary</option>
                                    <option value="review">Product Review</option>
                                </select>
                            </div>

                            {/* Advanced Personalization */}
                            <div className="border-t border-white/10 pt-5 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className="text-yellow-400" />
                                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Personalize (Optional)</span>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">🎯 Target Audience</label>
                                    <input
                                        type="text"
                                        value={draft.audience}
                                        onChange={(e) => setDraft({ audience: e.target.value })}
                                        placeholder="e.g. men 25-40 interested in investing"
                                        className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">✨ Channel Style Reference</label>
                                    <input
                                        type="text"
                                        value={draft.channelStyle}
                                        onChange={(e) => setDraft({ channelStyle: e.target.value })}
                                        placeholder="e.g. Ali Abdaal, MKBHD, MrBeast"
                                        className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">💡 Your Unique Angle / Hook</label>
                                    <textarea
                                        value={draft.uniqueAngle}
                                        onChange={(e) => setDraft({ uniqueAngle: e.target.value })}
                                        placeholder="e.g. Most people waste money on expensive iPhones. Here's what I actually use instead."
                                        className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all h-20 resize-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={generating}
                                className="w-full btn-premium py-4 text-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 group"
                            >
                                {generating ? (
                                    <>
                                        <Sparkles className="animate-spin mr-2" size={20} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Video size={20} className="mr-2" />
                                        Generate Script
                                        <span className="hidden group-hover:flex items-center gap-1 text-xs opacity-70 ml-2 bg-black/20 px-2 py-1 rounded">
                                            <kbd>⌘</kbd> <kbd>↵</kbd>
                                        </span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Tips */}
                        <div className="mt-6 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <span>💡</span> Pro Tips
                            </h3>
                            <ul className="space-y-1 text-xs text-gray-400">
                                <li>• Be specific with your topic</li>
                                <li>• Mention your target audience</li>
                                <li>• Include your unique angle</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Results Panel */}
                <div className="lg:col-span-2">
                    <ErrorBoundary>
                    {generating && (
                        <div className="mt-2">
                            <ScriptGeneratorSkeleton />
                        </div>
                    )}

                    {error && !generating && (
                        <div className="mt-2">
                            <EmptyState 
                                type="error"
                                icon="⚠️"
                                title="Script Generation Failed"
                                description={error.message || "Failed"}
                                action={{ label: "Try Again", onClick: () => handleGenerate(new Event('submit') as any) }}
                            />
                        </div>
                    )}

                    {!generating && !script && !error && !isStreaming && !streamedText && (
                        <EmptyState 
                            icon="🎬"
                            title="Ready to Write?"
                            description="Enter your video details and let AI create a professional script for you"
                        />
                    )}

                    {script && !generating && !error && !isStreaming && !streamedText && (
                        <div className="space-y-6">
                            {/* Title & Actions */}
                            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-indigo-400 font-bold mb-1">VIDEO TITLE</div>
                                        <h2 className="text-3xl font-black text-white">{script.title}</h2>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {script.duration}</span>
                                            <span className="flex items-center gap-1"><Target size={14} /> {script.sections.length} sections</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={downloadScript}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-500 font-semibold hover:bg-indigo-500/20 transition-all"
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>
                                </div>
                            </div>

                            {/* A/B Hooks */}
                            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">🎣</div>
                                        <div>
                                            <h3 className="text-xl font-black text-white">A/B Hook Variations</h3>
                                            <div className="text-sm text-gray-400">First 5 Seconds Options</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(script.ab_hooks?.map((h: any) => h.text).join('\n\n') || '', 'hooks')}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {copied === 'hooks' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {script.ab_hooks?.map((hook: any, i: number) => (
                                        <div key={i} className="p-4 rounded-xl border border-white/5 bg-background-card">
                                            <div className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">{hook.type}</div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-500 font-semibold mb-1">AUDIO</div>
                                                    <p className="text-gray-300 text-sm leading-relaxed">{hook.text}</p>
                                                </div>
                                                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                    <div className="text-xs text-gray-500 font-semibold mb-1 flex items-center gap-1"><Video size={12}/> VISUAL</div>
                                                    <p className="text-gray-400 text-sm">{hook.visual_hook}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sections with AV Rows */}
                            {script.sections?.map((section: any, i: number) => (
                                <div key={i} className="glass-panel p-6 rounded-3xl border border-white/10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                        <div>
                                            <h3 className="text-xl font-black text-white mb-1">{section.title}</h3>
                                            <div className="text-sm text-gray-400">{section.time}</div>
                                        </div>
                                        {section.retention_risk_score !== undefined && (
                                            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 border ${
                                                section.retention_risk_score > 70 
                                                    ? "bg-red-500/10 border-red-500/50 text-red-400" 
                                                    : section.retention_risk_score > 40
                                                        ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
                                                        : "bg-green-500/10 border-green-500/50 text-green-400"
                                            }`}>
                                                <TrendingDown size={16} />
                                                <span className="font-bold text-sm">Risk Score: {section.retention_risk_score}/100</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {section.retention_warning && (
                                        <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-3">
                                            <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-orange-500 font-bold text-sm mb-1">Director's Warning</div>
                                                <p className="text-orange-200 text-sm leading-relaxed">{section.retention_warning}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {/* AV Header */}
                                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-black/20 rounded-t-lg border-b border-white/10 text-xs font-bold text-gray-500">
                                            <div className="col-span-2">TIME / PACE</div>
                                            <div className="col-span-5">AUDIO (DIALOGUE)</div>
                                            <div className="col-span-5">VISUAL (B-ROLL/GFX)</div>
                                        </div>
                                        
                                        <div className="space-y-3 md:space-y-0">
                                            {section.av_rows?.map((row: any, j: number) => (
                                                <div key={j} className="grid md:grid-cols-12 gap-4 p-4 md:p-0 md:px-4 md:py-3 bg-background-card md:bg-transparent rounded-xl md:rounded-none md:border-b border-white/5 items-start">
                                                    <div className="col-span-2 flex flex-col gap-1">
                                                        <span className="text-indigo-400 font-mono text-sm">{row.timestamp}</span>
                                                        <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">{row.pacing_note}</span>
                                                    </div>
                                                    <div className="col-span-5">
                                                        <div className="md:hidden text-xs text-gray-500 font-semibold mb-1">AUDIO</div>
                                                        <p className="text-gray-200 text-sm leading-relaxed">{row.audio}</p>
                                                    </div>
                                                    <div className="col-span-5">
                                                        <div className="md:hidden text-xs text-gray-500 font-semibold mb-1">VISUAL</div>
                                                        <p className="text-gray-400 text-sm leading-relaxed">{row.visual}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Engagement Boosters */}
                            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                                <h3 className="text-xl font-black text-white mb-4 flex items-center gap-3">
                                    <span className="text-3xl">⚡</span>
                                    Engagement Boosters
                                </h3>
                                <ul className="space-y-3">
                                    {script.engagement_boosters.map((booster: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-gray-300">
                                            <div className="text-yellow-500 mt-1">✓</div>
                                            <span>{booster}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    </ErrorBoundary>`n
                </div>`n            </div>

        {/* Script Generation History Panel */}
        {history.length > 0 && (
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
                <button
                    onClick={() => setShowHistory(v => !v)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-indigo-400" />
                        <span className="font-bold text-white">Script History</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                            {history.length} saved
                        </span>
                    </div>
                    {showHistory ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {showHistory && (
                    <div className="px-6 pb-6 space-y-3 max-h-96 overflow-auto">
                        {history.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{item.topic}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-gray-500 capitalize">{item.style} • {item.duration} min</span>
                                        <span className="text-xs text-gray-600">•</span>
                                        <span className="text-xs text-gray-500">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setDraft({ topic: item.topic });
                                        setDraft({ style: item.style ?? "educational" });
                                        setDraft({ duration: item.duration ?? "10" });
                                        
                                        const queryArgs = { topic: item.topic, duration: item.duration ?? "10", style: item.style ?? "educational", audience: "", channelStyle: "", uniqueAngle: "" };
                                        
                                        queryClient.setQueryData(
                                            ['script', queryArgs.topic, queryArgs.duration, queryArgs.style, queryArgs.audience, queryArgs.channelStyle, queryArgs.uniqueAngle],
                                            item.result
                                        );
                                        
                                        setActiveQuery(queryArgs);
                                        showToast("Script loaded from history!");
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="ml-4 shrink-0 px-4 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition-all"
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
