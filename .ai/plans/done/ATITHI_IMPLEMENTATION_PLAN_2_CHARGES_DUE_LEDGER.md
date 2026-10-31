# Atithi — Implementation Plan 2: Charges + Due Ledger

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

Extend the Customer Stay transaction so Atithi records what the customer owes. This plan introduces `charges`, authoritative due calculation, the initial financial summary, security-deposit handling, and future monthly-rent generation. Payments remain in Plan 3.

## 1. Source-of-truth rules for dues
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


## 2. Charge entity
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


``` java
@Entity
@Table(

## 3. Relationship to the previous plans

```text
room_tariffs
    ↓
allocation_financial_terms
    ↓
charges
```

`allocation_financial_terms.monthly_rent` is the amount used to create monthly-rent charges. Never use the current `room_tariffs.monthly_rent` for an already-created allocation because the resident may have a negotiated rent.

## 4. Extend Customer Stay transaction

Take the Customer Stay service created in Plan 1 and add only the charge responsibilities here:

```java
@Transactional
public RegistrationResponse registerCustomerStay(RegisterCustomerStayRequest request) {
    // existing Plan 1 validation
    // existing RoomAllocationService call
    // existing AllocationFinancialTerms creation

    // NEW IN PLAN 2:
    // create SECURITY_DEPOSIT charge
    // create joining-period MONTHLY_RENT charge
    // calculate authoritative outstanding balance
    // return registration + charge summary
}
```

At initial registration create:

```text
SECURITY_DEPOSIT
MONTHLY_RENT
```

For ₹5,000 rent + ₹2,000 deposit:

```text
Total Charges = ₹7,000
```

## 5. Charge repository/service

Repository methods:

```java
boolean existsSecurityDepositCharge(Long customerId, Long hostelId);

boolean existsMonthlyRentCharge(
    Long allocationId,
    LocalDate periodStart,
    LocalDate periodEnd
);

List<Charge> findOutstandingCharges(Long customerId, Long hostelId);
```

Service responsibilities:

```text
createSecurityDepositCharge(...)
createMonthlyRentCharge(...)
getCustomerCharges(...)
getOutstandingCharges(...)
calculateOutstandingBalance(...)
```

Enforce:

```text
Only one SECURITY_DEPOSIT charge per customer + hostel.
Only one MONTHLY_RENT charge per allocation + billing period.
```

## 6. Financial Info calculation
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

The frontend may show a preview, but the backend remains authoritative:

```ts
const totalInitialCharges = monthlyRent + securityDeposit;
const remainingDue = Math.max(totalInitialCharges - amountPaid, 0);
```

Do not persist `remainingDue` as the financial source of truth.

## 7. Monthly rent generation
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


The future billing job must use `allocation_financial_terms.monthly_rent`, not the current room tariff.

## 8. Security deposit
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


## 9. Customer charge APIs

Implement:

```text
GET /api/v1/customers/{customerId}/charges
GET /api/v1/customers/{customerId}/financial-summary
```

Before payment integration, the summary can report `totalPaid = 0`. After Plan 3, the same endpoint is extended to use payment allocations.

## 10. Frontend integration

Add to `src/api/financialService.ts`:

```ts
export async function getCustomerFinancialSummary(customerId: number) {
    // GET /api/v1/customers/{customerId}/financial-summary
}

export async function getCustomerCharges(customerId: number) {
    // GET /api/v1/customers/{customerId}/charges
}
```

The frontend must never create charges directly.

## 11. Database constraints

```text
charges.hostel_id NOT NULL
charges.customer_id NOT NULL
Only one SECURITY_DEPOSIT charge per customer + hostel
Only one MONTHLY_RENT charge per allocation + billing period
```

Use `NUMERIC(12,2)` for monetary columns.

## 12. Verification

- Register a customer with ₹5,000 rent and ₹2,000 deposit.
- Confirm exactly two charges are created.
- Confirm total charges = ₹7,000.
- Confirm the existing room allocation/occupancy implementation is still reused.
- Change the current room tariff later and confirm the existing allocation still uses its snapshot rent.
- Confirm duplicate charge constraints prevent duplicate security-deposit or monthly-rent charges.

## 13. Next plan

Plan 3 adds `payments` and `payment_allocations`, completes the Customer Stay transaction, replaces the old Customer Space allocation/payment calls with one Customer Stay submission, and builds the final customer financial page.