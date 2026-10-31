import React, { forwardRef } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    prefixText?: string;
    containerClassName?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
    ({ label, error, prefixText, containerClassName = "", className = "", ...props }, ref) => {
        return (
            <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
                <label className="text-xs font-semibold text-slate-700">
                    {label} {props.required && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative rounded-xl">
                    {prefixText && (
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-xs">
                            {prefixText}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`block w-full py-2.5 border rounded-xl text-sm bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition duration-150 ease-in-out ${
                            prefixText ? "pl-8" : "pl-3.5"
                        } pr-3.5 ${
                            error
                                ? "border-rose-300 focus:ring-rose-500/25 focus:border-rose-500 bg-rose-50/30"
                                : "border-slate-200"
                        } ${className}`}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs font-medium text-rose-600 mt-0.5">{error}</p>}
            </div>
        );
    }
);

FormInput.displayName = "FormInput";
