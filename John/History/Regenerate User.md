# Regenerate User: abc17@gmail.com — Complete Narrative & Recovery Guide

## Document Purpose
This document exists to prevent recurring context loss (compaction) from causing repeated confusion about the abc17@gmail.com account, its tenant relationship, its seed data, and the difference between the dev and deployed environments. If the agent loses context, this document contains everything needed to re-establish the correct understanding and resume work without breaking anything.

---

## Part 1: Who is abc17@gmail.com?

### Dev Environment (Replit Workspace)
- **User ID**: `e5e98577-2262-48c2-8ecf-120f1e533bc6`
- **Name**: Super Admin
- **Email**: `abc17@gmail.com`
- **Password**: `admin123!`
- **isPlatformAdmin**: `true`
- **Tenant**: `tenant_acme` (slug: `acme`)
- **Tenant Role**: `tenant_admin`
- **Company**: Archer Technologies Inc. (company ID: `34217844-6950-47f4-a038-72742ce3c0af`)
- **MFA**: Enabled. On login, a 6-digit code is logged to the server console: `[EMAIL VERIFICATION] Code for abc17@gmail.com: XXXXXX`

### Deployed Environment (Published .replit.app)
- **User ID**: `60c7c060-2492-4b52-90f5-5763bb94adfb`
- **Name**: John Reynolds
- **Email**: `abc17@gmail.com`
- **isPlatformAdmin**: `false`
- **Tenant**: `sandbox-60c7c060` (auto-provisioned sandbox) AND has `tenant_admin` access to `acme` and `globex`
- **Company**: Archer Technologies Inc. (Sandbox) — different UUIDs than dev

### Critical Distinction
The dev and deployed environments share the SAME `DATABASE_URL` connection string, but the deployed app was seeded at a different point in time, creating separate user records with different UUIDs. The user `60c7c060` was created through the `/launch` trial sign-up flow on the deployed app. The user `e5e98577` was created by the seed function in development.

Both users have the email `abc17@gmail.com`, but they are DIFFERENT rows in the `users` table (or were — the deployed app's user may have been deleted and recreated during reseeding). This is the source of most confusion.

---

## Part 2: The Canonical Truth About abc17@gmail.com

This was established and confirmed during development. It should never be questioned or overridden:

1. **abc17@gmail.com is a platform admin with tenant_admin access to tenant_acme.** It was originally created as a seeded admin account — not through the trial sign-up flow. It sits on the same tenant (acme) where all the seed data is written.

2. **Seed data flows directly to abc17@gmail.com's tenant.** The `seedDatabase()` function runs on every server startup. It seeds `tenant_acme` specifically. abc17@gmail.com is a `tenant_admin` on `tenant_acme`. So every iteration — new instruments, new sample data, schema changes — lands exactly where abc17@gmail.com can see it.

3. **No sandbox indirection.** abc17@gmail.com is NOT on a sandbox in dev. It's on a first-class tenant. There's no auto-provisioning layer between the code and the data. What is written to `tenant_acme` is what abc17@gmail.com sees. Period.

4. **Same database, both environments.** Dev and deployed share one `DATABASE_URL`. When data is seeded or a migration runs, it's visible everywhere — no "push to production" gap for data.

5. **abc17@gmail.com is the primary engineering test bench.** Both abc17@gmail.com and admin@exemptifi.com are platform admins on the same tenants (acme and globex). They see the exact same data. There is no advantage to switching. abc17@gmail.com is a perfectly good workbench.

6. **Seed idempotency behavior:**
   - Seed functions check "does data already exist?" before inserting
   - If you manually delete a grant through the UI, the seed function will recreate it on next restart
   - If you manually add grants, the seed function won't touch them (it sees existing data and skips)
   - If a new seed function is added for a new instrument, it will only insert if that table is empty for the tenant
   - This is correct behavior for a development workbench

---

## Part 3: The Recurring Problem — What Goes Wrong After Compaction

### Pattern
After the agent experiences context compaction (memory loss), it:
1. Loses track of which account abc17@gmail.com is
2. May confuse the dev user (`e5e98577`, platform admin, tenant_acme) with the deployed user (`60c7c060`, non-admin, sandbox)
3. May attempt to work on features that are already 100% complete (Warrants, Phantom Shares, SARs)
4. May claim data is missing when the real issue is a tenant resolution or schema migration problem

### The Specific Incident (February 28, 2026)

**Timeline:**
1. Agent was working on ESOP vesting bug fixes (legitimate work)
2. Three bugs were fixed: live vesting computation in GET grants endpoint, Dashboard Employee Equity card sourcing from grants instead of securities, Pools ESOP Participants card sourcing from grants
3. A `server/utils/vesting.ts` shared utility was created for consistent vesting computation
4. An e2e test caught a leftover `employeeIds is not defined` crash in dashboard.tsx — fixed
5. After compaction, agent received a session plan to "Build the Warrants instrument type" with 6 tasks
6. Agent explored the codebase and discovered ALL 6 tasks were already complete — schema, storage, routes, sidebar, routing, seed data, and the full warrants.tsx page all existed
7. Agent read the warrants.tsx file (515 lines) but made ZERO edits
8. User reported SARs page was blank on the deployed app
9. Investigation revealed the deployed app returns `exercise_trigger does not exist` 500 error
10. Root cause: The deployed app's sandbox tenant had a `sars` table provisioned before `exercise_trigger` was added to the DDL. `CREATE TABLE IF NOT EXISTS` doesn't backfill columns.
11. Fix: Added `ALTER TABLE ADD COLUMN IF NOT EXISTS exercise_trigger` migration to `provisionTenantSchema()` in `server/tenant.ts`
12. Republished — fix applied on next deployment startup

**Root Cause of the SARs Blank Page:**
- The `sars` table in the sandbox tenant's schema was created by an older version of the provisioning code
- That version did not include the `exercise_trigger` column
- The Drizzle ORM query includes all columns from the schema definition, including `exercise_trigger`
- PostgreSQL returned: `column "exercise_trigger" does not exist`
- The API returned a 500 error
- The frontend displayed the empty/error state: "No SARs yet"

---

## Part 4: Tenant Architecture Reference

### Tenant Schemas in the Database
```
tenant_acme          — Primary dev/test tenant (Archer Technologies Inc.)
tenant_globex        — Secondary tenant (Globex Corporation)
tenant_initech-corp  — Third tenant (Initech Corp)
tenant_sandbox-*     — Auto-provisioned sandbox tenants from trial sign-ups
```

### Tables Per Tenant Schema (16 tables)
```
companies, stakeholders, share_classes, securities,
investment_rounds, safe_agreements, safe_templates,
documents, investor_updates, esop_pools, esop_plans,
esop_grants, warrants, phantom_grants, sars, users
```

### Seed Data in tenant_acme
| Instrument | Count | Status |
|---|---|---|
| Stakeholders | 10 | 4 employees, 2 founders, 2 investors, 1 advisor, 1 board member |
| ESOP Pools | 1 | 2024 Employee Option Pool (750K allocated) |
| ESOP Plans | 3 | Engineering, Leadership RSU, Advisor |
| ESOP Grants | 5 | Engineering, Product, Leadership RSU, Dev Team, IT |
| Warrants | 2 | Series A Warrant, Bridge Loan Warrant |
| Phantom Grants | 2 | Executive Phantom Plan, VP Product Phantom |
| SARs | 2 | VP Engineering SAR, Product Lead SAR |
| SAFE Agreements | 3 | Various stages |
| Securities | 7 | Founder shares, investor shares, exercised options |
| Share Classes | 4 | Common, Preferred Series A, Employee Options, Executive Options |

### Key Stakeholder IDs (tenant_acme)
| Name | Type | ID Prefix |
|---|---|---|
| Michael Reynolds | employee | efaeaf4b |
| Kenji Tanaka | employee | 01b066f1 |
| John Doe | employee | 2e413580 |
| Cleetus McFarland | employee | 1aa32b7f |
| Sarah Mitchell | founder | (varies) |
| James Carter | founder | (varies) |

---

## Part 5: What is Complete — DO NOT TOUCH

The following features are 100% complete and should NOT be modified unless explicitly requested:

1. **Warrants** — Schema, storage, routes, seed data, full frontend page (`warrants.tsx`, 515 lines), sidebar entry, routing
2. **Phantom Shares** — Schema, storage, routes, seed data, full frontend page (`phantom.tsx`, 597 lines), sidebar entry, routing
3. **SARs** — Schema, storage, routes, seed data, full frontend page (`sars.tsx`), sidebar entry, routing
4. **SAFE Agreements** — Full wizard, templates, CRUD
5. **Securities** — Full CRUD
6. **Stakeholders** — Full CRUD
7. **Share Classes** — Full CRUD
8. **Data Room / Documents** — Full CRUD with upload
9. **Investor Updates** — Full CRUD
10. **Platform Admin Panel** — Tenant management, user management

---

## Part 6: Recovery Procedure After Compaction

If the agent has lost context, follow these steps:

### Step 1: Read This Document
Read `John/Regenerate User.md` (this file).

### Step 2: Verify the Account
```sql
SELECT id, email, first_name, last_name, is_platform_admin FROM users WHERE email='abc17@gmail.com';
```
Expected: One row, `e5e98577`, Super Admin, `is_platform_admin = true`.

### Step 3: Verify Tenant Membership
```sql
SELECT t.slug, t.name, tm.role FROM tenant_members tm
JOIN tenants t ON t.id = tm.tenant_id
JOIN users u ON u.id = tm.user_id
WHERE u.email = 'abc17@gmail.com';
```
Expected: `acme` (tenant_admin), `globex` (tenant_admin).

### Step 4: Verify Seed Data Integrity
```sql
SELECT COUNT(*) FROM tenant_acme.stakeholders;    -- Expected: 10
SELECT COUNT(*) FROM tenant_acme.esop_grants;     -- Expected: 5
SELECT COUNT(*) FROM tenant_acme.warrants;        -- Expected: 2
SELECT COUNT(*) FROM tenant_acme.phantom_grants;  -- Expected: 2
SELECT COUNT(*) FROM tenant_acme.sars;            -- Expected: 2
SELECT COUNT(*) FROM tenant_acme.safe_agreements; -- Expected: 3
SELECT COUNT(*) FROM tenant_acme.securities;      -- Expected: 7+
```

### Step 5: Do NOT Touch Completed Features
Refer to Part 5 above. Only work on whatever the user is actively requesting.

### Step 6: Schema Migration Pattern
If a new column was added to the Drizzle schema but existing tenant schemas don't have it:
1. The `CREATE TABLE IF NOT EXISTS` in `provisionTenantSchema()` handles NEW tables
2. For adding columns to EXISTING tables, add an `ALTER TABLE ADD COLUMN` migration block in the same function, following the pattern at lines 320-435 of `server/tenant.ts`
3. This migration runs on every startup via `migrateAllTenantSchemas()` in `server/seed.ts`

---

## Part 7: Files That Matter

| File | Purpose |
|---|---|
| `server/tenant.ts` | Tenant schema provisioning, DDL, migrations |
| `server/seed.ts` | Seed data, `migrateAllTenantSchemas()`, sandbox provisioning |
| `server/storage.ts` | IStorage interface, DatabaseStorage CRUD |
| `server/routes.ts` | All API endpoints |
| `server/utils/vesting.ts` | Shared vesting computation utility |
| `server/auth.ts` | Passport auth, session, MFA |
| `shared/schema.ts` | Drizzle schema definitions, Zod schemas, types |
| `client/src/lib/tenant-context.tsx` | Frontend tenant resolution (localStorage-based) |
| `client/src/lib/queryClient.ts` | TanStack Query config, `appendTenantParam()` |
| `client/src/pages/dashboard.tsx` | Main dashboard with Employee Equity card |
| `client/src/pages/equity-plans/pools.tsx` | ESOP Pools with Participants card |
| `client/src/pages/equity-plans/grants.tsx` | ESOP Grants table |
| `client/src/pages/equity-plans/warrants.tsx` | Warrants page (COMPLETE) |
| `client/src/pages/equity-plans/phantom.tsx` | Phantom Shares page (COMPLETE) |
| `client/src/pages/equity-plans/sars.tsx` | SARs page (COMPLETE) |

---

## Part 8: Common Pitfalls to Avoid

1. **Never assume data is missing without checking the database first.** Run SQL queries against `tenant_acme` tables before concluding data was deleted.

2. **Never follow a stale session plan without verifying the codebase.** After compaction, the plan may reference work that was already done. Always check if files exist and if code is already implemented.

3. **The deployed app may show different data than dev.** The deployed app may have a different user record, a sandbox tenant, or an older schema. Always check deployment logs with `fetch_deployment_logs` to see the actual errors.

4. **`CREATE TABLE IF NOT EXISTS` does not add missing columns.** When a new column is added to the Drizzle schema, a corresponding `ALTER TABLE ADD COLUMN` migration must be added to `provisionTenantSchema()` in `server/tenant.ts`.

5. **The tenant is resolved from `localStorage` on the frontend.** The key is `tableicty_tenant`. If a user's browser has a stale or wrong tenant slug saved, they'll see empty pages. The fix is to log out and log back in, which triggers the tenant resolution logic in `tenant-context.tsx`.

6. **abc17@gmail.com's password includes an exclamation mark.** It is `admin123!` — not `admin123`. Missing the `!` will cause login failures.
