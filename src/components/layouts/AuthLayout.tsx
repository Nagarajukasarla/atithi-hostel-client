import React from "react";
import { Outlet } from "react-router-dom";
import { Building2, CheckCircle2, ShieldCheck, Users2 } from "lucide-react";

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen w-full flex bg-[#F8FAFC] overflow-hidden select-none">
            {/* Left Column: Dark Hero Banner & Features Overlay (Matches Screenshot 1) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#090D1A] text-white flex-col justify-between p-12 overflow-hidden border-r border-slate-800">
                {/* Background Decorative Lighting Gradient */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                {/* Brand Header */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold tracking-wider text-white">Atithi</h1>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Hyderabad, India</p>
                    </div>
                </div>

                {/* Hero Title & Subtitle */}
                <div className="relative z-10 my-auto space-y-6 max-w-lg">
                    <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                        Atithi — <span className="text-indigo-400">Hyderabad, India</span>
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-300 font-normal">
                        One unified platform for customer check-ins, room allocations, housekeeping, Aadhaar
                        KYC verification, and GST-ready automated billing.
                    </p>

                    {/* Feature Checklist Badges */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md transition hover:bg-white/10">
                            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-200">
                                Real-time room & bed availability
                            </span>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md transition hover:bg-white/10">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-200">
                                GST-compliant invoicing out of the box
                            </span>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md transition hover:bg-white/10">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                <Users2 className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-semibold text-slate-200">
                                Role-based access for every team member
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer info */}
                <div className="relative z-10 text-xs text-slate-500 font-medium">
                    © {new Date().getFullYear()} Atithi PMS. All rights reserved.
                </div>
            </div>

            {/* Right Column: Form Container */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 sm:p-10 transition-all duration-300">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};
