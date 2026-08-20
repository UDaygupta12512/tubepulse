import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function GlassPanel({ children, className, ...props }: GlassPanelProps) {
    return (
        <div 
            className={cn(
                "glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden",
                className
            )} 
            {...props}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
