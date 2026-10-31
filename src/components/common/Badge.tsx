import React from "react";

export type BadgeTone = "success" | "danger" | "warning" | "info" | "teal" | "indigo" | "purple" | "neutral";

export type BadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: BadgeTone;
    size?: BadgeSize;
    variant?: "pill" | "rounded";
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    dot?: boolean;
    dotPulse?: boolean;
    dotColorClass?: string;
    children?: React.ReactNode;
    className?: string;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
    xs: "text-[10px] leading-none px-2 py-0.5 gap-1",
    sm: "text-[11px] leading-tight px-2.5 py-0.5 gap-1",
    md: "text-xs leading-tight px-2.5 py-1 gap-1.5",
    lg: "text-sm leading-tight px-3 py-1.5 gap-2",
    xl: "text-base leading-normal px-4 py-2 gap-2.5",
};

const DOT_SIZE_CLASSES: Record<BadgeSize, string> = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
    xl: "h-3 w-3",
};

export const Badge: React.FC<BadgeProps> = ({
    tone = "neutral",
    size = "md",
    variant = "pill",
    icon,
    iconPosition = "left",
    dot = false,
    dotPulse = false,
    dotColorClass,
    children,
    className = "",
    ...props
}) => {
    const toneStyle = TONE_CLASSES[tone] || TONE_CLASSES.neutral;
    const sizeStyle = SIZE_CLASSES[size] || SIZE_CLASSES.md;
    const shapeStyle = variant === "pill" ? "rounded-full" : "rounded-lg";
    const dotSize = DOT_SIZE_CLASSES[size] || DOT_SIZE_CLASSES.md;

    return (
        <span
            className={`inline-flex items-center justify-center font-semibold border whitespace-nowrap select-none shrink-0 transition-colors ${shapeStyle} ${toneStyle} ${sizeStyle} ${className}`}
            {...props}
        >
            {dot && (
                <span
                    className={`rounded-full shrink-0 ${dotSize} ${
                        dotColorClass || (tone === "success" ? "bg-emerald-500" : "bg-current")
                    } ${dotPulse ? "animate-pulse" : ""}`}
                    aria-hidden="true"
                />
            )}
            {icon && iconPosition === "left" && <span className="shrink-0 flex items-center">{icon}</span>}
            {children && <span>{children}</span>}
            {icon && iconPosition === "right" && <span className="shrink-0 flex items-center">{icon}</span>}
        </span>
    );
};
