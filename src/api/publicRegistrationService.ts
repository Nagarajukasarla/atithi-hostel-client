import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import axiosInstance from "./axiosInstance";

export interface PublicRegistrationInfo {
    hostelName: string;
    active: boolean;
}

export interface PublicRegistrationFormData {
    firstName: string;
    lastName: string;
    gender: string;
    mobile: string;
    aadhaarNumber: string;
    occupation: string;
    emergencyContact?: string;
    emergencyContactName: string;
    permanentAddress: string;
}

export interface GuestRegistrationResponse {
    id: number;
    fullName: string;
    mobileNumber: string;
    hostelToken: string;
}

class PublicRegistrationService extends BaseService {
    /**
     * Fetch public registration info (only hostelName and active status) using token.
     */
    async getRegistrationInfo(token: string): Promise<APIResponse<PublicRegistrationInfo>> {
        return this.get<PublicRegistrationInfo>(API_ROUTES.PUBLIC_REGISTRATION.GET_INFO(token));
    }

    /**
     * Submit public guest registration.
     */
    async submitRegistration(
        token: string,
        data: PublicRegistrationFormData
    ): Promise<APIResponse<{ data: GuestRegistrationResponse }>> {
        return this.post<{ data: GuestRegistrationResponse }>(API_ROUTES.PUBLIC_REGISTRATION.SUBMIT(token), data);
    }

    /**
     * Fetch the authenticated hostel's QR code SVG.
     */
    async getHostelQrSvg(): Promise<string> {
        const response = await axiosInstance.get(API_ROUTES.QR.GET_SVG, {
            responseType: "text",
            headers: {
                Accept: "image/svg+xml",
            },
        });
        return response.data;
    }
}

export const publicRegistrationService = new PublicRegistrationService();
export default publicRegistrationService;
