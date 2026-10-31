import React from "react";
import { Inbox } from "lucide-react";

export interface EmptyStateAction {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
}

export interface EmptyStateProps {
    title?: string;
    description?: string;
    action?: EmptyStateAction;
    icon?: React.ReactNode;
    className?: string;
    isTableRow?: boolean;
    colSpan?: number;
    variant?: "banner" | "card" | "plain";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title = "No records found",
    description = "There is no data available to display at this moment.",
    action,
    icon,
    className = "",
    isTableRow = false,
    colSpan = 1,
    variant = "banner",
}) => {
    const content = (
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-2">
            {/* Icon Badge */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3.5 shadow-sm">
                {icon || <Inbox className="h-7 w-7 text-indigo-500 stroke-[1.75]" />}
            </div>

            {/* Heading */}
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">{title}</h3>

            {/* Description */}
            {description && (
                <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed max-w-xs sm:max-w-sm">
                    {description}
                </p>
            )}

            {/* Action Button (e.g. + Add Room) */}
            {action && (
                <button
                    type="button"
                    onClick={action.onClick}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 focus:outline-none cursor-pointer"
                >
                    {action.icon}
                    <span>{action.label}</span>
                </button>
            )}
        </div>
    );

    // If used inside an HTML <table> <tbody>
    if (isTableRow) {
        return (
            <tr>
                <td colSpan={colSpan} className={`py-12 px-6 text-center ${className}`}>
                    {content}
                </td>
            </tr>
        );
    }

    // Variant containers for pages, grids, and list views
    let containerStyles = "w-full p-8 sm:p-12 text-center transition-all";
    if (variant === "banner") {
        containerStyles += " bg-white rounded-3xl border border-slate-200/80 shadow-sm";
    } else if (variant === "card") {
        containerStyles += " rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50";
    }

    return <div className={`${containerStyles} ${className}`}>{content}</div>;
};
