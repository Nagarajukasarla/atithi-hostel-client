import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { PaymentMethod } from "@/types";

// ── Request types ──────────────────────────────────────────────────────────

export interface FinancialTermsData {
    roomTariffId?: number | null;
    billingMode?: "MONTHLY" | "DAILY";
    monthlyRent?: number;
    dailyRate?: number;
    securityDepositRequired: number;
    billingAnchorDate?: string; // ISO date e.g. "2026-09-26"
}

export interface InitialPaymentData {
    amount: number;
    paymentMode?: PaymentMethod;
    notes?: string;
}

export interface CreateCustomerStayData {
    customerId: number;
    hostelId?: number;
    roomId: number;
    bedNumber?: string;
    checkInDate: string; // ISO date
    checkOutDate?: string; // Optional planned stay checkout date
    financialTerms: FinancialTermsData;
    initialPayment?: InitialPaymentData;
}

// ── Response types ─────────────────────────────────────────────────────────

export interface CustomerStayResult {
    allocationId: number;
    customerId: number;
    customerName: string | null;
    roomId: number;
    roomNumber: string | null;
    bedNumber: string | null;
    checkInDate: string;
    checkOutDate?: string | null;
    financialTermsId: number;
    roomTariffId: number;
    billingMode?: "MONTHLY" | "DAILY";
    monthlyRent?: number;
    dailyRate?: number;
    securityDepositRequired: number;
    billingAnchorDate: string;
    totalInitialCharges?: number;
    totalCharges?: number;
    totalPaid?: number;
    outstandingBalance?: number;
    charges?: Array<{
        id: number;
        chargeType: string;
        amount: number;
        dueDate: string;
        periodStart: string | null;
        periodEnd: string | null;
        status: string;
        notes: string | null;
    }>;
    initialPayment?: any;
    paymentAllocations?: Array<{
        id: number;
        paymentId: number;
        chargeId: number;
        chargeType: string;
        allocatedAmount: number;
        createdAt: string;
    }>;
}

// ── Service ────────────────────────────────────────────────────────────────

class CustomerStayService extends BaseService {
    /**
     * Creates a customer stay in a single atomic backend transaction.
     * Plan 1: creates RoomAllocation + AllocationFinancialTerms.
     * Plan 3 will replace the old separate allocation + payment calls.
     */
    async createCustomerStay(data: CreateCustomerStayData): Promise<APIResponse<CustomerStayResult>> {
        return this.unwrap(this.post<any>(API_ROUTES.CUSTOMER_STAYS.CREATE, data));
    }

    private async unwrap(request: Promise<APIResponse<any>>): Promise<APIResponse<CustomerStayResult>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = (res.data as any).data;
        }
        return res;
    }
}

export const customerStayService = new CustomerStayService();
export default CustomerStayService;
