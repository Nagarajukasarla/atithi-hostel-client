import React from "react";

interface StatisticsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    badgeColor?: "purple" | "emerald" | "cyan" | "magenta" | "indigo" | "slate" | "rose";
    trend?: {
        value: string;
        type: "positive" | "negative" | "neutral";
    };
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
    title,
    value,
    icon,
    description,
    badgeColor = "purple",
    trend,
}) => {
    const badgeStyles = {
        purple: "bg-indigo-500 text-white shadow-indigo-500/20",
        emerald: "bg-emerald-500 text-white shadow-emerald-500/20",
        cyan: "bg-cyan-500 text-white shadow-cyan-500/20",
        magenta: "bg-fuchsia-600 text-white shadow-fuchsia-600/20",
        indigo: "bg-indigo-600 text-white shadow-indigo-600/20",
        slate: "bg-slate-700 text-white shadow-slate-700/20",
        rose: "bg-rose-500 text-white shadow-rose-500/20",
    };

    return (
        <div className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition duration-200">
            <div className="space-y-1">
                <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">{title}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</span>
                    {trend && (
                        <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                trend.type === "positive"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : trend.type === "negative"
                                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                                      : "bg-slate-50 text-slate-700 border border-slate-200"
                            }`}
                        >
                            {trend.value}
                        </span>
                    )}
                </div>
                {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
            </div>

            <div
                className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl shadow-md ${badgeStyles[badgeColor]}`}
            >
                {icon}
            </div>
        </div>
    );
};
