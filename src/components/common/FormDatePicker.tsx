import React, { forwardRef } from "react";

interface FormDatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    containerClassName?: string;
}

export const FormDatePicker = forwardRef<HTMLInputElement, FormDatePickerProps>(
    ({ label, error, containerClassName = "", className = "", ...props }, ref) => {
        return (
            <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
                <label className="text-xs font-semibold text-slate-700">
                    {label} {props.required && <span className="text-rose-500">*</span>}
                </label>
                <input
                    type="date"
                    ref={ref}
                    className={`block w-full px-3.5 py-2.5 border rounded-xl text-sm bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition duration-150 ease-in-out ${
                        error
                            ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/30"
                            : "border-slate-200"
                    } ${className}`}
                    {...props}
                />
                {error && <p className="text-xs font-medium text-rose-600 mt-0.5">{error}</p>}
            </div>
        );
    }
);

FormDatePicker.displayName = "FormDatePicker";
