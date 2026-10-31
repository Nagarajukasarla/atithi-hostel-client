import React from "react";
import { ChevronDown } from "lucide-react";

export interface AccordionSectionCardProps {
    title: string;
    icon: React.ReactNode;
    iconClassName?: string;
    badge?: React.ReactNode;
    summary?: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    actionLabel?: string;
    children: React.ReactNode;
    className?: string;
}

export const AccordionSectionCard: React.FC<AccordionSectionCardProps> = ({
    title,
    icon,
    iconClassName = "bg-slate-50 text-slate-600 border-slate-100",
    badge,
    summary,
    isExpanded,
    onToggle,
    actionLabel,
    children,
    className = "",
}) => {
    return (
        <div
            className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 ${className}`}
        >
            {/* Header Bar */}
            <div
                onClick={onToggle}
                className="flex items-center justify-between p-3.5 sm:p-5 cursor-pointer select-none hover:bg-slate-50/70 transition gap-3"
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div
                        className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 border ${iconClassName}`}
                    >
                        {icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{title}</h3>
                            {badge && <div className="shrink-0 whitespace-nowrap">{badge}</div>}
                        </div>
                        {summary && <div className="text-xs text-slate-500 mt-1 truncate">{summary}</div>}
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {actionLabel && (
                        <button
                            type="button"
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition shadow-xs"
                        >
                            {isExpanded ? "Collapse" : actionLabel}
                        </button>
                    )}
                    <div
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition transform duration-200 ${
                            isExpanded ? "rotate-180 bg-slate-100 text-slate-700" : ""
                        }`}
                    >
                        <ChevronDown className="h-4 w-4" />
                    </div>
                </div>
            </div>

            {/* Expanded Body Content */}
            {isExpanded && <div className="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/40">{children}</div>}
        </div>
    );
};

export default AccordionSectionCard;
