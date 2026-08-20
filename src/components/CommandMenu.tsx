"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MonitorPlay, Sparkles, Image as ImageIcon, LineChart, Key, Users, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const tools = [
    { name: "Dashboard Overview", path: "/dashboard", icon: MonitorPlay },
    { name: "Competitor Spy", path: "/dashboard/competitor-analysis", icon: Users },
    { name: "Script Generator", path: "/dashboard/script-generator", icon: Video },
    { name: "Thumbnail Forge", path: "/dashboard/thumbnail-generator", icon: ImageIcon },
    { name: "Thumbnail Search", path: "/dashboard/thumbnail-search", icon: Search },
    { name: "Vision Analyzer", path: "/dashboard/thumbnail-analyzer", icon: Sparkles },
    { name: "Analytics & Retention", path: "/dashboard/retention", icon: LineChart },
    { name: "Magic Keywords", path: "/dashboard/keywords", icon: Key },
];

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    if (!open) return null;

    const filteredTools = tools.filter(tool => 
        tool.name.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center px-4 py-3 border-b border-white/5">
                    <Search className="text-gray-500 mr-3" size={20} />
                    <input 
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tools... (e.g. 'Script')"
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setOpen(false);
                            if (e.key === "Enter" && filteredTools.length > 0) {
                                setOpen(false);
                                router.push(filteredTools[0].path);
                            }
                        }}
                    />
                    <div className="text-xs font-bold bg-white/10 text-gray-400 px-2 py-1 rounded">ESC</div>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredTools.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No tools found.</div>
                    ) : (
                        filteredTools.map((tool, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setOpen(false);
                                    router.push(tool.path);
                                }}
                                className={cn(
                                    "w-full flex items-center px-4 py-3 rounded-xl transition-all text-left",
                                    i === 0 ? "bg-red-500/10 text-red-400" : "text-gray-300 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <tool.icon className="mr-3" size={18} />
                                <span className="font-semibold">{tool.name}</span>
                                {i === 0 && <span className="ml-auto text-xs opacity-50">Press Enter</span>}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
