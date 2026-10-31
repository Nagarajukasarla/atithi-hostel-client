import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PLANS, type PlanTier } from "@/data/plans";
import { PlanCard } from "@/components/feature/PlanCard";

export const SelectPlan: React.FC = () => {
    const { user, hostel, logout } = useAuth();
    const navigate = useNavigate();

    // If user is already active, redirect to dashboard
    useEffect(() => {
        if (user?.status === "ACTIVE") {
            navigate("/", { replace: true });
        }
    }, [user, navigate]);

    const handleActivatePlan = (plan: PlanTier) => {
        navigate("/activation-pending", {
            state: { selectedPlanId: plan.id },
        });
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-3xl" />
            </div>

            {/* Top Navigation Bar */}
            <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-lg tracking-tight text-white">Atithi Aavas</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                                Step 1 of 2
                            </span>
                        </div>
                        <p className="text-xs text-slate-400">{hostel?.name || "Hostel Workspace Setup"}</p>
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

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
                {/* Hero Header */}
                <div className="text-center max-w-3xl mx-auto space-y-3 mb-10 sm:mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Simple, Transparent Property Subscriptions</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Choose Your Subscription Plan
                    </h1>
                    <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Select a plan below to activate your hostel workspace. Click <strong className="text-white">Activate</strong> to proceed to UPI QR payment and instant 12-digit UTR verification.
                    </p>
                </div>

                {/* 3 Large Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8 items-stretch pt-2">
                    {PLANS.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            buttonText="Activate"
                            onSelectPlan={handleActivatePlan}
                        />
                    ))}
                </div>

                {/* Bottom Trust Badge */}
                <div className="mt-12 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Instant activation upon 12-digit UTR verification • All plans include full KYC vault, and POS tracking</span>
                </div>
            </main>
        </div>
    );
};

export default SelectPlan;
