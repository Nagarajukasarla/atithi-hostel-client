# Atithi — Room Allocation & Payment Implementation Plan

## 1. Objective

Implement the next stage of the Atithi Hostel Management Platform after customer creation:

- Room allocation for customers.
- Payment recording and management.
- Room occupancy management.
- A dedicated Payments UI.
- No dedicated Room Allocations UI at this stage.

The implementation must be scalable, maintainable, transaction-safe, and consistent with the existing Atithi architecture.

Before making changes, the implementation agent must inspect the existing codebase, entities, database schema, authentication, Room model, Customer model, Booking/Reservation model, and existing frontend/backend conventions.

Do not rewrite unrelated code.

---

# 2. Important Architectural Decisions

The following decisions are final and must be followed.

### 2.1 No Bed entity

Do **not** introduce a separate `Bed` entity/table.

Beds are represented using the existing room model and a simple bed identifier such as:

```text
bed_number
```

For example:

```text
Room 204
    ├── Bed A
    ├── Bed B
    ├── Bed C
    └── Bed D
```

The allocation can therefore store:

```text
bed_number = "B"
```

Do not create:

```text
Bed.java
bed table
BedRepository
BedService
```

for this implementation.

---

### 2.2 Room Allocation is a separate domain concept

A customer must not directly contain:

```text
room_id
bed_number
allocation_status
```

as the primary representation of their stay.

Instead:

```text
Customer
    │
    ▼
RoomAllocation
    │
    ├── Room
    └── bed_number
```

`RoomAllocation` represents the customer's relationship with a room over a period of time.

This also allows allocation history to be retained.

---

### 2.3 No dedicated Room Allocations page

Do **not** create a separate:

```text
Room Allocations
```

sidebar item or page at this stage.

The database must still persist room allocation records.

Current allocation information can be displayed contextually:

### Customer page

```text
Current Room: 204
Bed: B
Allocation Status: ACTIVE
Check-in: 20 Sep 2026
```

### Room page

```text
Room 204

Bed A → Available
Bed B → Rahul Kumar
Bed C → Available
Bed D → Available
```

A dedicated Room Allocations page can be introduced later if actual business requirements arise, such as:

- Allocation history.
- Room transfers.
- Previous occupants.
- Check-in/check-out history.
- Allocation reporting.
- Advanced filtering.

Do not implement that UI now.

---

### 2.4 Room Allocation Service terminology

Do not introduce a generic `StayService`.

Use:

```text
RoomAllocationService
```

and related naming such as:

```text
RoomAllocationController
RoomAllocationRepository
RoomAllocationService
RoomAllocationDTO
```

The main API should use:

```text
/api/v1/room-allocation
```

Use the project's existing API versioning and naming conventions if they require a small variation, but the resource must remain `room-allocation`.

---

# 3. Existing Domain Must Be Inspected First

Before implementation, inspect:

```text
Customer
Hostel
Room
RoomType
Booking / Reservation
Authentication / JWT
Existing customer creation flow
Existing room APIs
Existing database migrations
```

Most importantly, determine what the existing `Booking`/`Reservation` concept means.

Do not duplicate responsibilities.

The implementation must clearly distinguish:

```text
Booking / Reservation
        vs
RoomAllocation
        vs
Payment
```

For example, if Booking means:

```text
Customer has reserved a room
```

while RoomAllocation means:

```text
Customer has actually been assigned/occupying the room
```

then they are separate concepts.

If the existing Booking model already represents actual room occupancy, do not create duplicate allocation logic without first reconciling the domain model.

---

# 4. Room Allocation Entity

Create a persistent `RoomAllocation` entity/table.

Conceptually:

```text
room_allocations
------------------------------
id
hostel_id
customer_id
room_id
bed_number
check_in_date
check_out_date
status
created_at
updated_at
```

Use the existing project's base entity/auditing conventions.

### Relationships

```text
RoomAllocation
    ├── Customer
    ├── Room
    └── Hostel
```

Do not create a Bed relationship.

---

# 5. Why RoomAllocation Must Be Persistent

Even though there is currently no Room Allocations page, allocation history must be stored.

Example:

```text
Rahul
    ↓
Room 101 / Bed A
    ↓
20 Jan → 15 Mar
```

Later:

```text
Rahul
    ↓
Room 204 / Bed B
    ↓
15 Mar → current
```

The historical allocation should not be overwritten.

This allows the system to support future requirements without redesigning the database.

---

# 6. Room Allocation Status

Use an enum for allocation lifecycle.

Keep it minimal and aligned with actual business requirements.

Recommended initial values:

```text
ACTIVE
ENDED
CANCELLED
```

If the existing project has equivalent status conventions, reuse them.

Do not add unnecessary states without a business requirement.

---

# 7. Room Allocation Dates

Use explicit allocation dates.

At minimum:

```text
check_in_date
check_out_date
```

`check_out_date` can be nullable while the allocation is active.

Example:

```text
ACTIVE:
check_in_date  = 2026-09-20
check_out_date = NULL
```

After checkout:

```text
ENDED:
check_in_date  = 2026-09-20
check_out_date = 2026-12-20
```

Use the appropriate date/time type according to the existing Atithi domain conventions.

---

# 8. Do Not Put Financial History Inside RoomAllocation

Do not use RoomAllocation as the financial ledger.

Avoid making these the core fields of allocation:

```text
monthly_rent
advance_amount
amount_paid
previous_due
remaining_due
```

RoomAllocation should primarily describe:

```text
WHO
WHERE
WHEN
STATUS
```

Financial transactions belong in the Payment domain.

If the business later requires capturing the agreed rent at the time of allocation, that can be introduced explicitly as a separate business requirement. Do not use it as a replacement for payment history.

---

# 9. Payment Entity

Create a separate `Payment` entity/table.

Conceptually:

```text
payments
----------------------------------------
id
hostel_id
customer_id
allocation_id          nullable
payment_type
amount
payment_method
payment_status
transaction_reference
receipt_number
payment_date
notes
created_at
updated_at
```

Use the project's existing base entity/auditing conventions.

---

# 10. Payment Relationships

Fundamentally:

```text
Customer
    │
    └──────────► Payment
```

A payment may optionally relate to a specific room allocation:

```text
Payment
    │
    ├── Customer
    └── RoomAllocation (optional)
```

Do not assume every future payment must belong to an allocation.

Examples:

```text
MONTHLY_RENT
SECURITY_DEPOSIT
ADVANCE
MAINTENANCE
SERVICE
OTHER
```

Some future payments may be customer-level or service-level rather than directly tied to a particular allocation.

Therefore:

```text
allocation_id
```

may be nullable.

---

# 11. Payment Type

Payment purpose and payment method are separate concepts.

Do not combine them.

### Payment type / purpose

Use only values actually required by the current business model, for example:

```text
INITIAL_RENT
MONTHLY_RENT
SECURITY_DEPOSIT
ADVANCE
MAINTENANCE
SERVICE
OTHER
```

The exact enum values should be aligned with the existing Atithi terminology.

Example:

```text
payment_type = MONTHLY_RENT
```

---

# 12. Payment Method

Payment method represents how the money was paid.

Example:

```text
CASH
UPI
CARD
BANK_TRANSFER
OTHER
```

Do not use combined values such as:

```text
UPI_RENT
CARD_RENT
CASH_RENT
```

Instead:

```text
payment_type   = MONTHLY_RENT
payment_method = UPI
```

---

# 13. Payment Status

Payment transaction status should represent the state of the transaction.

Recommended values:

```text
PENDING
SUCCESS
FAILED
CANCELLED
REFUNDED
```

Do not use:

```text
PARTIAL
UNPAID
```

as transaction statuses unless the existing business model explicitly requires them.

Partial payment and outstanding balance are financial/billing concepts, not necessarily states of an individual payment transaction.

Do not implement a full billing/ledger system unless required.

---

# 14. Money Type — Important

Never use Java `Double` or `float` for financial amounts.

Use:

```java
BigDecimal
```

Example:

```java
@Column(nullable = false, precision = 12, scale = 2)
private BigDecimal amount;
```

Apply this principle to all monetary fields.

Do not use:

```java
Double amount;
double amount;
Float amount;
float amount;
```

for payment/rent values.

---

# 15. Payment Fields

The payment transaction should primarily contain actual transaction information.

Recommended:

```text
id
hostel_id
customer_id
allocation_id nullable
payment_type
amount
payment_method
payment_status
transaction_reference
receipt_number
payment_date
notes
created_at
updated_at
```

Do not add these without a defined business requirement:

```text
previous_due
remaining_due
```

Do not duplicate customer or room information unnecessarily.

Customer, allocation and room information can be obtained through relationships.

---

# 16. Payment Page — Required

Create a dedicated frontend page:

```text
Payments
```

This should be added to the Atithi platform because payment history is an independent operational requirement.

Initial table:

```text
Payment ID
Customer
Payment Type
Amount
Payment Method
Status
Payment Date
Reference
```

The page should be designed so that future filtering can be added easily.

Potential future filters:

```text
Customer
Payment Type
Payment Method
Payment Status
Date Range
```

Do not overbuild the page initially.

---

# 17. Room Allocation UI — Not Required

Do not create:

```text
Room Allocations
```

as a separate frontend page in this phase.

Allocation operations can happen from the existing customer/room workflow.

For example:

```text
Customer
    ↓
Select Room
    ↓
Select bed_number
    ↓
Payment
    ↓
Payment successful
    ↓
Room allocation becomes ACTIVE
```

The current allocation can then be displayed on Customer and Room pages.

---

# 18. Main Room Allocation API

Use:

```http
POST /api/v1/room-allocation
```

for creating an allocation where appropriate.

Example conceptual request:

```json
{
    "customerId": 101,
    "roomId": 204,
    "bedNumber": "B",
    "checkInDate": "2026-09-20"
}
```

The exact DTO structure must follow the existing Atithi API conventions.

Do not trust the client to provide:

```text
hostelId
```

as an authoritative tenant identifier if it can be derived from the authenticated user/context.

The backend must validate ownership/tenant boundaries.

---

# 19. Payment API

Use the existing Atithi API versioning convention.

Conceptually:

```http
POST /api/v1/payments
```

for creating a payment.

Other endpoints can be added according to the existing project architecture, for example:

```text
GET /api/v1/payments
GET /api/v1/payments/{id}
```

The dedicated Payments page will need a list endpoint.

Do not create unnecessary endpoints before they are needed.

---

# 21. Transaction Safety

This is a critical requirement.

The backend must prevent two receptionists/users from allocating the same available capacity simultaneously.

Example:

```text
Room 204
Capacity = 2
Occupied = 1
```

Two requests arrive simultaneously:

```text
Request A → allocate customer A
Request B → allocate customer B
```

Both must not succeed if only one capacity remains.

Do not rely only on:

```java
if (room.isAvailable()) {
    allocate();
}
```

because concurrent requests can pass the same check.

Use appropriate transactional/concurrency controls consistent with PostgreSQL and the existing Spring Boot architecture.

The allocation operation and occupancy update must remain consistent.

---

# 22. Room Occupancy

Room occupancy must have a single reliable source of truth.

Avoid independently changing:

```text
Room status
Customer room
RoomAllocation status
```

from unrelated code paths.

The RoomAllocation business operation should ensure that the allocation and room occupancy remain consistent.

The exact room-capacity strategy should reuse the existing Room model.

Do not introduce a Bed entity.

---

# 23. Payment Completion and Allocation

For the current implementation, the business rule is:

```text
Payment completed
       ↓
Room allocation confirmed
```

However, do not tightly couple the database schema so that a payment can exist only for an allocation.

The relationship should remain flexible:

```text
Payment
   ├── Customer
   └── optional RoomAllocation
```

This allows future services such as:

```text
Laundry
Massage
Housekeeping
Other services
```

to have their own payment transactions later.

---

# 24. Future Payment Gateway Compatibility

Design the Payment entity so that a future online gateway can be introduced without changing the core model.

For example:

```text
payment_status
transaction_reference
payment_method
```

should be capable of representing:

```text
PENDING
SUCCESS
FAILED
REFUNDED
```

Do not assume an online gateway is part of the current implementation.

For an external payment gateway, payment completion may become asynchronous, so the future architecture must not depend on a single synchronous database transaction around the external provider.

---

# 25. Database Constraints and Indexing

Because Atithi is a multi-hostel platform, indexes should be considered for frequently queried fields.

At minimum, evaluate indexes for:

```text
RoomAllocation.hostel_id
RoomAllocation.customer_id
RoomAllocation.room_id

Payment.hostel_id
Payment.customer_id
Payment.allocation_id
Payment.payment_date
```

Use appropriate composite indexes where actual query patterns justify them.

Do not blindly add indexes to every column.

---

# 26. Tenant Isolation

Every operation must respect the current authenticated hostel.

The backend must ensure that a user from Hostel A cannot:

```text
view Hostel B payment
allocate Hostel B room
modify Hostel B allocation
```

Do not trust IDs supplied by the frontend.

For example:

```text
roomId = 204
```

must be validated against the current hostel context.

---

# 27. Floor Configuration

Do not use a hardcoded fallback such as:

```javascript
totalFloors || 4;
```

This must be removed.

Do not silently assume four floors.

The canonical floor representation is numeric:

```text
1
2
3
4
```

Do not introduce labels such as:

```text
Ground
First Floor
Second Floor
Third Floor
```

---

# 28. Floor UI

The room allocation/room selection UI should use numeric floors:

```text
Floor 1
Floor 2
Floor 3
Floor 4
```

The actual number of floors must come from the configured hostel/room data.

Do not hardcode:

```text
1, 2, 3, 4
```

as the number of floors either.

The values above are examples of the representation, not a default count.

---

# 29. Error Handling

Follow existing Atithi exception handling.

Examples:

```text
Customer not found
Room not found
Room belongs to another hostel
Room has no available capacity
Invalid bed_number
Duplicate active allocation
Payment failed
Invalid payment amount
```

Do not expose stack traces or internal database information to clients.

---

# 30. Duplicate Active Allocation Protection

A customer should not accidentally receive multiple active allocations unless the business explicitly permits multiple simultaneous rooms.

At minimum, evaluate and enforce a rule such as:

```text
One customer
    ↓
One ACTIVE room allocation
```

If the business later supports multiple simultaneous rooms, this constraint can be changed deliberately.

Do not silently create duplicate active allocations.

---

# 31. Database Migration

Use the project's existing database migration strategy.

Add:

```text
room_allocations
payments
```

and any required schema changes through the established migration mechanism.

Do not manually modify production PostgreSQL tables outside the project's migration strategy.

---

# 32. Frontend Structure

The expected frontend flow is:

```text
Customer / Room workflow
        ↓
Room selection
        ↓
Payment
        ↓
Allocation confirmation
```

Add:

```text
Payments
```

as a dedicated page.

Do not add:

```text
Room Allocations
```

to the sidebar at this stage.

---

# 33. Recommended Final Domain Structure

```text
                         ATITHI
                            │
             ┌──────────────┼───────────────┐
             │              │               │
          Customer         Room           Payment
             │              │               │
             │              │               │
             └──────┬───────┘               │
                    │                       │
                    ▼                       │
             RoomAllocation ◄───────────────┘
                    │
                    ├── Hostel
                    ├── Customer
                    ├── Room
                    └── bed_number
```

More specifically:

```text
Customer
   │
   ├──────────────► RoomAllocation
   │                      │
   │                      ├── Hostel
   │                      ├── Room
   │                      └── bed_number
   │
   └──────────────► Payment
                          │
                          └── optional RoomAllocation
```

No Bed entity is part of this architecture.

---

# 34. Recommended Minimum Schema

## RoomAllocation

```text
room_allocations
-------------------------------
id
hostel_id
customer_id
room_id
bed_number
check_in_date
check_out_date
status
created_at
updated_at
```

## Payment

```text
payments
----------------------------------------
id
hostel_id
customer_id
allocation_id NULL
payment_type
amount
payment_method
payment_status
transaction_reference
receipt_number
payment_date
notes
created_at
updated_at
```

Use:

```text
BigDecimal
```

for `amount`.

---

# 35. Implementation Sequence

Implement in this order:

### Phase 1 — Domain and database

1. Inspect existing domain models.
2. Resolve Booking/Reservation vs RoomAllocation responsibilities.
3. Create RoomAllocation entity.
4. Create Payment entity.
5. Add required enums.
6. Add database migrations.
7. Add required indexes/constraints.

### Phase 2 — Backend

1. RoomAllocation repository.
2. RoomAllocation service.
3. RoomAllocation controller.
4. Payment repository.
5. Payment service.
6. Payment controller.
7. Validation.
8. Tenant/hostel authorization.
9. Transaction/concurrency handling.
10. Error handling.

### Phase 3 — Frontend

1. Integrate room allocation into the existing room/customer workflow.
2. Add payment creation UI.
3. Add dedicated Payments page.
4. Display current allocation in Customer/Room views.
5. Do not create a Room Allocations page.
6. Fix floor representation/configuration.
7. Remove any hardcoded floor fallback.

### Phase 4 — Testing

Test at minimum:

```text
Customer allocation
Room capacity
Bed number validation
Duplicate active allocation
Cross-hostel access
Payment creation
Payment status
Payment amount precision
Payment listing
Concurrent room allocation
Allocation history
Checkout/end allocation
```

---

# 36. Explicit Non-Goals

Do NOT implement these as part of this phase unless existing code requires them:

```text
Separate Bed entity
Separate Room Allocations page
Generic StayService
Full billing/ledger system
Outstanding-balance engine
Payment gateway integration
S3 for payment/QR data
New microservice
Hardcoded floor count
Ground/First/Second floor naming model
```

---

# 37. Final Requirements Checklist

Before considering the implementation complete, verify:

- [ ] RoomAllocation exists as a separate persistent entity.
- [ ] No Bed entity/table was introduced.
- [ ] `bed_number` is used instead of a Bed relationship.
- [ ] RoomAllocation is exposed through `RoomAllocationService`.
- [ ] Main allocation API uses `/api/v1/room-allocation`.
- [ ] Booking/Reservation responsibilities were checked before implementation.
- [ ] Payment is a separate entity.
- [ ] Payment belongs fundamentally to Customer.
- [ ] Payment can optionally reference RoomAllocation.
- [ ] Payment type and payment method are separate.
- [ ] Payment status represents transaction state.
- [ ] Money uses `BigDecimal`, not `Double`.
- [ ] `previous_due` and `remaining_due` were not unnecessarily added.
- [ ] Room allocation history is persisted.
- [ ] No dedicated Room Allocations page was created.
- [ ] Dedicated Payments page exists.
- [ ] Room/customer views can display current allocation.
- [ ] Room capacity is checked transaction-safely.
- [ ] Cross-hostel access is prevented.
- [ ] Duplicate active allocations are handled.
- [ ] Floor count has no fallback to `4`.
- [ ] Floors are represented numerically.
- [ ] Floor count is configuration/data-driven.
- [ ] Existing Atithi conventions are reused.
- [ ] No unrelated code was rewritten.
