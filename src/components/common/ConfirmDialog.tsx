import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: "danger" | "warning" | "info";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    description,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
    type = "danger",
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const getButtonClass = () => {
        switch (type) {
            case "danger":
                return "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500";
            case "warning":
                return "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500";
            default:
                return "bg-brand-primary hover:bg-brand-primary/95 focus:ring-brand-primary";
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            {/* Fullscreen subtle backdrop covering header + sidebar + everything */}
            <div
                className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-200"
                onClick={onCancel}
                aria-hidden="true"
            />

            <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-6">
                {/* Dialog card with rounded-3xl corners */}
                <div
                    className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 text-left shadow-2xl border border-slate-200/80 transition-all duration-200 transform"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="sm:flex sm:items-start">
                        <div
                            className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-2xl sm:mx-0 sm:h-10 sm:w-10 ${
                                type === "danger" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                            }`}
                        >
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg font-bold leading-6 text-slate-900">{title}</h3>
                            <div className="mt-2">
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{description}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 sm:mt-6 sm:flex sm:flex-row-reverse gap-2.5">
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`inline-flex justify-center w-full px-4 py-2.5 text-xs font-semibold text-white border border-transparent rounded-xl shadow-md focus:outline-none transition ${getButtonClass()}`}
                        >
                            {confirmLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-3 inline-flex justify-center w-full px-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 shadow-sm transition"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
