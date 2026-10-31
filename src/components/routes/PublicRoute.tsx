import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const PublicRoute: React.FC = () => {
    const { user, isVerified, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-semibold text-neutral-500">Checking session status...</p>
                </div>
            </div>
        );
    }

    if (user && isVerified) {
        if (user.status === "INACTIVE") {
            return <Navigate to="/select-plan" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
