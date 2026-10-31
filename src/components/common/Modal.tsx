import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    icon?: React.ReactNode;
    headerVariant?: "light" | "dark" | "gradient" | "default";
    headerActions?: React.ReactNode;
    header?: React.ReactNode;
    headerClassName?: string;
    children: React.ReactNode;
    bodyClassName?: string;
    footer?: React.ReactNode;
    footerClassName?: string;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "full";
    showCloseButton?: boolean;
    closeOnBackdropClick?: boolean;
    closeOnEsc?: boolean;
    className?: string;
}

const maxWidthMap: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    full: "max-w-full mx-3 sm:mx-6",
};

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    icon,
    headerVariant = "light",
    headerActions,
    header,
    headerClassName = "",
    children,
    bodyClassName = "",
    footer,
    footerClassName = "",
    maxWidth = "lg",
    showCloseButton = true,
    closeOnBackdropClick = true,
    closeOnEsc = true,
    className = "",
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e: KeyboardEvent) => {
            if (closeOnEsc && e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose, closeOnEsc]);

    if (!isOpen) return null;

    const isDarkHeader = headerVariant === "dark";

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={closeOnBackdropClick ? onClose : undefined}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`bg-white w-full ${maxWidthMap[maxWidth]} rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] transition-all transform animate-scale-up ${className}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                {header ? (
                    <div className={headerClassName}>{header}</div>
                ) : (title || showCloseButton || icon) ? (
                    <div
                        className={
                            isDarkHeader
                                ? `px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0 ${headerClassName}`
                                : `px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 flex items-center justify-between flex-shrink-0 ${headerClassName}`
                        }
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {icon && (
                                <div
                                    className={
                                        isDarkHeader
                                            ? "p-2.5 bg-white/10 rounded-xl border border-white/15 text-white flex items-center justify-center shrink-0"
                                            : "w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0"
                                    }
                                >
                                    {icon}
                                </div>
                            )}
                            <div className="min-w-0">
                                {typeof title === "string" ? (
                                    <h2
                                        className={`text-base sm:text-lg font-bold tracking-tight truncate ${
                                            isDarkHeader ? "text-white" : "text-slate-900"
                                        }`}
                                    >
                                        {title}
                                    </h2>
                                ) : (
                                    title
                                )}
                                {subtitle && (
                                    <div
                                        className={`text-xs mt-0.5 truncate ${
                                            isDarkHeader ? "text-slate-300" : "text-slate-500"
                                        }`}
                                    >
                                        {subtitle}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-4">
                            {headerActions}
                            {showCloseButton && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                                        isDarkHeader
                                            ? "text-slate-400 hover:text-white hover:bg-white/10"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                    }`}
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Body Content - Scrollable Container */}
                <div className={`p-6 overflow-y-auto space-y-5 flex-1 ${bodyClassName}`}>
                    {children}
                </div>

                {/* Pinned Footer Section */}
                {footer && (
                    <div
                        className={`px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0 ${footerClassName}`}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
