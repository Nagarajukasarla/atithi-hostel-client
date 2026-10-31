import React, { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { SearchBar } from "@/components/common/SearchBar";
import { Modal } from "@/components/common/Modal";
import { Brush, Plus, CheckCircle2, AlertCircle, RotateCw, UserCheck, Clock } from "lucide-react";

interface RoomCleanRecord {
    id: string;
    roomNumber: string;
    floor: string;
    bedCount: number;
    cleaningStatus: "Clean" | "In Progress" | "Needs Cleaning" | "Deep Clean Required";
    attendant: string;
    lastCleaned: string;
    priority: "Normal" | "High" | "Urgent";
}

const INITIAL_RECORDS: RoomCleanRecord[] = [
    {
        id: "HK-101",
        roomNumber: "101",
        floor: "Ground Floor",
        bedCount: 2,
        cleaningStatus: "Clean",
        attendant: "Mohan Lal",
        lastCleaned: "Today 11:30 AM",
        priority: "Normal",
    },
    {
        id: "HK-102",
        roomNumber: "102",
        floor: "Ground Floor",
        bedCount: 3,
        cleaningStatus: "In Progress",
        attendant: "Mohan Lal",
        lastCleaned: "Yesterday 04:00 PM",
        priority: "High",
    },
    {
        id: "HK-103",
        roomNumber: "201",
        floor: "1st Floor",
        bedCount: 2,
        cleaningStatus: "Needs Cleaning",
        attendant: "Pooja Rawat",
        lastCleaned: "Yesterday 10:00 AM",
        priority: "Urgent",
    },
    {
        id: "HK-104",
        roomNumber: "202",
        floor: "1st Floor",
        bedCount: 2,
        cleaningStatus: "Clean",
        attendant: "Pooja Rawat",
        lastCleaned: "Today 10:45 AM",
        priority: "Normal",
    },
    {
        id: "HK-105",
        roomNumber: "204",
        floor: "1st Floor",
        bedCount: 4,
        cleaningStatus: "Deep Clean Required",
        attendant: "Unassigned",
        lastCleaned: "3 days ago",
        priority: "Urgent",
    },
    {
        id: "HK-106",
        roomNumber: "301",
        floor: "2nd Floor",
        bedCount: 2,
        cleaningStatus: "Clean",
        attendant: "Dinesh Kumar",
        lastCleaned: "Today 09:15 AM",
        priority: "Normal",
    },
];

export const Housekeeping: React.FC = () => {
    const { toast } = useToast();
    const [records, setRecords] = useState<RoomCleanRecord[]>(INITIAL_RECORDS);
    const [searchTerm, setSearchTerm] = useState("");
    const [floorFilter, setFloorFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form
    const [newRoom, setNewRoom] = useState("");
    const [newFloor, setNewFloor] = useState("Ground Floor");
    const [newAttendant, setNewAttendant] = useState("Mohan Lal");
    const [newPriority, setNewPriority] = useState<RoomCleanRecord["priority"]>("High");

    const cleanCount = records.filter(r => r.cleaningStatus === "Clean").length;
    const inProgressCount = records.filter(r => r.cleaningStatus === "In Progress").length;
    const needsCleaningCount = records.filter(
        r => r.cleaningStatus === "Needs Cleaning" || r.cleaningStatus === "Deep Clean Required"
    ).length;

    const filteredRecords = records.filter(r => {
        const matchesSearch =
            r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.attendant.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFloor = floorFilter === "All" || r.floor === floorFilter;
        const matchesStatus = statusFilter === "All" || r.cleaningStatus === statusFilter;
        return matchesSearch && matchesFloor && matchesStatus;
    });

    const toggleStatus = (id: string) => {
        let updatedStatus = "";
        let roomNum = "";
        setRecords(
            records.map(r => {
                if (r.id !== id) return r;
                roomNum = r.roomNumber;
                if (r.cleaningStatus === "Clean") {
                    updatedStatus = "Needs Cleaning";
                    return { ...r, cleaningStatus: "Needs Cleaning", priority: "High" };
                }
                if (r.cleaningStatus === "Needs Cleaning") {
                    updatedStatus = "In Progress";
                    return { ...r, cleaningStatus: "In Progress" };
                }
                if (r.cleaningStatus === "In Progress" || r.cleaningStatus === "Deep Clean Required") {
                    updatedStatus = "Clean";
                    return {
                        ...r,
                        cleaningStatus: "Clean",
                        lastCleaned: "Just now",
                        priority: "Normal",
                    };
                }
                return r;
            })
        );
        if (updatedStatus) {
            toast.info(`Room ${roomNum} housekeeping status set to "${updatedStatus}".`);
        }
    };

    const handleScheduleClean = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoom) {
            toast.warning("Please specify a room number to schedule cleaning.");
            return;
        }

        const newRec: RoomCleanRecord = {
            id: `HK-${Date.now().toString().slice(-3)}`,
            roomNumber: newRoom,
            floor: newFloor,
            bedCount: 2,
            cleaningStatus: "Needs Cleaning",
            attendant: newAttendant,
            lastCleaned: "Pending",
            priority: newPriority,
        };

        setRecords([newRec, ...records]);
        setIsModalOpen(false);
        setNewRoom("");
        toast.success(`Cleaning task scheduled for Room ${newRoom} (${newFloor}).`);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader
                title="Housekeeping & Sanitization"
                description="Manage room cleaning status, bed turnover logs, and attendant cleaning assignments."
                action={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition"
                    >
                        <Plus className="h-4 w-4" />
                        <span>+ Schedule Cleaning</span>
                    </button>
                }
            />

            {/* Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticsCard
                    title="Clean & Ready"
                    value={cleanCount}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    badgeColor="emerald"
                    description="Sanitized and inspected rooms"
                />
                <StatisticsCard
                    title="In Progress"
                    value={inProgressCount}
                    icon={<RotateCw className="h-5 w-5" />}
                    badgeColor="indigo"
                    description="Currently being serviced"
                />
                <StatisticsCard
                    title="Action Required"
                    value={needsCleaningCount}
                    icon={<AlertCircle className="h-5 w-5" />}
                    badgeColor="magenta"
                    description="Pending clean or deep sanitization"
                />
                <StatisticsCard
                    title="Staff On Duty"
                    value="3 Attendants"
                    icon={<UserCheck className="h-5 w-5" />}
                    badgeColor="cyan"
                    description="Mohan, Pooja & Dinesh"
                />
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="w-full sm:max-w-md">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by room number or attendant..."
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <select
                        value={floorFilter}
                        onChange={e => setFloorFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
                    >
                        <option value="All">All Floors</option>
                        <option value="Ground Floor">Ground Floor</option>
                        <option value="1st Floor">1st Floor</option>
                        <option value="2nd Floor">2nd Floor</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Clean">Clean</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Needs Cleaning">Needs Cleaning</option>
                        <option value="Deep Clean Required">Deep Clean</option>
                    </select>
                </div>
            </div>

            {/* Housekeeping Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                            <tr>
                                <th className="px-5 py-3.5">Room & Floor</th>
                                <th className="px-5 py-3.5">Beds</th>
                                <th className="px-5 py-3.5">Assigned Attendant</th>
                                <th className="px-5 py-3.5">Last Sanitized</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Priority</th>
                                <th className="px-5 py-3.5 text-right">Quick Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {filteredRecords.map(rec => (
                                <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                                    <td className="px-5 py-4">
                                        <div className="font-bold text-slate-900 text-sm">Room {rec.roomNumber}</div>
                                        <div className="text-xs text-slate-400 font-medium">{rec.floor}</div>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-slate-700">{rec.bedCount} Beds</td>
                                    <td className="px-5 py-4">
                                        <span className="font-semibold text-slate-800">{rec.attendant}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{rec.lastCleaned}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                rec.cleaningStatus === "Clean"
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : rec.cleaningStatus === "In Progress"
                                                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                      : rec.cleaningStatus === "Deep Clean Required"
                                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                            }`}
                                        >
                                            {rec.cleaningStatus}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                                rec.priority === "Urgent"
                                                    ? "bg-rose-100 text-rose-800"
                                                    : rec.priority === "High"
                                                      ? "bg-amber-100 text-amber-800"
                                                      : "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {rec.priority}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button
                                            onClick={() => toggleStatus(rec.id)}
                                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                                                rec.cleaningStatus === "Clean"
                                                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                            }`}
                                        >
                                            {rec.cleaningStatus === "Clean"
                                                ? "Mark Dirty"
                                                : rec.cleaningStatus === "In Progress"
                                                  ? "Mark Cleaned"
                                                  : "Start Cleaning"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Schedule Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <span className="flex items-center gap-2">
                        <Brush className="h-5 w-5 text-indigo-600" />
                        Schedule Room Cleaning
                    </span>
                }
                maxWidth="md"
            >
                <form onSubmit={handleScheduleClean} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">Room Number *</label>
                        <input
                            type="text"
                            required
                            value={newRoom}
                            onChange={e => setNewRoom(e.target.value)}
                            placeholder="e.g. 203"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Floor</label>
                            <select
                                value={newFloor}
                                onChange={e => setNewFloor(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            >
                                <option value="Ground Floor">Ground Floor</option>
                                <option value="1st Floor">1st Floor</option>
                                <option value="2nd Floor">2nd Floor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Assign Attendant</label>
                            <select
                                value={newAttendant}
                                onChange={e => setNewAttendant(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            >
                                <option value="Mohan Lal">Mohan Lal</option>
                                <option value="Pooja Rawat">Pooja Rawat</option>
                                <option value="Dinesh Kumar">Dinesh Kumar</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                        <select
                            value={newPriority}
                            onChange={e => setNewPriority(e.target.value as RoomCleanRecord["priority"])}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent (Guest Arriving)</option>
                        </select>
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
                            Assign Cleaning
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
