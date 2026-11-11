import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { Customer } from "@/types";

export interface CustomerDirectoryItem {
    customerId: number;
    name: string;
    mobileNumber: string;
    roomNumber: string;
    bedNumber?: string;
    billingMode?: "MONTHLY" | "DAILY";
    monthlyRent: number;
    dailyRate?: number;
    paidRent: number;
    securityDeposit: number;
    securityDepositPaid: number;
    joinDate: string;
    checkOutDate?: string;
    allocationId?: number;
    allocationStatus?: "ACTIVE" | "ENDED" | "CANCELLED";
    outstandingBalance: number;
    latestPaymentDate?: string;
    customerStatus?: "ACTIVE" | "INACTIVE" | "BLOCKED";
}

class CustomerService extends BaseService {
    /**
     * Gets all customers.
     * @returns A promise that resolves to an `APIResponse` containing an array of `Customer` objects.
     */
    async getCustomers(): Promise<APIResponse<Customer[]>> {
        const res = await this.get<any>(API_ROUTES.CUSTOMERS.GET_ALL);
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    /**
     * Gets customer directory with active room and financial status.
     */
    async getCustomerDirectory(): Promise<APIResponse<CustomerDirectoryItem[]>> {
        const res = await this.get<any>(API_ROUTES.CUSTOMERS.GET_DIRECTORY);
        const list = Array.isArray(res.data)
            ? res.data
            : res.data && Array.isArray((res.data as any).data)
              ? (res.data as any).data
              : [];
        res.data = list;
        return res;
    }

    /**
     * Gets a customer by Aadhaar number.
     * @param aadhaarNumber The customer's Aadhaar number.
     * @returns A promise that resolves to an `APIResponse` containing the `Customer` object.
     */
    async getCustomer(aadhaarNumber: string): Promise<APIResponse<Customer>> {
        return this.unwrap(this.get<any>(API_ROUTES.CUSTOMERS.GET_BY_AADHAAR(aadhaarNumber)));
    }

    /**
     * Adds or saves a customer.
     * @param customer The customer details.
     * @returns A promise that resolves to an `APIResponse` containing the saved `Customer` object.
     */
    async addCustomer(customer: Omit<Customer, "id">): Promise<APIResponse<Customer>> {
        return this.post<Customer>(API_ROUTES.CUSTOMERS.ADD, customer);
    }

    /**
     * Saves or creates a customer profile (used on Step 2 Next).
     */
    async saveCustomer(customer: Partial<Customer>): Promise<APIResponse<Customer>> {
        return this.post<Customer>(API_ROUTES.CUSTOMERS.ADD, customer);
    }

    /**
     * Edits an existing customer's details.
     * @param id The customer ID.
     * @param updatedFields Partial customer details to update.
     * @returns A promise that resolves to an `APIResponse` containing the updated `Customer` object.
     */
    async editCustomer(id: string, updatedFields: Partial<Customer>): Promise<APIResponse<Customer>> {
        return this.post<Customer>(API_ROUTES.CUSTOMERS.EDIT(id), updatedFields);
    }

    /**
     * Deletes a customer.
     * @param id The customer ID.
     * @returns A promise that resolves to an `APIResponse` object.
     */
    async deleteCustomer(id: string): Promise<APIResponse<any>> {
        return this.post<any>(API_ROUTES.CUSTOMERS.DELETE(id));
    }

    private async unwrap(request: Promise<APIResponse<any>>): Promise<APIResponse<Customer>> {
        const res = await request;
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = (res.data as any).data;
        }
        return res;
    }
}

export const customerService = new CustomerService();
