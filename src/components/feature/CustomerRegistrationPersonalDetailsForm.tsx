import React from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { Edit2, UserCheck } from "lucide-react";
import { FormInput } from "@/components/common/FormInput";
import { FormSelect } from "@/components/common/FormSelect";
import { FormDatePicker } from "@/components/common/FormDatePicker";

interface CustomerRegistrationPersonalDetailsFormProps {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    isExistingCustomer?: boolean;
    isEditing?: boolean;
    onToggleEdit?: () => void;
    provideMissingDetailsLater?: boolean;
}

export const CustomerRegistrationPersonalDetailsForm: React.FC<CustomerRegistrationPersonalDetailsFormProps> = ({
    register,
    errors,
    isExistingCustomer = false,
    isEditing = false,
    onToggleEdit,
    provideMissingDetailsLater = false,
}) => {
    const isDisabled = isExistingCustomer && !isEditing;
    const disabledClasses = isDisabled ? "opacity-75 bg-slate-100/90 cursor-not-allowed select-none" : "";

    return (
        <div className="space-y-4">
            {isExistingCustomer && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={`p-2 rounded-lg ${isEditing ? "bg-amber-100 text-amber-700" : "bg-slate-200/70 text-slate-600"}`}
                        >
                            <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">Existing Customer Profile</p>
                            <p className="text-[11px] text-slate-500 font-medium">
                                {isEditing
                                    ? "Fields unlocked for editing. Modify any details below."
                                    : "Profile loaded from database. Fields are locked by default."}
                            </p>
                        </div>
                    </div>
                    {onToggleEdit && (
                        <button
                            type="button"
                            onClick={onToggleEdit}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                                isEditing
                                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                            title={isEditing ? "Lock fields" : "Click to edit customer details"}
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>{isEditing ? "Editing Mode" : "Edit Details"}</span>
                        </button>
                    )}
                </div>
            )}

            {/* Missing Details Agreement Checkbox for Daily Stays & Quick Registration */}
            <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-start gap-2.5">
                <input
                    type="checkbox"
                    id="provideMissingDetailsLater"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    {...register("provideMissingDetailsLater")}
                />
                <label
                    htmlFor="provideMissingDetailsLater"
                    className="text-xs font-semibold text-slate-700 cursor-pointer select-none leading-tight"
                >
                    I agree to provide the missing details later
                    <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                        Aadhaar, emergency contact, occupation, and address become optional.
                    </span>
                </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                    label="First Name"
                    type="text"
                    placeholder="e.g. Rajesh"
                    error={errors.firstName?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("firstName")}
                    required
                />

                <FormInput
                    label="Last Name"
                    type="text"
                    placeholder="e.g. Kumar"
                    error={errors.lastName?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("lastName")}
                    required
                />

                <FormSelect
                    label="Gender"
                    options={[
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                        { value: "Other", label: "Other" },
                    ]}
                    error={errors.gender?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("gender")}
                    required
                />

                <FormDatePicker
                    label="Date of Birth"
                    error={errors.dateOfBirth?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("dateOfBirth")}
                />

                <FormInput
                    label="Mobile Number"
                    type="text"
                    maxLength={10}
                    placeholder="10-digit phone number"
                    error={errors.mobileNumber?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("mobileNumber")}
                    required
                />

                <FormInput
                    label="Alternate Mobile Number"
                    type="text"
                    maxLength={10}
                    placeholder="Optional alternate mobile"
                    error={errors.altMobileNumber?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("altMobileNumber")}
                />

                <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="e.g. rajesh.kumar@example.com"
                    error={errors.email?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("email")}
                />

                <FormInput
                    label={`Aadhaar Card Number${provideMissingDetailsLater ? " (Optional)" : ""}`}
                    type="text"
                    maxLength={12}
                    placeholder={provideMissingDetailsLater ? "Optional 12-digit Aadhaar UID" : "12-digit Aadhaar UID"}
                    error={errors.aadhaarNumber?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("aadhaarNumber")}
                    required={!provideMissingDetailsLater}
                />

                <FormInput
                    label={`Occupation${provideMissingDetailsLater ? " (Optional)" : ""}`}
                    type="text"
                    placeholder={provideMissingDetailsLater ? "Optional occupation" : "e.g. Software Engineer"}
                    error={errors.occupation?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("occupation")}
                    required={!provideMissingDetailsLater}
                />

                <FormInput
                    label={`Emergency Contact Name${provideMissingDetailsLater ? " (Optional)" : ""}`}
                    type="text"
                    placeholder={provideMissingDetailsLater ? "Optional contact name" : "e.g. Ramesh Kumar"}
                    error={errors.emergencyContactName?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("emergencyContactName")}
                    required={!provideMissingDetailsLater}
                />

                <FormInput
                    label={`Emergency Contact Phone${provideMissingDetailsLater ? " (Optional)" : ""}`}
                    type="text"
                    maxLength={10}
                    placeholder={provideMissingDetailsLater ? "Optional contact phone" : "10-digit emergency phone"}
                    error={errors.emergencyContactPhone?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("emergencyContactPhone")}
                    required={!provideMissingDetailsLater}
                />

                <FormInput
                    label={`Permanent Address${provideMissingDetailsLater ? " (Optional)" : ""}`}
                    type="text"
                    placeholder={provideMissingDetailsLater ? "Optional permanent address" : "e.g. 12, Gandhi Nagar"}
                    containerClassName="sm:col-span-2"
                    error={errors.permanentAddress?.message as string}
                    disabled={isDisabled}
                    className={disabledClasses}
                    {...register("permanentAddress")}
                    required={!provideMissingDetailsLater}
                />
            </div>
        </div>
    );
};
