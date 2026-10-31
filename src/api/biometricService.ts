import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";
import type { BiometricUser, AuthLog } from "@/types";

class BiometricService extends BaseService {
    /**
     * Gets all biometric users.
     * @returns A promise that resolves to an `APIResponse` containing an array of `BiometricUser` objects.
     */
    async getBiometrics(): Promise<APIResponse<BiometricUser[]>> {
        return this.get<BiometricUser[]>(API_ROUTES.BIOMETRICS.GET_ALL);
    }

    /**
     * Registers biometric authentication for a user.
     * @param id The biometric record ID.
     * @returns A promise that resolves to an `APIResponse` containing the updated `BiometricUser` object.
     */
    async registerBiometric(id: string): Promise<APIResponse<BiometricUser>> {
        return this.post<BiometricUser>(API_ROUTES.BIOMETRICS.REGISTER(id));
    }

    /**
     * Removes biometric registration for a user.
     * @param id The biometric record ID.
     * @returns A promise that resolves to an `APIResponse` containing the updated `BiometricUser` object.
     */
    async removeBiometric(id: string): Promise<APIResponse<BiometricUser>> {
        return this.post<BiometricUser>(API_ROUTES.BIOMETRICS.REMOVE(id));
    }

    /**
     * Gets all authentication logs.
     * @returns A promise that resolves to an `APIResponse` containing an array of `AuthLog` objects.
     */
    async getAuthLogs(): Promise<APIResponse<AuthLog[]>> {
        return this.get<AuthLog[]>(API_ROUTES.AUTH_LOGS.GET_ALL);
    }

    /**
     * Adds a new authentication log.
     * @param log The log details.
     * @returns A promise that resolves to an `APIResponse` containing the created `AuthLog` object.
     */
    async addAuthLog(log: Omit<AuthLog, "id">): Promise<APIResponse<AuthLog>> {
        return this.post<AuthLog>(API_ROUTES.AUTH_LOGS.ADD, log);
    }
}

export const biometricService = new BiometricService();
