import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
    withCredentials: true,
});

axiosInstance.interceptors.request.use(
    config => {
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    response => response,
    error => {
        // --------------------------------------------------------------
        // 1. NO INTERNET (Browser offline)
        // --------------------------------------------------------------
        if (!navigator.onLine) {
            return Promise.reject({
                code: -2,
                type: "NO_INTERNET",
                description: "No internet connection.",
                data: null,
            });
        }

        // --------------------------------------------------------------
        // 2. SERVER DOWN / Backend not running / CORS failed
        // --------------------------------------------------------------
        if (error.code === "ECONNABORTED" || error.message === "Network Error" || !error.response) {
            return Promise.reject({
                code: -3,
                type: "SERVER_DOWN",
                description: "Server is down. Please try again later.",
                data: null,
            });
        }

        // --------------------------------------------------------------
        // 3. Server responded (Statuses: 400, 401, 403, 500 etc.)
        // --------------------------------------------------------------
        if (error.response) {
            const { status, data } = error.response;

            // Dispatch unauthorized event on 401 for protected routes (not login/signup or public registration)
            const requestUrl = error.config?.url || "";
            if (
                status === 401 &&
                !requestUrl.includes("/auth/login") &&
                !requestUrl.includes("/auth/signup") &&
                !requestUrl.includes("/public/")
            ) {
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
                }
            }

            return Promise.reject({
                code: status,
                type: "HTTP_ERROR",
                description: data?.message || data?.description || "Server returned an error.",
                data: data,
            });
        }

        return Promise.reject({
            code: -1,
            type: "UNKNOWN",
            description: "Unknown error occurred.",
            data: null,
        });
    }
);

export default axiosInstance;
