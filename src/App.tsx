import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import { StatisticsProvider } from "@/context/StatisticsContext";
import { ToastProvider } from "@/context/ToastContext";
import { ProtectedRoute } from "@/components/routes/ProtectedRoute";
import { PublicRoute } from "@/components/routes/PublicRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Customers } from "@/pages/Customers";
import { Rooms } from "@/pages/Rooms";
import { DailyRooms } from "@/pages/DailyRooms";
import { Massage } from "@/pages/Massage";
import { Laundry } from "@/pages/Laundry";
import { Housekeeping } from "@/pages/Housekeeping";
import { Authentication } from "@/pages/Authentication";
import { Settings } from "@/pages/Settings";
import { Payments } from "@/pages/Payments";
import { Plans } from "@/pages/Plans";
import { GuestSelfRegistration } from "@/pages/GuestSelfRegistration";
import { Login } from "@/components/feature/Login";
import { Signup } from "@/components/feature/Signup";
import { VerifyOtp } from "@/components/feature/VerifyOtp";
import { ActivationPendingRoute } from "@/components/routes/ActivationPendingRoute";
import { SelectPlanRoute } from "@/components/routes/SelectPlanRoute";
import "@/App.css";

function App() {
    return (
        <SettingsProvider>
            <ToastProvider>
                <AuthProvider>
                    <StatisticsProvider>
                        <BrowserRouter>
                            <Routes>
                                {/* Public Guest Self-Registration Route (Clean URL, no auth required) */}
                                <Route
                                    path="/public/customer-registration/:token"
                                    element={<GuestSelfRegistration />}
                                />

                                {/* Plan Selection & Activation Gated Routes */}
                                <Route
                                    path="/select-plan"
                                    element={<SelectPlanRoute />}
                                />
                                <Route
                                    path="/activation-pending"
                                    element={<ActivationPendingRoute />}
                                />

                                {/* Public/Auth Routes */}
                                <Route element={<PublicRoute />}>
                                    <Route element={<AuthLayout />}>
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/signup" element={<Signup />} />
                                        <Route path="/verify-otp" element={<VerifyOtp />} />
                                    </Route>
                                </Route>

                                {/* Protected Routes */}
                                <Route element={<ProtectedRoute />}>
                                    <Route element={<DashboardLayout />}>
                                        <Route path="/" element={<Dashboard />} />
                                        <Route path="customers" element={<Customers />} />
                                        <Route path="daily-rooms" element={<DailyRooms />} />
                                        <Route path="rooms" element={<Rooms />} />
                                        <Route path="payments" element={<Payments />} />
                                        <Route path="massage" element={<Massage />} />
                                        <Route path="laundry" element={<Laundry />} />
                                        <Route path="housekeeping" element={<Housekeeping />} />
                                        <Route path="authentication" element={<Authentication />} />
                                        <Route path="settings" element={<Settings />} />
                                        <Route path="plans" element={<Plans />} />
                                    </Route>
                                </Route>

                                {/* Redirect any other unknown path to login */}
                                <Route path="*" element={<Navigate to="/login" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </StatisticsProvider>
                </AuthProvider>
            </ToastProvider>
        </SettingsProvider>
    );
}

export default App;
