import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { User } from "@/types";

/**
 * Service for User (Hostel Owner/Admin/Staff) management operations.
 * Distinct from CustomerService which manages hostel residents/guests.
 */
class UserService extends BaseService {
    /**
     * Fetches current authenticated user profile.
     */
    async getCurrentUser(): Promise<APIResponse<{ success: boolean; message: string; data: User }>> {
        return this.get<{ success: boolean; message: string; data: User }>(API_ROUTES.AUTH.ME);
    }
}

export const userService = new UserService();
export default UserService;
