import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, ArrowRight, AlertCircle, Building2 } from "lucide-react";

export const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate("/");
            } else {
                setError(result.error || "Invalid email or Password");
            }
        } catch (err: any) {
            setError(err?.message || "Invalid email or Password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up" data-testid="login-container">
            {/* Mobile Header Badge */}
            <div className="lg:hidden flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Building2 className="h-5 w-5" />
                </div>
                <span className="text-base font-bold text-slate-900">Atithi Hostel</span>
            </div>

            {/* Header Text */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
                <p className="text-sm font-normal text-slate-500">Sign in to your hostel dashboard.</p>
            </div>

            {error && (
                <div
                    className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium"
                    data-testid="login-error"
                >
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
                {/* Email Field */}
                <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-700">
                        Work email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Mail className="h-4 w-4" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            required
                            data-testid="login-email"
                            placeholder="admin@atithiaavas.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                            Password <span className="text-rose-500">*</span>
                        </label>
                        <a
                            href="#forgot"
                            onClick={e => {
                                e.preventDefault();
                                alert("Password reset link sent to registered email.");
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                            Forgot?
                        </a>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Lock className="h-4 w-4" />
                        </div>
                        <input
                            id="password"
                            type="password"
                            required
                            data-testid="login-password"
                            placeholder="••••••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                        />
                    </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center gap-2 pt-1">
                    <input
                        id="remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="remember" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
                        Remember me on this device
                    </label>
                </div>

                {/* CTA Button */}
                <button
                    type="submit"
                    disabled={loading}
                    data-testid="login-submit"
                    className="w-full mt-2 inline-flex justify-center items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-lg shadow-indigo-600/25 transition duration-150 disabled:opacity-50"
                >
                    {loading ? (
                        "Signing in..."
                    ) : (
                        <>
                            <span>Sign in</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>

            {/* Signup Redirect */}
            <div className="pt-4 border-t border-slate-100 text-center text-xs font-medium text-slate-500">
                New to Atithi?{" "}
                <Link
                    to="/signup"
                    className="font-semibold text-indigo-600 hover:underline"
                    data-testid="login-signup-link"
                >
                    Create an account
                </Link>
            </div>
        </div>
    );
};
