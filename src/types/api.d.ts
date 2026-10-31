export interface Customer {
    id: string;
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
}

export type PaymentMode = "CASH" | "CARD" | "UPI" | "NET_BANKING";

export interface NewStayRequest {
    customerId?: string;
    customerDetails?: Customer;

    roomId: string;
    bedId: string;

    monthlyRent: number;
    securityDeposit: number;

    rentPaidAmount: number;
    depositPaidAmount: number;

    paymentMode: PaymentMode;

    dateOfJoin: string;
    dateOfLeave?: string;
}
