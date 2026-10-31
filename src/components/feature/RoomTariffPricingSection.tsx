import React, { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    History,
    IndianRupee,
    Info,
    Loader2,
    Pencil,
    Plus,
    Save,
    X,
} from "lucide-react";
import { AccordionSectionCard } from "@/components/common/AccordionSectionCard";
import { Badge } from "@/components/common/Badge";
import { FormInput } from "@/components/common/FormInput";
import { FormSelect } from "@/components/common/FormSelect";
import { Modal } from "@/components/common/Modal";
import { roomTypeService } from "@/api/roomTypeService";
import { roomTariffService, type CreateRoomTariffData, type RoomTariff } from "@/api/roomTariffService";
import type { RoomType } from "@/types";

interface RoomTariffPricingSectionProps {
    isExpanded: boolean;
    onToggle: () => void;
}

interface TariffFormState {
    roomTypeId: number | "";
    monthlyRent: string;
    dailyRate: string;
    securityDepositRequired: string;
    effectiveFrom: string;
    effectiveTo: string;
}

interface InlineEditState {
    roomTypeId: number;
    tariffId: number;
    roomTypeName: string;
    monthlyRent: string;
    dailyRate: string;
    securityDepositRequired: string;
    effectiveFrom: string;
    effectiveTo: string;
    originalMonthlyRent: number;
    originalDailyRate: number | null;
    originalSecurityDeposit: number;
    originalEffectiveFrom: string;
}

const getTodayDateString = () => new Date().toISOString().split("T")[0];

const initialFormState: TariffFormState = {
    roomTypeId: "",
    monthlyRent: "",
    dailyRate: "",
    securityDepositRequired: "",
    effectiveFrom: getTodayDateString(),
    effectiveTo: "",
};

export const RoomTariffPricingSection: React.FC<RoomTariffPricingSectionProps> = ({
    isExpanded,
    onToggle,
}) => {
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [tariffs, setTariffs] = useState<Record<number, RoomTariff | null>>({});
    const [formData, setFormData] = useState<TariffFormState>(initialFormState);
    const [isLoading, setIsLoading] = useState(true);
    const [isSavingTopForm, setIsSavingTopForm] = useState(false);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // In-place inline edit state
    const [inlineEditing, setInlineEditing] = useState<InlineEditState | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isUpdatingInPlace, setIsUpdatingInPlace] = useState(false);
    const [isCreatingRevision, setIsCreatingRevision] = useState(false);

    // History modal state
    const [historyRoomType, setHistoryRoomType] = useState<RoomType | null>(null);
    const [historyList, setHistoryList] = useState<RoomTariff[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [typesRes, tariffsRes] = await Promise.all([
                roomTypeService.getRoomTypes(),
                roomTariffService.getAllRoomTariffs(true),
            ]);

            if (typesRes.code >= 200 && typesRes.code < 300 && typesRes.data) {
                setRoomTypes(typesRes.data);
            } else {
                setFeedback({
                    type: "error",
                    message: typesRes.description || "Could not load room types.",
                });
            }

            const tariffMap: Record<number, RoomTariff | null> = {};
            if (tariffsRes.code >= 200 && tariffsRes.code < 300 && Array.isArray(tariffsRes.data)) {
                tariffsRes.data.forEach(t => {
                    if (t.roomTypeId) {
                        tariffMap[t.roomTypeId] = t;
                    }
                });
            }
            setTariffs(tariffMap);
            setFeedback(null);
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Failed to load room tariffs.",
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleRoomTypeSelect = (roomTypeId: number | "") => {
        if (roomTypeId === "") {
            setFormData(initialFormState);
            return;
        }

        const existingTariff = tariffs[roomTypeId];
        setFormData({
            roomTypeId,
            monthlyRent: existingTariff ? String(existingTariff.monthlyRent) : "",
            dailyRate: existingTariff && existingTariff.dailyRate != null ? String(existingTariff.dailyRate) : "",
            securityDepositRequired: existingTariff ? String(existingTariff.securityDepositRequired) : "",
            effectiveFrom: getTodayDateString(),
            effectiveTo: "",
        });
        setFeedback(null);
    };

    const handleTopFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const rTypeId = Number(formData.roomTypeId);
        if (!rTypeId) {
            setFeedback({ type: "error", message: "Please select a room type." });
            return;
        }

        const rent = Number(formData.monthlyRent);
        const dailyRate = formData.dailyRate !== "" ? Number(formData.dailyRate) : undefined;
        const deposit = Number(formData.securityDepositRequired);

        if (isNaN(rent) || rent < 0) {
            setFeedback({ type: "error", message: "Please enter a valid monthly rent (₹0 or more)." });
            return;
        }

        if (dailyRate !== undefined && (isNaN(dailyRate) || dailyRate < 0)) {
            setFeedback({ type: "error", message: "Please enter a valid daily rent (₹0 or more)." });
            return;
        }

        if (isNaN(deposit) || deposit < 0) {
            setFeedback({ type: "error", message: "Please enter a valid security deposit (₹0 or more)." });
            return;
        }

        if (!formData.effectiveFrom) {
            setFeedback({ type: "error", message: "Effective from date is required." });
            return;
        }

        setIsSavingTopForm(true);
        try {
            const payload: CreateRoomTariffData = {
                monthlyRent: rent,
                dailyRate: dailyRate != null && !isNaN(dailyRate) ? dailyRate : undefined,
                securityDepositRequired: deposit,
                effectiveFrom: formData.effectiveFrom,
                effectiveTo: formData.effectiveTo ? formData.effectiveTo : null,
            };

            const res = await roomTariffService.createTariff(rTypeId, payload);
            if (res.isSuccess) {
                const rtName = roomTypes.find(rt => rt.id === rTypeId)?.name || "Room Type";
                const dailyDesc = dailyRate != null ? `, Daily Rent ₹${dailyRate.toLocaleString("en-IN")}` : "";
                setFeedback({
                    type: "success",
                    message: `Standard pricing configured for ${rtName}: Monthly Rent ₹${rent.toLocaleString("en-IN")}${dailyDesc}, Security Deposit ₹${deposit.toLocaleString("en-IN")}.`,
                });

                // Update tariffs map locally
                setTariffs(prev => ({
                    ...prev,
                    [rTypeId]: res.data ?? null,
                }));

                // Reset top form
                setFormData(initialFormState);
            } else {
                setFeedback({
                    type: "error",
                    message: res.errorMessage || "Could not save standard room tariff.",
                });
            }
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Failed to save room tariff.",
            });
        } finally {
            setIsSavingTopForm(false);
        }
    };

    // ── Inline Card Editing Handlers ──

    const handleStartInlineEdit = (roomType: RoomType, tariff: RoomTariff) => {
        setInlineEditing({
            roomTypeId: roomType.id,
            tariffId: tariff.id,
            roomTypeName: roomType.name,
            monthlyRent: String(tariff.monthlyRent ?? ""),
            dailyRate: tariff.dailyRate != null && tariff.dailyRate > 0 ? String(tariff.dailyRate) : "",
            securityDepositRequired: String(tariff.securityDepositRequired ?? ""),
            effectiveFrom: tariff.effectiveFrom || getTodayDateString(),
            effectiveTo: tariff.effectiveTo || "",
            originalMonthlyRent: tariff.monthlyRent,
            originalDailyRate: tariff.dailyRate ?? null,
            originalSecurityDeposit: tariff.securityDepositRequired,
            originalEffectiveFrom: tariff.effectiveFrom,
        });
        setFeedback(null);
    };

    const handleCancelInlineEdit = () => {
        setInlineEditing(null);
    };

    const handleSaveInlineClick = () => {
        if (!inlineEditing) return;

        const rent = Number(inlineEditing.monthlyRent);
        const dailyRate = inlineEditing.dailyRate !== "" ? Number(inlineEditing.dailyRate) : undefined;
        const deposit = Number(inlineEditing.securityDepositRequired);

        if (isNaN(rent) || rent < 0) {
            setFeedback({ type: "error", message: "Please enter a valid monthly rent (₹0 or more)." });
            return;
        }

        if (dailyRate !== undefined && (isNaN(dailyRate) || dailyRate < 0)) {
            setFeedback({ type: "error", message: "Please enter a valid daily rent (₹0 or more)." });
            return;
        }

        if (isNaN(deposit) || deposit < 0) {
            setFeedback({ type: "error", message: "Please enter a valid security deposit (₹0 or more)." });
            return;
        }

        if (!inlineEditing.effectiveFrom) {
            setFeedback({ type: "error", message: "Effective from date is required." });
            return;
        }

        // Open Confirmation Dialog with dual options
        setIsConfirmModalOpen(true);
    };

    const handleConfirmInPlaceUpdate = async () => {
        if (!inlineEditing) return;
        setIsUpdatingInPlace(true);
        try {
            const rent = Number(inlineEditing.monthlyRent);
            const dailyRate = inlineEditing.dailyRate !== "" ? Number(inlineEditing.dailyRate) : undefined;
            const deposit = Number(inlineEditing.securityDepositRequired);

            const payload: CreateRoomTariffData = {
                monthlyRent: rent,
                dailyRate: dailyRate != null && !isNaN(dailyRate) ? dailyRate : undefined,
                securityDepositRequired: deposit,
                effectiveFrom: inlineEditing.effectiveFrom,
                effectiveTo: inlineEditing.effectiveTo ? inlineEditing.effectiveTo : null,
            };

            const res = await roomTariffService.updateTariff(inlineEditing.tariffId, payload);
            if (res.isSuccess) {
                const dailyDesc = dailyRate != null ? `, Daily Rent ₹${dailyRate.toLocaleString("en-IN")}` : "";
                setFeedback({
                    type: "success",
                    message: `Tariff updated directly for ${inlineEditing.roomTypeName}: Monthly Rent ₹${rent.toLocaleString("en-IN")}${dailyDesc}, Security Deposit ₹${deposit.toLocaleString("en-IN")}.`,
                });

                setTariffs(prev => ({
                    ...prev,
                    [inlineEditing.roomTypeId]: res.data ?? null,
                }));

                setIsConfirmModalOpen(false);
                setInlineEditing(null);
            } else {
                setFeedback({
                    type: "error",
                    message: res.errorMessage || "Could not update room tariff.",
                });
            }
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Failed to update room tariff.",
            });
        } finally {
            setIsUpdatingInPlace(false);
        }
    };

    const handleConfirmNewRevision = async () => {
        if (!inlineEditing) return;
        setIsCreatingRevision(true);
        try {
            const rent = Number(inlineEditing.monthlyRent);
            const dailyRate = inlineEditing.dailyRate !== "" ? Number(inlineEditing.dailyRate) : undefined;
            const deposit = Number(inlineEditing.securityDepositRequired);

            const payload: CreateRoomTariffData = {
                monthlyRent: rent,
                dailyRate: dailyRate != null && !isNaN(dailyRate) ? dailyRate : undefined,
                securityDepositRequired: deposit,
                effectiveFrom: inlineEditing.effectiveFrom,
                effectiveTo: inlineEditing.effectiveTo ? inlineEditing.effectiveTo : null,
            };

            const res = await roomTariffService.createTariff(inlineEditing.roomTypeId, payload, true);
            if (res.isSuccess) {
                setFeedback({
                    type: "success",
                    message: `New tariff revision activated for ${inlineEditing.roomTypeName} effective from ${payload.effectiveFrom}. Previous tariff archived to history.`,
                });

                setTariffs(prev => ({
                    ...prev,
                    [inlineEditing.roomTypeId]: res.data ?? null,
                }));

                setIsConfirmModalOpen(false);
                setInlineEditing(null);
            } else {
                setFeedback({
                    type: "error",
                    message: res.errorMessage || "Could not create new tariff revision.",
                });
            }
        } catch (err: any) {
            setFeedback({
                type: "error",
                message: err?.message || "Failed to create tariff revision.",
            });
        } finally {
            setIsCreatingRevision(false);
        }
    };

    const handleViewHistory = async (roomType: RoomType) => {
        setHistoryRoomType(roomType);
        setIsLoadingHistory(true);
        try {
            const res = await roomTariffService.getTariffHistory(roomType.id);
            setHistoryList(res.data ?? []);
        } catch {
            setHistoryList([]);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const configuredCount = roomTypes.filter(rt => tariffs[rt.id] != null).length;

    const summaryText = isLoading
        ? "Loading room tariffs…"
        : roomTypes.length === 0
          ? "No room types configured yet."
          : configuredCount === 0
            ? "No standard room tariffs configured. Set monthly rent, daily rent, and security deposits per room type."
            : roomTypes
                  .filter(rt => tariffs[rt.id] != null)
                  .map(rt => {
                      const t = tariffs[rt.id]!;
                      const dailyPart = t.dailyRate ? ` • ₹${t.dailyRate.toLocaleString("en-IN")}/day` : "";
                      return `${rt.name}: ₹${t.monthlyRent.toLocaleString("en-IN")}/mo${dailyPart} (₹${t.securityDepositRequired.toLocaleString("en-IN")} dep)`;
                  })
                  .join(" • ");

    return (
        <>
            <AccordionSectionCard
                title="Room Tariffs & Standard Pricing"
                icon={<IndianRupee className="h-5 w-5" />}
                iconClassName="bg-emerald-50 text-emerald-600 border-emerald-100"
                badge={
                    <Badge
                        tone={
                            configuredCount === roomTypes.length && roomTypes.length > 0
                                ? "success"
                                : configuredCount > 0
                                  ? "indigo"
                                  : "warning"
                        }
                        size="sm"
                    >
                        {configuredCount}/{roomTypes.length} Configured
                    </Badge>
                }
                summary={<div className="truncate text-xs text-slate-500">{summaryText}</div>}
                isExpanded={isExpanded}
                onToggle={onToggle}
                actionLabel="Configure Pricing"
            >
                {/* Feedback banner */}
                {feedback && (
                    <div
                        className={`mb-5 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
                            feedback.type === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {feedback.type === "success" ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                            )}
                            <span>{feedback.message}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFeedback(null)}
                            className="p-1 rounded-md hover:bg-black/5 text-slate-500"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* Top Section: Standard Form (strictly for creating new room tariffs, no animations/scrolling) */}
                <form
                    id="tariff-pricing-form"
                    onSubmit={handleTopFormSubmit}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                <IndianRupee className="h-4 w-4 text-emerald-600" />
                                {formData.roomTypeId
                                    ? `Configure Tariff for ${roomTypes.find(rt => rt.id === formData.roomTypeId)?.name || "Room Type"}`
                                    : "Configure Standard Room Tariff"}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Enter the standard pricing for room categories. These rates prefill during resident onboarding.
                            </p>
                        </div>
                        {formData.roomTypeId !== "" && (
                            <button
                                type="button"
                                onClick={() => setFormData(initialFormState)}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                            >
                                Clear selection
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 items-end">
                        <div className="col-span-1">
                            <FormSelect
                                label="Room Type"
                                value={formData.roomTypeId}
                                onChange={e =>
                                    handleRoomTypeSelect(e.target.value === "" ? "" : Number(e.target.value))
                                }
                                options={[
                                    { value: "", label: "Select Room Type..." },
                                    ...roomTypes.map(rt => ({
                                        value: rt.id,
                                        label: `${rt.name} (${rt.sharingCount} sharing)${tariffs[rt.id] ? " (Configured)" : ""}`,
                                    })),
                                ]}
                                required
                            />
                        </div>

                        <div className="col-span-1">
                            <FormInput
                                label="Monthly Rent (₹)"
                                prefixText="₹"
                                type="number"
                                min={0}
                                step="any"
                                placeholder="e.g. 7000"
                                value={formData.monthlyRent}
                                onChange={e => setFormData(prev => ({ ...prev, monthlyRent: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="col-span-1">
                            <FormInput
                                label="Daily Rent (₹)"
                                prefixText="₹"
                                type="number"
                                min={0}
                                step="any"
                                placeholder="e.g. 500"
                                value={formData.dailyRate}
                                onChange={e => setFormData(prev => ({ ...prev, dailyRate: e.target.value }))}
                            />
                        </div>

                        <div className="col-span-1">
                            <FormInput
                                label="Security Deposit (₹)"
                                prefixText="₹"
                                type="number"
                                min={0}
                                step="any"
                                placeholder="e.g. 7000"
                                value={formData.securityDepositRequired}
                                onChange={e =>
                                    setFormData(prev => ({ ...prev, securityDepositRequired: e.target.value }))
                                }
                                required
                            />
                        </div>

                        <div className="col-span-1">
                            <FormInput
                                label="Effective From"
                                type="date"
                                value={formData.effectiveFrom}
                                onChange={e => setFormData(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="col-span-1 flex items-center gap-2">
                            <button
                                type="submit"
                                disabled={isSavingTopForm || !formData.roomTypeId}
                                className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md shadow-emerald-600/20 transition h-[42px]"
                            >
                                {isSavingTopForm ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                <span>Save Tariff</span>
                            </button>
                        </div>
                    </div>
                </form>

                {/* Section: Overview of all Room Types & Standard Tariffs with In-Place Inline Editing */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Hostel Room Tariffs & Pricing List
                        </h4>
                        <span className="text-xs text-slate-400">
                            {configuredCount} of {roomTypes.length} configured
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                            <p className="text-xs text-slate-500">Loading current tariffs...</p>
                        </div>
                    ) : roomTypes.length === 0 ? (
                        <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 bg-white text-xs font-medium text-slate-500">
                            No room types found. Please configure room types above first.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {roomTypes.map(roomType => {
                                const tariff = tariffs[roomType.id];
                                const hasTariff = Boolean(tariff);
                                const isInlineEditingThis = inlineEditing?.roomTypeId === roomType.id;

                                if (isInlineEditingThis && inlineEditing) {
                                    // ── IN-PLACE INLINE EDIT CARD ──
                                    return (
                                        <div
                                            key={roomType.id}
                                            className="rounded-xl border-2 border-emerald-500 bg-emerald-50/20 shadow-md p-4 sm:p-5 transition-all duration-200"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-100">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="text-base font-bold text-slate-900">
                                                        {roomType.name}
                                                    </h5>
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                        <Pencil className="h-3 w-3" />
                                                        Editing Rates Inline
                                                    </span>
                                                </div>
                                                <span className="text-[11px] text-slate-500">
                                                    Enter modified rates below, then choose update method.
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5 items-end">
                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                                        Monthly Rent (₹) *
                                                    </label>
                                                    <div className="relative rounded-lg shadow-xs">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-bold">
                                                            ₹
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={inlineEditing.monthlyRent}
                                                            onChange={e =>
                                                                setInlineEditing(prev =>
                                                                    prev ? { ...prev, monthlyRent: e.target.value } : null
                                                                )
                                                            }
                                                            className="block w-full pl-6 pr-2.5 py-1.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                                            placeholder="e.g. 8500"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-indigo-700 block mb-1">
                                                        Daily Rent (₹)
                                                    </label>
                                                    <div className="relative rounded-lg shadow-xs">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-indigo-400 text-xs font-bold">
                                                            ₹
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={inlineEditing.dailyRate}
                                                            onChange={e =>
                                                                setInlineEditing(prev =>
                                                                    prev ? { ...prev, dailyRate: e.target.value } : null
                                                                )
                                                            }
                                                            className="block w-full pl-6 pr-2.5 py-1.5 text-xs font-bold text-slate-900 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                                            placeholder="e.g. 500"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                                        Security Deposit (₹) *
                                                    </label>
                                                    <div className="relative rounded-lg shadow-xs">
                                                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-bold">
                                                            ₹
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            step="any"
                                                            value={inlineEditing.securityDepositRequired}
                                                            onChange={e =>
                                                                setInlineEditing(prev =>
                                                                    prev
                                                                        ? {
                                                                              ...prev,
                                                                              securityDepositRequired: e.target.value,
                                                                          }
                                                                        : null
                                                                )
                                                            }
                                                            className="block w-full pl-6 pr-2.5 py-1.5 text-xs font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                                            placeholder="e.g. 2000"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                                        Effective From *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={inlineEditing.effectiveFrom}
                                                        onChange={e =>
                                                            setInlineEditing(prev =>
                                                                prev ? { ...prev, effectiveFrom: e.target.value } : null
                                                            )
                                                        }
                                                        className="block w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-emerald-100">
                                                <button
                                                    type="button"
                                                    onClick={handleCancelInlineEdit}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                                >
                                                    <X className="h-3.5 w-3.5 text-slate-500" />
                                                    <span>Cancel</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSaveInlineClick}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    <span>Save Changes</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }

                                // ── READ-ONLY CARD ──
                                return (
                                    <div
                                        key={roomType.id}
                                        className={`rounded-xl border transition-all duration-300 p-4 sm:p-5 ${
                                            hasTariff
                                                ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                                                : "border-dashed border-amber-200/80 bg-amber-50/20"
                                        }`}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            {/* Column 1: Room Type & Effective From */}
                                            <div className="min-w-[150px] shrink-0">
                                                <h5 className="text-base font-bold text-slate-900 tracking-tight">
                                                    {roomType.name}
                                                </h5>
                                                {hasTariff && tariff ? (
                                                    <div className="mt-1">
                                                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                                                            Effective From
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-700">
                                                            {tariff.effectiveFrom}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-1">
                                                        <Badge tone="warning" size="xs">
                                                            Pricing Not Set
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Column 2: Tariffs (Monthly Rent, Daily Rent, Security Deposit) */}
                                            {hasTariff && tariff ? (
                                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1 sm:justify-center">
                                                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 min-w-[115px]">
                                                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                                                            Monthly Rent
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-900">
                                                            ₹{tariff.monthlyRent.toLocaleString("en-IN")}
                                                        </span>
                                                    </div>

                                                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 min-w-[115px]">
                                                        <span className="text-[10px] uppercase font-semibold text-indigo-600 block tracking-wider">
                                                            Daily Rent
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-900">
                                                            {tariff.dailyRate != null && tariff.dailyRate > 0 ? (
                                                                `₹${tariff.dailyRate.toLocaleString("en-IN")}`
                                                            ) : (
                                                                <span className="text-slate-400 font-normal text-xs">Not set</span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 min-w-[115px]">
                                                        <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                                                            Security Deposit
                                                        </span>
                                                        <span className="text-sm font-bold text-slate-900">
                                                            ₹{tariff.securityDepositRequired.toLocaleString("en-IN")}
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center sm:justify-center">
                                                    <span className="text-xs text-slate-400 italic">
                                                        Rent will default to ₹0 during check-in until standard tariff is configured.
                                                    </span>
                                                </div>
                                            )}

                                            {/* Column 3: Action buttons */}
                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                {hasTariff && (
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleViewHistory(roomType)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                                                        title="View tariff price history"
                                                    >
                                                        <History className="h-3.5 w-3.5" />
                                                        <span>History</span>
                                                    </button>
                                                )}

                                                {hasTariff && tariff ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleStartInlineEdit(roomType, tariff)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition bg-slate-100 hover:bg-slate-200 text-slate-700"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        <span>Update</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRoomTypeSelect(roomType.id)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        <span>Set Pricing</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </AccordionSectionCard>

            {/* Confirmation Modal: Choose Between Direct In-Place Update and New Revision */}
            <Modal
                isOpen={isConfirmModalOpen && inlineEditing !== null}
                onClose={() => {
                    if (!isUpdatingInPlace && !isCreatingRevision) {
                        setIsConfirmModalOpen(false);
                    }
                }}
                title={
                    <div className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-emerald-600" />
                        <span>Confirm Tariff Update: {inlineEditing?.roomTypeName}</span>
                    </div>
                }
                subtitle="Choose how you want to apply these price adjustments."
                maxWidth="xl"
            >
                {inlineEditing && (
                    <div className="space-y-4">
                        {/* Comparison Summary Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                            <h6 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Proposed Changes
                            </h6>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="bg-white border border-slate-100 rounded-lg p-2">
                                    <span className="text-[10px] text-slate-400 block font-medium">Monthly Rent</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="line-through text-slate-400">
                                            ₹{inlineEditing.originalMonthlyRent.toLocaleString("en-IN")}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-slate-400" />
                                        <span className="font-bold text-slate-900">
                                            ₹{Number(inlineEditing.monthlyRent || 0).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-lg p-2">
                                    <span className="text-[10px] text-indigo-500 block font-medium">Daily Rent</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-slate-400">
                                            {inlineEditing.originalDailyRate != null && inlineEditing.originalDailyRate > 0
                                                ? `₹${inlineEditing.originalDailyRate.toLocaleString("en-IN")}`
                                                : "None"}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-slate-400" />
                                        <span className="font-bold text-indigo-700">
                                            {inlineEditing.dailyRate !== "" && Number(inlineEditing.dailyRate) > 0
                                                ? `₹${Number(inlineEditing.dailyRate).toLocaleString("en-IN")}`
                                                : "None"}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-lg p-2">
                                    <span className="text-[10px] text-slate-400 block font-medium">Deposit</span>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="line-through text-slate-400">
                                            ₹{inlineEditing.originalSecurityDeposit.toLocaleString("en-IN")}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-slate-400" />
                                        <span className="font-bold text-slate-900">
                                            ₹{Number(inlineEditing.securityDepositRequired || 0).toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-100 rounded-lg p-2">
                                    <span className="text-[10px] text-slate-400 block font-medium">Effective Date</span>
                                    <span className="font-semibold text-slate-800 block mt-0.5">
                                        {inlineEditing.effectiveFrom}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Informational Callout */}
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900">
                            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                            <p>
                                <strong>Resident Agreements are Protected:</strong> Existing checked-in residents will not
                                have their rent changed. Their rates are locked in their allocation agreements.
                            </p>
                        </div>

                        {/* Two Update Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {/* Option 1: Just Update */}
                            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-900">Just Update</span>
                                        <Badge tone="success" size="xs">
                                            Recommended
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                                        Modifies the current tariff directly. Perfect for adding a daily rent rate or correcting typos without closing or creating a new version.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleConfirmInPlaceUpdate}
                                    disabled={isUpdatingInPlace || isCreatingRevision}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-xs"
                                >
                                    {isUpdatingInPlace ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4" />
                                    )}
                                    <span>Update Tariff Directly</span>
                                </button>
                            </div>

                            {/* Option 2: Close & Start New Revision */}
                            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xs transition">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-bold text-slate-900">Close & Start New</span>
                                        <Badge tone="indigo" size="xs">
                                            Price Hikes
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                                        Archives the current tariff as of yesterday and creates a new tariff starting from the effective date. Preserves rate history in the log.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleConfirmNewRevision}
                                    disabled={isUpdatingInPlace || isCreatingRevision}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-50 transition shadow-xs"
                                >
                                    {isCreatingRevision ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Clock className="h-4 w-4" />
                                    )}
                                    <span>Close & Start New Revision</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="pt-2 flex justify-end border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                disabled={isUpdatingInPlace || isCreatingRevision}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                            >
                                Cancel / Keep Editing
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Tariff History Modal */}
            <Modal
                isOpen={historyRoomType !== null}
                onClose={() => setHistoryRoomType(null)}
                title={
                    <div className="flex items-center gap-2">
                        <History className="h-5 w-5 text-emerald-600" />
                        <span>Tariff Revision History: {historyRoomType?.name}</span>
                    </div>
                }
                subtitle="Chronological record of standard rent and deposit rates for this room category."
                maxWidth="2xl"
            >
                {isLoadingHistory ? (
                    <div className="py-8 flex justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    </div>
                ) : historyList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                        No previous tariff revisions found for this room type.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {historyList.map(item => (
                            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-sm">
                                            ₹{item.monthlyRent.toLocaleString("en-IN")}{" "}
                                            <span className="text-xs font-normal text-slate-500">/ mo</span>
                                        </span>
                                        {item.dailyRate != null && item.dailyRate > 0 && (
                                            <>
                                                <span className="text-slate-300">•</span>
                                                <span className="font-bold text-indigo-600 text-sm">
                                                    ₹{item.dailyRate.toLocaleString("en-IN")}{" "}
                                                    <span className="text-xs font-normal text-slate-500">/ day</span>
                                                </span>
                                            </>
                                        )}
                                        <span className="text-slate-300">•</span>
                                        <span className="font-semibold text-slate-700">
                                            Deposit: ₹{item.securityDepositRequired.toLocaleString("en-IN")}
                                        </span>
                                        {item.active && (
                                            <Badge tone="success" size="xs" dot>
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                            Effective {item.effectiveFrom}{" "}
                                            {item.effectiveTo ? `to ${item.effectiveTo}` : "(Ongoing)"}
                                        </span>
                                    </p>
                                </div>
                                <span className="text-[10px] text-slate-400">ID #{item.id}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default RoomTariffPricingSection;
