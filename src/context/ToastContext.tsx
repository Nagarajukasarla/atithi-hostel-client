import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ToastContextType, ToastItem, ToastType } from "@/types/toast";
import { ToastContainer } from "@/components/common/ToastContainer";

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = "INFO", duration: number = 4000) => {
        const id = "toast_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
        const newToast: ToastItem = {
            id,
            type,
            message,
            duration,
        };

        setToasts(prev => [...prev, newToast]);
    }, []);

    const toastHelpers = useMemo(
        () => ({
            success: (message: string, duration?: number) => showToast(message, "SUCCESS", duration),
            warning: (message: string, duration?: number) => showToast(message, "WARNING", duration),
            error: (message: string, duration?: number) => showToast(message, "ERROR", duration),
            info: (message: string, duration?: number) => showToast(message, "INFO", duration),
        }),
        [showToast]
    );

    return (
        <ToastContext.Provider
            value={{
                toasts,
                showToast,
                removeToast,
                toast: toastHelpers,
            }}
        >
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
