import React from "react";
import { Badge, type BadgeTone, type BadgeSize } from "./Badge";

interface StatusBadgeProps {
    status: string;
    size?: BadgeSize;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "sm", className = "" }) => {
    const getTone = (): BadgeTone => {
        const s = status.trim().toLowerCase();
        switch (s) {
            case "paid":
            case "registered":
            case "clean":
            case "success":
            case "available":
            case "vacant":
                return "success";
            case "partial":
            case "pending":
            case "partially occupied":
            case "partially filled":
            case "due today":
                return "warning";
            case "upcoming":
                return "info";
            case "unpaid":
            case "overdue":
            case "dirty":
            case "failed":
            case "cancelled":
            case "full":
            case "filled":
                return "danger";
            case "refunded":
            case "inspected":
                return "info";
            default:
                return "neutral";
        }
    };

    return (
        <Badge tone={getTone()} size={size} className={className}>
            {status}
        </Badge>
    );
};
