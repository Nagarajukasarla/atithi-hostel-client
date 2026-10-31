Implementation plan — Monthly Rent Charge Job
1. Add a scheduled Spring Boot job
Create:
MonthlyRentChargeJob

Responsibilities:
- Run once every 24 hours.
- Find active customer allocations.
- Check each allocation's billing_anchor_date.
- Determine whether another billing period has completed.
- If yes, create the next MONTHLY_RENT charge.
- If not, do nothing.
- Never create a duplicate charge for the same allocation + billing period.
Example:
@Component
@RequiredArgsConstructor
public class MonthlyRentChargeJob {

    private final MonthlyRentChargeService monthlyRentChargeService;

    @Scheduled(fixedRate = 24 * 60 * 60 * 1000)
    public void generateMonthlyRentCharges() {
        monthlyRentChargeService.generateDueCharges();
    }
}

You can later change the schedule to a fixed daily time instead of fixedRate.
2. Create a service specifically for this job
MonthlyRentChargeService

public interface MonthlyRentChargeService {

    void generateDueCharges();
}

Implementation:
@Service
@RequiredArgsConstructor
public class MonthlyRentChargeServiceImpl
        implements MonthlyRentChargeService {

    private final AllocationFinancialTermsRepository financialTermsRepository;
    private final ChargeRepository chargeRepository;

    @Override
    @Transactional
    public void generateDueCharges() {

        // 1. Get active allocation financial terms

        // 2. For each allocation:
        //    - calculate the current billing period
        //    - check whether the period is due
        //    - check whether charge already exists
        //    - create MONTHLY_RENT charge if required
    }
}

3. Repository method to get active financial terms
You already have allocation_financial_terms.
Add something similar to:
List<AllocationFinancialTerms> findAllActiveTerms();

or, preferably, fetch only currently active allocations.
For example:
@Query("""
    SELECT aft
    FROM AllocationFinancialTerms aft
    WHERE aft.active = true
""")
List<AllocationFinancialTerms> findAllActiveTerms();

Use whatever existing active/allocation relationship your project already has rather than introducing duplicate logic.
4. Determine whether rent is due
For every financial term:
billing_anchor_date = 27-Sep-2026
monthly_rent = ₹7,000

The job checks today's date.
Example
On:
27-Oct-2026

one billing cycle has completed.
Therefore:
Create November rent charge
₹7,000

But on:
15-Oct-2026

the cycle hasn't completed.
Therefore:
DO NOTHING

This is the important rule:
The job runs every day, but a charge is created only when the customer's next billing period is due.

5. Prevent duplicate charges
This is essential because the job runs every day.
Add a repository method such as:
boolean existsByAllocationIdAndChargeTypeAndPeriodStartAndPeriodEnd(
        Long allocationId,
        ChargeType chargeType,
        LocalDate periodStart,
        LocalDate periodEnd
);

Then:
if (!chargeRepository.existsByAllocationIdAndChargeTypeAndPeriodStartAndPeriodEnd(
        allocationId,
        ChargeType.MONTHLY_RENT,
        periodStart,
        periodEnd)) {

    // create charge
}

So even if the server/job runs twice on the same day:
27-Oct
    ↓
Charge exists?
    ↓
YES
    ↓
Do nothing

No duplicate rent.
6. Charge creation
Once the period is due:
Charge charge = new Charge();

charge.setHostelId(financialTerms.getHostelId());
charge.setCustomerId(financialTerms.getCustomerId());
charge.setAllocationId(financialTerms.getAllocationId());

charge.setChargeType(ChargeType.MONTHLY_RENT);
charge.setAmount(financialTerms.getMonthlyRent());

charge.setPeriodStart(periodStart);
charge.setPeriodEnd(periodEnd);

charge.setDueDate(periodStart);

charge.setStatus(ChargeStatus.OPEN);

chargeRepository.save(charge);

The exact field names should match your existing entity.
7. The billing-period calculation
This is the only slightly important piece.
If:
billing_anchor_date = 27-Sep-2026

then:
27-Sep → 26-Oct
27-Oct → 26-Nov
27-Nov → 26-Dec

So the service needs a small helper:
private BillingPeriod calculateCurrentBillingPeriod(
        LocalDate billingAnchorDate,
        LocalDate today) {

    // Calculate the billing period that should currently be charged.

    // Return:
    // periodStart
    // periodEnd
}

You can also have:
private boolean isBillingPeriodDue(...) {
    // return true only when the next billing period has started
}

Keep this calculation isolated rather than putting date logic inside the scheduler.
8. Recommended flow
The complete implementation is only:
Spring Boot starts
       ↓
@Scheduled runs every 24 hours
       ↓
MonthlyRentChargeJob
       ↓
MonthlyRentChargeService
       ↓
Get active allocation financial terms
       ↓
For each customer
       ↓
Has billing cycle completed?
       │
       ├── NO → nothing
       │
       └── YES
             ↓
       Does charge already exist?
             │
             ├── YES → nothing
             │
             └── NO
                   ↓
             Create MONTHLY_RENT charge
                   ↓
                 SAVE

Files/classes to add
service/
    MonthlyRentChargeService.java
    MonthlyRentChargeServiceImpl.java

scheduler/
    MonthlyRentChargeJob.java

repository/
    AllocationFinancialTermsRepository.java
        → findAllActiveTerms()

    ChargeRepository.java
        → existsByAllocationIdAndChargeTypeAndPeriodStartAndPeriodEnd(...)

You do not need to modify:
- payment logic
- payment allocation
- customer financial summary
- outstanding balance calculation
- frontend
- payment gateway
- room tariff logic
The existing UI can continue calling the financial-summary API, and because that API already derives the balance from the charges/payment allocations, the newly generated monthly charge will automatically appear in the outstanding amount.


Charges table data see how notes filed is there, we can see the cycle period with dates right ?
```
atithi_aavas=# select * from charges;
-[ RECORD 1 ]-+-------------------------------------------------
id            | 1
created_at    | 2026-09-27 22:32:17.783214+05:30
updated_at    | 2026-09-27 22:32:17.893404+05:30
amount        | 2000.00
charge_type   | SECURITY_DEPOSIT
due_date      | 2026-09-27
notes         | Security deposit required upon room registration
period_end    |
period_start  |
status        | PAID
allocation_id | 3
customer_id   | 4
hostel_id     | 7
-[ RECORD 2 ]-+-------------------------------------------------
id            | 2
created_at    | 2026-09-27 22:32:17.806798+05:30
updated_at    | 2026-09-27 22:32:17.893404+05:30
amount        | 7500.00
charge_type   | MONTHLY_RENT
due_date      | 2026-09-27
notes         | Monthly rent for period 2026-09-27 to 2026-10-26
period_end    | 2026-10-26
period_start  | 2026-09-27
status        | PARTIAL
allocation_id | 3
customer_id   | 4
hostel_id     | 7
-[ RECORD 3 ]-+-------------------------------------------------
id            | 3
created_at    | 2026-09-28 00:15:43.360295+05:30
updated_at    | 2026-09-28 00:15:43.466089+05:30
amount        | 2000.00
charge_type   | SECURITY_DEPOSIT
due_date      | 2026-09-27
notes         | Security deposit required upon room registration
period_end    |
period_start  |
status        | PAID
allocation_id | 4
customer_id   | 5
hostel_id     | 7
-[ RECORD 4 ]-+-------------------------------------------------
id            | 4
created_at    | 2026-09-28 00:15:43.38262+05:30
updated_at    | 2026-09-28 01:31:34.593457+05:30
amount        | 7500.00
charge_type   | MONTHLY_RENT
due_date      | 2026-09-27
notes         | Monthly rent for period 2026-09-27 to 2026-10-26
period_end    | 2026-10-26
period_start  | 2026-09-27
status        | PAID
allocation_id | 4
customer_id   | 5
hostel_id     | 7
```