import React, { createContext, useContext, useState } from "react";
import type { Settings } from "@/types";

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Settings) => void;
    resetSettings: () => void;
}

const DEFAULT_SETTINGS: Settings = {
    defaultAdvanceAmount: 5000,
    defaultMonthlyRent: 8000,
    currencySymbol: "₹",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettingsState] = useState<Settings>(() => {
        const saved = localStorage.getItem("atithi_settings");
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });

    const updateSettings = (newSettings: Settings) => {
        setSettingsState(newSettings);
        localStorage.setItem("atithi_settings", JSON.stringify(newSettings));
    };

    const resetSettings = () => {
        setSettingsState(DEFAULT_SETTINGS);
        localStorage.setItem("atithi_settings", JSON.stringify(DEFAULT_SETTINGS));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
