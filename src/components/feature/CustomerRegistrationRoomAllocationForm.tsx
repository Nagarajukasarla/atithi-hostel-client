import React from "react";
import type { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { FormInput } from "@/components/common/FormInput";
import { FormSelect } from "@/components/common/FormSelect";
import { FormDatePicker } from "@/components/common/FormDatePicker";
import type { Room, RoomAllocation } from "@/types";

interface CustomerRegistrationRoomAllocationFormProps {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    setValue: UseFormSetValue<any>;
    watchedFloor: string;
    watchedRoom: string;
    selectedFloorRooms: Room[];
    floorOptions: { value: string; label: string }[];
    onRoomSelect?: (room: Room) => void;
    activeAllocation?: RoomAllocation | null;
}

export const CustomerRegistrationRoomAllocationForm: React.FC<CustomerRegistrationRoomAllocationFormProps> = ({
    register,
    errors,
    setValue,
    watchedFloor,
    watchedRoom,
    selectedFloorRooms,
    floorOptions,
    onRoomSelect,
    activeAllocation,
}) => {
    // Determine bed options based on the currently selected room's capacity
    const selectedRoomObj = selectedFloorRooms.find(r => r.roomNumber === watchedRoom);
    const bedCount = selectedRoomObj
        ? Math.max(selectedRoomObj.maxCapacity ?? 0, selectedRoomObj.sharing ?? selectedRoomObj.sharingCount ?? 0, selectedRoomObj.capacity ?? 0, 1)
        : 4;

    const bedOptions = [
        { value: "", label: "Select Bed (Optional)" },
        ...Array.from({ length: bedCount }, (_, i) => {
            const letter = String.fromCharCode(65 + i);
            return { value: letter, label: `Bed ${letter}` };
        }),
    ];

    return (
        <div className="space-y-5">
            {activeAllocation && (
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3 shadow-2xs">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                        <p className="font-bold">Resident Already Allocated</p>
                        <p className="mt-0.5 text-amber-800 leading-relaxed">
                            This resident is currently assigned to{" "}
                            <strong>Room {activeAllocation.roomNumber || activeAllocation.roomId}</strong>
                            {activeAllocation.bedNumber ? ` (Bed ${activeAllocation.bedNumber})` : ""}. A resident
                            cannot hold multiple active room allocations in the hostel. Please vacate or end their
                            existing allocation first.
                        </p>
                    </div>
                </div>
            )}
            <div className="grid gap-5 sm:grid-cols-3">
                <FormSelect
                    label="Floor Selection"
                    options={
                        floorOptions.length > 0
                            ? floorOptions
                            : [{ value: watchedFloor || "1", label: `Floor ${watchedFloor || "1"}` }]
                    }
                    error={errors.floor?.message as string}
                    {...register("floor")}
                    required
                />

                <FormInput
                    label="Selected Room"
                    type="text"
                    placeholder="Select a room from grid below"
                    error={errors.roomNumber?.message as string}
                    {...register("roomNumber")}
                    readOnly
                    required
                />

                <FormSelect
                    label="Bed Number (Optional)"
                    options={bedOptions}
                    error={errors.bedNumber?.message as string}
                    {...register("bedNumber")}
                />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <FormDatePicker
                    label="Check-in / Joining Date"
                    error={errors.joinDate?.message as string}
                    {...register("joinDate")}
                    required
                />

                <FormDatePicker
                    label="Planned Check-out Date (Optional)"
                    error={errors.checkOutDate?.message as string}
                    {...register("checkOutDate")}
                />
            </div>

            {/* Grid Map */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Floor {watchedFloor} Room Contribution Grid Map:
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                        {selectedFloorRooms.length} {selectedFloorRooms.length === 1 ? "room" : "rooms"} found
                    </span>
                </div>

                {selectedFloorRooms.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white/70">
                        No rooms configured for Floor {watchedFloor}. Add rooms in the Rooms section or select a
                        different floor.
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2.5">
                        {selectedFloorRooms.map(room => {
                            const baseBeds = room.sharing ?? room.sharingCount ?? room.capacity ?? 1;
                            const totalBeds = Math.max(room.maxCapacity ?? 0, room.capacity ?? 0, baseBeds);
                            const occupiedBeds =
                                typeof room.occupied === "number"
                                    ? room.occupied
                                    : typeof room.occupiedBeds === "number"
                                      ? room.occupiedBeds
                                      : 0;

                            const isFull = occupiedBeds >= totalBeds || room.roomStatus === "FILLED";
                            const isPartiallyFilled =
                                !isFull && (occupiedBeds > 0 || room.roomStatus === "PARTIALLY FILLED");
                            const isSelected = watchedRoom === room.roomNumber;

                            let colorClasses =
                                "border-indigo-200 bg-indigo-50/40 text-indigo-900 hover:border-indigo-400 hover:bg-indigo-50/80";
                            if (isFull) {
                                colorClasses =
                                    "border-rose-200 bg-rose-50/30 text-rose-700 opacity-60 cursor-not-allowed";
                            } else if (isPartiallyFilled) {
                                colorClasses =
                                    "border-amber-200 bg-amber-50/40 text-amber-900 hover:border-amber-400 hover:bg-amber-50/80";
                            }

                            if (isSelected) {
                                colorClasses =
                                    "border-indigo-600 bg-indigo-600 text-white shadow-md ring-4 ring-indigo-500/25 scale-105";
                            }

                            return (
                                <button
                                    key={room.id}
                                    type="button"
                                    disabled={isFull}
                                    onClick={() => {
                                        setValue("roomNumber", room.roomNumber, { shouldValidate: true });
                                        if (room.monthlyRent) {
                                            setValue("monthlyRent", room.monthlyRent);
                                        }
                                        onRoomSelect?.(room);
                                    }}
                                    className={`flex flex-col items-center justify-center h-16 w-16 text-center text-xs font-bold rounded-xl border-2 transition shadow-2xs ${colorClasses}`}
                                    title={`Room ${room.roomNumber}: ${occupiedBeds}/${totalBeds} beds occupied`}
                                >
                                    <span className="leading-tight">{room.roomNumber}</span>
                                    <span
                                        className={`text-[9px] mt-0.5 font-medium ${isSelected ? "text-indigo-100" : "opacity-80"}`}
                                    >
                                        {occupiedBeds}/{totalBeds} beds
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Legend matching RoomCard tokens */}
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold mt-4 pt-3 border-t border-slate-200/80">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-2xs"></span>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs"></span>
                        <span>Partially Filled</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs"></span>
                        <span>Full</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
