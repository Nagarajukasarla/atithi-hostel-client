import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { publicRegistrationService } from "@/api/publicRegistrationService";
import { AccordionSectionCard } from "@/components/common/AccordionSectionCard";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { QrCode, Loader2, Copy, Check, Download, ExternalLink } from "lucide-react";

interface RegistrationQrSectionProps {
    isExpanded: boolean;
    onToggle: () => void;
}

export const RegistrationQrSection: React.FC<RegistrationQrSectionProps> = ({ isExpanded, onToggle }) => {
    const { hostel } = useAuth();

    const [allowSelfRegistration, setAllowSelfRegistration] = useState(true);
    const [qrSvg, setQrSvg] = useState<string | null>(null);
    const [isQrLoading, setIsQrLoading] = useState(false);
    const [qrError, setQrError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const cleanBaseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const registrationUrl = hostel?.token ? `${cleanBaseUrl}/public/customer-registration/${hostel.token}` : "";

    const handleFetchQr = async () => {
        setIsQrLoading(true);
        setQrError(null);
        try {
            const svg = await publicRegistrationService.getHostelQrSvg();
            setQrSvg(svg);
        } catch (err: any) {
            console.error("Error fetching QR code: ", err);
            setQrError("Failed to load QR code. Please try again.");
        } finally {
            setIsQrLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (!registrationUrl) return;
        navigator.clipboard.writeText(registrationUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleDownloadQr = () => {
        if (!qrSvg) return;
        const blob = new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const filename = `${(hostel?.name || "hostel").toLowerCase().replace(/\s+/g, "-")}-registration-qr.svg`;
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Auto-fetch QR when section is expanded if not loaded yet
    useEffect(() => {
        if (isExpanded && !qrSvg && !isQrLoading) {
            handleFetchQr();
        }
    }, [isExpanded]);

    return (
        <AccordionSectionCard
            title="Customer Self-Registration & QR Code"
            icon={<QrCode className="h-5 w-5" />}
            iconClassName="bg-violet-50 text-violet-600 border-violet-100"
            badge={
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/80 whitespace-nowrap">
                    Public Registration
                </span>
            }
            summary={
                <div className="flex items-center gap-2 truncate">
                    <span>
                        Self-Registration:{" "}
                        <strong className="text-slate-700 font-semibold">
                            {allowSelfRegistration ? "Active" : "Disabled"}
                        </strong>
                    </span>
                    <span>•</span>
                    <span className="truncate">
                        Public Link:{" "}
                        <span className="font-mono text-slate-600">
                            {registrationUrl || "/public/customer-registration/..."}
                        </span>
                    </span>
                </div>
            }
            isExpanded={isExpanded}
            onToggle={onToggle}
            actionLabel="View QR & Link"
        >
            <div className="space-y-6">
                {/* Toggle Self-Registration Switch */}
                <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                    <div>
                        <h4 className="text-xs font-bold text-slate-900">Allow Customer Self-Registration</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            When enabled, walk-in guests can scan the QR code to submit their registration details
                            directly.
                        </p>
                    </div>
                    <ToggleSwitch
                        checked={allowSelfRegistration}
                        onChange={setAllowSelfRegistration}
                        size="md"
                        variant="default"
                        aria-label="Allow Customer Self-Registration"
                    />
                </div>

                {/* QR Code and Actions Card */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    {/* QR Code Display */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 text-center">
                        <div className="text-xs font-semibold text-slate-600 mb-3">Registration QR Code</div>

                        {isQrLoading ? (
                            <div className="h-52 w-52 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                <span className="text-xs">Generating SVG...</span>
                            </div>
                        ) : qrSvg ? (
                            <div
                                className="h-52 w-52 rounded-2xl bg-white border border-slate-200 p-2 shadow-sm flex items-center justify-center overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: qrSvg }}
                            />
                        ) : (
                            <div className="h-52 w-52 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center gap-3 p-4 text-center">
                                <QrCode className="h-10 w-10 text-slate-300" />
                                <button
                                    type="button"
                                    onClick={handleFetchQr}
                                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm"
                                >
                                    Generate QR Code
                                </button>
                            </div>
                        )}

                        {qrError && <p className="text-[11px] text-rose-500 mt-2">{qrError}</p>}

                        <p className="text-[11px] text-slate-400 mt-3 max-w-[200px]">
                            Derived directly from your property registration token
                        </p>
                    </div>

                    {/* Link & Buttons */}
                    <div className="md:col-span-7 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Public Registration Link
                            </label>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={registrationUrl || "Loading registration link..."}
                                    className="w-full min-w-0 flex-1 px-3.5 py-2 text-xs font-mono text-slate-700 bg-slate-50 rounded-xl border border-slate-200 select-all focus:outline-none truncate"
                                />
                                <button
                                    type="button"
                                    onClick={handleCopyLink}
                                    disabled={!registrationUrl}
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs shrink-0 whitespace-nowrap disabled:opacity-50 w-full sm:w-auto"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            <span className="text-emerald-600">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-3.5 w-3.5" />
                                            Copy Link
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={handleDownloadQr}
                                disabled={!qrSvg}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 w-full sm:w-auto"
                            >
                                <Download className="h-4 w-4" />
                                Download QR (SVG Vector)
                            </button>

                            {registrationUrl && (
                                <a
                                    href={registrationUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs w-full sm:w-auto"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open Registration Page
                                </a>
                            )}
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
                            <strong>Print Tip:</strong> The downloaded QR code is formatted in high-resolution vector
                            SVG. You can print it on reception standees, counter tents, or posters without losing
                            quality.
                        </div>
                    </div>
                </div>
            </div>
        </AccordionSectionCard>
    );
};
