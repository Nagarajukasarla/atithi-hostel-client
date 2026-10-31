import BaseService from "./baseService";
import APIResponse from "@/classes/APIResponse";
import { API_ROUTES } from "@/constants/apiRoutes";

export interface OccupancyStats {
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    occupancyPercentage: number;
}

export interface RevenueStats {
    thisMonthTotalRevenue: number;
    thisMonthMonthlyRevenue: number;
    thisMonthDailyRevenue: number;
    thisMonthDailyBilledDue: number;
    totalMonthlyRevenue: number;
    totalMonthlyBilled: number;
    totalDueAmount: number;
    todayRevenue: number;
}

export interface ArrivalsStats {
    monthArrivalsCount: number;
    todayArrivalsCount: number;
    activeInHouseGuests: number;
    activeDailyGuests?: number;
}

export interface DeparturesStats {
    monthDeparturesCount: number;
    todayDeparturesCount: number;
}

export interface SharingTypeOccupancyItem {
    roomTypeId: number;
    sharingTypeName: string;
    sharingCount: number;
    totalBeds: number;
    occupiedBeds: number;
    occupancyPercentage: number;
}

export interface MonthlyRevenueTrendItem {
    month: string;
    yearMonth: string;
    revenue: number;
}

export interface UpcomingPaymentItem {
    chargeId: number;
    customerId: number;
    customerName: string;
    roomNumber?: string;
    bedNumber?: string;
    dueDate: string;
    amount: number;
    status: "Overdue" | "Upcoming" | "Due Today";
    pendingDuesCount?: number;
    billingMode?: "DAILY" | "MONTHLY";
}

export interface DashboardStatistics {
    occupancy: OccupancyStats;
    revenue: RevenueStats;
    arrivals: ArrivalsStats;
    departures: DeparturesStats;
    sharingTypes: SharingTypeOccupancyItem[];
    revenueTrend: MonthlyRevenueTrendItem[];
    upcomingPayments: UpcomingPaymentItem[];
}

class DashboardService extends BaseService {
    async getStatistics(): Promise<APIResponse<DashboardStatistics>> {
        const res = await this.get<any>(API_ROUTES.DASHBOARD.GET_STATISTICS);
        if (res.data && typeof res.data === "object" && "data" in res.data && (res.data as any).data) {
            res.data = (res.data as any).data;
        }
        return res as APIResponse<DashboardStatistics>;
    }
}

export const dashboardService = new DashboardService();
export default dashboardService;
