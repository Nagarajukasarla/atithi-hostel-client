import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { RoomType } from "@/types";

export interface RoomTypePayload {
    name: string;
    sharingCount: number;
    active: boolean;
}

class RoomTypeService extends BaseService {
    async getRoomTypes(): Promise<APIResponse<RoomType[]>> {
        const res = await this.get<any>(API_ROUTES.ROOM_TYPES.GET_ALL);
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    async createRoomType(data: RoomTypePayload): Promise<APIResponse<RoomType>> {
        return this.unwrap(this.post<any>(API_ROUTES.ROOM_TYPES.CREATE, data));
    }

    async updateRoomType(id: number, data: RoomTypePayload): Promise<APIResponse<RoomType>> {
        return this.unwrap(this.put<any>(API_ROUTES.ROOM_TYPES.UPDATE(id), data));
    }

    async deleteRoomType(id: number): Promise<APIResponse<void>> {
        return this.delete<void>(API_ROUTES.ROOM_TYPES.DELETE(id));
    }

    private async unwrap(request: Promise<APIResponse<any>>): Promise<APIResponse<RoomType>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = (res.data as any).data;
        }
        return res;
    }
}

export const roomTypeService = new RoomTypeService();
