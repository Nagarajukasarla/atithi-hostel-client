import React from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormInput } from "@/components/common/FormInput";
import { Search, Loader2, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface CustomerRegistrationAadhaarLookupFormProps {
    register: UseFormRegister<any>;
    errors: FieldErrors<any>;
    watchedAadhaar: string;
    searchStatus: {
        type: "idle" | "searching" | "success" | "not_found" | "error";
        message: string;
        customerName?: string;
    };
    onSearch: () => void;
}

export const CustomerRegistrationAadhaarLookupForm: React.FC<CustomerRegistrationAadhaarLookupFormProps> = ({
    register,
    errors,
    watchedAadhaar,
    searchStatus,
    onSearch,
}) => {
    const isValidAadhaar = watchedAadhaar && /^\d{12}$/.test(watchedAadhaar);

    return (
        <div className="space-y-6 max-w-md mx-auto py-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Aadhaar KYC Lookup</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Verify Aadhaar card number to retrieve existing customer records. Pre-fills personal details if
                    found.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <FormInput
                    label="Aadhaar Card Number"
                    type="text"
                    maxLength={12}
                    placeholder="12-digit Aadhaar UID"
                    error={errors.aadhaarNumber?.message as string}
                    containerClassName="flex-1"
                    {...register("aadhaarNumber")}
                    required
                />
                <button
                    type="button"
                    onClick={onSearch}
                    disabled={!isValidAadhaar || searchStatus.type === "searching"}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl text-white transition shadow-md h-[42px] flex items-center justify-center gap-1.5 ${
                        isValidAadhaar && searchStatus.type !== "searching"
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                            : "bg-slate-300 cursor-not-allowed"
                    }`}
                >
                    {searchStatus.type === "searching" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                    Search
                </button>
            </div>

            {searchStatus.type !== "idle" && (
                <div
                    className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                        searchStatus.type === "searching"
                            ? "bg-slate-50 border-slate-200 text-slate-700"
                            : searchStatus.type === "success"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : searchStatus.type === "not_found"
                                ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                                : "bg-amber-50 border-amber-200 text-amber-800"
                    }`}
                >
                    {searchStatus.type === "searching" && (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-500 flex-shrink-0 mt-0.5" />
                    )}
                    {searchStatus.type === "success" && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    )}
                    {(searchStatus.type === "not_found" || searchStatus.type === "error") && (
                        <AlertCircle
                            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                searchStatus.type === "not_found" ? "text-indigo-600" : "text-amber-600"
                            }`}
                        />
                    )}
                    <div className="space-y-0.5">
                        <p className="text-xs font-bold">
                            {searchStatus.type === "searching" && "Searching Database"}
                            {searchStatus.type === "success" && "Customer Record Found"}
                            {searchStatus.type === "not_found" && "New Customer Registration"}
                            {searchStatus.type === "error" && "Offline Search"}
                        </p>
                        <p className="text-xs font-medium opacity-90 leading-relaxed">{searchStatus.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
