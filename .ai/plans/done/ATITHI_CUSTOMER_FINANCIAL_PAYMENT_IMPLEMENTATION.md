# Atithi Customer Financial & Payment Integration Implementation Plan

> **Goal:** Implement the Atithi customer registration → room allocation
> → financial terms → charges → payment → customer financial ledger flow


------------------------------------------------------------------------

# 0. Core design decisions

## 0.1 `room_tariffs` is mandatory

`room_tariffs` is a core table. It is not optional.

It owns the **standard pricing for a hostel + room type** over a period.

Example:

``` text
4 Sharing
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

``` text
SECURITY_DEPOSIT   ₹2,000
MONTHLY_RENT       ₹5,000
```

Do not calculate lifetime/current customer due only from the `payments`
table.

------------------------------------------------------------------------

## 0.5 `payments` are the source of truth for money received

A payment means:

> This amount of money was received from the customer.

A payment may come from:

``` text
CASH
UPI
CARD
NET_BANKING
GATEWAY
```

The payment table remains gateway-ready.

------------------------------------------------------------------------

## 0.6 `payment_allocations` connects money received to money owed

A single payment can settle multiple charges.

Example:

``` text
Payment = ₹5,000

Security Deposit charge = ₹2,000
Monthly Rent charge     = ₹5,000
```

The payment can be allocated:

``` text
Security Deposit = ₹2,000
Monthly Rent     = ₹3,000
```

Remaining rent due:

``` text
₹2,000
```

Therefore:

``` text
charges
    ↕
payment_allocations
    ↕
payments
```

------------------------------------------------------------------------

## 0.7 Never store `overall_due` as the financial source of truth

For initial registration:

``` text
Total Initial Charges
    = Monthly Rent + Security Deposit

Remaining Due
    = Total Initial Charges - Amount Paid
```

For the complete customer ledger:

``` text
Outstanding Balance
    = SUM(Charges)
    - SUM(Payment Allocations)
```

The backend calculates these values.

The frontend may display them but should not be trusted as authoritative
input.

------------------------------------------------------------------------

## 0.8 Payment status should be derived

For the financial summary:

``` text
Amount Paid = 0
    → UNPAID

Amount Paid > 0 AND Amount Paid < Total Initial Charges
    → PARTIAL

Amount Paid >= Total Initial Charges
    → PAID
```

Gateway transaction status is separate:

``` text
PENDING
SUCCESS
FAILED
CANCELLED
REFUNDED
```

------------------------------------------------------------------------

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

# 3. Entity: `RoomTariff`

## Responsibility

Defines standard pricing for a hostel + room type.

## Fields

``` java
@Entity
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
    name = "charges",
    indexes = {
        @Index(
            name = "idx_charge_customer",
            columnList = "customer_id"
        ),
        @Index(
            name = "idx_charge_allocation",
            columnList = "allocation_id"
        ),
        @Index(
            name = "idx_charge_due_date",
            columnList = "due_date"
        )
    }
)
public class Charge extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hostel_id", nullable = false)
    private Hostel hostel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id")
    private RoomAllocation allocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "charge_type", nullable = false, length = 40)
    private ChargeType chargeType;

    @Column(
        name = "amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal amount;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(name = "notes", length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private ChargeStatus status;
}
```

## Charge types

For your current Atithi requirement:

``` java
public enum ChargeType {
    SECURITY_DEPOSIT,
    MONTHLY_RENT,
}
```

There are no other recurring rents in the current design.

------------------------------------------------------------------------

# 6. Entity: `Payment`

`payments` records actual money received.

It remains compatible with future gateway integration.

``` java
@Entity
@Table(
    name = "payments",
    indexes = {
        @Index(name = "idx_payment_customer", columnList = "customer_id"),
        @Index(name = "idx_payment_hostel", columnList = "hostel_id"),
        @Index(name = "idx_payment_allocation", columnList = "allocation_id")
    }
)
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "hostel_id", nullable = false)
    private Hostel hostel;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id")
    private RoomAllocation allocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 40)
    private PaymentType paymentType;

    @Column(
        name = "amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 30)
    private PaymentMode paymentMode;

    @Column(name = "payment_date")
    private LocalDate paymentDate;

    @Column(name = "receipt_number", unique = true, length = 64)
    private String receiptNumber;

    @Column(name = "gateway_provider", length = 40)
    private String gatewayProvider;

    @Column(name = "gateway_order_id", length = 150)
    private String gatewayOrderId;

    @Column(name = "gateway_payment_id", length = 150)
    private String gatewayPaymentId;

    @Column(name = "gateway_transaction_ref", length = 150)
    private String gatewayTransactionRef;

    @Column(name = "notes", length = 500)
    private String notes;
}
```

### Important migration note

If the current `payments` table contains:

``` text
monthly_rent
advance_amount
previous_due
remaining_due
```

do not use those fields as the financial source of truth.

Move authoritative calculations to:

``` text
charges
+
payment_allocations
```

Keep gateway/reference fields in `payments`.

------------------------------------------------------------------------

# 7. Entity: `PaymentAllocation`

## Responsibility

Connects received money to specific charges.

``` java
@Entity
@Table(
    name = "payment_allocations",
    indexes = {
        @Index(
            name = "idx_payment_allocation_payment",
            columnList = "payment_id"
        ),
        @Index(
            name = "idx_payment_allocation_charge",
            columnList = "charge_id"
        )
    }
)
public class PaymentAllocation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "charge_id", nullable = false)
    private Charge charge;

    @Column(
        name = "allocated_amount",
        nullable = false,
        precision = 12,
        scale = 2
    )
    private BigDecimal allocatedAmount;
}
```

Service rule:

``` text
SUM(payment_allocations.allocated_amount)
    <= payment.amount
```

------------------------------------------------------------------------

# 8. Complete relationship between the financial tables

The most important relationship is:

``` text
RoomType
   │
   └── RoomTariff
           │
           │ room_tariff_id
           ▼
AllocationFinancialTerms
           │
           │ allocation_id
           ▼
RoomAllocation
           │
           ├── Customer
           └── Room


Customer + Allocation
        │
        ▼
      Charges
        │
        │ charge_id
        ▼
PaymentAllocations
        │
        │ payment_id
        ▼
     Payments
```

In relational terms:

``` text
room_types
    1
    │
    │ many
    ▼
room_tariffs
    1
    │
    │ many
    ▼
allocation_financial_terms
    1
    │
    │ 1
    ▼
room_allocations
```

And:

``` text
customers
    │
    ├────────── charges
    │
    └────────── payments
                    │
                    ▼
             payment_allocations
                    ▲
                    │
                 charges
```

------------------------------------------------------------------------

# 9. Exact UI → API → Service → Repository → DB flow

## Step 1 --- Customer data

Frontend already has customer information.

No financial table is touched.

------------------------------------------------------------------------

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
GATEWAY
```

Stored in:

``` text
payments.payment_mode
```

------------------------------------------------------------------------

# 11. Financial Info calculation

Example:

``` text
Monthly Rent       ₹5,000
Security Deposit   ₹2,000
Amount Paid        ₹5,000
```

Display:

``` text
INITIAL PAYMENT SUMMARY

Monthly Rent              ₹5,000
Security Deposit          ₹2,000
--------------------------------
Total Initial Charges     ₹7,000

Amount Paid               ₹5,000
--------------------------------
Remaining Due             ₹2,000

Payment Status            PARTIAL
```

Frontend calculation:

``` ts
const totalInitialCharges =
    monthlyRent + securityDeposit;

const remainingDue =
    Math.max(totalInitialCharges - amountPaid, 0);
```

Do not send `remainingDue` as authoritative data.

------------------------------------------------------------------------

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


# 14. Final Submit API

When the user clicks Confirm:

``` http
POST /api/v1/customer-stays
```

Request:

``` json
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
    },

    "initialPayment": {
        "amount": 5000.00,
        "paymentMode": "CASH"
    }
}
```

Important:

``` text
roomTariffId
```

must be sent because the selected tariff is part of the financial
snapshot.

The backend should also verify that the tariff belongs to the same:

``` text
hostel
room type
```

and is valid for the check-in date.

------------------------------------------------------------------------

# 15. Backend controller

``` java
@PostMapping("/api/v1/customer-stays")
public ResponseEntity<RegistrationResponse> register(
        @Valid @RequestBody RegisterCustomerStayRequest request) {

    return ResponseEntity.ok(
        registrationService.registerCustomerStay(request)
    );
}
```

Keep the controller thin.

------------------------------------------------------------------------

# 16. Backend service --- complete transaction flow

``` java
@Transactional
public RegistrationResponse registerCustomerStay(
        RegisterCustomerStayRequest request) {

    // 1. Validate customer belongs to hostel.

    // 2. Load selected room and room type.

    // 3. Validate room availability.

    // 4. Load room tariff by request.financialTerms.roomTariffId.

    // 5. Validate tariff belongs to the hostel and room type.

    // 6. Validate tariff is effective for check-in date.

    // 7. Create RoomAllocation.

    // 8. Update room occupancy/status.

    // 9. Create AllocationFinancialTerms:
    //      allocation
    //      roomTariff
    //      negotiated monthlyRent
    //      negotiated securityDeposit
    //      billingAnchorDate

    // 10. Create SECURITY_DEPOSIT charge.

    // 11. Create MONTHLY_RENT charge.

    // 12. If amountPaid > 0:
    //      create Payment.

    // 13. Allocate payment against outstanding charges.

    // 14. Calculate authoritative outstanding balance.

    // 15. Return RegistrationResponse.
}
```

Everything above runs inside one transaction.

------------------------------------------------------------------------

# 17. Repositories

## `CustomerRepository`

``` java
Optional<Customer> findByIdAndHostelId(
    Long customerId,
    Long hostelId
);
```

Purpose:

``` text
Validate tenant ownership.
```

------------------------------------------------------------------------

## `RoomRepository`

``` java
Optional<Room> findByIdAndHostelId(
    Long roomId,
    Long hostelId
);
```

Purpose:

``` text
Load room and validate ownership/capacity.
```

------------------------------------------------------------------------

## `RoomAllocationRepository`

``` java
boolean existsActiveAllocationForCustomer(
    Long customerId,
    Long hostelId
);

boolean existsActiveAllocationForRoomAndBed(
    Long roomId,
    String bedNumber
);
```

Purpose:

``` text
Prevent duplicate active allocations and double booking.
```

------------------------------------------------------------------------

## `RoomTariffRepository`

``` java
Optional<RoomTariff> findByIdAndHostelId(
    Long tariffId,
    Long hostelId
);

Optional<RoomTariff> findCurrentTariff(
    Long hostelId,
    Long roomTypeId,
    LocalDate date
);

List<RoomTariff> findHistory(
    Long hostelId,
    Long roomTypeId
);
```

------------------------------------------------------------------------

## `AllocationFinancialTermsRepository`

``` java
Optional<AllocationFinancialTerms>
findByAllocationId(Long allocationId);
```

------------------------------------------------------------------------

## `ChargeRepository`

``` java
boolean existsSecurityDepositCharge(
    Long customerId,
    Long hostelId
);

boolean existsMonthlyRentCharge(
    Long allocationId,
    LocalDate periodStart,
    LocalDate periodEnd
);

List<Charge> findOutstandingCharges(
    Long customerId,
    Long hostelId
);
```

------------------------------------------------------------------------

## `PaymentRepository`

``` java
List<Payment> findByCustomerIdOrderByPaymentDateDesc(
    Long customerId
);

List<Payment> findByAllocationId(
    Long allocationId
);

Optional<Payment> findByGatewayPaymentId(
    String gatewayPaymentId
);
```

------------------------------------------------------------------------

## `PaymentAllocationRepository`

``` java
List<PaymentAllocation> findByPaymentId(
    Long paymentId
);

List<PaymentAllocation> findByChargeId(
    Long chargeId
);
```

------------------------------------------------------------------------

# 18. Services

## `RoomTariffService`

``` java
getCurrentTariff(...)
createTariff(...)
getTariffHistory(...)
changeTariff(...)
```

------------------------------------------------------------------------

## `FinancialTermsService`

``` java
createTerms(...)
getTermsByAllocation(...)
updateTerms(...)
```

------------------------------------------------------------------------

## `ChargeService`

``` java
createSecurityDepositCharge(...)
createMonthlyRentCharge(...)
createOpeningBalanceCharge(...)

getCustomerCharges(...)
getOutstandingCharges(...)

calculateOutstandingBalance(...)
```

------------------------------------------------------------------------

## `PaymentService`

``` java
recordManualPayment(...)
createGatewayPayment(...)
confirmGatewayPayment(...)
refundPayment(...)
getCustomerPayments(...)
```

------------------------------------------------------------------------

## `PaymentAllocationService`

``` java
allocatePayment(...)
allocateAgainstOldestCharges(...)
getPaymentAllocations(...)
```

For Version 1:

``` text
oldest outstanding charge first
```

is sufficient.

------------------------------------------------------------------------

## `RegistrationService`

``` java
registerCustomerStay(...)
```

This orchestrates the complete registration transaction.

------------------------------------------------------------------------

# 19. Example backend result

For:

``` text
Monthly Rent = ₹5,000
Security Deposit = ₹2,000
Amount Paid = ₹5,000
```

backend creates:

## `room_allocations`

``` text
Customer 101
Room 25
Bed B
Check-in 2026-09-26
```

## `room_tariffs`

Already exists:

``` text
Tariff 20
4 Sharing
₹7,000 standard rent
₹7,000 standard deposit
```

## `allocation_financial_terms`

``` text
allocation_id = 500
room_tariff_id = 20
monthly_rent = 5000
security_deposit_required = 2000
billing_anchor_date = 2026-09-26
```

Notice:

``` text
room_tariff = ₹7,000
agreed rent = ₹5,000
```

This is the negotiated snapshot.

## `charges`

``` text
SECURITY_DEPOSIT = ₹2,000
MONTHLY_RENT     = ₹5,000
```

## `payments`

``` text
amount = ₹5,000
paymentType = INITIAL_REGISTRATION
paymentMode = CASH
paymentStatus = SUCCESS
```

## `payment_allocations`

``` text
Security Deposit = ₹2,000
Monthly Rent     = ₹3,000
```

Therefore:

``` text
Total Charges = ₹7,000
Total Paid    = ₹5,000
Outstanding   = ₹2,000
```

------------------------------------------------------------------------

# 20. Customer financial page

Recommended API:

``` http
GET /api/v1/customers/{customerId}/financial-summary
```

Response:

``` json
{
    "monthlyRent": 5000.00,
    "securityDepositRequired": 2000.00,
    "securityDepositPaid": 2000.00,
    "totalCharges": 7000.00,
    "totalPaid": 5000.00,
    "outstandingBalance": 2000.00
}
```

For a full page:

``` http
GET /api/v1/customers/{customerId}/financial-details
```

Response can contain:

``` json
{
    "customer": {},
    "activeAllocation": {},
    "financialTerms": {},
    "summary": {},
    "charges": [],
    "payments": [],
    "paymentAllocations": []
}
```

This allows the customer page to show everything in one request.

------------------------------------------------------------------------

# 21. Customer page UI

## Financial Summary

``` text
Monthly Rent                 ₹5,000
Security Deposit             ₹2,000

Total Charges                ₹7,000
Total Paid                   ₹5,000
Outstanding                  ₹2,000
```

## Charges

  Type               Period       Amount     Paid      Due
  ------------------ ---------- -------- -------- --------
  Security Deposit   Joining      ₹2,000   ₹2,000       ₹0
  Monthly Rent       Sep 2026     ₹5,000   ₹3,000   ₹2,000

## Payments

  Date         Type                   Method     Amount Status
  ------------ ---------------------- -------- -------- ---------
  26-09-2026   Initial Registration   Cash       ₹5,000 Success

------------------------------------------------------------------------

# 22. Monthly rent generation

Do not create every future rent charge during registration.

At registration:

``` text
Create joining-period MONTHLY_RENT charge
```

For future periods:

``` text
billing job
    ↓
find active allocations
    ↓
get AllocationFinancialTerms
    ↓
check existing charge
    ↓
create MONTHLY_RENT charge if missing
```

Use:

``` java
boolean existsMonthlyRentCharge(
    Long allocationId,
    LocalDate periodStart,
    LocalDate periodEnd
);
```

This prevents duplicate monthly charges.

The amount must come from:

``` text
allocation_financial_terms.monthly_rent
```

not the current `room_tariffs.monthly_rent`.

This is critical for negotiated/custom rents.

------------------------------------------------------------------------

# 23. Payment allocation algorithm

When a payment is received:

``` java
@Transactional
public PaymentResponse recordPayment(...) {

    // 1. Validate payment/customer/hostel.

    // 2. Create Payment.

    // 3. Find outstanding charges ordered by due date ASC.

    // 4. Allocate payment to oldest charge first.

    // 5. Create PaymentAllocation rows.

    // 6. Stop when payment amount is fully allocated.

    // 7. Recalculate outstanding balance.

    // 8. Return payment + allocation details.
}
```

Example:

``` text
Payment = ₹10,000

September Rent = ₹2,000 outstanding
October Rent   = ₹5,000 outstanding
November Rent  = ₹5,000 outstanding
```

Result:

``` text
September = ₹2,000
October   = ₹5,000
November  = ₹3,000
```

November still has:

``` text
₹2,000 due
```

------------------------------------------------------------------------

# 24. Security deposit rules

Security deposit is represented as:

``` text
ChargeType.SECURITY_DEPOSIT
```

It is not monthly rent.

At registration:

``` text
allocation_financial_terms.security_deposit_required
        ↓
SECURITY_DEPOSIT charge
```

Payment allocation can settle that charge.

Later, when the customer leaves, the deposit can be:

``` text
refunded
adjusted against dues
adjusted against damage
partially refunded
```

Those later operations should be represented through explicit financial
transactions/adjustments rather than changing historical charges.

------------------------------------------------------------------------

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

## Submit

``` ts
await customerStayService.createCustomerStay({
    customerId,
    hostelId,
    roomId,
    bedNumber,
    checkInDate,

    financialTerms: {
        roomTariffId,
        monthlyRent,
        securityDepositRequired,
        billingAnchorDate: checkInDate
    },

    initialPayment: {
        amount: amountPaid,
        paymentMode
    }
});
```

------------------------------------------------------------------------

# 29. Minimum Version 1 API set

Implement these first:

``` text
GET  /api/v1/room-types/{roomTypeId}/tariffs/current
POST /api/v1/room-types/{roomTypeId}/tariffs
GET  /api/v1/room-types/{roomTypeId}/tariffs/history

POST /api/v1/customer-stays

GET  /api/v1/customers/{customerId}/financial-summary
GET  /api/v1/customers/{customerId}/financial-details
GET  /api/v1/customers/{customerId}/payments
GET  /api/v1/customers/{customerId}/charges
```

Then add:

``` text
GET /api/v1/room-allocations/{allocationId}/financial-terms
PUT /api/v1/room-allocations/{allocationId}/financial-terms

POST /api/v1/customers/{customerId}/payments
```

Gateway endpoints come later.

------------------------------------------------------------------------

# 30. Implementation phases

Implement in this order.

## Phase 1 --- `room_tariffs`

Create:

``` text
RoomTariff entity
RoomTariffRepository
RoomTariffService
RoomTariffController
RoomTariff DTOs
```

Implement:

``` text
current tariff
create tariff
tariff history
effective-date validation
```

### Verify

Create:

``` text
4 Sharing
₹7,000 rent
₹7,000 deposit
```

Open Financial Info and confirm the values are pre-filled.

------------------------------------------------------------------------

## Phase 2 --- `allocation_financial_terms`

Create:

``` text
AllocationFinancialTerms entity
Repository
Service
DTO
```

Mandatory relationship:

``` text
allocation_financial_terms.room_tariff_id
        ↓
room_tariffs.id
```

### Verify

For:

``` text
Tariff = ₹7,000
Negotiated rent = ₹6,500
```

database contains:

``` text
room_tariff_id = tariff ID
monthly_rent = 6500
```

------------------------------------------------------------------------

## Phase 3 --- `charges`

Create:

``` text
Charge entity
ChargeRepository
ChargeService
```

At initial registration create:

``` text
SECURITY_DEPOSIT
MONTHLY_RENT
```

### Verify

For:

``` text
Rent = ₹5,000
Deposit = ₹2,000
```

database contains:

``` text
SECURITY_DEPOSIT = ₹2,000
MONTHLY_RENT = ₹5,000
```

------------------------------------------------------------------------

## Phase 4 --- `payment_allocations`

Create:

``` text
PaymentAllocation entity
Repository
Service
```

### Verify

For:

``` text
Charges = ₹7,000
Payment = ₹5,000
```

the outstanding balance is:

``` text
₹2,000
```

------------------------------------------------------------------------

## Phase 5 --- CustomerStay transaction

Implement:

``` text
CustomerStayService.createCustomerStay(...)
```

The transaction creates:

``` text
RoomAllocation
AllocationFinancialTerms
Charges
Payment
PaymentAllocations
```

and updates room occupancy.

### Verify

One successful registration produces all required records.

------------------------------------------------------------------------

## Phase 6 --- Financial Info UI

Change the current UI to:

``` text
Monthly Rent
Security Deposit
Amount Paid
Payment Method
```

Derived:

``` text
Total Initial Charges
Remaining Due
Payment Status
```

------------------------------------------------------------------------

## Phase 7 --- Customer financial page

Implement:

``` text
financial-summary
financial-details
charges
payments
```

Display:

``` text
Monthly Rent
Security Deposit
Total Charges
Total Paid
Outstanding
Charge History
Payment History
```

------------------------------------------------------------------------

## Phase 8 --- monthly billing

Only after customer stay/payment works:

``` text
Generate next MONTHLY_RENT charge
```

Use:

``` text
allocation_financial_terms.monthly_rent
```

not the current room tariff.

------------------------------------------------------------------------

# 31. Database constraints to add

Use PostgreSQL:

``` sql
NUMERIC(12,2)
```

for all monetary amounts.

Important constraints:

``` text
allocation_financial_terms.allocation_id UNIQUE

allocation_financial_terms.room_tariff_id NOT NULL

room_tariffs.hostel_id NOT NULL

room_tariffs.room_type_id NOT NULL

charges.hostel_id NOT NULL

charges.customer_id NOT NULL

payment_allocations.payment_id NOT NULL

payment_allocations.charge_id NOT NULL
```

For security deposit:

``` text
Only one SECURITY_DEPOSIT charge
per customer + hostel
```

For monthly rent:

``` text
Only one MONTHLY_RENT charge
per allocation + billing period
```

For payment allocations:

``` text
Total allocated amount
must not exceed payment.amount
```

For tariffs:

``` text
Do not allow overlapping active/effective tariff periods
for the same hostel + room type.
```

------------------------------------------------------------------------

# 32. Final responsibility table

  -----------------------------------------------------------------------
  Table                               Responsibility
  ----------------------------------- -----------------------------------
  `customers`                         Resident identity/personal
                                      information

  `room_types`                        Sharing type/capacity/category

  `room_tariffs`                      Standard and historical pricing for
                                      hostel + room type

  `rooms`                             Physical room

  `room_allocations`                  Which customer occupies which
                                      room/bed and when

  `allocation_financial_terms`        Customer-specific negotiated
                                      financial agreement and tariff
                                      snapshot

  `charges`                           What the customer owes

  `payments`                          What money was received

  `payment_allocations`               Which charges were settled by each
                                      payment
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 33. Final source-of-truth rules

Use these rules throughout Atithi.

``` text
Standard pricing
    → room_tariffs

Customer agreed pricing
    → allocation_financial_terms

Money owed
    → charges

Money received
    → payments

How received money settles owed money
    → payment_allocations
```

Never calculate current outstanding balance from only:

``` text
payments
```

Never use the current room tariff to determine an existing resident's
rent.

Use:

``` text
allocation_financial_terms.monthly_rent
```

for existing allocations.

The authoritative equation is:

``` text
Outstanding Balance
    =
    SUM(charges)
    -
    SUM(payment_allocations)
```

------------------------------------------------------------------------

# 34. Final end-to-end flow

``` text
CUSTOMER REGISTRATION
        │
        ▼
ROOM SELECTION
        │
        ▼
Room Type identified
        │
        ▼
GET CURRENT ROOM TARIFF
        │
        ├── Standard Monthly Rent
        └── Standard Security Deposit
        │
        ▼
FINANCIAL INFO
        │
        ├── Monthly Rent
        ├── Security Deposit
        ├── Amount Paid
        └── Payment Method
        │
        ▼
SUMMARY REVIEW
        │
        ▼
POST /customer-stays
        │
        ▼
RegistrationService
        │
        ├── Validate Customer
        ├── Validate Room
        ├── Validate Room Tariff
        │
        ├── Create RoomAllocation
        │
        ├── Create AllocationFinancialTerms
        │       ├── room_tariff_id
        │       ├── monthly_rent
        │       ├── security_deposit_required
        │       └── billing_anchor_date
        │
        ├── Create SECURITY_DEPOSIT charge
        │
        ├── Create MONTHLY_RENT charge
        │
        ├── Create Payment
        │
        └── Create PaymentAllocations
        │
        ▼
CUSTOMER FINANCIAL PAGE
        │
        ├── Total Charges
        ├── Total Paid
        ├── Outstanding
        ├── Security Deposit
        ├── Monthly Rent
        ├── Charge History
        └── Payment History
```

------------------------------------------------------------------------

# 35. Implementation checklist

### Database

-   [ ] Create `room_tariffs`
-   [ ] Create `allocation_financial_terms`
-   [ ] Create `charges`
-   [ ] Create `payment_allocations`
-   [ ] Add `room_tariff_id` FK to `allocation_financial_terms`
-   [ ] Change money fields to `NUMERIC(12,2)`
-   [ ] Add unique constraints
-   [ ] Add tariff effective-date validation

### Backend

-   [ ] `RoomTariff` entity/repository/service/controller
-   [ ] `AllocationFinancialTerms` entity/repository/service
-   [ ] `Charge` entity/repository/service
-   [ ] `PaymentAllocation` entity/repository/service
-   [ ] Update `Payment`
-   [ ] Implement tariff lookup
-   [ ] Implement registration transaction
-   [ ] Implement payment allocation
-   [ ] Implement financial summary
-   [ ] Implement customer financial details

### Frontend

-   [ ] Fetch current tariff after room selection
-   [ ] Pre-fill rent
-   [ ] Pre-fill security deposit
-   [ ] Allow negotiated rent
-   [ ] Allow negotiated deposit if business rules permit
-   [ ] Add amount paid
-   [ ] Add payment method
-   [ ] Remove previous due from new registration
-   [ ] Remove editable payment status
-   [ ] Show calculated total charges
-   [ ] Show calculated remaining due
-   [ ] Submit one final registration request
-   [ ] Build customer financial page

### Later

-   [ ] Monthly billing job
-   [ ] Gateway order creation
-   [ ] Gateway verification
-   [ ] Webhook handling
-   [ ] Refunds/deposit settlement
-   [ ] Financial adjustments
-   [ ] Receipts

------------------------------------------------------------------------

# 36. Important implementation note

The accessible Atithi project material confirms the existing five-step
registration direction, room allocation/payment architecture, and
frontend registration flow.

The current implementation material previously contained payment fields
such as `monthlyRent`, `advanceAmount`, `previousDue`, and
`remainingDue` directly on `Payment`. This plan intentionally changes
the financial source of truth to:

``` text
room_tariffs
        ↓
allocation_financial_terms
        ↓
charges
        ↓
payment_allocations
        ↑
payments
```

The actual package names and existing DTO/controller names should be
reconciled with the current source tree when implementing each phase.
