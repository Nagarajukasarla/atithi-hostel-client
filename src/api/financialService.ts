import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";

// ── Response types ─────────────────────────────────────────────────────────

/**
 * Plan 2/3 will flesh out these types fully.
 * Stub types here so imports work in Plan 1.
 */
export interface FinancialSummary {
    customerId?: number;
    customerName?: string;
    activeAllocationId?: number | null;
    roomNumber?: string | null;
    billingMode?: "MONTHLY" | "DAILY";
    monthlyRent: number;
    dailyRate?: number;
    securityDepositRequired: number;
    securityDepositPaid: number;
    totalCharges: number;
    totalPaid: number;
    outstandingBalance: number;
}

export interface CustomerCharge {
    id: number;
    chargeType: string;
    amount: number;
    paidAmount?: number;
    remainingAmount?: number;
    dueDate: string;
    periodStart: string | null;
    periodEnd: string | null;
    status: string;
    notes: string | null;
}

export interface CustomerFinancialDetails {
    customer: Record<string, any>;
    activeAllocation: Record<string, any> | null;
    financialTerms: Record<string, any> | null;
    summary: FinancialSummary | null;
    charges: CustomerCharge[];
    payments: Record<string, any>[];
    paymentAllocations: Record<string, any>[];
}

// ── Service ────────────────────────────────────────────────────────────────

class FinancialService extends BaseService {
    /**
     * Gets the financial summary for a customer.
     * Plan 2: totalPaid will be 0 until payment allocations exist.
     * Plan 3: fully implemented.
     */
    async getCustomerFinancialSummary(customerId: number | string): Promise<APIResponse<FinancialSummary>> {
        return this.unwrap(this.get<any>(API_ROUTES.FINANCIAL.GET_SUMMARY(customerId)));
    }

    /**
     * Gets full financial details: allocation, terms, charges, payments, allocations.
     * Implemented in Plan 3.
     */
    async getCustomerFinancialDetails(customerId: number | string): Promise<APIResponse<CustomerFinancialDetails>> {
        return this.unwrap(this.get<any>(API_ROUTES.FINANCIAL.GET_DETAILS(customerId)));
    }

    /**
     * Gets all charges for a customer.
     * Implemented in Plan 2.
     */
    async getCustomerCharges(customerId: number | string): Promise<APIResponse<CustomerCharge[]>> {
        const res = await this.get<any>(API_ROUTES.FINANCIAL.GET_CHARGES(customerId));
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    /**
     * Gets all payments for a customer.
     */
    async getCustomerPayments(customerId: number | string): Promise<APIResponse<any[]>> {
        const res = await this.get<any>(API_ROUTES.FINANCIAL.GET_PAYMENTS(customerId));
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    private async unwrap<T>(request: Promise<APIResponse<any>>): Promise<APIResponse<T>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = (res.data as any).data;
        }
        return res;
    }
}

export const financialService = new FinancialService();
export default FinancialService;
