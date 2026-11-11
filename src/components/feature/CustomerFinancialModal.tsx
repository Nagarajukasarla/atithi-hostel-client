import React, { useEffect, useState } from "react";
import {
    RefreshCw,
    Receipt,
    CreditCard,
    ShieldCheck,
    CalendarDays,
    ArrowUpRight,
    AlertCircle,
    CheckCircle2,
    Clock,
} from "lucide-react";
import { financialService, type CustomerFinancialDetails } from "@/api/financialService";
import { Modal } from "@/components/common/Modal";
import { formatCurrency as formatCurrencyUtil, formatDate as formatDateUtil } from "@/utils";

interface CustomerFinancialModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: number | string | null;
    customerName?: string;
}

export const CustomerFinancialModal: React.FC<CustomerFinancialModalProps> = ({
    isOpen,
    onClose,
    customerId,
    customerName: initialCustomerName,
}) => {
    const [details, setDetails] = useState<CustomerFinancialDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"charges" | "payments" | "allocations">("charges");

    const fetchDetails = async () => {
        if (!customerId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await financialService.getCustomerFinancialDetails(customerId);
            if (res && res.data) {
                setDetails(res.data);
            } else {
                setError("No financial data found for this customer.");
            }
        } catch (err: any) {
            console.error("Failed to load customer financial details:", err);
            setError(err?.message || "Failed to load financial records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && customerId) {
            fetchDetails();
        } else {
            setDetails(null);
            setError(null);
        }
    }, [isOpen, customerId]);

    if (!isOpen) return null;

    const summary = details?.summary;
    const customer = details?.customer;
    const activeAllocation = details?.activeAllocation;
    const charges = details?.charges || [];
    const payments = details?.payments || [];
    const allocations = details?.paymentAllocations || [];

    const formatCurrency = (val: number | null | undefined) => formatCurrencyUtil(val, { decimals: 2 });
    const formatDate = (dateStr: string | null | undefined) => formatDateUtil(dateStr, "short");

    const getChargeStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case "PAID":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                );
            case "PARTIAL":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" /> Partial
                    </span>
                );
            case "OPEN":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3 h-3" /> Open
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                        {status}
                    </span>
                );
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case "SUCCESS":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Success
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3" /> Pending
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                        {status}
                    </span>
                );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="4xl"
            icon={<Receipt className="w-5 h-5" />}
            title={customer?.fullName || initialCustomerName || "Customer Financial Ledger"}
            subtitle={
                activeAllocation ? (
                    <span className="flex items-center gap-2">
                        <span>Room {activeAllocation.roomNumber || activeAllocation.roomId}</span>
                        {activeAllocation.bedNumber && <span>• Bed {activeAllocation.bedNumber}</span>}
                        {activeAllocation.checkInDate && <span>• Checked in {formatDate(activeAllocation.checkInDate)}</span>}
                    </span>
                ) : (
                    <span>Financial Account #{customerId}</span>
                )
            }
            headerActions={
                <button
                    type="button"
                    onClick={fetchDetails}
                    disabled={loading}
                    className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
                    title="Refresh Ledger"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
                </button>
            }
            footer={
                <div className="flex items-center justify-between w-full text-xs text-slate-500">
                    <span>Atithi Financial Ledger • Single Source of Truth</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 font-medium transition cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            }
            bodyClassName="space-y-6"
        >
            {loading && !details ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500">Loading customer financial records...</p>
                </div>
            ) : error ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {/* Rent / Daily Rate */}
                        {summary?.billingMode === "DAILY" ? (
                            <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80">
                                <span className="text-xs font-medium text-indigo-700 block">Daily Rate</span>
                                <span className="text-base font-bold text-indigo-900 mt-1 block">
                                    {formatCurrency(summary?.dailyRate)} / day
                                </span>
                                <span className="text-[10px] text-indigo-500 font-medium">Daily Stay Terms</span>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                                <span className="text-xs font-medium text-slate-500 block">Monthly Rent</span>
                                <span className="text-base font-bold text-slate-900 mt-1 block">
                                    {formatCurrency(summary?.monthlyRent)}
                                </span>
                                <span className="text-[10px] text-slate-400">Agreed terms</span>
                            </div>
                        )}

                        {/* Security Deposit */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                            <span className="text-xs font-medium text-slate-500 block">Security Deposit</span>
                            <span className="text-base font-bold text-slate-900 mt-1 block">
                                {formatCurrency(summary?.securityDepositRequired)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">
                                Paid: {formatCurrency(summary?.securityDepositPaid)}
                            </span>
                        </div>

                        {/* Total Billed Charges */}
                        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                            <span className="text-xs font-medium text-slate-500 block">Total Billed</span>
                            <span className="text-base font-bold text-slate-900 mt-1 block">
                                {formatCurrency(summary?.totalCharges)}
                            </span>
                            <span className="text-[10px] text-slate-400">{charges.length} charges recorded</span>
                        </div>

                        {/* Total Paid */}
                        <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60">
                            <span className="text-xs font-medium text-emerald-700 block">Total Paid</span>
                            <span className="text-base font-bold text-emerald-700 mt-1 block">
                                {formatCurrency(summary?.totalPaid)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">{payments.length} payments made</span>
                        </div>

                        {/* Outstanding Due */}
                        <div
                            className={`p-3.5 rounded-xl col-span-2 md:col-span-1 border ${
                                (summary?.outstandingBalance || 0) > 0
                                    ? "bg-rose-50/70 border-rose-200 text-rose-900"
                                    : "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                            }`}
                        >
                            <span className="text-xs font-semibold block">Outstanding Due</span>
                            <span className="text-lg font-extrabold mt-1 block">
                                {formatCurrency(summary?.outstandingBalance)}
                            </span>
                            <span className="text-[10px] font-medium">
                                {(summary?.outstandingBalance || 0) > 0 ? "Pending payment" : "All cleared 🎉"}
                            </span>
                        </div>
                    </div>

                    {/* Tabs Header */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <button
                            type="button"
                            onClick={() => setActiveTab("charges")}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                                activeTab === "charges"
                                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            Charges Ledger ({charges.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("payments")}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                                activeTab === "payments"
                                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <CreditCard className="w-3.5 h-3.5" />
                            Payments History ({payments.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("allocations")}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                                activeTab === "allocations"
                                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                        >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Payment Allocations ({allocations.length})
                        </button>
                    </div>

                    {/* Tab 1: Charges Table */}
                    {activeTab === "charges" && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-600">
                                    <thead className="bg-slate-50/80 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-4">Type</th>
                                            <th className="py-2.5 px-4">Period</th>
                                            <th className="py-2.5 px-4">Date</th>
                                            <th className="py-2.5 px-4 text-right">Amount</th>
                                            <th className="py-2.5 px-4 text-right">Paid</th>
                                            <th className="py-2.5 px-4 text-right">Due</th>
                                            <th className="py-2.5 px-4 text-center">Status</th>
                                            <th className="py-2.5 px-4">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {charges.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-slate-400">
                                                    No charges recorded for this resident.
                                                </td>
                                            </tr>
                                        ) : (
                                            charges.map(ch => {
                                                const paid = ch.paidAmount ?? 0;
                                                const remaining = ch.remainingAmount ?? Math.max(0, (ch.amount || 0) - paid);
                                                return (
                                                    <tr key={ch.id} className="hover:bg-slate-50/50 transition">
                                                        <td className="py-3 px-4 font-semibold text-slate-800">
                                                            <span className="flex items-center gap-1.5">
                                                                {ch.chargeType === "SECURITY_DEPOSIT" ? (
                                                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                                                                ) : ch.chargeType === "DAILY_RENT" ? (
                                                                    <CalendarDays className="w-3.5 h-3.5 text-amber-500" />
                                                                ) : (
                                                                    <Receipt className="w-3.5 h-3.5 text-blue-500" />
                                                                )}
                                                                {ch.chargeType === "DAILY_RENT" ? "Daily Rent" : ch.chargeType.replace("_", " ")}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-500">
                                                            {ch.chargeType === "DAILY_RENT" && (ch.periodStart || ch.dueDate)
                                                                ? formatDate(ch.periodStart || ch.dueDate)
                                                                : ch.periodStart && ch.periodEnd
                                                                ? `${formatDate(ch.periodStart)} – ${formatDate(ch.periodEnd)}`
                                                                : "Registration"}
                                                        </td>
                                                        <td className="py-3 px-4 text-slate-500">{formatDate(ch.dueDate)}</td>
                                                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                                                            {formatCurrency(ch.amount)}
                                                        </td>
                                                        <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                                                            {formatCurrency(paid)}
                                                        </td>
                                                        <td className={`py-3 px-4 text-right font-bold ${remaining > 0 ? "text-rose-600" : "text-slate-400"}`}>
                                                            {formatCurrency(remaining)}
                                                        </td>
                                                        <td className="py-3 px-4 text-center">{getChargeStatusBadge(ch.status)}</td>
                                                        <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                                                            {ch.notes || "—"}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Payments Table */}
                    {activeTab === "payments" && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-600">
                                    <thead className="bg-slate-50/80 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-4">Receipt #</th>
                                            <th className="py-2.5 px-4">Payment Date</th>
                                            <th className="py-2.5 px-4">Type</th>
                                            <th className="py-2.5 px-4">Method</th>
                                            <th className="py-2.5 px-4 text-right">Amount</th>
                                            <th className="py-2.5 px-4 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                                    No payments recorded for this resident.
                                                </td>
                                            </tr>
                                        ) : (
                                            payments.map((p: any) => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                                                        {p.receiptNumber || `PAY-${p.id}`}
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500">{formatDate(p.paymentDate)}</td>
                                                    <td className="py-3 px-4 font-medium text-slate-700">
                                                        {(p.paymentType || "PAYMENT").replace("_", " ")}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                                                            {p.paymentMethod || "CASH"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                                        {formatCurrency(p.amount)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">{getPaymentStatusBadge(p.paymentStatus)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Allocations Breakdown */}
                    {activeTab === "allocations" && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs text-slate-600">
                                    <thead className="bg-slate-50/80 text-slate-700 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-4">Allocation ID</th>
                                            <th className="py-2.5 px-4">Payment ID</th>
                                            <th className="py-2.5 px-4">Settled Charge</th>
                                            <th className="py-2.5 px-4">Date</th>
                                            <th className="py-2.5 px-4 text-right">Allocated Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {allocations.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-slate-400">
                                                    No payment allocations recorded yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            allocations.map((a: any) => (
                                                <tr key={a.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="py-3 px-4 font-mono text-slate-500">#{a.id}</td>
                                                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                                                        Payment #{a.paymentId}
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-slate-700">
                                                        <span className="flex items-center gap-1.5">
                                                            <Receipt className="w-3 h-3 text-indigo-500" />
                                                            Charge #{a.chargeId} ({(a.chargeType || "CHARGE").replace("_", " ")})
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-500">{formatDate(a.createdAt)}</td>
                                                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                                        {formatCurrency(a.allocatedAmount)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </Modal>
    );
};

export default CustomerFinancialModal;
