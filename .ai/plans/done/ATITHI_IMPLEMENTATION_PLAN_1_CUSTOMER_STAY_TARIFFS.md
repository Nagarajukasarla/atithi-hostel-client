# Atithi — Implementation Plan 1: Customer Stay Foundation + Room Tariffs

**Source basis:** Reorganized from `ATITHI_CUSTOMER_FINANCIAL_PAYMENT_IMPLEMENTATION.md`. This file is an incremental implementation plan; related material from different parts of the source has been consolidated here.

## Common implementation guidelines

- Follow existing Atithi project conventions, reusable services, DTOs, validation, tenant/hostel checks, exception handling, and response patterns.
- Reuse existing room-allocation functionality. `CustomerStayService` should call the existing `RoomAllocationService` rather than reimplement allocation or occupancy/status updates.
- Keep controllers thin; orchestration and business rules belong in services.
- Use `BigDecimal` and PostgreSQL `NUMERIC(12,2)` for money.
- Do not store derived `overallDue`, `remainingDue`, or authoritative `paymentStatus` as source-of-truth fields.
- Keep implementation incremental and do not pull later-plan responsibilities into an earlier plan unless required.
- In Customer Space, replace the existing separate room-allocation/payment API calls with the Customer Stay flow when Plan 3 is reached.
- Do not add external payment-provider integration in these plans.

## Goal

Build the mandatory pricing foundation and the Customer Stay foundation. This plan covers `room_tariffs`, `allocation_financial_terms`, tariff lookup, Financial Info prefill/negotiation, and backend reuse of the existing room-allocation implementation. Charges and payments are deliberately left for Plans 2 and 3.

## 1. Core pricing decisions
Standard Monthly Rent = ₹7,000
Standard Security Deposit = ₹7,000
Effective From = 2026-01-01
Effective To = NULL
Active = true
```

A tariff is **not customer-specific**.

The customer-specific agreed amount is stored later in:

``` text
allocation_financial_terms
```

The relationship is:

``` text
room_types
    ↓
room_tariffs
    ↓
selected room / room type
    ↓
Financial Info pre-fill
    ↓
staff may negotiate the amount
    ↓
allocation_financial_terms
```

------------------------------------------------------------------------

## 0.2 `room_types` does not own the authoritative rent

Do not depend on:

``` text
room_types.monthly_rent
```

for the financial source of truth.

The standard price comes from:

``` text
room_tariffs
```

This allows pricing history:

``` text
Tariff #1
4 Sharing
₹7,000
2026-01-01 → 2027-03-31

Tariff #2
4 Sharing
₹7,500
2027-04-01 → NULL
```

Do not overwrite the old tariff when standard pricing changes.

------------------------------------------------------------------------

## 0.3 Customer-specific negotiated rent belongs to `allocation_financial_terms`

Example:

``` text
Current room tariff:
₹7,000

Customer negotiated rent:
₹6,500
```

Store:

``` text
allocation_financial_terms.monthly_rent = ₹6,500
allocation_financial_terms.room_tariff_id = <tariff used as source>
```

The `room_tariff_id` tells us which standard tariff was used when the
financial terms were created.

The snapshot amount tells us what the customer actually agreed to.

------------------------------------------------------------------------

## 0.4 `charges` are the source of truth for dues

A charge means:

> This customer owes this amount.

Examples:

## 2. Data model scope
# 1. Complete data model

## Existing tables

Keep:

``` text
hostels
customers
room_types
rooms
room_allocations
payments
```

## New mandatory financial tables

Create:

``` text
room_tariffs
allocation_financial_terms
charges
payment_allocations
```

Final financial structure:

``` text
hostel
   │
   ├── room_types
   │       │
   │       └── room_tariffs
   │
   ├── rooms
   │       │
   │       └── room_allocations
   │                    │
   │                    └── allocation_financial_terms
   │
   └── customers
                       │
                       └── charges
                                │
                                └── payment_allocations
                                         │
                                         └── payments
```

Important:

``` text
room_tariffs
    ↓
allocation_financial_terms.room_tariff_id
```

This link is mandatory and must be implemented.

------------------------------------------------------------------------


## 3. `RoomTariff` implementation
@Table(
    name = "room_tariffs",
    indexes = {
        @Index(
            name = "idx_room_tariff_hostel_room_type",
            columnList = "hostel_id, room_type_id"
        ),
        @Index(
            name = "idx_room_tariff_effective_from",
            columnList = "effective_from"
        )
    }
)
public class RoomTariff extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hostel_id", nullable = false)
    private Hostel hostel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_type_id", nullable = false)
    private RoomType roomType;

    @Column(
        name = "monthly_rent",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal monthlyRent;

    @Column(
        name = "security_deposit_required",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal securityDepositRequired;

    @Column(name = "effective_from", nullable = false)
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
```

## Repository

``` java
public interface RoomTariffRepository
        extends JpaRepository<RoomTariff, Long> {

    // Find the active/current tariff for a hostel + room type.

    // Find tariff valid on a particular date.

    // Find tariff history for a room type.

    // Prevent overlapping active/effective tariff periods.
}
```

## Service

``` java
public interface RoomTariffService {

    // Create a new tariff.

    // Get current tariff for hostel + room type.

    // Get tariff history.

    // Change pricing by closing the previous tariff
    // and creating a new tariff record.
}
```

## Controller

``` text
GET  /api/v1/room-types/{roomTypeId}/tariffs/current
GET  /api/v1/room-types/{roomTypeId}/tariffs/history
POST /api/v1/room-types/{roomTypeId}/tariffs
```

------------------------------------------------------------------------

# 4. Entity: `AllocationFinancialTerms`

## Responsibility

Stores the **customer-specific financial agreement for one allocation**.

This is where the negotiated amount is preserved.

It contains both:

## 4. `AllocationFinancialTerms` implementation
``` text
room_tariff_id
```

and the snapshot values:

``` text
monthly_rent
security_deposit_required
```

## Why both?

Example:

``` text
Room tariff:
₹7,000

Customer negotiated:
₹6,500
```

Store:

``` text
room_tariff_id = 20
monthly_rent = 6500
security_deposit_required = 7000
```

If the tariff later changes to ₹7,500, this customer remains at ₹6,500
unless staff explicitly changes the customer's financial terms.

## Entity

``` java
@Entity
@Table(
    name = "allocation_financial_terms",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_allocation_financial_terms_allocation",
            columnNames = "allocation_id"
        )
    },
    indexes = {
        @Index(
            name = "idx_financial_terms_room_tariff",
            columnList = "room_tariff_id"
        ),
        @Index(
            name = "idx_financial_terms_hostel",
            columnList = "hostel_id"
        )
    }
)
public class AllocationFinancialTerms extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hostel_id", nullable = false)
    private Hostel hostel;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "allocation_id",
        nullable = false,
        unique = true
    )
    private RoomAllocation allocation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_tariff_id", nullable = false)
    private RoomTariff roomTariff;

    @Column(
        name = "monthly_rent",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal monthlyRent;

    @Column(
        name = "security_deposit_required",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal securityDepositRequired;

    @Column(name = "billing_anchor_date", nullable = false)
    private LocalDate billingAnchorDate;
}
```

### Critical relationship

``` text
room_tariffs.id
       ↓
allocation_financial_terms.room_tariff_id
```

This must be a foreign key.

------------------------------------------------------------------------

# 5. Entity: `Charge`

## Responsibility

Represents money the customer owes.

``` java
@Entity
@Table(

## 5. Frontend room selection → tariff → Financial Info
## Step 2 --- Room Allocation page

The frontend has:

``` text
customerId
hostelId
roomId
roomTypeId
bedNumber
checkInDate
```

When the room is selected, do not create financial records yet.

------------------------------------------------------------------------

## Step 3 --- Get the current room tariff

Once the room is selected:

``` text
Frontend
    ↓
GET /api/v1/room-types/{roomTypeId}/tariffs/current
    ↓
RoomTariffController
    ↓
RoomTariffService
    ↓
RoomTariffRepository
    ↓
room_tariffs
```

Response:

``` json
{
    "id": 20,
    "roomTypeId": 4,
    "monthlyRent": 7000.00,
    "securityDepositRequired": 7000.00,
    "effectiveFrom": "2026-01-01",
    "effectiveTo": null
}
```

Frontend uses:

``` text
monthlyRent = 7000
securityDeposit = 7000
```

as the initial Financial Info values.

------------------------------------------------------------------------

# 10. Step 4 --- Financial Info

The screen should contain only the necessary input fields.

## Editable fields

``` text
Monthly Rent *
Security Deposit *
Amount Paid *
Payment Method
```

### Monthly Rent

Pre-filled from:

``` text
room_tariffs.monthly_rent
```

Receptionist can change it for negotiation.

Example:

``` text
Tariff = ₹7,000
Customer agreed = ₹6,500
```

------------------------------------------------------------------------

### Security Deposit

Pre-filled from:

``` text
room_tariffs.security_deposit_required
```

Receptionist can change it for negotiation.

------------------------------------------------------------------------

### Amount Paid

This is the payment received now.

It does not belong in `allocation_financial_terms`.

It becomes:

``` text
payments.amount
```

------------------------------------------------------------------------

### Payment Method

Example:

``` text
CASH
UPI
CARD
NET_BANKING
```

Stored in:

``` text
payments.payment_mode
```

------------------------------------------------------------------------

# 11. Financial Info calculation

## 6. Financial Info fields and current screenshot changes
# 12. Fields to remove from the current screenshot

Remove:

``` text
Previous Balance Due
```

for a normal new customer.

Remove editable:

``` text
Payment Status
```

because the backend derives it.

Remove duplicate:

``` text
Joining Date
```

from Financial Info if it already belongs to Room Allocation.

Rename:

``` text
Advance Deposit Amount
```

to:

``` text
Security Deposit
```

Add:

``` text
Payment Method
```

------------------------------------------------------------------------

# 13. Step 5 --- Summary Review

Summary should display:

``` text
Customer
Room
Bed
Joining Date

Monthly Rent
Security Deposit

Total Initial Charges
Amount Paid
Remaining Due
Payment Method
Payment Status
```

No DB write is required yet if using the recommended staged wizard.

------------------------------------------------------------------------

**Note [VERY IMPORTANT]:**

> **In the customer's page(frontend), you can see that we are making two API calls. 
> One is to create allocation and another one is to create payment. So as we are integrating this new way of creating room stays, so let backend create the room allocation, okay? Already we are having the room allocation implemented. So we simply call the create room allocation function from the backend when we are creating customer stays in the backend only. So need not to make room allocation API call and payment API call in the frontend after clicking on, submit or confirm button.**

> **Let's replace those two API calls with the create customer stays API call, okay? Customer stays API call handle everything, because in that we will be doing step by step actions. So we just need to remove that create allocation API call and payment API call from the frontend, okay? And we simply replace with the create customer stays API.**

> **Note: Customer allocation is already implemented i.e creating room Allocation and updating occupancy status is handled by the room allocation only. So in the backend, we can simply call that function in the customer stays service layer, okay? And rest of the things are already being handled in the create customer stays.**



## 7. Customer Stay backend foundation

The final source plan says the Customer Space should stop creating allocation separately and instead let Customer Stay orchestrate it. In this plan implement the foundation of that orchestration:

1. Validate customer ownership.
2. Load/validate room and room type.
3. Validate selected tariff and its effective date.
4. Call the **existing** `RoomAllocationService` to create the room allocation.
5. Let the existing allocation implementation update room occupancy/status.
6. Create `AllocationFinancialTerms` using the selected `roomTariffId` and negotiated rent/deposit.

Do not duplicate allocation logic inside Customer Stay.

```java
@Transactional
public RegistrationResponse registerCustomerStay(RegisterCustomerStayRequest request) {
    // validate customer + hostel
    // load/validate room + room type
    // validate room tariff for hostel, room type and check-in date
    // call existing RoomAllocationService
    // create AllocationFinancialTerms
    // return stay/allocation/financial-term result
}
```

The final request shape already defined by the source is:

```json
{
    "customerId": 101,
    "hostelId": 10,
    "roomId": 25,
    "bedNumber": "B",
    "checkInDate": "2026-09-26",
    "financialTerms": {
        "roomTariffId": 20,
        "monthlyRent": 5000.00,
        "securityDepositRequired": 2000.00,
        "billingAnchorDate": "2026-09-26"
    }
}
```

`roomTariffId` is mandatory because it records which standard tariff was used as the source of the customer-specific snapshot.

## 8. Backend controller/repository/service pieces

Reuse the source plan's repository/service responsibilities:

```text
CustomerRepository
    findByIdAndHostelId(...)

RoomRepository
    findByIdAndHostelId(...)

RoomAllocationRepository
    existsActiveAllocationForCustomer(...)
    existsActiveAllocationForRoomAndBed(...)

RoomTariffRepository
    findByIdAndHostelId(...)
    findCurrentTariff(...)
    findHistory(...)

AllocationFinancialTermsRepository
    findByAllocationId(...)
```

Services:

```text
RoomTariffService
    getCurrentTariff(...)
    createTariff(...)
    getTariffHistory(...)
    changeTariff(...)

FinancialTermsService
    createTerms(...)
    getTermsByAllocation(...)
    updateTerms(...)

Registration/CustomerStayService
    registerCustomerStay(...)
```

## 9. Frontend API/state structure
# 26. Frontend API structure

Recommended:

``` text
src/api/
    customerService.ts
    roomService.ts
    roomTariffService.ts
    customerStayService.ts
    financialService.ts
    paymentService.ts
```

## `roomTariffService.ts`

``` ts
export async function getCurrentRoomTariff(
    roomTypeId: number
) {
    // GET /api/v1/room-types/{roomTypeId}/tariffs/current
}
```

## `customerStayService.ts`

``` ts
export async function createCustomerStay(
    payload: CreateCustomerStayRequest
) {
    // POST /api/v1/customer-stays
}
```

## `financialService.ts`

``` ts
export async function getCustomerFinancialSummary(
    customerId: number
) {
    // GET /api/v1/customers/{customerId}/financial-summary
}

export async function getCustomerFinancialDetails(
    customerId: number
) {
    // GET /api/v1/customers/{customerId}/financial-details
}
```

## `paymentService.ts`

``` ts
export async function getCustomerPayments(
    customerId: number
) {
    // GET /api/v1/customers/{customerId}/payments
}
```

------------------------------------------------------------------------

# 27. Frontend registration state

``` ts
type CustomerStayDraft = {

    customer: {
        customerId?: number;
        // personal fields...
    };

    allocation: {
        roomId?: number;
        roomTypeId?: number;
        bedNumber?: string;
        checkInDate?: string;
    };

    tariff: {
        roomTariffId?: number;
        standardMonthlyRent?: number;
        standardSecurityDeposit?: number;
    };

    financial: {
        monthlyRent: number;
        securityDeposit: number;
        amountPaid: number;
        paymentMode: PaymentMode;
    };
};
```

Do not store as editable fields:

``` ts
overallDue
remainingDue
paymentStatus
```

These are derived.

------------------------------------------------------------------------


## 10. Frontend implementation sequence
# 28. Exact frontend sequence

## Room Allocation component

User selects:

``` text
Room 25
4 Sharing
Bed B
```

Component obtains:

``` text
roomId = 25
roomTypeId = 4
```

Then:

``` ts
const tariff = await roomTariffService.getCurrentRoomTariff(
    roomTypeId
);
```

Store:

``` ts
draft.tariff.roomTariffId = tariff.id;

draft.financial.monthlyRent =
    tariff.monthlyRent;

draft.financial.securityDeposit =
    tariff.securityDepositRequired;
```

Navigate to Financial Info.

------------------------------------------------------------------------

## Financial Info component

Display:

``` text
Monthly Rent        ₹7,000
Security Deposit    ₹7,000
Amount Paid         ₹0
Payment Method      Cash
```

Receptionist can change:

``` text
Monthly Rent → ₹6,500
Security Deposit → ₹5,000
```

UI calculates:

``` text
Total Initial Charges = ₹11,500
Amount Paid = ₹5,000
Remaining Due = ₹6,500
Status = PARTIAL
```

------------------------------------------------------------------------

## Summary component

Read the draft.

No duplicate calculations should become database fields.

------------------------------------------------------------------------


At this point do **not** wire the old separate allocation API call or payment API call from the Customer Space into the final submission. The Customer Stay endpoint becomes the target submission boundary; its charge/payment completion is finalized in Plans 2 and 3.

## 11. Database constraints

```text
allocation_financial_terms.allocation_id UNIQUE
allocation_financial_terms.room_tariff_id NOT NULL
room_tariffs.hostel_id NOT NULL
room_tariffs.room_type_id NOT NULL
No overlapping active/effective tariff periods for the same hostel + room type
```

Use PostgreSQL `NUMERIC(12,2)` for money.

## 12. Verification

- Create a 4-sharing tariff with ₹7,000 rent and ₹7,000 deposit.
- Select a room and confirm the current tariff is fetched and prefilled.
- Change rent/deposit to negotiated values.
- Submit the Customer Stay foundation.
- Confirm the backend calls the existing room-allocation implementation.
- Confirm occupancy/status is updated by that existing implementation.
- Confirm `allocation_financial_terms.room_tariff_id`, `monthly_rent`, `security_deposit_required`, and `billing_anchor_date` are persisted.

## 13. Next plan

Plan 2 extends this same Customer Stay transaction with `charges`, initial due calculation, security-deposit/monthly-rent obligations, and monthly billing generation.