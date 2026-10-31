import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, Save, Trash2, Users } from "lucide-react";
import { FormInput } from "@/components/common/FormInput";
import { AccordionSectionCard } from "@/components/common/AccordionSectionCard";
import { Badge } from "@/components/common/Badge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { roomTypeService } from "@/api/roomTypeService";
import type { RoomType } from "@/types";

interface SharingPricingSectionProps {
    isExpanded: boolean;
    onToggle: () => void;
}

interface RoomTypeDraft {
    name: string;
    sharingCount: string;
}

const emptyDraft: RoomTypeDraft = { name: "", sharingCount: "" };

/**
 * Temporary form state only. Room types always load from and save to the API;
 * mock data, localStorage, and shared context are not used as a data source.
 */
export const SharingPricingSection: React.FC<SharingPricingSectionProps> = ({ isExpanded, onToggle }) => {
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [draft, setDraft] = useState<RoomTypeDraft>(emptyDraft);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingType, setDeletingType] = useState<RoomType | null>(null);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const loadRoomTypes = useCallback(async () => {
        setIsLoading(true);
        const response = await roomTypeService.getRoomTypes();
        if (response.code >= 200 && response.code < 300) {
            setRoomTypes(response.data ?? []);
            setFeedback(null);
        } else {
            setFeedback({ type: "error", message: response.description || "Could not load room types." });
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        void loadRoomTypes();
    }, [loadRoomTypes]);

    const resetDraft = () => {
        setDraft(emptyDraft);
        setEditingId(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const name = draft.name.trim();
        const sharingCount = Number(draft.sharingCount);

        if (!name || !Number.isInteger(sharingCount) || sharingCount < 1) {
            setFeedback({
                type: "error",
                message: "Enter a room type name and a whole-number sharing count of at least 1.",
            });
            return;
        }

        setIsSaving(true);
        const payload = { name, sharingCount, active: true };
        const response =
            editingId === null
                ? await roomTypeService.createRoomType(payload)
                : await roomTypeService.updateRoomType(editingId, payload);

        if (response.isSuccess) {
            setFeedback({
                type: "success",
                message: editingId === null ? "Room type added successfully." : "Room type updated successfully.",
            });
            resetDraft();
            await loadRoomTypes();
        } else {
            setFeedback({ type: "error", message: response.errorMessage || "Could not save the room type." });
        }
        setIsSaving(false);
    };

    const beginEdit = (roomType: RoomType) => {
        setEditingId(roomType.id);
        setDraft({ name: roomType.name, sharingCount: String(roomType.sharingCount) });
        setFeedback(null);
    };

    const confirmDelete = async () => {
        if (!deletingType) return;

        const response = await roomTypeService.deleteRoomType(deletingType.id);
        if (response.isSuccess) {
            setFeedback({ type: "success", message: "Room type removed successfully." });
            if (editingId === deletingType.id) resetDraft();
            await loadRoomTypes();
        } else {
            setFeedback({ type: "error", message: response.errorMessage || "This room type could not be removed." });
        }
        setDeletingType(null);
    };

    const summary = isLoading
        ? "Loading room types…"
        : roomTypes.length === 0
          ? "No room types configured yet."
          : roomTypes.map(roomType => `${roomType.name} (${roomType.sharingCount}-sharing)`).join(" • ");

    return (
        <>
            <AccordionSectionCard
                title="Room Type Settings"
                icon={<Users className="h-5 w-5" />}
                iconClassName="bg-teal-50 text-teal-600 border-teal-100"
                badge={
                    <Badge tone="teal" size="sm">
                        Customizable
                    </Badge>
                }
                summary={summary}
                isExpanded={isExpanded}
                onToggle={onToggle}
                actionLabel="Manage room types"
            >
                {feedback && (
                    <div
                        className={`mb-5 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                            feedback.type === "success"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                                : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                    >
                        {feedback.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        <span>{feedback.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">
                                {editingId === null ? "Add room type" : "Edit room type"}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Capacity belongs to an individual room; enter only its sharing classification here.
                            </p>
                        </div>
                        {editingId !== null && (
                            <button
                                type="button"
                                onClick={resetDraft}
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                            >
                                Cancel edit
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_180px_auto] gap-4 items-end">
                        <FormInput
                            label="Room Type Name"
                            placeholder="e.g. Deluxe 4 Sharing"
                            value={draft.name}
                            onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}
                            required
                        />
                        <FormInput
                            label="Sharing / Beds"
                            type="number"
                            min={1}
                            step={1}
                            placeholder="e.g. 4"
                            value={draft.sharingCount}
                            onChange={event => setDraft(current => ({ ...current, sharingCount: event.target.value }))}
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md shadow-teal-600/20 transition"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : editingId === null ? (
                                <Plus className="h-4 w-4" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {editingId === null ? "Add room type" : "Save changes"}
                        </button>
                    </div>
                </form>

                <div className="mt-5">
                    {isLoading ? (
                        <div className="py-8 flex justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                        </div>
                    ) : roomTypes.length === 0 ? (
                        <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 bg-white text-xs font-medium text-slate-500">
                            Add the first room type to begin. For example: “4 Sharing” with 4 beds.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {roomTypes.map(roomType => (
                                <div
                                    key={roomType.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{roomType.name}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {roomType.sharingCount} sharing / {roomType.sharingCount} beds
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => beginEdit(roomType)}
                                            className="p-2 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                                            aria-label={`Edit ${roomType.name}`}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingType(roomType)}
                                            className="p-2 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                                            aria-label={`Delete ${roomType.name}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AccordionSectionCard>

            <ConfirmDialog
                isOpen={deletingType !== null}
                title="Delete room type?"
                description={
                    deletingType
                        ? `Delete “${deletingType.name}”? Room types already assigned to rooms cannot be deleted.`
                        : ""
                }
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeletingType(null)}
            />
        </>
    );
};
