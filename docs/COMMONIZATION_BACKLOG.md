## Atithi implementation and incremental commonization guardrails

Treat the user’s immediate request as the primary task. Complete it first. This instruction is a secondary, bounded quality pass; it must not delay, redesign, or expand the requested feature.

### Repository structure

- Route-level screens belong in `src/pages/`.
- Shared, domain-independent UI belongs in `src/components/common/`.
- UI and flows specific to a business feature belong in `src/components/feature/`.
- Application shells belong in `src/components/layouts/`.
- Do not create a “common” component unless it has at least two concrete consumers now, or a second consumer is clearly part of the current request.

### Reuse rules

Before creating a component:

1. Search `src/components/common`, `src/components/feature`, and relevant pages for an existing equivalent.
2. Reuse or extend an existing component when it meets the need.
3. If two or more screens contain genuinely similar structure or behavior, extract one configurable common component and migrate those actual consumers in the same change.
4. Prefer a small, explicit API (`variant`, `tone`, `size`, `children`, render props, or `className`) over duplicated wrappers.
5. Do not over-generalize. Keep business rules, API calls, page state, and one-off workflows in feature or page files.

Examples of appropriate shared components include table shells, card shells, modal footers, filter bars, segmented filters, form fields, status badges, and repeated action-button patterns. A unique customer-registration workflow or a single chart should remain feature/page-specific unless a real second use exists.

### Future-theme readiness — do not implement themes now

Do not change existing colors, color values, Tailwind color configuration, `src/index.css`, or theme behavior as part of this work. Preserve the current visual appearance exactly.

For any new or refactored component:

- Do not introduce raw hex, RGB, HSL, or inline color values.
- Use existing project semantic `brand-*` utilities where they accurately fit.
- Keep visual variants centralized inside the reusable component instead of repeating color-bearing classes in each caller.
- Prefer semantic component APIs such as `variant="primary"`, `tone="success"`, or `appearance="surface"` over APIs named after colors.
- Keep neutral surfaces, text, borders, actions, focus states, status states, hover states, and disabled states structurally separate. This allows a future token/theme migration without changing every caller.
- Do not use CSS inversion, blanket dark-mode classes, global overrides of utilities such as `bg-white`, or any workaround intended to simulate theming.

### Secondary commonization pass

After completing and verifying the user’s requested work, inspect `docs/COMMONIZATION_BACKLOG.md`.

- Select at most one backlog item per task, unless the user explicitly requested a refactor.
- Refactor only when there is clear duplicate UI/behavior and the change can be safely verified.
- Do not perform a broad rewrite, move unrelated code, alter behavior, alter copy, alter colors, or change data/API logic.
- If the selected item is not safe or does not contain real duplication, leave it pending and record why.
- Do not create a generic component just because two files both contain buttons, forms, cards, or tables. Extract only the shared structure and behavior.

A backlog item is complete only when:

1. A shared component is created or an existing shared component is improved.
2. At least two concrete consumers use it, unless it was created specifically for the user’s current requested feature and is clearly reusable.
3. The duplicated implementation has been removed from those consumers.
4. Visual output and behavior are preserved.
5. Relevant build, type-check, lint, or targeted checks have been run.

### Backlog maintenance

On the first task that uses this instruction, create `docs/COMMONIZATION_BACKLOG.md` using the initial queue below.

At the end of every task:

- Move only completed items from `Pending` to `Completed`; do not delete history.
- Add a one-line note naming the common component introduced or improved and the migrated consumers.
- Keep unfinished items in `Pending`.
- In the final response, separately state:
    - the primary task completed;
    - whether a secondary commonization item was completed;
    - the files changed and validation run;
    - or that no safe commonization was performed.

### Initial commonization backlog

#### Pending — high priority

1. `src/pages/DailyRooms.tsx`, `src/pages/Laundry.tsx`, `src/pages/Housekeeping.tsx`, and `src/pages/Massage.tsx`  
   Assess repeated metric grids, search/filter toolbars, status filters, table shells, row actions, and modal action footers. Reuse or carefully extend existing `StatisticsCard`, `SearchBar`, `DataTable`, `Modal`, and `StatusBadge` before creating anything new.

2. `src/pages/Rooms.tsx` with the pages above  
   Assess common filtering controls, modal form action areas, empty states, and status/legend treatment. Keep room-specific business logic in the Rooms feature.

3. `src/components/feature/Login.tsx`, `src/components/feature/Signup.tsx`, and `src/components/feature/VerifyOtp.tsx`  
   Assess shared authentication form layout, field presentation, validation messaging, and submit/cancel controls. Keep authentication-specific logic and route behavior feature-specific.

#### Pending — medium priority

5. `src/pages/Customers.tsx`  
   This is a large page. Do not rewrite it wholesale. Assess one bounded extraction at a time: customer filter toolbar, reusable wizard shell/stepper, or repeated modal action area. Preserve customer and Aadhaar workflow behavior.

6. `src/pages/GuestSelfRegistration.tsx` and `src/components/feature/CustomerRegistrationPersonalDetailsForm.tsx`  
   Assess reuse only where the data contract and validation behavior genuinely align. Do not force public registration and staff-facing customer workflows into one component.

7. `src/pages/Dashboard.tsx`  
   The KPI cards, section cards, and status badges already reuse `StatisticsCard`, `SectionCard`, and `StatusBadge`; do not refactor them again. Assess the recent-collections table only if `DataTable` can support it without making the generic table worse. Extract an analytics chart component only after a second real chart consumer exists.

#### Completed

- **Item 4**: Extracted shared `AccordionSectionCard` (`src/components/common/AccordionSectionCard.tsx`) providing responsive header bar, mobile badge tag wrapping, and collapsible shell; migrated `HostelDetailsSection.tsx`, `DailyPricingSection.tsx`, `SharingPricingSection.tsx`, and `RegistrationQrSection.tsx`.
- **Badge Component**: Extracted flexible, theme-ready `Badge` (`src/components/common/Badge.tsx`) supporting multiple sizes (`xs` through `xl`), semantic tones (`success`, `danger`, `warning`, `info`, `teal`, etc.), custom icons, and pulsing live dots; migrated `StatusBadge.tsx`, `RoomDetailsDrawer.tsx`, `HostelDetailsSection.tsx`, `DailyPricingSection.tsx`, `SharingPricingSection.tsx`, and `Dashboard.tsx`.
- **ToggleSwitch Component**: Extracted accessible, reusable `ToggleSwitch` (`src/components/common/ToggleSwitch.tsx`) supporting `default` (form/settings) and `stateful` (housekeeping condition/cleanliness with indicator dot) variants; migrated `RegistrationQrSection.tsx` and `RoomDetailsDrawer.tsx`.
