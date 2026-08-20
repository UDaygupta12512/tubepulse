import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
    return (
        <div 
            className={cn(
                "glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden transition-all hover:border-white/20",
                className
            )} 
            {...props}
        >
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}
