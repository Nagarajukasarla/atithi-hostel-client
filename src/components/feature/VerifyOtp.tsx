import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Building2, Key, AlertCircle, CheckCircle } from "lucide-react";

export const VerifyOtp: React.FC = () => {
    const { verifyOtp, tempUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (!tempUser) {
            navigate("/signup");
        }

        if (location.state && (location.state as any).signupSuccess) {
            setSuccessMsg("Signup successful! Please enter any 6-digit OTP code to verify.");
            window.history.replaceState({}, document.title);
        }
    }, [tempUser, navigate, location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const verified = await verifyOtp(otp);
            if (verified) {
                navigate("/");
            } else {
                setError("Invalid OTP code. Please enter any 6-digit number to validate.");
            }
        } catch (err) {
            setError("An error occurred during verification.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up" data-testid="verify-otp-container">
            {/* Mobile Header Badge */}
            <div className="lg:hidden flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Building2 className="h-5 w-5" />
                </div>
                <span className="text-base font-bold text-slate-900">Atithi Hostel</span>
            </div>

            {/* Header Text */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verify email</h2>
                <p className="text-sm font-normal text-slate-500">
                    We sent a verification code to{" "}
                    <span className="font-semibold text-slate-700">{tempUser?.email || "your email"}</span>
                </p>
            </div>

            {successMsg && (
                <div
                    className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium"
                    data-testid="verify-otp-success"
                >
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                </div>
            )}

            {error && (
                <div
                    className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium"
                    data-testid="verify-otp-error"
                >
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="verify-otp-form">
                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">6-Digit Verification Code *</label>
                    <input
                        type="text"
                        maxLength={6}
                        required
                        data-testid="verify-otp-input"
                        placeholder="e.g. 123456"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-center tracking-widest font-mono text-lg font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    data-testid="verify-otp-submit"
                    className="w-full inline-flex justify-center items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-lg shadow-indigo-600/25 transition duration-150 disabled:opacity-50"
                >
                    {loading ? (
                        "Verifying..."
                    ) : (
                        <>
                            <Key className="w-4 h-4" />
                            <span>Verify Code</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};
