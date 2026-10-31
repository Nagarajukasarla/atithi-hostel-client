export type ToastType = "SUCCESS" | "WARNING" | "ERROR" | "INFO";

export interface ToastOptions {
    type?: ToastType;
    title?: string;
    duration?: number;
}

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    title?: string;
    duration: number;
}

export interface ToastContextType {
    toasts: ToastItem[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
    toast: {
        success: (message: string, duration?: number) => void;
        warning: (message: string, duration?: number) => void;
        error: (message: string, duration?: number) => void;
        info: (message: string, duration?: number) => void;
    };
}
