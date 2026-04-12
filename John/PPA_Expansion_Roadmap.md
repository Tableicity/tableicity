# PPA Expansion Roadmap — Feature Inventory & Patent Gap Analysis

## What You Have vs. What You Filed

The current PPA covers **one pillar** deeply: the Zero-Knowledge Proof system (Privacy Vault, Noir circuits, four-gate middleware, BETA_MODE, sandbox seeding, public verification, Encrypted View). That pillar is strong.

But Tableicity has **at least 8 additional feature systems** that are not in the PPA. Several of these are potentially novel. Since a provisional locks your priority date only for what's described in it, anything left out cannot be back-added — it would require a new filing.

---

## SECTION A: Already in the PPA (No Action Needed)

| # | Feature | PPA Coverage |
|---|---------|-------------|
| A1 | Schema-per-Tenant Isolation | Sections 1-2, Claims 1-2 |
| A2 | ZKP via Noir (test_hash + ownership_threshold) | Section 3, Claims 3-6 |
| A3 | Seeded Sandbox with ZKP Trial | Section 4, Claims 7-8, 17 |
| A4 | Four-Gate Middleware + BETA_MODE Kill Switch | Section 5, Claims 9-10, 18 |
| A5 | Encrypted View (HMAC-SHA-256 Privacy Mode) | Section 6, Claims 11-12 |
| A6 | Testing/Validation Infrastructure | Section 7, Claims 13-14 |
| A7 | Version Lock for Reproducibility | Section 9, Claim 16 |

---

## SECTION B: NOT in the PPA — Feature Inventory with Patent Relevance

### B1: Progressive Onboarding Pipeline (HIGH relevance)

**What it is:** A multi-stage funnel that takes a cold visitor from lead capture → account creation → email verification → automatic sandbox provisioning → first login into a pre-populated workspace — all without manual admin intervention.

**What's in the code:**
- `/launch` → Lead capture (trialSignups table)
- `/launch/thank-you` → 10-second countdown with auto-redirect
- `/launch/create-password` → Account creation (user record with emailVerified=false)
- `/launch/verify?token=` → Email verification + automatic `provisionSandboxForUser()` call
- Silent auto-login via `/api/trial-auto-login` with orgToken
- Tenant slug persisted to localStorage, TenantProvider picks it up on redirect

**Why it matters for patent:** This isn't a generic sign-up form. It's a pipeline that atomically provisions an isolated database schema, seeds it with realistic equity data (stakeholders, securities, documents, ZKP commitments), and drops the user into a functional workspace — all triggered by a single email verification click. No competitor does schema provisioning as part of onboarding.

**Competitor gap:** Carta requires manual demo scheduling. Cake requires manual org setup. Neither auto-provisions isolated database schemas with seeded data.

---

### B2: Sandbox-to-Live Organization Transition (HIGH relevance)

**What it is:** After exploring the sandbox ("Archer Technologies Inc."), the user can create their real organization at any time. The system provisions a new isolated schema, seeds it with platform templates, and the user retains concurrent access to both environments via tenant switching.

**What's in the code:**
- `/launch/create-organization` → POST `/api/trial-create-organization`
- Creates new tenant schema with full table set
- Seeds platform resources (SAFE templates, documents) into new org
- User becomes `tenant_admin` of new org
- TenantProvider allows switching between sandbox and live org

**Why it matters for patent:** Dual-state execution — a user operates in a cryptographically isolated sandbox while simultaneously having access to a live organization, with both running identical security constraints. The transition preserves the user's tested understanding of the system.

---

### B3: Test Drive Guided Onboarding System (MEDIUM relevance)

**What it is:** Contextual onboarding banners on equity plan pages (Pools, Plans, Grants, Exercising, Warrants, Phantom Shares, SARs) that link to pre-seeded checklist documents in the Data Store, filtered by category.

**What's in the code:**
- Blue gradient cards with "Take a Test Drive" CTA on 7+ pages
- "Start Test Drive" button routes to `/data-room?category=test_drives`
- Dismiss state persists per page via localStorage (`{page}-test-drive-dismissed`)
- `seedTestDriveDocuments()` in seed.ts creates checklist documents tagged with `[Category: Test Drives]`
- `data_store_categories` table with dynamic category management

**Why it matters for patent:** The combination of contextual page-specific banners → category-filtered document store → seeded checklist documents creates a guided learning path within a live application. It's not a tooltip tour — it connects UI guidance directly to actionable reference documents within the user's own data environment.

**Honest assessment:** The individual components (banners, categories, dismiss buttons) are standard UX patterns. The novelty is in the system-level integration with seeded data and category routing. Medium strength as a standalone claim; stronger as a dependent claim under the sandbox onboarding method.

---

### B4: ESOP Hierarchy with Server-Side Vesting Engine (MEDIUM relevance)

**What it is:** A four-level equity plan system (Pool → Plan → Grant → Exercise) with real-time server-side vesting computation that automatically creates cap table securities upon exercise.

**What's in the code:**
- `esop_pools`, `esop_plans`, `esop_grants` tables with parent-child relationships
- `computeVestedShares()` in `server/utils/vesting.ts` — cliff logic, frequency periods, real-time calculation
- Exercise endpoint validates against server-computed vested amount (not client-submitted)
- Auto-creates `securities` record on exercise, linking to correct share class
- Pool-level aggregation of granted, vested, exercised shares

**Why it matters for patent:** The server-side vesting computation at exercise time (rather than pre-computed schedules) provides tamper-resistant enforcement. The automatic securities creation on exercise directly impacts the cap table — this is a closed-loop from option grant to ownership record.

**Honest assessment:** ESOP management itself is not novel (Carta has it). The server-side computation-at-exercise pattern and automatic cap table impact are good engineering but may not clear the novelty bar alone. Best positioned as part of the broader schema-isolated equity management system.

---

### B5: SAFE Agreement Wizard with Template Variable Injection (MEDIUM relevance)

**What it is:** A 3-step wizard that collects investment terms, maps them to template variables, injects them into legal document templates (Y-Combinator standard SAFEs), generates PDFs client-side, and archives everything to the tenant's Data Room.

**What's in the code:**
- 3-step wizard: Investor Details → SAFE Details → Finalize
- `template_variables` stored as JSONB on safe_agreements
- `injectVariables(rawTemplate, variables)` regex replacement of `{{variable_name}}` placeholders
- Missing variable detection with `[VARIABLE - MISSING]` markers
- jsPDF generation with auto-detected headings, pagination
- Auto-archive to Data Room as "legal" type document
- Draft → Sent → Executed status workflow

**Why it matters for patent:** The end-to-end pipeline from structured data capture → variable injection → PDF generation → automatic Data Room archival within a schema-isolated tenant is a complete document lifecycle system. The missing variable detection with visual markers is a nice safety feature.

**Honest assessment:** Template injection and PDF generation are common patterns. The integration with schema-isolated storage and the complete lifecycle tracking adds some novelty. Medium strength.

---

### B6: Multi-Tenant Membership with Per-Tenant RBAC (HIGH relevance)

**What it is:** A user can belong to multiple organizations, each with a different role. The system routes every request to the correct isolated schema based on the active tenant, with role enforcement per tenant.

**What's in the code:**
- `tenant_members` join table: userId + tenantId + role + status
- Four roles: `platform_admin`, `tenant_admin`, `tenant_staff`, `shareholder`
- `tenantMiddleware` extracts slug → verifies membership → sets PostgreSQL `search_path` → attaches `tenantStorage` to request
- `requireRole()` higher-order middleware for per-route role enforcement
- Client-side `TenantProvider` manages active tenant, persists to localStorage
- Platform admin bypasses tenant checks for cross-org access

**Why it matters for patent:** The combination of per-tenant role enforcement with database-level schema switching (not just application-level filtering) is architecturally distinct. A single API request triggers: membership verification → schema path setting → role-scoped storage injection. This is the enforcement mechanism that makes schema-per-tenant isolation actually work for multi-org users.

**This is already partially in the PPA** (tenantMiddleware is mentioned), but the multi-membership model and per-tenant RBAC are not claimed separately. They should be.

---

### B7: Platform Resources with Auto-Seed Architecture (LOW-MEDIUM relevance)

**What it is:** A master document repository where platform admins manage templates that automatically propagate to new tenant schemas. Two-tier visibility: Resource Library (seedable) and Admin Resources (private, never seeded).

**What's in the code:**
- `platform_resources` table with `autoSeed` and `adminOnly` boolean flags
- `seedPlatformResourcesToTenant()` clones resources with `autoSeed=true` into new tenant's documents table
- Deduplication via `[Platform Resource: <ID>]` marker in description
- `adminOnly=true` forces `autoSeed=false` at both UI and API level
- Seeded copies are independent — deleting the master doesn't affect tenant copies

**Why it matters for patent:** The auto-propagation pattern with deduplication and the adminOnly safety interlock is clean engineering. However, document template distribution is a well-established pattern in SaaS platforms.

**Honest assessment:** Low novelty as a standalone claim. Could strengthen the overall system description as part of the tenant provisioning pipeline.

---

### B8: Stripe-Integrated Tiered Monetization with Proof Gating (HIGH relevance — partially covered)

**What it is:** Three subscription tiers (Starter/Professional/Enterprise) integrated with Stripe, where the subscription state directly controls access to cryptographic operations (ZKP proof generation) via the four-gate middleware.

**What's in the code:**
- Stripe Checkout with tenant-scoped metadata (tenantId + tierId)
- Webhook handler updates `tenants.plan` field based on subscription events
- `getProofTierConfig(tenant.plan)` maps plan → proof limits
- BETA_MODE toggles between beta config (all tiers get 10 proofs) and production config (starter=0, professional=10, enterprise=100)
- Overage pricing: professional=$25/proof, enterprise=$15/proof
- `proof_usage` table with UNIQUE on `(tenant_id, billing_month)` for atomic tracking

**Why it matters for patent:** The connection between SaaS subscription tier and metered access to cryptographic operations (ZKP generation) is novel. This isn't just "pay for features" — it's "pay for computational proof generation cycles with atomic billing that protects against race conditions and failed-attempt charges."

**PPA gap:** The current PPA describes the four-gate middleware and BETA_MODE, but doesn't explicitly connect it to the Stripe subscription lifecycle or describe the tiered pricing → proof access pipeline as a unified monetization system.

---

### B9: Audit Logging System (LOW relevance)

**What it is:** Comprehensive event tracking of all CRUD operations across the platform.

**Honest assessment:** Audit logging is standard practice. Not patent-worthy on its own.

---

### B10: Document Management / Data Room (LOW-MEDIUM relevance)

**What it is:** Secure document storage per tenant with category filtering, file uploads via multer, and integration with SAFE agreements and platform resources.

**Honest assessment:** Document management is commodity. The integration with schema isolation adds security context but isn't novel enough for independent claims.

---

### B11: Five Equity Instrument Types with Cap Table Impact Rules (MEDIUM relevance)

**What it is:** Stock Options (ESOP), Warrants, Phantom Shares, SARs, and Direct Stock — each following a consistent architectural pattern. The system knows which instruments impact the cap table (ESOP exercises, warrant exercises, stock-settled SARs create securities) and which don't (phantom shares, cash-settled SARs).

**Why it matters for patent:** The differentiated cap table impact rules — where the system automatically determines whether an equity event creates an actual ownership record based on instrument type and settlement method — could be claimed as part of the privacy-preserving equity management method.

---

## SECTION C: What Gemini Got Wrong (Do NOT Include)

| Gemini Claim | Reality | Risk if Filed |
|---|---|---|
| Client-side ZKP execution | Server-side only (proof-service.ts) | Patent would be non-enabling |
| Single-use execution token | 10 proofs/month metered allocation | Inaccurate claim scope |
| Non-authenticated proof generation | Requires requireAuth + tenantMiddleware | Factually false |
| Verification Certificate document | Returns proofId + status + URL only | Non-existent artifact |
| Local salt storage in Secure Enclave/TEE | Server-side salt generation, 32-byte random | Wrong architecture entirely |
| Distributed ledger / blockchain | PostgreSQL with schema isolation | Completely different architecture |
| Erasure coding / Reed-Solomon | Not implemented | Filing would be fraudulent |
| 8-Node Shredder | Not implemented (per your instruction, disregard) | Not built |
| Recursive SNARKs / batched proofs | Not implemented | Filing would be fraudulent |
| "Consisting essentially of" SUID + ZKP transmission | System transmits much more than SUID + proof | Overly narrow, inaccurate |

**Critical warning:** Any claim describing functionality that doesn't exist in the code is not just weak — it's potentially grounds for patent invalidation under inequitable conduct. Every claim must be traceable to actual implementation.

---

## SECTION D: Recommended Expansion Strategy

### Priority 1 — Add to PPA (High novelty, unique to Tableicity)

1. **Progressive Onboarding Pipeline (B1)** — The atomic provisioning of an isolated database schema with seeded equity data, ZKP commitments, and guided checklists, triggered by email verification.

2. **Sandbox-to-Live Dual-State Architecture (B2)** — Concurrent access to sandbox and live organizations with identical security constraints and independent schema isolation.

3. **Multi-Tenant Membership with Schema-Routed RBAC (B6)** — Per-tenant role enforcement combined with database-level schema switching for multi-organization users.

4. **Subscription-Gated Cryptographic Monetization (B8 expansion)** — The end-to-end pipeline from Stripe subscription tier → proof access gating → atomic usage billing, including the BETA_MODE global toggle.

### Priority 2 — Include as Supporting Description (Good engineering, strengthens overall filing)

5. **Test Drive Guided Onboarding (B3)** — Contextual banners → category-filtered Data Store → seeded checklists. Dependent claim under B1.

6. **ESOP Hierarchy with Server-Side Vesting (B4)** — Pool → Plan → Grant → Exercise with computation-at-exercise and automatic cap table impact. Part of the equity management system description.

7. **Equity Instrument Cap Table Impact Rules (B11)** — Differentiated treatment of instrument types and settlement methods. Supports the "privacy-preserving equity management" framing.

### Priority 3 — Mention but Don't Over-Claim (Standard patterns with good integration)

8. **SAFE Wizard + Template Injection (B5)** — Describe in system overview but don't make independent claims.

9. **Platform Resources Auto-Seed (B7)** — Mention as part of tenant provisioning pipeline.

10. **Data Room / Document Management (B10)** — Supporting infrastructure, not independently novel.

---

## SECTION E: Recommended Approach

### Option A: Response Documents (Feed to Halo)
I produce Response-style documents (like the original Response_One through Response_Six) for each Priority 1 feature cluster. You feed them into Halo for PPA expansion. This preserves your decoupled learning workflow.

**Deliverables:** 4 Response documents covering B1, B2, B6, and B8.

### Option B: Direct PPA Sections
I write the additional Detailed Description sections and Claims directly, matching the format and style of the existing PPA. You paste them into the filing.

**Deliverables:** New sections 10-13 + Claims 19-30 (approximately) added to PPA.md.

### Option C: Hybrid
I produce both — Response documents for Halo's learning process AND the finished PPA sections for filing. Belt and suspenders.

---

## SECTION F: Decision Points for You

1. **Which option (A, B, or C) do you want?**
2. **Do you want to include B3-B7 as detailed claims, or just as supporting description?**
3. **Is there anything else in the platform I haven't listed that you consider novel?**
4. **Timeline — when do you need the expansion complete?**
