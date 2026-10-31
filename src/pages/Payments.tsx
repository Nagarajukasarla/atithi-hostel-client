import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTable } from "@/components/common/DataTable";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { useSettings } from "@/context/SettingsContext";
import { paymentService } from "@/api/paymentService";
import type { Payment, PaymentStatus, PaymentType } from "@/types";
import { DollarSign, ArrowUpRight, RefreshCw, Receipt, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";

export const Payments: React.FC = () => {
    const { settings } = useSettings();

    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

    const fetchPayments = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await paymentService.getPayments();
            const list = Array.isArray(res?.data)
                ? res.data
                : res?.data && Array.isArray((res.data as any).data)
                  ? (res.data as any).data
                  : [];
            setPayments(list);
        } catch (err: any) {
            console.warn("Could not fetch payments:", err);
            setPayments([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // Summary statistics
    const stats = useMemo(() => {
        const totalAmount = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
        const successCount = payments.filter(p => p.paymentStatus === "SUCCESS").length;
        const upiCount = payments.filter(p => p.paymentMethod === "UPI").length;
        const cashCount = payments.filter(p => p.paymentMethod === "CASH").length;

        return {
            totalAmount,
            successCount,
            totalTransactions: payments.length,
            upiCount,
            cashCount,
        };
    }, [payments]);

    // Filter payments
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const matchesSearch =
                (p.customerName && p.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.receiptNumber && p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.transactionReference && p.transactionReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.roomNumber && p.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesType = selectedType === "ALL" || p.paymentType === selectedType;
            const matchesMethod = selectedMethod === "ALL" || p.paymentMethod === selectedMethod;
            const matchesStatus = selectedStatus === "ALL" || p.paymentStatus === selectedStatus;

            return matchesSearch && matchesType && matchesMethod && matchesStatus;
        });
    }, [payments, searchTerm, selectedType, selectedMethod, selectedStatus]);

    const getStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case "SUCCESS":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Success
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Pending
                    </span>
                );
            case "FAILED":
            case "CANCELLED":
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        {status}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {status}
                    </span>
                );
        }
    };

    const formatPaymentType = (type: PaymentType) => {
        switch (type) {
            case "INITIAL_REGISTRATION":
                return "Initial Registration";
            case "MONTHLY_RENT":
                return "Monthly Rent";
            case "SECURITY_DEPOSIT":
                return "Security Deposit";
            case "ADVANCE":
                return "Advance Deposit";
            case "MAINTENANCE":
                return "Maintenance";
            case "SERVICE":
                return "Service Charge";
            default:
                return type;
        }
    };

    // Columns for DataTable
    const columns = [
        {
            header: "Receipt #",
            accessor: (p: Payment) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900 text-xs font-mono">{p.receiptNumber || `PAY-${p.id}`}</p>
                        <p className="text-[10px] text-slate-400">{p.paymentDate}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Customer & Room",
            accessor: (p: Payment) => (
                <div>
                    <p className="font-semibold text-slate-900 text-xs">
                        {p.customerName || `Customer #${p.customerId}`}
                    </p>
                    <p className="text-[11px] text-slate-500">
                        {p.roomNumber
                            ? `Room ${p.roomNumber}${p.bedNumber ? ` (Bed ${p.bedNumber})` : ""}`
                            : "General / Direct"}
                    </p>
                </div>
            ),
        },
        {
            header: "Purpose / Type",
            accessor: (p: Payment) => (
                <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {formatPaymentType(p.paymentType)}
                </span>
            ),
        },
        {
            header: "Amount",
            accessor: (p: Payment) => (
                <span className="text-sm font-bold text-slate-900">
                    {settings.currencySymbol}
                    {Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
            ),
        },
        {
            header: "Method",
            accessor: (p: Payment) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                    <Wallet className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.paymentMethod}</span>
                </div>
            ),
        },
        {
            header: "Status",
            accessor: (p: Payment) => getStatusBadge(p.paymentStatus),
        },
        {
            header: "Reference / Notes",
            accessor: (p: Payment) => (
                <p
                    className="text-xs text-slate-500 max-w-[200px] truncate"
                    title={p.notes || p.transactionReference || "-"}
                >
                    {p.notes || p.transactionReference || "-"}
                </p>
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader
                title="Payments & Financial Transactions"
                description="View and track resident payments, rent collections, and transaction receipts."
                action={
                    <button
                        onClick={fetchPayments}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs focus:outline-none"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
                        Refresh
                    </button>
                }
            />

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatisticsCard
                    title="Total Revenue Collected"
                    value={`${settings.currencySymbol}${stats.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                    icon={<DollarSign className="w-5 h-5 text-white" />}
                    badgeColor="indigo"
                    description="Total collections to date"
                />
                <StatisticsCard
                    title="Total Transactions"
                    value={String(stats.totalTransactions)}
                    icon={<Receipt className="w-5 h-5 text-white" />}
                    badgeColor="emerald"
                    description={`${stats.successCount} successful`}
                />
                <StatisticsCard
                    title="UPI / Digital"
                    value={String(stats.upiCount)}
                    icon={<ArrowUpRight className="w-5 h-5 text-white" />}
                    badgeColor="purple"
                    description={`${stats.totalTransactions > 0 ? Math.round((stats.upiCount / stats.totalTransactions) * 100) : 0}% of volume`}
                />
                <StatisticsCard
                    title="Cash Payments"
                    value={String(stats.cashCount)}
                    icon={<Wallet className="w-5 h-5 text-white" />}
                    badgeColor="slate"
                    description={`${stats.totalTransactions > 0 ? Math.round((stats.cashCount / stats.totalTransactions) * 100) : 0}% direct cash`}
                />
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-full sm:w-80">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by customer, receipt, room..."
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                    {/* Payment Type filter */}
                    <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="ALL">All Payment Types</option>
                        <option value="INITIAL_REGISTRATION">Initial Registration</option>
                        <option value="MONTHLY_RENT">Monthly Rent</option>
                        <option value="SECURITY_DEPOSIT">Security Deposit</option>
                        <option value="ADVANCE">Advance Deposit</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="SERVICE">Service</option>
                    </select>

                    {/* Method filter */}
                    <select
                        value={selectedMethod}
                        onChange={e => setSelectedMethod(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="ALL">All Methods</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>

                    {/* Status filter */}
                    <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="SUCCESS">Success</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                        <span>Loading transactions...</span>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <EmptyState
                        title="No Payment Records Found"
                        description={
                            searchTerm || selectedType !== "ALL" || selectedMethod !== "ALL" || selectedStatus !== "ALL"
                                ? "No transactions match your current search and filters."
                                : "No payments recorded yet. Payments will automatically be logged when customers register or pay rent."
                        }
                    />
                ) : (
                    <DataTable data={filteredPayments} columns={columns} />
                )}
            </div>
        </div>
    );
};
