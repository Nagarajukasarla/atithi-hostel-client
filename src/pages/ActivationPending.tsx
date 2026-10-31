import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    CheckCircle2,
    Clock,
    Copy,
    Check,
    RefreshCw,
    LogOut,
    Building2,
    Sparkles,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Edit2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    subscriptionService,
    type SubscriptionStatusResponse,
} from "@/api/subscriptionService";
import { PLANS, type PlanTier, getPlanById } from "@/data/plans";

const DEFAULT_UPI_ID = "7997712658@upi";

export const ActivationPending: React.FC = () => {
    const { user, hostel, logout, verifySession } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const passedPlanId = (location.state as any)?.selectedPlanId;
    const [selectedPlan, setSelectedPlan] = useState<PlanTier>(() => getPlanById(passedPlanId));
    const [utrNumber, setUtrNumber] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatusResponse | null>(null);
    const [isEditingUtr, setIsEditingUtr] = useState<boolean>(false);
    const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
    const [inputError, setInputError] = useState<string | null>(null);

    // If user is already active, redirect to dashboard
    useEffect(() => {
        if (user?.status === "ACTIVE") {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    // Fetch latest subscription status on mount
    const fetchStatus = async () => {
        try {
            const res = await subscriptionService.getStatus();
            if (res.code === 200 && res.data && (res.data as any).data) {
                const data = (res.data as any).data as SubscriptionStatusResponse;
                setSubscriptionStatus(data);
                if (data.planName) {
                    const matchedPlan = PLANS.find((p) => p.name === data.planName);
                    if (matchedPlan) setSelectedPlan(matchedPlan);
                }
                if (data.utrNumber) {
                    setUtrNumber(data.utrNumber);
                }
            }
        } catch (err) {
            console.warn("Could not fetch subscription status: ", err);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    // Copy UPI ID to clipboard
    const handleCopyUpi = () => {
        navigator.clipboard.writeText(DEFAULT_UPI_ID);
        setCopiedUpi(true);
        toast.success("UPI ID copied to clipboard");
        setTimeout(() => setCopiedUpi(false), 2000);
    };

    // Validate and submit 12-digit UTR
    const handleSubmitUtr = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = utrNumber.trim().toUpperCase();

        if (!trimmed) {
            setInputError("Please enter your 12-digit UTR / UPI reference number");
            return;
        }

        if (!/^[0-9A-Z]{12}$/.test(trimmed)) {
            setInputError("UTR must be exactly 12 alphanumeric characters (e.g. 428719827361)");
            return;
        }

        setInputError(null);
        setIsSubmitting(true);

        try {
            const res = await subscriptionService.submitUtr({
                planName: selectedPlan.name,
                amount: selectedPlan.priceTotal,
                utrNumber: trimmed,
                notes: `Plan: ${selectedPlan.name} (Rs. ${selectedPlan.priceTotal})`,
            });

            if (res.code === 200 || res.code === 201) {
                toast.success("12-digit UTR reference submitted successfully!");
                setIsEditingUtr(false);
                await fetchStatus();
            } else {
                const msg = (res.data as any)?.message || "Submission failed. Please check your UTR number.";
                setInputError(msg);
                toast.error(msg);
            }
        } catch (err: any) {
            console.error("UTR submission error: ", err);
            const msg = err?.message || "Failed to submit UTR. Please try again.";
            setInputError(msg);
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Manual status check button
    const handleCheckStatus = async () => {
        setIsCheckingStatus(true);
        try {
            await verifySession(true);
            await fetchStatus();

            if (user?.status === "ACTIVE") {
                toast.success("🎉 Workspace Activated! Welcome to Atithi.");
                navigate("/", { replace: true });
            } else {
                toast.info("Verification in progress. We are confirming your UTR with bank records.");
            }
        } catch (err) {
            toast.error("Could not verify status. Please try again.");
        } finally {
            setIsCheckingStatus(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
            {/* Top Navigation Bar */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg tracking-tight text-white">Atithi Aavas</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                Activation Pending
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">{hostel?.name || "Hostel Workspace"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-medium text-slate-300">{user?.name || "Hostel Owner"}</p>
                        <p className="text-[11px] text-slate-500">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 bg-slate-800/80 hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors border border-slate-700/60"
                        title="Sign Out"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sign Out</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8 justify-center">
                {/* Hero Banner */}
                <div className="text-center max-w-2xl mx-auto space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Step 2 of 2: Plan Activation</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Activate Your Hostel Workspace
                    </h1>
                    <p className="text-sm text-slate-400">
                        Scan the UPI QR code below to transfer your subscription fee, then enter your 12-digit UPI / UTR
                        transaction reference number to unlock immediate access.
                    </p>
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Plan Picker & UPI QR */}
                    <div className="lg:col-span-6 bg-slate-800/60 border border-slate-700/70 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col gap-6">
                        {/* Plan Selection Header & Tabs */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    1. Selected Plan
                                </label>
                                <button
                                    type="button"
                                    onClick={() => navigate("/select-plan")}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Change Plan</span>
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {PLANS.map((plan) => {
                                    const isSelected = selectedPlan.id === plan.id;
                                    return (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPlan(plan);
                                                setIsEditingUtr(true);
                                            }}
                                            className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                                isSelected
                                                    ? "bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40"
                                                    : "bg-slate-900/40 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[11px] font-bold truncate">{plan.durationMonths} Mo</span>
                                                {plan.badge && (
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 truncate max-w-[70px]">
                                                        {plan.isPopular ? "Popular" : plan.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-base font-extrabold text-white tracking-tight">
                                                ₹{plan.priceTotal.toLocaleString("en-IN")}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* UPI Payment Box */}
                        <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
                            {/* QR Code Container */}
                            <div className="p-2 bg-white rounded-xl shadow-md shrink-0 flex flex-col items-center">
                                <img
                                    src="/QR_bhim.png"
                                    alt="BHIM UPI QR Code"
                                    className="w-40 h-40 object-contain rounded-lg"
                                    loading="lazy"
                                />
                            </div>

                            {/* Payment Info */}
                            <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                                <div>
                                    <span className="text-[11px] font-medium text-slate-400">Total Payable Amount</span>
                                    <p className="text-2xl font-black text-white tracking-tight">
                                        ₹{selectedPlan.priceTotal.toLocaleString("en-IN")}
                                        <span className="text-xs font-normal text-slate-400 ml-1.5">(incl. all taxes)</span>
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <span className="text-[11px] font-medium text-slate-400">UPI ID / VPA</span>
                                    <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 justify-between">
                                        <code className="text-xs font-mono font-semibold text-indigo-300">
                                            {DEFAULT_UPI_ID}
                                        </code>
                                        <button
                                            onClick={handleCopyUpi}
                                            type="button"
                                            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                                            title="Copy UPI ID"
                                        >
                                            {copiedUpi ? (
                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : (
                                                <Copy className="w-3.5 h-3.5" />
                                            )}
                                            <span className="text-[10px]">{copiedUpi ? "Copied" : "Copy"}</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-[11px] text-slate-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                    <span>Accepts PhonePe, GPay, Paytm & BHIM</span>
                                </div>
                            </div>
                        </div>

                        
                    </div>

                    {/* Right Column: 12-Digit UTR Submission & Status Gate */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                        {/* UTR Form Card */}
                        <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    2. Submit Payment Proof (12-Digit UTR)
                                </label>
                                {subscriptionStatus && !isEditingUtr && (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingUtr(true)}
                                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        <span>Update UTR</span>
                                    </button>
                                )}
                            </div>

                            {/* If already submitted and not editing */}
                            {subscriptionStatus && !isEditingUtr ? (
                                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-5 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <Clock className="w-5 h-5 text-emerald-400 animate-spin" style={{ animationDuration: "8s" }} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-white">Payment Reference Submitted</h4>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    {subscriptionStatus.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-300 leading-relaxed">
                                                We have recorded your UTR reference. Verification typically completes within
                                                3 minutes once our banking portal reconciles the credit.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Submitted Reference Data */}
                                    <div className="bg-slate-900/80 rounded-lg p-3.5 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span className="text-slate-500 block text-[11px]">UTR Reference No.</span>
                                            <span className="font-mono font-bold text-indigo-300 text-sm tracking-wider">
                                                {subscriptionStatus.utrNumber}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-[11px]">Selected Plan</span>
                                            <span className="font-semibold text-slate-200">
                                                {subscriptionStatus.planName}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-[11px]">Amount</span>
                                            <span className="font-semibold text-emerald-400">
                                                ₹{subscriptionStatus.amount?.toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block text-[11px]">Submitted At</span>
                                            <span className="text-slate-300">
                                                {subscriptionStatus.createdAt
                                                    ? new Date(subscriptionStatus.createdAt).toLocaleTimeString([], {
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                      })
                                                    : "Just now"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* UTR Input Form */
                                <form onSubmit={handleSubmitUtr} className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-medium text-slate-300">
                                                12-Digit UTR / UPI Reference Number
                                            </span>
                                            <span
                                                className={`text-[11px] font-mono ${
                                                    utrNumber.trim().length === 12
                                                        ? "text-emerald-400 font-bold"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {utrNumber.trim().length} / 12 digits
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={utrNumber}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9a-zA-Z]/g, "").slice(0, 12);
                                                    setUtrNumber(val);
                                                    if (inputError) setInputError(null);
                                                }}
                                                placeholder="e.g. 428719827361"
                                                maxLength={12}
                                                className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-base font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:ring-2 transition-all ${
                                                    inputError
                                                        ? "border-red-500/80 focus:ring-red-500/30"
                                                        : "border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20"
                                                }`}
                                            />
                                            {utrNumber.trim().length === 12 && (
                                                <div className="absolute right-3.5 top-3.5 text-emerald-400 pointer-events-none">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>

                                        {inputError ? (
                                            <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                <span>{inputError}</span>
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                                You can find this 12-digit number in Google Pay, PhonePe, or Paytm under
                                                payment details labelled as <strong>UPI Ref No.</strong> or <strong>UTR</strong>.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || utrNumber.trim().length !== 12}
                                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                    <span>Submitting Reference...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Submit UTR Reference</span>
                                                    <ArrowRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>

                                        {subscriptionStatus && isEditingUtr && (
                                            <button
                                                type="button"
                                                onClick={() => setIsEditingUtr(false)}
                                                className="py-3 px-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Status Check & Auto-Unlock Card */}
                        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 backdrop-blur-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                        Activation Status Check
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        Once the administrator approves your transfer, your dashboard unlocks instantly.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleCheckStatus}
                                disabled={isCheckingStatus}
                                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-600/70 text-slate-100 font-medium text-sm transition-all flex items-center justify-center gap-2 group shadow-sm"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 text-indigo-400 transition-transform ${
                                        isCheckingStatus ? "animate-spin" : "group-hover:rotate-180"
                                    }`}
                                />
                                <span>{isCheckingStatus ? "Checking Activation..." : "Check Status Now"}</span>
                            </button>

                            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                                <span>Auto-checking every 15 seconds in the background</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ActivationPending;
