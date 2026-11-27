# Bill-ihin implementation status

**Audit date:** 2026-11-14

**Method:** Inspected the tracked source, routes, schema, package manifests, UI archive, and current tests. A file, screen, or button alone was not counted as proof of a working feature. No MySQL-backed or browser end-to-end testing was available.

## Module assessment

Status definitions: **Complete and tested** means the module's expected end-to-end behavior was exercised; **Implemented but not tested** means relevant code exists but integration behavior was not verified; **Partially implemented** means material functionality or requirements are missing; **Not implemented** means no meaningful implementation was found; **Implemented with errors** means observed behavior is broken. No module qualifies as complete and tested because there are no live database/API/browser tests.

| Module | Status | Evidence and remaining gap |
|---|---|---|
| Authentication and registration | **Implemented but not tested** | `backend/routes/auth.js` supports household creation/administrator registration, invite-code registration, login/logout, session restoration, profile and password changes. Password hashes use bcrypt; session JWTs are HTTP-only cookies. No live auth flow or cookie/CORS check was run. Session restore in `frontend/src/context/AppContext.jsx` treats every `/auth/me` or household-data failure as a cleared session, including server/database outages. |
| Household management | **Partially implemented** | Signup creates a household; `GET /api/household/data` loads it; `PUT /api/household` updates household/settings. There is no household deletion, distinct household detail/list API, or full CRUD lifecycle. The aggregate data endpoint's audience and payload need tightening (see access findings). |
| Administrator/member permissions | **Partially implemented** | React route guards and server `authenticate`/`requireAdmin` middleware exist; registration does not accept a client-selected role. However, the generally available household data endpoint returns all members' email/phone/contact fields and all household records to members as well as administrators. Several member-facing routes can display household-wide data. This requires an explicit least-privilege decision and authorization tests. |
| Bills and expenses | **Partially implemented** | Administrator bill create/update/delete is implemented and bills are loaded from MySQL. There is no distinct general expense entity/API; “Bills & Expenses” currently means bills. Bills with contribution/payment history cannot be deleted, intentionally retaining financial history. |
| Budget management | **Implemented but not tested** | Monthly category allocations have create/update/delete routes and are loaded into dashboards/reports. No database/API behavior has been exercised. |
| Expense categories | **Implemented but not tested** | Administrator CRUD and household-scoped category checks exist. `billihin_categories.monthly_allocation` duplicates monthly category allocations represented by `billihin_budgets`; reports use the latter, so the intended source of truth should be clarified. |
| Flexible member contributions | **Implemented but not tested** | Submission/edit/delete rules, evidence-note setting, optional equal-share enforcement, and pending/confirmed/rejected states are implemented. The finance helper tests verify calculations, not contribution API behavior. The equal-share mode uses the count of active household users (including administrators). |
| Contribution verification | **Implemented but not tested** | Administrator-only verify/reject routes enforce pending-only transitions, record reviewer/date/reason, create activity, and notify the member. No route/transaction behavior has been exercised against MySQL. |
| Bill assignments | **Implemented but not tested** | Administrator create/update/delete routes validate active household members and household bills; unique bill/member assignments are represented in the schema. No live API check was run. |
| Actual bill payment tracking | **Implemented but not tested** | Administrator payment CRUD records provider payment date, method, receipt reference, payer, and amount. Route logic locks the bill and prevents recorded payments exceeding the bill amount. This was not exercised against a database. |
| Payment reconciliation | **Partially implemented** | `frontend/src/utils/finance.js` computes confirmed contribution funding independently from actual provider payments; bill balance and payment status derive only from provider payments. API payment writes cap totals at the bill amount. There is no ledger/allocation that shows which collected funds funded which provider disbursement, nor a reconciliation workflow against a bank/cash balance. Existing finance unit tests cover the separation, not the database workflow. |
| Dashboard | **Implemented but not tested** | Separate admin/member dashboards calculate summaries from household API data and display contributions, budgets, bills, assignments, payments, and activities. Calculations run client-side; no dashboard API or live data/browser test exists. |
| Reports and analytics | **Implemented but not tested** | Report tabs, date-period filtering, client-side comparisons and CSV export are implemented over fetched records. No server report endpoint or browser/export test exists. The annualized estimate extrapolates recent six-month bill totals and should be presented as an estimate, not a recorded annual total. |
| Notifications | **Partially implemented** | Notification read/delete routes and client interactions exist. Automatic notifications cover contribution submission and verify/reject decisions; the audit found no bill due-date/reminder, assignment, or provider-payment event notifications. |
| Profile and settings | **Partially implemented** | Profile and password endpoints plus household/settings update UI exist. Profile persistence and password change are untested. The settings invite “Regenerate” button constructs its code with `Math.random()` in the browser rather than a cryptographically secure server operation. `SettingsPage.jsx` also displays a fallback ₱85,000 target when the saved target is zero, so a valid zero value can appear as an invented value in the form. |

## Existing structure and dependencies

- `frontend/`: React 19, Vite, React Router, Axios, Tailwind CSS, and Lucide icons. Pages are under `src/pages`; reusable UI, layout and form modals are under `src/components`; shared state/API access lives in `src/context/AppContext.jsx` and `src/services/api.js`.
- `backend/`: Express 5, `mysql2/promise`, bcrypt, JWT, dotenv, and CORS. Entry point is `server.js`; database configuration/schema/migration are under `config/` and `database/`; middleware is under `middleware/`; routers are under `routes/`.
- The existing NovaMart `products` and `orders` backend routes remain. Product/order frontend screens and cart state remain as files but are not reachable from the active Bill-ihin router.
- `backend/.env.example` and `frontend/.env.example` describe local settings. No actual environment files were present during the audit.
- `README.md` documents the current setup, but it does not replace a canonical business specification.

## Database schema

`backend/database/schema.sql` defines ten `billihin_` tables:

1. `billihin_households`
2. `billihin_users`
3. `billihin_categories`
4. `billihin_budgets`
5. `billihin_bills`
6. `billihin_contributions`
7. `billihin_assignments`
8. `billihin_payments`
9. `billihin_notifications`
10. `billihin_activities`

Foreign keys connect users/categories/budgets/bills/contributions/assignments/payments/notifications/activities to households and their related records. Contribution reviewers reference users; notifications reference the recipient. The schema stores contribution status separately from provider-payment records. Most related household ownership checks are performed in route code; the schema does not use composite foreign keys to enforce that every related row shares the same household. The migration is a simple `CREATE TABLE IF NOT EXISTS` runner and has not been applied to a live MySQL server.

## API inventory

All Bill-ihin routers are mounted under `/api` from `backend/server.js`. Read access is primarily through one authenticated aggregate endpoint rather than resource GET endpoints.

| Route | Existing operations |
|---|---|
| `/api/health` | `GET` database connectivity check |
| `/api/auth` | `POST /register`, `/login`, `/logout`; `GET /me`; `PATCH /profile`, `/password` |
| `/api/household` | `GET /data`; `PUT /` |
| `/api/members` | `POST /`; `PATCH /:id`; `DELETE /:id` (soft-deactivates) |
| `/api/categories` | `POST /`; `PATCH /:id`; `DELETE /:id` |
| `/api/bills` | `POST /`; `PATCH /:id`; `DELETE /:id` |
| `/api/budgets` | `POST /`; `PATCH /:id`; `DELETE /:id` |
| `/api/contributions` | `POST /`; `PATCH /:id`; `POST /:id/verify`, `POST /:id/reject`; `DELETE /:id` |
| `/api/assignments` | `POST /`; `PATCH /:id`; `DELETE /:id` |
| `/api/payments` | `POST /`; `PATCH /:id`; `DELETE /:id` |
| `/api/notifications` | `PATCH /read-all`, `PATCH /:id/read`; `DELETE /:id` |
| `/api/products` | Existing NovaMart `GET /` and `GET /:id` |
| `/api/orders` | Existing NovaMart administrator `GET /admin` |

For Bill-ihin records, there are no separate resource `GET /`, `GET /:id`, or paginated/search list APIs for bills, budgets, categories, contributions, assignments, payments, and members. The aggregate `/household/data` query supplies these records. There is no separate household-expense or payment-to-contribution allocation API.

## Frontend routing and data behavior

- `frontend/src/App.jsx` defines guest routes for `/login` and `/register`, protected `/dashboard`, `/household`, `/bills`, `/bills/:billId`, `/contributions`, `/contributions/:contributionId`, `/assignments`, `/notifications`, `/profile`, and administrator-only `/budgets`, `/payments`, `/members`, `/categories`, `/reports`, `/settings`.
- Sidebar links are filtered by role; route protection also exists client-side. Mutating API routes check administrator permissions server-side where appropriate.
- The generated Bill-ihin pages/modals call actions in `AppContext`, which call the Axios service. The production pages do not import the archived mock-data file; dashboards/reports consume `/api/household/data` results.
- Responsive layouts use mobile navigation drawers, responsive grids, and horizontally scrollable tables. This is source-level evidence only; no viewport or keyboard/accessibility browser check was performed.
- Commerce routes/components are retained but are not included in the Bill-ihin router. Decide whether this is an intended product integration boundary.

## Access, data integrity, and duplication findings

- **Data minimization:** `GET /api/household/data` requires authentication but no administrator gate. Its response includes the household invite code, all members' email and phone fields, and all household contributions, assignments, payments, and activities. Review what members need, then make the response role-aware/minimal and test it.
- **Registration flow:** the first account can create a household administrator; invite-code joiners become members. This is deliberate code behavior, not verified against a separate supplied spec.
- **Financial separation:** pending and rejected contributions do not enter confirmed contribution totals; confirmed contributions feed collected/funding figures only; bill paid balance/status uses `billihin_payments`. Tests validate helper-level arithmetic. No automatic transfer or implicit payment is created from contribution verification.
- **Repeated budget concepts:** household monthly target, category `monthly_allocation`, and monthly `billihin_budgets.allocated_amount` overlap. The dashboards use monthly budget rows, while settings/category editing also persists the other allocation values.
- **Error visibility:** most API errors are surfaced through HTTP responses/toasts. Session restoration currently catches any error and clears the local user without distinguishing a stale login from a temporary API/database failure.
- **Test gap:** there are no API authorization, database migration, CRUD, browser, or responsive-layout tests in the repository.

