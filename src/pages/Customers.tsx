import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { SearchBar } from "@/components/common/SearchBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Contact, CreditCard, Building, UserCheck, ChevronRight, ChevronLeft, Search, X, Loader2, IndianRupee, LogOut } from "lucide-react";
import type { Customer, Room, PaymentStatus, RoomAllocation, PaymentMethod } from "@/types";
import { customerService, type CustomerDirectoryItem } from "@/api/customerService";
import { useAuth } from "@/context/AuthContext";
import { roomService } from "@/api/roomService";
import { roomAllocationService } from "@/api/roomAllocationService";
import { roomTariffService } from "@/api/roomTariffService";
import { customerStayService } from "@/api/customerStayService";
import { CustomerRegistrationAadhaarLookupForm } from "../components/feature/CustomerRegistrationAadhaarLookupForm";
import { CustomerRegistrationPersonalDetailsForm } from "../components/feature/CustomerRegistrationPersonalDetailsForm";
import { CustomerRegistrationRoomAllocationForm } from "../components/feature/CustomerRegistrationRoomAllocationForm";
import { CustomerRegistrationFinancialInfoForm } from "../components/feature/CustomerRegistrationFinancialInfoForm";
import { CustomerRegistrationSummaryReviewForm } from "../components/feature/CustomerRegistrationSummaryReviewForm";
import { CustomerFinancialModal } from "../components/feature/CustomerFinancialModal";
import { MonthlyCheckoutModal } from "../components/feature/MonthlyCheckoutModal";
import { DailyCheckoutModal } from "../components/feature/DailyCheckoutModal";
import { PayModal } from "../components/feature/PayModal";
import { formatDate } from "@/utils";

// Validation schema for Customer creation/modification
const customerSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    gender: z.string().min(1, "Gender is required"),
    dateOfBirth: z.string().optional().or(z.literal("")),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    mobileNumber: z.string().regex(/^\d{10}$/, "Must be a 10-digit number"),
    altMobileNumber: z
        .string()
        .regex(/^\d{10}$/, "Must be a 10-digit number")
        .optional()
        .or(z.literal("")),
    permanentAddress: z.string().optional().or(z.literal("")),
    aadhaarNumber: z.string().optional().or(z.literal("")),
    emergencyContactName: z.string().optional().or(z.literal("")),
    emergencyContactPhone: z.string().optional().or(z.literal("")),
    occupation: z.string().optional().or(z.literal("")),
    provideMissingDetailsLater: z.boolean().default(false),
    floor: z.string().min(1, "Required"),
    roomNumber: z.string().min(1, "Select a room"),
    bedNumber: z.string().optional(),
    checkOutDate: z.string().optional().or(z.literal("")),
    billingMode: z.enum(["MONTHLY", "DAILY"]).default("MONTHLY"),
    dailyRate: z.number().optional().nullable(),
    monthlyRent: z.number().min(0, "Must be positive").default(0),
    advanceAmount: z.number().min(0, "Must be positive").default(0),
    amountPaid: z.number().min(0, "Must be positive").default(0),
    paymentMethod: z.string().optional(),
    roomTariffId: z.number().optional().nullable(),
    previousDue: z.number().optional(),
    paymentStatus: z.string().optional(),
    joinDate: z.string().min(1, "Required"),
}).superRefine((data, ctx) => {
    if (!data.provideMissingDetailsLater) {
        if (!data.aadhaarNumber || !/^\d{12}$/.test(data.aadhaarNumber)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Must be a 12-digit Aadhaar number",
                path: ["aadhaarNumber"],
            });
        }
        if (!data.permanentAddress || data.permanentAddress.trim().length < 5) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Address is too short (min 5 characters)",
                path: ["permanentAddress"],
            });
        }
        if (!data.emergencyContactName || data.emergencyContactName.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Emergency contact name is required",
                path: ["emergencyContactName"],
            });
        }
        if (!data.emergencyContactPhone || !/^\d{10}$/.test(data.emergencyContactPhone)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Must be a 10-digit number",
                path: ["emergencyContactPhone"],
            });
        }
        if (!data.occupation || data.occupation.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Occupation is required",
                path: ["occupation"],
            });
        }
    } else {
        if (data.aadhaarNumber && data.aadhaarNumber.trim().length > 0 && !/^\d{12}$/.test(data.aadhaarNumber)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Must be a 12-digit Aadhaar number",
                path: ["aadhaarNumber"],
            });
        }
        if (data.emergencyContactPhone && data.emergencyContactPhone.trim().length > 0 && !/^\d{10}$/.test(data.emergencyContactPhone)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Must be a 10-digit number",
                path: ["emergencyContactPhone"],
            });
        }
    }

    if (data.billingMode === "DAILY") {
        if (!data.dailyRate || data.dailyRate <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Daily rate is required and must be greater than 0",
                path: ["dailyRate"],
            });
        }
    }
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export const Customers: React.FC = () => {
    const { hostel } = useAuth();
    const { settings } = useSettings();
    const { toast } = useToast();

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

    useEffect(() => {
        const q = searchParams.get("search");
        if (q !== null) {
            setSearchTerm(q);
        }
    }, [searchParams]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [dbRooms, setDbRooms] = useState<Room[]>([]);
    const [selectedRoomObj, setSelectedRoomObj] = useState<Room | null>(null);
    const [selectedTariffId, setSelectedTariffId] = useState<number | null>(null);
    const [isFetchingTariff, setIsFetchingTariff] = useState<boolean>(false);
    const [persistedCustomerId, setPersistedCustomerId] = useState<number | null>(null);
    const [activeAllocation, setActiveAllocation] = useState<RoomAllocation | null>(null);
    const [isCheckingAllocation, setIsCheckingAllocation] = useState<boolean>(false);
    const [isSavingCustomer, setIsSavingCustomer] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isExistingCustomer, setIsExistingCustomer] = useState<boolean>(false);
    const [isEditingPersonalDetails, setIsEditingPersonalDetails] = useState<boolean>(false);
    const [initialPersonalSnapshot, setInitialPersonalSnapshot] = useState<Record<string, any> | null>(null);
    const [financialModalCustomer, setFinancialModalCustomer] = useState<{ id: number | string; name: string } | null>(null);
    const [directory, setDirectory] = useState<CustomerDirectoryItem[]>([]);
    const [isLoadingDirectory, setIsLoadingDirectory] = useState<boolean>(true);
    const [payModalCustomer, setPayModalCustomer] = useState<CustomerDirectoryItem | null>(null);

    const [endStayTarget, setEndStayTarget] = useState<CustomerDirectoryItem | null>(null);

    const loadDirectory = async () => {
        setIsLoadingDirectory(true);
        try {
            const res = await customerService.getCustomerDirectory();
            if (res && Array.isArray(res.data)) {
                setDirectory(res.data);
            }
        } catch (err) {
            console.warn("Could not fetch customer directory from server:", err);
        } finally {
            setIsLoadingDirectory(false);
        }
    };

    const loadRooms = async () => {
        try {
            const res = await roomService.getRooms();
            if (res && Array.isArray(res.data)) {
                setDbRooms(res.data);
            }
        } catch (err) {
            console.warn("Could not fetch rooms from server:", err);
        }
    };

    useEffect(() => {
        loadDirectory();
    }, []);

    // Load backend rooms whenever modal is opened or mounted
    useEffect(() => {
        loadRooms();
    }, [isModalOpen]);

    // Wizard state: 1: Aadhaar Lookup, 2: Personal, 3: Allocation, 4: Finance, 5: Summary
    const [wizardStep, setWizardStep] = useState<number>(1);
    const [searchStatus, setSearchStatus] = useState<{
        type: "idle" | "searching" | "success" | "not_found" | "error";
        message: string;
        customerName?: string;
    }>({ type: "idle", message: "" });


    // Lock body scroll and close on Escape key when wizard modal is open
    useEffect(() => {
        if (!isModalOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsModalOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = originalOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isModalOpen]);

    // Form hook
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        reset,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as any,
        defaultValues: {
            firstName: "",
            lastName: "",
            gender: "Male",
            dateOfBirth: "",
            email: "",
            mobileNumber: "",
            altMobileNumber: "",
            permanentAddress: "",
            aadhaarNumber: "",
            emergencyContactName: "",
            emergencyContactPhone: "",
            occupation: "",
            floor: "1",
            roomNumber: "",
            bedNumber: "A",
            checkOutDate: "",
            billingMode: "MONTHLY",
            dailyRate: 0,
            provideMissingDetailsLater: false,
            monthlyRent: settings.defaultMonthlyRent,
            advanceAmount: settings.defaultAdvanceAmount,
            amountPaid: 0,
            paymentMethod: "CASH",
            roomTariffId: null,
            previousDue: 0,
            paymentStatus: "PENDING",
            joinDate: new Date().toISOString().substr(0, 10),
        },
    });

    const watchedFloor = watch("floor");
    const watchedAadhaar = watch("aadhaarNumber");
    const watchedRent = watch("monthlyRent") || 0;
    const watchedDailyRate = watch("dailyRate") || 0;
    const watchedAdvance = watch("advanceAmount") || 0;
    const watchedPaid = watch("amountPaid") || 0;
    const watchedRoom = watch("roomNumber");
    const watchedBillingMode = watch("billingMode") || "MONTHLY";
    const watchedMissingDetailsLater = watch("provideMissingDetailsLater");
    const formValues = watch();

    const personalFieldsToCompare = [
        "firstName",
        "lastName",
        "gender",
        "dateOfBirth",
        "email",
        "mobileNumber",
        "altMobileNumber",
        "permanentAddress",
        "aadhaarNumber",
        "occupation",
        "emergencyContactName",
        "emergencyContactPhone",
    ] as const;

    const hasPersonalDetailsChanged = React.useMemo(() => {
        if (!isExistingCustomer || !initialPersonalSnapshot) return false;
        return personalFieldsToCompare.some(field => {
            const currentVal = (formValues[field] ?? "").toString().trim();
            const initialVal = (initialPersonalSnapshot[field] ?? "").toString().trim();
            return currentVal !== initialVal;
        });
    }, [isExistingCustomer, initialPersonalSnapshot, formValues]);

    // Handle room selection: fetch current tariff from backend and prefill financial fields
    const handleRoomSelect = async (room: Room) => {
        setSelectedRoomObj(room);
        const rTypeId = room.roomTypeId || (room as any)?.roomType?.id;
        if (rTypeId) {
            setIsFetchingTariff(true);
            try {
                const res = await roomTariffService.getCurrentRoomTariff(rTypeId);
                if (res.data) {
                    const tariff = res.data;
                    setSelectedTariffId(tariff.id);
                    setValue("roomTariffId", tariff.id);
                    setValue("monthlyRent", tariff.monthlyRent, { shouldValidate: true });
                    setValue("advanceAmount", tariff.securityDepositRequired, { shouldValidate: true });
                    if (tariff.dailyRate) {
                        setValue("dailyRate", tariff.dailyRate, { shouldValidate: true });
                    }
                }
            } catch (err) {
                console.warn("Could not fetch current tariff for room type, using room defaults:", err);
            } finally {
                setIsFetchingTariff(false);
            }
        }
    };

    // Initial charges calculation per Plan
    const isDaily = watchedBillingMode === "DAILY";
    const primaryCharge = isDaily ? watchedDailyRate : watchedRent;
    const totalInitialCharges = primaryCharge + watchedAdvance;
    const calculatedRemainingDue = Math.max(0, totalInitialCharges - watchedPaid);

    // Determine advance status
    const getAdvanceStatus = (): "Paid" | "Unpaid" | "Partial" => {
        if (formValues.amountPaid >= totalInitialCharges && totalInitialCharges > 0) return "Paid";
        if (formValues.amountPaid > 0) return "Partial";
        return "Unpaid";
    };

    // Filter customer directory: strictly exclude daily basis customers (managed exclusively in Daily Rooms page)
    const filteredCustomers = directory.filter(c => {
        if (c.billingMode === "DAILY") return false;
        const nameMatch = (c.name || "").toLowerCase().includes(searchTerm.toLowerCase());
        const roomMatch = (c.roomNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
        const mobileMatch = (c.mobileNumber || "").includes(searchTerm);
        return nameMatch || roomMatch || mobileMatch;
    });

    const handleAadhaarSearch = async () => {
        const isValid = await trigger("aadhaarNumber");
        if (!isValid) return;

        const aadhaar = watchedAadhaar;
        if (!aadhaar) return;
        setSearchStatus({
            type: "searching",
            message: "Checking database records...",
        });

        try {
            const response = await customerService.getCustomer(aadhaar);
            if (response.code === 200 && response.data) {
                const customer: any = (response.data as any)?.data || response.data;
                if (customer?.id) {
                    const cId = Number(customer.id);
                    setPersistedCustomerId(cId);

                    // Check if customer already has an active room allocation
                    try {
                        const allocRes = await roomAllocationService.getActiveAllocationByCustomer(cId);
                        const activeAlloc = allocRes.data && (allocRes.data as any).data ? (allocRes.data as any).data : allocRes.data;
                        if (activeAlloc && (activeAlloc.status === "ACTIVE" || activeAlloc.roomNumber || activeAlloc.roomId)) {
                            setActiveAllocation(activeAlloc);
                        } else {
                            setActiveAllocation(null);
                        }
                    } catch {
                        setActiveAllocation(null);
                    }
                }
                // Pre-fill form fields
                setValue("firstName", customer.firstName || (customer.fullName ? customer.fullName.split(" ")[0] : ""));
                setValue("lastName", customer.lastName || (customer.fullName ? customer.fullName.split(" ").slice(1).join(" ") : ""));
                setValue("gender", customer.gender || "Male");
                setValue("dateOfBirth", customer.dateOfBirth || "");
                setValue("email", customer.email || "");
                setValue("mobileNumber", customer.mobileNumber || "");
                setValue("altMobileNumber", customer.altMobileNumber || "");
                setValue("permanentAddress", customer.permanentAddress || "");
                setValue("occupation", customer.occupation || "");
                setValue("emergencyContactName", customer.emergencyContactName || "");
                setValue("emergencyContactPhone", customer.emergencyContactPhone || "");

                setIsExistingCustomer(true);
                setIsEditingPersonalDetails(false);
                setInitialPersonalSnapshot({
                    firstName: customer.firstName || (customer.fullName ? customer.fullName.split(" ")[0] : ""),
                    lastName: customer.lastName || (customer.fullName ? customer.fullName.split(" ").slice(1).join(" ") : ""),
                    gender: customer.gender || "Male",
                    dateOfBirth: customer.dateOfBirth || "",
                    email: customer.email || "",
                    mobileNumber: customer.mobileNumber || "",
                    altMobileNumber: customer.altMobileNumber || "",
                    permanentAddress: customer.permanentAddress || "",
                    aadhaarNumber: aadhaar || "",
                    occupation: customer.occupation || "",
                    emergencyContactName: customer.emergencyContactName || "",
                    emergencyContactPhone: customer.emergencyContactPhone || "",
                });

                const fullName = customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
                setSearchStatus({
                    type: "success",
                    message: `Customer profile found: ${fullName}. You can proceed to the next step.`,
                    customerName: fullName,
                });
            } else {
                setIsExistingCustomer(false);
                setIsEditingPersonalDetails(true);
                setInitialPersonalSnapshot(null);
                setSearchStatus({
                    type: "not_found",
                    message: "No existing record found for this Aadhaar card number. Proceeding with new customer registration.",
                });
            }
        } catch (error) {
            console.error("API error searching customer: ", error);
            setIsExistingCustomer(false);
            setIsEditingPersonalDetails(true);
            setInitialPersonalSnapshot(null);
            setSearchStatus({
                type: "not_found",
                message: "No existing record found for this Aadhaar card number. Proceeding with new customer registration.",
            });
        }
    };

    // Handle opening add modal
    const handleOpenAdd = useCallback(() => {
        setEditCustomerId(null);
        setPersistedCustomerId(null);
        setSelectedRoomObj(null);
        setSelectedTariffId(null);
        setIsFetchingTariff(false);
        setActiveAllocation(null);
        setIsCheckingAllocation(false);
        setIsSavingCustomer(false);
        setIsSubmitting(false);
        setIsExistingCustomer(false);
        setIsEditingPersonalDetails(true);
        setInitialPersonalSnapshot(null);
        setWizardStep(1);
        setSearchStatus({ type: "idle", message: "" });
        reset({
            firstName: "",
            lastName: "",
            gender: "Male",
            dateOfBirth: "",
            email: "",
            mobileNumber: "",
            altMobileNumber: "",
            permanentAddress: "",
            aadhaarNumber: "",
            emergencyContactName: "",
            emergencyContactPhone: "",
            occupation: "",
            provideMissingDetailsLater: false,
            floor: "1",
            roomNumber: "",
            bedNumber: "A",
            checkOutDate: "",
            billingMode: "MONTHLY",
            dailyRate: 0,
            monthlyRent: settings.defaultMonthlyRent,
            advanceAmount: settings.defaultAdvanceAmount,
            amountPaid: 0,
            paymentMethod: "CASH",
            roomTariffId: null,
            previousDue: 0,
            paymentStatus: "PENDING",
            joinDate: new Date().toISOString().substring(0, 10),
        });
        setIsModalOpen(true);
    }, [reset, settings.defaultMonthlyRent, settings.defaultAdvanceAmount]);

    // Automatically trigger Add Customer modal if navigated with ?action=new
    useEffect(() => {
        const action = searchParams.get("action");
        if (action === "new") {
            handleOpenAdd();
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("action");
            setSearchParams(nextParams, { replace: true });
        }
    }, [searchParams, handleOpenAdd, setSearchParams]);

    const handleNextStep = async () => {
        if (isSavingCustomer || isCheckingAllocation || isFetchingTariff || isSubmitting) return;

        let fieldsToValidate: (keyof CustomerFormValues)[] = [];
        if (wizardStep === 1) {
            if (watchedAadhaar && watchedAadhaar.trim().length > 0) {
                fieldsToValidate = ["aadhaarNumber"];
            } else {
                setValue("provideMissingDetailsLater", true);
                fieldsToValidate = [];
            }
        } else if (wizardStep === 2) {
            fieldsToValidate = [
                "firstName",
                "lastName",
                "gender",
                "dateOfBirth",
                "email",
                "mobileNumber",
                "altMobileNumber",
                "permanentAddress",
                "emergencyContactName",
                "emergencyContactPhone",
                "occupation",
            ];
        } else if (wizardStep === 3) {
            fieldsToValidate = ["floor", "roomNumber", "bedNumber", "checkOutDate"];
        } else if (wizardStep === 4) {
            fieldsToValidate = ["monthlyRent", "dailyRate", "advanceAmount", "amountPaid"];
        }

        const isValid = await trigger(fieldsToValidate);
        if (isValid) {
            if (wizardStep === 2) {
                let custIdToCheck = persistedCustomerId;
                const currentValues = watch();
                const personalData = {
                    firstName: currentValues.firstName.trim(),
                    lastName: currentValues.lastName.trim(),
                    gender: currentValues.gender,
                    dateOfBirth: currentValues.dateOfBirth ? currentValues.dateOfBirth : null,
                    mobileNumber: currentValues.mobileNumber.trim(),
                    altMobileNumber: currentValues.altMobileNumber ? currentValues.altMobileNumber.trim() : null,
                    email: currentValues.email ? currentValues.email.trim() : null,
                    aadhaarNumber: currentValues.aadhaarNumber ? currentValues.aadhaarNumber.trim() : null,
                    occupation: currentValues.occupation ? currentValues.occupation.trim() : null,
                    emergencyContactName: currentValues.emergencyContactName ? currentValues.emergencyContactName.trim() : null,
                    emergencyContactPhone: currentValues.emergencyContactPhone ? currentValues.emergencyContactPhone.trim() : null,
                    permanentAddress: currentValues.permanentAddress ? currentValues.permanentAddress.trim() : null,
                };

                // Only persist customer to database if it's a new customer or personal details have changed
                if (!isExistingCustomer || hasPersonalDetailsChanged) {
                    setIsSavingCustomer(true);
                    try {
                        const response = await customerService.saveCustomer(personalData as any);
                        if (response.code === 200 || response.code === 201) {
                            const saved = (response.data as any)?.data || response.data;
                            if (saved?.id) {
                                custIdToCheck = Number(saved.id);
                                setPersistedCustomerId(custIdToCheck);
                            }
                            toast.success("Customer personal details saved to database.");
                            setInitialPersonalSnapshot({
                                firstName: personalData.firstName,
                                lastName: personalData.lastName,
                                gender: personalData.gender,
                                dateOfBirth: personalData.dateOfBirth || "",
                                email: personalData.email || "",
                                mobileNumber: personalData.mobileNumber,
                                altMobileNumber: personalData.altMobileNumber || "",
                                permanentAddress: personalData.permanentAddress || "",
                                aadhaarNumber: personalData.aadhaarNumber || "",
                                occupation: personalData.occupation || "",
                                emergencyContactName: personalData.emergencyContactName || "",
                                emergencyContactPhone: personalData.emergencyContactPhone || "",
                            });
                        } else {
                            console.warn("Could not save customer personal details to backend:", response.data ?? response.description);
                            toast.error("Failed to save customer personal details.");
                            return;
                        }
                    } catch (err: any) {
                        console.warn("Could not save customer details to backend:", err);
                        toast.error(err?.message || "Failed to save customer personal details.");
                        return;
                    } finally {
                        setIsSavingCustomer(false);
                    }
                }

                if (!custIdToCheck && editCustomerId) {
                    custIdToCheck = Number(editCustomerId);
                }

                // Check if this customer already has an active room allocation in the hostel
                if (custIdToCheck) {
                    setIsCheckingAllocation(true);
                    try {
                        const allocRes = await roomAllocationService.getActiveAllocationByCustomer(custIdToCheck);
                        const activeAlloc = allocRes.data;

                        if (activeAlloc && (activeAlloc.status === "ACTIVE" || activeAlloc.roomNumber || activeAlloc.roomId)) {
                            setActiveAllocation(activeAlloc);
                            const roomDisplay = activeAlloc.roomNumber ? `Room ${activeAlloc.roomNumber}` : `Room #${activeAlloc.roomId}`;
                            const personName = `${personalData.firstName} ${personalData.lastName}`.trim() || activeAlloc.customerName || "Customer";
                            toast.error(`${personName} already allocated to ${roomDisplay}`);
                            return; // Deny advancing into Room Allocation!
                        } else {
                            setActiveAllocation(null);
                        }
                    } catch (allocErr) {
                        console.warn("Could not check customer active allocation:", allocErr);
                    } finally {
                        setIsCheckingAllocation(false);
                    }
                }
            }

            if (wizardStep === 3 && activeAllocation) {
                const roomDisplay = activeAllocation.roomNumber ? `Room ${activeAllocation.roomNumber}` : `Room #${activeAllocation.roomId}`;
                const bedDisplay = activeAllocation.bedNumber ? ` (Bed ${activeAllocation.bedNumber})` : "";
                toast.error(`Cannot allocate: This resident already occupies ${roomDisplay}${bedDisplay}. They must be removed from their current room first.`);
                return;
            }

            setWizardStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        const minStep = editCustomerId ? 2 : 1;
        setWizardStep(prev => Math.max(minStep, prev - 1));
    };

    const handleSave = async (data: CustomerFormValues) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const isDailyStay = data.billingMode === "DAILY";
            const primaryChargeAmount = isDailyStay ? (data.dailyRate || 0) : data.monthlyRent;
            const totalInitialCharges = primaryChargeAmount + data.advanceAmount;
            const calculatedRemainingDue = Math.max(0, totalInitialCharges - data.amountPaid);
            const derivedPaymentStatus: PaymentStatus =
                data.amountPaid <= 0
                    ? "PENDING"
                    : data.amountPaid >= totalInitialCharges
                      ? "SUCCESS"
                      : "PENDING";

            const payload: Omit<Customer, "id"> = {
                fullName: `${data.firstName} ${data.lastName}`.trim(),
                firstName: data.firstName,
                lastName: data.lastName,
                gender: data.gender,
                dateOfBirth: data.dateOfBirth || "",
                email: data.email || "",
                mobileNumber: data.mobileNumber,
                altMobileNumber: data.altMobileNumber || "",
                permanentAddress: data.permanentAddress || "",
                aadhaarNumber: data.aadhaarNumber || "",
                emergencyContactName: data.emergencyContactName || "",
                emergencyContactPhone: data.emergencyContactPhone || "",
                occupation: data.occupation || "",
                provideMissingDetailsLater: data.provideMissingDetailsLater,
                floor: data.floor,
                roomNumber: data.roomNumber,
                bedNumber: data.bedNumber || "A",
                checkOutDate: data.checkOutDate || undefined,
                billingMode: data.billingMode,
                dailyRate: data.billingMode === "DAILY" ? (data.dailyRate || undefined) : undefined,
                monthlyRent: data.monthlyRent,
                advanceAmount: data.advanceAmount,
                amountPaid: data.amountPaid,
                dueAmount: calculatedRemainingDue,
                previousDue: data.previousDue ?? 0,
                advanceStatus: getAdvanceStatus(),
                paymentStatus: (data.paymentStatus as any) || derivedPaymentStatus,
                paymentMethod: (data.paymentMethod as PaymentMethod) || "CASH",
                roomTariffId: selectedTariffId || (data.roomTariffId ? Number(data.roomTariffId) : null),
                joinDate: data.joinDate,
            };

            let customerIdToUse = persistedCustomerId;
            if (!customerIdToUse && editCustomerId) {
                customerIdToUse = Number(editCustomerId);
            }

            if (editCustomerId) {
                try {
                    await customerService.editCustomer(editCustomerId, payload as any);
                    toast.info(`Customer profile for "${payload.fullName}" has been updated.`);
                } catch (err: any) {
                    toast.error(err?.message || "Failed to update customer profile.");
                    return;
                }
            } else {
                // Perform backend Customer Stay registration if customerId & roomId are available
                if (customerIdToUse && selectedRoomObj && selectedRoomObj.id) {
                    try {
                        const stayRes = await customerStayService.createCustomerStay({
                            customerId: customerIdToUse,
                            hostelId: hostel?.id ? Number(hostel.id) : undefined,
                            roomId: Number(selectedRoomObj.id),
                            bedNumber: data.bedNumber || undefined,
                            checkInDate: data.joinDate,
                            checkOutDate: data.checkOutDate || undefined,
                            financialTerms: {
                                roomTariffId: selectedTariffId || (data.roomTariffId ? Number(data.roomTariffId) : null),
                                billingMode: data.billingMode,
                                dailyRate: data.billingMode === "DAILY" ? (data.dailyRate || undefined) : undefined,
                                monthlyRent: data.billingMode === "DAILY" ? 0 : data.monthlyRent,
                                securityDepositRequired: data.advanceAmount,
                                billingAnchorDate: data.joinDate,
                            },
                            initialPayment: data.amountPaid > 0 ? {
                                amount: data.amountPaid,
                                paymentMode: (data.paymentMethod as PaymentMethod) || "CASH",
                                notes: `Initial registration payment for Room ${data.roomNumber}${data.bedNumber ? ` Bed ${data.bedNumber}` : ""}`,
                            } : undefined,
                        });

                        if (stayRes.code < 200 || stayRes.code >= 300) {
                            toast.error(stayRes.description || "Failed to complete room allocation.");
                            return;
                        }
                    } catch (apiErr: any) {
                        console.warn("Could not complete backend customer stay registration:", apiErr);
                        const errorMsg = apiErr?.response?.data?.message || apiErr?.description || apiErr?.message;
                        toast.error(errorMsg || "Room allocation failed.");
                        return;
                    }
                }

                toast.success(`Customer "${payload.fullName}" registered successfully.`);
            }

            // Immediately close wizard modal so customer cannot click again
            setIsModalOpen(false);

            // Refresh rooms so capacity is updated in frontend
            try {
                const freshRooms = await roomService.getRooms();
                if (freshRooms && Array.isArray(freshRooms.data)) {
                    setDbRooms(freshRooms.data);
                }
            } catch {
                // ignore
            }

            // Refresh live directory from backend
            await loadDirectory();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirmId) {
            const customerToDelete = directory.find(c => String(c.customerId) === deleteConfirmId);
            try {
                await customerService.deleteCustomer(deleteConfirmId);
                toast.warning(`Customer profile for "${customerToDelete?.name || "resident"}" removed.`);
                await loadDirectory();
            } catch (err: any) {
                toast.error(err?.message || "Failed to delete customer.");
            }
            setDeleteConfirmId(null);
        }
    };

    // Handle Pay button click — opens pay modal
    const handleOpenPayModal = (row: CustomerDirectoryItem, e: React.MouseEvent) => {
        e.stopPropagation();
        setPayModalCustomer(row);
    };


    // Columns definition for Customer Directory table
    const columns = [
        {
            header: "Room",
            accessor: (row: CustomerDirectoryItem) => (
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span>{row.roomNumber || "—"}</span>
                    {row.bedNumber && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                            {row.bedNumber}
                        </span>
                    )}
                </div>
            ),
            sortable: true,
            sortKey: "roomNumber",
        },
        {
            header: "Name",
            accessor: (row: CustomerDirectoryItem) => (
                <div className="font-semibold text-slate-900 hover:text-indigo-600 transition">{row.name}</div>
            ),
            sortable: true,
            sortKey: "name",
        },
        {
            header: "Mobile",
            accessor: (row: CustomerDirectoryItem) => (
                <span className="font-mono text-slate-600 text-xs">{row.mobileNumber}</span>
            ),
        },
        {
            header: "Rent",
            accessor: (row: CustomerDirectoryItem) => (
                <div>
                    <span className="font-semibold text-slate-800">
                        {settings.currencySymbol}
                        {Number(row.monthlyRent || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                        per month
                    </span>
                </div>
            ),
            sortable: true,
            sortKey: "monthlyRent",
        },
        {
            header: "Paid",
            accessor: (row: CustomerDirectoryItem) => (
                <div>
                    <span className="font-semibold text-emerald-600">
                        {settings.currencySymbol}{Number(row.paidRent || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="block text-[10px] text-slate-400">Current cycle</span>
                </div>
            ),
            sortable: true,
            sortKey: "paidRent",
        },
        {
            header: "Deposit",
            accessor: (row: CustomerDirectoryItem) => (
                <span className="font-semibold text-slate-800">
                    {settings.currencySymbol}{Number(row.securityDeposit || 0).toLocaleString("en-IN")}
                </span>
            ),
            sortable: true,
            sortKey: "securityDeposit",
        },
        {
            header: "Deposit Paid",
            accessor: (row: CustomerDirectoryItem) => (
                <span className="font-semibold text-emerald-600">
                    {settings.currencySymbol}{Number(row.securityDepositPaid || 0).toLocaleString("en-IN")}
                </span>
            ),
            sortable: true,
            sortKey: "securityDepositPaid",
        },
        {
            header: "Due",
            accessor: (row: CustomerDirectoryItem) => {
                const bal = Number(row.outstandingBalance || 0);
                return (
                    <span
                        className={`font-semibold ${
                            bal > 0 ? "text-rose-600 font-bold" : "text-emerald-600"
                        }`}
                    >
                        {settings.currencySymbol}{bal.toLocaleString("en-IN")}
                    </span>
                );
            },
            sortable: true,
            sortKey: "outstandingBalance",
        },
        {
            header: "Latest",
            accessor: (row: CustomerDirectoryItem) => {
                if (!row.latestPaymentDate) return <span className="text-slate-400">—</span>;
                return formatDate(row.latestPaymentDate, "2-digit");
            },
            sortable: true,
            sortKey: "latestPaymentDate",
        },
        {
            header: "Actions",
            accessor: (row: CustomerDirectoryItem) => {
                const isExited =
                    row.customerStatus === "INACTIVE" ||
                    row.allocationStatus === "ENDED" ||
                    (!row.allocationStatus && Boolean(row.checkOutDate));

                if (isExited) {
                    return (
                        <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg border border-slate-200">
                                Exited
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={(e) => handleOpenPayModal(row, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition cursor-pointer"
                            title="Record payment"
                        >
                            <IndianRupee className="w-3 h-3" />
                            Pay
                        </button>
                        {row.allocationId && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEndStayTarget(row);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                                title="End customer stay & checkout"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Exit</span>
                            </button>
                        )}
                    </div>
                );
            },
        },
    ];

    // Active rooms from backend DB
    const activeRooms: Room[] = dbRooms;

    // Dynamic floor options from configured hostel floors or distinct room floors
    const configuredTotalFloors = hostel?.totalFloors;
    const distinctRoomFloors: string[] = Array.from(new Set(activeRooms.map(r => String(r.floor || "")).filter(Boolean)));
    const maxFloorNum = Math.max(0, ...distinctRoomFloors.map(f => parseInt(f, 10)).filter(n => !isNaN(n)));

    const totalFloorsCount = configuredTotalFloors && configuredTotalFloors > 0 ? configuredTotalFloors : maxFloorNum;

    const floorOptions: { value: string; label: string }[] =
        totalFloorsCount > 0
            ? Array.from({ length: totalFloorsCount }, (_, i) => ({
                  value: String(i + 1),
                  label: `Floor ${i + 1}`,
              }))
            : distinctRoomFloors.sort().map(f => ({
                  value: String(f),
                  label: `Floor ${f}`,
              }));

    // Room grid contribution style maps
    const selectedFloorRooms = activeRooms.filter(r => String(r.floor) === String(watchedFloor));

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader
                title="Customer Directory & Reservations"
                description="Register customers, manage billing details, and allocate beds."
                action={
                    <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 focus:outline-none"
                    >
                        <Plus className="h-4 w-4" />+ New Customer
                    </button>
                }
            />

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by name, room, or mobile..." />
            </div>

            {/* Customer Directory Table */}
            <DataTable
                columns={columns as any}
                data={filteredCustomers}
                emptyTitle={isLoadingDirectory ? "Loading customer directory..." : "No customers registered"}
                emptyDescription={isLoadingDirectory ? "Fetching live records from hostel database..." : "Click '+ New Customer' to register a new customer profile."}
                onRowClick={(row: any) => setFinancialModalCustomer({ id: row.customerId, name: row.name })}
            />

            {/* Add/Edit Wizard Modal rendered via portal to cover entire page */}
            {isModalOpen &&
                createPortal(
                    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                        {/* Full-screen subtle backdrop covering header + sidebar + main content */}
                        <div
                            className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-200"
                            onClick={() => setIsModalOpen(false)}
                            aria-hidden="true"
                        ></div>

                        <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-6">
                            {/* Modal Body with rounded-3xl corners */}
                            <div
                                className="relative w-full max-w-3xl p-6 sm:p-7 text-left align-middle transition-all transform bg-white rounded-3xl shadow-2xl border border-slate-200/80 my-8"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">
                                            {editCustomerId ? "Modify Customer Profile" : "Register New Customer"}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            Step {wizardStep} of {editCustomerId ? 4 : 5}: Fill customer configuration fields.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                                        aria-label="Close modal"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Wizard Steps indicator bar */}
                                <div className="flex items-center justify-between gap-2 mb-6">
                                    {(editCustomerId
                                        ? [
                                              {
                                                  step: 2,
                                                  label: "Personal Details",
                                                  icon: <Contact className="w-4 h-4" />,
                                              },
                                              {
                                                  step: 3,
                                                  label: "Room Allocation",
                                                  icon: <Building className="w-4 h-4" />,
                                              },
                                              {
                                                  step: 4,
                                                  label: "Financial Info",
                                                  icon: <CreditCard className="w-4 h-4" />,
                                              },
                                              {
                                                  step: 5,
                                                  label: "Summary Review",
                                                  icon: <UserCheck className="w-4 h-4" />,
                                              },
                                          ]
                                        : [
                                              {
                                                  step: 1,
                                                  label: "Aadhaar Lookup",
                                                  icon: <Search className="w-4 h-4" />,
                                              },
                                              {
                                                  step: 2,
                                                  label: "Personal Details",
                                                  icon: <Contact className="w-4 h-4" />,
                                              },
                                              {
                                                  step: 3,
                                                  label: "Room Allocation",
                                                  icon: <Building className="w-4 h-4" />,
                                              },
                                              {
                                                  step: 4,
                                                  label: "Financial Info",
                                                  icon: <CreditCard className="w-4 h-4" />,
                                              },
                                              {
                                                  step: 5,
                                                  label: "Summary Review",
                                                  icon: <UserCheck className="w-4 h-4" />,
                                              },
                                          ]
                                    ).map(item => (
                                        <div
                                            key={item.step}
                                            className={`flex items-center gap-1.5 pb-2 border-b-2 flex-1 text-center justify-center ${
                                                wizardStep >= item.step
                                                    ? "border-indigo-600 text-indigo-600 font-bold"
                                                    : "border-slate-200 text-slate-400 font-medium"
                                            }`}
                                        >
                                            {item.icon}
                                            <span className="text-xs hidden sm:inline">{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleSubmit(handleSave as any)} className="space-y-6">
                                    {/* Step 1: Aadhaar Lookup */}
                                    {wizardStep === 1 && !editCustomerId && (
                                        <CustomerRegistrationAadhaarLookupForm
                                            register={register}
                                            errors={errors}
                                            watchedAadhaar={watchedAadhaar || ""}
                                            searchStatus={searchStatus}
                                            onSearch={handleAadhaarSearch}
                                        />
                                    )}

                                    {/* Step 2: Personal Details */}
                                    {wizardStep === 2 && (
                                        <CustomerRegistrationPersonalDetailsForm
                                            register={register}
                                            errors={errors}
                                            isExistingCustomer={isExistingCustomer}
                                            isEditing={isEditingPersonalDetails}
                                            onToggleEdit={() => setIsEditingPersonalDetails(prev => !prev)}
                                            provideMissingDetailsLater={watchedMissingDetailsLater}
                                        />
                                    )}

                                    {/* Step 3: Room Allocation */}
                                    {wizardStep === 3 && (
                                        <CustomerRegistrationRoomAllocationForm
                                            register={register}
                                            errors={errors}
                                            setValue={setValue}
                                            watchedFloor={watchedFloor}
                                            watchedRoom={watchedRoom}
                                            selectedFloorRooms={selectedFloorRooms}
                                            floorOptions={floorOptions}
                                            onRoomSelect={handleRoomSelect}
                                            activeAllocation={activeAllocation}
                                        />
                                    )}

                                    {/* Step 4: Financial Information */}
                                    {wizardStep === 4 && (
                                        <CustomerRegistrationFinancialInfoForm
                                            register={register}
                                            errors={errors}
                                            settings={settings}
                                            billingMode="MONTHLY"
                                            watchedRent={watchedRent}
                                            watchedDailyRate={watchedDailyRate}
                                            watchedSecurityDeposit={watchedAdvance}
                                            watchedPaid={watchedPaid}
                                            setValue={setValue}
                                        />
                                    )}

                                    {/* Step 5: Summary Check & Review Card */}
                                    {wizardStep === 5 && (
                                        <CustomerRegistrationSummaryReviewForm
                                            formValues={formValues}
                                            settings={settings}
                                            calculatedRemainingDue={calculatedRemainingDue}
                                        />
                                    )}

                                    {/* Footer Controls */}
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                        <div>
                                            {wizardStep > (editCustomerId ? 2 : 1) && (
                                                <button
                                                    type="button"
                                                    onClick={handlePrevStep}
                                                    disabled={isSavingCustomer || isCheckingAllocation || isFetchingTariff || isSubmitting}
                                                    className={`inline-flex items-center gap-1 px-4 py-2 border rounded-xl text-xs font-semibold shadow-sm transition ${
                                                        isSavingCustomer || isCheckingAllocation || isFetchingTariff || isSubmitting
                                                            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                            : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                                                    }`}
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                    Back
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                disabled={isSavingCustomer || isCheckingAllocation || isFetchingTariff || isSubmitting}
                                                className={`px-4 py-2 border rounded-xl text-xs font-semibold shadow-sm transition ${
                                                    isSavingCustomer || isCheckingAllocation || isFetchingTariff || isSubmitting
                                                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                                        : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50 cursor-pointer"
                                                }`}
                                            >
                                                Cancel
                                            </button>
                                            {wizardStep < 5 ? (
                                                <button
                                                    key="btn-next"
                                                    type="button"
                                                    onClick={handleNextStep}
                                                    disabled={
                                                        isSavingCustomer ||
                                                        isCheckingAllocation ||
                                                        isFetchingTariff ||
                                                        isSubmitting ||
                                                        (wizardStep === 3 && Boolean(activeAllocation))
                                                    }
                                                    className={`inline-flex items-center justify-center min-w-[76px] gap-1 px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition ${
                                                        isSavingCustomer ||
                                                        isCheckingAllocation ||
                                                        isFetchingTariff ||
                                                        isSubmitting ||
                                                        (wizardStep === 3 && Boolean(activeAllocation))
                                                            ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                                                            : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 cursor-pointer"
                                                    }`}
                                                >
                                                    {isSavingCustomer || isCheckingAllocation || isFetchingTariff ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <span>
                                                                {wizardStep === 2 && isExistingCustomer && hasPersonalDetailsChanged ? "Save and Next" : "Next"}
                                                            </span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    key="btn-save"
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className={`inline-flex items-center justify-center min-w-[100px] gap-1 px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition ${
                                                        isSubmitting
                                                            ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                                                            : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 cursor-pointer"
                                                    }`}
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <span>Save & Enlist</span>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* Delete Confirmation Alert */}
            <ConfirmDialog
                isOpen={deleteConfirmId !== null}
                title="Remove Customer Profile"
                description="Are you sure you want to delete this customer? Removing profile will decrease room occupancy beds count and clear biometric registration."
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmId(null)}
            />

            {/* End Stay / Checkout Settlement Modals (Daily or Monthly) */}
            {endStayTarget?.billingMode === "DAILY" ? (
                <DailyCheckoutModal
                    isOpen={endStayTarget !== null}
                    target={endStayTarget}
                    onClose={() => setEndStayTarget(null)}
                    onSuccess={async () => {
                        await loadDirectory();
                        await loadRooms();
                    }}
                />
            ) : (
                <MonthlyCheckoutModal
                    isOpen={endStayTarget !== null}
                    target={endStayTarget}
                    onClose={() => setEndStayTarget(null)}
                    onSuccess={async () => {
                        await loadDirectory();
                        await loadRooms();
                    }}
                />
            )}

            {/* Customer Financial Ledger Modal */}
            <CustomerFinancialModal
                isOpen={!!financialModalCustomer}
                onClose={() => setFinancialModalCustomer(null)}
                customerId={financialModalCustomer?.id || null}
                customerName={financialModalCustomer?.name}
            />

            {/* Pay Modal */}
            <PayModal
                isOpen={!!payModalCustomer}
                customer={payModalCustomer}
                onClose={() => setPayModalCustomer(null)}
                onSuccess={loadDirectory}
            />
        </div>
    );
};
