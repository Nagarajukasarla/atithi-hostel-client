export type UserRole = "OWNER" | "ADMIN" | "MANAGER" | "WARDEN" | "STAFF" | "RESIDENT";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED";
export type HostelStatus = "ACTIVE" | "INACTIVE";

export interface Hostel {
    id: number;
    name: string;
    phone?: string;
    addressLane1?: string;
    addressLane2?: string;
    address_lane_1?: string;
    address_lane_2?: string;
    city?: string;
    state?: string;
    zipcode?: string;
    status?: HostelStatus;
    token?: string;
    totalFloors?: number;
}

export interface User {
    id: number;
    hostelId?: number | null;
    hostel?: Hostel | null;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    address?: string;
}

export type RoomState = "CLEAN" | "DIRTY";
export type RoomStatus = "VACANT" | "PARTIALLY FILLED" | "FILLED";

export interface Room {
    id: string | number;
    roomNumber: string;
    floor: string;
    roomTypeId?: number | null;
    roomTypeName?: string | null;
    /** Sharing count resolved from the linked RoomType (e.g. 4 for "4 Sharing") */
    sharingCount?: number | null;
    maxCapacity?: number;
    occupied?: number;
    roomState?: RoomState;
    roomStatus?: RoomStatus;
    lastCleaned?: string | null;
    notes?: string | null;
    hostelId?: number;
    createdAt?: string;
    updatedAt?: string;

    // Visual & backwards-compatibility fields
    capacity: number;
    sharing?: number;
    occupiedBeds: number;
    availableBeds: number;
    monthlyRent?: number;
    cleanStatus: "CLEAN" | "DIRTY" | "INSPECTED";
    period?: string;
    vipStatus?: boolean;
    alertDot?: boolean;
}

export interface RoomType {
    id: number;
    hostelId: number;
    name: string;
    sharingCount: number;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoomFormData {
    roomNumber: string;
    floor: string;
    roomTypeId: number;
    maxCapacity: number;
    occupied?: number;
    roomState: RoomState;
    roomStatus: RoomStatus;
    notes?: string;
}

export interface Customer {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth?: string;
    email?: string;
    mobileNumber: string;
    altMobileNumber?: string;
    permanentAddress: string;
    aadhaarNumber: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    occupation: string;
    roomNumber: string;
    bedNumber?: string;
    floor: string;
    monthlyRent: number;
    advanceAmount: number;
    amountPaid: number;
    dueAmount: number;
    previousDue: number; // Previous Due for Due Calculation UI
    advanceStatus: "Paid" | "Unpaid" | "Partial";
    paymentStatus: PaymentStatus | "Paid" | "Partial" | "Unpaid";
    paymentMethod?: PaymentMethod | string;
    roomTariffId?: number | null;
    joinDate: string;
    billingMode?: BillingMode;
    dailyRate?: number;
    checkOutDate?: string;
    provideMissingDetailsLater?: boolean;
}

export interface BiometricUser {
    id: string;
    name: string;
    roomNumber: string;
    registrationStatus: "Registered" | "Unregistered";
    lastAuthentication: string;
}

export interface AuthLog {
    id: string;
    name: string;
    roomNumber: string;
    checkInTime: string;
    checkOutTime: string;
    date: string;
    result: "Success" | "Failed";
}

export interface Settings {
    defaultAdvanceAmount: number;
    defaultMonthlyRent: number;
    currencySymbol: string;
}

export type BillingMode = "MONTHLY" | "DAILY";
export type AllocationStatus = "ACTIVE" | "ENDED" | "CANCELLED";
export type PaymentType =
    "INITIAL_REGISTRATION" | "MONTHLY_RENT" | "DAILY_RENT" | "SECURITY_DEPOSIT" | "ADVANCE" | "MAINTENANCE" | "SERVICE" | "OTHER";
export type PaymentMethod = "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "OTHER";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
    { value: "PENDING", label: "Pending" },
    { value: "SUCCESS", label: "Success" },
    { value: "FAILED", label: "Failed" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
    { value: "CASH", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "CARD", label: "Card" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "OTHER", label: "Other" },
];

export interface RoomAllocation {
    id: number;
    hostelId: number;
    customerId: number;
    customerName?: string;
    customerMobile?: string;
    roomId: number;
    roomNumber?: string;
    floor?: string;
    bedNumber?: string | null;
    checkInDate: string;
    checkOutDate?: string | null;
    status: AllocationStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface Payment {
    id: number;
    hostelId: number;
    customerId: number;
    customerName?: string;
    allocationId?: number | null;
    roomNumber?: string | null;
    bedNumber?: string | null;
    paymentType: PaymentType;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    transactionReference?: string | null;
    receiptNumber?: string | null;
    paymentDate: string;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
}
