import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";

export interface SubscriptionStatusResponse {
    id: number;
    hostelId: number;
    planName: string;
    amount: number;
    utrNumber: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    notes?: string;
    createdAt: string;
}

export interface SubmitUtrData {
    planName: string;
    amount: number;
    utrNumber: string;
    notes?: string;
}

class SubscriptionService extends BaseService {
    async submitUtr(data: SubmitUtrData): Promise<APIResponse<{ success: boolean; message: string; data: SubscriptionStatusResponse }>> {
        return this.post(API_ROUTES.SUBSCRIPTION.SUBMIT_UTR, data);
    }

    async getStatus(): Promise<APIResponse<{ success: boolean; message: string; data: SubscriptionStatusResponse }>> {
        return this.get(API_ROUTES.SUBSCRIPTION.STATUS);
    }
}

export const subscriptionService = new SubscriptionService();
export default SubscriptionService;
