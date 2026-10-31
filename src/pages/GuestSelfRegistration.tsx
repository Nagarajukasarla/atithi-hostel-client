import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Building2,
    CheckCircle2,
    AlertCircle,
    User,
    Phone,
    CreditCard,
    Briefcase,
    MapPin,
    ShieldCheck,
    Loader2,
    HeartHandshake,
} from "lucide-react";
import {
    publicRegistrationService,
    type PublicRegistrationInfo,
    type PublicRegistrationFormData,
} from "@/api/publicRegistrationService";

export const GuestSelfRegistration: React.FC = () => {
    const { token } = useParams<{ token: string }>();

    // Link validation state
    const [isLoadingInfo, setIsLoadingInfo] = useState(true);
    const [hostelInfo, setHostelInfo] = useState<PublicRegistrationInfo | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<PublicRegistrationFormData>({
        firstName: "",
        lastName: "",
        gender: "",
        mobile: "",
        aadhaarNumber: "",
        occupation: "",
        emergencyContact: "",
        emergencyContactName: "",
        permanentAddress: "",
    });

    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [registeredName, setRegisteredName] = useState("");

    // Fetch hostel information on load
    useEffect(() => {
        if (!token) {
            setPageError("Registration token is missing from URL.");
            setIsLoadingInfo(false);
            return;
        }

        const fetchInfo = async () => {
            setIsLoadingInfo(true);
            setPageError(null);
            try {
                const res = await publicRegistrationService.getRegistrationInfo(token);
                if (res.code === 200 && res.data) {
                    setHostelInfo(res.data);
                } else {
                    setPageError(res.description || "Invalid or expired registration link.");
                }
            } catch (err: any) {
                console.error("Error fetching registration info: ", err);
                const msg = err?.description || err?.message || "Invalid or expired registration link.";
                setPageError(msg);
            } finally {
                setIsLoadingInfo(false);
            }
        };

        fetchInfo();
    }, [token]);

    const handleInputChange = (field: keyof PublicRegistrationFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: "" }));
        }
        if (submitError) {
            setSubmitError(null);
        }
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.firstName.trim()) {
            errors.firstName = "First name is required";
        }

        if (!formData.lastName.trim()) {
            errors.lastName = "Last name is required";
        }

        if (!formData.gender) {
            errors.gender = "Please select a gender";
        }

        const cleanMobile = formData.mobile.replace(/\D/g, "");
        if (!cleanMobile) {
            errors.mobile = "Mobile number is required";
        } else if (cleanMobile.length !== 10) {
            errors.mobile = "Mobile number must be exactly 10 digits";
        }

        const cleanAadhaar = formData.aadhaarNumber.replace(/\D/g, "");
        if (!cleanAadhaar) {
            errors.aadhaarNumber = "Aadhaar number is required";
        } else if (cleanAadhaar.length !== 12) {
            errors.aadhaarNumber = "Aadhaar number must be exactly 12 digits";
        }

        if (!formData.occupation.trim()) {
            errors.occupation = "Occupation is required";
        }

        if (formData.emergencyContact) {
            const cleanEmergency = formData.emergencyContact.replace(/\D/g, "");
            if (cleanEmergency.length !== 10) {
                errors.emergencyContact = "Emergency contact must be a 10-digit mobile number";
            }
        }

        if (!formData.emergencyContactName.trim()) {
            errors.emergencyContactName = "Emergency contact name is required";
        }

        if (!formData.permanentAddress.trim()) {
            errors.permanentAddress = "Permanent address is required";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const payload: PublicRegistrationFormData = {
                ...formData,
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                mobile: formData.mobile.replace(/\D/g, ""),
                aadhaarNumber: formData.aadhaarNumber.replace(/\D/g, ""),
                occupation: formData.occupation.trim(),
                emergencyContact: formData.emergencyContact ? formData.emergencyContact.replace(/\D/g, "") : "",
                emergencyContactName: formData.emergencyContactName.trim(),
                permanentAddress: formData.permanentAddress.trim(),
            };

            const res = await publicRegistrationService.submitRegistration(token, payload);

            if (res.isSuccess) {
                setRegisteredName(`${payload.firstName} ${payload.lastName}`.trim());
                setIsSubmitted(true);
            } else {
                setSubmitError(res.errorMessage || "Registration failed. Please check your information and try again.");
            }
        } catch (err: any) {
            console.error("Registration submission error:", err);
            const msg =
                err?.description ||
                err?.data?.message ||
                err?.message ||
                "Failed to submit registration. Please verify your details.";
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        setFormData({
            firstName: "",
            lastName: "",
            gender: "",
            mobile: "",
            aadhaarNumber: "",
            occupation: "",
            emergencyContact: "",
            emergencyContactName: "",
            permanentAddress: "",
        });
        setFieldErrors({});
        setSubmitError(null);
        setIsSubmitted(false);
    };

    // 1. Loading State
    if (isLoadingInfo) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center max-w-sm w-full text-center">
                    <Loader2 className="h-9 w-9 text-indigo-600 animate-spin mb-4" />
                    <h3 className="text-base font-bold text-slate-800">Verifying Registration Link...</h3>
                    <p className="text-xs text-slate-500 mt-1">Connecting to Atithi Hostel Management Platform</p>
                </div>
            </div>
        );
    }

    // 2. Error State (Invalid/Expired token or inactive hostel)
    if (pageError || !hostelInfo) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center max-w-md w-full text-center">
                    <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
                        <AlertCircle className="h-7 w-7" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Registration Link Unavailable</h2>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {pageError ||
                            "The registration link is invalid or expired. Please contact the property receptionist or administration."}
                    </p>
                    <div className="mt-6 pt-6 border-t border-slate-100 w-full flex justify-center">
                        <Link
                            to="/login"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                        >
                            Go to Staff / Management Login &rarr;
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Success Confirmation State
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-100 max-w-lg w-full text-center animate-fade-in-up">
                    <div className="h-16 w-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-inner">
                        <CheckCircle2 className="h-9 w-9" />
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 mb-3">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Registration Recorded
                    </span>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Welcome, {registeredName}!</h2>

                    <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                        Your registration details have been submitted to{" "}
                        <span className="font-semibold text-slate-900">{hostelInfo.hostelName}</span>.
                    </p>

                    <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-left">
                        <div className="flex items-start gap-3">
                            <HeartHandshake className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-indigo-950">Next Step: Reception Check-In</h4>
                                <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                                    Please proceed to the reception desk with your ID proof. The management team will
                                    finalize your room allotment.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            type="button"
                            onClick={handleReset}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Register Another Guest
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Main Public Registration Form
    return (
        <div className="min-h-screen bg-slate-50/80 py-8 sm:py-12 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-3">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Guest Self Registration
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Please provide your contact and verification details below
                    </p>
                </div>

                {/* Card Container */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Read-Only Hostel Banner */}
                    <div className="p-6 sm:p-7 border-b border-slate-100 bg-slate-50/60">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Designated Hostel / Property
                        </label>
                        <div className="flex items-center gap-3 bg-white border border-slate-200/90 rounded-2xl px-4 py-3 shadow-xs">
                            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-slate-900 truncate">
                                    {hostelInfo.hostelName}
                                </span>
                                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                    Active Property Registration
                                </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 select-none">
                                Verified Property
                            </span>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        {submitError && (
                            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                <div className="flex-1">{submitError}</div>
                            </div>
                        )}

                        {/* Section: Personal Details */}
                        <div>
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User className="h-4 w-4 text-indigo-600" />
                                Personal Identification
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        First Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={e => handleInputChange("firstName", e.target.value)}
                                        placeholder="e.g. Rahul"
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.firstName ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                    />
                                    {fieldErrors.firstName && (
                                        <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.firstName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Last Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={e => handleInputChange("lastName", e.target.value)}
                                        placeholder="e.g. Kumar"
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.lastName ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                    />
                                    {fieldErrors.lastName && (
                                        <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.lastName}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Gender <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={e => handleInputChange("gender", e.target.value)}
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.gender ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {fieldErrors.gender && (
                                        <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.gender}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Occupation <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.occupation}
                                            onChange={e => handleInputChange("occupation", e.target.value)}
                                            placeholder="e.g. Software Engineer, Student"
                                            className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.occupation ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                        />
                                        <Briefcase className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                                    </div>
                                    {fieldErrors.occupation && (
                                        <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.occupation}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Contact & Verification */}
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-indigo-600" />
                                Contact & Verification
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Mobile Number <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            value={formData.mobile}
                                            onChange={e =>
                                                handleInputChange("mobile", e.target.value.replace(/\D/g, ""))
                                            }
                                            placeholder="10-digit mobile number"
                                            className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.mobile ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                        />
                                        <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                                    </div>
                                    {fieldErrors.mobile && (
                                        <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.mobile}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Aadhaar Number <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            maxLength={12}
                                            value={formData.aadhaarNumber}
                                            onChange={e =>
                                                handleInputChange("aadhaarNumber", e.target.value.replace(/\D/g, ""))
                                            }
                                            placeholder="12-digit Aadhaar number"
                                            className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.aadhaarNumber ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                        />
                                        <CreditCard className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                                    </div>
                                    {fieldErrors.aadhaarNumber && (
                                        <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.aadhaarNumber}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Emergency Contact Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.emergencyContactName}
                                        onChange={e => handleInputChange("emergencyContactName", e.target.value)}
                                        placeholder="e.g. Parent / Guardian / Spouse"
                                        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.emergencyContactName ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                    />
                                    {fieldErrors.emergencyContactName && (
                                        <p className="text-[11px] text-rose-500 mt-1">
                                            {fieldErrors.emergencyContactName}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Emergency Contact Phone
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            maxLength={10}
                                            value={formData.emergencyContact}
                                            onChange={e =>
                                                handleInputChange("emergencyContact", e.target.value.replace(/\D/g, ""))
                                            }
                                            placeholder="10-digit emergency phone"
                                            className={`w-full pl-9 pr-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.emergencyContact ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                        />
                                        <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                                    </div>
                                    {fieldErrors.emergencyContact && (
                                        <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.emergencyContact}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Permanent Address */}
                        <div className="pt-4 border-t border-slate-100">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-indigo-600" />
                                Residential Address
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Permanent Home Address <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.permanentAddress}
                                    onChange={e => handleInputChange("permanentAddress", e.target.value)}
                                    placeholder="Enter your complete permanent address, city, state and PIN code"
                                    className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${fieldErrors.permanentAddress ? "border-rose-300 bg-rose-50/30 text-rose-900" : "border-slate-200 bg-white"} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition`}
                                />
                                {fieldErrors.permanentAddress && (
                                    <p className="text-[11px] text-rose-500 mt-1">{fieldErrors.permanentAddress}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Submitting Registration...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Submit Registration
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[11px] text-slate-400 mt-3">
                                By submitting, you confirm that the information provided is accurate and verifiable.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GuestSelfRegistration;
