import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute: React.FC = () => {
    const { user, isLoading, verifySession } = useAuth();
    const location = useLocation();

    useEffect(() => {
        if (user) {
            // Re-verify session in background if > 30s elapsed (handled by AuthContext TTL)
            verifySession();
        }
    }, [location.pathname]);

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

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (user.status === "INACTIVE") {
        return <Navigate to="/select-plan" replace />;
    }

    return <Outlet />;
};
