import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { Hostel, User, UserRole } from "@/types";

export interface AuthResponseData {
    message: string;
    token?: string;
    user?: User;
    hostel?: Hostel;
    name?: string;
    email?: string;
}

export interface UserProfileResponseData {
    success: boolean;
    message: string;
    data: User;
}

export interface SignupRequestData {
    hostelName: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
    addressLane1?: string;
    addressLane2?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    role?: UserRole;
}

export interface LoginRequestData {
    email: string;
    password: string;
}

class AuthService extends BaseService {
    async signup(data: SignupRequestData): Promise<APIResponse<AuthResponseData>> {
        return this.post<AuthResponseData>(API_ROUTES.AUTH.SIGNUP, data);
    }

    async login(data: LoginRequestData): Promise<APIResponse<AuthResponseData>> {
        return this.post<AuthResponseData>(API_ROUTES.AUTH.LOGIN, data);
    }

    async logout(): Promise<APIResponse<{ success: boolean; message: string; data: null }>> {
        return this.post<{ success: boolean; message: string; data: null }>(API_ROUTES.AUTH.LOGOUT);
    }

    async checkAuthSession(): Promise<APIResponse<UserProfileResponseData | AuthResponseData>> {
        return this.get<UserProfileResponseData | AuthResponseData>(API_ROUTES.AUTH.ME);
    }
}

export const authService = new AuthService();
export default AuthService;
