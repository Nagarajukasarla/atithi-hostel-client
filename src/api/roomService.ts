import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { Room, RoomFormData } from "@/types";

export function normalizeRoom(raw: any): Room {
    if (!raw) return raw;
    // Unwrap if raw is wrapped in Spring Boot's ApiResponse { success: true, message: "...", data: {...} }
    const item = raw.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : raw;

    const capacity = item.maxCapacity || item.capacity || 2;
    const occupied = typeof item.occupied === "number" ? item.occupied : (item.occupiedBeds ?? 0);
    const available = Math.max(0, capacity - occupied);
    const cleanStatus: "CLEAN" | "DIRTY" | "INSPECTED" = item.roomState === "DIRTY" || item.cleanStatus === "DIRTY" ? "DIRTY" : "CLEAN";

    return {
        ...item,
        id: item.id !== undefined && item.id !== null ? item.id : raw.id,
        roomNumber: String(item.roomNumber ?? raw.roomNumber ?? ""),
        floor: String(item.floor ?? raw.floor ?? ""),
        // sharingCount comes from the linked RoomType via backend — never from a local sharing field
        sharingCount: item.sharingCount ?? null,
        roomTypeId: item.roomTypeId ?? null,
        roomTypeName: item.roomTypeName ?? null,
        maxCapacity: capacity,
        capacity,
        occupied: occupied,
        occupiedBeds: occupied,
        availableBeds: available,
        cleanStatus,
        roomState: item.roomState || (cleanStatus === "DIRTY" ? "DIRTY" : "CLEAN"),
        roomStatus: item.roomStatus || (occupied === 0 ? "VACANT" : occupied >= capacity ? "FILLED" : "PARTIALLY_FILLED"),
    };
}

class RoomService extends BaseService {
    /**
     * Gets all rooms for the authenticated hostel, optionally filtered by floor.
     * @param floor Optional floor filter.
     * @returns A promise that resolves to an `APIResponse` containing an array of `Room` objects.
     */
    async getRooms(floor?: string): Promise<APIResponse<Room[]>> {
        const url = floor && floor !== "All" ? `${API_ROUTES.ROOMS.GET_ALL}?floor=${encodeURIComponent(floor)}` : API_ROUTES.ROOMS.GET_ALL;
        const res = await this.get<any>(url);
        const rawList = Array.isArray(res.data) ? res.data : res.data && Array.isArray((res.data as any).data) ? (res.data as any).data : [];
        res.data = rawList.map(normalizeRoom);
        return res;
    }

    /**
     * Gets a single room by ID.
     * @param id The room ID.
     * @returns A promise that resolves to an `APIResponse` containing the `Room` object.
     */
    async getRoomById(id: string | number): Promise<APIResponse<Room>> {
        if (!id || id === "undefined") {
            throw new Error("Valid room ID is required to fetch room details.");
        }
        return this.unwrap(this.get<any>(API_ROUTES.ROOMS.GET_BY_ID(id)));
    }

    /**
     * Creates a new room.
     * @param room The room form data.
     * @returns A promise that resolves to an `APIResponse` containing the created `Room` object.
     */
    async createRoom(room: RoomFormData): Promise<APIResponse<Room>> {
        return this.unwrap(this.post<any>(API_ROUTES.ROOMS.CREATE, room));
    }

    /**
     * Alias for createRoom to maintain backwards compatibility.
     */
    async addRoom(room: any): Promise<APIResponse<Room>> {
        return this.createRoom(room);
    }

    /**
     * Updates an existing room.
     * @param id The room ID.
     * @param room The updated room form data.
     * @returns A promise that resolves to an `APIResponse` containing the updated `Room` object.
     */
    async updateRoom(id: string | number, room: RoomFormData): Promise<APIResponse<Room>> {
        if (!id || id === "undefined") {
            throw new Error("Valid room ID is required to update room.");
        }
        return this.unwrap(this.put<any>(API_ROUTES.ROOMS.UPDATE(id), room));
    }

    /**
     * Toggles the clean status of a room (CLEAN <-> DIRTY).
     * @param id The room ID.
     * @returns A promise that resolves to an `APIResponse` containing the updated `Room` object.
     */
    async toggleRoomCleanStatus(id: string | number): Promise<APIResponse<Room>> {
        if (!id || id === "undefined") {
            throw new Error("Valid room ID is required to toggle cleanliness status.");
        }
        return this.unwrap(this.patch<any>(API_ROUTES.ROOMS.TOGGLE_CLEAN(id)));
    }

    /**
     * Deletes a room if it is vacant.
     * @param id The room ID.
     * @returns A promise that resolves to an `APIResponse` containing void.
     */
    async deleteRoom(id: string | number): Promise<APIResponse<void>> {
        if (!id || id === "undefined") {
            throw new Error("Valid room ID is required to delete room.");
        }
        return this.delete<void>(API_ROUTES.ROOMS.DELETE(id));
    }

    private async unwrap(request: Promise<APIResponse<any>>): Promise<APIResponse<Room>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = normalizeRoom((res.data as any).data);
        } else if (res.data) {
            res.data = normalizeRoom(res.data);
        }
        return res;
    }
}

export const roomService = new RoomService();
