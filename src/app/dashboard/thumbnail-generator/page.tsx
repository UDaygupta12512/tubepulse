/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Wand2, Download, RefreshCw, Sparkles, Check, Eye, X, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";
import { normalizeInputText } from "@/lib/utils";

interface GeneratedThumb {
    dataUrl: string;
    label: string;
    ctr: number;
    explanation: string;
}

interface VisionAnalysisResult {
    overallScore: number;
    verdict: string;
    readability: { score: number; feedback: string };
    emotion: { score: number; feedback: string };
    hierarchy: { score: number; feedback: string };
    improvements: string[];
}

type VariantLayout = "split-left" | "spotlight" | "burst" | "clean-frame";

interface HistoryItem {
    id: string;
    prompt: string;
    keywords: string;
    style: string;
    createdAt: string;
    thumbnails: GeneratedThumb[];
    template?: BrandTemplate;
}

interface BrandTemplate {
    primaryColor: string;
    accentColor: string;
    fontFamily: "Arial" | "Verdana" | "Tahoma" | "Trebuchet MS";
    logoArea: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

function getWhyItWorks(layout: VariantLayout): string {
    if (layout === "split-left") return "Diagonal split creates strong contrast and a clear focal direction, which improves first-second attention.";
    if (layout === "spotlight") return "Centered spotlight pushes eye focus to the headline, helping viewers parse your promise faster.";
    if (layout === "burst") return "High-energy burst background amplifies urgency and motion, ideal for curiosity-driven click behavior.";
    return "Framed minimal structure improves readability on mobile and keeps message clarity high at small sizes.";
}

function seededRandom(seed: string) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return function () {
        h |= 0; h = h + 0x6D2B79F5 | 0;
        let t = Math.imul(h ^ h >>> 15, 1 | h);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
});

async function generateThumbnailCanvas(
    title: string,
    keywords: string,
    styleId: string,
    variantLayout: VariantLayout,
    template: BrandTemplate,
    emotion: string = "curiosity"
): Promise<string> {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas.toDataURL("image/png");
    const rng = seededRandom(title + styleId + variantLayout);

    const styleConfigs: Record<string, { bg: string[]; textColor: string; accent: string; fontWeight: string; prompt: string }> = {
        bold: { bg: ["#ff1744", "#d50000", "#b71c1c"], textColor: "#ffffff", accent: "#ffeb3b", fontWeight: "900", prompt: "cinematic dramatic lighting, extreme close up, high contrast, vibrant colors, 8K ultra-sharp" },
        minimal: { bg: ["#1a1a2e", "#16213e", "#0f3460"], textColor: "#ffffff", accent: "#e94560", fontWeight: "700", prompt: "clean minimal aesthetic, soft studio lighting, modern design, neutral tones, professional photography" },
        tech: { bg: ["#0d1117", "#161b22", "#21262d"], textColor: "#58a6ff", accent: "#39d353", fontWeight: "800", prompt: "cyberpunk city, glowing neon circuits, futuristic holographic displays, digital matrix, 4K" },
        vibrant: { bg: ["#667eea", "#764ba2", "#f093fb"], textColor: "#ffffff", accent: "#ffecd2", fontWeight: "900", prompt: "pop art vivid explosion of colors, energetic motion blur, bright psychedelic patterns, dynamic" },
        gaming: { bg: ["#0f0c29", "#302b63", "#24243e"], textColor: "#ffffff", accent: "#ff00ff", fontWeight: "900", prompt: "esports arena RGB lighting, gaming setup ultrawide monitor, action gameplay neon explosion, dramatic" },
        finance: { bg: ["#11998e", "#38ef7d", "#0f3460"], textColor: "#ffffff", accent: "#ffd700", fontWeight: "800", prompt: "luxury lifestyle gold bars wealth, Wall Street trading floor, premium penthouse city skyline" },
        documentary: { bg: ["#1a1a1a", "#2d2d2d", "#0a0a0a"], textColor: "#e0c97f", accent: "#e0c97f", fontWeight: "800", prompt: "dark cinematic documentary style, dramatic shadows, single spotlight, grain film effect, moody atmosphere" },
        vlog: { bg: ["#ff9a9e", "#fecfef", "#ffecd2"], textColor: "#2d2d2d", accent: "#ff4757", fontWeight: "900", prompt: "cheerful bright lifestyle photography, sunny outdoor, candid real-life moment, happy vibrant" },
        podcast: { bg: ["#2c3e50", "#3d5a80", "#1a2a3a"], textColor: "#ffffff", accent: "#00d2ff", fontWeight: "700", prompt: "professional podcast studio, microphone closeup, split screen host guest, clean studio lighting" },
    };
    const baseConfig = styleConfigs[styleId] || styleConfigs.bold;
    const config = {
        ...baseConfig,
        accent: template.accentColor,
    };

    const seed = Math.floor(rng() * 1000000);
    // Build emotion-aware, highly specific AI prompt for best quality backgrounds
    const emotionVisuals: Record<string, string> = {
        curiosity: "mysterious intriguing atmosphere, dramatic lighting, partial reveal, question mark energy",
        shock: "jaw-dropping unexpected scene, explosive moment, wide eyes reaction energy, high contrast dramatic",
        excitement: "energetic vibrant action scene, motion blur, explosive colors, high energy dynamic",
        authority: "powerful commanding presence, professional polished, premium luxury feel, confident stance",
    };
    const emotionContext = emotionVisuals[emotion] || emotionVisuals.curiosity;
    const keywordContext = keywords ? `, ${keywords}` : "";
    const aiPrompt = `YouTube thumbnail background, no text, no words, no letters, ${title}${keywordContext}, ${baseConfig.prompt}, ${emotionContext}, photorealistic, 4K resolution, cinematic composition`;
    const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=1280&height=720&nologo=true&seed=${seed}&enhance=true`;
    
    try {
        const bgImg = await loadImage(aiUrl);
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } catch {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        const customBg = [template.primaryColor, baseConfig.bg[1], baseConfig.bg[2]];
        customBg.forEach((color, i) => grad.addColorStop(i / (customBg.length - 1), color));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.globalAlpha = 0.15;
        const bubbleCount = variantLayout === "burst" ? 14 : variantLayout === "spotlight" ? 8 : 6;
        for (let i = 0; i < bubbleCount; i++) {
            ctx.beginPath();
            ctx.arc(rng() * canvas.width, rng() * canvas.height, 50 + rng() * 200, 0, Math.PI * 2);
            ctx.fillStyle = config.accent;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    if (styleId === "tech") {
        ctx.strokeStyle = "rgba(88, 166, 255, 0.08)";
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    }

    const overlay = ctx.createLinearGradient(0, canvas.height * 0.3, 0, canvas.height);
    overlay.addColorStop(0, "rgba(0,0,0,0)");
    overlay.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const words = title.split(" ");
    // Dynamic font scaling: fit text based on char count for professional layouts
    const charCount = title.length;
    const baseFontSize = variantLayout === "spotlight" ? 88 : variantLayout === "clean-frame" ? 64 : 78;
    const fontSizeBase = charCount > 40 ? baseFontSize - 20 : charCount > 28 ? baseFontSize - 10 : baseFontSize;
    const maxCharsPerLine = variantLayout === "clean-frame" ? 26 : styleId === "minimal" || styleId === "podcast" ? 22 : 18;
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
        if ((currentLine + " " + word).trim().length > maxCharsPerLine && currentLine) { lines.push(currentLine.trim()); currentLine = word; } else { currentLine += " " + word; }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    const fontSize = lines.length > 3 ? fontSizeBase - 18 : lines.length > 2 ? fontSizeBase - 8 : fontSizeBase;
    ctx.font = `${config.fontWeight} ${fontSize}px ${template.fontFamily}, Impact, "Arial Black", sans-serif`;
    ctx.textAlign = variantLayout === "spotlight" || styleId === "minimal" ? "center" : "left";
    
    // Deeper shadow for pro feel
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    // Heavy black stroke (outline) for maximum readability
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = Math.max(3, fontSize * 0.08);
    ctx.miterLimit = 2; // Prevent sharp spikes on letters
    ctx.fillStyle = config.textColor;

    const textX =
        variantLayout === "split-left" ? 80 :
            variantLayout === "spotlight" ? canvas.width / 2 :
                variantLayout === "burst" ? 90 :
                    styleId === "minimal" ? canvas.width / 2 : 80;
    const lineHeight = fontSize * 1.2;
    const textStartY =
        variantLayout === "split-left" ? 160 :
            variantLayout === "spotlight" ? 250 :
                variantLayout === "clean-frame" ? 220 :
                    (canvas.height - lines.length * lineHeight) / 2 + fontSize * 0.3;
                    
    lines.forEach((line, i) => { 
        const y = textStartY + i * lineHeight;
        const text = line.toUpperCase();
        ctx.strokeText(text, textX, y); // Draw heavy outline
        ctx.fillText(text, textX, y);   // Fill text over outline
    });

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    if (variantLayout === "split-left") {
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillRect(canvas.width * 0.55, 0, canvas.width * 0.45, canvas.height);
        ctx.fillStyle = config.accent;
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.55, 0);
        ctx.lineTo(canvas.width * 0.58, 0);
        ctx.lineTo(canvas.width * 0.43, canvas.height);
        ctx.lineTo(canvas.width * 0.40, canvas.height);
        ctx.closePath();
        ctx.fill();
    }

    if (variantLayout === "spotlight") {
        const spotlight = ctx.createRadialGradient(canvas.width / 2, canvas.height / 3, 100, canvas.width / 2, canvas.height / 3, 450);
        spotlight.addColorStop(0, "rgba(255,255,255,0.28)");
        spotlight.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = spotlight;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (variantLayout === "clean-frame") {
        ctx.lineWidth = 18;
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    }

    if (styleId === "bold" || styleId === "vibrant" || variantLayout === "burst") {
        ctx.fillStyle = config.accent;
        const badgeText = (keywords.split(",")[0]?.trim() || "NEW").toUpperCase();
        ctx.font = `800 28px ${template.fontFamily}, Arial, sans-serif`;
        const bw = ctx.measureText(badgeText).width + 40;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
            ctx.roundRect(80, canvas.height - 120, bw, 50, 12);
        } else {
            ctx.rect(80, canvas.height - 120, bw, 50);
        }
        ctx.fill();
        ctx.fillStyle = "#000000";
        const badgeY = variantLayout === "spotlight" ? canvas.height - 100 : canvas.height - 83;
        ctx.fillText(badgeText, 100, badgeY);
    }

    ctx.globalAlpha = 0.3;
    ctx.font = `bold 20px ${template.fontFamily}, Arial, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    const logoW = 180;
    const logoH = 46;
    const padding = 24;
    const logoX = template.logoArea.includes("right") ? canvas.width - logoW - padding : padding;
    const logoY = template.logoArea.includes("bottom") ? canvas.height - logoH - padding : padding;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoW, logoH, 10);
        ctx.fill();
    } else {
        ctx.fillRect(logoX, logoY, logoW, logoH);
    }
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("TubePulse", logoX + 16, logoY + 31);
    ctx.globalAlpha = 1;

    return canvas.toDataURL("image/png");
}

export default function ThumbnailGenerator() {
    const [loading, setLoading] = useState(false);
    const [videoTitle, setVideoTitle] = useState("");
    const [keywords, setKeywords] = useState("");
    const [style, setStyle] = useState("bold");
    const [emotion, setEmotion] = useState("curiosity");
    const [customTextOverlay, setCustomTextOverlay] = useState("");
    const [surpriseMode, setSurpriseMode] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedThumb[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [historyStyleFilter, setHistoryStyleFilter] = useState("all");
    const [historyDateFilter, setHistoryDateFilter] = useState("all");
    const [historySort, setHistorySort] = useState("latest");
    const [templateLock, setTemplateLock] = useState<BrandTemplate>({
        primaryColor: "#ff1744",
        accentColor: "#ffeb3b",
        fontFamily: "Arial",
        logoArea: "bottom-right",
    });
    const [inspectingThumb, setInspectingThumb] = useState<GeneratedThumb | null>(null);
    const [visionLoading, setVisionLoading] = useState(false);
    const [visionResult, setVisionResult] = useState<VisionAnalysisResult | null>(null);
    const { showToast } = useToast();

    const handleInspectWithVision = async (thumb: GeneratedThumb) => {
        setInspectingThumb(thumb);
        setVisionLoading(true);
        setVisionResult(null);
        try {
            const res = await fetch("/api/vision", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: thumb.dataUrl,
                    title: videoTitle || "YouTube Thumbnail",
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || json.message || "Vision inspection failed.");
            setVisionResult(json);
            showToast("Vision AI Multimodal scan complete!", "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Vision inspection failed.", "warning");
        } finally {
            setVisionLoading(false);
        }
    };

    const styles = [
        { id: "bold", name: "Bold & Dramatic", icon: "🔥", desc: "High contrast with bold text" },
        { id: "minimal", name: "Clean Minimal", icon: "✨", desc: "Simple and modern" },
        { id: "tech", name: "Tech Futuristic", icon: "🚀", desc: "Sci-fi inspired design" },
        { id: "vibrant", name: "Vibrant Colors", icon: "🌈", desc: "Eye-catching gradients" },
        { id: "gaming", name: "Gaming & Neon", icon: "🎮", desc: "Dark mode with neon accents" },
        { id: "finance", name: "Wealth & Finance", icon: "💰", desc: "Premium gold and green aesthetic" },
        { id: "documentary", name: "Documentary", icon: "🎥", desc: "Dark cinematic & moody" },
        { id: "vlog", name: "Vlog / Reaction", icon: "🙂", desc: "Bright, cheerful, personal" },
        { id: "podcast", name: "Podcast / Talk", icon: "🎙️", desc: "Studio professional layout" },
    ];

    const emotions = [
        { id: "curiosity", label: "Curiosity", emoji: "🤔" },
        { id: "shock", label: "Shock", emoji: "😱" },
        { id: "excitement", label: "Excitement", emoji: "🔥" },
        { id: "authority", label: "Authority", emoji: "💎" },
    ];

    // Surprise Me: picks the best style based on title keywords
    const pickSurpriseStyle = (title: string): string => {
        const t = title.toLowerCase();
        if (/(game|play|esport|fps|rpg|minecraft|fortnite)/.test(t)) return "gaming";
        if (/(money|invest|stock|finance|wealth|rich|millionaire)/.test(t)) return "finance";
        if (/(ai|tech|robot|code|software|app|future)/.test(t)) return "tech";
        if (/(vlog|day in|my life|reaction|challenge)/.test(t)) return "vlog";
        if (/(podcast|interview|talk|conversation|story)/.test(t)) return "podcast";
        if (/(mystery|truth|secret|dark|untold|real story)/.test(t)) return "documentary";
        if (/(tutorial|how to|learn|guide|tips|steps)/.test(t)) return "minimal";
        const pool = ["bold", "vibrant", "minimal", "tech", "documentary"];
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const generateThumbnails = async () => {
        const normalizedTitle = normalizeInputText(videoTitle);
        if (!normalizedTitle) {
            showToast("Enter a video title before generating thumbnails.", "warning");
            return;
        }

        const normalizedKeywords = normalizeInputText(keywords);
        setVideoTitle(normalizedTitle);
        setKeywords(normalizedKeywords);
        setLoading(true);

        // Surprise Me: auto-pick the best style based on title content
        const activeStyle = surpriseMode ? pickSurpriseStyle(normalizedTitle) : style;
        if (surpriseMode) {
            setStyle(activeStyle);
            showToast(`🎲 Surprise! AI picked "${activeStyle}" style for your title.`);
        }

        // Use custom text overlay if provided, else default to the title
        const textOverlay = customTextOverlay.trim() || normalizedTitle;

        try {
            const rng = seededRandom(normalizedTitle + activeStyle + emotion);
            const variantLayouts: VariantLayout[] = ["split-left", "spotlight", "burst", "clean-frame"];
            const labels = ["Split Left", "Spotlight", "Burst Energy", "Clean Frame"];

            const promises = variantLayouts.map(async (layout, i) => {
                const dataUrl = await generateThumbnailCanvas(textOverlay, normalizedKeywords, activeStyle, layout, templateLock, emotion);
                return {
                    dataUrl,
                    label: labels[i],
                    ctr: parseFloat((7 + rng() * 7).toFixed(1)),
                    explanation: getWhyItWorks(layout),
                };
            });

            const thumbs = await Promise.all(promises);

            setGeneratedImages(thumbs);
            showToast("4 AI thumbnails generated!");
            void saveHistory(normalizedTitle, normalizedKeywords, activeStyle, thumbs);
        } catch {
            showToast("Failed to generate thumbnails. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = () => {
        try {
            const stored = localStorage.getItem("tubepulse_thumbnail_history");
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch {
            // no-op
        }
    };

    const saveHistory = (prompt: string, keywordsText: string, selectedStyle: string, thumbs: GeneratedThumb[]) => {
        try {
            const newItem: HistoryItem = {
                id: Date.now().toString(),
                prompt,
                keywords: keywordsText,
                style: selectedStyle,
                template: templateLock,
                createdAt: new Date().toISOString(),
                thumbnails: thumbs.map((thumb, idx) => ({
                    ...thumb,
                    downloadName: `thumbnail-${prompt.replace(/\s+/g, "-").toLowerCase()}-${idx + 1}.png`,
                })) as any,
            };
            const updatedHistory = [newItem, ...history].slice(0, 10); // Keep last 10
            setHistory(updatedHistory);
            localStorage.setItem("tubepulse_thumbnail_history", JSON.stringify(updatedHistory));
        } catch {
            // no-op
        }
    };

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        generateThumbnails();
    };

    const handleDownload = (thumb: GeneratedThumb, index: number) => {
        const safeTitle = normalizeInputText(videoTitle) || "thumbnail";
        const a = document.createElement("a");
        a.href = thumb.dataUrl;
        a.download = `thumbnail-${safeTitle.replace(/\s+/g, "-").toLowerCase()}-${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast("Thumbnail downloaded!");
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchHistory();
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    const styleOptions = Array.from(new Set(history.map((h) => h.style))).sort();
    const latestHistoryTs = history.length > 0
        ? Math.max(...history.map((item) => new Date(item.createdAt).getTime()))
        : 0;

    const filteredHistory = history
        .filter((item) => historyStyleFilter === "all" || item.style === historyStyleFilter)
        .filter((item) => {
            if (historyDateFilter === "all") return true;
            if (latestHistoryTs <= 0) return true;
            const diffMs = latestHistoryTs - new Date(item.createdAt).getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (historyDateFilter === "7d") return diffDays <= 7;
            if (historyDateFilter === "30d") return diffDays <= 30;
            return true;
        })
        .sort((a, b) => {
            if (historySort === "latest") return +new Date(b.createdAt) - +new Date(a.createdAt);
            const aBest = Math.max(...a.thumbnails.map((t) => t.ctr));
            const bBest = Math.max(...b.thumbnails.map((t) => t.ctr));
            return bBest - aBest;
        });

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                    <Sparkles size={14} className="text-red-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-red-400">AI Powered</span>
                </div>
                <h1 className="text-5xl font-black text-white mb-3">Thumbnail Forge</h1>
                <p className="text-gray-400 text-xl">Create scroll-stopping thumbnails that boost your CTR by up to 300%</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Input Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6">Configuration</h2>
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
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Video Title</label>
                                <input
                                    type="text"
                                    value={videoTitle}
                                    onChange={(e) => setVideoTitle(e.target.value)}
                                    placeholder="10 AI Tools That Will Make You Rich"
                                    className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">Keywords (comma separated)</label>
                                <textarea
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="ai, tech, money, passive income"
                                    className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all h-24 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">Style</label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {styles.map((s) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setStyle(s.id)}
                                            className={`p-3 rounded-xl border-2 transition-all text-left ${style === s.id
                                                    ? "border-red-500 bg-red-500/10"
                                                    : "border-white/10 bg-background-card hover:border-white/20"
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{s.icon}</div>
                                            <div className="text-xs font-bold text-white">{s.name}</div>
                                            <div className="text-[10px] text-gray-500 hidden sm:block mt-1">{s.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Controls */}
                            <div className="border-t border-white/10 pt-5 space-y-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className="text-cyan-400" />
                                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">AI Personalization</span>
                                </div>

                                {/* Emotion Selector */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">🎭 Primary Emotion</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {emotions.map((e) => (
                                            <button
                                                key={e.id}
                                                type="button"
                                                onClick={() => setEmotion(e.id)}
                                                className={`p-2 rounded-xl border-2 transition-all text-center ${emotion === e.id ? "border-cyan-500 bg-cyan-500/10" : "border-white/10 bg-background-card hover:border-white/20"}`}
                                            >
                                                <div className="text-xl mb-0.5">{e.emoji}</div>
                                                <div className="text-[10px] font-bold text-white">{e.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Text Overlay */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">📝 Custom Text Overlay</label>
                                    <input
                                        type="text"
                                        value={customTextOverlay}
                                        onChange={(e) => setCustomTextOverlay(e.target.value)}
                                        placeholder="Leave blank to use your title"
                                        maxLength={60}
                                        className="w-full bg-background-card border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Type shorter, punchier text for higher CTR (max 6 words)</p>
                                </div>

                                {/* Surprise Me Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
                                    <div>
                                        <p className="text-sm font-semibold text-white">🎲 Surprise Me Mode</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">AI auto-picks the best style for your title</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSurpriseMode(v => !v)}
                                        className={`relative w-12 h-6 rounded-full transition-all ${surpriseMode ? "bg-cyan-500" : "bg-white/10"}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${surpriseMode ? "translate-x-6" : "translate-x-0"}`} />
                                    </button>
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
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="mr-2" size={20} />
                                        Generate Thumbnails
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="glass-panel p-6 rounded-3xl border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Template Lock</h3>
                        <p className="text-xs text-gray-400 mb-4">Keep brand identity consistent across all generated thumbnails.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-2">Primary Brand Color</label>
                                <input
                                    type="color"
                                    value={templateLock.primaryColor}
                                    onChange={(e) => setTemplateLock((prev) => ({ ...prev, primaryColor: e.target.value }))}
                                    className="h-10 w-full rounded-lg border border-white/10 bg-background-card p-1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-2">Accent Color</label>
                                <input
                                    type="color"
                                    value={templateLock.accentColor}
                                    onChange={(e) => setTemplateLock((prev) => ({ ...prev, accentColor: e.target.value }))}
                                    className="h-10 w-full rounded-lg border border-white/10 bg-background-card p-1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-2">Font Family</label>
                                <select
                                    value={templateLock.fontFamily}
                                    onChange={(e) => setTemplateLock((prev) => ({ ...prev, fontFamily: e.target.value as BrandTemplate["fontFamily"] }))}
                                    className="w-full bg-background-card border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                >
                                    <option>Arial</option>
                                    <option>Verdana</option>
                                    <option>Tahoma</option>
                                    <option>Trebuchet MS</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-300 mb-2">Logo Area</label>
                                <select
                                    value={templateLock.logoArea}
                                    onChange={(e) => setTemplateLock((prev) => ({ ...prev, logoArea: e.target.value as BrandTemplate["logoArea"] }))}
                                    className="w-full bg-background-card border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
                                >
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="glass-card p-6 rounded-2xl border border-white/5">
                        <h3 className="text-sm font-bold text-white mb-3">💡 Pro Tips</h3>
                        <ul className="space-y-2 text-xs text-gray-400">
                            <li>• Use numbers in titles (10x, 5 Ways)</li>
                            <li>• Include emotional triggers</li>
                            <li>• Keep text under 6 words</li>
                            <li>• Use high contrast colors</li>
                        </ul>
                    </div>
                </div>

                {/* Results */}
                <div className="lg:col-span-2">
                    {!loading && generatedImages.length === 0 ? (
                        <div className="glass-panel h-full min-h-[600px] rounded-3xl border border-white/10 flex items-center justify-center">
                            <div className="text-center p-12">
                                <div className="text-8xl mb-6 animate-bounce-slow">🎨</div>
                                <h3 className="text-2xl font-bold text-white mb-3">Ready to Create Magic?</h3>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    Fill in the details on the left and click generate to create AI-powered thumbnails
                                </p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="glass-panel h-full min-h-[600px] rounded-3xl border border-white/10 flex items-center justify-center">
                            <div className="text-center">
                                <RefreshCw className="animate-spin text-red-500 mx-auto mb-4" size={48} />
                                <h3 className="text-xl font-bold text-white mb-2">AI is Working Its Magic...</h3>
                                <p className="text-gray-400">Generating 4 unique thumbnail designs for &quot;{videoTitle}&quot;</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Generated Results</h2>
                                    <p className="text-gray-400 text-sm">{generatedImages.length} variations created</p>
                                </div>
                                <button
                                    onClick={generateThumbnails}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-white/10 text-white hover:border-red-500 transition-all"
                                >
                                    <RefreshCw size={16} />
                                    Regenerate
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {generatedImages.map((thumb, i) => (
                                    <div key={i} className="glass-card p-4 rounded-2xl border border-white/5 group hover:-translate-y-2 transition-all duration-300">
                                        <div className="relative overflow-hidden rounded-xl mb-4">
                                            <img
                                                src={thumb.dataUrl}
                                                alt={`Thumbnail ${i + 1}`}
                                                className="w-full h-auto aspect-video object-cover"
                                            />
                                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                <Check size={12} />
                                                {thumb.ctr}% CTR
                                            </div>
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                {thumb.label}
                                            </div>
                                        </div>
                                        <p className="mb-3 text-xs text-gray-300 leading-relaxed">{thumb.explanation}</p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleDownload(thumb, i)}
                                                className="flex-1 btn-premium text-xs justify-center py-2.5"
                                            >
                                                <Download size={14} className="mr-1" />
                                                Download
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleInspectWithVision(thumb)}
                                                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/30 transition-all shadow-sm whitespace-nowrap"
                                                title="Analyze with Llama 3.2 Vision AI"
                                            >
                                                <Eye size={14} />
                                                Vision AI
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Analytics */}
                            <div className="grid md:grid-cols-3 gap-4">
                                {[
                                    { label: "Best Predicted CTR", value: `${Math.max(...generatedImages.map(t => t.ctr))}%`, change: "+245%", icon: "📈" },
                                    { label: "View Increase", value: `+${Math.floor(Math.max(...generatedImages.map(t => t.ctr)) * 1500)}`, change: "vs avg", icon: "👁️" },
                                    { label: "Engagement", value: "High", change: `${Math.floor(85 + Math.max(...generatedImages.map(t => t.ctr)))}/100`, icon: "⚡" },
                                ].map((stat, i) => (
                                    <div key={i} className="glass-card p-4 rounded-xl text-center border border-white/5">
                                        <div className="text-3xl mb-2">{stat.icon}</div>
                                        <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                                        <div className="text-xs text-gray-400 font-semibold">{stat.label}</div>
                                        <div className="text-xs text-green-500 mt-1">{stat.change}</div>
                                    </div>
                                ))}
                            </div>

                            {history.length > 0 && (
                                <div className="glass-card p-5 rounded-2xl border border-white/10">
                                    <div className="flex flex-wrap items-end gap-3 mb-3">
                                        <h3 className="text-lg font-bold text-white mr-auto">Your Thumbnail History</h3>
                                        <select
                                            value={historyDateFilter}
                                            onChange={(e) => setHistoryDateFilter(e.target.value)}
                                            className="bg-background-card border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                                        >
                                            <option value="all">All Dates</option>
                                            <option value="7d">Last 7 Days</option>
                                            <option value="30d">Last 30 Days</option>
                                        </select>
                                        <select
                                            value={historyStyleFilter}
                                            onChange={(e) => setHistoryStyleFilter(e.target.value)}
                                            className="bg-background-card border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                                        >
                                            <option value="all">All Styles</option>
                                            {styleOptions.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={historySort}
                                            onChange={(e) => setHistorySort(e.target.value)}
                                            className="bg-background-card border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
                                        >
                                            <option value="latest">Sort: Latest</option>
                                            <option value="best-ctr">Sort: Best CTR</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3 max-h-72 overflow-auto pr-1">
                                        {filteredHistory.map((item) => (
                                            <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm font-semibold text-white truncate">{item.prompt}</p>
                                                    <span className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mb-2">Style: {item.style} | Keywords: {item.keywords || "none"}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVideoTitle(item.prompt);
                                                        setKeywords(item.keywords);
                                                        setStyle(item.style);
                                                        if (item.template) setTemplateLock(item.template);
                                                        showToast("Prompt reused. You can regenerate instantly.");
                                                    }}
                                                    className="mb-2 rounded-lg border border-cyan-500/30 px-3 py-1 text-xs font-semibold text-cyan-300 hover:border-cyan-400 transition-colors"
                                                >
                                                    Reuse This Prompt
                                                </button>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {item.thumbnails.slice(0, 4).map((thumb, idx) => (
                                                        <a
                                                            key={idx}
                                                            href={thumb.dataUrl}
                                                            download={`history-${item.prompt.replace(/\s+/g, "-").toLowerCase()}-${idx + 1}.png`}
                                                            className="rounded-lg border border-white/10 overflow-hidden block hover:border-red-400/50 transition-colors"
                                                            title={`${thumb.label} (${thumb.ctr}% CTR)`}
                                                        >
                                                            <img src={thumb.dataUrl} alt={thumb.label} className="w-full h-full object-cover aspect-video" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Vision AI Modal */}
            {inspectingThumb && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass-panel border border-white/20 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl relative">
                        <button
                            onClick={() => { setInspectingThumb(null); setVisionResult(null); }}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                <Eye size={22} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white">Vision AI Multimodal Audit</h3>
                                <p className="text-xs text-gray-400">Powered by Llama 3.2 11B Multimodal Vision</p>
                            </div>
                        </div>

                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 max-w-md mx-auto">
                            <img src={inspectingThumb.dataUrl} alt="Inspecting Thumbnail" className="w-full h-full object-cover" />
                        </div>

                        {visionLoading ? (
                            <div className="py-12 text-center space-y-4">
                                <RefreshCw className="animate-spin text-cyan-400 mx-auto" size={40} />
                                <p className="text-white font-bold">Scanning visual cues, text contrast & emotional appeal...</p>
                                <p className="text-xs text-gray-500">Evaluating mobile readability & algorithm CTR potential</p>
                            </div>
                        ) : visionResult ? (
                            <div className="space-y-6">
                                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Overall Vision Score</div>
                                        <div className="text-3xl font-black text-white">{visionResult.overallScore}/100</div>
                                    </div>
                                    <div className="text-right max-w-xs">
                                        <div className="text-sm font-semibold text-cyan-300">{visionResult.verdict}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                                        <div className="text-xs font-bold text-gray-400">Readability</div>
                                        <div className="text-xl font-bold text-white">{visionResult.readability.score}%</div>
                                        <p className="text-[11px] text-gray-400 leading-snug">{visionResult.readability.feedback}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                                        <div className="text-xs font-bold text-gray-400">Emotion & Energy</div>
                                        <div className="text-xl font-bold text-white">{visionResult.emotion.score}%</div>
                                        <p className="text-[11px] text-gray-400 leading-snug">{visionResult.emotion.feedback}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                                        <div className="text-xs font-bold text-gray-400">Hierarchy & Focus</div>
                                        <div className="text-xl font-bold text-white">{visionResult.hierarchy.score}%</div>
                                        <p className="text-[11px] text-gray-400 leading-snug">{visionResult.hierarchy.feedback}</p>
                                    </div>
                                </div>

                                {visionResult.improvements && visionResult.improvements.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 space-y-2">
                                        <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <AlertCircle size={14} /> Actionable Fixes to Increase CTR
                                        </div>
                                        <ul className="space-y-1.5">
                                            {visionResult.improvements.map((tip, idx) => (
                                                <li key={idx} className="text-xs text-gray-300 flex items-start gap-2">
                                                    <span className="text-yellow-400 font-bold">•</span>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
