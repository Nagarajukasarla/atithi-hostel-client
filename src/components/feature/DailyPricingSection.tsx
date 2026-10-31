import React, { useState } from "react";
import { FormInput } from "@/components/common/FormInput";
import { AccordionSectionCard } from "@/components/common/AccordionSectionCard";
import { Badge } from "@/components/common/Badge";
import { Calendar, CheckCircle2, Loader2, Save } from "lucide-react";

interface DailyPricingState {
    dailyNonAc: number;
    dailyAc: number;
    dailyDeluxe: number;
    extraBedCharge: number;
    dailyMealCharge: number;
    gracePeriodHours: number;
}

interface DailyPricingSectionProps {
    isExpanded: boolean;
    onToggle: () => void;
}

export const DailyPricingSection: React.FC<DailyPricingSectionProps> = ({ isExpanded, onToggle }) => {
    const [dailyPricing, setDailyPricing] = useState<DailyPricingState>({
        dailyNonAc: 800,
        dailyAc: 1200,
        dailyDeluxe: 1800,
        extraBedCharge: 300,
        dailyMealCharge: 150,
        gracePeriodHours: 2,
    });
    const [dailySuccessMsg, setDailySuccessMsg] = useState<string | null>(null);
    const [isDailySaving, setIsDailySaving] = useState(false);

    const handleDailySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsDailySaving(true);
        setTimeout(() => {
            setIsDailySaving(false);
            setDailySuccessMsg("Daily-wise pricing rates updated successfully!");
            setTimeout(() => setDailySuccessMsg(null), 3500);
        }, 400);
    };

    return (
        <AccordionSectionCard
            title="Daily-Wise Room Pricing"
            icon={<Calendar className="h-5 w-5" />}
            iconClassName="bg-amber-50 text-amber-600 border-amber-100"
            badge={
                <Badge tone="warning" size="sm">
                    Daily Bookings
                </Badge>
            }
            summary={
                <div className="flex items-center gap-2 truncate">
                    <span>
                        Non-AC: <strong className="text-slate-700 font-semibold">₹{dailyPricing.dailyNonAc}</strong>/day
                    </span>
                    <span>•</span>
                    <span>
                        AC: <strong className="text-slate-700 font-semibold">₹{dailyPricing.dailyAc}</strong>/day
                    </span>
                    <span>•</span>
                    <span>
                        Deluxe: <strong className="text-slate-700 font-semibold">₹{dailyPricing.dailyDeluxe}</strong>
                        /day
                    </span>
                    <span>•</span>
                    <span>
                        Extra Bed:{" "}
                        <strong className="text-slate-700 font-semibold">₹{dailyPricing.extraBedCharge}</strong>
                    </span>
                </div>
            }
            isExpanded={isExpanded}
            onToggle={onToggle}
            actionLabel="Configure Rates"
        >
            {dailySuccessMsg && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{dailySuccessMsg}</span>
                </div>
            )}

            <form onSubmit={handleDailySubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormInput
                        label="Standard Non-AC (Per Day)"
                        type="number"
                        prefixText="₹"
                        value={dailyPricing.dailyNonAc}
                        onChange={e => setDailyPricing(prev => ({ ...prev, dailyNonAc: Number(e.target.value) }))}
                        required
                        min={0}
                    />

                    <FormInput
                        label="Executive AC Room (Per Day)"
                        type="number"
                        prefixText="₹"
                        value={dailyPricing.dailyAc}
                        onChange={e => setDailyPricing(prev => ({ ...prev, dailyAc: Number(e.target.value) }))}
                        required
                        min={0}
                    />

                    <FormInput
                        label="Deluxe Suite (Per Day)"
                        type="number"
                        prefixText="₹"
                        value={dailyPricing.dailyDeluxe}
                        onChange={e => setDailyPricing(prev => ({ ...prev, dailyDeluxe: Number(e.target.value) }))}
                        required
                        min={0}
                    />

                    <FormInput
                        label="Extra Mattress / Bed (Per Day)"
                        type="number"
                        prefixText="₹"
                        value={dailyPricing.extraBedCharge}
                        onChange={e => setDailyPricing(prev => ({ ...prev, extraBedCharge: Number(e.target.value) }))}
                        required
                        min={0}
                    />

                    <FormInput
                        label="Daily Guest Meal Charge"
                        type="number"
                        prefixText="₹"
                        value={dailyPricing.dailyMealCharge}
                        onChange={e => setDailyPricing(prev => ({ ...prev, dailyMealCharge: Number(e.target.value) }))}
                        min={0}
                    />

                    <FormInput
                        label="Check-out Grace Period (Hours)"
                        type="number"
                        value={dailyPricing.gracePeriodHours}
                        onChange={e => setDailyPricing(prev => ({ ...prev, gracePeriodHours: Number(e.target.value) }))}
                        min={0}
                        max={24}
                    />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200/70">
                    <p className="text-[11px] text-slate-400">
                        Rates apply to short-term walk-in guests and temporary stays.
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onToggle}
                            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition hover:bg-slate-50 shadow-xs"
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            disabled={isDailySaving}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-md shadow-amber-600/20 transition"
                        >
                            {isDailySaving ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="h-3.5 w-3.5" />
                                    Save Daily Rates
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </AccordionSectionCard>
    );
};
