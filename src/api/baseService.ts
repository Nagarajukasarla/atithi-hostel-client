import { type AxiosResponse } from "axios";
import APIResponse from "@/classes/APIResponse";
import axiosInstance from "./axiosInstance";

class BaseService {
    protected async get<T>(url: string): Promise<APIResponse<T>> {
        try {
            const response = await axiosInstance.get<T>(url);
            return this.handleResponse(response);
        } catch (error) {
            console.error("Error fetching data: ", error);
            return this.handleError(error);
        }
    }

    protected async post<T>(url: string, data?: any): Promise<APIResponse<T>> {
        try {
            const response = await axiosInstance.post<T>(url, data);
            return this.handleResponse(response);
        } catch (error) {
            console.error("Error posting data: ", error);
            return this.handleError(error);
        }
    }

    protected async put<T>(url: string, data?: any): Promise<APIResponse<T>> {
        try {
            const response = await axiosInstance.put<T>(url, data);
            return this.handleResponse(response);
        } catch (error) {
            console.error("Error putting data: ", error);
            return this.handleError(error);
        }
    }

    protected async patch<T>(url: string, data?: any): Promise<APIResponse<T>> {
        try {
            const response = await axiosInstance.patch<T>(url, data);
            return this.handleResponse(response);
        } catch (error) {
            console.error("Error patching data: ", error);
            return this.handleError(error);
        }
    }

    protected async delete<T>(url: string): Promise<APIResponse<T>> {
        try {
            const response = await axiosInstance.delete<T>(url);
            return this.handleResponse(response);
        } catch (error) {
            console.error("Error deleting data: ", error);
            return this.handleError(error);
        }
    }

    private handleResponse<T>(response: AxiosResponse<T>): APIResponse<T> {
        const customDesc =
            (response.data as any)?.message ||
            (response.data as any)?.description;
        return new APIResponse<T>(response.status, response.data, customDesc);
    }

    private handleError<T>(error: any): APIResponse<T> {
        const status =
            error?.response?.status ??
            (typeof error?.code === "number" ? error.code : -1);

        const responseData = error?.response?.data;
        const msg =
            (typeof responseData === "string" ? responseData : null) ||
            responseData?.message ||
            responseData?.description ||
            responseData?.error ||
            error?.description ||
            error?.message ||
            "Request failed.";

        return new APIResponse<T>(status, null as any, msg);
    }
}

export default BaseService;
