import React, { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { HostelDetailsSection } from "@/components/feature/HostelDetailsSection";
import { SharingPricingSection } from "@/components/feature/SharingPricingSection";
import { RoomTariffPricingSection } from "@/components/feature/RoomTariffPricingSection";
import { RegistrationQrSection } from "@/components/feature/RegistrationQrSection";

export const Settings: React.FC = () => {
    // Accordion expansion state: track which sections are open
    const [expanded, setExpanded] = useState<{
        hostel: boolean;
        sharing: boolean;
        tariff: boolean;
        registration: boolean;
    }>({
        hostel: false,
        sharing: false,
        tariff: false,
        registration: false,
    });

    const toggleSection = (section: keyof typeof expanded) => {
        setExpanded(prev => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-12">
            <PageHeader
                title="Management Settings"
                description="Manage your property details, room types, standard tariffs, and self-registration."
            />

            <div className="max-w-4xl space-y-4">
                {/* 1. Hostel & Property Details */}
                <HostelDetailsSection isExpanded={expanded.hostel} onToggle={() => toggleSection("hostel")} />

                {/* 2. Custom room types */}
                <SharingPricingSection isExpanded={expanded.sharing} onToggle={() => toggleSection("sharing")} />

                {/* 3. Room Tariffs & Standard Pricing */}
                <RoomTariffPricingSection isExpanded={expanded.tariff} onToggle={() => toggleSection("tariff")} />

                {/* 4. Customer Self-Registration & QR Code */}
                <RegistrationQrSection
                    isExpanded={expanded.registration}
                    onToggle={() => toggleSection("registration")}
                />
            </div>
        </div>
    );
};

export default Settings;
