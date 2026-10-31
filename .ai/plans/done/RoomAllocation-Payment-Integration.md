# Room Allocation & Payment Integration Plan

## User Voice Prompt Transcription

> **User Instructions (Transcribed from Audio Recordings):**
>
> **Part 1 — UI & Floor Configuration:**
> "While we are creating a new customer, we are done with the Aadhaar lookup, Personal Details cards/sections that we have completed. Now let's jump into the Room Allocation part.
>
> In the room allocation, the current data is mock/temp data. So first remove that mock data and link the data which is coming from the database.
>
> For floor selection, we have a dropdown. So whatever floors are there, based on the floors... in order to have the floors, you can do one thing: go into the Hostel Management / Management Settings page (in the Hostel & Property details section), add a 'Floors' (total floors count) field.
>
> If you are adding the floor field in the frontend, update both frontend and backend as well: entity in aavas server, repository layer, service layer, top to bottom everywhere. During sign up we don't take the floor information; the user can only update or add the floor information by coming to the Hostel Property Details component i.e Hostel management Settings.
>
> Based on that floor count/list, display the number of floor options in the Floor Selection dropdown of the Room Allocation component.
>
> Coming to Selected Room: when a floor is selected, accordingly display the available rooms for that floor in the grid map, with their status (1/2 beds, 2/3 beds, etc.). Also, change the availability color as which we are using in the Rooms component and Room card, so you have to use that color for the availability. Bed number can be optional, so accordingly change this."
>
> **Part 2 — Architectural Questions & Transaction Lifecycle:**
> "For this room allocation, do we need a separate table? First let's create a proper implementation plan. Do we need any registration table or allocation table or anything, is it really required? Let me know: is that a good idea or can we simply do something else?
>
> As we are registering a new customer, personal details are already taken in the previous section, but we are left with the room allocation. When we are allocating a room to a particular customer, does that customer ID get linked here?
>
> After we select the room, if we click next, it should be something like this: room allocation can only be completed after the user enters into the summary review section and confirms, because the room allocation can only be done after customer makes the payment. So we have to make sure financial information is stored and the summary is reviewed."
>
> **Part 3 — Payment Table & Scalability:**
> "I think we definitely require the Payment table that will keep track of monthly rent, whatever amount he paid, advance status,
> previous balance due (currently no need of it in payment table).
>
> First of all, let's create a Payment table, Payment repository, and Payment controller. After room allocation and after payment information is added, we will be updating three things here: hostel ID, room ID, customer ID... we should be linking customer with hostel and that particular room.
>
> And I want it to be very scalable. Customer table should not be holding information of hostel and room itself, otherwise it would not scale. Customer information is separate, room is separate, so room allocation is a different table which will connect both of these. So we need the room allocation table, and we need the payment table.
>
> Payment table is very important in this entire application because I should be able to get complete information from anywhere at any point, so that should be very independent and flexible. After the user enters financial information, we take payment status and previous balance due.
>
> Please write whatever voice prompt I have given to you as a prompt in this MD file, and in the below section add your implementation plan."

---

## Architectural Analysis & Core Decisions

### 1. Do We Need a Separate `room_allocations` Table?

**Recommendation: YES (Strongly Recommended)**

#### Why a separate `room_allocations` table is necessary:

1. **Separation of Concerns & Decoupling:**
    - A `Customer` is a biological person / legal identity (Aadhaar, name, phone, emergency contacts, KYC).
    - A `Room` is a physical asset with capacity, floor, sharing, and maintenance state.
    - A `RoomAllocation` is a **temporal relationship (tenancy/stay)** connecting a Customer, a Room, and a Hostel.
2. **Support for Historical Stays & Multi-Tenancy:**
    - Storing `room_id` or `hostel_id` directly in the `customers` table causes data corruption when:
        - A customer shifts rooms (e.g. from Room 101 Bed A to Room 204 Bed B).
        - A customer vacates and returns months later (new stay, same person).
        - A customer has stayed in different properties.
3. **Auditability & Billing Linkage:**
    - Every invoice, monthly rent ledger entry, or security deposit must point to an active or historical `allocation_id`.
    - Allows tracking `check_in_date`, `expected_check_out_date`, `actual_check_out_date`, `allocated_bed`, and `status` (`ACTIVE`, `TRANSFERRED`, `VACATED`, `CANCELLED`).

### 2. Do We Need a Separate `payments` Table?

**Recommendation: YES (Essential for Financial Integrity)**

#### Why a separate `payments` table is required:

1. **Transaction Ledger vs Entity State:**
    - An allocation has a financial state (current rent, balance due), but payments occur as discrete transactional events (e.g., initial deposit on Day 1, partial rent on Day 5, remainder on Day 10).
2. **Traceability:**
    - Each payment entry records:
        - Who paid (`customer_id`), for what stay (`allocation_id`), at which property (`hostel_id`).
        - Payment breakdown: `monthly_rent`, `advance_amount`, `amount_paid`, `previous_due`, `remaining_due`.
        - Transaction details: `payment_mode` (`CASH`, `UPI`, `CARD`, `NET_BANKING`), `transaction_ref`, `receipt_number`, `payment_date`.
        - Status: `PAID`, `PARTIAL`, `UNPAID`, `REFUNDED`.
3. **Reporting & POS / Front-Desk:**
    - Enables daily cash summaries, monthly collection reports, resident ledger statements, and due notices without mutating the customer profile.

### 3. Registration & Allocation Lifecycle (Step 1 to Step 5)

```
Step 1: Aadhaar Lookup       ──> Check existing Customer in DB
Step 2: Personal Details     ──> Stage / Save Customer profile
Step 3: Room Allocation      ──> In-memory selection (Room, Floor, Bed) - [NO DB ALLOCATION YET]
Step 4: Financial Info       ──> In-memory inputs (Rent, Advance, Paid, Due, Mode)
Step 5: Summary & Final Save ──> Atomic Backend Transaction:
                                  ├── 1. Ensure Customer persisted
                                  ├── 2. Create RoomAllocation record (Status: ACTIVE)
                                  ├── 3. Increment Room occupancy & update RoomStatus
                                  └── 4. Create initial Payment transaction record
```

_Key Takeaway:_ Clicking "Next" on Step 3 does **not** allocate the bed in the database. Bed allocation and room capacity increments happen strictly upon Step 5 submission to prevent orphaned allocations if the user abandons the form.

---

## Detailed Implementation Plan

### Phase 1: Property Floors Configuration (Backend & Frontend)

#### Backend (`aavas`):

1. **Update `Hostel.java` Model:**
    - Add column:
        ```java
        @Column(name = "total_floors")
        @Builder.Default
        private Integer totalFloors = 1;
        ```
2. **Update DTOs & Requests:**
    - `UpdateHostelRequest.java`: Add `Integer totalFloors`.
    - `HostelDto.java`: Include `Integer totalFloors` in record and `fromEntity` mapping.
3. **Update `HostelServiceImpl.java`:**
    - Map `request.totalFloors()` to `hostel.setTotalFloors(...)`.

#### Frontend (`atithi`):

1. **Update Types & API:**
    - `atithi/src/types/index.ts`: Add `totalFloors?: number` to `Hostel`.
    - `atithi/src/api/hostelService.ts`: Add `totalFloors?: number` to `UpdateHostelData`.
2. **Update Settings Page (`HostelDetailsSection.tsx`):**
    - Add a numerical/dropdown input for **"Total Property Floors"** (e.g. 1 to 20 floors) in the Hostel & Property Details form.
    - Wire input to `handleHostelChange('totalFloors', val)` and persist via `hostelService.updateHostel`.

---

### Phase 2: Live Room & Floor Integration in Room Allocation Modal (Step 3)

1. **Dynamic Floor Selection in `RoomAllocationForm.tsx`:**
    - Fetch or read `hostel.totalFloors` from `useAuth()` or `HostelContext`.
    - Dynamically generate floor options:
        ```ts
        const floorOptions = Array.from({ length: totalFloors || 4 }, (_, i) => ({
            value: String(i + 1),
            label: i === 0 ? "1st Floor (Ground/L1)" : `${i + 1}th Floor`,
        }));
        ```
2. **Replace Mock Rooms with Live Database Rooms:**
    - In `Customers.tsx`, fetch rooms from `roomService.getRooms()` (or `useHostel().rooms` synced with backend API).
    - Filter rooms for the selected floor:
        ```ts
        const selectedFloorRooms = rooms.filter(r => String(r.floor) === String(watchedFloor));
        ```
3. **Room Card Styling & Availability Color Harmony:**
    - Match the color palette from `RoomCard.tsx`:
        - **Available** (`occupiedBeds === 0`): Indigo/Emerald (`bg-indigo-50 border-indigo-200 text-indigo-700` or `bg-emerald-500 text-white`).
        - **Partially Filled** (`0 < occupiedBeds < capacity`): Amber (`bg-amber-500 text-white` or `bg-amber-50 border-amber-300 text-amber-800`).
        - **Full** (`occupiedBeds >= capacity`): Rose (`bg-rose-500 text-white`, disabled cursor if full).
4. **Bed Selection (Optional):**
    - Provide bed options based on room capacity (e.g. Bed A, Bed B, Bed C...) or free-form text, labeled as _(Optional)_.

---

### Phase 3: Database & Backend Architecture for Allocation & Payments (`aavas`)

#### 1. Entity: `RoomAllocation.java`

```java
@Entity
@Table(name = "room_allocations")
public class RoomAllocation extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hostel_id", nullable = false)
    private Hostel hostel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "bed_number", length = 20)
    private String bedNumber;

    @Column(name = "monthly_rent", nullable = false)
    private Double monthlyRent;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date")
    private LocalDate checkOutDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AllocationStatus status = AllocationStatus.ACTIVE; // ACTIVE, VACATED, CANCELLED
}
```

#### 2. Entity: `Payment.java`

```java
@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hostel_id", nullable = false)
    private Hostel hostel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id")
    private RoomAllocation allocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 40)
    private PaymentType paymentType; // INITIAL_REGISTRATION, MONTHLY_RENT, ADVANCE_DEPOSIT, MAINTENANCE

    @Column(name = "monthly_rent")
    private Double monthlyRent;

    @Column(name = "advance_amount")
    private Double advanceAmount;

    @Column(name = "amount_paid", nullable = false)
    private Double amountPaid;

    @Column(name = "previous_due")
    private Double previousDue;

    @Column(name = "remaining_due")
    private Double remainingDue;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus; // PAID, PARTIAL, UNPAID

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 30)
    private PaymentMode paymentMode; // CASH, UPI, CARD, NET_BANKING

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "receipt_number", unique = true, length = 64)
    private String receiptNumber;

    @Column(length = 255)
    private String notes;
}
```

#### 3. Repositories, DTOs & Services:

- `RoomAllocationRepository`: Find active allocations by room, customer, or hostel.
- `PaymentRepository`: Find payments by customer, hostel, date range, or status.
- `StayService` / `RegistrationService`:
    - Atomic `@Transactional` method `registerCustomerStay(NewStayRequest request)`:
        1. Look up or persist `Customer`.
        2. Validate `Room` has available capacity.
        3. Save `RoomAllocation`.
        4. Update `Room.occupied += 1` and recalculate `Room.roomStatus` (`FILLED` if `occupied == maxCapacity` else `PARTIALLY_FILLED`).
        5. Save `Payment` entry with calculated dues and generate receipt number.
        6. Return unified registration response.

---

### Phase 4: Frontend Integration & Final Submission (`atithi`)

1. **Update API Services:**
    - Implement `stayService.createStay(payload)` connected to `/api/v1/stays`.
    - Add `paymentService.ts` for listing customer payment history and dues.
2. **Update `Customers.tsx`:**
    - Replace localStorage-only submission with backend API call `stayService.createStay(...)`.
    - On successful registration, update local UI state, reload room occupancy, and show success toast.
3. **Ensure Safe Wizard Flow:**
    - Step 3 (Room Allocation) validates room selection without premature DB modification.
    - Step 4 (Financial Info) collects payment amounts and payment method.
    - Step 5 (Summary Review) displays complete overview before executing the atomic commit.

---

## Verification Plan

### Automated Verification

- **Backend Tests:**
    - Test `HostelService.updateHostel()` with `totalFloors`.
    - Test `StayService.registerCustomerStay()` transactional atomicity (allocation + room occupancy increment + payment record).
    - Verify room capacity boundary conditions (cannot allocate to an already full room).
- **Frontend Type & Lint Check:**
    - Run `bun run build` or `npm run build` in `atithi` to ensure zero TypeScript errors.

### Manual End-to-End Verification

1. **Property Floors Configuration:**
    - Go to `Settings` -> Expand `Hostel & Property Details`.
    - Update `Total Floors` (e.g. set to `5`) and save.
    - Verify success notification and persistence upon reload.
2. **Room Allocation in Registration Modal:**
    - Go to `Customers` -> Click `+ New Resident / Customer`.
    - Step 1: Lookup or enter Aadhaar.
    - Step 2: Fill Personal Details -> Click Next.
    - Step 3: Verify Floor Selection has the 5 configured floors.
    - Select a floor: Verify live database rooms for that floor are displayed with real occupancy and matching status colors.
    - Select an available room and optional bed -> Click Next.
3. **Financial Breakdown & Submission:**
    - Step 4: Verify rent auto-fills from room price, enter advance and paid amounts.
    - Step 5: Review summary -> Click Confirm / Register.
    - Verify room occupancy increments, customer is listed, and payment record is stored.
