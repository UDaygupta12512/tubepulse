import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    type?: "error" | "empty" | "default";
}

export function EmptyState({ icon, title, description, action, type = "default" }: EmptyStateProps) {
    const isError = type === "error";
    
    return (
        <div className={`glass-panel min-h-[400px] rounded-3xl border flex items-center justify-center ${
            isError ? "border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5" : "border-white/10"
        }`}>
            <div className="text-center p-12 max-w-lg mx-auto">
                <div className="flex justify-center gap-4 mb-6">
                    <div className="text-8xl animate-bounce-slow filter drop-shadow-xl">
                        {icon}
                    </div>
                </div>
                <h3 className={`text-3xl font-black mb-3 ${isError ? "text-red-400" : "text-white"}`}>
                    {title}
                </h3>
                <p className="text-gray-400 text-lg mb-8">
                    {description}
                </p>
                {action && (
                    <button
                        onClick={action.onClick}
                        className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 ${
                            isError 
                                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30" 
                                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                        }`}
                    >
                        {action.label}
                    </button>
                )}
            </div>
        </div>
    );
}
