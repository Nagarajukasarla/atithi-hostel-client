import React, { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { ToastItem, ToastType } from "@/types/toast";

interface ToastProps {
    toast: ToastItem;
    onClose: (id: string) => void;
}

const toastConfig: Record<
    ToastType,
    {
        icon: React.ReactNode;
        containerClass: string;
        iconClass: string;
        titleClass: string;
        progressBarClass: string;
        defaultTitle: string;
    }
> = {
    WARNING: {
        icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
        containerClass: "border-amber-200/80 bg-white/95 shadow-amber-500/10",
        iconClass: "bg-amber-50 border border-amber-200/60",
        titleClass: "text-amber-800",
        progressBarClass: "bg-amber-500",
        defaultTitle: "Warning",
    },
    ERROR: {
        icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
        containerClass: "border-rose-200/80 bg-white/95 shadow-rose-500/10",
        iconClass: "bg-rose-50 border border-rose-200/60",
        titleClass: "text-rose-800",
        progressBarClass: "bg-rose-500",
        defaultTitle: "Error",
    },
    INFO: {
        icon: <Info className="w-5 h-5 text-sky-600" />,
        containerClass: "border-sky-200/80 bg-white/95 shadow-sky-500/10",
        iconClass: "bg-sky-50 border border-sky-200/60",
        titleClass: "text-sky-800",
        progressBarClass: "bg-sky-500",
        defaultTitle: "Information",
    },
    SUCCESS: {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
        containerClass: "border-emerald-200/80 bg-white/95 shadow-emerald-500/10",
        iconClass: "bg-emerald-50 border border-emerald-200/60",
        titleClass: "text-emerald-800",
        progressBarClass: "bg-emerald-500",
        defaultTitle: "Success",
    },
};

export const ToastItemComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const config = toastConfig[toast.type] || toastConfig.INFO;

    useEffect(() => {
        const startTime = Date.now();
        const duration = toast.duration;

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (elapsed >= duration) {
                clearInterval(interval);
                handleDismiss();
            }
        }, 20);

        return () => clearInterval(interval);
    }, [toast.duration]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(toast.id);
        }, 250);
    };

    return (
        <div
            role="alert"
            data-testid={`toast-${toast.type.toLowerCase()}`}
            className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 ${
                config.containerClass
            } ${
                isExiting
                    ? "opacity-0 -translate-y-4 scale-95"
                    : "animate-toast-slide-down opacity-100 translate-y-0 scale-100"
            }`}
        >
            <div className="flex items-start gap-3 p-3.5">
                {/* Type Icon Badge */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${config.iconClass}`}>{config.icon}</div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${config.titleClass}`}>
                        {toast.title || config.defaultTitle}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-700 leading-relaxed break-words">
                        {toast.message}
                    </p>
                </div>

                {/* Dismiss Button */}
                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Close notification"
                    className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition duration-150"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="h-0.5 w-full bg-slate-100 overflow-hidden">
                <div
                    className={`h-full transition-all duration-75 ease-linear ${config.progressBarClass}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

export const ToastContainer: React.FC<{
    toasts: ToastItem[];
    onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return (
        <div
            aria-live="polite"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center gap-2.5 w-full max-w-md px-4"
        >
            {toasts.map(toast => (
                <ToastItemComponent key={toast.id} toast={toast} onClose={onClose} />
            ))}
        </div>
    );
};
