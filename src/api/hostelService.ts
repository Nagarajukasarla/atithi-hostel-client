import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { Hostel } from "@/types";
import axiosInstance from "./axiosInstance";

export interface UpdateHostelData {
    name: string;
    phone?: string;
    addressLane1?: string;
    addressLane2?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    totalFloors?: number;
}

class HostelService extends BaseService {
    /**
     * Gets the hostel details for the currently authenticated owner.
     */
    async getHostel(): Promise<APIResponse<{ success: boolean; message: string; data: Hostel }>> {
        return this.get<{ success: boolean; message: string; data: Hostel }>(API_ROUTES.HOSTELS.GET_ME);
    }

    /**
     * Updates hostel details for the currently authenticated owner.
     */
    async updateHostel(
        data: UpdateHostelData
    ): Promise<APIResponse<{ success: boolean; message: string; data: Hostel }>> {
        try {
            const response = await axiosInstance.put(API_ROUTES.HOSTELS.UPDATE_ME, data);
            return new APIResponse<{ success: boolean; message: string; data: Hostel }>(response.status, response.data);
        } catch (error: any) {
            console.error("Error updating hostel: ", error);
            return new APIResponse<{ success: boolean; message: string; data: Hostel }>(
                error?.code || 500,
                error?.data ?? null
            );
        }
    }
}

export const hostelService = new HostelService();
export default HostelService;
