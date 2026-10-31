import React, { createContext, useContext, useState } from "react";
import { authService, type SignupRequestData } from "@/api/authService";
import { hostelService } from "@/api/hostelService";
import APIResponse from "@/classes/APIResponse";
import type { Hostel, User } from "@/types";

export type AuthUser = User;

interface AuthContextType {
    user: AuthUser | null;
    hostel: Hostel | null;
    isVerified: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (data: SignupRequestData) => Promise<void>;
    verifyOtp: (otp: string) => Promise<boolean>;
    logout: () => Promise<boolean>;
    tempUser: AuthUser | null;
    refreshHostel: () => Promise<void>;
    setHostel: React.Dispatch<React.SetStateAction<Hostel | null>>;
    verifySession: (force?: boolean) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [hostel, setHostel] = useState<Hostel | null>(null);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [tempUser, setTempUser] = useState<AuthUser | null>(null);
    const lastVerifiedRef = React.useRef<number>(0);

    const refreshHostel = async () => {
        try {
            const res = await hostelService.getHostel();
            if (res.code === 200 && res.data && (res.data as any).data) {
                setHostel((res.data as any).data);
            }
        } catch (err) {
            console.warn("Could not fetch hostel details: ", err);
        }
    };

    const verifySession = async (force: boolean = false): Promise<boolean> => {
        const now = Date.now();
        // If session was verified within the last 30 seconds, return cached validity immediately
        if (!force && user && now - lastVerifiedRef.current < 30_000) {
            return true;
        }

        try {
            const response = await authService.checkAuthSession();
            if ((response.code === 200 || response.code === 201) && response.data) {
                const userData = (response.data as any).data || (response.data as any).user || response.data;
                if (userData && (userData.email || userData.id)) {
                    setUser(userData);
                    setIsVerified(true);
                    lastVerifiedRef.current = Date.now();
                    return true;
                }
            }
            setUser(null);
            setHostel(null);
            setIsVerified(false);
            lastVerifiedRef.current = 0;
            return false;
        } catch (error) {
            setUser(null);
            setHostel(null);
            setIsVerified(false);
            lastVerifiedRef.current = 0;
            return false;
        }
    };

    // Initial session check on mount using HTTP-only cookie
    React.useEffect(() => {
        const verifyActiveSession = async () => {
            try {
                const isValid = await verifySession();
                if (isValid) {
                    await refreshHostel();
                }
            } finally {
                setIsLoading(false);
            }
        };

        verifyActiveSession();

        // Listen for unauthorized events emitted by API calls
        const handleUnauthorized = () => {
            setUser(null);
            setHostel(null);
            setIsVerified(false);
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);
        return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
    }, []);

    // Authenticate with aavas backend service
    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await authService.login({ email, password });
            if ((response.code === 200 || response.code === 201) && response.data) {
                const userData = (response.data as any).user || (response.data as any).data || response.data;
                setUser(userData);
                setIsVerified(true);
                if ((response.data as any).hostel) {
                    setHostel((response.data as any).hostel);
                } else {
                    await refreshHostel();
                }
                return { success: true };
            }

            // Check if server is down / offline
            if (
                response.code === APIResponse.SERVER_DOWN ||
                response.code === APIResponse.NO_INTERNET ||
                response.code === APIResponse.NETWORK_ERROR ||
                response.type === "Server Down" ||
                response.type === "No Internet"
            ) {
                return {
                    success: false,
                    error: response.description || "Server is down. Please try again later.",
                };
            }

            // For all other cases (wrong email, wrong password, bad credentials, etc.)
            return {
                success: false,
                error: "Invalid email or Password",
            };
        } catch (error: any) {
            console.error("Login request failed: ", error);
            if (
                error?.code === -3 ||
                error?.code === -2 ||
                error?.type === "SERVER_DOWN" ||
                error?.type === "NO_INTERNET" ||
                error?.message === "Network Error"
            ) {
                return {
                    success: false,
                    error: error?.description || "Server is down. Please try again later.",
                };
            }
            return {
                success: false,
                error: "Invalid email or Password",
            };
        }
    };

    // Signup with aavas backend service (creates Hostel + Owner User)
    const signup = async (data: SignupRequestData) => {
        const response = await authService.signup(data);

        if ((response.code === 200 || response.code === 201) && response.data) {
            const userData = (response.data as any).user || (response.data as any).data || response.data;
            const hostelData = (response.data as any).hostel;
            setUser(userData);
            if (hostelData) {
                setHostel(hostelData);
            }
            setIsVerified(true);
            setTempUser(null);
        } else {
            const errMsg = (response.data as any)?.message || response.description || "Registration failed";
            throw new Error(errMsg);
        }
    };

    const verifyOtp = async (otp: string): Promise<boolean> => {
        if (/^\d{6}$/.test(otp) && tempUser) {
            setUser(tempUser);
            setIsVerified(true);
            setTempUser(null);
            return true;
        }
        return isVerified;
    };

    const logout = async (): Promise<boolean> => {
        try {
            await authService.logout();
        } catch (error) {
            console.error("Logout request error: ", error);
        }

        setUser(null);
        setHostel(null);
        setIsVerified(false);
        setTempUser(null);
        return true;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                hostel,
                isVerified,
                isLoading,
                login,
                signup,
                verifyOtp,
                logout,
                tempUser,
                refreshHostel,
                setHostel,
                verifySession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
