# Atithi — Implementation Plan 3: Payments + Final Customer Financial Page

**Source basis:** Reorganized from `ATITHI_CUSTOMER_FINANCIAL_PAYMENT_IMPLEMENTATION.md`. This file is an incremental implementation plan; related material from different parts of the source has been consolidated here.

## Common implementation guidelines

- Follow existing Atithi project conventions, reusable services, DTOs, validation, tenant/hostel checks, exception handling, and response patterns.
- Reuse existing room-allocation functionality. `CustomerStayService` should call the existing `RoomAllocationService` rather than reimplement allocation or occupancy/status updates.
- Keep controllers thin; orchestration and business rules belong in services.
- Use `BigDecimal` and PostgreSQL `NUMERIC(12,2)` for money.
- Do not store derived `overallDue`, `remainingDue`, or authoritative `paymentStatus` as source-of-truth fields.
- Keep implementation incremental and do not pull later-plan responsibilities into an earlier plan unless required.
- In Customer Space, replace the existing separate room-allocation/payment API calls with the Customer Stay flow when Plan 3 is reached. (This is plan 3 [final one])
- Do not add external payment-provider integration in these plans.

## Goal

Record actual money received, connect payments to charges through `payment_allocations`, complete the Customer Stay transaction, replace the old separate Customer Space allocation/payment calls, and create the final customer financial page.

## 1. Payment model responsibility

`payments` = money actually received.

`payment_allocations` = how received money settles specific charges.

The relationship is:

```text
charges
    ↕
payment_allocations
    ↕
payments
```

A single payment can settle multiple charges.

## 2. Payment entity

Use the existing payment model as the money-received record.     indexes = {
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


------------------------------------------------------------------------

# 7. Entity: `PaymentAllocation`

## Responsibility

Connects received money to specific charges.

``` java
@Entity

The existing legacy fields `monthly_rent`, `advance_amount`, `previous_due`, and `remaining_due`, if present on `payments`, must not be treated as the financial source of truth. Authoritative dues are charges minus payment allocations.

## 3. PaymentAllocation entity
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

## 4. Repositories

### PaymentRepository

```java
List<Payment> findByCustomerIdOrderByPaymentDateDesc(Long customerId);
List<Payment> findByAllocationId(Long allocationId);
```

### PaymentAllocationRepository

```java
List<PaymentAllocation> findByPaymentId(Long paymentId);
List<PaymentAllocation> findByChargeId(Long chargeId);
```

## 5. Services

```text
PaymentService
    recordManualPayment(...)
    getCustomerPayments(...)

PaymentAllocationService
    allocatePayment(...)
    allocateAgainstOldestCharges(...)
    getPaymentAllocations(...)
```

Version 1 allocation policy: oldest outstanding charge first.

## 6. Payment allocation algorithm
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


## 7. Complete Customer Stay transaction

Extend the same Customer Stay service from Plans 1 and 2. Do not create a second registration flow.

```text
1. Validate customer belongs to hostel.
2. Load room and room type.
3. Validate room availability.
4. Validate selected RoomTariff.
5. Call existing RoomAllocationService.
6. Reuse its occupancy/status update.
7. Create AllocationFinancialTerms.
8. Create SECURITY_DEPOSIT charge.
9. Create MONTHLY_RENT charge.
10. If amountPaid > 0, create Payment.
11. Allocate payment against outstanding charges.
12. Calculate authoritative outstanding balance.
13. Return RegistrationResponse.
```

Everything runs in one transaction.

## 8. Final Customer Stay request
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

When implementing the final version, ensure the backend service's room-allocation step calls the already-existing room allocation function rather than duplicating it.

## 9. Critical Customer Space change

The source plan explicitly states that Customer Space currently makes two calls:

```text
1. create room allocation
2. create payment
```

Replace those with one call:

```text
POST /api/v1/customer-stays
```

The frontend must no longer call the room-allocation API or payment API separately during customer registration. `CustomerStayService` performs the complete transaction in the backend.

## 10. Frontend API structure
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


## 11. Final Financial Info UI

Inputs:

```text
Monthly Rent *
Security Deposit *
Amount Paid *
Payment Method
```

Derived display:

```text
Total Initial Charges
Remaining Due
Payment Status
```

Example:

```text
Monthly Rent       ₹5,000
Security Deposit   ₹2,000
--------------------------------
Total Initial Charges ₹7,000
Amount Paid         ₹5,000
--------------------------------
Remaining Due       ₹2,000
Payment Status      PARTIAL
```

Payment status is derived, not manually entered:

```text
Amount Paid = 0                         → UNPAID
0 < Amount Paid < Total Initial Charges → PARTIAL
Amount Paid >= Total Initial Charges   → PAID
```

## 12. Frontend registration sequence

Keep the tariff lookup in the room-selection step and the negotiated values in Financial Info. On final submit, send only the Customer Stay request.

```ts
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

## 13. Final customer financial page

This page should be implemented **in Plan 3**, because only now do all required financial records exist.

### Summary endpoint

```text
GET /api/v1/customers/{customerId}/financial-summary
```

Example response:

```json
{
    "monthlyRent": 5000.00,
    "securityDepositRequired": 2000.00,
    "securityDepositPaid": 2000.00,
    "totalCharges": 7000.00,
    "totalPaid": 5000.00,
    "outstandingBalance": 2000.00
}
```

### Full details endpoint

```text
GET /api/v1/customers/{customerId}/financial-details
```

Response can contain:

```json
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

This gives the customer page one backend response for the complete financial view.

## 14. Customer financial UI

```text
FINANCIAL SUMMARY
Monthly Rent                 ₹5,000
Security Deposit             ₹2,000
Total Charges                ₹7,000
Total Paid                   ₹5,000
Outstanding                  ₹2,000
```

Charges:

```text
Type               Period       Amount     Paid      Due
Security Deposit   Joining      ₹2,000   ₹2,000       ₹0
Monthly Rent       Sep 2026     ₹5,000   ₹3,000   ₹2,000
```

Payments:

```text
Date         Type                   Method     Amount Status
26-09-2026   Initial Registration   Cash       ₹5,000 Success
```

## 15. Financial endpoints

Implement:

```text
GET /api/v1/customers/{customerId}/financial-summary
GET /api/v1/customers/{customerId}/financial-details
GET /api/v1/customers/{customerId}/payments
GET /api/v1/customers/{customerId}/charges
```

Calculate the summary from:

```text
charges
    + payment_allocations
    + payments
```

Never calculate outstanding balance from payments alone.

## 16. Final database result example
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


## 17. Database constraints

```text
payment_allocations.payment_id NOT NULL
payment_allocations.charge_id NOT NULL
Total allocated amount <= payment.amount
```

Use `NUMERIC(12,2)` for all monetary amounts.

## 18. Verification

1. Select an existing customer and room.
2. Fetch the current room tariff.
3. Confirm Financial Info allows negotiated rent/deposit.
4. Confirm Customer Space no longer calls room allocation directly.
5. Confirm Customer Space no longer calls payment directly.
6. Confirm one `POST /api/v1/customer-stays` is submitted.
7. Confirm CustomerStayService calls the existing RoomAllocationService.
8. Confirm existing occupancy/status logic runs.
9. Confirm allocation financial terms, charges, payment, and payment allocations are created in one transaction.
10. Test ₹5,000 paid against ₹7,000 charges and verify ₹2,000 outstanding.
11. Open the customer financial page and verify rent, deposit, total charges, total paid, outstanding, charge history, and payment history.

## 19. Final source-of-truth rules

```text
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

Authoritative equation:

```text
Outstanding Balance
    = SUM(charges)
    - SUM(payment_allocations)
```

Never use the current room tariff to determine an existing resident's rent. Use `allocation_financial_terms.monthly_rent`.

## 20. Final implementation checklist

### Backend

- [ ] Update `Payment` entity to the manual-payment model
- [ ] Implement `PaymentAllocation` entity/repository/service
- [ ] Implement manual payment recording
- [ ] Implement oldest-charge-first allocation
- [ ] Extend Customer Stay transaction to create payment
- [ ] Extend Customer Stay transaction to allocate payment
- [ ] Implement financial summary/details
- [ ] Implement customer payments/charges endpoints

### Frontend

- [ ] Remove direct room-allocation API call from Customer Space registration
- [ ] Remove direct payment API call from Customer Space registration
- [ ] Submit once through `customerStayService.createCustomerStay(...)`
- [ ] Keep tariff lookup in room selection
- [ ] Keep negotiated rent/deposit in Financial Info
- [ ] Show calculated total/remaining due
- [ ] Build customer financial summary
- [ ] Build charge history
- [ ] Build payment history

### Explicitly not included

