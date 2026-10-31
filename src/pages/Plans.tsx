import React, { useEffect, useRef, useState } from "react";
import {
    Sparkles,
    Check,
    Crown,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    PhoneCall,
    Layers,
    Lock,
    X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { PLANS, type PlanTier } from "@/data/plans";
import { PlanCard } from "@/components/feature/PlanCard";

const FAQS = [
    {
        question: "Can I upgrade or extend my subscription midway?",
        answer: "Yes, absolutely! When you upgrade before your current cycle ends, the remaining balance of your active plan is automatically pro-rated and credited towards your new plan.",
    },
    {
        question: "What payment methods are supported?",
        answer: "We support all major Indian payment methods via instant gateway: UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking across 50+ banks, Credit/Debit cards (Visa, MasterCard, RuPay), and NEFT/RTGS bank transfers.",
    },
    {
        question: "What happens to my data if my subscription expires?",
        answer: "Your data remains 100% safe, encrypted, and accessible in read-only mode for 90 days following expiration. You can renew at any time to resume full operational access without losing any guest records or financials.",
    },
];

export const Plans: React.FC = () => {
    const { hostel } = useAuth();
    const { toast } = useToast();

    const [selectedPlan, setSelectedPlan] = useState<PlanTier>(PLANS[1]); // Default to 6 months
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
    const [currentActivePlanId] = useState<string>("6_months"); // Simulation of current active plan

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Full-Page Infinite Bluish Interactive Dots Animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);

        // Generate lively bluish dot particles across the entire viewport
        const particleCount = Math.min(100, Math.max(60, Math.floor((width * height) / 10000)));
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            baseAlpha: number;
            pulseSpeed: number;
            color: string;
        }> = [];

        const colorPalette = [
            "rgba(99, 102, 241,", // Indigo
            "rgba(59, 130, 246,", // Blue
            "rgba(14, 165, 233,", // Sky
            "rgba(139, 92, 246,", // Purple
        ];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 1.3,
                vy: (Math.random() - 0.5) * 1.3,
                radius: Math.random() * 2 + 1.8,
                baseAlpha: Math.random() * 0.35 + 0.55,
                pulseSpeed: 0.02 + Math.random() * 0.025,
                color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
            });
        }

        let mouseX = -2000;
        let mouseY = -2000;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const handleMouseLeave = () => {
            mouseX = -2000;
            mouseY = -2000;
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);

        let tick = 0;

        const render = () => {
            tick++;
            ctx.clearRect(0, 0, width, height);

            // 1. Draw connecting lines between particles
            ctx.shadowBlur = 0;
            for (let i = 0; i < particles.length; i++) {
                const p1 = particles[i];

                p1.x += p1.vx;
                p1.y += p1.vy;

                // Bounce off edges smoothly
                if (p1.x < 0 || p1.x > width) p1.vx *= -1;
                if (p1.y < 0 || p1.y > height) p1.vy *= -1;

                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 135) {
                        const lineAlpha = (1 - dist / 135) * 0.35;
                        ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
                        ctx.lineWidth = 0.9;
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }

                // Interactive connection to mouse cursor
                const mouseDx = p1.x - mouseX;
                const mouseDy = p1.y - mouseY;
                const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
                if (mouseDist < 160) {
                    const mouseAlpha = (1 - mouseDist / 160) * 0.55;
                    ctx.strokeStyle = `rgba(79, 70, 229, ${mouseAlpha})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(mouseX, mouseY);
                    ctx.stroke();

                    // Subtle interactive pull towards cursor
                    p1.x -= (mouseDx / mouseDist) * 0.35;
                    p1.y -= (mouseDy / mouseDist) * 0.35;
                }
            }

            // 2. Draw glowing particle nodes
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const currentAlpha = p.baseAlpha + Math.sin(tick * p.pulseSpeed) * 0.15;

                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(99, 102, 241, 0.6)";
                ctx.fillStyle = `${p.color} ${Math.max(0.3, currentAlpha)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const handleSelectPlan = (plan: PlanTier) => {
        setSelectedPlan(plan);
        setIsCheckoutModalOpen(true);
    };

    const handleConfirmSubscription = () => {
        setIsProcessingPayment(true);
        setTimeout(() => {
            setIsProcessingPayment(false);
            setIsCheckoutModalOpen(false);
            toast.success(`Successfully activated the ${selectedPlan.name} for ${hostel?.name || "your hostel"}!`);
        }, 1200);
    };

    return (
        <>
            {/* Subtle Full-Page Bluish Ambient Glows (Placed behind canvas) */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-10 right-1/4 w-[550px] h-[550px] bg-blue-100/40 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-10 w-[450px] h-[450px] bg-indigo-100/35 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-sky-100/30 rounded-full blur-3xl" />
            </div>

            {/* Full-Page Fixed Canvas Interactive Bluish Animation Background (Z-index 1 so clearly visible) */}
            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none z-[1]"
                style={{ width: "100vw", height: "100vh" }}
            />

            <div className="relative z-10 space-y-6 animate-fade-in-up -mt-2 sm:-mt-4 pb-12">
                {/* Top Header */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/85 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold tracking-wider uppercase mb-1.5">
                            <Sparkles className="h-3 w-3 text-indigo-500 animate-pulse" />
                            <span>Transparent Property Subscriptions</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                            Subscription Plans & Pricing
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Choose the duration that matches your operating cycle. Switch or extend anytime with instant activation.
                        </p>
                    </div>
                </div>

                {/* Pricing Cards Grid (3 Months, 6 Months, 12 Months) - Extra vertical gap on mobile for top badges */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 lg:gap-8 items-stretch pt-4 md:pt-2">
                    {PLANS.map(plan => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            isCurrent={plan.id === currentActivePlanId}
                            onSelectPlan={handleSelectPlan}
                        />
                    ))}
                </div>

            {/* Feature Comparison Matrix Section (Refined: Removed Smart Dues, Support Level, Biometrics as requested) */}
            <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        <Layers className="h-4 w-4" />
                        <span>Comprehensive Breakdown</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Compare Plan Features & Capabilities
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Review the operational differences between Quarterly, Half-Yearly, and Annual plans.
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                            <tr>
                                <th className="py-4 px-4 sm:px-6">Feature / Capability</th>
                                <th className="py-4 px-4 sm:px-6 text-center">3 Months (Starter)</th>
                                <th className="py-4 px-4 sm:px-6 text-center">6 Months (Pro)</th>
                                <th className="py-4 px-4 sm:px-6 text-center bg-indigo-50/50 text-indigo-900 font-extrabold">
                                    12 Months (Enterprise)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                            <tr>
                                <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">Bed Capacity</td>
                                <td className="py-3.5 px-4 sm:px-6 text-center">Up to 50 beds</td>
                                <td className="py-3.5 px-4 sm:px-6 text-center font-bold text-slate-700">
                                    Up to 200 beds
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center bg-indigo-50/20 font-bold text-emerald-700">
                                    Up to 400 beds
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                                    Multi-mode Daily & Monthly Billing
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center bg-indigo-50/20">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                                    Automated GST-Ready Invoicing & PDF Receipts
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center bg-indigo-50/20">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                                    Housekeeping & Room Cleanliness Tracking
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center bg-indigo-50/20">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                                    Financial P&L & Cash Flow Reports
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center text-slate-400">—</td>
                                <td className="py-3.5 px-4 sm:px-6 text-center text-slate-400">—</td>
                                <td className="py-3.5 px-4 sm:px-6 text-center bg-indigo-50/20 font-semibold text-slate-900">
                                    Full P&L Export & Advanced Reports
                                </td>
                            </tr>
                            <tr>
                                <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                                    Staff Role Management & Audit Trails
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center text-slate-400">—</td>
                                <td className="py-3.5 px-4 sm:px-6 text-center">
                                    <Check className="h-4 w-4 text-indigo-600 mx-auto" />
                                </td>
                                <td className="py-3.5 px-4 sm:px-6 text-center bg-indigo-50/20">
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-6">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                        <HelpCircle className="h-4 w-4" />
                        <span>Got Questions?</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="space-y-3">
                    {FAQS.map((faq, idx) => {
                        const isOpen = activeFaq === idx;
                        return (
                            <div
                                key={idx}
                                className="border border-slate-200/80 rounded-2xl overflow-hidden transition"
                            >
                                <button
                                    type="button"
                                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    <span>{faq.question}</span>
                                    {isOpen ? (
                                        <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                                    )}
                                </button>
                                {isOpen && (
                                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/40 border-t border-slate-100">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Custom Enterprise Banner */}
            <div className="relative z-10 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Need a custom plan for 5+ hostels?</h3>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                        We offer customized enterprise agreements, centralized multi-property accounting, and custom API
                        integrations for large hostel chains.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => toast.info("Our enterprise solutions team will contact your registered phone.")}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-bold transition shadow-md whitespace-nowrap cursor-pointer"
                >
                    <PhoneCall className="h-4 w-4 text-indigo-600" />
                    <span>Talk to Enterprise Team</span>
                </button>
            </div>

            </div>

            {/* Subscription Checkout Simulation Modal */}
            {isCheckoutModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-up">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-600/20">
                                    <Crown className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Subscribe to {selectedPlan.name}</h3>
                                    <p className="text-xs text-slate-500">
                                        For {hostel?.name || "your hostel accommodation"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCheckoutModalOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="p-6 space-y-5">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70 space-y-3 text-xs sm:text-sm">
                                <div className="flex items-center justify-between font-semibold text-slate-800">
                                    <span>Plan Term</span>
                                    <span>{selectedPlan.durationMonths} Months</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Base Subscription</span>
                                    <span>₹{selectedPlan.priceTotal.toLocaleString("en-IN")}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>GST (18% Included)</span>
                                    <span>₹{Math.round(selectedPlan.priceTotal * 0.18).toLocaleString("en-IN")}</span>
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-base font-black text-slate-900">
                                    <span>Total Payable</span>
                                    <span className="text-indigo-600">₹{selectedPlan.priceTotal.toLocaleString("en-IN")}</span>
                                </div>
                            </div>

                            {/* Payment Options */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Select Payment Method:
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 font-semibold text-slate-800 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            defaultChecked
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>UPI / QR Instant</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium text-slate-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>NetBanking / Cards</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>256-bit encrypted checkout with instant activation & tax receipt.</span>
                            </div>

                            {/* Buttons */}
                            <div className="pt-2 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCheckoutModalOpen(false)}
                                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmSubscription}
                                    disabled={isProcessingPayment}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isProcessingPayment ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Activating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            <span>Pay ₹{selectedPlan.priceTotal.toLocaleString("en-IN")} & Activate</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
export default Plans;
