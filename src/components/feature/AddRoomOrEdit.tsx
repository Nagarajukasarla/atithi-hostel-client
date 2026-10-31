import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/common/Modal";
import { FormInput } from "@/components/common/FormInput";
import { useToast } from "@/context/ToastContext";
import { roomService } from "@/api/roomService";
import { roomTypeService } from "@/api/roomTypeService";
import type { Room, RoomFormData, RoomState, RoomStatus, RoomType } from "@/types";
import { Bed, Sparkles, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const roomSchema = z.object({
    roomNumber: z.string().trim().min(1, "Room number is required"),
    floor: z.string().trim().min(1, "Floor is required"),
    roomTypeId: z.number({ message: "Room type is required" }).int().min(1, "Please select a room type"),
    maxCapacity: z.number({ message: "Capacity must be a number" }).int().min(1, "Capacity must be at least 1"),
    occupied: z
        .number({ message: "Occupied beds must be a number" })
        .int()
        .min(0, "Occupied beds cannot be negative")
        .optional(),
    roomState: z.enum(["CLEAN", "DIRTY"]),
    roomStatus: z.enum(["VACANT", "PARTIALLY FILLED", "FILLED"]),
    notes: z.string().optional().or(z.literal("")),
});

type RoomFormValues = z.infer<typeof roomSchema>;

export interface AddRoomOrEditProps {
    isOpen: boolean;
    onClose: () => void;
    roomToEdit?: Room | null;
    onSuccess?: (savedRoom: Room, isEdit: boolean) => void;
}

const FLOOR_PRESETS = ["Ground", "1", "2", "3", "4", "5"];

export const AddRoomOrEdit: React.FC<AddRoomOrEditProps> = ({ isOpen, onClose, roomToEdit, onSuccess }) => {
    const { toast } = useToast();
    const isEdit = Boolean(roomToEdit);

    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<RoomFormValues>({
        resolver: zodResolver(roomSchema),
        defaultValues: {
            roomNumber: "",
            floor: "1",
            roomTypeId: 0,
            maxCapacity: 2,
            occupied: 0,
            roomState: "CLEAN",
            roomStatus: "VACANT",
            notes: "",
        },
    });

    const watchedRoomTypeId = watch("roomTypeId");
    const watchedFloor = watch("floor");
    const watchedState = watch("roomState");
    const watchedStatus = watch("roomStatus");

    // Fetch room types from API whenever modal opens
    useEffect(() => {
        if (!isOpen) return;
        setIsLoadingTypes(true);
        roomTypeService
            .getRoomTypes()
            .then(res => {
                const types = Array.isArray(res.data) ? res.data : [];
                setRoomTypes(types.filter(t => t.active));
            })
            .catch(() => setRoomTypes([]))
            .finally(() => setIsLoadingTypes(false));
    }, [isOpen]);

    // Populate or reset form whenever modal opens or roomToEdit changes
    useEffect(() => {
        if (!isOpen) return;

        if (roomToEdit) {
            const initialCapacity = roomToEdit.maxCapacity || roomToEdit.capacity || 2;
            const initialOccupied = roomToEdit.occupied ?? roomToEdit.occupiedBeds ?? 0;
            reset({
                roomNumber: roomToEdit.roomNumber || "",
                floor: roomToEdit.floor || "1",
                roomTypeId: roomToEdit.roomTypeId ?? 0,
                maxCapacity: initialCapacity,
                occupied: initialOccupied,
                roomState:
                    (roomToEdit.roomState as RoomState) || (roomToEdit.cleanStatus === "DIRTY" ? "DIRTY" : "CLEAN"),
                roomStatus:
                    (roomToEdit.roomStatus as RoomStatus) ||
                    (initialOccupied === 0
                        ? "VACANT"
                        : initialOccupied >= initialCapacity
                          ? "FILLED"
                          : "PARTIALLY FILLED"),
                notes: roomToEdit.notes || "",
            });
        } else {
            reset({
                roomNumber: "",
                floor: "1",
                roomTypeId: 0,
                maxCapacity: 2,
                occupied: 0,
                roomState: "CLEAN",
                roomStatus: "VACANT",
                notes: "",
            });
        }
    }, [isOpen, roomToEdit, reset]);

    // Auto-set maxCapacity when a room type is selected
    const handleRoomTypeSelect = (roomType: RoomType) => {
        setValue("roomTypeId", roomType.id);
        setValue("maxCapacity", roomType.sharingCount);
    };

    const handleOccupiedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const occ = parseInt(e.target.value, 10) || 0;
        setValue("occupied", occ);
        const maxCap = watch("maxCapacity") || 1;
        if (occ === 0) {
            setValue("roomStatus", "VACANT");
        } else if (occ >= maxCap) {
            setValue("roomStatus", "FILLED");
        } else {
            setValue("roomStatus", "PARTIALLY FILLED");
        }
    };

    const onSubmit = async (data: RoomFormValues) => {
        try {
            const payload: RoomFormData = {
                roomNumber: data.roomNumber.trim(),
                floor: data.floor.trim(),
                roomTypeId: data.roomTypeId,
                maxCapacity: data.maxCapacity,
                occupied: data.occupied ?? 0,
                roomState: data.roomState,
                roomStatus: data.roomStatus,
                notes: data.notes?.trim() || "",
            };

            if (isEdit && roomToEdit) {
                const response = await roomService.updateRoom(roomToEdit.id, payload);
                if (response.data) {
                    toast.success(`Room ${payload.roomNumber} updated successfully.`);
                    onSuccess?.(response.data, true);
                } else {
                    toast.warning(`Room ${payload.roomNumber} updated, but no data returned.`);
                }
            } else {
                const response = await roomService.createRoom(payload);
                if (response.data) {
                    toast.success(`Room ${payload.roomNumber} created successfully on Floor ${payload.floor}!`);
                    onSuccess?.(response.data, false);
                } else {
                    toast.warning(`Room ${payload.roomNumber} created, but no data returned.`);
                }
            }

            onClose();
        } catch (err: any) {
            const errorMsg =
                err?.description || err?.message || (typeof err === "string" ? err : "Failed to save room details.");
            toast.error(errorMsg);
        }
    };

    const selectedRoomType = roomTypes.find(t => t.id === watchedRoomTypeId);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Bed className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900">
                            {isEdit ? `Edit Room ${roomToEdit?.roomNumber}` : "Add New Room"}
                        </h3>
                    </div>
                </div>
            }
            subtitle={
                isEdit
                    ? "Update room specifications, room type, bed occupancy, and housekeeping."
                    : "Configure and add a new room to the hostel inventory."
            }
            maxWidth="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Room Number & Floor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                        label="Room Number"
                        type="text"
                        placeholder="e.g. 101, 204, G-02"
                        error={errors.roomNumber?.message}
                        {...register("roomNumber")}
                        required
                    />

                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Floor <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {FLOOR_PRESETS.map(f => (
                                <button
                                    key={f}
                                    type="button"
                                    onClick={() => setValue("floor", f)}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                                        watchedFloor === f
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                                >
                                    {f === "Ground" ? "G" : `F${f}`}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Or enter custom floor..."
                            className="w-full px-3 py-2 text-xs font-medium bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
                            {...register("floor")}
                        />
                        {errors.floor && (
                            <p className="text-[11px] font-medium text-rose-500 mt-1">{errors.floor.message}</p>
                        )}
                    </div>
                </div>

                {/* Room Type Selector */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Room Type <span className="text-rose-500">*</span>
                        </label>

                        {isLoadingTypes ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                <span>Loading room types...</span>
                            </div>
                        ) : roomTypes.length === 0 ? (
                            <p className="text-[11px] font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                                No active room types found. Please create a room type in Settings first.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {roomTypes.map(rt => (
                                    <button
                                        key={rt.id}
                                        type="button"
                                        onClick={() => handleRoomTypeSelect(rt)}
                                        className={`py-2.5 px-3 text-xs font-bold rounded-xl border text-center transition ${
                                            watchedRoomTypeId === rt.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                        }`}
                                    >
                                        <span className="block text-sm font-extrabold">{rt.sharingCount}</span>
                                        <span className="block text-[10px] font-semibold opacity-80 truncate">
                                            {rt.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {errors.roomTypeId && (
                            <p className="text-[11px] font-medium text-rose-500 mt-1">{errors.roomTypeId.message}</p>
                        )}
                    </div>

                    {/* Max Capacity & Occupied Beds */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <FormInput
                            label="Max Bed Capacity"
                            type="number"
                            min={1}
                            error={errors.maxCapacity?.message}
                            {...register("maxCapacity", { valueAsNumber: true })}
                            required
                        />

                        <FormInput
                            label="Occupied Beds"
                            type="number"
                            min={0}
                            error={errors.occupied?.message}
                            {...register("occupied", { valueAsNumber: true, onChange: handleOccupiedChange })}
                        />
                    </div>

                    {selectedRoomType && (
                        <p className="text-[11px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
                            Selected: <span className="font-bold">{selectedRoomType.name}</span> —{" "}
                            {selectedRoomType.sharingCount}-Sharing
                        </p>
                    )}
                </div>

                {/* Room State (Housekeeping) & Room Status (Occupancy) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Room State */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Housekeeping State
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setValue("roomState", "CLEAN")}
                                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                                    watchedState === "CLEAN"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                <span>CLEAN</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setValue("roomState", "DIRTY")}
                                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition ${
                                    watchedState === "DIRTY"
                                        ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>DIRTY</span>
                            </button>
                        </div>
                    </div>

                    {/* Room Status */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Occupancy Status
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                type="button"
                                onClick={() => setValue("roomStatus", "VACANT")}
                                className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition ${
                                    watchedStatus === "VACANT"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                Vacant
                            </button>

                            <button
                                type="button"
                                onClick={() => setValue("roomStatus", "PARTIALLY FILLED")}
                                className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition ${
                                    watchedStatus === "PARTIALLY FILLED"
                                        ? "bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-500/20"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                Partial
                            </button>

                            <button
                                type="button"
                                onClick={() => setValue("roomStatus", "FILLED")}
                                className={`py-2 px-1 rounded-xl border text-[11px] font-bold text-center transition ${
                                    watchedStatus === "FILLED"
                                        ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                Filled
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Notes / Remarks (Optional)
                    </label>
                    <textarea
                        rows={2}
                        placeholder="e.g., Attached balcony, AC installed, window facing courtyard..."
                        className="w-full px-3 py-2 text-xs font-medium bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition resize-none"
                        {...register("notes")}
                    />
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
                    >
                        {isSubmitting ? (
                            <span>Saving...</span>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isEdit ? "Update Room" : "Save Room"}</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
