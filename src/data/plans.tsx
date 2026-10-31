import React from "react";
import { Zap, Crown, ShieldCheck } from "lucide-react";

export interface PlanTier {
    id: "3_months" | "6_months" | "12_months";
    name: string;
    tagline: string;
    durationMonths: number;
    priceTotal: number;
    badge?: string;
    isPopular?: boolean;
    isBestValue?: boolean;
    savingsPercent?: number;
    icon: React.ReactNode;
    accentColor: string;
    features: { text: string; highlight?: boolean }[];
    idealFor: string;
}

export const PLANS: PlanTier[] = [
    {
        id: "3_months",
        name: "Quarterly Starter",
        tagline: "Ideal for small hostels & newly established properties",
        durationMonths: 3,
        priceTotal: 10499,
        badge: "STARTER",
        accentColor: "indigo",
        icon: <Zap className="h-5 w-5 text-indigo-500" />,
        idealFor: "Up to 50 beds",
        features: [
            { text: "Up to 50 Beds & Room allocations", highlight: true },
            { text: "Dual-mode Billing (Monthly & Daily stays)" },
            { text: "Automated GST Invoices & PDF receipts" },
            { text: "Customer Aadhaar & Document KYC Vault" },
            { text: "Room Cleanliness & Housekeeping status" },
            { text: "Real-time Occupancy & Dues analytics" },
            { text: "Email & Helpdesk ticket support" },
        ],
    },
    {
        id: "6_months",
        name: "Half-Yearly Pro",
        tagline: "Flexible and cost-effective for established hostels & co-living spaces",
        durationMonths: 6,
        priceTotal: 19945,
        badge: "VALUABLE — SAVE 5%",
        isPopular: false,
        isBestValue: true,
        savingsPercent: 5,
        accentColor: "violet",
        icon: <Crown className="h-5 w-5 text-amber-300" />,
        idealFor: "Up to 250 beds",
        features: [
            { text: "Up to 200 Beds & Multiple Floors/Wings", highlight: true },
            { text: "Everything in Quarterly Starter" },
            { text: "POS Services (Amenities Tracking)" },
            { text: "Staff Access Control (Admin)" },
            { text: "Priority 24/7 Support", highlight: true },
        ],
    },
    {
        id: "12_months",
        name: "Annual Enterprise",
        tagline: "Maximum savings & dedicated enterprise-grade power",
        durationMonths: 12,
        priceTotal: 35689,
        badge: "POPULAR — SAVE 15%",
        isPopular: true,
        isBestValue: true,
        savingsPercent: 15,
        accentColor: "emerald",
        icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />,
        idealFor: "Unlimited beds & multi-branches",
        features: [
            { text: "Up to 400 Beds", highlight: true },
            { text: "Everything in Half-Yearly Pro" },
            { text: "Full Financial Reports & P&L Export", highlight: true },
        ],
    },
];

export const getPlanById = (id?: string | null): PlanTier => {
    if (!id) return PLANS[2]; // default Annual Enterprise (Most Popular)
    return PLANS.find((p) => p.id === id) || PLANS[2];
};
