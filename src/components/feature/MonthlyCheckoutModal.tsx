import React, { useEffect, useState } from "react";
import {
    Calendar,
    BedDouble,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Info,
    Loader2,
    LogOut,
    ShieldCheck,
    Wrench,
    Receipt,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { roomAllocationService, type CheckoutPreviewResponse } from "@/api/roomAllocationService";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/context/ToastContext";
import type { CustomerDirectoryItem } from "@/api/customerService";

interface MonthlyCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    target: CustomerDirectoryItem | null;
    onSuccess: () => void;
}

export const MonthlyCheckoutModal: React.FC<MonthlyCheckoutModalProps> = ({
    isOpen,
    onClose,
    target,
    onSuccess,
}) => {
    const { settings } = useSettings();
    const { toast } = useToast();

    const todayStr = new Date().toISOString().substring(0, 10);
    const checkInDate = target?.joinDate || todayStr;

    const [checkOutDate, setCheckOutDate] = useState<string>(todayStr);
    const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Damage / Deductions state
    const [deductionAmount, setDeductionAmount] = useState<string>("0");
    const [deductionReason, setDeductionReason] = useState<string>("");

    // Settlement state
    const [payMethod, setPayMethod] = useState<string>("CASH");
    const [transRef, setTransRef] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    // Initialize checkout date when target opens
    useEffect(() => {
        if (isOpen && target) {
            setCheckOutDate(todayStr);
            setDeductionAmount("0");
            setDeductionReason("");
            setPayMethod("CASH");
            setTransRef("");
            setNotes("");
            fetchPreview(todayStr);
        } else {
            setPreview(null);
        }
    }, [isOpen, target]);

    // Fetch checkout preview calculation
    const fetchPreview = async (date: string) => {
        if (!target?.allocationId) return;
        setIsLoadingPreview(true);
        try {
            const res = await roomAllocationService.getCheckoutPreview(target.allocationId, date);
            if (res.data) {
                setPreview(res.data);
            }
        } catch (err: any) {
            console.error("Could not fetch monthly checkout preview:", err);
            toast.error(err?.message || "Failed to load checkout calculations.");
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleDateChange = (newDate: string) => {
        setCheckOutDate(newDate);
        fetchPreview(newDate);
    };

    const currency = settings.currencySymbol || "₹";

    // Financial calculations incorporating user deductions
    const unpaidRentDues = Number(preview?.unpaidRentDues ?? 0);
    const securityDepositPaid = Number(preview?.securityDepositPaid ?? target?.securityDepositPaid ?? 0);
    const numericDeduction = Math.max(0, Number(deductionAmount) || 0);
    const netRefundableDeposit = Math.max(0, securityDepositPaid - numericDeduction);

    // Net settlement calculation:
    // If > 0: resident owes hostel money
    // If < 0: hostel owes refund to resident
    // If == 0: clear
    const netSettlement = unpaidRentDues - netRefundableDeposit;

    const handleCheckoutSubmit = async () => {
        if (!target?.allocationId) return;

        const payload: any = {
            checkOutDate,
        };

        if (numericDeduction > 0) {
            payload.depositDeduction = numericDeduction;
            payload.depositDeductionReason = deductionReason.trim() || "Damages / Maintenance deduction";
        }

        if (netSettlement > 0) {
            // Resident pays remaining dues
            payload.payment = {
                amount: netSettlement,
                paymentMethod: payMethod,
                transactionReference: transRef.trim() || undefined,
                notes: notes.trim() || `Monthly checkout settlement payment for Room ${target.roomNumber}`,
            };
        } else if (netSettlement < 0) {
            // Hostel refunds deposit
            const refundAmt = Math.abs(netSettlement);
            payload.refund = {
                amount: refundAmt,
                paymentMethod: payMethod,
                transactionReference: transRef.trim() || undefined,
                notes: notes.trim() || `Security deposit refund after pro-rated rent deductions`,
            };
        }

        setIsSubmitting(true);
        try {
            const res = await roomAllocationService.endAllocation(target.allocationId, payload);
            if (res.isSuccess) {
                toast.success(`Check-out completed for ${target.name}. Room ${target.roomNumber} bed is now vacant.`);
                onSuccess();
                onClose();
            } else {
                toast.error(res.errorMessage || "Check-out failed. Please try again.");
            }
        } catch (err: any) {
            console.error("Monthly checkout submission failed:", err);
            toast.error(err?.message || "Check-out failed. Please check connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !target) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="2xl"
            headerVariant="dark"
            icon={<LogOut className="w-5 h-5 text-indigo-400" />}
            title="Monthly Resident Check-out & Settle"
            subtitle="Pro-rate current month stay, adjust security deposit & deductions, and settle net balance."
            footer={
                <div className="flex items-center justify-between w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleCheckoutSubmit}
                        disabled={isSubmitting || isLoadingPreview}
                        className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition cursor-pointer ${
                            netSettlement > 0
                                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                : netSettlement < 0
                                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Processing Check-out...</span>
                            </>
                        ) : netSettlement > 0 ? (
                            <>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay {currency}{netSettlement.toLocaleString("en-IN")} & Check-out</span>
                            </>
                        ) : netSettlement < 0 ? (
                            <>
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Record Refund of {currency}{Math.abs(netSettlement).toLocaleString("en-IN")} & Vacate</span>
                            </>
                        ) : (
                            <>
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Confirm Check-out & Vacate Bed</span>
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Resident & Room Banner */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <div>
                        <div className="font-bold text-slate-900 text-sm">{target.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{target.mobileNumber}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold">
                            <BedDouble className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Room {target.roomNumber || "—"}{target.bedNumber ? ` (Bed ${target.bedNumber})` : ""}</span>
                        </div>
                        <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md text-[11px] font-bold uppercase">
                            Monthly Stay
                        </span>
                    </div>
                </div>

                {/* Step 1: Check-out Date Selection */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        1. Select Check-out Date
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-[11px] text-slate-400 font-semibold block uppercase">Join / Check-in Date</span>
                            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {checkInDate}
                            </span>
                        </div>

                        <div className="relative">
                            <span className="text-[11px] text-slate-500 font-bold block uppercase mb-1">
                                Check-out Date <span className="text-rose-500">*</span>
                            </span>
                            <input
                                type="date"
                                min={checkInDate}
                                max={todayStr}
                                value={checkOutDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Step 2: Pro-rated Stay & Rent Breakdown */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            2. Exit Billing Cycle & Pro-rated Rent
                        </label>
                        {isLoadingPreview && (
                            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recalculating...
                            </span>
                        )}
                    </div>

                    {preview ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Cycle Header */}
                            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    <span>Current Cycle: {preview.currentCycleStart || "—"} to {preview.currentCycleEnd || "—"}</span>
                                    <span className="text-slate-400">({preview.daysInCycle || 30} Days)</span>
                                </div>
                                <span className="text-slate-600 font-medium">
                                    Agreed Rent: <strong className="text-slate-900">{currency}{Number(preview.monthlyRent || target.monthlyRent || 0).toLocaleString("en-IN")}</strong>/mo
                                </span>
                            </div>

                            {/* Pro-ration 3-col stats */}
                            <div className="grid grid-cols-3 bg-white border-b border-slate-100 divide-x divide-slate-100 text-center py-2.5">
                                <div>
                                    <span className="text-[11px] text-slate-400 block">Stayed in Cycle</span>
                                    <span className="font-extrabold text-slate-900 text-sm">
                                        {preview.daysStayedInCycle} Day{preview.daysStayedInCycle && preview.daysStayedInCycle > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 block">Pro-rated Rate</span>
                                    <span className="font-extrabold text-slate-900 text-sm">
                                        {currency}{Number(preview.dailyProRatedRate || 0).toFixed(2)}<span className="text-[10px] text-slate-400 font-normal">/d</span>
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 block">Pro-rated Rent</span>
                                    <span className="font-extrabold text-indigo-700 text-sm">
                                        {currency}{Number(preview.proRatedRentAmount || 0).toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>

                            {/* Detail breakdown list */}
                            <div className="p-3.5 space-y-2 text-xs bg-white">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Rent Already Paid for This Cycle:</span>
                                    <span className="font-semibold text-emerald-600">
                                        {currency}{Number(preview.rentPaidForCurrentCycle || 0).toLocaleString("en-IN")}
                                    </span>
                                </div>

                                {preview.speculativeChargesToCancelCount > 0 && (
                                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-1.5 text-[11px]">
                                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                                        <span>
                                            <strong>{preview.speculativeChargesToCancelCount}</strong> future unallocated charge(s) beyond {checkOutDate} will be deleted automatically.
                                        </span>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-xs">Total Unpaid Rent (Past + Exit Cycle):</span>
                                    <span className="font-extrabold text-sm text-slate-900">
                                        {currency}{unpaidRentDues.toLocaleString("en-IN")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-500" />
                            Loading preview...
                        </div>
                    )}
                </div>

                {/* Step 3: Security Deposit & Deductions */}
                <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        3. Security Deposit & Deductions
                    </label>
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 font-medium">Security Deposit Paid at Check-in:</span>
                            <span className="font-bold text-slate-900 text-sm">
                                {currency}{securityDepositPaid.toLocaleString("en-IN")}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                            <div>
                                <label className="block text-slate-600 font-semibold mb-1 flex items-center gap-1">
                                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                                    Damage / Cleaning Deduction ({currency})
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max={securityDepositPaid}
                                    value={deductionAmount}
                                    onChange={(e) => setDeductionAmount(e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-600 font-semibold mb-1">Deduction Reason (Optional)</label>
                                <input
                                    type="text"
                                    value={deductionReason}
                                    onChange={(e) => setDeductionReason(e.target.value)}
                                    placeholder="e.g. Room painting, broken latch"
                                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                            <span className="font-bold text-slate-700">Net Refundable Security Deposit:</span>
                            <span className="font-extrabold text-sm text-emerald-700">
                                {currency}{netRefundableDeposit.toLocaleString("en-IN")}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Step 4: Final Net Settlement Summary & Action */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        4. Final Net Settlement
                    </label>

                    {netSettlement > 0 ? (
                        /* Outcome 1: Resident owes net dues */
                        <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between text-xs text-rose-800">
                                <div className="flex items-center gap-1.5 font-bold">
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span>Resident owes remaining balance after deposit adjustment:</span>
                                </div>
                                <span className="font-extrabold text-base text-rose-700">
                                    {currency}{netSettlement.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                                    <select
                                        value={payMethod}
                                        onChange={(e) => setPayMethod(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-rose-500"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Debit / Credit Card</option>
                                        <option value="NET_BANKING">Net Banking</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">Transaction Ref (Optional)</label>
                                    <input
                                        type="text"
                                        value={transRef}
                                        onChange={(e) => setTransRef(e.target.value)}
                                        placeholder="UPI / Txn ID"
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-600 font-semibold mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={`Monthly settlement payment for Room ${target.roomNumber}`}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-rose-500"
                                />
                            </div>
                        </div>
                    ) : netSettlement < 0 ? (
                        /* Outcome 2: Hostel owes refund of security deposit */
                        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                            <div className="flex items-center justify-between text-xs text-emerald-800">
                                <div className="flex items-center gap-1.5 font-bold">
                                    <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Refund Due to Resident (Deposit minus Pro-rated Rent & Deductions):</span>
                                </div>
                                <span className="font-extrabold text-base text-emerald-700">
                                    {currency}{Math.abs(netSettlement).toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">Refund Payment Mode</label>
                                    <select
                                        value={payMethod}
                                        onChange={(e) => setPayMethod(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">Transaction Ref (Optional)</label>
                                    <input
                                        type="text"
                                        value={transRef}
                                        onChange={(e) => setTransRef(e.target.value)}
                                        placeholder="UPI / Refund Txn ID"
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-600 font-semibold mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={`Security deposit refund returned to ${target.name}`}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    ) : (
                        /* Outcome 3: Perfect balance 0 */
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                                <span className="font-bold">Dues & Security Deposit are completely settled.</span>
                                <p className="text-emerald-700 text-[11px] mt-0.5">
                                    No money exchange required. You can vacate the room bed directly.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MonthlyCheckoutModal;
