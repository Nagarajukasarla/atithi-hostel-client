import React from "react";
import { Star, CheckCircle2, Check, ArrowRight } from "lucide-react";
import type { PlanTier } from "@/data/plans";

export interface PlanCardProps {
    plan: PlanTier;
    isCurrent?: boolean;
    buttonText?: string;
    onSelectPlan: (plan: PlanTier) => void;
    className?: string;
}

export const PlanCard: React.FC<PlanCardProps> = ({
    plan,
    isCurrent = false,
    buttonText,
    onSelectPlan,
    className = "",
}) => {
    const isPopular = plan.isPopular;
    const defaultBtnText = isCurrent ? "Extend Plan" : `Upgrade to ${plan.name}`;
    const displayBtnText = buttonText || defaultBtnText;

    return (
        <div
            className={`relative flex flex-col justify-between rounded-3xl transition-all duration-300 bg-white text-slate-800 ${
                isPopular
                    ? "border-2 border-indigo-500 shadow-xl shadow-indigo-500/10 md:scale-[1.02] lg:-translate-y-1.5 ring-4 ring-indigo-500/10"
                    : "border border-slate-200/90 shadow-md hover:shadow-xl hover:-translate-y-1"
            } ${className}`}
        >
            {/* Top Badge (Popular / Best Value / Current) */}
            {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-md ${
                            isPopular
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-500/30"
                                : plan.isBestValue
                                  ? "bg-emerald-600 text-white shadow-emerald-600/30"
                                  : "bg-slate-800 text-slate-200"
                        }`}
                    >
                        {isPopular && <Star className="h-3 w-3 fill-amber-300 text-amber-300" />}
                        {plan.badge}
                    </span>
                </div>
            )}

            {/* Card Content Top Section */}
            <div className="p-6 sm:p-8 space-y-6">
                {/* Header Info */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div
                            className={`p-2.5 rounded-2xl ${
                                isPopular
                                    ? "bg-indigo-50 border border-indigo-200 text-indigo-600"
                                    : "bg-indigo-50 border border-indigo-100"
                            }`}
                        >
                            {plan.icon}
                        </div>

                        {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3" />
                                Active Plan
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-slate-900">
                        {plan.name}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-500">
                        {plan.tagline}
                    </p>
                </div>

                {/* Pricing Section */}
                <div className={`py-4 border-y ${isPopular ? "border-indigo-100" : "border-slate-100"}`}>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                            ₹{plan.priceTotal.toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                            / {plan.durationMonths} months
                        </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                            {plan.durationMonths} Months Access
                        </span>

                        {plan.savingsPercent && (
                            <span className="font-bold text-emerald-600">Save {plan.savingsPercent}%</span>
                        )}
                    </div>
                </div>

                {/* Feature List */}
                <div className="space-y-3">
                    <p className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                        Plan Highlights & Capacity:
                    </p>
                    <ul className="space-y-2.5 text-xs sm:text-sm">
                        {plan.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                                <div
                                    className={`mt-0.5 rounded-full p-0.5 shrink-0 ${
                                        isPopular
                                            ? "bg-indigo-100 text-indigo-700"
                                            : "bg-emerald-100 text-emerald-700"
                                    }`}
                                >
                                    <Check className="h-3.5 w-3.5" />
                                </div>
                                <span
                                    className={
                                        feat.highlight
                                            ? "font-semibold text-slate-900"
                                            : "text-slate-600 font-normal"
                                    }
                                >
                                    {feat.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Card CTA Footer Button */}
            <div className="p-6 sm:p-8 pt-0 mt-4">
                <button
                    type="button"
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition duration-200 shadow-md cursor-pointer ${
                        isPopular
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-600/25"
                            : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/10"
                    }`}
                >
                    <span>{displayBtnText}</span>
                    <ArrowRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};
