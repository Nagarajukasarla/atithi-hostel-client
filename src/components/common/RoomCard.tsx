import React from "react";
import type { Room } from "@/types";
import { Bed, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";

interface RoomCardProps {
    room: Room;
    onClick?: (room: Room) => void;
    onEdit?: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onClick, onEdit }) => {
    const baseBeds = room.sharingCount || room.maxCapacity || 0;
    const totalBeds = Math.max(room.maxCapacity ?? 0, baseBeds);

    const occupiedBeds =
        typeof room.occupied === "number"
            ? Math.min(Math.max(room.occupied, 0), totalBeds)
            : typeof room.occupiedBeds === "number"
              ? Math.min(Math.max(room.occupiedBeds, 0), totalBeds)
              : room.roomStatus === "FILLED"
                ? totalBeds
                : room.roomStatus === "VACANT"
                  ? 0
                  : 0;

    const getOccupancyStatus = () => {
        if (room.roomStatus) {
            if (room.roomStatus === "VACANT") return "Available";
            if (room.roomStatus === "FILLED") return "Full";
            return "Partially Filled";
        }
        if (occupiedBeds === 0) return "Available";
        if (occupiedBeds >= totalBeds) return "Full";
        return "Partially Filled";
    };

    const occupancy = getOccupancyStatus();

    const getCardClasses = () => {
        switch (occupancy) {
            case "Available":
                return "border-indigo-200 bg-indigo-50/30 hover:border-indigo-400 hover:shadow-md";
            case "Partially Filled":
                return "border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:shadow-md";
            case "Full":
                return "border-rose-200 bg-rose-50/20 hover:border-rose-400 hover:shadow-md";
            default:
                return "border-indigo-200/80 bg-white hover:border-indigo-400 hover:shadow-md";
        }
    };

    const effectiveCleanStatus =
        room.roomState ||
        (room.cleanStatus === "DIRTY" ? "DIRTY" : room.cleanStatus === "INSPECTED" ? "INSPECTED" : "CLEAN");

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onClick?.(room)}
            onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.(room);
                }
            }}
            aria-label={`Room ${room.roomNumber}, ${occupancy}, ${effectiveCleanStatus}`}
            className={`group relative flex flex-col items-center justify-between p-3.5 sm:p-4 min-h-[145px] sm:min-h-[160px] w-full rounded-2xl border-2 transition-all duration-200 cursor-pointer shadow-xs hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 select-none text-center ${getCardClasses()}`}
        >
            {/* Top section: Alert dot, Room Type/VIP tag & Edit button */}
            <div className="w-full flex items-center justify-between min-h-[20px]" aria-hidden="true">
                <div className="w-3 h-3 flex items-center justify-center">
                    {room.alertDot && (
                        <span className="relative flex h-2.5 w-2.5" title="Alert">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1.5">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={e => {
                                e.stopPropagation();
                                onEdit(room);
                            }}
                            title="Edit room"
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition opacity-80 group-hover:opacity-100 cursor-pointer"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <div className="text-slate-400 flex items-center gap-1">
                        {room.vipStatus ? (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-purple-600 bg-purple-100/80 border border-purple-200/80 px-1.5 py-0.5 rounded-md shadow-2xs">
                                VIP
                            </span>
                        ) : (
                            <Bed className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                        )}
                    </div>
                </div>
            </div>

            {/* Middle section: Prominent Room Number */}
            <div className="my-1 text-center">
                <h3 className="text-2xl sm:text-[28px] font-extrabold text-slate-900 tracking-tight leading-none">
                    {room.roomNumber}
                </h3>
            </div>

            {/* Bed Representation Boxes (Responsive size; standard beds solid, extra beds dotted & diagonally hatched when filled) */}
            <div
                className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 my-2 w-full max-w-[160px] sm:max-w-[200px]"
                title={`${occupiedBeds} of ${totalBeds} beds occupied${totalBeds > baseBeds ? ` (${baseBeds} Standard + ${totalBeds - baseBeds} Extra)` : ""}`}
                aria-label={`${occupiedBeds} of ${totalBeds} beds occupied`}
            >
                {Array.from({ length: totalBeds }).map((_, index) => {
                    const isFilled = index < occupiedBeds;
                    const isExtraBed = index >= baseBeds;

                    if (isExtraBed) {
                        return (
                            <span
                                key={index}
                                title={`Bed ${index + 1} (Extra Bed): ${isFilled ? "Occupied" : "Available"}`}
                                style={
                                    isFilled
                                        ? {
                                              backgroundImage:
                                                  "repeating-linear-gradient(135deg, #4f46e5 0, #4f46e5 3px, #c7d2fe 3px, #c7d2fe 6px)",
                                          }
                                        : undefined
                                }
                                className={`h-5 w-5 sm:h-6 sm:w-6 md:h-6.5 md:w-6.5 rounded-md sm:rounded-[7px] transition-all duration-200 border-2 border-dotted ${
                                    isFilled
                                        ? "border-indigo-700 shadow-xs shadow-indigo-600/25 ring-1 ring-indigo-500/30"
                                        : "border-slate-400 bg-slate-200/80 hover:border-slate-500"
                                }`}
                            />
                        );
                    }

                    return (
                        <span
                            key={index}
                            title={`Bed ${index + 1}: ${isFilled ? "Occupied" : "Available"}`}
                            className={`h-5 w-5 sm:h-6 sm:w-6 md:h-6.5 md:w-6.5 rounded-md sm:rounded-[7px] transition-all duration-200 ${
                                isFilled
                                    ? "bg-indigo-600 border border-indigo-700/60 shadow-xs shadow-indigo-600/25 ring-1 ring-indigo-500/20"
                                    : "bg-slate-200 border border-slate-300/80 hover:border-slate-400"
                            }`}
                        />
                    );
                })}
            </div>

            {/* Bottom section: Cleanliness Status Badge */}
            <div className="w-full flex items-center justify-center mt-1">
                <StatusBadge
                    status={effectiveCleanStatus}
                    className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                />
            </div>
        </div>
    );
};
