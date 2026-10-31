import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
    X,
    Edit2,
    Trash2,
    Bed,
    Users,
    Phone,
    Sparkles,
    AlertCircle,
    Loader2,
    FileText,
    CheckCircle2,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { roomService } from "@/api/roomService";
import { roomAllocationService } from "@/api/roomAllocationService";
import { paymentService } from "@/api/paymentService";
import { Badge, type BadgeTone } from "@/components/common/Badge";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import type { Room, RoomAllocation } from "@/types";

export interface AssignedResident {
    id: string | number;
    allocationId?: number;
    customerId?: number;
    fullName: string;
    mobileNumber: string;
    bedNumber?: string;
    dueAmount: number;
    isPaid: boolean;
    checkInDate?: string;
}

export interface RoomDetailsDrawerProps {
    room: Room | null;
    isOpen: boolean;
    onClose: () => void;
    onEditRoom?: (room: Room) => void;
    onDeleteRoom?: (roomId: string | number) => void;
    onRoomUpdated?: (updatedRoom: Room) => void;
}

export const RoomDetailsDrawer: React.FC<RoomDetailsDrawerProps> = ({
    room,
    isOpen,
    onClose,
    onEditRoom,
    onDeleteRoom,
    onRoomUpdated,
}) => {
    const { toast } = useToast();
    const [isTogglingClean, setIsTogglingClean] = useState<boolean>(false);
    const [assignedResidents, setAssignedResidents] = useState<AssignedResident[]>([]);
    const [isLoadingResidents, setIsLoadingResidents] = useState<boolean>(false);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Fetch active room allocations and payment status directly from the DB
    const fetchResidentsFromDb = useCallback(async () => {
        if (!isOpen || !room?.id) {
            setAssignedResidents([]);
            return;
        }

        setIsLoadingResidents(true);
        try {
            const response = await roomAllocationService.getActiveAllocationsByRoom(room.id);
            const allocations: RoomAllocation[] = Array.isArray(response.data)
                ? response.data
                : response.data && Array.isArray((response.data as any).data)
                  ? (response.data as any).data
                  : [];

            // For each DB allocation, retrieve payment info for due amount calculation
            const residentList: AssignedResident[] = await Promise.all(
                allocations.map(async (alloc): Promise<AssignedResident> => {
                    let dueAmount = 0;
                    let isPaid = false;

                    if (alloc.customerId) {
                        try {
                            const payRes = await paymentService.getPaymentsByCustomer(alloc.customerId);
                            const payments = Array.isArray(payRes.data)
                                ? payRes.data
                                : payRes.data && Array.isArray((payRes.data as any).data)
                                  ? (payRes.data as any).data
                                  : [];

                            const pendingPayments = payments.filter((p: any) => p.paymentStatus === "PENDING");
                            const successPayments = payments.filter((p: any) => p.paymentStatus === "SUCCESS");

                            if (pendingPayments.length > 0) {
                                dueAmount = pendingPayments.reduce(
                                    (sum: number, p: any) => sum + (Number(p.amount) || 0),
                                    0
                                );
                            } else if (successPayments.length > 0) {
                                isPaid = true;
                            }
                        } catch {
                            // Payment query optional fallback
                        }
                    }



                    return {
                        id: alloc.id || `alloc-${alloc.customerId}-${alloc.bedNumber || "bed"}`,
                        allocationId: alloc.id,
                        customerId: alloc.customerId,
                        fullName: alloc.customerName || "Resident",
                        mobileNumber: alloc.customerMobile || "No contact number",
                        bedNumber: alloc.bedNumber || undefined,
                        dueAmount,
                        isPaid: isPaid || dueAmount === 0,
                        checkInDate: alloc.checkInDate,
                    };
                })
            );

            setAssignedResidents(residentList);
        } catch (err) {
            console.error("Failed to fetch room allocations from DB:", err);
            setAssignedResidents([]);
        } finally {
            setIsLoadingResidents(false);
        }
    }, [isOpen, room?.id]);

    useEffect(() => {
        fetchResidentsFromDb();
    }, [fetchResidentsFromDb]);

    if (!isOpen || !room) return null;

    const isClean = (room.roomState || room.cleanStatus) === "CLEAN";

    const handleToggleCleanStatus = async () => {
        if (!room.id) {
            toast.error("Unable to update room: Room ID is missing.");
            return;
        }

        setIsTogglingClean(true);
        try {
            const response = await roomService.toggleRoomCleanStatus(room.id);
            if (response.isSuccess && response.data) {
                const updated = response.data;
                onRoomUpdated?.(updated);
                const nextState = updated.roomState || (isClean ? "DIRTY" : "CLEAN");
                toast.success(`Room ${room.roomNumber} marked as ${nextState}.`);
            } else {
                toast.error(response.errorMessage || "Failed to update cleanliness status.");
            }
        } catch (err: any) {
            const msg = err?.description || err?.message || "Failed to update cleanliness status.";
            toast.error(msg);
        } finally {
            setIsTogglingClean(false);
        }
    };

    const formatLastCleaned = (dateStr?: string | null) => {
        if (!dateStr) return "Not yet recorded";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const capacity = room.maxCapacity || room.capacity || room.sharingCount || 2;
    const occupiedCount =
        !isLoadingResidents && assignedResidents.length > 0
            ? assignedResidents.length
            : (room.occupied ?? room.occupiedBeds ?? 0);
    const availableCount = Math.max(0, capacity - occupiedCount);

    const getOccupancyInfo = (): { label: string; tone: BadgeTone } => {
        const status =
            room.roomStatus ||
            (occupiedCount === 0 ? "VACANT" : occupiedCount >= capacity ? "FILLED" : "PARTIALLY FILLED");
        switch (status) {
            case "VACANT":
                return { label: "Vacant / Available", tone: "success" };
            case "PARTIALLY FILLED":
                return { label: "Partially Filled", tone: "warning" };
            case "FILLED":
                return { label: "Fully Occupied", tone: "danger" };
            default:
                return { label: status, tone: "neutral" };
        }
    };

    const occupancyInfo = getOccupancyInfo();

    return createPortal(
        <div
            className="fixed inset-0 z-50 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={`Room ${room.roomNumber} Details`}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Slide-over drawer container: pl-0 on mobile, pl-10 on sm+ */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
                <aside className="w-screen sm:w-[420px] max-w-full bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                                <Bed className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                                    Room {room.roomNumber} Details
                                </h2>
                                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5 truncate">
                                    Floor {room.floor} • {room.sharingCount || capacity}-Sharing Room
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close details"
                            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
                        {/* Interactive Cleanliness Toggle Card */}
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Room Cleanliness State
                                    </h3>
                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                        Toggle switch to update housekeeping condition
                                    </p>
                                </div>
                                {isTogglingClean && (
                                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                                )}
                            </div>

                            {/* Cleanliness Toggle Switch & Status Badge */}
                            <div className="flex items-center justify-between gap-3 pt-1">
                                <div>
                                    {isClean ? (
                                        <Badge tone="success" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
                                            Clean
                                        </Badge>
                                    ) : (
                                        <Badge tone="danger" size="sm" icon={<AlertCircle className="w-3.5 h-3.5" />}>
                                            Dirty / Needs Cleaning
                                        </Badge>
                                    )}
                                </div>

                                {/* Reusable Stateful Toggle Switch */}
                                <ToggleSwitch
                                    checked={isClean}
                                    onChange={handleToggleCleanStatus}
                                    disabled={isTogglingClean}
                                    size="lg"
                                    variant="stateful"
                                    title={`Click to mark as ${isClean ? "Dirty" : "Clean"}`}
                                    aria-label="Toggle cleanliness status"
                                />
                            </div>

                            {/* Last Cleaned Timestamp */}
                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                                <span className="font-medium">Last Cleaned</span>
                                <span className="font-semibold text-slate-700 text-right">
                                    {formatLastCleaned(room.lastCleaned)}
                                </span>
                            </div>
                        </div>

                        {/* Room Specifications & Occupancy */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 space-y-3.5 shadow-xs">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Room Configuration
                                </h3>
                                <Badge tone={occupancyInfo.tone} size="sm">
                                    {occupancyInfo.label}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100/80">
                                    <span className="text-slate-400 font-medium block text-[11px]">Floor Level</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">
                                        Floor {room.floor}
                                    </span>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100/80">
                                    <span className="text-slate-400 font-medium block text-[11px]">Sharing Type</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">
                                        {room.sharingCount || capacity}-Sharing
                                    </span>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100/80">
                                    <span className="text-slate-400 font-medium block text-[11px]">Occupied Beds</span>
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">
                                        {occupiedCount} Beds
                                    </span>
                                </div>
                                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100/80">
                                    <span className="text-slate-400 font-medium block text-[11px]">Available Beds</span>
                                    <span className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5 block">
                                        {availableCount} Available
                                    </span>
                                </div>
                            </div>

                            {/* Room Notes (if available) */}
                            {room.notes && (
                                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-700 space-y-1">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span>Notes & Remarks</span>
                                    </div>
                                    <p className="text-slate-600 font-medium leading-relaxed pl-5">{room.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Assigned Guests Section */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-slate-500" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Assigned Residents ({isLoadingResidents ? "..." : assignedResidents.length})
                                    </h3>
                                </div>
                                <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                                    {isLoadingResidents
                                        ? "Loading..."
                                        : `${assignedResidents.length}/${capacity} Assigned`}
                                </span>
                            </div>

                            {isLoadingResidents ? (
                                <div className="flex items-center justify-center py-6 gap-2 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                                    <span className="text-xs font-medium text-slate-500">
                                        Fetching residents from database...
                                    </span>
                                </div>
                            ) : assignedResidents.length > 0 ? (
                                <div className="space-y-2">
                                    {assignedResidents.map(resident => (
                                        <div
                                            key={resident.id}
                                            className="flex items-center justify-between gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors shadow-2xs"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-100 shrink-0">
                                                    {(resident.fullName || "Resident")
                                                        .split(" ")
                                                        .map(n => n[0])
                                                        .slice(0, 2)
                                                        .join("")
                                                        .toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">
                                                        {resident.fullName}
                                                    </h4>
                                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium mt-0.5">
                                                        <span className="flex items-center gap-1 whitespace-nowrap">
                                                            <Phone className="w-3 h-3 text-slate-400" />
                                                            {resident.mobileNumber}
                                                        </span>
                                                        {resident.bedNumber && (
                                                            <span className="font-semibold text-slate-700 whitespace-nowrap">
                                                                • Bed {resident.bedNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0">
                                                {resident.dueAmount > 0 ? (
                                                    <Badge tone="warning" size="xs">
                                                        ₹{resident.dueAmount} Due
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        tone="success"
                                                        size="xs"
                                                        icon={<CheckCircle2 className="w-3 h-3" />}
                                                    >
                                                        Paid
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center bg-slate-50/50">
                                    <Users className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                                    <p className="text-xs font-bold text-slate-700">No guests assigned</p>
                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                        This room currently has no registered residents allocated.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50/70 flex items-center gap-2.5 sm:gap-3">
                        {onEditRoom && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEditRoom(room);
                                }}
                                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-3 rounded-xl border border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100/70 text-xs font-bold transition shadow-2xs cursor-pointer"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Room</span>
                            </button>
                        )}
                        {onDeleteRoom && (
                            <button
                                type="button"
                                onClick={() => onDeleteRoom(room.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-3 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100/70 text-xs font-bold transition shadow-2xs cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Room</span>
                            </button>
                        )}
                    </div>
                </aside>
            </div>
        </div>,
        document.body
    );
};
