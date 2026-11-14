# Bill-ihin integration progress

Updated: 2026-11-14

## Current state

The Bill-ihin integration is in progress in the existing NovaMart React/Vite and Express/MySQL workspace. Preserve the current working tree: it contains uncommitted modifications and new files. No existing changes were reverted during this handoff.

The generated archive supplied pages, components, mock context/data, and finance tests. It did not include a separate database schema or functional specification, so the business flows were inferred from the generated UI and finance tests.

## Completed files and modules

- Frontend integration: `frontend/src/App.jsx`, `frontend/src/context/AppContext.jsx`, `frontend/src/context/appContextStore.js`, `frontend/src/context/useApp.js`, `frontend/src/services/api.js`, `frontend/src/index.css`, `frontend/index.html`. The app uses React Router, an Axios client, session bootstrap, protected routes, admin route guards, and API-backed household state. The context hook was split out to keep Fast Refresh valid and avoid a case-insensitive Windows filename collision.
- Generated UI adapted into the existing structure:
  - Pages: `frontend/src/pages/{AdminDashboardPage,BillAssignmentsPage,BillDetailsPage,BillsExpensesPage,BudgetManagementPage,CategoriesPage,ContributionDetailsPage,ContributionsPage,HouseholdMembersPage,HouseholdOverviewPage,LoginPage,MemberDashboardPage,MyProfilePage,NotificationsPage,PaymentTrackingPage,RegistrationPage,ReportsAnalyticsPage,SettingsPage}.jsx`.
  - Shared UI/layout/modals: `frontend/src/components/{ui,layout,modals}/`.
  - Finance helpers and tests: `frontend/src/utils/finance.js`, `frontend/src/utils/finance.test.js`.
- Backend configuration and app setup: `backend/config/db.js`, `backend/server.js`, `backend/middleware/auth.js`, `backend/middleware/rateLimit.js`, `backend/utils/{audit,validation}.js`.
- Bill-ihin API modules: `backend/routes/{auth,household,members,categories,bills,budgets,contributions,assignments,payments,notifications}.js`. Existing NovaMart product/order route files remain in place; `backend/routes/orders.js` now protects its admin endpoint.
- MySQL schema and migration: `backend/database/schema.sql`, `backend/database/migrate.js`. Bill-ihin tables are namespaced with `billihin_` to avoid collisions with existing NovaMart tables.
- Setup/docs/tests: `README.md`, `backend/.env.example`, `frontend/.env.example`, `backend/package.json`, `backend/test/validation.test.js`.
- Existing NovaMart commerce source files were retained. The active `App.jsx` currently routes to Bill-ihin; the old commerce pages are not currently reachable from the frontend router.
- Bill-ihin form modals initialize their drafts when opened and reset on close/reopen; their prop-sync effects were removed. The expense chart no longer mutates a render-local accumulator, and profile fields initialize from the loaded account.

## Database tables created in schema

`billihin_households`, `billihin_users`, `billihin_categories`, `billihin_budgets`, `billihin_bills`, `billihin_contributions`, `billihin_assignments`, `billihin_payments`, `billihin_notifications`, and `billihin_activities`.

The migration has **not** been run against a live database.

## API routes created

- `GET /api/health` (database connectivity check).
- `/api/auth`: `POST /register`, `POST /login`, `POST /logout`, `GET /me`, `PATCH /profile`, `PATCH /password`.
- `/api/household`: `GET /data`, `PUT /` (household/settings).
- `/api/members`: `POST /`, `PATCH /:id`, `DELETE /:id`.
- `/api/categories`, `/api/bills`, `/api/budgets`, `/api/assignments`: `POST /`, `PATCH /:id`, `DELETE /:id`.
- `/api/contributions`: `POST /`, `PATCH /:id`, `POST /:id/verify`, `POST /:id/reject`, `DELETE /:id`.
- `/api/payments`: `POST /`, `PATCH /:id`, `DELETE /:id`.
- `/api/notifications`: `PATCH /read-all`, `PATCH /:id/read`, `DELETE /:id`.
- Existing NovaMart APIs remain mounted at `/api/products` and `/api/orders`; `GET /api/orders/admin` now requires an authenticated administrator.

Household records are currently loaded together through `/api/household/data`; separate list/detail GET endpoints have not been added to each resource router.

## Accounting and access behavior implemented

- Registration creates the first household administrator or joins an existing household through an invite code. Roles are not accepted from client registration input.
- Auth uses an HTTP-only session cookie, active-user lookup, household scoping, administrator middleware, and an in-memory auth rate limiter.
- Contributions have Pending/Confirmed/Rejected states. Verification does not create a provider payment. Bill paid balances/status derive from actual provider payment records only.
- Financial history is retained; deleting bills with financial history is blocked. Member contribution edits/deletes are restricted to their own pending records.
- Settings, budgets, assignments, member management, notifications, and report summaries are wired to API-backed data in the implementation, but require live integration checks.

## Verification run

- `npm test --prefix backend`: passed, 3 validation tests.
- `node --test frontend/src/utils/finance.test.js`: passed, 6 finance tests, including contribution/payment separation.
- `npm ci --prefix frontend`: completed from the existing lockfile; 185 packages installed. The lockfile remains unchanged. npm reported 3 moderate vulnerabilities; these were not investigated or changed.
- `npm run build --prefix frontend`: passed (Vite 8.3.5; 2066 modules). Vite warns that the main JS chunk is about 539 kB, above its 500 kB advisory threshold.
- Bill-ihin scoped ESLint run: passed for `App.jsx`, the Bill-ihin context, generated components, and Bill-ihin pages.
- Full `npm run lint --prefix frontend`: still fails on two retained NovaMart files: `src/context/CartContext.jsx` (Fast Refresh export rule) and `src/pages/CategoryPage.jsx` (state update inside an effect). Those legacy files were not modified in this pass.
- `git diff --check`: no whitespace errors reported; Git emitted line-ending conversion warnings for existing modified files.
- No `.env` configuration or MySQL credentials/server were available, so migration, server startup, auth, and CRUD were not exercised against MySQL.
- Frontend lint and full browser click-through were not run.

## Partially implemented / unfinished

1. Configure `backend/.env` from its example, start a supported MySQL 8 database, run `npm run migrate` from `backend`, and check server startup/health.
2. Exercise registration/login, invite joining, admin/member permissions, household settings, and CRUD for every resource against the database. Check cookie/CORS behavior across the configured frontend origin.
3. Validate generated page actions end to end and fix any runtime/API shape mismatches uncovered by live checks.
4. Decide whether NovaMart commerce pages need to remain accessible alongside Bill-ihin; their source files are retained but are not in the current router.
5. The initial admin's categories are empty; confirm desired first-run category setup with the supplied product specification if one is available separately.
6. If a clean whole-repo lint run is required, review the two reported legacy NovaMart lint findings separately.

## Known limitations/errors for the next agent

- Frontend production build passes, with a Vite advisory that the main JavaScript chunk exceeds 500 kB.
- Database schema syntax, migration behavior, and all database-backed endpoint paths remain unverified against a running MySQL instance.
- Current backend automated coverage tests only input validation. Frontend finance tests cover aggregate calculations, not page/API integration.
- Full frontend lint remains blocked by the two existing NovaMart findings listed above; the Bill-ihin source set passes scoped ESLint.
- `npm ci` reported three moderate dependency audit findings; no audit remediation was attempted.
- There is no separate functional spec/schema in the provided archive; review any separately supplied specification before treating inferred business behavior as final.
