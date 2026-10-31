import React, { useState, useEffect } from "react";
import { IndianRupee, Loader2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/context/ToastContext";
import { paymentService } from "@/api/paymentService";
import type { CustomerDirectoryItem } from "@/api/customerService";

export interface PayModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: CustomerDirectoryItem | null;
    onSuccess?: () => void;
}

export const PayModal: React.FC<PayModalProps> = ({
    isOpen,
    onClose,
    customer,
    onSuccess,
}) => {
    const { settings } = useSettings();
    const { toast } = useToast();

    const [payAmount, setPayAmount] = useState<string>("");
    const [payMethod, setPayMethod] = useState<"CASH" | "UPI" | "CARD" | "BANK_TRANSFER">("CASH");
    const [isPaySubmitting, setIsPaySubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen && customer) {
            setPayAmount("");
            setPayMethod("CASH");
        }
    }, [isOpen, customer]);

    if (!customer) return null;

    const isDaily = customer.billingMode === "DAILY";
    const currency = settings.currencySymbol || "₹";

    const handlePaySubmit = async () => {
        if (!customer || !payAmount || Number(payAmount) <= 0) return;

        setIsPaySubmitting(true);
        try {
            const res = await paymentService.createPayment({
                customerId: customer.customerId,
                allocationId: customer.allocationId,
                paymentType: (isDaily ? "DAILY_RENT" : "MONTHLY_RENT") as any,
                amount: Number(payAmount),
                paymentMethod: payMethod as any,
                paymentStatus: "SUCCESS" as any,
                notes: `Payment for ${customer.name} — Room ${customer.roomNumber}`,
            });

            if (res.isSuccess) {
                toast.success(
                    `Payment of ${currency}${Number(payAmount).toLocaleString("en-IN")} recorded for ${customer.name}`
                );
                onClose();
                onSuccess?.();
            } else {
                toast.error(res.errorMessage || "Payment failed. Please try again.");
            }
        } catch (err: any) {
            console.error("Payment failed:", err);
            toast.error(err?.message || "Payment recording failed. Please try again.");
        } finally {
            setIsPaySubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="md"
            icon={<IndianRupee className="w-5 h-5" />}
            title={isDaily ? "Record Daily Payment" : "Record Payment"}
            subtitle={`${customer.name} — Room ${customer.roomNumber}${customer.bedNumber ? ` (Bed ${customer.bedNumber})` : ""}`}
            footer={
                <div className="flex items-center justify-end gap-2 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handlePaySubmit}
                        disabled={isPaySubmitting || !payAmount || Number(payAmount) <= 0}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition cursor-pointer ${
                            isPaySubmitting || !payAmount || Number(payAmount) <= 0
                                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                                : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                        }`}
                    >
                        {isPaySubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <IndianRupee className="w-3.5 h-3.5" />
                                Confirm Payment
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">
                {/* Outstanding Summary */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block">
                            {isDaily ? "Daily Rate" : "Monthly Rent"}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                            {currency}
                            {Number(
                                isDaily ? customer.dailyRate || 0 : customer.monthlyRent || 0
                            ).toLocaleString("en-IN")}
                            {isDaily ? " / day" : ""}
                        </span>
                    </div>
                    <div
                        className={`p-3 rounded-xl border ${
                            Number(customer.outstandingBalance || 0) > 0
                                ? "bg-rose-50/70 border-rose-200"
                                : "bg-emerald-50/70 border-emerald-200"
                        }`}
                    >
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide block">
                            Outstanding Due
                        </span>
                        <span
                            className={`text-sm font-bold ${
                                Number(customer.outstandingBalance || 0) > 0
                                    ? "text-rose-700"
                                    : "text-emerald-700"
                            }`}
                        >
                            {currency}
                            {Number(customer.outstandingBalance || 0).toLocaleString("en-IN")}
                        </span>
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Payment Amount
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                            {currency}
                        </span>
                        <input
                            type="number"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            placeholder="0"
                            min="1"
                            step="1"
                            className="w-full pl-8 pr-4 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Payment Method
                    </label>
                    <div className="flex gap-2">
                        {(["CASH", "UPI", "CARD", "BANK_TRANSFER"] as const).map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setPayMethod(method)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                                    payMethod === method
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                {method === "BANK_TRANSFER" ? "Bank" : method}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default PayModal;
