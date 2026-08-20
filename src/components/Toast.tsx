"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { Check, X, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
    return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case "success": return <Check size={18} className="text-green-500" />;
            case "error": return <X size={18} className="text-red-500" />;
            case "warning": return <AlertCircle size={18} className="text-yellow-500" />;
            case "info": return <Info size={18} className="text-blue-500" />;
        }
    };

    const getBorder = (type: ToastType) => {
        switch (type) {
            case "success": return "border-green-500/30";
            case "error": return "border-red-500/30";
            case "warning": return "border-yellow-500/30";
            case "info": return "border-blue-500/30";
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 px-5 py-3 rounded-xl bg-background-card border ${getBorder(toast.type)} shadow-2xl backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-300 min-w-[280px]`}
                    >
                        {getIcon(toast.type)}
                        <span className="text-white text-sm font-medium flex-1">{toast.message}</span>
                        <button
                            onClick={() => removeToast(toast.id)}
                            type="button"
                            aria-label="Dismiss notification"
                            title="Dismiss notification"
                            className="text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
