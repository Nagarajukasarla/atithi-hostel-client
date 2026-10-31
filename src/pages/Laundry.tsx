import React, { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { SearchBar } from "@/components/common/SearchBar";
import { Modal } from "@/components/common/Modal";
import { Shirt, Plus, Clock, CheckCircle2, RotateCw, Sparkles } from "lucide-react";

interface LaundryOrder {
    id: string;
    guestName: string;
    roomNumber: string;
    clothesCount: number;
    serviceType: "Wash & Fold" | "Wash & Iron" | "Dry Cleaning" | "Linen Wash";
    receivedDate: string;
    deliveryDate: string;
    status: "In Wash" | "Drying & Press" | "Ready" | "Delivered";
    isExpress: boolean;
    cost: number;
}

const INITIAL_ORDERS: LaundryOrder[] = [
    {
        id: "LND-501",
        guestName: "Sunil Bhatt",
        roomNumber: "102",
        clothesCount: 8,
        serviceType: "Wash & Iron",
        receivedDate: "2026-06-13 09:00",
        deliveryDate: "2026-06-14 18:00",
        status: "In Wash",
        isExpress: false,
        cost: 240,
    },
    {
        id: "LND-502",
        guestName: "Meera Kapoor",
        roomNumber: "205",
        clothesCount: 4,
        serviceType: "Dry Cleaning",
        receivedDate: "2026-06-13 10:30",
        deliveryDate: "2026-06-13 20:00",
        status: "Drying & Press",
        isExpress: true,
        cost: 380,
    },
    {
        id: "LND-503",
        guestName: "Hostel Block A Linen",
        roomNumber: "Linen Store",
        clothesCount: 32,
        serviceType: "Linen Wash",
        receivedDate: "2026-06-12 14:00",
        deliveryDate: "2026-06-13 12:00",
        status: "Ready",
        isExpress: false,
        cost: 650,
    },
    {
        id: "LND-504",
        guestName: "Rohan Deshmukh",
        roomNumber: "107",
        clothesCount: 6,
        serviceType: "Wash & Fold",
        receivedDate: "2026-06-12 08:00",
        deliveryDate: "2026-06-12 21:00",
        status: "Delivered",
        isExpress: false,
        cost: 150,
    },
];

export const Laundry: React.FC = () => {
    const { toast } = useToast();
    const [orders, setOrders] = useState<LaundryOrder[]>(INITIAL_ORDERS);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "In Wash" | "Drying & Press" | "Ready" | "Delivered">(
        "All"
    );
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form
    const [guestName, setGuestName] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [clothesCount, setClothesCount] = useState(5);
    const [serviceType, setServiceType] = useState<LaundryOrder["serviceType"]>("Wash & Iron");
    const [isExpress, setIsExpress] = useState(false);

    // Stats
    const activeInWash = orders.filter(o => o.status === "In Wash").length;
    const readyOrders = orders.filter(o => o.status === "Ready").length;
    const deliveredCount = orders.filter(o => o.status === "Delivered").length;

    const filteredOrders = orders.filter(o => {
        const matchesSearch =
            o.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "All" || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName || !roomNumber) {
            toast.warning("Please provide guest name and room number.");
            return;
        }

        const newOrder: LaundryOrder = {
            id: `LND-${Date.now().toString().slice(-3)}`,
            guestName,
            roomNumber,
            clothesCount: Number(clothesCount),
            serviceType,
            receivedDate: "2026-06-13 14:00",
            deliveryDate: isExpress ? "2026-06-13 22:00" : "2026-06-14 18:00",
            status: "In Wash",
            isExpress,
            cost: Number(clothesCount) * 35 + (isExpress ? 100 : 0),
        };

        setOrders([newOrder, ...orders]);
        setIsModalOpen(false);
        setGuestName("");
        setRoomNumber("");
        setIsExpress(false);
        toast.success(`Laundry order ${newOrder.id} for "${guestName}" created.`);
    };

    const updateOrderStatus = (id: string, newStatus: LaundryOrder["status"]) => {
        setOrders(orders.map(o => (o.id === id ? { ...o, status: newStatus } : o)));
        toast.info(`Order ${id} status updated to ${newStatus}.`);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader
                title="Laundry & Linen Service"
                description="Manage guest laundry requests, linen hygiene wash cycles, and garment turnaround."
                action={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition"
                    >
                        <Plus className="h-4 w-4" />
                        <span>+ New Laundry Order</span>
                    </button>
                }
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticsCard
                    title="In Washing / Drying"
                    value={activeInWash}
                    icon={<RotateCw className="h-5 w-5" />}
                    badgeColor="indigo"
                    description="Currently running cycles"
                />
                <StatisticsCard
                    title="Ready for Pickup"
                    value={readyOrders}
                    icon={<Shirt className="h-5 w-5" />}
                    badgeColor="emerald"
                    description="Packaged & tagged for guests"
                />
                <StatisticsCard
                    title="Delivered Today"
                    value={deliveredCount}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    badgeColor="cyan"
                    description="Completed laundry orders"
                />
                <StatisticsCard
                    title="Active Bags"
                    value={orders.length}
                    icon={<Sparkles className="h-5 w-5" />}
                    badgeColor="purple"
                    description="Total laundry tracking count"
                />
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="w-full sm:max-w-md">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by order ID, guest, or room..."
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(["All", "In Wash", "Drying & Press", "Ready", "Delivered"] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                                statusFilter === filter
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                            <tr>
                                <th className="px-5 py-3.5">Order ID & Guest</th>
                                <th className="px-5 py-3.5">Room</th>
                                <th className="px-5 py-3.5">Clothes & Type</th>
                                <th className="px-5 py-3.5">Expected Ready</th>
                                <th className="px-5 py-3.5">Cost</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50/70 transition">
                                    <td className="px-5 py-4">
                                        <div className="font-bold text-slate-900">{order.guestName}</div>
                                        <div className="flex items-center gap-2 text-slate-400 text-xs mt-0.5">
                                            <span className="font-mono">{order.id}</span>
                                            {order.isExpress && (
                                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                                                    EXPRESS
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-slate-800">{order.roomNumber}</td>
                                    <td className="px-5 py-4">
                                        <span className="font-bold text-slate-900">{order.clothesCount} pcs</span>
                                        <div className="text-xs text-slate-500">{order.serviceType}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{order.deliveryDate}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 font-bold text-slate-900">₹{order.cost}</td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                order.status === "Ready"
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : order.status === "In Wash"
                                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                      : order.status === "Drying & Press"
                                                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                        : "bg-slate-100 text-slate-600 border border-slate-200"
                                            }`}
                                        >
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        {order.status === "In Wash" && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "Drying & Press")}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
                                            >
                                                Move to Press
                                            </button>
                                        )}
                                        {order.status === "Drying & Press" && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "Ready")}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                            >
                                                Mark Ready
                                            </button>
                                        )}
                                        {order.status === "Ready" && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "Delivered")}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition"
                                            >
                                                Handover
                                            </button>
                                        )}
                                        {order.status === "Delivered" && (
                                            <span className="text-xs text-slate-400 font-semibold">Done</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Order Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <span className="flex items-center gap-2">
                        <Shirt className="h-5 w-5 text-indigo-600" />
                        Add Laundry Order
                    </span>
                }
                maxWidth="md"
            >
                <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">Guest Name *</label>
                        <input
                            type="text"
                            required
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            placeholder="e.g. Sunil Bhatt"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Room No. *</label>
                            <input
                                type="text"
                                required
                                value={roomNumber}
                                onChange={e => setRoomNumber(e.target.value)}
                                placeholder="e.g. 102"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Number of Pieces</label>
                            <input
                                type="number"
                                min="1"
                                value={clothesCount}
                                onChange={e => setClothesCount(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">Service Type</label>
                        <select
                            value={serviceType}
                            onChange={e => setServiceType(e.target.value as LaundryOrder["serviceType"])}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                            <option value="Wash & Fold">Wash & Fold (₹25/pc)</option>
                            <option value="Wash & Iron">Wash & Iron (₹35/pc)</option>
                            <option value="Dry Cleaning">Dry Cleaning (₹80/pc)</option>
                            <option value="Linen Wash">Hostel Linen Wash</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="expressOrder"
                            checked={isExpress}
                            onChange={e => setIsExpress(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="expressOrder" className="font-semibold text-slate-700 cursor-pointer">
                            Express Turnaround (+₹100, Ready in 6 Hours)
                        </label>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20"
                        >
                            Accept Order
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
