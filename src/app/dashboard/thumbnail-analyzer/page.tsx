"use client";

import { useState, useRef } from "react";
import { UploadCloud, Eye, Image as ImageIcon, Sparkles, CheckCircle2, AlertTriangle, XCircle, Type, Layout, Smile, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { useDraftStore } from "@/store/useDraftStore";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

interface VisionAnalysis {
    overallScore: number;
    verdict: string;
    readability: { score: number; feedback: string };
    emotion: { score: number; feedback: string };
    hierarchy: { score: number; feedback: string };
    improvements: string[];
    focal_path?: string[];
}

export default function ThumbnailVisionAnalyzer() {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imagePreviewB, setImagePreviewB] = useState<string | null>(null);
    const [isABTesting, setIsABTesting] = useState(false);
    const draft = useDraftStore((state) => state.vision);
    const setDraft = useDraftStore((state) => state.setVisionDraft);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileInputRefB = useRef<HTMLInputElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { showToast } = useToast();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("Image must be smaller than 5MB", "warning");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
            setAnalysis(null);
        };
        reader.readAsDataURL(file);
    };

    const handleImageUploadB = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast("Image must be smaller than 5MB", "warning");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviewB(reader.result as string);
            setAnalysis(null);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!imagePreview && !isABTesting) return;
        if (isABTesting && (!imagePreview || !imagePreviewB)) {
            showToast("Please upload both images for A/B testing.", "warning");
            return;
        }
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();
        setLoading(true);

        try {
            const images = isABTesting ? [imagePreview, imagePreviewB] : [imagePreview];
            const res = await fetchWithRetry("/api/vision", {
                signal: abortControllerRef.current.signal,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: images,
                    title: draft.title.trim()
                })
            });

            if (!res.ok) throw new Error("Vision AI failed to analyze image");

            const json = await res.json();
            setAnalysis(json.analysis);
            showToast("Multimodal analysis complete!", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to connect to Vision AI.", "error");
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return "text-green-400";
        if (score >= 60) return "text-yellow-400";
        return "text-red-400";
    };

    const getScoreBarColor = (score: number) => {
        if (score >= 85) return "bg-green-500";
        if (score >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 flex items-center gap-2">
                    <Eye className="w-8 h-8 text-purple-400" />
                    AI Vision Analyzer
                </h1>
                <p className="text-gray-400 mt-1 max-w-2xl">
                    Upload your thumbnail. Our Multimodal AI (Llama 3.2 Vision) will actually look at the pixels to grade text readability, visual hierarchy, and emotional impact.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Upload & Input */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Upload Thumbnail</h2>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="form-checkbox text-purple-500 rounded border-gray-600 bg-gray-800"
                                    checked={isABTesting}
                                    onChange={(e) => setIsABTesting(e.target.checked)}
                                />
                                <span className="text-sm font-semibold text-gray-300">A/B Testing Mode</span>
                            </label>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                            <div 
                                className={cn(
                                    "border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer relative overflow-hidden",
                                    imagePreview ? "border-purple-500/50 bg-purple-500/5" : "border-gray-600 hover:border-gray-400 bg-black/20"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleImageUpload} 
                                    accept="image/jpeg,image/png,image/webp" 
                                    className="hidden" 
                                />
                                
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview A" className="w-full h-auto max-h-[300px] object-contain rounded-lg" />
                                ) : (
                                    <div className="text-center">
                                        <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-300 font-medium">Click to upload {isABTesting ? 'Image A' : 'image'}</p>
                                        <p className="text-gray-500 text-sm mt-1">JPG, PNG up to 5MB</p>
                                    </div>
                                )}
                            </div>

                            {isABTesting && (
                                <div 
                                    className={cn(
                                        "border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer relative overflow-hidden",
                                        imagePreviewB ? "border-blue-500/50 bg-blue-500/5" : "border-gray-600 hover:border-gray-400 bg-black/20"
                                    )}
                                    onClick={() => fileInputRefB.current?.click()}
                                >
                                    <input 
                                        type="file" 
                                        ref={fileInputRefB} 
                                        onChange={handleImageUploadB} 
                                        accept="image/jpeg,image/png,image/webp" 
                                        className="hidden" 
                                    />
                                    
                                    {imagePreviewB ? (
                                        <img src={imagePreviewB} alt="Preview B" className="w-full h-auto max-h-[300px] object-contain rounded-lg" />
                                    ) : (
                                        <div className="text-center">
                                            <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-300 font-medium">Click to upload Image B</p>
                                            <p className="text-gray-500 text-sm mt-1">JPG, PNG up to 5MB</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {!imagePreview && !isABTesting && (
                            <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-bottom-2">
                                <span className="text-xs text-gray-500 font-semibold mb-2 block">Or try a demo thumbnail:</span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDraft({ title: "I built a PC for $100" });
                                            setImagePreview("https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1280&q=80");
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-purple-400 font-medium hover:text-white hover:bg-purple-500/20 hover:border-purple-500/30 transition-all"
                                    >
                                        🎮 Analyze Gaming Thumbnail
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDraft({ title: "The Future of AI is Terrifying" });
                                            setImagePreview("https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1280&q=80");
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-purple-400 font-medium hover:text-white hover:bg-purple-500/20 hover:border-purple-500/30 transition-all"
                                    >
                                        🤖 Analyze Tech Thumbnail
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Video Title (Optional but recommended)
                        </label>
                        <input 
                            type="text" 
                            placeholder="e.g., I Survived 50 Hours In Antarctica"
                            value={draft.title}
                            onChange={(e) => setDraft({ title: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <p className="text-gray-500 text-xs mt-2">
                            Providing the title helps the Vision AI understand if the image complements the text.
                        </p>
                    </div>

                    <button 
                        onClick={handleAnalyze}
                        disabled={!imagePreview || loading}
                        className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" /> Analyze with Vision AI
                            </>
                        )}
                    </button>
                </div>

                {/* Right Column: AI Analysis Results */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:h-[800px] overflow-y-auto custom-scrollbar">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-pink-400" />
                        Multimodal AI Feedback
                    </h2>

                    {!analysis && !loading && (
                        <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
                            <Eye className="w-16 h-16 text-gray-500 mb-4" />
                            <p className="text-lg text-gray-400">Upload an image and run the analysis<br/>to see what the AI sees.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                            <p className="text-purple-400 font-medium animate-pulse">Vision AI is looking at your image...</p>
                        </div>
                    )}

                    {analysis && !loading && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            {/* Overall Score / Verdict */}
                            <div className={`text-center p-6 rounded-xl border ${analysis.isABTest ? 'bg-indigo-900/50 border-indigo-500/30' : 'bg-slate-900/50 border-white/5'}`}>
                                {analysis.isABTest ? (
                                    <>
                                        <div className="text-3xl font-black text-indigo-400 mb-2">WINNER: IMAGE {analysis.winner}</div>
                                        <div className="flex justify-center items-center gap-6 mt-4">
                                            <div className="text-center">
                                                <div className="text-4xl font-black text-white">{analysis.winnerScore}</div>
                                                <div className="text-xs text-gray-400 font-bold">IMAGE {analysis.winner}</div>
                                            </div>
                                            <div className="text-2xl text-gray-500 font-black">VS</div>
                                            <div className="text-center opacity-50">
                                                <div className="text-3xl font-black text-white">{analysis.loserScore}</div>
                                                <div className="text-xs text-gray-400 font-bold">LOSER</div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500">
                                            {analysis.overallScore}
                                        </div>
                                        <div className="text-sm text-gray-400 uppercase tracking-widest mt-2 font-bold">CTR Potential Score</div>
                                    </>
                                )}
                                <p className="text-white mt-4 font-medium text-lg">&quot;{analysis.verdict}&quot;</p>
                            </div>

                            {!analysis.isABTest && (
                                <>
                                    {/* Detailed Metrics */}
                                    <div className="space-y-4">
                                        {[
                                            { title: "Text Readability", data: analysis.readability, icon: Type },
                                            { title: "Visual Hierarchy", data: analysis.hierarchy, icon: Layout },
                                            { title: "Emotion & Faces", data: analysis.emotion, icon: Smile }
                                        ].map((metric, i) => (
                                            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <metric.icon className="w-4 h-4 text-gray-400" />
                                                        <span className="font-bold text-white">{metric.title}</span>
                                                    </div>
                                                    <span className={cn("font-bold", getScoreColor(metric.data.score))}>
                                                        {metric.data.score}/100
                                                    </span>
                                                </div>
                                                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden mb-3">
                                                    <div 
                                                        className={cn("h-full transition-all duration-1000", getScoreBarColor(metric.data.score))} 
                                                        style={{ width: `${metric.data.score}%` }} 
                                                    />
                                                </div>
                                                <p className="text-sm text-gray-300 leading-relaxed">
                                                    {metric.data.feedback}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Eye-Tracking Focal Path Simulation */}
                                    {analysis.focal_path && analysis.focal_path.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-white/5">
                                            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-purple-400" />
                                                Simulated Eye-Tracking Path
                                            </h3>
                                            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-purple-500/20 before:to-transparent">
                                                {analysis.focal_path.map((step: string, i: number) => (
                                                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                        <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-slate-900 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 text-[10px] font-bold z-10">
                                                            {i + 1}
                                                        </div>
                                                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-gray-300">
                                                            {step.replace(/^\d+\.\s*/, '')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {analysis.isABTest && analysis.comparison && (
                                <div className="space-y-6 mt-6">
                                    <h3 className="font-bold text-white flex items-center gap-2">
                                        <Target className="w-5 h-5 text-indigo-400" />
                                        Head-to-Head Comparison
                                    </h3>
                                    
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                                            <div className="text-xs text-indigo-300 font-bold mb-2 uppercase tracking-wider flex items-center gap-2">🎨 Color Theory</div>
                                            <p className="text-gray-300 text-sm leading-relaxed">{analysis.color_theory_analysis}</p>
                                        </div>
                                        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                                            <div className="text-xs text-purple-300 font-bold mb-2 uppercase tracking-wider flex items-center gap-2">🧠 Psychological Triggers</div>
                                            <p className="text-gray-300 text-sm leading-relaxed">{analysis.psychological_triggers}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-xs text-blue-300 font-bold mb-1 uppercase tracking-wider">📱 Mobile Readability Score</div>
                                            <div className="text-sm text-blue-200">How readable the winning thumbnail is on small screens.</div>
                                        </div>
                                        <div className="text-3xl font-black text-blue-400">{analysis.mobile_readability_score}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-wider">Detailed Contrast Points</div>
                                        {analysis.comparison.map((point: string, i: number) => (
                                            <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-xl text-gray-300 text-sm leading-relaxed">
                                                {point}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actionable Improvements */}
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                                    How to improve this thumbnail:
                                </h3>
                                <ul className="space-y-3">
                                    {analysis.improvements.map((imp: string, i: number) => (
                                        <li key={i} className="flex gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-200 text-sm">
                                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                            <span>{imp}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
