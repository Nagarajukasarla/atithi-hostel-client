import React from "react";
import type { Customer } from "@/types";
import { User, Phone, Calendar, Home } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";

interface CustomerCardProps {
    customer: Customer;
    onEdit?: (customer: Customer) => void;
    onDelete?: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onEdit, onDelete }) => {
    return (
        <div className="bg-brand-card rounded-xl border border-brand-border p-5 shadow-soft hover:shadow-medium transition duration-200">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-bg text-brand-primary flex items-center justify-center border border-brand-border">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-brand-primary leading-tight">{customer.fullName}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold mt-1">
                            <Home className="h-3 w-3" />
                            <span>
                                Room {customer.roomNumber} (Floor {customer.floor})
                            </span>
                        </div>
                    </div>
                </div>
                <StatusBadge status={customer.paymentStatus} />
            </div>

            <div className="mt-4 pt-4 border-t border-brand-border grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-neutral-500 font-semibold">
                <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-neutral-400" />
                    <span>{customer.mobileNumber}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Joined {new Date(customer.joinDate).toLocaleDateString()}</span>
                </div>
                <div className="col-span-2 flex justify-between mt-2 pt-2 border-t border-brand-border/60">
                    <div>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Monthly Rent</p>
                        <p className="text-sm font-bold text-brand-primary">₹{customer.monthlyRent}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Due Amount</p>
                        <p
                            className={`text-sm font-bold ${customer.dueAmount > 0 ? "text-rose-600" : "text-neutral-700"}`}
                        >
                            ₹{customer.dueAmount}
                        </p>
                    </div>
                </div>
            </div>

            {(onEdit || onDelete) && (
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-brand-border/60">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(customer)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-brand-inputBorder bg-white text-neutral-700 hover:bg-neutral-50 transition"
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(customer)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-transparent bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                        >
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
