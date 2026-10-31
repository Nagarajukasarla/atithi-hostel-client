import React, { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { Modal } from "@/components/common/Modal";
import { Sparkles, Plus, Clock, UserCheck, Calendar, Star, CheckCircle } from "lucide-react";

interface MassageService {
    id: string;
    title: string;
    duration: string;
    price: number;
    description: string;
    category: string;
}

interface Appointment {
    id: string;
    guestName: string;
    roomNumber: string;
    serviceName: string;
    therapist: string;
    timeSlot: string;
    date: string;
    status: "Confirmed" | "Completed" | "Pending";
    amount: number;
}

const SERVICES: MassageService[] = [
    {
        id: "SRV-1",
        title: "Ayurvedic Abhyanga Massage",
        duration: "60 mins",
        price: 1499,
        description: "Traditional full-body warm herbal oil therapy restoring body balance and relaxation.",
        category: "Ayurvedic",
    },
    {
        id: "SRV-2",
        title: "Deep Tissue Muscle Relief",
        duration: "45 mins",
        price: 1299,
        description: "Targeted pressure therapy focusing on deeper muscle layers to alleviate chronic tension.",
        category: "Therapeutic",
    },
    {
        id: "SRV-3",
        title: "Head, Neck & Shoulder Relaxer",
        duration: "30 mins",
        price: 699,
        description: "Stress-relief massage targeting neck stiffness, computer fatigue, and head tension.",
        category: "Express",
    },
    {
        id: "SRV-4",
        title: "Aroma Foot Reflexology",
        duration: "35 mins",
        price: 799,
        description: "Acupressure point therapy using essential lavender and tea tree oils for rejuvenation.",
        category: "Foot Care",
    },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
    {
        id: "APT-201",
        guestName: "Kavita Iyer",
        roomNumber: "104",
        serviceName: "Ayurvedic Abhyanga Massage",
        therapist: "Sunita Rawat",
        timeSlot: "04:00 PM - 05:00 PM",
        date: "2026-06-13",
        status: "Confirmed",
        amount: 1499,
    },
    {
        id: "APT-202",
        guestName: "Arjun Mehta",
        roomNumber: "202",
        serviceName: "Head, Neck & Shoulder Relaxer",
        therapist: "Ramesh Negi",
        timeSlot: "05:30 PM - 06:00 PM",
        date: "2026-06-13",
        status: "Pending",
        amount: 699,
    },
    {
        id: "APT-203",
        guestName: "Deepak Patel",
        roomNumber: "108",
        serviceName: "Deep Tissue Muscle Relief",
        therapist: "Sunita Rawat",
        timeSlot: "11:00 AM - 11:45 AM",
        date: "2026-06-13",
        status: "Completed",
        amount: 1299,
    },
];

export const Massage: React.FC = () => {
    const { toast } = useToast();
    const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(SERVICES[0].title);
    const [guestName, setGuestName] = useState("");
    const [roomNumber, setRoomNumber] = useState("");
    const [timeSlot, setTimeSlot] = useState("06:00 PM - 07:00 PM");
    const [therapist, setTherapist] = useState("Sunita Rawat");

    const handleBook = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName || !roomNumber) {
            toast.warning("Please fill in guest name and room number.");
            return;
        }

        const serviceObj = SERVICES.find(s => s.title === selectedService);
        const newApt: Appointment = {
            id: `APT-${Date.now().toString().slice(-3)}`,
            guestName,
            roomNumber,
            serviceName: selectedService,
            therapist,
            timeSlot,
            date: "2026-06-13",
            status: "Confirmed",
            amount: serviceObj?.price || 999,
        };

        setAppointments([newApt, ...appointments]);
        setIsModalOpen(false);
        setGuestName("");
        setRoomNumber("");
        toast.success(`Wellness appointment for "${guestName}" confirmed.`);
    };

    const markStatus = (id: string, newStatus: Appointment["status"]) => {
        setAppointments(appointments.map(a => (a.id === id ? { ...a, status: newStatus } : a)));
        toast.info(`Appointment status updated to ${newStatus}.`);
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <PageHeader
                title="Massage & Wellness"
                description="Book therapeutic wellness sessions, manage specialist therapists, and pamper hostel residents."
                action={
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition"
                    >
                        <Plus className="h-4 w-4" />
                        <span>+ Book Session</span>
                    </button>
                }
            />

            {/* Statistics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatisticsCard
                    title="Today's Sessions"
                    value={appointments.length}
                    icon={<Sparkles className="h-5 w-5" />}
                    badgeColor="indigo"
                    description="Scheduled spa appointments"
                />
                <StatisticsCard
                    title="Active Therapists"
                    value="2 On-Duty"
                    icon={<UserCheck className="h-5 w-5" />}
                    badgeColor="emerald"
                    description="Sunita R. & Ramesh N."
                />
                <StatisticsCard
                    title="Completed Today"
                    value={appointments.filter(a => a.status === "Completed").length}
                    icon={<CheckCircle className="h-5 w-5" />}
                    badgeColor="cyan"
                    description="Finished massage sessions"
                />
                <StatisticsCard
                    title="Service Rating"
                    value="4.9 ★"
                    icon={<Star className="h-5 w-5" />}
                    badgeColor="purple"
                    description="Based on 48 guest reviews"
                />
            </div>

            {/* Services Catalog */}
            <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Available Treatments & Therapies
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SERVICES.map(srv => (
                        <div
                            key={srv.id}
                            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                        {srv.category}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        {srv.duration}
                                    </span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 leading-tight">{srv.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{srv.description}</p>
                            </div>
                            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <span className="text-base font-extrabold text-slate-900">₹{srv.price}</span>
                                    <span className="text-[10px] text-slate-400 block font-medium">per session</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedService(srv.title);
                                        setIsModalOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                                >
                                    Book
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-3 p-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-600" />
                        Today's Scheduled Appointments
                    </h2>
                    <span className="text-xs font-semibold text-slate-400">Tehri Garhwal Wellness Suite</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-y border-slate-200/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Guest & Room</th>
                                <th className="px-4 py-3">Service</th>
                                <th className="px-4 py-3">Therapist</th>
                                <th className="px-4 py-3">Time Slot</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {appointments.map(apt => (
                                <tr key={apt.id} className="hover:bg-slate-50/70 transition">
                                    <td className="px-4 py-3.5">
                                        <div className="font-bold text-slate-900">{apt.guestName}</div>
                                        <div className="text-xs text-slate-400 font-medium">Room {apt.roomNumber}</div>
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-slate-800">{apt.serviceName}</td>
                                    <td className="px-4 py-3.5 text-slate-600">{apt.therapist}</td>
                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-1.5 text-slate-700">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{apt.timeSlot}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3.5 font-bold text-slate-900">₹{apt.amount}</td>
                                    <td className="px-4 py-3.5">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                apt.status === "Completed"
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                    : apt.status === "Confirmed"
                                                      ? "bg-sky-50 text-sky-700 border border-sky-200"
                                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                            }`}
                                        >
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                        {apt.status !== "Completed" ? (
                                            <button
                                                onClick={() => markStatus(apt.id, "Completed")}
                                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                                            >
                                                Mark Done
                                            </button>
                                        ) : (
                                            <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                Finished
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        Schedule Massage Session
                    </span>
                }
                maxWidth="md"
            >
                <form onSubmit={handleBook} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-700 mb-1">Select Service *</label>
                        <select
                            value={selectedService}
                            onChange={e => setSelectedService(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                            {SERVICES.map(s => (
                                <option key={s.id} value={s.title}>
                                    {s.title} ({s.duration}) - ₹{s.price}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Guest Name *</label>
                            <input
                                type="text"
                                required
                                value={guestName}
                                onChange={e => setGuestName(e.target.value)}
                                placeholder="e.g. Rahul Sharma"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Room No. *</label>
                            <input
                                type="text"
                                required
                                value={roomNumber}
                                onChange={e => setRoomNumber(e.target.value)}
                                placeholder="e.g. 102"
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Therapist</label>
                            <select
                                value={therapist}
                                onChange={e => setTherapist(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            >
                                <option value="Sunita Rawat">Sunita Rawat (Lead)</option>
                                <option value="Ramesh Negi">Ramesh Negi</option>
                            </select>
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                            <select
                                value={timeSlot}
                                onChange={e => setTimeSlot(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            >
                                <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                                <option value="05:30 PM - 06:30 PM">05:30 PM - 06:30 PM</option>
                                <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                                <option value="08:30 PM - 09:30 PM">08:30 PM - 09:30 PM</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-600/20"
                        >
                            Confirm Session
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
