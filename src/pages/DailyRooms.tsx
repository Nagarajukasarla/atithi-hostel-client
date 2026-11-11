import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { SearchBar } from "@/components/common/SearchBar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    CalendarDays,
    Plus,
    BedDouble,
    IndianRupee,
    AlertCircle,
    Phone,
    Calendar,
    LogOut,
    Receipt,
    Loader2,
    X,
    ChevronRight,
    ChevronLeft,
    CreditCard,
    Building,
    UserCheck,
    Contact,
} from "lucide-react";
import type { Room, RoomAllocation, PaymentMethod } from "@/types";
import { customerService, type CustomerDirectoryItem } from "@/api/customerService";
import { roomService } from "@/api/roomService";
import { roomAllocationService } from "@/api/roomAllocationService";
import { calculateDaysBetween } from "@/utils";
import { roomTariffService } from "@/api/roomTariffService";
import { customerStayService } from "@/api/customerStayService";
import { useStatistics } from "@/context/StatisticsContext";
import { CustomerRegistrationAadhaarLookupForm } from "@/components/feature/CustomerRegistrationAadhaarLookupForm";
import { CustomerRegistrationPersonalDetailsForm } from "@/components/feature/CustomerRegistrationPersonalDetailsForm";
import { CustomerRegistrationRoomAllocationForm } from "@/components/feature/CustomerRegistrationRoomAllocationForm";
import { CustomerRegistrationFinancialInfoForm } from "@/components/feature/CustomerRegistrationFinancialInfoForm";
import { CustomerRegistrationSummaryReviewForm } from "@/components/feature/CustomerRegistrationSummaryReviewForm";
import { CustomerFinancialModal } from "@/components/feature/CustomerFinancialModal";
import { DailyCheckoutModal } from "@/components/feature/DailyCheckoutModal";
import { PayModal } from "@/components/feature/PayModal";

// Validation schema for Daily stay registration (relaxed KYC details by default)
const dailyStaySchema = z
    .object({
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
        provideMissingDetailsLater: z.boolean().default(true),
        floor: z.string().min(1, "Required"),
        roomNumber: z.string().min(1, "Select a room"),
        bedNumber: z.string().optional(),
        checkOutDate: z.string().optional().or(z.literal("")),
        billingMode: z.literal("DAILY").default("DAILY"),
        dailyRate: z.number().min(1, "Daily rate must be greater than 0"),
        monthlyRent: z.number().default(0),
        advanceAmount: z.number().min(0, "Must be positive").default(0),
        amountPaid: z.number().min(0, "Must be positive").default(0),
        paymentMethod: z.string().optional(),
        roomTariffId: z.number().optional().nullable(),
        previousDue: z.number().optional(),
        paymentStatus: z.string().optional(),
        joinDate: z.string().min(1, "Required"),
    })
    .superRefine((data, ctx) => {
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
    });

type DailyStayFormValues = z.infer<typeof dailyStaySchema>;

export const DailyRooms: React.FC = () => {
    const { hostel } = useAuth();
    const { settings } = useSettings();
    const { toast } = useToast();

    // Live directory and rooms state
    const [searchParams] = useSearchParams();
    const [directory, setDirectory] = useState<CustomerDirectoryItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [dbRooms, setDbRooms] = useState<Room[]>([]);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Upcoming" | "Due">("All");

    // Shared live dashboard statistics for KPI cards
    const { stats, isLoading: isLoadingStats, refreshStatistics } = useStatistics();

    useEffect(() => {
        const q = searchParams.get("search");
        if (q !== null) {
            setSearchTerm(q);
        }
    }, [searchParams]);

    // Wizard modal state
    const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
    const [wizardStep, setWizardStep] = useState<number>(1);
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
    const [searchStatus, setSearchStatus] = useState<{
        type: "idle" | "searching" | "success" | "not_found" | "error";
        message: string;
        customerName?: string;
    }>({ type: "idle", message: "" });

    // Modals state for row actions
    const [financialModalCustomer, setFinancialModalCustomer] = useState<{ id: number | string; name: string } | null>(null);
    const [payModalCustomer, setPayModalCustomer] = useState<CustomerDirectoryItem | null>(null);
    const [endStayTarget, setEndStayTarget] = useState<CustomerDirectoryItem | null>(null);

    // Form hook
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        reset,
        formState: { errors },
    } = useForm<DailyStayFormValues>({
        resolver: zodResolver(dailyStaySchema) as any,
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
            provideMissingDetailsLater: true,
            floor: "1",
            roomNumber: "",
            bedNumber: "A",
            checkOutDate: "",
            billingMode: "DAILY",
            dailyRate: 0,
            monthlyRent: 0,
            advanceAmount: 0,
            amountPaid: 0,
            paymentMethod: "CASH",
            roomTariffId: null,
            previousDue: 0,
            paymentStatus: "PENDING",
            joinDate: new Date().toISOString().substring(0, 10),
        },
    });

    const watchedFloor = watch("floor");
    const watchedAadhaar = watch("aadhaarNumber");
    const watchedRent = watch("monthlyRent") || 0;
    const watchedDailyRate = watch("dailyRate") || 0;
    const watchedAdvance = watch("advanceAmount") || 0;
    const watchedPaid = watch("amountPaid") || 0;
    const watchedRoom = watch("roomNumber");
    const watchedMissingDetailsLater = watch("provideMissingDetailsLater");
    const formValues = watch();

    // Load directory from backend
    const loadDirectory = async () => {
        setIsLoading(true);
        try {
            const res = await customerService.getCustomerDirectory();
            if (res && Array.isArray(res.data)) {
                setDirectory(res.data);
            }
        } catch (err) {
            console.warn("Could not fetch customer directory:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load rooms
    const loadRooms = async () => {
        try {
            const res = await roomService.getRooms();
            if (res && Array.isArray(res.data)) {
                setDbRooms(res.data);
            }
        } catch (err) {
            console.warn("Could not fetch rooms:", err);
        }
    };

    useEffect(() => {
        loadDirectory();
        loadRooms();
    }, []);

    // Filter directory for DAILY billing mode
    const dailyCustomers = directory.filter(c => c.billingMode === "DAILY");
    const todayStr = new Date().toISOString().substring(0, 10);
    const activeRooms = dbRooms;

    // Filtered bookings based on search and status
    const filteredDailyCustomers = dailyCustomers.filter(c => {
        const nameMatch = (c.name || "").toLowerCase().includes(searchTerm.toLowerCase());
        const roomMatch = (c.roomNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
        const mobileMatch = (c.mobileNumber || "").includes(searchTerm);
        const matchesSearch = nameMatch || roomMatch || mobileMatch;

        if (!matchesSearch) return false;

        const isExited =
            c.customerStatus === "INACTIVE" ||
            c.allocationStatus === "ENDED" ||
            (!c.allocationStatus && Boolean(c.checkOutDate && c.checkOutDate < todayStr));
        const isUpcoming = c.joinDate && c.joinDate > todayStr;
        const hasDue = Number(c.outstandingBalance || 0) > 0;

        if (statusFilter === "Active") return !isUpcoming && !isExited;
        if (statusFilter === "Upcoming") return isUpcoming && !isExited;
        if (statusFilter === "Due") return hasDue;
        return true;
    });

    // Floor options
    const configuredTotalFloors = hostel?.totalFloors;
    const distinctRoomFloors = Array.from(new Set(activeRooms.map(r => String(r.floor || "")).filter(Boolean)));
    const maxFloorNum = Math.max(0, ...distinctRoomFloors.map(f => parseInt(f, 10)).filter(n => !isNaN(n)));
    const totalFloorsCount = configuredTotalFloors && configuredTotalFloors > 0 ? configuredTotalFloors : maxFloorNum;

    const floorOptions =
        totalFloorsCount > 0
            ? Array.from({ length: totalFloorsCount }, (_, i) => ({
                  value: String(i + 1),
                  label: `Floor ${i + 1}`,
              }))
            : distinctRoomFloors.sort().map(f => ({
                  value: f,
                  label: `Floor ${f}`,
              }));

    const selectedFloorRooms = activeRooms.filter(r => String(r.floor) === String(watchedFloor));

    // Handle room selection: fetch current tariff from backend and prefill daily rate
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
                    if (tariff.dailyRate) {
                        setValue("dailyRate", tariff.dailyRate, { shouldValidate: true });
                    }
                    setValue("advanceAmount", 0, { shouldValidate: true });
                }
            } catch (err) {
                console.warn("Could not fetch current tariff for room type:", err);
            } finally {
                setIsFetchingTariff(false);
            }
        }
    };

    // Calculate days between check-in and check-out
    const calculateDays = (startStr?: string, endStr?: string): number =>
        calculateDaysBetween(startStr, endStr);

    // Calculations for wizard review
    const totalInitialCharges = watchedDailyRate + watchedAdvance;
    const calculatedRemainingDue = Math.max(0, totalInitialCharges - watchedPaid);

    // Open Add Daily Booking wizard modal
    const handleOpenAdd = () => {
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
            provideMissingDetailsLater: true,
            floor: "1",
            roomNumber: "",
            bedNumber: "A",
            checkOutDate: "",
            billingMode: "DAILY",
            dailyRate: 0,
            monthlyRent: 0,
            advanceAmount: 0,
            amountPaid: 0,
            paymentMethod: "CASH",
            roomTariffId: null,
            previousDue: 0,
            paymentStatus: "PENDING",
            joinDate: new Date().toISOString().substring(0, 10),
        });
        setIsWizardOpen(true);
    };

    // Aadhaar search in wizard
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

                const fullName = customer.fullName || `${customer.firstName || ""} ${customer.lastName || ""}`.trim();
                setSearchStatus({
                    type: "success",
                    message: `Customer profile found: ${fullName}. You can proceed to the next step.`,
                    customerName: fullName,
                });
            } else {
                setIsExistingCustomer(false);
                setIsEditingPersonalDetails(true);
                setSearchStatus({
                    type: "not_found",
                    message: "No existing record found for this Aadhaar card number. Proceeding with new daily stay registration.",
                });
            }
        } catch (error) {
            console.error("API error searching customer:", error);
            setIsExistingCustomer(false);
            setIsEditingPersonalDetails(true);
            setSearchStatus({
                type: "not_found",
                message: "No existing record found. Proceeding with new daily stay registration.",
            });
        }
    };

    // Wizard navigation
    const handleNextStep = async () => {
        if (isSavingCustomer || isCheckingAllocation || isFetchingTariff || isSubmitting) return;

        let fieldsToValidate: (keyof DailyStayFormValues)[] = [];
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
            fieldsToValidate = ["dailyRate", "advanceAmount", "amountPaid"];
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

                if (!isExistingCustomer) {
                    setIsSavingCustomer(true);
                    try {
                        const response = await customerService.saveCustomer(personalData as any);
                        if (response.code === 200 || response.code === 201) {
                            const saved = (response.data as any)?.data || response.data;
                            if (saved?.id) {
                                custIdToCheck = Number(saved.id);
                                setPersistedCustomerId(custIdToCheck);
                            }
                            toast.success("Guest personal details saved.");
                        } else {
                            toast.error("Failed to save guest personal details.");
                            return;
                        }
                    } catch (err: any) {
                        console.warn("Could not save customer details:", err);
                        toast.error(err?.message || "Failed to save guest personal details.");
                        return;
                    } finally {
                        setIsSavingCustomer(false);
                    }
                }

                if (custIdToCheck) {
                    setIsCheckingAllocation(true);
                    try {
                        const allocRes = await roomAllocationService.getActiveAllocationByCustomer(custIdToCheck);
                        const activeAlloc = allocRes.data;

                        if (activeAlloc && (activeAlloc.status === "ACTIVE" || activeAlloc.roomNumber || activeAlloc.roomId)) {
                            setActiveAllocation(activeAlloc);
                            const roomDisplay = activeAlloc.roomNumber ? `Room ${activeAlloc.roomNumber}` : `Room #${activeAlloc.roomId}`;
                            const personName = `${personalData.firstName} ${personalData.lastName}`.trim() || "Guest";
                            toast.error(`${personName} is already checked into ${roomDisplay}`);
                            return;
                        } else {
                            setActiveAllocation(null);
                        }
                    } catch (allocErr) {
                        console.warn("Could not check active allocation:", allocErr);
                    } finally {
                        setIsCheckingAllocation(false);
                    }
                }
            }

            if (wizardStep === 3 && activeAllocation) {
                toast.error("Cannot allocate: Guest already occupies an active room bed.");
                return;
            }

            setWizardStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        setWizardStep(prev => Math.max(1, prev - 1));
    };

    // Save Daily Stay Registration
    const handleSaveStay = async (data: DailyStayFormValues) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (!selectedRoomObj || !selectedRoomObj.id) {
                toast.error("Please select a valid room for daily stay allocation.");
                return;
            }

            let customerIdToUse = persistedCustomerId;
            if (!customerIdToUse) {
                const personalPayload = {
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                    gender: data.gender,
                    dateOfBirth: data.dateOfBirth ? data.dateOfBirth : null,
                    mobileNumber: data.mobileNumber.trim(),
                    altMobileNumber: data.altMobileNumber ? data.altMobileNumber.trim() : null,
                    email: data.email ? data.email.trim() : null,
                    aadhaarNumber: data.aadhaarNumber ? data.aadhaarNumber.trim() : null,
                    occupation: data.occupation ? data.occupation.trim() : null,
                    emergencyContactName: data.emergencyContactName ? data.emergencyContactName.trim() : null,
                    emergencyContactPhone: data.emergencyContactPhone ? data.emergencyContactPhone.trim() : null,
                    permanentAddress: data.permanentAddress ? data.permanentAddress.trim() : null,
                };
                try {
                    const saveRes = await customerService.saveCustomer(personalPayload as any);
                    if (saveRes.code < 200 || saveRes.code >= 300) {
                        console.error("Could not register customer profile:", saveRes);
                        toast.error(saveRes.description || "Failed to register customer profile.");
                        return;
                    }
                    const saved = (saveRes.data as any)?.data || saveRes.data;
                    if (saved?.id) {
                        customerIdToUse = Number(saved.id);
                        setPersistedCustomerId(customerIdToUse);
                    } else {
                        toast.error("Failed to retrieve registered customer ID.");
                        return;
                    }
                } catch (err: any) {
                    console.error("Could not register customer profile:", err);
                    toast.error(err?.message || "Failed to register customer profile.");
                    return;
                }
            }

            try {
                const stayRes = await customerStayService.createCustomerStay({
                    customerId: customerIdToUse!,
                    hostelId: hostel?.id ? Number(hostel.id) : undefined,
                    roomId: Number(selectedRoomObj.id),
                    bedNumber: data.bedNumber || undefined,
                    checkInDate: data.joinDate,
                    checkOutDate: data.checkOutDate || undefined,
                    financialTerms: {
                        roomTariffId: selectedTariffId || (data.roomTariffId ? Number(data.roomTariffId) : null),
                        billingMode: "DAILY",
                        dailyRate: data.dailyRate,
                        monthlyRent: 0,
                        securityDepositRequired: data.advanceAmount || 0,
                        billingAnchorDate: data.joinDate,
                    },
                    initialPayment:
                        data.amountPaid > 0
                            ? {
                                  amount: data.amountPaid,
                                  paymentMode: (data.paymentMethod as PaymentMethod) || "CASH",
                                  notes: `Initial daily booking payment for Room ${data.roomNumber}${data.bedNumber ? ` Bed ${data.bedNumber}` : ""}`,
                              }
                            : undefined,
                });

                if (stayRes.code < 200 || stayRes.code >= 300) {
                    console.error("Could not complete daily customer stay registration:", stayRes);
                    const errorMsg = stayRes.description || "Failed to book daily stay. Please verify room availability and rates.";
                    toast.error(errorMsg);
                    return;
                }

                toast.success(`Daily stay booked successfully for "${data.firstName} ${data.lastName}".`);
                setIsWizardOpen(false);
                await loadDirectory();
                await loadRooms();
                await refreshStatistics(true);
            } catch (apiErr: any) {
                console.error("Could not complete daily customer stay registration:", apiErr);
                const errorMsg = apiErr?.response?.data?.message || apiErr?.description || apiErr?.message || "Check-in failed.";
                toast.error(errorMsg);
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader
                title="Daily Basis Rooms"
                description="Manage short-term guests, flexible daily stays, live tariff generation, and quick check-ins."
                action={
                    <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>+ New Daily Booking</span>
                    </button>
                }
            />

            {/* Metrics Overview */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticsCard
                    title="Active Daily Stays"
                    value={isLoadingStats ? "—" : (stats?.arrivals?.activeDailyGuests ?? 0)}
                    icon={<CalendarDays className="h-5 w-5" />}
                    badgeColor="indigo"
                    description="Guests currently checked in"
                />
                <StatisticsCard
                    title="Available Hostel Beds"
                    value={isLoadingStats ? "—" : `${stats?.occupancy?.vacantBeds ?? 0} Beds`}
                    icon={<BedDouble className="h-5 w-5" />}
                    badgeColor="emerald"
                    description="Vacant beds across all rooms"
                />
                <StatisticsCard
                    title="This Month Daily Revenue"
                    value={
                        isLoadingStats
                            ? "—"
                            : `${settings.currencySymbol}${(stats?.revenue?.thisMonthDailyRevenue ?? 0).toLocaleString("en-IN")}`
                    }
                    icon={<IndianRupee className="h-5 w-5" />}
                    badgeColor="purple"
                    description={`Daily payments in ${new Date().toLocaleString("en-US", { month: "long" })}`}
                />
                <StatisticsCard
                    title="This Month Daily Billed Due"
                    value={
                        isLoadingStats
                            ? "—"
                            : `${settings.currencySymbol}${(stats?.revenue?.thisMonthDailyBilledDue ?? 0).toLocaleString("en-IN")}`
                    }
                    icon={<AlertCircle className="h-5 w-5" />}
                    badgeColor="rose"
                    description="Unpaid balance on daily stays"
                />
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="w-full sm:max-w-md">
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search by guest name, room, or mobile..."
                    />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(["All", "Active", "Upcoming", "Due"] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setStatusFilter(filter)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                statusFilter === filter
                                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                            }`}
                        >
                            {filter === "All" ? "All Daily Stays" : filter === "Due" ? "Has Due" : filter}
                        </button>
                    ))}
                </div>
            </div>

            {/* Daily Stays Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                            <tr>
                                <th className="px-5 py-3.5">Guest & Contact</th>
                                <th className="px-5 py-3.5">Room</th>
                                <th className="px-5 py-3.5">Stay Dates</th>
                                <th className="px-5 py-3.5 text-right">Daily Rate</th>
                                <th className="px-5 py-3.5 text-right">Paid</th>
                                <th className="px-5 py-3.5 text-right">Due</th>
                                <th className="px-5 py-3.5 text-center">Status</th>
                                <th className="px-5 py-3.5 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                                            <span>Loading daily room stays...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDailyCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <CalendarDays className="w-8 h-8 text-slate-300" />
                                            <p className="font-semibold text-slate-600">No daily bookings found</p>
                                            <p className="text-xs text-slate-400">Click "+ New Daily Booking" to register a short-stay guest.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredDailyCustomers.map(b => {
                                    const isExited =
                                        b.customerStatus === "INACTIVE" ||
                                        b.allocationStatus === "ENDED" ||
                                        (!b.allocationStatus && Boolean(b.checkOutDate && b.checkOutDate < todayStr));
                                    const isUpcoming = b.joinDate && b.joinDate > todayStr;
                                    const stayDays = calculateDays(b.joinDate, b.checkOutDate);
                                    const due = Number(b.outstandingBalance || 0);
                                    const rate = Number(b.dailyRate || 0);

                                    return (
                                        <tr key={b.allocationId || b.customerId} className="hover:bg-slate-50/70 transition">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900">{b.name}</div>
                                                <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                                                    <Phone className="h-3 w-3" />
                                                    <span>{b.mobileNumber}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
                                                    <BedDouble className="h-3.5 w-3.5 text-indigo-600" />
                                                    <span>{b.roomNumber || "—"}</span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-700">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>
                                                        {b.joinDate || "—"}{b.checkOutDate ? ` to ${b.checkOutDate}` : ""}
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                                                    {stayDays} Day{stayDays > 1 ? "s" : ""}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right font-bold text-slate-900">
                                                {settings.currencySymbol}{rate.toLocaleString("en-IN")}
                                                <span className="text-[11px] font-normal text-slate-400 block">/ day</span>
                                            </td>

                                            <td className="px-5 py-4 text-right font-semibold text-emerald-600">
                                                {settings.currencySymbol}{Number(b.paidRent || 0).toLocaleString("en-IN")}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <span className={`font-bold ${due > 0 ? "text-rose-600 font-extrabold" : "text-slate-400"}`}>
                                                    {settings.currencySymbol}{due.toLocaleString("en-IN")}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                {isExited ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                        Checked Out
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                            isUpcoming
                                                                ? "bg-sky-50 text-sky-700 border border-sky-200"
                                                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        }`}
                                                    >
                                                        {isUpcoming ? "Upcoming" : "Active Stay"}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                {isExited ? (
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg border border-slate-200">
                                                            Exited
                                                        </span>
                                                        {/* Financial Ledger Button */}
                                                        <button
                                                            onClick={() => setFinancialModalCustomer({ id: b.customerId, name: b.name })}
                                                            className="p-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                                                            title="View financial ledger & daily charges"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* Pay Button */}
                                                        <button
                                                            onClick={() => setPayModalCustomer(b)}
                                                            className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                                                            title="Record payment"
                                                        >
                                                            <IndianRupee className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Financial Ledger Button */}
                                                        <button
                                                            onClick={() => setFinancialModalCustomer({ id: b.customerId, name: b.name })}
                                                            className="p-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
                                                            title="View financial ledger & daily charges"
                                                        >
                                                            <Receipt className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* End Stay / Checkout Button */}
                                                        <button
                                                            onClick={() => setEndStayTarget(b)}
                                                            className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                                                            title="Check-out guest and vacate bed"
                                                        >
                                                            <LogOut className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5-Step Wizard Modal for New Daily Booking */}
            {isWizardOpen &&
                createPortal(
                    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                        <div
                            className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] transition-opacity duration-200"
                            onClick={() => setIsWizardOpen(false)}
                            aria-hidden="true"
                        />
                        <div className="flex min-h-screen items-center justify-center p-3 sm:p-4 md:p-6">
                            <div
                                className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-indigo-50/40">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-bold text-slate-900">New Daily Stay Booking</h2>
                                            <p className="text-xs text-slate-500">
                                                Short-term daily room reservation with daily rate terms
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsWizardOpen(false)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Wizard Progress Stepper */}
                                <div className="grid grid-cols-5 p-3 bg-slate-50/70 border-b border-slate-200/80 gap-1 sm:gap-2">
                                    {[
                                        { step: 1, label: "Aadhaar Lookup", icon: <Contact className="w-4 h-4" /> },
                                        { step: 2, label: "Guest Details", icon: <UserCheck className="w-4 h-4" /> },
                                        { step: 3, label: "Room & Dates", icon: <Building className="w-4 h-4" /> },
                                        { step: 4, label: "Daily Rate", icon: <CreditCard className="w-4 h-4" /> },
                                        { step: 5, label: "Review & Check-in", icon: <CalendarDays className="w-4 h-4" /> },
                                    ].map(item => (
                                        <div
                                            key={item.step}
                                            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-center border transition ${
                                                wizardStep === item.step
                                                    ? "bg-white border-indigo-600 text-indigo-600 font-bold shadow-xs"
                                                    : wizardStep > item.step
                                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold"
                                                      : "border-slate-200 text-slate-400 font-medium"
                                            }`}
                                        >
                                            {item.icon}
                                            <span className="text-xs hidden sm:inline">{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Form Body */}
                                <form onSubmit={handleSubmit(handleSaveStay as any)} className="p-6 space-y-6">
                                    {/* Step 1: Aadhaar Lookup */}
                                    {wizardStep === 1 && (
                                        <CustomerRegistrationAadhaarLookupForm
                                            register={register}
                                            errors={errors}
                                            watchedAadhaar={watchedAadhaar || ""}
                                            searchStatus={searchStatus}
                                            onSearch={handleAadhaarSearch}
                                        />
                                    )}

                                    {/* Step 2: Guest Details */}
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

                                    {/* Step 4: Daily Rate & Initial Payment */}
                                    {wizardStep === 4 && (
                                        <CustomerRegistrationFinancialInfoForm
                                            register={register}
                                            errors={errors}
                                            settings={settings}
                                            billingMode="DAILY"
                                            watchedRent={watchedRent}
                                            watchedDailyRate={watchedDailyRate}
                                            watchedSecurityDeposit={watchedAdvance}
                                            watchedPaid={watchedPaid}
                                            setValue={setValue}
                                        />
                                    )}

                                    {/* Step 5: Summary Review */}
                                    {wizardStep === 5 && (
                                        <CustomerRegistrationSummaryReviewForm
                                            formValues={formValues}
                                            settings={settings}
                                            calculatedRemainingDue={calculatedRemainingDue}
                                        />
                                    )}

                                    {/* Footer Navigation */}
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                        <div>
                                            {wizardStep > 1 && (
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
                                                onClick={() => setIsWizardOpen(false)}
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
                                                            <span>Next</span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className={`inline-flex items-center justify-center min-w-[120px] gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl shadow-md transition ${
                                                        isSubmitting
                                                            ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                                                            : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20 cursor-pointer"
                                                    }`}
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <span>Confirm Daily Check-in</span>
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

            {/* Financial Ledger Modal */}
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
                onSuccess={async () => {
                    await loadDirectory();
                    await refreshStatistics(true);
                }}
            />

            {/* End Stay / Checkout Settlement Modal */}
            <DailyCheckoutModal
                isOpen={endStayTarget !== null}
                target={endStayTarget}
                onClose={() => setEndStayTarget(null)}
                onSuccess={async () => {
                    await loadDirectory();
                    await loadRooms();
                    await refreshStatistics(true);
                }}
            />
        </div>
    );
};
