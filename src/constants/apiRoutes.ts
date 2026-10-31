export const API_ROUTES = {
    AUTH: {
        SIGNUP: "/auth/signup",
        LOGIN: "/auth/login",
        LOGOUT: "/auth/logout",
        ME: "/auth/me",
    },
    HOSTELS: {
        GET_ME: "/hostels/me",
        UPDATE_ME: "/hostels/me",
    },
    ROOMS: {
        GET_ALL: "/rooms",
        GET_BY_ID: (id: string | number) => `/rooms/${id}`,
        CREATE: "/rooms",
        ADD: "/rooms",
        UPDATE: (id: string | number) => `/rooms/${id}`,
        TOGGLE_CLEAN: (id: string | number) => `/rooms/${id}/toggle-clean`,
        DELETE: (id: string | number) => `/rooms/${id}`,
    },
    ROOM_TYPES: {
        GET_ALL: "/room-types",
        CREATE: "/room-types",
        UPDATE: (id: string | number) => `/room-types/${id}`,
        DELETE: (id: string | number) => `/room-types/${id}`,
    },
    CUSTOMERS: {
        GET_ALL: "/customers",
        GET_DIRECTORY: "/customers/directory",
        GET_BY_AADHAAR: (aadhaar: string) => `/customers/aadhaar/${aadhaar}`,
        ADD: "/customers",
        EDIT: (id: string) => `/customers/${id}`,
        DELETE: (id: string) => `/customers/${id}/delete`,
    },
    BIOMETRICS: {
        GET_ALL: "/biometrics",
        REGISTER: (id: string) => `/biometrics/${id}/register`,
        REMOVE: (id: string) => `/biometrics/${id}/remove`,
    },
    AUTH_LOGS: {
        GET_ALL: "/auth-logs",
        ADD: "/auth-logs",
    },
    STAYS: {
        ADD: "/stays",
    },
    ROOM_ALLOCATION: {
        CREATE: "/room-allocation",
        GET_ALL: "/room-allocation",
        GET_ACTIVE_BY_CUSTOMER: (customerId: string | number) => `/room-allocation/customer/${customerId}/active`,
        GET_ACTIVE_BY_ROOM: (roomId: string | number) => `/room-allocation/room/${roomId}/active`,
        CHECKOUT_PREVIEW: (id: string | number) => `/room-allocation/${id}/checkout-preview`,
        END: (id: string | number) => `/room-allocation/${id}/end`,
    },
    PAYMENTS: {
        CREATE: "/payments",
        GET_ALL: "/payments",
        GET_BY_ID: (id: string | number) => `/payments/${id}`,
        GET_BY_CUSTOMER: (customerId: string | number) => `/payments/customer/${customerId}`,
    },
    QR: {
        GET_SVG: "/qr",
    },
    PUBLIC_REGISTRATION: {
        GET_INFO: (token: string) => `/public/registration/${token}`,
        SUBMIT: (token: string) => `/public/registration/${token}`,
    },
    ROOM_TARIFFS: {
        GET_ALL: "/room-tariffs",
        GET_CURRENT: (roomTypeId: string | number) => `/room-tariffs/room-type/${roomTypeId}/current`,
        GET_HISTORY: (roomTypeId: string | number) => `/room-tariffs/room-type/${roomTypeId}/history`,
        CREATE: (roomTypeId: string | number, closeExisting = false) =>
            `/room-tariffs/room-type/${roomTypeId}${closeExisting ? "?closeExisting=true" : ""}`,
        UPDATE: (tariffId: string | number) => `/room-tariffs/${tariffId}`,
    },
    CUSTOMER_STAYS: {
        CREATE: "/customer-stays",
    },
    FINANCIAL: {
        GET_SUMMARY: (customerId: string | number) => `/customers/${customerId}/financial-summary`,
        GET_DETAILS: (customerId: string | number) => `/customers/${customerId}/financial-details`,
        GET_CHARGES: (customerId: string | number) => `/customers/${customerId}/charges`,
        GET_PAYMENTS: (customerId: string | number) => `/customers/${customerId}/payments`,
    },
    DASHBOARD: {
        GET_STATISTICS: "/dashboard/statistics",
    },
    SUBSCRIPTION: {
        SUBMIT_UTR: "/subscription/submit-utr",
        STATUS: "/subscription/status",
    },
};

