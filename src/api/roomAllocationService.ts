import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { RoomAllocation } from "@/types";

export interface CreateAllocationData {
    customerId: number;
    roomId: number;
    bedNumber?: string;
    checkInDate: string;
}

export interface CheckoutPreviewResponse {
    allocationId: number;
    customerId: number;
    customerName: string;
    customerPhone?: string;
    roomId: number;
    roomNumber: string;
    bedNumber?: string;
    billingMode: "DAILY" | "MONTHLY";
    checkInDate: string;
    checkOutDate: string;

    // Daily specific
    stayDurationDays?: number;
    dailyRate?: number;

    // Monthly specific
    monthlyRent?: number;
    currentCycleStart?: string;
    currentCycleEnd?: string;
    daysInCycle?: number;
    daysStayedInCycle?: number;
    dailyProRatedRate?: number;
    proRatedRentAmount?: number;
    rentPaidForCurrentCycle?: number;
    unpaidRentDues?: number;

    // Deposit fields
    securityDepositRequired?: number;
    securityDepositPaid?: number;

    // Totals
    totalCharges: number;
    totalPaid: number;
    outstandingBalance: number;
    netSettlementAmount: number; // >0 guest must pay; <0 refund due to guest; ==0 clear
    speculativeChargesToCancelCount: number;
}

export interface EndRoomAllocationPayload {
    checkOutDate: string;
    depositDeduction?: number;
    depositDeductionReason?: string;
    payment?: {
        amount: number;
        paymentMethod: string;
        transactionReference?: string;
        notes?: string;
    };
    refund?: {
        amount: number;
        paymentMethod: string;
        transactionReference?: string;
        notes?: string;
    };
}

class RoomAllocationService extends BaseService {
    /**
     * Creates a new room allocation.
     * @deprecated Unused in frontend. Use {@link CustomerStayService.createCustomerStay} instead.
     * @param data The room allocation payload.
     * @returns A promise that resolves to an `APIResponse` containing the created `RoomAllocation`.
     * @see customerStayService.createCustomerStay
     */
    async createAllocation(data: CreateAllocationData): Promise<APIResponse<RoomAllocation>> {
        return this.unwrap(this.post<any>(API_ROUTES.ROOM_ALLOCATION.CREATE, data));
    }

    /**
     * Gets all room allocations for the authenticated hostel.
     * @deprecated Unused in frontend. Stays are managed via `customerStayService.createCustomerStay` and queried via room/customer specific endpoints.
     * @returns A promise that resolves to an `APIResponse` containing an array of `RoomAllocation` objects.
     */
    async getAllocations(): Promise<APIResponse<RoomAllocation[]>> {
        const res = await this.get<any>(API_ROUTES.ROOM_ALLOCATION.GET_ALL);
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    /**
     * Gets active allocation for a customer.
     * @param customerId The customer ID.
     * @returns A promise that resolves to an `APIResponse` containing the active `RoomAllocation`.
     */
    async getActiveAllocationByCustomer(customerId: number | string): Promise<APIResponse<RoomAllocation>> {
        return this.unwrap(this.get<any>(API_ROUTES.ROOM_ALLOCATION.GET_ACTIVE_BY_CUSTOMER(customerId)));
    }

    /**
     * Gets active allocations for a room.
     * @param roomId The room ID.
     * @returns A promise that resolves to an `APIResponse` containing an array of active `RoomAllocation` objects.
     */
    async getActiveAllocationsByRoom(roomId: number | string): Promise<APIResponse<RoomAllocation[]>> {
        const res = await this.get<any>(API_ROUTES.ROOM_ALLOCATION.GET_ACTIVE_BY_ROOM(roomId));
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    /**
     * Fetches real-time checkout financial preview for an allocation.
     * @param allocationId The room allocation ID.
     * @param checkOutDate Optional custom check-out date (YYYY-MM-DD). Defaults to today.
     */
    async getCheckoutPreview(
        allocationId: number | string,
        checkOutDate?: string
    ): Promise<APIResponse<CheckoutPreviewResponse>> {
        const url = checkOutDate
            ? `${API_ROUTES.ROOM_ALLOCATION.CHECKOUT_PREVIEW(allocationId)}?checkOutDate=${checkOutDate}`
            : API_ROUTES.ROOM_ALLOCATION.CHECKOUT_PREVIEW(allocationId);
        return this.unwrapData<CheckoutPreviewResponse>(this.get<any>(url));
    }

    /**
     * Ends an active room allocation with optional settlement payment/refund and checkout date.
     * @param allocationId The room allocation ID.
     * @param payload Checkout settlement details (date, payment, refund, deposit deductions).
     * @returns A promise that resolves to an `APIResponse` containing the ended `RoomAllocation`.
     */
    async endAllocation(
        allocationId: number | string,
        payload?: EndRoomAllocationPayload
    ): Promise<APIResponse<RoomAllocation>> {
        return this.unwrap(this.post<any>(API_ROUTES.ROOM_ALLOCATION.END(allocationId), payload || {}));
    }

    private async unwrap(request: Promise<APIResponse<any>>): Promise<APIResponse<RoomAllocation>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = (res.data as any).data;
        }
        return res;
    }

    private async unwrapData<T>(request: Promise<APIResponse<any>>): Promise<APIResponse<T>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = (res.data as any).data;
        }
        return res;
    }
}

export const roomAllocationService = new RoomAllocationService();
export default RoomAllocationService;
