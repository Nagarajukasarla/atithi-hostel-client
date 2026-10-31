import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, AlertCircle, Building2 } from "lucide-react";

export const Signup: React.FC = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();

    // Hostel fields
    const [hostelName, setHostelName] = useState("");
    const [addressLane1, setAddressLane1] = useState("");
    const [addressLane2, setAddressLane2] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipcode, setZipcode] = useState("");

    // Owner fields
    const [ownerName, setOwnerName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!/^\d{10}$/.test(phone)) {
            setError("Phone number must be a 10-digit number.");
            setLoading(false);
            return;
        }

        try {
            await signup({
                hostelName,
                ownerName,
                email,
                password,
                phone,
                addressLane1,
                addressLane2,
                city,
                state,
                zipcode,
            });
            navigate("/", { replace: true });
        } catch (err: any) {
            setError(err?.message || "An error occurred during registration.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up" data-testid="signup-container">
            {/* Mobile Header Badge */}
            <div className="lg:hidden flex items-center gap-3 pb-2 border-b border-slate-100">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    <Building2 className="h-5 w-5" />
                </div>
                <span className="text-base font-bold text-slate-900">Atithi Hostel</span>
            </div>

            {/* Header Text */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Register your Hostel</h2>
                <p className="text-sm font-normal text-slate-500">Set up your hostel and owner account in 2 minutes.</p>
            </div>

            {error && (
                <div
                    className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium"
                    data-testid="signup-error"
                >
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
                {/* Section 1: Hostel Information */}
                <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">1. Hostel Details</p>

                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Hostel / PG Name *</label>
                        <input
                            type="text"
                            required
                            data-testid="signup-hostel-name"
                            placeholder="e.g. Royal PG Comforts"
                            value={hostelName}
                            onChange={e => setHostelName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">Address Lane 1 *</label>
                            <input
                                type="text"
                                required
                                data-testid="signup-address-lane1"
                                placeholder="Plot 12, Main Road"
                                value={addressLane1}
                                onChange={e => setAddressLane1(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">
                                Address Lane 2 (Optional)
                            </label>
                            <input
                                type="text"
                                data-testid="signup-address-lane2"
                                placeholder="Near Metro Pillar 45"
                                value={addressLane2}
                                onChange={e => setAddressLane2(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">City *</label>
                            <input
                                type="text"
                                required
                                placeholder="Hyderabad"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">State *</label>
                            <input
                                type="text"
                                required
                                placeholder="Telangana"
                                value={state}
                                onChange={e => setState(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">Zipcode *</label>
                            <input
                                type="text"
                                required
                                placeholder="560001"
                                value={zipcode}
                                onChange={e => setZipcode(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Owner Account Information */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">2. Owner Credentials</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">Owner Name *</label>
                            <input
                                type="text"
                                required
                                data-testid="signup-owner-name"
                                placeholder="e.g. Nagaraju"
                                value={ownerName}
                                onChange={e => setOwnerName(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">Contact Phone *</label>
                            <input
                                type="text"
                                maxLength={10}
                                required
                                data-testid="signup-mobile-number"
                                placeholder="10-digit number"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">Login Email *</label>
                            <input
                                type="email"
                                required
                                data-testid="signup-email"
                                placeholder="owner@hostel.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold text-slate-700">Password *</label>
                            <input
                                type="password"
                                required
                                data-testid="signup-password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                            />
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    data-testid="signup-submit"
                    className="w-full mt-3 inline-flex justify-center items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-lg shadow-indigo-600/25 transition duration-150 disabled:opacity-50"
                >
                    {loading ? (
                        "Registering Hostel..."
                    ) : (
                        <>
                            <UserPlus className="w-4 h-4" />
                            <span>Create Hostel & Owner Account</span>
                        </>
                    )}
                </button>
            </form>

            <div className="pt-4 border-t border-slate-100 text-center text-xs font-medium text-slate-500">
                Already have an account?{" "}
                <Link
                    to="/login"
                    className="font-semibold text-indigo-600 hover:underline"
                    data-testid="signup-login-link"
                >
                    Sign in
                </Link>
            </div>
        </div>
    );
};
