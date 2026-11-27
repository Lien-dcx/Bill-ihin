# Bill-ihin multi-agent handover

**Purpose:** Proposed next-phase assignments based on the audit. These are plans only; no agents have been started and no application features were implemented during the audit.

## Shared baseline and contracts

- Frontend: React/Vite; API client in `frontend/src/services/api.js`; shared state and endpoint calls in `frontend/src/context/AppContext.jsx`; page calculations in `frontend/src/utils/finance.js`.
- Backend: Express 5, async route handlers, `mysql2/promise` pool (`backend/config/db.js`), auth/role middleware (`backend/middleware/auth.js`), validation helpers (`backend/utils/validation.js`).
- Primary read contract: authenticated `GET /api/household/data` currently returns `{ household, settings, members, categories, budgets, bills, contributions, assignments, payments, notifications, activities }`. Preserve required UI fields or coordinate a deliberate contract change before editing consumers.
- Existing financial contract: contributions transition `Pending` → `Confirmed` or `Rejected`; only verified contributions count as collected/funding; provider payments are separate rows and determine paid balance/status. Never make verification create a provider payment.
- Before database-dependent work, provision an isolated test database and validate `backend/database/migrate.js`. Do not use production records.

## Proposed parallel assignments

### Agent A — Household data scope and authorization

- **Responsibility:** Review and tighten the authenticated household read payload and prove role/household boundaries.
- **Owns:** `backend/routes/household.js`, new `backend/test/household-access.integration.test.js`.
- **Must not modify:** `backend/database/schema.sql`, `backend/routes/auth.js`, financial routers, `frontend/src/context/AppContext.jsx`, or dashboard/report files. Coordinate any changed response fields before changing the contract.
- **Dependencies:** Existing `authenticate` middleware, `req.user.householdId`/role, current `/api/household/data` response contract, isolated MySQL fixture.
- **API contract:** Keep `GET /api/household/data` as the frontend bootstrap endpoint unless a replacement is agreed. Return only documented fields needed for each role; preserve field names/types used by the app. Do not expose invite codes or contact fields to roles that do not need them.
- **Deliverables:** Role-aware response design, minimal code change, tests for admin/member data visibility, unauthenticated access, and cross-household isolation; update no audit documents owned by this audit.
- **Testing:** Run the new integration tests against disposable MySQL plus `npm test --prefix backend`; verify existing consumers' field needs with Agent C/D before landing.

### Agent B — Contribution/payment transaction verification

- **Responsibility:** Test and correct contribution state transitions and provider-payment invariants at the API/database boundary.
- **Owns:** `backend/routes/contributions.js`, `backend/routes/payments.js`, new `backend/test/financial-flows.integration.test.js`.
- **Must not modify:** `backend/database/schema.sql`, auth/household/member/category/bill routers, `frontend/src/utils/finance.js`, or frontend pages/context. Escalate any schema/business-rule changes for a separate decision.
- **Dependencies:** Existing session/admin middleware, current contribution and payment request/response shapes, validated MySQL schema, business-owner confirmation of equal-share and reconciliation rules.
- **API contract:** Preserve `POST/PATCH/DELETE /api/contributions`, admin `POST /:id/verify` and `/reject`; preserve payment `POST/PATCH/DELETE /api/payments`. Keep rejected/confirmed history and ensure contributions never implicitly count as provider payments.
- **Deliverables:** Route-level transaction tests for pending-only review/edit, duplicate/equal-share behavior, own-record permissions, cross-household rejection, concurrent/over-limit payment attempts, and retained financial history; fix only failures in owned routes.
- **Testing:** Run the new integration tests and backend validation suite; include concurrent payment tests using separate DB connections.

### Agent C — Frontend CRUD/auth journey validation

- **Responsibility:** Verify that Bill-ihin forms, navigation, loading/errors, and API mutations work together in a browser; fix only frontend-owned issues.
- **Owns:** `frontend/src/App.jsx`, `frontend/src/context/AppContext.jsx`, `frontend/src/context/appContextStore.js`, `frontend/src/context/useApp.js`, `frontend/src/services/api.js`, `frontend/src/pages` except the dashboard/report files owned by Agent D, and `frontend/src/components/modals/**`.
- **Must not modify:** `frontend/src/pages/AdminDashboardPage.jsx`, `frontend/src/pages/MemberDashboardPage.jsx`, `frontend/src/pages/ReportsAnalyticsPage.jsx`, `frontend/src/utils/finance.js`, or any backend file. Coordinate API changes with Agents A/B rather than silently changing endpoint contracts.
- **Dependencies:** Working API/test database and stable current route contracts; use only test household data.
- **API contract:** Use the shared Axios client with credentials and current API methods in `AppContext`; surface server errors and preserve CRUD payloads. Treat data bootstrap failures distinctly from an invalid session.
- **Deliverables:** Browser evidence for register/join/login/logout, admin/member route access, modal validation and CRUD, profile/password/settings, notification actions, and mobile navigation; concise fixes to owned files only.
- **Testing:** Add or use the repository-approved browser-test setup after choosing it explicitly; run frontend build and lint scoped to owned files. Do not claim database/API integration is tested by a build.

### Agent D — Dashboard, reports, and finance calculations

- **Responsibility:** Verify summary definitions and report/dashboard calculations against agreed financial semantics and add focused calculation tests.
- **Owns:** `frontend/src/pages/AdminDashboardPage.jsx`, `frontend/src/pages/MemberDashboardPage.jsx`, `frontend/src/pages/ReportsAnalyticsPage.jsx`, `frontend/src/utils/finance.js`, `frontend/src/utils/finance.test.js`.
- **Must not modify:** `frontend/src/context/AppContext.jsx`, API client, other pages/components, or backend routes/schema. Coordinate any new data fields with Agent A/C.
- **Dependencies:** Stable `/api/household/data` field types and business definitions of budget, bill-period attribution, confirmed/collected contributions, provider-paid amounts, overdue balance, and annualized estimates.
- **API contract:** Consume the current household bootstrap arrays; do not assume there are server-side aggregate endpoints. Keep contributions and provider payments as separate inputs and outputs.
- **Deliverables:** Documented, tested metric definitions; edge-case tests for partial/overpaid/historical cases, timezone/month boundaries, and missing periods; accurately labeled CSV and projection values.
- **Testing:** Run `node --test src/utils/finance.test.js` from `frontend`, scoped ESLint, and browser validation against seeded data. Never assert live correctness based solely on unit tests.

## Sequencing and integration gate

Agents A and B can work in parallel on separate backend routers and separate test files once the disposable database is available. Agents C and D can work in parallel on disjoint frontend files after agreeing on the data/API contract. Merge each workstream separately; run complete backend tests, frontend build/lint, and end-to-end admin/member journeys after integration. Any decision that changes contribution, equal-share, payment allocation, or household-data visibility semantics needs product-owner confirmation because the attached archive does not contain the functional specification.
