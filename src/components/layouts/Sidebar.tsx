import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Home,
    Fingerprint,
    Settings,
    ChevronLeft,
    ChevronRight,
    X,
    Building2,
    CalendarDays,
    Sparkles,
    Shirt,
    Brush,
    CreditCard,
    Crown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatHostelShortLocation } from "@/utils/formatters";

interface SidebarItem {
    name: string;
    path: string;
    icon: React.ReactNode;
}

export interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    mobileOpen: boolean;
    onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) => {
    const { user, hostel } = useAuth();
    const location = useLocation();

    const sidebarItems: SidebarItem[] = [
        { name: "Dashboard", path: "/", icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
        { name: "Customers", path: "/customers", icon: <Users className="h-4.5 w-4.5" /> },
        { name: "Daily Basis Rooms", path: "/daily-rooms", icon: <CalendarDays className="h-4.5 w-4.5" /> },
        { name: "Room & Beds", path: "/rooms", icon: <Home className="h-4.5 w-4.5" /> },
        { name: "Payments", path: "/payments", icon: <CreditCard className="h-4.5 w-4.5" /> },
        { name: "Massage", path: "/massage", icon: <Sparkles className="h-4.5 w-4.5" /> },
        { name: "Laundry", path: "/laundry", icon: <Shirt className="h-4.5 w-4.5" /> },
        { name: "Housekeeping", path: "/housekeeping", icon: <Brush className="h-4.5 w-4.5" /> },
        { name: "Authentication", path: "/authentication", icon: <Fingerprint className="h-4.5 w-4.5" /> },
        { name: "Settings", path: "/settings", icon: <Settings className="h-4.5 w-4.5" /> },
        { name: "Plans", path: "/plans", icon: <Crown className="h-4.5 w-4.5" /> },
    ];

    const isActive = (itemPath: string) => {
        const [itemBasePath, itemQuery] = itemPath.split("?");
        if (itemBasePath === "/") {
            return location.pathname === "/";
        }
        if (location.pathname !== itemBasePath) {
            return false;
        }
        if (!itemQuery) {
            return true;
        }
        const itemParams = new URLSearchParams(itemQuery);
        const locationParams = new URLSearchParams(location.search);
        return itemParams.get("tab") === locationParams.get("tab");
    };

    return (
        <>
            {/* Mobile Drawer Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px] lg:hidden transition-opacity"
                    onClick={onCloseMobile}
                    data-testid="sidebar-mobile-backdrop"
                />
            )}

            {/* Sidebar - Stayloop Dark Navy Theme */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[#090D1A] text-white transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-slate-800 ${
                    mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
                } ${collapsed ? "lg:w-20" : "lg:w-64"}`}
                data-testid="sidebar"
            >
                {/* Brand Header */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-[#090D1A]">
                    <Link
                        to="/"
                        className="flex items-center gap-3 overflow-hidden"
                        onClick={onCloseMobile}
                        data-testid="sidebar-logo"
                    >
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                            <Building2 className="h-5 w-5" />
                        </div>
                        {(!collapsed || mobileOpen) && (
                            <div className="truncate">
                                <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Atithi</h1>
                            </div>
                        )}
                    </Link>
                    <button
                        onClick={onCloseMobile}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
                        data-testid="sidebar-mobile-close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Property Card Selector */}
                {(!collapsed || mobileOpen) && (
                    <div className="mx-3 my-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PROPERTY</p>
                        <p className="text-xs font-bold text-white truncate">
                            {hostel?.name || user?.name || "Atithi Hostel"}
                        </p>
                        <p className="text-[11px] font-medium text-slate-400 truncate">
                            {formatHostelShortLocation(hostel)}
                        </p>
                    </div>
                )}

                {/* Navigation Menu Links */}
                <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto" data-testid="sidebar-nav">
                    {sidebarItems.map(item => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                title={collapsed && !mobileOpen ? item.name : undefined}
                                onClick={onCloseMobile}
                                data-testid={`sidebar-link-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                                    collapsed ? "lg:justify-center lg:gap-0 lg:px-2" : ""
                                } ${
                                    active
                                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30"
                                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                                }`}
                            >
                                <div className="flex-shrink-0">{item.icon}</div>
                                {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer Toggle */}
                <div className="hidden lg:flex items-center justify-end p-3 border-t border-slate-800/80">
                    <button
                        onClick={onToggleCollapse}
                        data-testid="sidebar-collapse-toggle"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/60 hover:bg-slate-800 transition text-slate-400 hover:text-white"
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
