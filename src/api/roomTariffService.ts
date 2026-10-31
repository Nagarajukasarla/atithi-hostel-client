import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";

export interface RoomTariff {
    id: number;
    hostelId: number;
    roomTypeId: number;
    roomTypeName: string | null;
    monthlyRent: number;
    dailyRate?: number;
    securityDepositRequired: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateRoomTariffData {
    monthlyRent: number;
    dailyRate?: number;
    securityDepositRequired: number;
    effectiveFrom: string;
    effectiveTo?: string | null;
}

class RoomTariffService extends BaseService {
    /**
     * Gets all tariffs for the hostel in a single request.
     * When currentOnly is true (default), returns the active tariffs valid today.
     */
    async getAllRoomTariffs(currentOnly = true): Promise<APIResponse<RoomTariff[]>> {
        const url = `${API_ROUTES.ROOM_TARIFFS.GET_ALL}?currentOnly=${currentOnly}`;
        const res = await this.get<any>(url);
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res as APIResponse<RoomTariff[]>;
    }

    /**
     * Gets the current active tariff for a room type (valid today).
     * Called during room selection to pre-fill Financial Info.
     */
    async getCurrentRoomTariff(roomTypeId: number | string): Promise<APIResponse<RoomTariff | null>> {
        return this.unwrap(this.get<any>(API_ROUTES.ROOM_TARIFFS.GET_CURRENT(roomTypeId)));
    }

    /**
     * Gets full tariff history for a room type, newest first.
     */
    async getTariffHistory(roomTypeId: number | string): Promise<APIResponse<RoomTariff[]>> {
        const res = await this.get<any>(API_ROUTES.ROOM_TARIFFS.GET_HISTORY(roomTypeId));
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    /**
     * Creates a new tariff for a room type.
     * When closeExisting is true, automatically closes any overlapping active tariff.
     */
    async createTariff(
        roomTypeId: number | string,
        data: CreateRoomTariffData,
        closeExisting = false
    ): Promise<APIResponse<RoomTariff>> {
        return this.unwrap(
            this.post<any>(API_ROUTES.ROOM_TARIFFS.CREATE(roomTypeId, closeExisting), data)
        ) as Promise<APIResponse<RoomTariff>>;
    }

    /**
     * In-place updates an existing tariff.
     */
    async updateTariff(
        tariffId: number | string,
        data: CreateRoomTariffData
    ): Promise<APIResponse<RoomTariff>> {
        return this.unwrap(
            this.put<any>(API_ROUTES.ROOM_TARIFFS.UPDATE(tariffId), data)
        ) as Promise<APIResponse<RoomTariff>>;
    }

    private async unwrap(request: Promise<APIResponse<any>>): Promise<APIResponse<RoomTariff | null>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data) {
            res.data = (res.data as any).data ?? null;
        }
        return res as APIResponse<RoomTariff | null>;
    }
}

export const roomTariffService = new RoomTariffService();
export default RoomTariffService;
