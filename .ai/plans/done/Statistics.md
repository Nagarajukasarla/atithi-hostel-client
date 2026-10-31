### Architectural Assessment & Opinion

Your suggested approach—**creating a dedicated backend Controller, Service, and Repository queries for Dashboard statistics**—is **the correct and industry-standard approach**. 

#### Why This is the Best Approach:
1. **Single Lightweight Roundtrip**: Instead of making multiple API calls (`getRooms`, `getCustomers`, `getAllocations`, `getPayments`, `getCharges`) and performing heavy aggregations on the client, the frontend calls a single endpoint (`GET /api/v1/dashboard/statistics`).
2. **Multi-Tenant Security**: The backend extracts `hostelId` directly from the authenticated JWT token (`@AuthenticationPrincipal UserPrincipal`), ensuring strict multi-tenant isolation.
3. **Optimized DB Aggregations**: SQL/JPQL `SUM`, `COUNT`, and `GROUP BY` operations execute directly on the database engine.
4. **Scalability**: By organizing the response into modular nested DTOs (e.g., `occupancy`, `revenue`, `arrivals`, `departures`, `sharingTypes`, `revenueTrend`), new metrics can be added in the future without breaking frontend consumers.

---

### Implementation Plan

#### 1. Backend Architecture (`aavas` — Spring Boot)

1. **DTOs / Response Model** (`com.atithi.aavas.responses.dashboard`):
   - **`DashboardStatisticsResponse`**:
     - `OccupancyStats`: `totalBeds`, `occupiedBeds`, `vacantBeds`, `occupancyPercentage`
     - `RevenueStats`: `totalMonthlyRevenue` (paid this month), `totalMonthlyBilled` (charges this month), `totalDueAmount` (pending balance), `todayRevenue`
     - `ArrivalsStats`: `monthArrivalsCount`, `todayArrivalsCount`, `activeInHouseGuests`
     - `DeparturesStats`: `monthDeparturesCount`, `todayDeparturesCount`
     - `List<SharingTypeOccupancyDto>`: Grouped by sharing type (`sharingTypeName`, `sharingCount`, `occupiedBeds`, `totalBeds`, `occupancyPercentage`)
     - `List<MonthlyRevenueTrendDto>`: Monthly aggregated revenue for the last 12 month (date string, revenue amount)
     - `List<UpComingPayments>`: Customers name, room number, due date, amount with in next 5 days

2. **Repository Aggregation Queries**:
   - `RoomRepository`: Add aggregation grouped by `roomType` (calculating `SUM(occupied)` and `SUM(maxCapacity)` per sharing type for the `hostelId`).
   - `RoomAllocationRepository`: Add queries for arrivals/check-ins in the current month/today and departures in the current month/today where `hostel.id = :hostelId`.
   - `PaymentRepository`: Add query for payments in date range `[firstDayOfMonth, lastDayOfMonth]` and last 14 days daily breakdown where `hostel.id = :hostelId` and `paymentStatus = 'SUCCESS'`.
   - `ChargeRepository`: Add query for total outstanding dues for the hostel.

3. **Service Layer**:
   - Interface: `DashboardService`
   - Implementation: `DashboardServiceImpl` (`@Transactional(readOnly = true)`)
   - Computes and packages all metrics for the requested `hostelId`.

4. **Controller Layer**:
   - `DashboardController`:
     - `@GetMapping("/api/v1/dashboard/statistics")`
     - Secures access via `@AuthenticationPrincipal UserPrincipal userPrincipal` and extracts `userPrincipal.getHostelId()`.

---

#### 2. Frontend Architecture (`atithi` — React / TypeScript)

1. **API Service — [dashboardService.ts](file:///d:/resource/Projects/Hostel%20Management/atithi/src/api/dashboardService.ts)**:
   - Create typed API client with `getDashboardStatistics()` returning `ApiResponse<DashboardStatisticsResponse>`.

2. **Dashboard UI Integration — [Dashboard.tsx](file:///d:/resource/Projects/Hostel%20Management/atithi/src/pages/Dashboard.tsx)**:
   - **Top 4 KPI Cards**:
     - `OCCUPANCY`: Real percentage and `${occupiedBeds} of ${totalBeds} beds`.
     - `MONTH REVENUE`: Real collected revenue for current month and expected dues.
     - `MONTH ARRIVALS`: Real check-in count for current month and in-house active resident count.
     - `MONTH DEPARTURES`: Real check-out count for current month.
   - **Sharing Types Breakdown** (replacing mock `"Premium / Standard / Suite Room"`):
     - Renders real sharing types (e.g., "1 Sharing", "2 Sharing", "3 Sharing", "4 Sharing") with real progress bars showing `occupied/total`.
   - **12-month Revenue Chart**:
     - Feeds real monthly payment totals from backend into the Recharts AreaChart.
   - **Recent Collections Table**:
     - Displays upcoming real payment transactions.
   - **Loading & Fallback**:
     - Clean loading state / skeleton while metrics load on mount.

---

### Confirmation

Please review this plan. Once you confirm, we will proceed with the implementation.

confirmed!