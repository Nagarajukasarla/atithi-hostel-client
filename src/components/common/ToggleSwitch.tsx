import React from "react";

export interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "stateful";
    showDot?: boolean;
    id?: string;
    "aria-label"?: string;
    title?: string;
    className?: string;
}

const TRACK_SIZES: Record<"sm" | "md" | "lg", string> = {
    sm: "h-5 w-9 p-0.5",
    md: "h-6 w-11 p-0.5",
    lg: "h-8 w-16 p-1",
};

const THUMB_SIZES: Record<"sm" | "md" | "lg", string> = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
};

const SHIFT_CLASSES: Record<"sm" | "md" | "lg", { active: string; inactive: string }> = {
    sm: { active: "translate-x-4", inactive: "translate-x-0" },
    md: { active: "translate-x-5", inactive: "translate-x-0" },
    lg: { active: "translate-x-7", inactive: "translate-x-0" },
};

const DOT_SIZES: Record<"sm" | "md" | "lg", string> = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
};

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    disabled = false,
    size = "md",
    variant = "default",
    showDot = variant === "stateful",
    id,
    "aria-label": ariaLabel,
    title,
    className = "",
}) => {
    const trackSize = TRACK_SIZES[size] || TRACK_SIZES.md;
    const thumbSize = THUMB_SIZES[size] || THUMB_SIZES.md;
    const shift = SHIFT_CLASSES[size] || SHIFT_CLASSES.md;
    const dotSize = DOT_SIZES[size] || DOT_SIZES.md;

    // Track colors based on variant and checked status
    const getTrackColors = () => {
        if (variant === "stateful") {
            return checked ? "bg-emerald-100 border-2 border-emerald-300" : "bg-rose-100 border-2 border-rose-300";
        }
        return checked ? "bg-indigo-600 border-2 border-transparent" : "bg-slate-200 border-2 border-transparent";
    };

    return (
        <button
            type="button"
            role="switch"
            id={id}
            aria-label={ariaLabel}
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            title={title}
            className={`relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${trackSize} ${getTrackColors()} ${className}`}
        >
            <span
                className={`pointer-events-none flex transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${thumbSize} ${
                    checked ? shift.active : shift.inactive
                }`}
            >
                {showDot && (
                    <span
                        className={`rounded-full transition-colors ${dotSize} ${
                            checked ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                    />
                )}
            </span>
        </button>
    );
};
