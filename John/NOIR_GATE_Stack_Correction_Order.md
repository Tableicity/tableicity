# ARCHITECT'S CORRECTION ORDER — STACK TRANSLATION
## Date: March 26, 2026 | Priority: CRITICAL — Before any code is written

---

## THE CORRECTION

The Executive Summary (March 2026) listed **Django 4.x (Python)** as the backend framework. The actual Replit codebase runs **Express.js + TypeScript + Drizzle ORM**. 

This is my error. The ES was either outdated or describes the AWS production target while the Replit app uses a different stack. Regardless — the Replit agent caught it before Gate 0 opened. **This is exactly why we use gates.** No code was written against the wrong assumption.

### What Changes: Implementation Language
### What Does NOT Change: Architecture, Circuits, Gates, Monetization, Security Model

---

## REVISED STACK REALITY

| Layer | Was (Sprint Plan) | Actually Is (Replit) | Impact |
|-------|-------------------|---------------------|--------|
| Backend | Django 4.x (Python) | **Express.js + TypeScript** | All backend code rewrites to TS |
| ORM | Django ORM + pgcrypto | **Drizzle ORM** | Models → Drizzle schema tables |
| Models Location | `backend/proof_service/models.py` | **`shared/schema.ts`** | Schema co-located with app |
| Management Commands | `python manage.py generate_commitments` | **Express API route or seed script** | |
| App Structure | `proof_service/` Django app | **`server/proof-service.ts` + routes** | |
| Settings/Config | `backend/settings.py` | **`server/config.ts` or `server/stripe.ts`** | Tier matrix lives here |
| Middleware | Django middleware class | **Express middleware function** | Same concept, different syntax |
| Proof Worker | Subprocess Django → Node | **Direct import** (already in Node/TS!) | SIMPLER — no subprocess needed |

### KEY INSIGHT: The proof worker is now EASIER
The original plan called for Django calling a Node subprocess because NoirJS is JavaScript. Since the backend IS already Node/TypeScript, **NoirJS integrates directly** — no subprocess, no IPC, no extra process. Engineer #1 imports NoirJS directly into the Express backend. This is a win.

---

## REVISED DRIZZLE SCHEMA (replaces Django models)

```typescript
// shared/schema.ts — ADD these tables alongside existing schema

import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';

// ═══ COMMITMENT RECORDS ═══
export const commitmentRecords = pgTable('commitment_records', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  holderRef: varchar('holder_ref', { length: 64 }).notNull(),
  commitmentHash: varchar('commitment_hash', { length: 128 }).notNull(), // SHA-256
  pedersenCommitment: varchar('pedersen_commitment', { length: 128 }),    // For Noir circuit
  salt: varchar('salt', { length: 64 }).notNull(),
  shareClass: varchar('share_class', { length: 32 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  tenantHolderClassUnique: uniqueIndex('tenant_holder_class_idx')
    .on(table.tenantId, table.holderRef, table.shareClass),
  commitmentHashIdx: index('commitment_hash_idx').on(table.commitmentHash),
}));

// ═══ PROOF REQUESTS ═══
export const proofRequests = pgTable('proof_requests', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  proofType: varchar('proof_type', { length: 32 }).notNull(), // 'ownership_threshold'
  requestedBy: integer('requested_by').notNull().references(() => users.id),
  publicInputs: jsonb('public_inputs').default({}).notNull(),
  status: varchar('status', { length: 16 }).default('pending').notNull(),
    // 'pending' | 'generating' | 'complete' | 'failed' | 'expired'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});

// ═══ PROOF RESULTS ═══
export const proofResults = pgTable('proof_results', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  requestId: integer('request_id').notNull().references(() => proofRequests.id).unique(),
  proofHex: text('proof_hex').notNull(),
  verificationKeyHex: text('verification_key_hex').notNull(),
  verified: boolean('verified').default(false).notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
});
```

---

## REVISED FILE STRUCTURE

```
app.tabl.../
│
├── noir_circuits/                          ← NEW (Gate 0) — UNCHANGED
│   ├── test_hash/src/main.nr
│   └── ownership_threshold/
│       ├── src/main.nr                     ← Gate 2 circuit — UNCHANGED
│       └── target/
│           └── ownership_threshold.json    ← compiled ACIR artifact
│
├── shared/
│   └── schema.ts                           ← ADD commitment/proof tables here
│
├── server/
│   ├── proof-service.ts                    ← NEW: NoirJS integration + proof logic
│   ├── proof-routes.ts                     ← NEW: Express routes for proof API
│   ├── proof-middleware.ts                 ← NEW: Tier checking middleware (Gate 4)
│   ├── proof-config.ts                     ← NEW: TIER_FEATURES matrix (Gate 4)
│   └── stripe.ts                           ← EXISTING: add metered billing hooks
│
├── client/src/
│   ├── components/sidebar/
│   │   └── ZeroProofsAccordion.tsx         ← NEW: accordion nav group (Gate 2F)
│   ├── pages/
│   │   ├── PrivacyVaultPage.tsx            ← NEW (Gate 2F → wired Gate 3)
│   │   ├── VerifyProofPage.tsx             ← NEW (Gate 2F → wired Gate 3)
│   │   ├── AuditProofsPage.tsx             ← NEW (Gate 2F → wired Gate 3)
│   │   └── PublicVerifyPage.tsx            ← NEW (Gate 3, no-auth)
│   ├── services/
│   │   └── proofService.ts                ← NEW (Gate 3, API client)
│   └── hooks/
│       └── useProofGeneration.ts           ← NEW (Gate 3)
│
├── scripts/
│   └── generate-commitments.ts             ← NEW: seed/migration script (Gate 1)
│
└── .env                                    ← ADD: NOIR_ENABLED=true
```

---

## REVISED GATE NARRATIVES (Express/TypeScript Translation)

### GATE 0 + GATE 1 — REVISED REPLIT NARRATIVE

```
CONTEXT: This is an existing Express.js + TypeScript + Drizzle ORM
transfer agent application called Tableicty. It manages cap tables for
private companies. We are adding a Zero-Knowledge proof feature called
"Privacy Vault" using Aztec's Noir language and NoirJS.

DO NOT modify any existing files unless explicitly told to.
DO NOT rename, restructure, or refactor existing code.
We are ADDING new modules alongside the existing application.

TASK — GATE 0: FOUNDATION (4 hours)

1. Install npm packages in the project:
   - @noir-lang/noir_js
   - @noir-lang/backend_barretenberg

2. Create directory: /noir_circuits/test_hash/src/main.nr
   Simple Noir circuit: takes private input x, public input y,
   asserts pedersen_hash([x]) == y. This is just to verify the
   toolchain works.

3. Attempt to install nargo (Noir compiler) on Replit:
   - If it works: compile the test circuit, commit the artifact
   - If Replit can't handle it (expected): document this, and plan
     to use pre-compiled ACIR artifacts committed to the repo.
     NoirJS only needs the compiled JSON, not the compiler.

4. Create a test script: /scripts/test-noir.ts
   - Imports @noir-lang/noir_js and @noir-lang/backend_barretenberg
   - Loads a compiled circuit artifact (JSON)
   - Generates a proof with test inputs
   - Verifies the proof
   - Logs: "NoirJS proof generation: SUCCESS" or "FAILED"

5. Verify the existing app still boots and all current tests pass.

TASK — GATE 1: COMMITMENT ENGINE (4 hours)

6. Add three new Drizzle schema tables to shared/schema.ts:

   commitmentRecords table:
   - id (auto-increment primary key)
   - tenantId (FK to tenants)
   - holderRef (varchar 64, opaque reference)
   - commitmentHash (varchar 128, SHA-256 hex)
   - pedersenCommitment (varchar 128, nullable, for Noir circuit)
   - salt (varchar 64, random per record)
   - shareClass (varchar 32)
   - createdAt (timestamp, default now)
   - isActive (boolean, default true)
   - Unique index on (tenantId, holderRef, shareClass)

   proofRequests table:
   - id (auto-increment primary key)
   - tenantId (FK to tenants)
   - proofType (varchar 32)
   - requestedBy (FK to users)
   - publicInputs (jsonb, default {})
   - status (varchar 16, default 'pending')
   - createdAt (timestamp, default now)
   - expiresAt (timestamp, nullable)

   proofResults table:
   - id (auto-increment primary key)
   - requestId (FK to proofRequests, unique)
   - proofHex (text)
   - verificationKeyHex (text)
   - verified (boolean, default false)
   - generatedAt (timestamp, default now)

7. Run Drizzle migration to create the tables.

8. Create /scripts/generate-commitments.ts:
   - Accepts a tenant ID as argument
   - Reads all active shareholder records for that tenant
   - For each: generates random 32-byte salt, computes SHA-256
     of (shares || holder_id || salt), stores as CommitmentRecord
   - Logs: "Generated N commitments for tenant X"

9. Create /server/proof-service.ts:
   - Stub file that exports: generateOwnershipProof(), verifyProof()
   - Both functions are stubs that return placeholder responses
   - Will be implemented in Gate 2

10. Verify: new tables exist in DB, generate-commitments script runs
    without error, existing app still boots, all existing tests pass.
```

---

### GATE 2F — REVISED REPLIT NARRATIVE (Frontend)

```
CONTEXT: Adding zero-knowledge proof UI to the existing React/TypeScript
frontend. The navigation should follow the existing sidebar pattern.

TASK — GATE 2F: FRONTEND SHELL

1. Add a new accordion group to the left sidebar called "Zero Proofs"
   (or "ZK Proofs"), nested under or alongside the Security section.
   This should match the existing accordion/sidebar pattern in the app.

   Sub-items inside the accordion:
   a. "Privacy Vault" — icon: shield — route: /privacy-vault
   b. "Verify" — icon: checkmark — route: /verify
   c. "Audit Proofs" — icon: clipboard — route: /audit-proofs

2. The accordion group should ONLY render when:
   import.meta.env.VITE_NOIR_ENABLED === 'true'

3. Create page components (shells, no backend wiring yet):

   a. PrivacyVaultPage (/privacy-vault):
      - Title: "Privacy Vault"
      - Subtitle: "Generate zero-knowledge proofs to verify ownership
        without exposing your cap table"
      - Empty state: "No proofs generated yet"
      - Button: "Generate Ownership Proof" (disabled)
      - Section: "Recent Proofs" table skeleton

   b. VerifyProofPage (/verify):
      - Title: "Verify a Proof"
      - Subtitle: "Paste a proof ID or verification link to confirm
        ownership claims"
      - Input: "Enter Proof ID or Verification URL"
      - Button: "Verify" (disabled)
      - Result area: empty container

   c. AuditProofsPage (/audit-proofs):
      - Title: "Audit Proofs"
      - Subtitle: "Complete history of all verification events"
      - Table columns: Date, Proof Type, Requester, Status, Actions
      - Empty state: "No audit records yet"

4. Use the SAME design system as existing pages.
5. Verify: existing pages unaffected, no console errors.
```

---

### GATE 2 — REVISED REPLIT NARRATIVE (Backend)

```
CONTEXT: Building on the proof-service stubs from Gate 1. The backend
is Express.js + TypeScript. NoirJS integrates DIRECTLY — no subprocess
needed since we're already in Node.

TASK — GATE 2: NOIR CIRCUIT + API

1. Create Noir circuit: /noir_circuits/ownership_threshold/src/main.nr

   fn main(
       shares: u64,           // PRIVATE
       salt: Field,           // PRIVATE
       threshold: pub u64,    // PUBLIC
       commitment: pub Field  // PUBLIC
   ) {
       let shares_field = shares as Field;
       let computed = std::hash::pedersen_hash([shares_field, salt]);
       assert(computed == commitment, "Commitment mismatch");
       assert(shares >= threshold, "Below threshold");
   }

2. Compile circuit (locally or via nargo if available on Replit).
   Commit compiled ACIR artifact JSON to:
   /noir_circuits/ownership_threshold/target/ownership_threshold.json

3. Implement /server/proof-service.ts:

   import { Noir } from '@noir-lang/noir_js';
   import { UltraHonkBackend } from '@noir-lang/backend_barretenberg';

   - loadCircuit(): reads the compiled ACIR JSON artifact
   - generateOwnershipProof(shares, salt, threshold, commitment):
     creates witness → generates proof → returns { proofHex, vkHex }
   - verifyOwnershipProof(proofHex, vkHex, publicInputs):
     verifies proof → returns boolean

4. Create /server/proof-routes.ts with Express routes:

   POST /api/v1/proofs/ownership
   - Auth required (existing JWT middleware)
   - Body: { holderRef, shareClass, threshold }
   - Looks up CommitmentRecord
   - Calls generateOwnershipProof with private inputs
   - Creates ProofRequest + ProofResult records
   - Returns: { proofId, status, publicInputs, proofHex, vkHex }

   POST /api/v1/proofs/verify
   - Auth required
   - Body: { proofHex, vkHex, publicInputs }
   - Calls verifyOwnershipProof
   - Returns: { valid: boolean, verifiedAt }

   GET /api/v1/proofs/:proofId
   - Auth required
   - Returns proof details for the tenant

5. Register routes in the main Express app.

6. Write tests:
   - Test: 10,000 shares, threshold 5,000 → proof verifies TRUE
   - Test: 3,000 shares, threshold 5,000 → proof generation FAILS
```

---

### GATE 3 — REVISED REPLIT NARRATIVE

```
CONTEXT: Frontend shells exist. Proof API exists. Wire them together
and add the public verification portal.

TASK — GATE 3: WIRE + PUBLIC VERIFY

BACKEND:
1. Add public route (NO auth middleware):
   GET /verify/:proofId
   - Returns: { proofId, proofType, createdAt, expiresAt, status, isValid }
   - Does NOT return: proofHex, vkHex, holder info, tenant info
   - If expired: { status: "expired" }
   - Rate limited: 10 req/min per IP (use express-rate-limit)

2. Add TTL: ProofRequests expire after 72 hours.
   Check on every verify request. Update status to 'expired' if past TTL.

3. Add GET /api/v1/proofs (list, paginated) for audit table.

FRONTEND:
4. Wire PrivacyVaultPage:
   - "Generate Ownership Proof" opens modal:
     dropdown (select holder), input (threshold), "Generate" button
   - Calls POST /api/v1/proofs/ownership
   - Shows loading → success with proof ID + "Copy Verification Link"
   - Link format: {window.location.origin}/verify/{proofId}
   - "Recent Proofs" table fetches from GET /api/v1/proofs

5. Wire VerifyProofPage:
   - Accepts proof ID or URL, parses ID
   - Calls GET /verify/:proofId (public endpoint)
   - Shows ✅ Valid or ❌ Invalid card with details

6. Wire AuditProofsPage:
   - Table from GET /api/v1/proofs (paginated)
   - Columns with status badges, view/re-verify actions

7. Create PublicVerifyPage (standalone, NO auth):
   - Route: /verify/:proofId
   - Tableicty branding, minimal layout
   - Shows verification result ONLY
   - "Verified by Zero-Knowledge Proof" badge
```

---

### GATE 4 — REVISED REPLIT NARRATIVE

```
CONTEXT: Full proof flow works. Add monetization.

TASK — GATE 4: STRIPE + TIER GATING

1. Create /server/proof-config.ts:

   export const TIER_FEATURES = {
     starter: { noirEnabled: false, maxProofsPerMonth: 0 },
     growth: { noirEnabled: true, maxProofsPerMonth: 10,
               overagePriceCents: 2500 },
     enterprise: { noirEnabled: true, maxProofsPerMonth: 100,
                   overagePriceCents: 1500, auditExport: true,
                   confidentialCapTable: true },
   };

2. Create /server/proof-middleware.ts (Express middleware):
   - Checks tenant subscription tier against TIER_FEATURES
   - If !noirEnabled: return 402 { error: "upgrade_required" }
   - If at monthly limit: return 402 { error: "limit_reached" }
   - Attach tier info to request for downstream use

3. Apply middleware to proof generation routes.

4. Add usage tracking:
   - Track proof_count per tenant per billing period
   - Report to Stripe metered billing on each proof generation
   - Reset on billing period rollover (Stripe webhook)

5. Add Stripe webhook handler in server/stripe.ts:
   - customer.subscription.updated → refresh tier flags
   - invoice.payment_succeeded → reset monthly counter

FRONTEND:
6. PrivacyVaultPage: if starter → show upgrade banner with CTA
7. PrivacyVaultPage: if growth/enterprise → show "X of Y proofs used"
8. Handle 402 responses: show upgrade modal, not error
```

---

## ARCHITECT'S DECISION ON NAV STRUCTURE

The Replit agent suggested an **accordion group under Security** instead of flat nav items. 

**DECISION: MODIFY — APPROVED WITH ADJUSTMENT**

Use an accordion called **"Zero Proofs"** (not "ZK Proofs" — too jargon-heavy for non-crypto founders) as a nav group. Sub-items: Privacy Vault, Verify, Audit Proofs. This matches the existing sidebar UX pattern and keeps the information architecture clean.

The Replit agent's instinct is correct here. Flat nav items would clutter the sidebar for users who don't have the feature enabled. An accordion collapses cleanly.

---

## WHAT DOES NOT CHANGE

- Noir circuit specs (.nr files) — identical
- Gate structure and progression — identical
- Monetization model — identical
- Security requirements — identical
- Standing orders (reject/approve criteria) — identical
- Public verify endpoint design — identical
- Feature flag approach — identical
- Pre-compiled ACIR artifact strategy — identical

---

## ARCHITECT'S NOTE

The Replit agent did exactly what a good engineer does: read the plan, identified the stack mismatch, and flagged it BEFORE writing code. This is professional behavior. The gate system worked — we caught a critical assumption error at Gate 0 entry, not at Gate 3 when we'd have to undo work.

The Express/TypeScript stack is actually BETTER for this sprint because:
1. NoirJS is natively JavaScript/TypeScript — no subprocess bridge needed
2. Drizzle schema is co-located — less file jumping
3. The proof worker runs in the same process — lower latency
4. One language across the entire stack — faster debugging

This correction ACCELERATES the timeline, it doesn't slow it down.
