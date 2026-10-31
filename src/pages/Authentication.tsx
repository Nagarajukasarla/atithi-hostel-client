import React, { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { Fingerprint, UserCheck, UserMinus, ShieldAlert, History, Activity, Calendar, Clock } from "lucide-react";
import type { BiometricUser, AuthLog } from "@/types";
import { INITIAL_BIOMETRICS, INITIAL_AUTH_LOGS } from "@/constants/mockData";

export const Authentication: React.FC = () => {
    const { toast } = useToast();

    const [biometrics, setBiometrics] = useState<BiometricUser[]>(() => {
        const saved = localStorage.getItem("atithi_biometrics");
        return saved ? JSON.parse(saved) : INITIAL_BIOMETRICS;
    });

    const [authLogs, setAuthLogs] = useState<AuthLog[]>(() => {
        const saved = localStorage.getItem("atithi_auth_logs");
        return saved ? JSON.parse(saved) : INITIAL_AUTH_LOGS;
    });

    useEffect(() => {
        localStorage.setItem("atithi_biometrics", JSON.stringify(biometrics));
    }, [biometrics]);

    useEffect(() => {
        localStorage.setItem("atithi_auth_logs", JSON.stringify(authLogs));
    }, [authLogs]);

    const registerBiometric = (id: string) => {
        setBiometrics(prevBio =>
            prevBio.map(b =>
                b.id === id
                    ? {
                          ...b,
                          registrationStatus: "Registered",
                          lastAuthentication: new Date().toISOString().replace("T", " ").substr(0, 16),
                      }
                    : b
            )
        );
    };

    const removeBiometric = (id: string) => {
        setBiometrics(prevBio =>
            prevBio.map(b =>
                b.id === id
                    ? {
                          ...b,
                          registrationStatus: "Unregistered",
                          lastAuthentication: "-",
                      }
                    : b
            )
        );
    };

    const addAuthLog = (newLogData: Omit<AuthLog, "id">) => {
        const newId = "l_" + Math.random().toString(36).substr(2, 9);
        setAuthLogs(prev => [{ ...newLogData, id: newId } as AuthLog, ...prev]);
    };
    const [selectedUserLogs, setSelectedUserLogs] = useState<AuthLog[] | null>(null);
    const [activeUserLogsName, setActiveUserLogsName] = useState<string>("");

    // Metrics
    const totalUsers = biometrics.length;
    const registeredCount = biometrics.filter(b => b.registrationStatus === "Registered").length;
    const unregisteredCount = totalUsers - registeredCount;

    const todayStr = "2026-06-13";
    const todaysCheckins = authLogs.filter(log => log.date === todayStr && log.result === "Success").length;

    const handleRegister = (id: string, name: string, room: string) => {
        registerBiometric(id);
        addAuthLog({
            name,
            roomNumber: room,
            checkInTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
            checkOutTime: "--:--",
            date: todayStr,
            result: "Success",
        });
        toast.success(`Successfully enrolled biometric fingerprint for ${name}.`);
    };

    const handleRemove = (id: string, name: string) => {
        if (confirm(`Are you sure you want to remove biometric registration for ${name}?`)) {
            removeBiometric(id);
            toast.warning(`Biometric registration removed for ${name}.`);
        }
    };

    const handleViewLogs = (name: string) => {
        const userLogs = authLogs.filter(log => log.name === name);
        setSelectedUserLogs(userLogs);
        setActiveUserLogsName(name);
    };

    // Define columns for table
    const columns = [
        {
            header: "Customer Name",
            accessor: "name" as keyof BiometricUser,
            sortable: true,
        },
        {
            header: "Room",
            accessor: (row: BiometricUser) => `Room ${row.roomNumber}`,
            sortable: true,
            sortKey: "roomNumber",
        },
        {
            header: "Registration Status",
            accessor: (row: BiometricUser) => <StatusBadge status={row.registrationStatus} />,
        },
        {
            header: "Last Authentication",
            accessor: "lastAuthentication" as keyof BiometricUser,
        },
        {
            header: "Actions",
            accessor: (row: BiometricUser) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleViewLogs(row.name)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-sm"
                    >
                        <History className="h-3 w-3" />
                        Logs
                    </button>
                    {row.registrationStatus === "Unregistered" ? (
                        <button
                            onClick={() => handleRegister(row.id, row.name, row.roomNumber)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl border border-transparent bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
                        >
                            <UserCheck className="h-3 w-3" />
                            Register
                        </button>
                    ) : (
                        <button
                            onClick={() => handleRemove(row.id, row.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-xl border border-transparent bg-rose-50 text-rose-700 hover:bg-rose-100 transition shadow-sm"
                        >
                            <UserMinus className="h-3 w-3" />
                            Remove
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader
                title="Aadhaar & Biometric Verification"
                description="Manage secure biometric fingerprint templates and track check-in activity."
            />

            {/* Summary widgets */}
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticsCard
                    title="BIOMETRIC PROFILES"
                    value={totalUsers}
                    icon={<Fingerprint className="h-5 w-5" />}
                    description="Customer profiles tracked"
                    badgeColor="purple"
                />
                <StatisticsCard
                    title="REGISTERED KEYS"
                    value={registeredCount}
                    icon={<UserCheck className="h-5 w-5" />}
                    description="Fingerprints enrolled"
                    badgeColor="emerald"
                />
                <StatisticsCard
                    title="UNREGISTERED KEYS"
                    value={unregisteredCount}
                    icon={<ShieldAlert className="h-5 w-5" />}
                    description="Pending registration"
                    badgeColor="magenta"
                />
                <StatisticsCard
                    title="TODAY'S CHECK-INS"
                    value={todaysCheckins}
                    icon={<Activity className="h-5 w-5" />}
                    description="Successful matches"
                    badgeColor="cyan"
                />
            </div>

            {/* Registration Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Customer KYC & Biometric Directory</h2>
                <DataTable
                    columns={columns}
                    data={biometrics}
                    emptyTitle="No biometric profiles available"
                    emptyDescription="Add customers to your hostel system to enroll fingerprints."
                />
            </div>

            {/* Authentication Logs Timeline Modal */}
            <Modal
                isOpen={selectedUserLogs !== null}
                onClose={() => setSelectedUserLogs(null)}
                title="Authentication History Logs"
                subtitle={`Logs for ${activeUserLogsName}`}
                maxWidth="lg"
            >
                {selectedUserLogs && selectedUserLogs.length > 0 ? (
                    <div className="flow-root max-h-[360px] overflow-y-auto pr-2">
                        <ul className="-mb-8">
                            {selectedUserLogs.map((log, logIdx) => (
                                <li key={log.id}>
                                    <div className="relative pb-8">
                                        {logIdx !== selectedUserLogs.length - 1 && (
                                            <span
                                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                                                aria-hidden="true"
                                            ></span>
                                        )}
                                        <div className="relative flex space-x-3">
                                            <div>
                                                <span
                                                    className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                                        log.result === "Success"
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-rose-50 text-rose-600"
                                                    }`}
                                                >
                                                    <Fingerprint className="h-4 w-4" />
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">
                                                        {log.result === "Success"
                                                            ? "Fingerprint Authentication Succeeded"
                                                            : "Authentication Failed"}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(log.date).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {log.checkInTime} - {log.checkOutTime}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs whitespace-nowrap">
                                                    <StatusBadge status={log.result} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Fingerprint className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-900">No Logs Found</p>
                        <p className="text-xs text-slate-500 mt-1">
                            This user has no recorded entries for this period.
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
};
