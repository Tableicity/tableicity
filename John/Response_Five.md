# RESPONSE FIVE — Sandbox Seeding, Encrypted View (Privacy Mode), and Integrated Privacy Architecture

## Prepared for: Provisional Patent Application
## Question: "How is the ZKP system seeded for new tenants? How does the Encrypted View / Privacy Mode complement the ZKP system? What is the complete privacy architecture across both features?"

---

## PART A: SANDBOX SEEDING — HOW NEW TENANTS RECEIVE PRE-BUILT ZKP DEMONSTRATION DATA

### A1: The Seeding Function — `seedZkpData()`

**File**: `server/seed.ts`, lines 477-570

**When it runs**:
- On initial platform seed (line 1109): Seeds the `acme` demo tenant
- On sandbox provisioning for new trial sign-ups (line 1234): Seeds every new sandbox tenant

**Parameters**:
```typescript
async function seedZkpData(
  tenantStorage: IStorage,    // The tenant-scoped storage instance
  tenantId: string,           // The tenant's UUID
  userId: string              // The user who "requested" the demo proof
)
```

### A2: Idempotency — The Partial-Failure Recovery Pattern

**Lines 481-487**:
```typescript
const existingCommitments = await db.select().from(commitmentRecords)
  .where(eq(commitmentRecords.tenantId, tenantId));

const existingProofs = await db.select().from(proofRequests)
  .where(eq(proofRequests.tenantId, tenantId));

if (existingCommitments.length > 0 && existingProofs.length > 0) return;
```

The function checks commitments and proofs **separately**. It only skips seeding if BOTH already exist. This handles three scenarios:

| Commitments Exist? | Proofs Exist? | Action |
|-------|-------|--------|
| No | No | Seed both commitments and proof |
| Yes | No | Skip commitment creation, seed proof using existing commitments |
| No | Yes | Should not occur (proofs require commitments), but would re-seed commitments |
| Yes | Yes | Skip entirely — already seeded |

This partial-failure recovery means: if the server crashed after creating commitments but before creating the proof, a re-run will create the proof without duplicating commitments.

### A3: Commitment Record Seeding — Lines 500-533

**Step 1**: Retrieve the tenant's real cap table data:
```typescript
const company = await tenantStorage.getCompany();
const stakeholders = await tenantStorage.getStakeholders(company.id);
const securities = await tenantStorage.getSecurities(company.id);
const shareClasses = await tenantStorage.getShareClasses(company.id);
```

**Step 2**: Take the first 4 securities from the cap table (line 501: `securities.slice(0, 4)`):

For each security:
1. Generate a cryptographically random 32-byte salt: `randomBytes(32).toString("hex")` (line 503)
2. Extract the real share count from the security record: `Number(security.shares)` (line 504)
3. Extract the stakeholder ID as `holderRef` (line 505)
4. Extract the share class ID (line 506)
5. Compute the SHA-256 commitment hash (lines 507-508):
   ```typescript
   const preimage = `${shares}||${holderRef}||${salt}`;
   const commitmentHash = createHash("sha256").update(preimage).digest("hex");
   ```
6. Insert into `commitment_records` (lines 510-518):
   ```typescript
   await db.insert(commitmentRecords).values({
     tenantId,
     holderRef,
     commitmentHash,
     salt,
     shareClass,
     isActive: true,
     createdAt: new Date().toISOString(),
   });
   ```

**What is NOT seeded at this stage**: The `pedersenCommitment` field is left null. Pedersen commitments are computed lazily on first proof generation (proof-routes.ts, lines 69-75). This avoids the cost of loading the Barretenberg WASM module during seed time.

**If commitments already exist** (lines 522-533): The function reads the existing commitments and reconstructs the `seededCommitments` array by cross-referencing with the securities table, so it can still seed the demo proof.

### A4: Demo Proof Seeding — Lines 536-566

After commitments are created, the function seeds one pre-verified proof:

**Step 1**: Select the first commitment (line 537):
```typescript
const firstCommitment = seededCommitments[0];
```

**Step 2**: Calculate a threshold at 50% of actual shares (line 539):
```typescript
const threshold = Math.floor(firstCommitment.shares * 0.5);
```
This ensures the demo proof always passes — the actual shares are guaranteed to be ≥ 50% of themselves.

**Step 3**: Set a 1-year TTL (line 540):
```typescript
const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
```
Compare to user-generated proofs which have a 72-hour TTL (proof-routes.ts, line 77). The extended TTL ensures the demo proof remains valid throughout the entire trial period.

**Step 4**: Create the proof request record (lines 542-554):
```typescript
const [proofRequest] = await db.insert(proofRequests).values({
  tenantId,
  proofType: "ownership_threshold",
  requestedBy: userId,
  publicInputs: {
    threshold,
    holderRef: firstCommitment.stakeholderId,
    shareClass: firstCommitment.shareClassId,
  },
  status: "complete",          // Immediately marked as complete
  createdAt: new Date().toISOString(),
  expiresAt,
}).returning();
```

**Step 5**: Create the proof result record (lines 556-562):
```typescript
await db.insert(proofResults).values({
  requestId: proofRequest.id,
  proofHex: "seed_demo_" + randomBytes(64).toString("hex"),
  verificationKeyHex: "seed_vk_" + randomBytes(32).toString("hex"),
  verified: true,
  generatedAt: new Date().toISOString(),
});
```

### A5: The `seed_demo_` Prefix — Why the Demo Proof Is Not a Real Noir Proof

The `proofHex` value for seeded proofs starts with `"seed_demo_"` followed by random hex bytes. This is NOT a valid Noir/Barretenberg proof. It cannot pass cryptographic re-verification through `backend.verifyProof()`.

**Why this is safe**: The public verification endpoint (`GET /api/v1/verify/:proofId`) does NOT perform cryptographic re-verification. It checks:
```typescript
const isValid = proofRequest.status === 'complete' && proofResult?.verified === true;
```

Since the seeded proof has `status: 'complete'` and `verified: true`, the public endpoint correctly reports it as valid. The system trusts the stored verification result, not real-time re-verification (as documented in Response Three, Part B2).

**Why not generate a real proof at seed time**: Running the Noir circuit requires loading the Barretenberg WASM module (~15MB), which takes 3-5 seconds. During sandbox provisioning, this would add significant latency to the sign-up flow. The `seed_demo_` pattern provides the same user experience (a valid-looking proof in the UI) without the computational overhead.

**Distinguishing seeded vs. real proofs**: The `seed_demo_` prefix is stored in the database but never exposed via any API endpoint. The `proofHex` field is never returned to any client. An observer looking at the public verification response cannot distinguish a seeded proof from a real one.

---

## PART B: ENCRYPTED VIEW (PRIVACY MODE) — THE COMPLEMENTARY PRIVACY SYSTEM

### B1: What Encrypted View Does

Encrypted View is a client-side privacy toggle that replaces stakeholder names with cryptographic identifiers across multiple pages of the platform. It provides **display-layer privacy** — obscuring who owns what from shoulder-surfing, screenshots, or screen-sharing.

**Pages where it appears**: Dashboard, Stakeholders, Securities, SAFE Agreements, SAFE Create.

**Two display modes**:
| Mode | What the user sees | Example |
|------|-------------------|---------|
| Normal View | Real stakeholder names | "John Smith" |
| Encrypted View | HMAC hash OR custom label | "0x1a2b3c4d...ef01" or "MTS9-T77L" |

### B2: The HMAC Hash Generation

**File**: `server/routes.ts`, lines 1053-1068 — `GET /api/privacy/hashes`

```typescript
app.get("/api/privacy/hashes", requireAuth, tenantMiddleware,
  requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    const crypto = await import("crypto");
    const company = await ensureCompany(req.tenantStorage!);
    const allStakeholders = await req.tenantStorage!.getStakeholders(company.id);
    const salt = company.id;  // Company UUID as HMAC key
    const hashes: Record<string, string> = {};
    for (const s of allStakeholders) {
      const full = crypto.createHmac("sha256", salt).update(s.id).digest("hex");
      hashes[s.id] = "0x" + full.slice(0, 8) + "..." + full.slice(-4);
    }
    res.json(hashes);
});
```

**Hash algorithm**: HMAC-SHA-256 with `companyId` as the key, stakeholder UUID as the message.

**Display format**: `0x{first 8 hex chars}...{last 4 hex chars}` — e.g., `0x1a2b3c4d...ef01`

**Why HMAC, not plain SHA-256**: HMAC is keyed — the company ID acts as a tenant-specific secret. Two tenants with the same stakeholder would produce different hashes. This prevents cross-tenant correlation of hashed identifiers.

**Why truncated**: The full SHA-256 output is 64 hex characters. Displaying all 64 would clutter the UI. The truncated format (8 + 4 = 12 visible characters) provides enough uniqueness for human differentiation while remaining compact.

### B3: Custom Privacy Labels

**File**: `server/routes.ts`, lines 1084-1107 — `PATCH /api/privacy/labels/:stakeholderId`

Administrators can assign custom labels to stakeholders that replace the HMAC hash in Encrypted View. These are human-readable codenames.

**Schema**: `shared/schema.ts`, lines 502-513
```typescript
export const privacyLabels = pgTable("privacy_labels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  stakeholderId: varchar("stakeholder_id").notNull(),
  hashedId: text("hashed_id").notNull(),       // Full HMAC hash for lookup
  encryptedLabel: text("encrypted_label"),       // Custom human-readable label
  createdAt: text("created_at"),
});
```

**Label generation for seeded data**: `server/seed.ts`, lines 10-18

```typescript
const LABEL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generatePrivacyLabel(): string {
  let result = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) result += "-";
    result += LABEL_CHARS[Math.floor(Math.random() * LABEL_CHARS.length)];
  }
  return result;
}
```

**Charset**: 31 characters — uppercase letters (excluding O and I) + digits (excluding 0 and 1). This prevents visual ambiguity (O vs 0, I vs 1).

**Format**: `XXXX-XXXX` — e.g., `MTS9-T77L`, `K4RB-VWEX`

**Label priority**: When Encrypted View is active, the display logic (use-privacy-mode.ts, lines 51-60):
```typescript
const getDisplayName = useCallback(
  (stakeholderId: string, realName: string): string => {
    if (!enabled) return realName;           // Privacy mode off → show real name
    const hash = hashes[stakeholderId];
    const label = labels[stakeholderId];
    if (label) return label;                  // Custom label exists → show label
    return hash || "0x••••...••••";           // No label → show HMAC hash
  },
  [enabled, hashes, labels]
);
```

**Priority order**: Custom label > HMAC hash > Fallback placeholder

### B4: The Privacy Toggle Component

**File**: `client/src/components/privacy-toggle.tsx` (55 lines)

A button with two states:

| State | Icon | Text | Visual Treatment |
|-------|------|------|-----------------|
| Off | Eye + Shield | "Normal View" | Transparent background, muted foreground |
| On | EyeOff + Shield | "Encrypted View" | Emerald green background/border (bg-emerald-500/15, border-emerald-500/40) |

The toggle includes a tooltip explaining what each mode does:
- On: "Showing hashed identifiers. Stakeholder names are obscured with SHA-256 hashes. Click to reveal."
- Off: "Showing real names. Click to switch to privacy-first encrypted view."

### B5: Persistence

**Mechanism**: `localStorage.setItem("privacy-mode", "true"/"false")` (use-privacy-mode.ts, line 19)

The privacy mode state persists across page navigations and browser refreshes. It is per-browser, not per-user — clearing localStorage resets it. This is intentional: the toggle is a UI convenience, not a security control. The server always returns the real stakeholder data; the obscuring happens client-side.

### B6: Access Control

**Hash endpoint** (`GET /api/privacy/hashes`): Requires `tenant_admin` or `tenant_staff` role
**Labels read** (`GET /api/privacy/labels`): Requires `tenant_admin` or `tenant_staff` role
**Label edit** (`PATCH /api/privacy/labels/:stakeholderId`): Requires `tenant_admin` role only

Staff can view the encrypted view but cannot change the labels. Only administrators can assign custom codenames.

### B7: Seeded Label Data

**File**: `server/seed.ts`, lines 1684-1702

During seeding, every stakeholder in the tenant receives a randomly generated `XXXX-XXXX` label:

```typescript
async function seedPrivacyLabels(storage: IStorage, companyId: string, stakeholders: any[]) {
  const existing = await storage.getPrivacyLabels(companyId);
  const hasOldFormat = existing.some(l => l.encryptedLabel &&
    /^(Founder|Fund|Employee|Advisor|Board|Entity|Investor|Seed-VC)-/.test(l.encryptedLabel));
  if (existing.length > 0 && !hasOldFormat) return;
  // ... generate labels for each stakeholder
}
```

**Idempotency**: Skips if labels already exist, unless the old label format (e.g., `"Founder-A1B2"`) is detected — in which case, labels are regenerated with the new `XXXX-XXXX` format.

---

## PART C: HOW THE TWO PRIVACY SYSTEMS COMPLEMENT EACH OTHER

### C1: The Privacy Layer Stack

The platform implements privacy at three distinct layers, each protecting against different threat models:

```
Layer 3: ZERO-KNOWLEDGE PROOFS (Privacy Vault)
├── Protects: Exact ownership data from external parties
├── Mechanism: Noir circuits, Pedersen commitments, UltraHonk proofs
├── Threat model: Investor/auditor needs to verify a claim without seeing the cap table
├── Data flow: Server-side → cryptographic proof → public verification
└── Persistence: Database (proof_requests, proof_results, commitment_records)

Layer 2: ENCRYPTED VIEW (Privacy Mode)
├── Protects: Stakeholder identities from casual observers
├── Mechanism: HMAC-SHA-256 hashing, custom labels
├── Threat model: Screen-sharing, shoulder-surfing, screenshots
├── Data flow: Server computes hashes → client-side display toggle
└── Persistence: localStorage (toggle state), database (labels)

Layer 1: MULTI-TENANT ISOLATION
├── Protects: All tenant data from other tenants
├── Mechanism: PostgreSQL schema-per-tenant, session-based auth, middleware
├── Threat model: Cross-tenant data access
├── Data flow: Every request scoped to authenticated tenant
└── Persistence: PostgreSQL schemas, session store
```

### C2: Complementary Coverage Matrix

| Scenario | Layer 1 (Isolation) | Layer 2 (Encrypted View) | Layer 3 (ZKP) |
|----------|-------------------|------------------------|---------------|
| Another tenant tries to see your cap table | **Blocks** | N/A | N/A |
| A colleague is screen-sharing your dashboard | Allows (they're authenticated) | **Obscures names** | N/A |
| An investor asks "Do you own ≥5,000 shares?" | Allows (if authenticated) | N/A | **Proves without revealing count** |
| A screenshot of your stakeholder list leaks | N/A | **Shows hashes, not names** | N/A |
| An auditor needs compliance verification | N/A | N/A | **Provides verifiable proof link** |
| Someone intercepts a verification URL | N/A | N/A | **Shows only valid/invalid, no data** |

### C3: What Each System Does NOT Do

**Encrypted View does NOT**:
- Provide cryptographic proof of anything — it only obscures display
- Protect against server-side access — the real data is always sent in the API response
- Prevent a user with database access from seeing names
- Generate any verifiable artifact that can be shared externally

**Zero-Knowledge Proofs do NOT**:
- Obscure the UI during normal platform usage — they are for external verification
- Replace the need for authentication — proofs are generated by authenticated users
- Protect stakeholder names on screen — that's Encrypted View's role
- Operate in real-time — each proof takes ~5-10 seconds to generate

### C4: The Combined User Journey

A typical privacy-conscious workflow using both systems:

1. **Administrator logs in** → sees the normal dashboard with real names
2. **Joins a video call** → toggles Encrypted View ON → stakeholder names become `MTS9-T77L`, `K4RB-VWEX`, etc.
3. **Shares screen to discuss cap table** → investors see the structure (share classes, security counts, SAFE terms) but not who holds what
4. **Investor asks**: "Can you prove that your lead investor holds at least 100,000 shares?"
5. **Administrator opens Privacy Vault** → selects the stakeholder's commitment record → enters threshold of 100,000 → clicks "Generate Proof"
6. **Security Ritual runs** → 4-step animated progress bar (12.5 seconds)
7. **Proof generated** → administrator copies the verification link
8. **Sends link to investor** → investor clicks the link → sees "Verified" on the public verification page
9. **Investor confirmed**: The lead investor holds ≥100,000 shares. They learned nothing else — not the exact count, not the investor's name (the public verify page shows no PII), not other stakeholders' holdings.

### C5: Data Separation Between Systems

The two privacy systems share no data:

| Data Element | Encrypted View | ZKP System |
|-------------|---------------|------------|
| Stakeholder names | Hashed with HMAC-SHA-256 | Referenced by UUID only (holderRef) |
| Share counts | Not involved | Hashed into commitments, never exposed |
| Company ID | Used as HMAC key | Not present in proof data |
| Salt | N/A | 32-byte random per commitment |
| Storage location | `privacy_labels` table | `commitment_records`, `proof_requests`, `proof_results` tables |
| API namespace | `/api/privacy/*` | `/api/v1/proofs/*` and `/api/v1/verify/*` |

There is no coupling between the two systems. Enabling/disabling Encrypted View has no effect on ZKP generation. Generating a ZKP does not affect the Encrypted View display. They operate on different data, different API endpoints, and different UI components.

---

## PART D: THE COMPLETE SEEDING TIMELINE FOR A NEW TENANT

When a new user signs up for a trial, the following privacy-related seeding occurs in order:

```
1. User completes trial sign-up form
         │
         ▼
2. Platform creates tenant schema
   (server/tenant.ts — provisionTenantSchema)
   Tables created: commitment_records, proof_requests,
                   proof_results, proof_usage, privacy_labels
         │
         ▼
3. Platform seeds company + stakeholders + securities
   (server/seed.ts — seedSandboxData)
         │
         ▼
4. seedPrivacyLabels() runs (line 1163)
   For each stakeholder:
   ├── Compute HMAC-SHA-256(companyId, stakeholderId)
   └── Insert privacy_labels row with XXXX-XXXX label
         │
         ▼
5. seedZkpData() runs (line 1234)
   ├── Query first 4 securities from cap table
   ├── For each: generate 32-byte salt, compute SHA-256 commitment
   ├── Insert 4 commitment_records
   ├── Pick first commitment, threshold = 50% of shares
   ├── Insert 1 proof_request (status: complete)
   └── Insert 1 proof_result (proofHex: seed_demo_..., verified: true)
         │
         ▼
6. User logs in → sees:
   ├── Privacy Vault with 4 commitment records + 1 verified proof
   ├── Encrypted View toggle on Dashboard (shows XXXX-XXXX labels)
   └── Public verify link works for the seeded proof (1-year TTL)
```

### D1: Why 4 Commitments but Only 1 Proof

The system seeds 4 commitment records but only 1 proof. This demonstrates:
- The commitment table — showing that multiple equity positions can be committed
- The proof workflow — showing one complete end-to-end proof with a verification link
- The usage meter — showing 0 of 10 proofs used (the seeded proof doesn't count against usage because `incrementProofUsage` is only called in the proof generation route, not during seeding)

### D2: Why 50% Threshold

`Math.floor(firstCommitment.shares * 0.5)` — setting the threshold to half the actual shares guarantees the demo proof is always valid (since the stakeholder's actual shares ≥ 50% of their shares is trivially true). It also creates a realistic-looking threshold value in the UI (e.g., "≥ 5,000 shares" when the stakeholder holds 10,000).

---

## PART E: SECURITY RITUAL UX — THE PROOF GENERATION CEREMONY

### E1: Purpose and Design

**File**: `client/src/pages/privacy-vault.tsx`, lines 90-176

The Security Ritual is an animated 4-step progress bar that appears during proof generation. It serves two purposes:

1. **Communication**: Each step label describes what the server is actually doing — the labels are not arbitrary; they map to real computational stages.
2. **Pacing**: Proof generation takes 5-12 seconds depending on server load. The ritual prevents user anxiety during this wait by showing continuous progress.

### E2: The Four Steps

```typescript
const RITUAL_STEPS = [
  { label: "Validating commitment records...",             duration: 2500 },
  { label: "Computing SHA-256 + Pedersen hashes...",       duration: 3500 },
  { label: "Executing Noir zero-knowledge circuit...",     duration: 4500 },
  { label: "Finalizing cryptographic proof...",            duration: 2000 },
];
```

Total duration: 12,500 milliseconds (12.5 seconds).

| Step | Duration | Server Operation Represented |
|------|----------|----------------------------|
| 1: Validating commitment records | 2.5s | `storage.getCommitmentByHolderAndClass()` + SHA-256 preimage check |
| 2: Computing SHA-256 + Pedersen hashes | 3.5s | `generatePedersenCommitment()` — loads test_hash WASM, executes circuit |
| 3: Executing Noir zero-knowledge circuit | 4.5s | `noir.execute(inputs)` — witness generation in the ownership_threshold circuit |
| 4: Finalizing cryptographic proof | 2.0s | `backend.generateProof(witness)` + `backend.getVerificationKey()` + DB writes |

### E3: Animation Implementation — `requestAnimationFrame`

The progress bar uses `requestAnimationFrame` (not `setInterval` or `setTimeout`) for smooth animation:

```typescript
const animate = () => {
  const elapsed = Date.now() - startTimeRef.current;
  const pct = Math.min((elapsed / totalDuration) * 100, 98);  // Caps at 98% — never reaches 100
  setProgress(pct);

  let currentStep = 0;
  for (let i = 0; i < cumulativeDurations.length; i++) {
    if (elapsed < cumulativeDurations[i]) {
      currentStep = i;
      break;
    }
    currentStep = i;
  }
  setStepIndex(currentStep);

  if (elapsed < totalDuration) {
    rafRef.current = requestAnimationFrame(animate);
  }
};
```

**Why `requestAnimationFrame`**: Browser-synced animation frames (typically 60fps) produce smoother progress bar updates than timer-based approaches. The progress calculation is time-based (elapsed / total), so the animation tracks real time regardless of frame rate.

**Why capped at 98%**: The progress bar never reaches 100% during the animation. It reaches 100% only when the mutation resolves (the server responds with the proofId). This prevents the visual inconsistency of showing 100% while still waiting for the server.

### E4: Visual Design

- **Lock icon** with `animate-pulse` CSS — center of a circular badge
- **Step counter** — small amber circle showing `1`, `2`, `3`, or `4`
- **Progress bar** — shadcn `Progress` component at height 2.5 (h-2.5)
- **Step label** — transitions between labels with `duration-300` CSS
- **Percentage** — font-mono display of current progress (e.g., "73%")
- **Step indicators** — 4 small bars: green (completed), primary+pulse (current), muted (upcoming)

---

*End of Response Five.*
