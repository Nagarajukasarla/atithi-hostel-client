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
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { roomAllocationService, type CheckoutPreviewResponse } from "@/api/roomAllocationService";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/context/ToastContext";
import type { CustomerDirectoryItem } from "@/api/customerService";

interface DailyCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    target: CustomerDirectoryItem | null;
    onSuccess: () => void;
}

export const DailyCheckoutModal: React.FC<DailyCheckoutModalProps> = ({
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

    // Payment settlement inputs
    const [payMethod, setPayMethod] = useState<string>("CASH");
    const [transRef, setTransRef] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    // Initialize checkout date when target opens
    useEffect(() => {
        if (isOpen && target) {
            setCheckOutDate(todayStr);
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
            console.error("Could not fetch daily checkout preview:", err);
            toast.error(err?.message || "Failed to load checkout calculations.");
        } finally {
            setIsLoadingPreview(false);
        }
    };

    const handleDateChange = (newDate: string) => {
        setCheckOutDate(newDate);
        fetchPreview(newDate);
    };

    const handleCheckoutSubmit = async () => {
        if (!target?.allocationId) return;

        const netDue = Number(preview?.netSettlementAmount ?? 0);
        const payload: any = {
            checkOutDate,
        };

        if (netDue > 0) {
            payload.payment = {
                amount: netDue,
                paymentMethod: payMethod,
                transactionReference: transRef.trim() || undefined,
                notes: notes.trim() || `Daily checkout settlement payment for Room ${target.roomNumber}`,
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
            console.error("Checkout submission failed:", err);
            toast.error(err?.message || "Check-out failed. Please check connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !target) return null;

    const netDue = Number(preview?.netSettlementAmount ?? 0);
    const currency = settings.currencySymbol || "₹";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="xl"
            headerVariant="dark"
            icon={<LogOut className="w-5 h-5 text-rose-400" />}
            title="Check-out Daily Guest & Settle"
            subtitle="Review stay duration, cancel future daily charges, and settle pending dues."
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
                            netDue > 0
                                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Processing Check-out...</span>
                            </>
                        ) : netDue > 0 ? (
                            <>
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay {currency}{netDue.toLocaleString("en-IN")} & Check-out</span>
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
                {/* Guest & Room Info Banner */}
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
                        <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-[11px] font-bold uppercase">
                            Daily Stay
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
                            <span className="text-[11px] text-slate-400 font-semibold block uppercase">Check-in Date</span>
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

                {/* Step 2: Financial Preview for Selected Date */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            2. Stay & Tariff Breakdown
                        </label>
                        {isLoadingPreview && (
                            <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recalculating...
                            </span>
                        )}
                    </div>

                    {preview ? (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200 text-center">
                                <div className="p-3">
                                    <span className="text-[11px] text-slate-500 font-medium block">Stay Duration</span>
                                    <span className="font-extrabold text-slate-900 text-base">
                                        {preview.stayDurationDays} Day{preview.stayDurationDays && preview.stayDurationDays > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <span className="text-[11px] text-slate-500 font-medium block">Daily Rate</span>
                                    <span className="font-extrabold text-slate-900 text-base">
                                        {currency}{Number(preview.dailyRate || target.dailyRate || 0).toLocaleString("en-IN")}
                                        <span className="text-xs font-normal text-slate-400">/day</span>
                                    </span>
                                </div>
                            </div>

                            <div className="p-3.5 space-y-2 text-xs bg-white">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Total Stay Charges ({preview.stayDurationDays}d × {currency}{preview.dailyRate}):</span>
                                    <span className="font-semibold text-slate-800">
                                        {currency}{Number((preview.stayDurationDays || 1) * (Number(preview.dailyRate) || 0)).toLocaleString("en-IN")}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Already Paid by Guest:</span>
                                    <span className="font-semibold text-emerald-600">
                                        {currency}{Number(preview.totalPaid || 0).toLocaleString("en-IN")}
                                    </span>
                                </div>

                                {preview.speculativeChargesToCancelCount > 0 && (
                                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-start gap-1.5 text-[11px]">
                                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                                        <span>
                                            Early checkout: <strong>{preview.speculativeChargesToCancelCount}</strong> future daily charge(s) after {checkOutDate} will be cancelled automatically.
                                        </span>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-sm">Outstanding Due:</span>
                                    <span className={`font-extrabold text-base ${netDue > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                        {currency}{Math.max(0, netDue).toLocaleString("en-IN")}
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

                {/* Step 3: Settlement Action */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        3. Settlement & Vacate Bed
                    </label>

                    {netDue > 0 ? (
                        <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-3">
                            <div className="flex items-center justify-between text-xs text-rose-800">
                                <span className="flex items-center gap-1 font-semibold">
                                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                    Payment required to check out:
                                </span>
                                <span className="font-extrabold text-sm text-rose-700">
                                    {currency}{netDue.toLocaleString("en-IN")}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <label className="block text-slate-600 font-semibold mb-1">Payment Method</label>
                                    <select
                                        value={payMethod}
                                        onChange={(e) => setPayMethod(e.target.value)}
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
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
                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-slate-600 font-semibold mb-1">Notes</label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={`Checkout settlement payment for Room ${target.roomNumber}`}
                                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div>
                                <span className="font-bold">Zero Outstanding Balance.</span>
                                <p className="text-emerald-700 text-[11px] mt-0.5">
                                    All daily charges have been fully settled. You can vacate the bed immediately.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default DailyCheckoutModal;
