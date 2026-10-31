import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { dashboardService, type DashboardStatistics } from "@/api/dashboardService";
import { useAuth } from "@/context/AuthContext";

interface StatisticsContextType {
    stats: DashboardStatistics | null;
    isLoading: boolean;
    error: string | null;
    refreshStatistics: (force?: boolean) => Promise<DashboardStatistics | null>;
    setStats: React.Dispatch<React.SetStateAction<DashboardStatistics | null>>;
}

const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

// 30 seconds caching TTL to prevent redundant DB aggregations during tab switching
const STATS_CACHE_TTL_MS = 30_000;

export const StatisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStatistics | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const lastFetchedAtRef = useRef<number>(0);
    const isFetchingRef = useRef<boolean>(false);

    const refreshStatistics = useCallback(
        async (force: boolean = false): Promise<DashboardStatistics | null> => {
            const now = Date.now();

            // Return cached statistics if fresh and not forced
            if (!force && stats && now - lastFetchedAtRef.current < STATS_CACHE_TTL_MS) {
                return stats;
            }

            // Prevent duplicate concurrent in-flight requests
            if (isFetchingRef.current) {
                return stats;
            }

            isFetchingRef.current = true;
            setIsLoading(true);
            setError(null);

            try {
                const res = await dashboardService.getStatistics();
                if (res && res.data) {
                    setStats(res.data);
                    lastFetchedAtRef.current = Date.now();
                    return res.data;
                }
                return null;
            } catch (err: any) {
                console.warn("Failed to fetch dashboard statistics in StatisticsContext:", err);
                const msg = err?.response?.data?.message || err?.message || "Failed to load statistics";
                setError(msg);
                return null;
            } finally {
                isFetchingRef.current = false;
                setIsLoading(false);
            }
        },
        [stats]
    );

    // Automatically load when authenticated user changes or logs in
    useEffect(() => {
        if (user) {
            refreshStatistics();
        } else {
            setStats(null);
            lastFetchedAtRef.current = 0;
        }
    }, [user, refreshStatistics]);

    return (
        <StatisticsContext.Provider
            value={{
                stats,
                isLoading,
                error,
                refreshStatistics,
                setStats,
            }}
        >
            {children}
        </StatisticsContext.Provider>
    );
};

export const useStatistics = () => {
    const context = useContext(StatisticsContext);
    if (!context) {
        throw new Error("useStatistics must be used within a StatisticsProvider");
    }
    return context;
};
