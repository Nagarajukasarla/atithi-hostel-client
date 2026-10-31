# Atithi — Daily Based Rooms Implementation Plan

## 1. Objective

Implement **daily-based room stays** in Atithi while reusing the existing customer, room allocation, financial terms, charges, payments, and payment allocation infrastructure.

A daily-based customer is charged according to an agreed **daily rate**, rather than a monthly rent.

The implementation must be incremental, robust, reusable, and consistent with the existing project guidelines.

---

## 2. Core Design Decision

Do **not** create a separate financial system for daily customers.

Reuse:

- `customers`
- `room_types`
- `rooms`
- `room_allocations`
- `room_tariffs`
- `allocation_financial_terms`
- `charges`
- `payments`
- `payment_allocations`
- existing customer financial summary
- existing room allocation services
- existing payment services

Do **not** create separate tables such as:

- `daily_customers`
- `daily_charges`
- `daily_payments`

The existing financial architecture should support both monthly and daily customers.

---

## 3. Existing Components vs Required Changes

| Existing area | Daily stay requirement | Action |
|---|---|---|
| `customers` | Same customer model | Reuse |
| Customer registration UI | Same personal-details form | Reuse with conditional validation |
| `room_types` | Same room type | Reuse |
| `rooms` | Same physical room/bed | Reuse |
| `room_allocations` | Same allocation concept | Reuse |
| `room_tariffs` | Standard daily price required | Extend |
| `allocation_financial_terms` | Customer's agreed daily price | Extend |
| `charges` | Daily rent dues | Reuse |
| `payments` | Actual money received | Reuse |
| `payment_allocations` | Payment-to-charge relationship | Reuse |
| Customer financial summary | Show daily rate and balance | Extend only where required |
| Existing monthly rent job | Daily charge generation too | Generalize |

---

## 4. Customer Identification / Registration

### 4.1 Existing Customer Table

Current customer fields include:

- `aadhaar_number`
- `emergency_contact_name`
- `emergency_contact_phone`
- `occupation`
- `permanent_address`

These fields are currently `NOT NULL`.

For daily-based customer registration, the receptionist should be allowed to register a customer with incomplete information when the customer explicitly agrees to provide the missing information later.

### 4.2 Database Changes

Make these fields nullable:

```text
aadhaar_number
emergency_contact_name
emergency_contact_phone
occupation
permanent_address
```

Do **not** remove the Aadhaar uniqueness constraint.

If Aadhaar is supplied, it should remain unique.

PostgreSQL allows multiple `NULL` values under a normal unique constraint, which is appropriate for this use case.

### 4.3 Frontend Reuse

Reuse the existing customer personal-details form.

For a daily-based customer, provide a checkbox such as:

```text
☐ I agree to provide the missing details later
```

When selected, these can become optional:

```text
Aadhaar
Emergency Contact Name
Emergency Contact Phone
Occupation
Permanent Address
```

When it is not selected, the existing required validation remains.

Do not create a completely separate customer registration component.

---

## 5. Room Tariffs

`room_tariffs` remains a hostel-level configuration.

It defines the standard price for a particular room type.

Existing concept:

```text
Room Type
    ↓
Room Tariff
    ├── Monthly Rent
    └── Security Deposit
```

Extend it to:

```text
Room Type
    ↓
Room Tariff
    ├── Monthly Rent
    ├── Daily Rate
    └── Security Deposit
```

### 5.1 New Field

Add:

```text
daily_rate NUMERIC(12,2)
```

Example:

```text
Room Type: 4 Sharing
Monthly Rent: ₹7,000
Daily Rate: ₹300
Security Deposit: ₹2,000
```

The daily rate is the standard/default rate.

The receptionist may negotiate it for an individual customer.

---

## 6. Allocation Financial Terms

`allocation_financial_terms` stores the financial agreement for a particular customer allocation.

It should support both monthly and daily billing.

### 6.1 New Fields

Add:

```text
billing_mode
daily_rate
```

Example for monthly customer:

```text
billing_mode = MONTHLY
monthly_rent = ₹7,000
daily_rate = NULL
```

Example for daily customer:

```text
billing_mode = DAILY
daily_rate = ₹300
monthly_rent = NULL
security_deposit_required = ₹2,000
```

The final `daily_rate` is the customer-specific agreed rate.

The UI may prefill it from:

```text
room_tariffs.daily_rate
```

but the receptionist can negotiate/change it.

The negotiated value must be stored in:

```text
allocation_financial_terms.daily_rate
```

Do not use `room_tariffs.daily_rate` as the customer's final agreed price after allocation.

---

## 7. Room Allocation

Reuse the existing `room_allocations` implementation and service.

For a daily customer:

```text
from_date = required
to_date   = optional
```

Example:

```text
From Date: 28-Sep-2026
To Date:   NULL
```

means the customer is currently staying without a planned checkout date.

Example:

```text
From Date: 28-Sep-2026
To Date:   05-Oct-2026
```

means there is a planned stay period.

Do not create a separate daily allocation table.

Use the existing room allocation service and existing room occupancy logic.

---

## 8. Daily Pricing Flow

When the receptionist selects:

```text
Billing Type = DAILY
```

the UI should fetch/populate the standard daily rate from the applicable room tariff.

Example:

```text
Room Type: 4 Sharing
Standard Daily Rate: ₹300
```

The receptionist may change it:

```text
Agreed Daily Rate: ₹275
```

The final value goes into:

```text
allocation_financial_terms.daily_rate
```

---

## 9. Charges

Reuse the existing `charges` table.

Add/use a charge type:

```text
DAILY_RENT
```

A daily rent charge represents:

> The amount the customer owes for one particular day.

### 9.1 Recommended Daily Charge Model

Create **one charge record per day**.

Do not create one large combined charge for an entire multi-day stay.

Example:

```text
28-Sep   ₹300
29-Sep   ₹300
30-Sep   ₹300
01-Oct   ₹300
02-Oct   ₹300
03-Oct   ₹300
04-Oct   ₹300
05-Oct   ₹300
```

This makes it possible to determine exactly which day has been paid, partially paid, or remains unpaid.

### 9.2 Why One Charge Per Day

A combined charge such as:

```text
28-Sep → 05-Oct
8 days × ₹300
Total = ₹2,400
```

would make individual day-level payment tracking difficult.

With daily charges, the UI can show:

```text
28-Sep  PAID
29-Sep  PAID
30-Sep  PAID
01-Oct  PAID
02-Oct  PARTIAL
03-Oct  OPEN
04-Oct  OPEN
05-Oct  OPEN
```

The total can still be displayed as:

```text
8 days × ₹300 = ₹2,400
```

by aggregating the individual charges.

---

## 10. Daily Stay Scenario 1 — Open-Ended Stay

Example:

```text
Customer: Ram
Billing Mode: DAILY
Daily Rate: ₹300

From Date: 28-Sep-2026
To Date: NULL
```

On 28-Sep:

```text
DAILY_RENT
₹300
period_start = 28-Sep
period_end   = 28-Sep
```

Customer pays ₹300.

On 29-Sep, the scheduled job checks the allocation.

Because the customer is still actively allocated and the next day is due:

```text
DAILY_RENT
₹300
period_start = 29-Sep
period_end   = 29-Sep
```

On 30-Sep:

```text
DAILY_RENT
₹300
period_start = 30-Sep
period_end   = 30-Sep
```

This continues while the allocation remains active.

---

## 11. Daily Stay Scenario 2 — Planned Checkout

Example:

```text
Customer: Ram
Daily Rate: ₹300

From: 28-Sep-2026
To:   05-Oct-2026
```

Expected daily charges:

```text
28-Sep   ₹300
29-Sep   ₹300
30-Sep   ₹300
01-Oct   ₹300
02-Oct   ₹300
03-Oct   ₹300
04-Oct   ₹300
05-Oct   ₹300
```

Total:

```text
8 × ₹300 = ₹2,400
```

Do not create a single ₹2,400 charge.

Create one charge for each day.

---

## 12. Stay Extension

If a customer initially has:

```text
From: 28-Sep
To:   05-Oct
```

and later requests an extension to 08-Oct:

```text
To Date = 08-Oct
```

the existing allocation continues.

The system then creates:

```text
06-Oct   ₹300
07-Oct   ₹300
08-Oct   ₹300
```

No new allocation is required merely because the stay was extended.

---

## 13. Important Rule About `to_date`

`to_date` should control the allowed planned charging period, but it should not by itself be treated as the authoritative checkout operation.

The scheduler should ultimately verify:

```text
allocation is active
AND
charge date is within the allowed stay period
```

The actual room allocation/check-out state remains authoritative for whether the customer is still occupying the room.

---

## 14. Rent Charge Generation Job

The existing monthly rent job should be generalized rather than creating a completely independent daily job.

Recommended name:

```text
RentChargeGenerationJob
```

or:

```text
RecurringChargeJob
```

Recommended choice:

```text
RentChargeGenerationJob
```

The job should run once every 24 hours.

Example:

```java
@Component
@RequiredArgsConstructor
public class RentChargeGenerationJob {

    private final RentChargeService rentChargeService;

    @Scheduled(fixedRate = 24 * 60 * 60 * 1000)
    public void generateRentCharges() {
        rentChargeService.generateDueCharges();
    }
}
```

The exact scheduling approach can follow the project's existing scheduling configuration.

---

## 15. Rent Charge Service

Create/generalize:

```text
RentChargeService
RentChargeServiceImpl
```

Example:

```java
public interface RentChargeService {

    void generateDueCharges();
}
```

Implementation structure:

```java
@Service
@RequiredArgsConstructor
public class RentChargeServiceImpl implements RentChargeService {

    @Override
    @Transactional
    public void generateDueCharges() {

        // Generate monthly charges
        generateMonthlyCharges();

        // Generate daily charges
        generateDailyCharges();
    }
}
```

Keep monthly and daily logic separated internally so that the scheduler remains simple.

---

## 16. Daily Charge Generation Logic

Implement:

```java
private void generateDailyCharges() {

    List<AllocationFinancialTerms> dailyAllocations =
            financialTermsRepository.findActiveDailyAllocations();

    for (AllocationFinancialTerms terms : dailyAllocations) {

        // Determine next chargeable day

        // Check active allocation

        // Check optional to_date

        // Check whether the day is due

        // Check whether DAILY_RENT charge already exists

        // Create charge if required
    }
}
```

Core rules:

1. Allocation must be active.
2. Billing mode must be `DAILY`.
3. The next chargeable day must have become due.
4. If `to_date` exists, the charge date must not exceed it.
5. If `to_date` is `NULL`, the daily charge may continue while the allocation remains active.
6. Do not create duplicate charges.
7. Use `allocation_financial_terms.daily_rate`.
8. Create `DAILY_RENT` charge.
9. Save the charge transactionally.

---

## 17. Daily Charge Repository Methods

Add a method to obtain active daily financial terms.

Example:

```java
List<AllocationFinancialTerms>
findActiveDailyAllocations();
```

Add a duplicate check:

```java
boolean existsByAllocationIdAndChargeTypeAndPeriodStart(
    Long allocationId,
    ChargeType chargeType,
    LocalDate periodStart
);
```

For a daily charge:

```text
allocation_id = 500
charge_type = DAILY_RENT
period_start = 2026-09-29
```

should identify one unique daily charge.

---

## 18. Database-Level Duplicate Protection

Application-level duplicate checking is not enough.

Add a database uniqueness constraint/index appropriate to the existing schema.

Conceptually:

```text
UNIQUE(
    allocation_id,
    charge_type,
    period_start
)
```

This protects against duplicate daily charges if:

- the scheduler runs twice;
- two application instances run concurrently;
- a retry occurs;
- a server restart causes another execution.

The exact migration should follow the project's existing migration/database conventions.

---

## 19. Daily Charge Entity

Reuse the existing `Charge` entity.

Example values:

```text
customer_id    = 100
allocation_id  = 500
charge_type    = DAILY_RENT
amount         = 300.00
period_start   = 2026-09-29
period_end     = 2026-09-29
due_date       = 2026-09-29
```

Do not introduce `DailyCharge`.

---

## 20. Payment Handling

No separate daily payment implementation is required.

Reuse:

```text
payments
payment_allocations
```

Example:

Customer owes:

```text
28-Sep DAILY_RENT = ₹300
29-Sep DAILY_RENT = ₹300
```

Customer pays:

```text
₹600
```

Existing payment allocation logic can allocate:

```text
₹300 → 28-Sep charge
₹300 → 29-Sep charge
```

The existing payment architecture remains unchanged.

---

## 21. Customer Balance

Do not introduce a daily-specific balance calculation.

The existing balance calculation remains:

```text
Total Charges
    -
Total Payment Allocations
    =
Outstanding Balance
```

Because daily rent is simply another `charges` record, the existing customer financial summary automatically includes it.

No separate daily balance table is required.

---

## 22. Customer UI — Daily Allocation

Reuse the existing room allocation/financial flow.

When billing type is selected:

```text
Billing Type

○ Monthly
● Daily
```

For Daily:

```text
Daily Rate: ₹300

From Date: 28-Sep-2026
To Date:   [optional]

Security Deposit: ₹2,000
```

The daily rate should initially come from the room tariff.

The receptionist can negotiate it before saving.

---

## 23. Customer Financial UI

For monthly customers, continue showing:

```text
Monthly Rent
Security Deposit
Total Charges
Total Paid
Outstanding Balance
```

For daily customers, show:

```text
Daily Rate
Security Deposit
Total Charges
Total Paid
Outstanding Balance
```

Also show daily charge history where useful:

```text
Date       Charge    Paid    Due
28-Sep     ₹300      ₹300    ₹0
29-Sep     ₹300      ₹300    ₹0
30-Sep     ₹300      ₹0      ₹300
```

The UI should consume the existing financial APIs rather than independently calculating the authoritative balance.

---

## 24. Required Database/Entity Changes Summary

### `customers`

Make nullable:

```text
aadhaar_number
emergency_contact_name
emergency_contact_phone
occupation
permanent_address
```

Keep Aadhaar uniqueness when a value is supplied.

### `room_tariffs`

Add:

```text
daily_rate NUMERIC(12,2)
```

### `allocation_financial_terms`

Add:

```text
billing_mode
daily_rate NUMERIC(12,2)
```

Use:

```text
MONTHLY
DAILY
```

for billing mode.

### `charges`

Reuse existing table.

Add/use:

```text
DAILY_RENT
```

as a charge type.

No new daily-charge table.

### `payments`

No structural change required for daily stays.

### `payment_allocations`

No structural change required for daily stays.

---

## 25. Implementation Order

### Step 1 — Database and Entities

Implement:

- nullable customer fields;
- `room_tariffs.daily_rate`;
- `allocation_financial_terms.billing_mode`;
- `allocation_financial_terms.daily_rate`;
- `DAILY_RENT` charge type;
- daily-charge uniqueness protection.

Do not modify the payment architecture.

### Step 2 — Backend Daily Allocation

Update existing allocation/financial-term services to support:

```text
billing_mode = DAILY
daily_rate
from_date
optional to_date
```

Reuse existing room allocation and room occupancy services.

### Step 3 — Customer Registration UI

Reuse the existing customer form.

Add:

```text
☐ I agree to provide the missing details later
```

Implement conditional validation.

### Step 4 — Daily Allocation UI

Reuse the existing allocation UI.

Add:

```text
Billing Type
Daily Rate
From Date
To Date (optional)
```

Prefill daily rate from `room_tariffs.daily_rate`.

Allow receptionist negotiation.

Save final rate into `allocation_financial_terms.daily_rate`.

### Step 5 — Generalize Existing Rent Job

Rename/generalize the current monthly-only scheduler into:

```text
RentChargeGenerationJob
```

The job runs every 24 hours.

It calls:

```text
RentChargeService.generateDueCharges()
```

which handles:

```text
MONTHLY
DAILY
```

### Step 6 — Implement Daily Charge Generation

Implement:

```text
generateDailyCharges()
```

Flow:

```text
Active allocation?
        ↓
Billing mode = DAILY?
        ↓
Next daily charge is due?
        ↓
to_date exists?
        │
        ├── Yes → charge date <= to_date
        │
        └── No  → continue while allocation is active
        ↓
Charge already exists?
        │
        ├── Yes → do nothing
        │
        └── No
             ↓
Create DAILY_RENT charge
             ↓
Save
```

---

## 26. Example End-to-End Flow

```text
Room Type
    ↓
Room Tariff
    Daily Rate = ₹300
    ↓
Customer Registration
    ↓
Room Allocation
    Billing Mode = DAILY
    From Date = 28-Sep
    To Date = NULL
    ↓
Allocation Financial Terms
    Daily Rate = ₹300
    ↓
RentChargeGenerationJob
    ↓
Runs every 24 hours
    ↓
Check active daily allocations
    ↓
Determine next chargeable day
    ↓
Check duplicate
    ↓
Create DAILY_RENT charge
    ↓
Payment
    ↓
Payment Allocation
    ↓
Existing Customer Balance API
    ↓
Customer Financial UI
```

---

## 27. Important Business Rules

1. Daily customers use the existing customer model.
2. Daily customers use the existing room allocation model.
3. Daily customers use the existing payment model.
4. Daily customers use the existing payment allocation model.
5. `room_tariffs.daily_rate` is the standard/default price.
6. `allocation_financial_terms.daily_rate` is the customer's final agreed price.
7. Daily rent is represented by `DAILY_RENT` charges.
8. Create one daily rent charge per day.
9. Do not create a single combined charge for a multi-day stay.
10. The scheduled job runs every 24 hours.
11. The job does not create a charge merely because it ran.
12. A charge is created only when the next daily billing period is due.
13. Never create a duplicate charge for the same allocation and day.
14. If `to_date` is specified, do not generate charges beyond it.
15. If `to_date` is `NULL`, continue generating daily charges while the allocation remains active.
16. Actual checkout/allocation status remains authoritative for occupancy.
17. The existing balance calculation must remain the source of truth.
18. Do not store a separate daily balance.
19. Do not create daily-specific payment tables.
20. Follow existing project conventions for entities, repositories, services, controllers, validation, transactions, migrations, logging, and reusable code.
21. Keep the implementation incremental and avoid duplicating existing business logic.
22. Use `BigDecimal`/`NUMERIC(12,2)` for monetary values.
23. The scheduled job must be idempotent.

---

## 28. Final Required Changes

```text
Database
├── customers                         → nullable selected details
├── room_tariffs                      → daily_rate
├── allocation_financial_terms        → billing_mode + daily_rate
└── charges                           → DAILY_RENT + duplicate protection

Backend
├── RentChargeGenerationJob
├── RentChargeService
├── daily charge generation logic
├── active daily allocation repository query
└── daily charge duplicate-check repository query

Frontend
├── existing customer form + conditional validation
├── existing allocation UI + DAILY mode
├── daily rate
├── from date
├── optional to date
└── existing financial/balance UI extended for daily mode

No new major tables
No new payment system
No new balance system
No separate daily customer system
```

This keeps daily-based stays as an extension of the existing Atithi architecture rather than creating a parallel implementation.
