# Tableicity - Equity Management Platform

## Overview
Tableicity is a multi-tenant equity management platform for startups, offering comprehensive equity, stakeholder, and investment management. It provides a secure, scalable solution for capitalization tables, SAFEs, employee equity plans, securities tracking, document management, and investor updates. Key features include trial sign-up, onboarding, and auto-provisioned sandbox environments with sample data, aiming to streamline equity administration for startups.

## User Preferences
I prefer clear and concise communication.
I value an iterative development approach, where changes are implemented and reviewed in smaller, manageable steps.
I prefer detailed explanations for complex architectural decisions or significant code changes.
Please ask for confirmation before making any major structural changes or deleting existing features.
I want the agent to primarily focus on implementing new features and fixing bugs, adhering to the established architectural patterns.

## System Architecture

### UI/UX Decisions
The frontend uses React, Vite, Tailwind CSS, and `shadcn/ui` for a modern and responsive interface. `wouter` handles routing, and `TanStack Query` manages data. Common UI elements include sortable tables, forms, interactive wizards, and a collapsible sidebar.
- **Auth Layout**: Two-panel split layout via `AuthBackground` component. Dark navy left panel (45% width, hidden on mobile) with marketing pitch content (3-Click Onboarding, Test Drive, Founder-First features). Light right panel contains the form cards. All auth pages (login, register, launch flow, verify-email) use this layout. Card styling: `shadow-2xl border-0` consistently.
- **Thank You Page**: Includes 10-second countdown with auto-redirect to create-password step. Styled with animated checkmark badge.

### Technical Implementations
- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query.
- **Backend**: Express.js API.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Session-based with `express-session`, `passport-local`, `bcrypt`, and email-verified MFA.
- **Multi-Tenancy**: Achieved via PostgreSQL schema-per-tenant isolation, managed by a `DatabaseStorage` class.
- **Authorization**: Role-Based Access Control (RBAC) supporting `platform_admin`, `tenant_admin`, `tenant_staff`, and `shareholder` roles.
- **Trial Sign-up Flow**: Progressive onboarding at `/launch` for lead capture, account creation, email verification, and sandbox provisioning.
- **Sandbox Feature**: New users receive pre-seeded sandbox organizations.
- **Document Management**: Secure data room, PDF generation, SAFE templates with variable injection, and document deduplication.
- **Equity Instruments**: Supports Stock Options (ESOP), Warrants, Phantom Shares, SARs (Stock Appreciation Rights), and Direct Stock (Securities). Each instrument follows a consistent architectural pattern: Drizzle schema, IStorage + DatabaseStorage CRUD, Express API with Zod validation, React page with TanStack Query, and seed data.
  - **ESOP Program**: Follows a Pool → Plan → Grant → Exercise hierarchy, fully implemented with dedicated CRUD pages and server-side vesting computation.
  - **Cap Table Impact**: ESOP exercises, warrant exercises, and stock-settled SARs create security records. Phantom shares and cash-settled SARs do not impact the cap table.
- **Test Drive System**: Guided onboarding banners on equity plan pages (Pools, Plans, Grants, Exercising, Warrants) with dismissible blue gradient cards. Each "Start Test Drive" button redirects to Data Store with `?category=test_drives` filter pre-selected. Dismiss state persists via localStorage (`{page}-test-drive-dismissed`).
- **Data Store Categories**: Dynamic category management via `data_store_categories` table. Default categories (Test Drives, Documents, Notes, Other) seeded per tenant. Admin can add custom categories via "+ Add Category" in filter dropdown. URL param `?category=X` auto-selects filter on page load. Documents tagged with `[Category: X]` in description for custom category matching.
- **Platform Resources**: Master documents stored in `platform_resources`, with auto-seeding for new tenants. Two-card layout: "Resource Library" (seedable to tenants) and "Admin Resources" (private, `adminOnly=true`, never seeded). Admin resources bypass auto-seed toggle.
- **Dashboard**: Displays ownership overview, key metrics, and employee equity utilization.
- **Stakeholder Management**: Full CRUD for all stakeholder types.
- **Share Class Definition**: Configuration for common, preferred, and option share classes.
- **Securities Tracking**: Management of all issued securities.
- **SAFE Management**: Creation, tracking, and workflow via a 3-step wizard and templating.
- **Template Library**: CRUD for document templates.
- **Investor Updates**: Creation and distribution of investor communications.
- **Audit Logs**: Comprehensive tracking of all actions.
- **Profile Page**: Account settings (view name/email, change password) and subscription management. Three pricing tiers (Starter $49/mo, Professional $149/mo, Enterprise $399/mo) with Stripe Checkout integration, billing portal access, and billing history. Sidebar link in footer above Log Out.
- **Stripe Integration**: `stripe` npm package with direct API key usage (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY). Routes in `server/stripe.ts`: GET /api/stripe/pricing, GET /api/stripe/subscription, POST /api/stripe/create-checkout (requires tenantId, validates membership, derives tierId server-side via buildPriceToTierMap), POST /api/stripe/create-portal, POST /api/stripe/webhook (enforces signature verification in production, reads tierId/tenantId from subscription.metadata for scoped plan updates — no fallback to all memberships). Users table has `stripe_customer_id` and `stripe_subscription_id` columns. Optional env: `STRIPE_PRICE_TIER_MAP` (format: `price_xxx:professional,price_yyy:enterprise`) for mapping real Stripe price IDs to tiers.
- **Proof Usage Monetization (Gate 4)**: `proof_usage` table with UNIQUE constraint on `(tenant_id, billing_month)`. Atomic usage increment via `INSERT ... ON CONFLICT DO UPDATE`. Tier config in `server/proof-config.ts`: starter=0 proofs (disabled), professional=10/month@$25 overage, enterprise=100/month@$15 overage. `checkProofAccess` middleware in `server/proof-middleware.ts` gates POST /ownership. Usage endpoint: GET `/api/v1/proofs/usage`. Frontend shows usage bar and upgrade CTA on Privacy Vault page.
- **Platform Admin Panel**: For managing tenants, users, and platform settings.
- **Compliance Sidebar Section**: Title-level "Compliance" group in sidebar with 4 Pro Feature items (401A Validations, Form 3921, Rule 701, ASC 718), each showing amber "Pro Feature" tooltip on hover.
- **Sequential Guide Tooltips**: On first login, org creation guide tooltip appears first. When dismissed, a second tooltip appears pointing to the day/night theme toggle. Both persist dismissal per-user via localStorage.
- **Default Theme**: Dark mode is the default for new users (no prior localStorage theme set).
- **Zero-Knowledge Proof System (NOIR)**: Privacy Vault feature using Aztec's Noir language (v0.36.0) and NoirJS. All Noir packages locked at v0.36.0 (nargo, noir_js, backend_barretenberg). Public schema tables: `commitment_records` (SHA-256 commitments linking to cap table entries), `proof_requests` (proof lifecycle tracking), `proof_results` (generated proofs + verification keys), `proof_usage` (monthly usage tracking with UNIQUE on tenant_id+billing_month). Commitment generation via `scripts/generate-commitments.ts`. Proof service in `server/proof-service.ts` with `generatePedersenCommitment` (via test_hash helper circuit), `generateOwnershipProof`, and `verifyOwnershipProof`. Pedersen commitments are computed on first use and cached in the `pedersenCommitment` field of `commitment_records`. Salt values are truncated to 31 bytes (248 bits) to fit within the BN254 field modulus. Compiled ownership_threshold circuit in `noir_circuits/ownership_threshold/target/`. API routes in `server/proof-routes.ts` mounted at `/api/v1/proofs` with `tenantMiddleware` enforcement: POST /ownership (gated by checkProofAccess), POST /verify, GET /:proofId, GET /, GET /usage. Public verify: GET `/api/v1/verify/:proofId` (rate-limited 10/min, CORS enabled, returns only status — no PII). Frontend pages: `/privacy-vault`, `/verify-proof`, `/audit-proofs`, `/public/verify/:proofId`. Sidebar "Zero Proofs" accordion gated by `VITE_NOIR_ENABLED=true`. Proof TTL: 72 hours. Security: private inputs (shares, salt) never in any API response; proofHex not exposed; public verify stripped to status-only. Trust proxy enabled for rate limiting. All 5 gates passed with architect sign-off.
- **Encrypted View (Privacy Mode)**: Toggle on Dashboard, Stakeholders, Securities, SAFE Agreements, and SAFE Create pages that switches stakeholder names between normal display and hashed/labeled view. Uses SHA-256 HMAC with companyId salt. Hashes displayed as `0x{first8}...{last4}`. Custom labels editable inline (admin only). Persists via localStorage key `"privacy-mode"`. Backend: `privacyLabels` table, `GET /api/privacy/hashes`, `GET /api/privacy/labels`, `PATCH /api/privacy/labels/:stakeholderId`. Frontend: `use-privacy-mode.ts` hook, `privacy-toggle.tsx` component. Seed data auto-generates random alphanumeric labels in `XXXX-XXXX` format (e.g., `MTS9-T77L`) using unambiguous charset (no O/0/I/1). Admins can edit labels inline.

### Database Migration Pattern
New instrument tables are provisioned in `shared/schema.ts` (Drizzle schema), `server/tenant.ts` (raw SQL for new tenants and backfill for existing tenants), and `server/seed.ts` (seed data).

### UI Conventions
- **Avatar Palette Colors**: Teal, orange, green, purple, blue.
- **Status Badge Colors**: Active=green, Exercised/Partially Exercised=blue, Fully Exercised=indigo, Vested=purple, Expired=orange, Cancelled=red, Forfeited=gray.
- **Dialog Pattern**: AlertDialog for delete confirmations, Dialog for forms.
- **Form Reset**: Explicit default values for `form.reset()`.
- **PATCH Endpoints**: Utilize field whitelisting.

## External Dependencies
- **PostgreSQL**: Primary relational database.
- **bcrypt**: Password hashing.
- **passport-local**: Local authentication strategy.
- **express-session**: User session management.
- **connect-pg-simple**: PostgreSQL session store.
- **Drizzle ORM**: TypeScript ORM.
- **drizzle-zod**: Zod schema generation from Drizzle schemas.
- **jsPDF**: Client-side PDF generation.
- **multer**: File uploads.
- **recharts**: Charting library.
- **AWS SES**: Email verification (production).
- **Stripe**: Payment processing and subscription management.