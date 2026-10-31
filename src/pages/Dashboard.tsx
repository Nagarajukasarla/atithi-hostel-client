import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import {
    BedDouble,
    IndianRupee,
    LogIn,
    LogOut,
    TrendingUp,
    Plus,
    RefreshCw,
    AlertCircle,
    Calendar,
    Users,
} from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { useStatistics } from "@/context/StatisticsContext";

export const Dashboard: React.FC = () => {
    const { settings } = useSettings();
    const navigate = useNavigate();
    const { stats, isLoading, error, refreshStatistics } = useStatistics();
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshStatistics(true);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Formatting helpers
    const formatCurrency = (amount: number | null | undefined): string => {
        const val = amount || 0;
        return `${settings.currencySymbol}${val.toLocaleString("en-IN")}`;
    };

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return "—";
        try {
            const [year, month, day] = dateStr.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Page Header with Action Buttons */}
            <PageHeader
                title="Welcome back to Atithi"
                description="Real-time pulse of your property — arrivals, occupancy, revenue and more."
                action={
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isLoading || isRefreshing}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                            title="Refresh statistics"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
                            <span>Refresh</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/customers?action=new")}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span>+ New Reservation</span>
                        </button>
                    </div>
                }
            />

            {/* Error Notification */}
            {error && (
                <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium">
                    <div className="flex items-center gap-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="px-3 py-1 bg-white border border-rose-200 text-rose-700 font-semibold rounded-lg hover:bg-rose-100/50 transition cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Top 4 KPI Stat Cards */}
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticsCard
                    title="OCCUPANCY"
                    value={isLoading ? "—" : `${stats?.occupancy?.occupancyPercentage ?? 0}%`}
                    icon={<BedDouble className="h-5 w-5" />}
                    description={
                        isLoading
                            ? "Loading beds..."
                            : `${stats?.occupancy?.occupiedBeds ?? 0} of ${stats?.occupancy?.totalBeds ?? 0} beds (${stats?.occupancy?.vacantBeds ?? 0} vacant)`
                    }
                    badgeColor="purple"
                />
                <StatisticsCard
                    title="THIS MONTH REVENUE"
                    value={isLoading ? "—" : formatCurrency(stats?.revenue?.thisMonthTotalRevenue ?? stats?.revenue?.totalMonthlyRevenue)}
                    icon={<IndianRupee className="h-5 w-5" />}
                    description={
                        isLoading
                            ? "Loading revenue..."
                            : `Monthly: ${formatCurrency(stats?.revenue?.thisMonthMonthlyRevenue)} • Daily: ${formatCurrency(stats?.revenue?.thisMonthDailyRevenue)}`
                    }
                    badgeColor="emerald"
                />
                <StatisticsCard
                    title="MONTH ARRIVALS"
                    value={isLoading ? "—" : stats?.arrivals?.monthArrivalsCount ?? 0}
                    icon={<LogIn className="h-5 w-5" />}
                    description={
                        isLoading
                            ? "Loading arrivals..."
                            : `${stats?.arrivals?.activeInHouseGuests ?? 0} in-house guests (${stats?.arrivals?.todayArrivalsCount ?? 0} today)`
                    }
                    badgeColor="cyan"
                />
                <StatisticsCard
                    title="MONTH DEPARTURES"
                    value={isLoading ? "—" : stats?.departures?.monthDeparturesCount ?? 0}
                    icon={<LogOut className="h-5 w-5" />}
                    description={
                        isLoading
                            ? "Loading departures..."
                            : `${stats?.departures?.todayDeparturesCount ?? 0} departed today`
                    }
                    badgeColor="magenta"
                />
            </div>

            {/* Middle Section: 12-Month Revenue Trend & Sharing Types Breakdown */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Left Card (65% / 2 cols): Revenue Area Chart */}
                <SectionCard
                    title="Revenue Trend"
                    subtitle={`${new Date().getFullYear()} monthly collection performance`}
                    action={
                        <Badge tone="success" size="sm" dot dotPulse>
                            Live
                        </Badge>
                    }
                    className="lg:col-span-2"
                >
                    <div className="h-72 w-full pt-2">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                Loading revenue chart...
                            </div>
                        ) : stats?.revenueTrend && stats.revenueTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={stats.revenueTrend}
                                    margin={{ top: 10, right: 10, left: -5, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        stroke="#94A3B8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#94A3B8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={v => {
                                            if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
                                            if (v >= 1000) return `₹${(v / 1000).toFixed(0)}k`;
                                            return `₹${v}`;
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                                        labelFormatter={(label: any) => `${label} ${new Date().getFullYear()}`}
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "1px solid #E2E8F0",
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#6366F1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#purpleGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                                No revenue records available for the last 12 months.
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Right Card (35% / 1 col): Occupancy by Sharing Type */}
                <SectionCard
                    title="Occupancy by Sharing Type"
                    subtitle="Bed utilization across categories"
                    className="lg:col-span-1"
                >
                    <div className="space-y-5 py-2">
                        {isLoading ? (
                            <div className="space-y-4 py-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="space-y-2 animate-pulse">
                                        <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                                        <div className="h-2.5 bg-slate-100 rounded-full"></div>
                                    </div>
                                ))}
                            </div>
                        ) : stats?.sharingTypes && stats.sharingTypes.length > 0 ? (
                            stats.sharingTypes.map(item => (
                                <div key={item.roomTypeId} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-semibold">
                                        <span className="text-slate-700">
                                            {item.sharingTypeName || `${item.sharingCount} Sharing`}
                                        </span>
                                        <span className="text-slate-500 font-bold">
                                            {item.occupiedBeds}/{item.totalBeds} beds ({item.occupancyPercentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, item.occupancyPercentage))}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">
                                No room sharing types configured yet.
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 text-xs font-medium text-slate-500 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-indigo-600 shrink-0" />
                                <span>
                                    Avg occupancy:{" "}
                                    <strong className="text-slate-800">
                                        {stats?.occupancy?.occupancyPercentage ?? 0}%
                                    </strong>
                                </span>
                            </div>
                            <span className="text-slate-400 font-semibold">
                                {stats?.occupancy?.vacantBeds ?? 0} vacant
                            </span>
                        </div>
                    </div>
                </SectionCard>
            </div>

            {/* Bottom Section: Upcoming Dues (<= 10 days) Table */}
            <SectionCard
                title="Upcoming Dues & Pending Payments"
                subtitle="Resident dues payable within 10 days and overdue balances"
                action={
                    stats?.upcomingPayments && stats.upcomingPayments.length > 0 ? (
                        <Badge tone="warning" size="sm">
                            {stats.upcomingPayments.length} resident{stats.upcomingPayments.length > 1 ? "s" : ""}
                        </Badge>
                    ) : undefined
                }
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-left">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Customer Name</th>
                                <th className="px-4 py-3">Room & Bed</th>
                                <th className="px-4 py-3">Earliest Due Date</th>
                                <th className="px-4 py-3">Total Due Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <RefreshCw className="h-5 w-5 animate-spin text-indigo-500" />
                                            <span>Loading upcoming dues...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : stats?.upcomingPayments && stats.upcomingPayments.length > 0 ? (
                                stats.upcomingPayments.map(payment => {
                                    const targetPath = payment.billingMode === "DAILY" ? "/daily-rooms" : "/customers";
                                    const handleNavigate = () => {
                                        if (payment.customerId) {
                                            navigate(`${targetPath}?search=${encodeURIComponent(payment.customerName)}`);
                                        }
                                    };

                                    return (
                                        <tr
                                            key={payment.customerId || payment.chargeId}
                                            className="hover:bg-slate-50/70 transition cursor-pointer"
                                            onClick={handleNavigate}
                                        >
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-[11px] shrink-0 border border-indigo-100">
                                                        {payment.customerName?.charAt(0)?.toUpperCase() || "R"}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="font-semibold text-slate-900">
                                                            {payment.customerName}
                                                        </span>
                                                        {payment.billingMode === "DAILY" ? (
                                                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                                                                Daily
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-600">
                                                {payment.roomNumber ? (
                                                    <span>
                                                        Room {payment.roomNumber}
                                                        {payment.bedNumber ? ` · Bed ${payment.bedNumber}` : ""}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 text-slate-600">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                    <span>{formatDate(payment.dueDate)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-900">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                                {payment.pendingDuesCount && payment.pendingDuesCount > 1 ? (
                                                    <div className="text-[11px] text-slate-400 font-normal">
                                                        {payment.pendingDuesCount} pending charges
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge status={payment.status} />
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        handleNavigate();
                                                    }}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                                                >
                                                    View Resident →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <EmptyState
                                    isTableRow
                                    colSpan={6}
                                    icon={<Users className="h-6 w-6 text-emerald-500" />}
                                    title="No upcoming dues within 10 days"
                                    description="All resident accounts are settled and up to date."
                                />
                            )}
                        </tbody>
                    </table>
                </div>
            </SectionCard>
        </div>
    );
};
