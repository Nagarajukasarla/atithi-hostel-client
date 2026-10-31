import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { Payment, PaymentMethod, PaymentStatus, PaymentType } from "@/types";

export interface CreatePaymentData {
    customerId: number;
    allocationId?: number;
    paymentType: PaymentType;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentStatus?: PaymentStatus;
    transactionReference?: string;
    receiptNumber?: string;
    paymentDate?: string;
    notes?: string;
}

class PaymentService extends BaseService {
    /**
     * Records a new payment transaction.
     */
    async createPayment(data: CreatePaymentData): Promise<APIResponse<Payment>> {
        return this.unwrap(this.post<any>(API_ROUTES.PAYMENTS.CREATE, data));
    }

    /**
     * Gets all payments for the authenticated hostel.
     */
    async getPayments(): Promise<APIResponse<Payment[]>> {
        const res = await this.get<any>(API_ROUTES.PAYMENTS.GET_ALL);
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    /**
     * Gets a payment by ID.
     */
    async getPaymentById(id: number): Promise<APIResponse<Payment>> {
        return this.unwrap(this.get<any>(API_ROUTES.PAYMENTS.GET_BY_ID(id)));
    }

    /**
     * Gets all payments for a specific customer.
     */
    async getPaymentsByCustomer(customerId: number): Promise<APIResponse<Payment[]>> {
        const res = await this.get<any>(API_ROUTES.PAYMENTS.GET_BY_CUSTOMER(customerId));
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    private async unwrap(request: Promise<APIResponse<any>>): Promise<APIResponse<Payment>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = (res.data as any).data;
        }
        return res;
    }
}

export const paymentService = new PaymentService();
export default PaymentService;
