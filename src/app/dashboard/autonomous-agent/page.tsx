"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Terminal, Play, CheckCircle2, Search, Database, BrainCircuit, Activity, Flame, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentEvent {
    agent: "Searcher" | "Data Scientist" | "Strategist" | "System";
    status: string;
    isComplete?: boolean;
    data?: string;
}

export default function AutonomousAgent() {
    const [goal, setGoal] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [events, setEvents] = useState<AgentEvent[]>([]);
    const [finalReport, setFinalReport] = useState<string | null>(null);
    const eventsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [events]);

    const runAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!goal.trim() || isRunning) return;

        setIsRunning(true);
        setEvents([]);
        setFinalReport(null);

        try {
            const res = await fetch("/api/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ goal: goal.trim() })
            });

            if (!res.ok || !res.body) {
                throw new Error("Failed to start agent.");
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n\n");
                
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.replace("data: ", "");
                        try {
                            const update: AgentEvent = JSON.parse(dataStr);
                            
                            if (update.data) {
                                setFinalReport(update.data);
                            } else {
                                setEvents(prev => [...prev, update]);
                            }

                            if (update.isComplete) {
                                setIsRunning(false);
                            }
                        } catch (e) {
                            // ignore parse errors for partial chunks
                        }
                    }
                }
            }
        } catch (error) {
            setEvents(prev => [...prev, { agent: "System", status: "Connection lost or error occurred.", isComplete: true }]);
            setIsRunning(false);
        }
    };

    const getAgentIcon = (agent: string) => {
        switch (agent) {
            case "Memory": return <HardDrive className="w-4 h-4 text-amber-400" />;
            case "Searcher": return <Search className="w-4 h-4 text-cyan-400" />;
            case "Data Scientist": return <Database className="w-4 h-4 text-purple-400" />;
            case "Strategist": return <BrainCircuit className="w-4 h-4 text-pink-400" />;
            case "Critic": return <Flame className="w-4 h-4 text-orange-500 animate-pulse" />;
            default: return <Terminal className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center gap-2">
                    <Bot className="w-8 h-8 text-emerald-400" />
                    Autonomous Research Agent
                </h1>
                <p className="text-gray-400 mt-1 max-w-2xl">
                    Assign a complex goal. A team of 3 specialized AI Agents (Searcher, Data Scientist, Strategist) will autonomously scrape YouTube, run Bayesian math, and compile a final strategy document for you.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Input & Terminal */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    {/* Input Box */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <form onSubmit={runAgent} className="space-y-4">
                            <label className="block text-sm font-bold text-white mb-2">
                                Define Goal
                            </label>
                            <textarea 
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                placeholder="e.g., Find 3 Minecraft building channels, analyze their weaknesses, and write me a script that beats them."
                                className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none h-32"
                            />
                            <button 
                                type="submit" 
                                disabled={isRunning || !goal.trim()}
                                className="w-full py-4 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-emerald-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRunning ? (
                                    <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 fill-slate-900" /> Deploy Agent
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Agent Terminal */}
                    <div className="glass-panel p-4 rounded-2xl border border-white/5 flex-1 min-h-[300px] flex flex-col bg-[#0a0a0f]">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-3">
                            <Terminal className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Agent Event Stream</span>
                            {isRunning && <Activity className="w-4 h-4 text-emerald-500 ml-auto animate-pulse" />}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto font-mono text-sm space-y-3 custom-scrollbar pr-2">
                            {events.length === 0 && !isRunning && (
                                <p className="text-gray-600 italic">Awaiting deployment...</p>
                            )}
                            
                            {events.map((ev, i) => (
                                <div key={i} className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2">
                                    <div className="mt-0.5">{getAgentIcon(ev.agent)}</div>
                                    <div>
                                        <span className="font-bold text-gray-300">[{ev.agent}]</span>
                                        <span className="text-gray-400 ml-2">{ev.status}</span>
                                    </div>
                                </div>
                            ))}
                            <div ref={eventsEndRef} />
                        </div>
                    </div>
                </div>

                {/* Right Column: Final Report */}
                <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 flex flex-col min-h-[600px]">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        Strategist Final Report
                    </h2>

                    {finalReport ? (
                        <div className="flex-1 overflow-y-auto custom-scrollbar prose prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-gray-300 leading-relaxed bg-transparent border-0 p-0 m-0 text-base">
                                {finalReport}
                            </pre>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                            {isRunning ? (
                                <>
                                    <BrainCircuit className="w-16 h-16 text-emerald-500 mb-4 animate-pulse" />
                                    <p className="text-lg text-emerald-400">Agents are compiling the report...</p>
                                </>
                            ) : (
                                <>
                                    <Bot className="w-16 h-16 text-gray-500 mb-4" />
                                    <p className="text-lg text-gray-400">Deploy the agent to generate an autonomous strategy.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
