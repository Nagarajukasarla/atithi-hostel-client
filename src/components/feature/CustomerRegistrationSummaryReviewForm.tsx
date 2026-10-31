import React from "react";
import type { Settings } from "@/types";

interface CustomerRegistrationSummaryReviewFormProps {
    formValues: any;
    settings: Settings;
    calculatedRemainingDue?: number;
}

export const CustomerRegistrationSummaryReviewForm: React.FC<CustomerRegistrationSummaryReviewFormProps> = ({
    formValues,
    settings,
}) => {
    const isDaily = formValues.billingMode === "DAILY";
    const rent = Number(formValues.monthlyRent) || 0;
    const dailyRate = Number(formValues.dailyRate) || 0;
    const deposit = Number(formValues.advanceAmount) || 0;
    const paid = Number(formValues.amountPaid) || 0;
    const primaryCharge = isDaily ? dailyRate : rent;
    const totalInitialCharges = primaryCharge + deposit;
    const remainingDue = Math.max(totalInitialCharges - paid, 0);

    const paymentStatus: "UNPAID" | "PARTIAL" | "PAID" =
        paid <= 0
            ? "UNPAID"
            : paid >= totalInitialCharges
              ? "PAID"
              : "PARTIAL";

    const statusBadgeClass =
        paymentStatus === "PAID"
            ? "bg-emerald-100 text-emerald-800"
            : paymentStatus === "PARTIAL"
              ? "bg-amber-100 text-amber-800"
              : "bg-rose-100 text-rose-800";

    return (
        <div className="space-y-5">
            <div className="bg-slate-50/70 p-6 rounded-xl border border-brand-border space-y-4">
                <h4 className="text-base font-bold text-brand-primary border-b border-brand-border/60 pb-2">
                    Review Resident Details
                </h4>

                <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-semibold text-neutral-500">
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">First Name</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.firstName}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Last Name</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.lastName}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Gender</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.gender}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Date of Birth</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.dateOfBirth || "—"}</p>
                    </div>

                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Contact Phone</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.mobileNumber}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Alternate Phone
                        </p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.altMobileNumber || "—"}</p>
                    </div>
                    <div className="sm:col-span-2">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Email Address</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.email || "—"}</p>
                    </div>

                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Aadhaar Card</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.aadhaarNumber || "Provided Later"}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Occupation</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.occupation || "—"}</p>
                    </div>
                    <div className="sm:col-span-2">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Emergency Contact
                        </p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">
                            {formValues.emergencyContactName ? `${formValues.emergencyContactName} (${formValues.emergencyContactPhone || ""})` : "—"}
                        </p>
                    </div>

                    <div className="sm:col-span-2 lg:col-span-4">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Permanent Address
                        </p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.permanentAddress || "—"}</p>
                    </div>

                    <div className="pt-2 border-t border-brand-border/60 sm:col-span-2 lg:col-span-4"></div>

                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Allocated Room & Bed
                        </p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">
                            Room {formValues.roomNumber} ({formValues.bedNumber ? `Bed ${formValues.bedNumber}, ` : ""}Floor {formValues.floor})
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Check-in Date</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.joinDate}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Planned Check-out</p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">{formValues.checkOutDate || "Open Stay"}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Billing Mode</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mt-0.5 ${isDaily ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                            {isDaily ? "Daily Basis Stay" : "Monthly Stay"}
                        </span>
                    </div>

                    <div className="pt-2 border-t border-brand-border/60 sm:col-span-2 lg:col-span-4"></div>

                    {/* Financial Summary */}
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            {isDaily ? "Daily Rate" : "Monthly Rent"}
                        </p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">
                            {settings.currencySymbol}
                            {primaryCharge.toLocaleString()}
                            {isDaily && <span className="text-[10px] text-slate-400 font-normal"> / day</span>}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Security Deposit
                        </p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">
                            {settings.currencySymbol}
                            {deposit.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Total Initial Charges
                        </p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">
                            {settings.currencySymbol}
                            {totalInitialCharges.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Amount Paid</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">
                            {settings.currencySymbol}
                            {paid.toLocaleString()}
                        </p>
                    </div>

                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Remaining Due
                        </p>
                        <p
                            className={`text-sm font-bold mt-0.5 ${remainingDue > 0 ? "text-rose-600" : "text-neutral-800"}`}
                        >
                            {settings.currencySymbol}
                            {remainingDue.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Payment Method
                        </p>
                        <p className="text-sm font-bold text-neutral-800 mt-0.5">
                            {formValues.paymentMethod || "CASH"}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                            Payment Status
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mt-1 ${statusBadgeClass}`}>
                            {paymentStatus}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
