import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { hostelService, type UpdateHostelData } from "@/api/hostelService";
import { FormInput } from "@/components/common/FormInput";
import { AccordionSectionCard } from "@/components/common/AccordionSectionCard";
import { Badge } from "@/components/common/Badge";
import {
    Building2,
    ShieldCheck,
    Phone,
    MapPin,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
    Save,
} from "lucide-react";

import { formatHostelAddress } from "@/utils/formatters";

interface HostelDetailsSectionProps {
    isExpanded: boolean;
    onToggle: () => void;
}

export const HostelDetailsSection: React.FC<HostelDetailsSectionProps> = ({ isExpanded, onToggle }) => {
    const { hostel, refreshHostel, setHostel } = useAuth();

    const [hostelForm, setHostelForm] = useState<UpdateHostelData>({
        name: "",
        phone: "",
        addressLane1: "",
        addressLane2: "",
        city: "",
        state: "",
        zipcode: "",
        totalFloors: undefined,
    });

    const [isHostelLoading, setIsHostelLoading] = useState(false);
    const [isHostelSaving, setIsHostelSaving] = useState(false);
    const [hostelSuccessMsg, setHostelSuccessMsg] = useState<string | null>(null);
    const [hostelErrorMsg, setHostelErrorMsg] = useState<string | null>(null);

    // Sync form with current hostel state or fetch freshly
    useEffect(() => {
        if (hostel) {
            setHostelForm({
                name: hostel.name || "",
                phone: hostel.phone || "",
                addressLane1: hostel.addressLane1 || "",
                addressLane2: hostel.addressLane2 || "",
                city: hostel.city || "",
                state: hostel.state || "",
                zipcode: hostel.zipcode || "",
                totalFloors: hostel.totalFloors,
            });
        } else {
            const loadHostel = async () => {
                setIsHostelLoading(true);
                try {
                    const res = await hostelService.getHostel();
                    if (res.code === 200 && res.data && (res.data as any).data) {
                        const h = (res.data as any).data;
                        setHostel(h);
                        setHostelForm({
                            name: h.name || "",
                            phone: h.phone || "",
                            addressLane1: h.addressLane1 || "",
                            addressLane2: h.addressLane2 || "",
                            city: h.city || "",
                            state: h.state || "",
                            zipcode: h.zipcode || "",
                            totalFloors: h.totalFloors,
                        });
                    }
                } catch (err) {
                    console.error("Error fetching hostel details: ", err);
                } finally {
                    setIsHostelLoading(false);
                }
            };
            loadHostel();
        }
    }, [hostel, setHostel]);

    const handleHostelChange = (field: keyof UpdateHostelData, value: string) => {
        setHostelForm(prev => ({ ...prev, [field]: value }));
        if (hostelSuccessMsg) setHostelSuccessMsg(null);
        if (hostelErrorMsg) setHostelErrorMsg(null);
    };

    const handleHostelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hostelForm.name.trim()) {
            setHostelErrorMsg("Hostel / Property name is required");
            return;
        }

        setIsHostelSaving(true);
        setHostelSuccessMsg(null);
        setHostelErrorMsg(null);

        try {
            const res = await hostelService.updateHostel(hostelForm);
            if (res.isSuccess && res.data) {
                const updated = (res.data as any).data || res.data;
                setHostel(updated);
                await refreshHostel();
                setHostelSuccessMsg("Property details and address updated successfully!");
                setTimeout(() => setHostelSuccessMsg(null), 4000);
            } else {
                setHostelErrorMsg(res.errorMessage || "Failed to update hostel details");
            }
        } catch (err: any) {
            console.error("Update hostel error: ", err);
            setHostelErrorMsg(err?.message || "Error occurred while saving hostel details");
        } finally {
            setIsHostelSaving(false);
        }
    };

    const formattedAddress = formatHostelAddress(hostel);

    return (
        <AccordionSectionCard
            title="Hostel & Property Details"
            icon={<Building2 className="h-5 w-5" />}
            iconClassName="bg-indigo-50 text-indigo-600 border-indigo-100"
            badge={
                <Badge tone="success" size="sm" icon={<ShieldCheck className="h-3 w-3 shrink-0" />}>
                    {hostel?.status === "ACTIVE" ? "Active Property" : "Registered"}
                </Badge>
            }
            summary={
                <div className="flex items-center gap-2 truncate">
                    <span className="font-medium text-slate-700">{hostel?.name || "My Hostel"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {hostel?.phone || "No phone"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{formattedAddress}</span>
                    </span>
                </div>
            }
            isExpanded={isExpanded}
            onToggle={onToggle}
            actionLabel="Edit Details"
        >
            {hostelSuccessMsg && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{hostelSuccessMsg}</span>
                </div>
            )}

            {hostelErrorMsg && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{hostelErrorMsg}</span>
                </div>
            )}

            {isHostelLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <span className="text-xs font-medium">Loading property details...</span>
                </div>
            ) : (
                <form onSubmit={handleHostelSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput
                            label="Hostel / Property Name"
                            value={hostelForm.name}
                            onChange={e => handleHostelChange("name", e.target.value)}
                            placeholder="e.g. Atithi Grand Residency"
                            required
                        />

                        <FormInput
                            label="Contact Mobile / Phone"
                            type="tel"
                            value={hostelForm.phone}
                            onChange={e => handleHostelChange("phone", e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                        />

                        <div className="sm:col-span-2">
                            <FormInput
                                label="Address Lane 1 (Street, Building & Area)"
                                value={hostelForm.addressLane1}
                                onChange={e => handleHostelChange("addressLane1", e.target.value)}
                                placeholder="e.g. Plot No 42, Silicon Valley Colony, Madhapur"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <FormInput
                                label="Address Lane 2 (Landmark / Suite / Floor)"
                                value={hostelForm.addressLane2}
                                onChange={e => handleHostelChange("addressLane2", e.target.value)}
                                placeholder="e.g. Near Metro Pillar 1084, Opposite Tech Park"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:col-span-2">
                            <FormInput
                                label="City"
                                value={hostelForm.city}
                                onChange={e => handleHostelChange("city", e.target.value)}
                                placeholder="e.g. Hyderabad"
                            />
                            <FormInput
                                label="Total Property Floors"
                                type="number"
                                min="1"
                                max="100"
                                value={
                                    hostelForm.totalFloors !== undefined && hostelForm.totalFloors !== null
                                        ? String(hostelForm.totalFloors)
                                        : ""
                                }
                                onChange={e => {
                                    const val = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                                    setHostelForm(prev => ({
                                        ...prev,
                                        totalFloors: isNaN(val as number) ? undefined : val,
                                    }));
                                    if (hostelSuccessMsg) setHostelSuccessMsg(null);
                                    if (hostelErrorMsg) setHostelErrorMsg(null);
                                }}
                                placeholder="e.g. 4"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FormInput
                                label="State"
                                value={hostelForm.state}
                                onChange={e => handleHostelChange("state", e.target.value)}
                                placeholder="e.g. Telangana"
                            />
                            <FormInput
                                label="Zip / Postal Code"
                                value={hostelForm.zipcode}
                                onChange={e => handleHostelChange("zipcode", e.target.value)}
                                placeholder="e.g. 500081"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/70">
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                            Live synced to your property registry and invoice receipts
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onToggle}
                                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl transition hover:bg-slate-50 shadow-xs"
                            >
                                Close
                            </button>
                            <button
                                type="submit"
                                disabled={isHostelSaving}
                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/20 transition"
                            >
                                {isHostelSaving ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-3.5 w-3.5" />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </AccordionSectionCard>
    );
};
