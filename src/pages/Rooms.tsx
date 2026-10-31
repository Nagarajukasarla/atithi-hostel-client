import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { RoomCard } from "@/components/common/RoomCard";
import { SearchBar } from "@/components/common/SearchBar";
import { EmptyState } from "@/components/common/EmptyState";
import { AddRoomOrEdit } from "@/components/feature/AddRoomOrEdit";
import { RoomDetailsDrawer } from "@/components/feature/RoomDetailsDrawer";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { roomService } from "@/api/roomService";
import type { Room } from "@/types";
import { Plus, Layers, Loader2 } from "lucide-react";

export const Rooms: React.FC = () => {
    const { toast } = useToast();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedFloor, setSelectedFloor] = useState<string>("All");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);

    // Room Details Drawer state
    const [selectedRoomForDrawer, setSelectedRoomForDrawer] = useState<Room | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

    // Delete confirmation state
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);

    const fetchRooms = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await roomService.getRooms();
            if (response && Array.isArray(response.data)) {
                setRooms(response.data);
            } else {
                setRooms([]);
                if (response && response.code >= 400 && response.description) {
                    toast.error(response.description);
                }
            }
        } catch (err: any) {
            setRooms([]);
            const msg = err?.description || err?.message || "Failed to fetch rooms from server.";
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleOpenAddModal = () => {
        setRoomToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (room: Room) => {
        setRoomToEdit(room);
        setIsModalOpen(true);
    };

    const handleOpenDrawer = (room: Room) => {
        setSelectedRoomForDrawer(room);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedRoomForDrawer(null);
    };

    const handleRoomUpdated = (updatedRoom: Room) => {
        setRooms(prev => {
            const list = Array.isArray(prev) ? prev : [];
            return list.map(r => (r.id === updatedRoom.id ? updatedRoom : r));
        });
        setSelectedRoomForDrawer(updatedRoom);
        fetchRooms();
    };

    const handleRequestDeleteRoom = (roomId: string | number) => {
        const target = rooms.find(r => r.id === roomId) || selectedRoomForDrawer;
        if (!target) return;
        setRoomToDelete(target);
        setIsConfirmDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!roomToDelete || !roomToDelete.id) return;
        try {
            const res = await roomService.deleteRoom(roomToDelete.id);
            if (res.isError) {
                toast.error(res.errorMessage || "Failed to delete room.");
                return;
            }
            setRooms(prev => prev.filter(r => r.id !== roomToDelete.id));
            toast.success(`Room ${roomToDelete.roomNumber} deleted successfully.`);
            setIsConfirmDeleteOpen(false);
            setRoomToDelete(null);
            handleCloseDrawer();
            fetchRooms();
        } catch (err: any) {
            const msg = err?.description || err?.message || "Failed to delete room.";
            toast.error(msg);
        }
    };

    const handleSuccessSave = (savedRoom: Room, isEdit: boolean) => {
        setRooms(prev => {
            const list = Array.isArray(prev) ? prev : [];
            if (isEdit) {
                return list.map(r => (r.id === savedRoom.id ? savedRoom : r));
            } else {
                return [savedRoom, ...list];
            }
        });
        if (selectedRoomForDrawer && selectedRoomForDrawer.id === savedRoom.id) {
            setSelectedRoomForDrawer(savedRoom);
        }
        fetchRooms();
    };

    const roomList = Array.isArray(rooms) ? rooms : [];

    // Filter Rooms based on search and floor
    const filteredRooms = roomList.filter(room => {
        const matchesSearch =
            (room.roomNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (room.notes && room.notes.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFloor = selectedFloor === "All" || room.floor === selectedFloor;
        return Boolean(matchesSearch && matchesFloor);
    });

    // Extract unique floors
    const floors = ["All", ...Array.from(new Set(roomList.map(r => r.floor).filter(Boolean))).sort()];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader
                title="Rooms & Inventory"
                description="Monitor cleanliness, sharing configuration, and room allocations across all floors."
                action={
                    <button
                        onClick={handleOpenAddModal}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 focus:outline-none cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>+ Add Room</span>
                    </button>
                }
            />

            {/* Search and Filters Bar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by room number or notes..."
                />

                {/* Floor Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 self-start sm:self-auto">
                    {floors.map(floor => (
                        <button
                            key={floor}
                            onClick={() => setSelectedFloor(floor)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                selectedFloor === floor
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/60"
                            }`}
                        >
                            {floor === "All" ? "All Floors" : `Floor ${floor}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend indicator */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 bg-white px-6 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
                <span className="font-bold text-slate-900">Occupancy Legend:</span>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                    <span>Available / Vacant</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span>Partially Filled</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <span>Full / Filled</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto text-slate-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Click room card to view details & toggle cleanliness • Click pencil to edit</span>
                </div>
            </div>

            {/* Grid of Room Cards or Empty State */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Loading hostel rooms...</p>
                </div>
            ) : filteredRooms.length > 0 ? (
                <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {filteredRooms.map((room, index) => (
                        <RoomCard
                            key={room.id ?? `room-${room.roomNumber}-${index}`}
                            room={room}
                            onClick={() => handleOpenDrawer(room)}
                            onEdit={handleOpenEditModal}
                        />
                    ))}
                </div>
            ) : roomList.length === 0 ? (
                <EmptyState
                    variant="banner"
                    title="No rooms found in hostel"
                    description="No rooms exist in the database yet. Click '+ Add Room' to create your first room and configure floor and bed sharing."
                    action={{
                        label: "+ Add First Room",
                        onClick: handleOpenAddModal,
                        icon: <Plus className="w-4 h-4" />,
                    }}
                />
            ) : (
                <EmptyState
                    variant="banner"
                    title="No matching rooms"
                    description={`No rooms match your filter on Floor "${selectedFloor}" with search "${searchTerm}". Try resetting your filters.`}
                    action={{
                        label: "Clear Filters",
                        onClick: () => {
                            setSearchTerm("");
                            setSelectedFloor("All");
                        },
                    }}
                />
            )}

            {/* Room Details Slide-in Drawer */}
            <RoomDetailsDrawer
                room={selectedRoomForDrawer}
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                onEditRoom={handleOpenEditModal}
                onDeleteRoom={handleRequestDeleteRoom}
                onRoomUpdated={handleRoomUpdated}
            />

            {/* Add or Edit Room Modal */}
            <AddRoomOrEdit
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                roomToEdit={roomToEdit}
                onSuccess={handleSuccessSave}
            />

            {/* Confirm Room Deletion Dialog */}
            <ConfirmDialog
                isOpen={isConfirmDeleteOpen}
                title={`Delete Room ${roomToDelete?.roomNumber ?? ""}`}
                description={`Are you sure you want to delete Room ${roomToDelete?.roomNumber ?? ""} on Floor ${roomToDelete?.floor ?? ""}? This action will permanently remove the room and its bed allocations.`}
                confirmLabel="Delete Room"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setIsConfirmDeleteOpen(false);
                    setRoomToDelete(null);
                }}
                type="danger"
            />
        </div>
    );
};
