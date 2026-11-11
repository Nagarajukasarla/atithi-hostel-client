import React from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { FormInput } from "@/components/common/FormInput";
import { FormSelect } from "@/components/common/FormSelect";
import type { Settings } from "@/types";
import { PAYMENT_METHOD_OPTIONS } from "@/types";

interface CustomerRegistrationFinancialInfoFormProps {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    settings: Settings;
    billingMode?: "MONTHLY" | "DAILY";
    watchedRent: number;
    watchedDailyRate?: number;
    watchedSecurityDeposit: number;
    watchedPaid: number;
    setValue?: UseFormSetValue<any>;
}

export const CustomerRegistrationFinancialInfoForm: React.FC<CustomerRegistrationFinancialInfoFormProps> = ({
    register,
    errors,
    settings,
    billingMode = "MONTHLY",
    watchedRent,
    watchedDailyRate = 0,
    watchedSecurityDeposit,
    watchedPaid,
}) => {
    const isDaily = billingMode === "DAILY";
    const primaryCharge = isDaily ? watchedDailyRate : watchedRent;
    const totalInitialCharges = primaryCharge + watchedSecurityDeposit;
    const remainingDue = Math.max(totalInitialCharges - watchedPaid, 0);

    const paymentStatus: "UNPAID" | "PARTIAL" | "PAID" =
        watchedPaid <= 0
            ? "UNPAID"
            : watchedPaid >= totalInitialCharges
              ? "PAID"
              : "PARTIAL";

    const statusColor =
        paymentStatus === "PAID"
            ? "text-emerald-600"
            : paymentStatus === "PARTIAL"
              ? "text-amber-600"
              : "text-rose-600";

    return (
        <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
                {isDaily ? (
                    <FormInput
                        key="dailyRate"
                        label="Agreed Daily Rate"
                        type="number"
                        prefixText={settings.currencySymbol}
                        error={errors.dailyRate?.message as string}
                        {...register("dailyRate", { valueAsNumber: true })}
                        required
                    />
                ) : (
                    <FormInput
                        key="monthlyRent"
                        label="Monthly Rent"
                        type="number"
                        prefixText={settings.currencySymbol}
                        error={errors.monthlyRent?.message as string}
                        {...register("monthlyRent", { valueAsNumber: true })}
                        required
                    />
                )}

                <FormInput
                    label="Security Deposit"
                    type="number"
                    prefixText={settings.currencySymbol}
                    error={errors.advanceAmount?.message as string}
                    {...register("advanceAmount", { valueAsNumber: true })}
                    required
                />

                <FormInput
                    label="Amount Paid Now"
                    type="number"
                    prefixText={settings.currencySymbol}
                    error={errors.amountPaid?.message as string}
                    {...register("amountPaid", { valueAsNumber: true })}
                    required
                />

                <FormSelect
                    label="Payment Method"
                    options={PAYMENT_METHOD_OPTIONS}
                    error={errors.paymentMethod?.message as string}
                    {...register("paymentMethod")}
                    required
                />
            </div>

            {/* Initial Payment Summary panel */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-3">
                    Initial Payment Summary:
                </h4>
                <div className="space-y-1.5 text-sm font-semibold text-neutral-700">
                    <div className="flex justify-between">
                        <span>{isDaily ? "Day 1 Daily Rent:" : "Monthly Rent:"}</span>
                        <span>
                            {settings.currencySymbol}
                            {primaryCharge.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                        <span>Security Deposit:</span>
                        <span>
                            {settings.currencySymbol}
                            {watchedSecurityDeposit.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between font-bold text-neutral-800">
                        <span>Total Initial Charges:</span>
                        <span>
                            {settings.currencySymbol}
                            {totalInitialCharges.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-emerald-600 pb-2 border-b border-slate-200">
                        <span>Amount Paid:</span>
                        <span>
                            -{settings.currencySymbol}
                            {watchedPaid.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-indigo-600 pt-1">
                        <span>Remaining Due:</span>
                        <span>
                            {settings.currencySymbol}
                            {remainingDue.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wide pt-1">
                        <span className="text-neutral-500">Initial Payment Status:</span>
                        <span className={statusColor}>{paymentStatus}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
