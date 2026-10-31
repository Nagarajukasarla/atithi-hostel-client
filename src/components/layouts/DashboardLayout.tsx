import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, User, LogOut, Mail, Phone, MapPin, Plus, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatHostelAddress } from "@/utils/formatters";
import { Sidebar } from "./Sidebar";

export const DashboardLayout: React.FC = () => {
    const { user, hostel, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const toggleSidebar = () => setCollapsed(!collapsed);
    const toggleMobile = () => setMobileOpen(!mobileOpen);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        const logoutSucceeded = await logout();
        setIsLoggingOut(false);

        if (!logoutSucceeded) {
            alert("Unable to sign out. Please try again.");
            return;
        }

        setDropdownOpen(false);
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none" data-testid="dashboard-layout">
            {/* Modular Sidebar Component */}
            <Sidebar collapsed={collapsed} onToggleCollapse={toggleSidebar} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

            {/* Main Content Workspace */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header Bar (Matches Screenshots 2 & 3 Top Header) */}
                <header
                    className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 select-none z-30"
                    data-testid="dashboard-header"
                >
                    {/* Mobile menu icon */}
                    <div className="flex items-center gap-3 lg:hidden">
                        <button
                            onClick={toggleMobile}
                            data-testid="sidebar-mobile-toggle"
                            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition border border-slate-200"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-bold text-slate-900">Atithi Hostel</span>
                    </div>

                    {/* Desktop Quick Header Actions (Matches Screenshot 2 & 3) */}
                    <div className="hidden lg:flex items-center gap-3">
                        <button
                            onClick={() => navigate("/customers?action=new")}
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            <span>+ New Reservation</span>
                        </button>
                    </div>

                    {/* Right Header Status Banner Badge & Profile */}
                    <div className="flex items-center gap-4">
                        {/* Welcome Status Banner (Matches Screenshot 2 top right banner) */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Welcome back, {user?.name || "Admin"}!</span>
                        </div>

                        {/* User Avatar Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                data-testid="user-profile-button"
                                className="flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 bg-slate-100 hover:bg-slate-200 transition focus:outline-none overflow-hidden"
                            >
                                <User className="h-5 w-5 text-slate-600" />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                                    <div
                                        className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 space-y-3.5 z-20"
                                        data-testid="user-profile-dropdown"
                                    >
                                        <div className="pb-3 border-b border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hostel Profile</p>
                                            <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{hostel?.name || user?.name}</p>
                                        </div>

                                        <div className="space-y-2 text-xs font-medium text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                <span className="truncate">{user?.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                <span>{hostel?.phone || user?.phone}</span>
                                            </div>
                                            {formatHostelAddress(hostel) !== "No address configured yet" ? (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                                    <span className="leading-relaxed">{formatHostelAddress(hostel)}</span>
                                                </div>
                                            ) : user?.address ? (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                                    <span className="leading-relaxed">{user.address}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100">
                                            <button
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                data-testid="logout-button"
                                                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 border border-transparent rounded-xl transition"
                                            >
                                                <LogOut className="h-3.5 w-3.5" />
                                                {isLoggingOut ? "Signing Out..." : "Sign Out"}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-4 py-6 sm:p-6 lg:p-8" data-testid="main-content">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
