# RESPONSE FOUR — Circuit Design, Mathematical Guarantees, Multi-Tenant Isolation, and Monetization Architecture

## Prepared for: Provisional Patent Application
## Question: "How does the Noir circuit work mathematically? What are the exact constraints? How does multi-tenant isolation apply to the ZKP system? How is access monetized and gated?"

---

## PART A: THE NOIR CIRCUITS — EXACT SOURCE CODE AND MATHEMATICAL CONSTRAINTS

The system contains two compiled Noir circuits, each in its own directory under `noir_circuits/`. Both are compiled with nargo v0.36.0 and executed via NoirJS v0.36.0 + Barretenberg UltraHonk backend v0.36.0.

### A1: The `test_hash` Circuit — Pedersen Commitment Generator

**File**: `noir_circuits/test_hash/src/main.nr` (6 lines)

```noir
use std::hash::pedersen_hash;

fn main(shares: u64, salt: Field) -> pub Field {
    let shares_field = shares as Field;
    pedersen_hash([shares_field, salt])
}
```

**Nargo.toml**: `noir_circuits/test_hash/Nargo.toml`
```toml
[package]
name = "test_hash"
type = "bin"
authors = ["Tableicity"]

[dependencies]
```

**Purpose**: This is a helper circuit. It does not generate a zero-knowledge proof — it computes a Pedersen hash commitment that will later be used as a public input to the main ownership_threshold circuit.

**Inputs**:
| Parameter | Type | Visibility | Description |
|-----------|------|-----------|-------------|
| shares | u64 | Private | The number of shares (unsigned 64-bit integer, max 18,446,744,073,709,551,615) |
| salt | Field | Private | A random value in the BN254 scalar field (truncated to 31 bytes / 248 bits) |

**Output**:
| Parameter | Type | Visibility | Description |
|-----------|------|-----------|-------------|
| return | Field | Public | The Pedersen hash of `[shares_as_field, salt]` — a point on the BN254 elliptic curve, compressed to a single field element |

**Mathematical operation**:

1. `shares` (u64) is cast to a BN254 field element via `shares as Field`. In Noir, this zero-extends the 64-bit unsigned integer into a 254-bit field element. The value is unchanged but is now in the arithmetic field.

2. `pedersen_hash([shares_field, salt])` computes:
   - Takes the two-element array `[shares_field, salt]`
   - Uses Noir's standard library Pedersen hash, which internally:
     a. Maps each input to a point on the Grumpkin curve (the inner curve of BN254)
     b. Computes `G1 * shares_field + G2 * salt` where G1, G2 are fixed generator points
     c. Returns the x-coordinate of the resulting curve point
   - This is a binding and hiding commitment: given the output, you cannot determine the inputs (hiding), and you cannot find different inputs that produce the same output (binding)

3. The return value is marked `pub`, meaning it is a public output visible to anyone who runs the circuit or verifies a proof. However, the inputs (`shares`, `salt`) remain private — the ACIR (Abstract Circuit Intermediate Representation) enforces this at the constraint level.

**Where it's called**: `server/proof-service.ts`, lines 44-54 — the `generatePedersenCommitment()` function.

```typescript
export async function generatePedersenCommitment(shares: number, salt: string): Promise<string> {
  const hashCircuit = getHashCircuit();
  const noir = new Noir(hashCircuit);
  const fieldSalt = toFieldSafeSalt(salt);
  const inputs = {
    shares: shares.toString(),
    salt: fieldSalt,
  };
  const { returnValue } = await noir.execute(inputs);
  return typeof returnValue === 'string' ? returnValue : String(returnValue);
}
```

The result is stored in `commitment_records.pedersenCommitment` and cached — it is only computed once per commitment record (lazy initialization, proof-routes.ts lines 69-75).

### A2: The `ownership_threshold` Circuit — The Core ZKP Circuit

**File**: `noir_circuits/ownership_threshold/src/main.nr` (13 lines)

```noir
use std::hash::pedersen_hash;

fn main(
    shares: u64,
    salt: Field,
    threshold: pub u64,
    commitment: pub Field
) {
    let shares_field = shares as Field;
    let computed = pedersen_hash([shares_field, salt]);
    assert(computed == commitment, "Commitment mismatch");
    assert(shares >= threshold, "Below threshold");
}
```

**Nargo.toml**: `noir_circuits/ownership_threshold/Nargo.toml`
```toml
[package]
name = "ownership_threshold"
type = "bin"
authors = ["Tableicity"]

[dependencies]
```

**Inputs**:
| Parameter | Type | Visibility | Who Knows It |
|-----------|------|-----------|-------------|
| shares | u64 | **Private** | Only the server at proof generation time; never in any proof, response, or log |
| salt | Field | **Private** | Only the server; stored in commitment_records but never exposed via API |
| threshold | u64 | **Public** | The verifier, the prover, anyone inspecting the proof's public inputs |
| commitment | Field | **Public** | The verifier, the prover; this is the Pedersen hash stored in commitment_records |

**Output**: None (the circuit has no return value). It either passes (both assertions hold) or fails (the Noir runtime throws a constraint failure).

**Mathematical constraints — exactly two**:

#### Constraint 1: Commitment Integrity (`assert(computed == commitment)`)

```
pedersen_hash([shares_as_field, salt]) == commitment
```

This proves: "I know a `shares` value and a `salt` that, when Pedersen-hashed together, produce the publicly known `commitment` value."

Why this matters: The commitment was computed from the real cap table data and stored on-chain (in the database). If the prover uses a different shares value or a different salt, the Pedersen hash will not match. The prover cannot lie about their share count because they would need to find a collision in Pedersen hash, which is computationally infeasible (it reduces to the Discrete Logarithm Problem on the Grumpkin curve).

In formal terms:
- **Soundness**: A cheating prover cannot produce a valid proof with `shares ≠ actual_shares` unless they break the binding property of Pedersen commitments (DLP on Grumpkin)
- **Zero-knowledge**: The proof reveals nothing about `shares` or `salt` — only that some valid pair exists satisfying the constraint

#### Constraint 2: Threshold Comparison (`assert(shares >= threshold)`)

```
shares >= threshold
```

This proves: "The shares value I know (which matches the commitment) is greater than or equal to the publicly stated threshold."

Why this matters: This is the business-level claim. An investor or auditor wants to know "Does this stakeholder own at least 5,000 shares?" The circuit proves this without revealing whether they own 5,000, 50,000, or 5,000,000.

In the UltraHonk proving system, the `>=` comparison on u64 values is decomposed into range constraints using Noir's standard library. The u64 type guarantees no underflow/overflow wrapping — the constraint operates on bounded integers, not arbitrary field elements.

**What the circuit proves as a complete statement**:

> "I know values `shares` (a u64) and `salt` (a BN254 field element) such that:
> 1. `pedersen_hash([shares, salt]) == commitment` (the publicly known commitment matches)
> 2. `shares >= threshold` (the share count meets the publicly known threshold)
>
> I can prove this without revealing `shares` or `salt`."

### A3: Proof Generation and Verification — The Full Cryptographic Pipeline

**File**: `server/proof-service.ts`, lines 56-82

```typescript
export async function generateOwnershipProof(input: OwnershipProofInput): Promise<ProofOutput> {
  const circuit = getCircuit();
  const backend = new UltraHonkBackend(circuit);
  const noir = new Noir(circuit);

  try {
    const saltField = toFieldSafeSalt(input.salt);
    const inputs = {
      shares: input.shares.toString(),
      salt: saltField,
      threshold: input.threshold.toString(),
      commitment: input.commitment,
    };

    const { witness } = await noir.execute(inputs);
    const proof = await backend.generateProof(witness);

    const proofHex = Buffer.from(proof.proof).toString('hex');

    const vk = await backend.getVerificationKey();
    const vkHex = Buffer.from(vk).toString('hex');

    return { proofHex, verificationKeyHex: vkHex };
  } finally {
    await backend.destroy();
  }
}
```

**Step-by-step cryptographic pipeline**:

1. **Circuit loading** (line 57): The pre-compiled ACIR circuit JSON is loaded from disk (cached after first load — singleton pattern via `getCircuit()`).

2. **Backend instantiation** (line 58): `new UltraHonkBackend(circuit)` creates a Barretenberg WASM instance. This:
   - Loads the Barretenberg C++ WASM module into memory (~15MB)
   - Constructs the UltraHonk structured reference string (SRS) for the circuit
   - The SRS is circuit-specific and determines the proving/verification key structure

3. **Noir interpreter** (line 59): `new Noir(circuit)` wraps the ACIR circuit for witness generation.

4. **Salt truncation** (line 62): `toFieldSafeSalt()` truncates the 32-byte hex salt to 31 bytes (62 hex characters). This ensures the value fits within the BN254 scalar field modulus p = 21888242871839275222246405745257275088548364400416034343698204186575808495617.

5. **Witness generation** (line 70): `noir.execute(inputs)` runs the ACIR interpreter:
   - Evaluates all constraints symbolically
   - If any `assert` fails, throws an error immediately (e.g., "Below threshold")
   - Produces a witness — the complete assignment of values to every wire in the arithmetic circuit
   - The witness includes private inputs, intermediate values, and public outputs

6. **Proof generation** (line 71): `backend.generateProof(witness)` runs the UltraHonk prover:
   - Takes the witness and the circuit's constraint system
   - Performs polynomial commitments over the BN254 curve
   - Generates a succinct proof (typically 1-3 KB) that encodes the satisfiability of all constraints
   - The proof contains no information about the private inputs (zero-knowledge property)

7. **Verification key extraction** (lines 75-76): `backend.getVerificationKey()` extracts the VK:
   - The VK is derived from the circuit structure (not the witness)
   - It is needed to verify any proof generated from this circuit
   - The VK is deterministic for a given circuit — all proofs use the same VK

8. **Cleanup** (line 80): `backend.destroy()` frees the WASM memory. This is critical because each UltraHonkBackend allocates ~50-100MB of WASM heap.

**Verification** (`server/proof-service.ts`, lines 84-107):

```typescript
export async function verifyOwnershipProof(
  proofHex: string,
  vkHex: string,
  publicInputs: string[],
): Promise<boolean> {
  const circuit = getCircuit();
  const backend = new UltraHonkBackend(circuit);

  try {
    const proofBytes = new Uint8Array(Buffer.from(proofHex, 'hex'));
    const proofData = {
      proof: proofBytes,
      publicInputs,
    };

    const isValid = await backend.verifyProof(proofData);
    return isValid;
  } catch (e) {
    console.error('[proof-service] Verification error:', e);
    return false;
  } finally {
    await backend.destroy();
  }
}
```

The verifier checks the BN254 elliptic curve pairing equation. If the pairing holds, the proof is valid. The verifier does NOT need the private inputs — it only needs the proof bytes, the verification key, and the public inputs (threshold and commitment).

---

## PART B: SALT HANDLING — THE FIELD SAFETY MECHANISM

**File**: `server/proof-service.ts`, lines 38-42

```typescript
function toFieldSafeSalt(salt: string): string {
  const raw = salt.startsWith('0x') ? salt.slice(2) : salt;
  const truncated = raw.substring(0, 62);
  return '0x' + truncated;
}
```

**Why this exists**: The BN254 scalar field has modulus p ≈ 2^254. A 32-byte (256-bit) random value could exceed p, which would cause the Noir runtime to silently reduce it modulo p. This would mean the salt used in the circuit differs from the salt stored in the database, causing the commitment to not match.

**Solution**: Truncate to 31 bytes (62 hex characters = 248 bits). Since 248 < 254, the truncated value is always less than p, guaranteeing no modular reduction.

**Mathematical guarantee**: For any 31-byte value v, v < 2^248 < p ≈ 2^254, therefore v mod p = v. The salt in the circuit is identical to the salt in the database.

---

## PART C: MULTI-TENANT ISOLATION IN THE ZKP SYSTEM

### C1: Database-Level Isolation

Tableicity uses PostgreSQL **schema-per-tenant** isolation. Each tenant gets its own PostgreSQL schema (e.g., `tenant_acme`, `tenant_globex`). The ZKP tables (`commitment_records`, `proof_requests`, `proof_results`, `proof_usage`) are provisioned per-tenant within each schema.

**File**: `server/tenant.ts` — handles schema creation, table provisioning, and tenant switching.

This means:
- Tenant A's commitment records are in `tenant_a.commitment_records`
- Tenant B's commitment records are in `tenant_b.commitment_records`
- There is no shared table where data from multiple tenants could leak

### C2: Application-Level Isolation — The `tenantMiddleware`

All authenticated ZKP endpoints pass through `tenantMiddleware` (registered in `server/routes.ts`, line 151):

```typescript
app.use("/api/v1/proofs", requireAuth, tenantMiddleware, proofRouter);
```

The `tenantMiddleware`:
1. Reads the tenant slug from the user's session
2. Resolves the tenant's PostgreSQL schema
3. Sets `req.tenantSlug` for downstream route handlers
4. Switches the database connection to use the tenant's schema via `SET search_path`

Every proof route then uses `getAuthorizedTenantId(req)` (proof-routes.ts, lines 37-42):

```typescript
async function getAuthorizedTenantId(req: Request): Promise<string | null> {
  const slug = req.tenantSlug;
  if (!slug) return null;
  const tenant = await getTenant(slug);
  return tenant?.id || null;
}
```

**Cross-tenant query is impossible** because:
1. The SQL queries execute against the tenant-specific schema (set by `tenantMiddleware`)
2. Even if a malicious user crafted a request with a different tenant's proof ID, the query would search within their own schema, which contains no matching records
3. The `getProofRequest` query in `storage.ts` executes against `this._db`, which is already scoped to the tenant schema

### C3: Proof Isolation — What Happens at Boundaries

**Authenticated proof detail** (`GET /api/v1/proofs/:proofId`, proof-routes.ts lines 197-240):
```typescript
const proofRequest = await storage.getProofRequest(proofId);
if (!proofRequest || proofRequest.tenantId !== tenantId) {
  return res.status(404).json({ error: 'Proof not found' });
}
```
Even within a tenant-scoped query, the code double-checks `proofRequest.tenantId !== tenantId` and returns 404 if there's a mismatch. This is defense-in-depth.

**Public verify** (`GET /api/v1/verify/:proofId`, proof-routes.ts lines 280-314):
This endpoint does NOT use tenant middleware (it's on the `publicRouter`). It queries `proof_requests` by UUID directly. Since proof IDs are UUIDs (122 bits of randomness), an external party cannot enumerate proofs belonging to a specific tenant. The response contains no tenant identifier.

### C4: Commitment-Level Isolation

Commitment records are created per-tenant during sandbox seeding (`server/seed.ts`). Each commitment links to the tenant's own cap table data:
- `holderRef` is the stakeholder UUID from the tenant's stakeholder table
- `shareClass` is the share class UUID from the tenant's share class table
- `salt` is a 32-byte random value generated independently per commitment
- `commitmentHash` is derived from the tenant's actual cap table values

There is no global commitment registry. Each tenant's commitment records are isolated in their schema.

---

## PART D: MONETIZATION AND ACCESS GATING — THE FOUR-GATE ARCHITECTURE

The ZKP system uses a four-layer access control mechanism that ties proof generation to subscription tiers.

### D1: Gate 1 — Feature Flag (Frontend)

**File**: `client/src/App.tsx` — The sidebar "Zero Proofs" accordion is only rendered when `VITE_NOIR_ENABLED=true`.

If this environment variable is not set to `true`, the Privacy Vault, Verify Proof, and Audit Proofs sidebar items are completely hidden. Users on plans without Noir access never see the feature.

### D2: Gate 2 — Tier Configuration (Server)

**File**: `server/proof-config.ts` (29 lines)

Two configuration sets exist: production and beta.

**Production tier configuration** (lines 9-15):
```typescript
const PROOF_TIER_PRODUCTION: Record<string, ProofTierConfig> = {
  trial:        { noirEnabled: false, maxProofsPerMonth: 0,   overagePriceCents: 0 },
  standard:     { noirEnabled: false, maxProofsPerMonth: 0,   overagePriceCents: 0 },
  starter:      { noirEnabled: false, maxProofsPerMonth: 0,   overagePriceCents: 0 },
  professional: { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 2500 },
  enterprise:   { noirEnabled: true,  maxProofsPerMonth: 100, overagePriceCents: 1500 },
};
```

**Beta tier configuration** (lines 17-23, currently active via `BETA_MODE = true` on line 7):
```typescript
const PROOF_TIER_BETA: Record<string, ProofTierConfig> = {
  trial:        { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 0 },
  standard:     { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 0 },
  starter:      { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 0 },
  professional: { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 2500 },
  enterprise:   { noirEnabled: true,  maxProofsPerMonth: 100, overagePriceCents: 1500 },
};
```

The `BETA_MODE` flag (line 7) controls which configuration is active:
```typescript
const BETA_MODE = true;
export const PROOF_TIER_CONFIG = BETA_MODE ? PROOF_TIER_BETA : PROOF_TIER_PRODUCTION;
```

**Key difference**: In beta mode, ALL tiers (including trial and starter) get Noir access with 10 proofs/month at no charge. In production mode, only Professional ($149/mo) and Enterprise ($399/mo) have access.

The `getProofTierConfig()` function (lines 27-29) resolves any plan string to its config, falling back to `starter` for unknown plans:
```typescript
export function getProofTierConfig(plan: string): ProofTierConfig {
  return PROOF_TIER_CONFIG[plan] || PROOF_TIER_CONFIG.starter;
}
```

### D3: Gate 3 — Access Middleware (Server)

**File**: `server/proof-middleware.ts` (86 lines)

**`checkProofAccess` middleware** (lines 11-56) — gates `POST /api/v1/proofs/ownership`:

```typescript
export async function checkProofAccess(req: Request, res: Response, next: NextFunction) {
  const slug = req.tenantSlug;
  const tenant = await getTenant(slug);
  const config = getProofTierConfig(tenant.plan);

  // Gate A: Is Noir enabled for this tier?
  if (!config.noirEnabled) {
    return res.status(402).json({
      error: 'upgrade_required',
      message: 'Privacy Vault requires a Professional or Enterprise plan.',
      currentPlan: tenant.plan,
    });
  }

  // Gate B: Has the tenant exceeded their monthly limit?
  const billingMonth = getCurrentBillingMonth(); // "YYYY-MM" format
  const usage = await storage.getProofUsage(tenant.id, billingMonth);
  const currentCount = usage?.proofCount || 0;

  if (currentCount >= config.maxProofsPerMonth) {
    return res.status(402).json({
      error: 'limit_reached',
      message: `Monthly proof limit of ${config.maxProofsPerMonth} reached.`,
      currentCount,
      limit: config.maxProofsPerMonth,
      overagePriceCents: config.overagePriceCents,
    });
  }

  // Pass through — attach config and usage for downstream handlers
  req.proofTierConfig = config;
  req.proofUsageCount = currentCount;
  req.proofBillingMonth = billingMonth;
  next();
}
```

Two sub-gates in sequence:

**Gate A — Feature enablement**: If the tenant's plan has `noirEnabled: false`, the request is rejected with HTTP 402 (Payment Required) and error code `upgrade_required`. The frontend catches this and shows the upgrade dialog.

**Gate B — Usage limit**: If the tenant has used all their monthly proofs, the request is rejected with HTTP 402 and error code `limit_reached`. The response includes the current count, the limit, and the overage price in cents, allowing the frontend to show a specific message.

If both gates pass, the middleware attaches `proofTierConfig`, `proofUsageCount`, and `proofBillingMonth` to the request object for use by the proof generation handler.

**`checkProofReadAccess` middleware** (lines 58-85) — a lighter version that only checks Gate A (feature enablement), not usage. Used for read-only proof endpoints where no new proofs are generated.

### D4: Gate 4 — Usage Tracking (Database)

**Schema**: `shared/schema.ts`, lines 561-570

```typescript
export const proofUsage = pgTable("proof_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  billingMonth: varchar("billing_month", { length: 7 }).notNull(), // "YYYY-MM"
  proofCount: integer("proof_count").notNull().default(0),
  lastResetAt: text("last_reset_at"),
  updatedAt: text("updated_at"),
}, (table) => ({
  tenantMonthUnique: uniqueIndex("proof_usage_tenant_month_idx").on(table.tenantId, table.billingMonth),
}));
```

**Critical design**: The `UNIQUE` constraint on `(tenant_id, billing_month)` ensures exactly one usage record per tenant per month. This prevents double-counting and race conditions.

**Atomic increment**: `server/storage.ts`, lines 636-646

```typescript
async incrementProofUsage(tenantId: string, billingMonth: string): Promise<ProofUsage> {
  const now = new Date().toISOString();
  const result = await this._db.execute(sql`
    INSERT INTO proof_usage (id, tenant_id, billing_month, proof_count, updated_at)
    VALUES (gen_random_uuid(), ${tenantId}, ${billingMonth}, 1, ${now})
    ON CONFLICT (tenant_id, billing_month) DO UPDATE
    SET proof_count = proof_usage.proof_count + 1, updated_at = ${now}
    RETURNING *
  `);
  return result.rows[0] as unknown as ProofUsage;
}
```

This uses PostgreSQL's `INSERT ... ON CONFLICT DO UPDATE` (upsert) pattern:
- First proof of the month: INSERTs a new row with `proof_count = 1`
- Subsequent proofs: UPDATEs the existing row, incrementing `proof_count` by 1
- **Atomic**: The upsert is a single SQL statement — no TOCTOU race between checking and incrementing
- **Idempotent per billing month**: The `ON CONFLICT` clause handles the uniqueness constraint automatically
- **No manual reset needed**: When a new month starts (e.g., `"2026-04"` → `"2026-05"`), the first proof simply creates a new row with `proof_count = 1`. Old months' records remain for audit.

**When the increment happens**: Only on successful proof generation (proof-routes.ts, lines 105-107):

```typescript
if (req.proofBillingMonth) {
  await storage.incrementProofUsage(tenantId, req.proofBillingMonth);
}
```

If proof generation fails (circuit constraint not satisfied, WASM error, etc.), the usage is NOT incremented. The user is not charged for failed attempts.

---

## PART E: THE FRONTEND MONETIZATION UX

### E1: Usage Meter (Privacy Vault Page)

**File**: `client/src/pages/privacy-vault.tsx`, lines 441-458

When `noirEnabled` is true and `maxProofs > 0`, the page displays a usage meter:

```tsx
<Card data-testid="card-usage-meter">
  <CardContent className="py-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">Monthly Proof Usage</span>
      <span className="text-sm text-muted-foreground">
        {currentCount} of {maxProofs} proofs used
      </span>
    </div>
    <Progress value={usagePercent} className="h-2" />
    {currentCount >= maxProofs && (
      <p className="text-xs text-amber-600 mt-2">
        Monthly limit reached. Upgrade to Enterprise for higher limits.
      </p>
    )}
  </CardContent>
</Card>
```

The progress bar fills proportionally. When the limit is reached, amber warning text appears.

### E2: Upgrade Banner (Non-Enabled Plans)

**File**: `client/src/pages/privacy-vault.tsx`, lines 420-438

When `noirEnabled` is false, the entire proof generation UI is hidden and replaced with an upgrade CTA:

```tsx
<Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5">
  <CardContent className="flex items-center gap-6 py-6">
    <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center">
      <ArrowUpCircle className="h-7 w-7 text-amber-500" />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-lg">Upgrade to unlock Privacy Vault</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Zero-knowledge proofs are available on Professional and Enterprise plans.
      </p>
    </div>
    <Button onClick={() => setLocation("/profile")}>
      <Zap className="h-4 w-4 mr-2" />
      Upgrade Plan
    </Button>
  </CardContent>
</Card>
```

The "Upgrade Plan" button navigates to `/profile` where the user can select a higher-tier plan via Stripe Checkout.

### E3: Upgrade Dialog (Triggered by 402 Responses)

**File**: `client/src/pages/privacy-vault.tsx`, lines 552-581

When a proof generation attempt returns HTTP 402 (either `upgrade_required` or `limit_reached`), a dialog appears showing the two paid tiers:

- **Professional — $149/mo**: 10 proofs/month, Privacy Vault access
- **Enterprise — $399/mo**: 100 proofs/month, priority support

The dialog has a "View Plans" button that navigates to `/profile` for Stripe Checkout.

### E4: Usage Data Endpoint

**File**: `server/proof-routes.ts`, lines 164-195 — `GET /api/v1/proofs/usage`

This authenticated endpoint returns the tenant's current usage state:

```json
{
  "plan": "professional",
  "noirEnabled": true,
  "maxProofsPerMonth": 10,
  "currentCount": 3,
  "billingMonth": "2026-04",
  "overagePriceCents": 2500
}
```

The frontend queries this on page load via TanStack Query (`queryKey: ["/api/v1/proofs/usage"]`) and uses the response to render the usage meter, determine if the generate button should be enabled, and decide whether to show the upgrade banner.

---

## PART F: COMPLETE ACCESS CONTROL DECISION TREE

```
User clicks "Generate Ownership Proof"
        │
        ▼
┌─── GATE 1: Feature Flag ───┐
│ VITE_NOIR_ENABLED=true?    │
│   NO → Sidebar hidden,     │
│         user never sees     │
│         Privacy Vault       │
│   YES → Continue            │
└──────────┬──────────────────┘
           ▼
┌─── GATE 2: Tier Check ─────┐
│ noirEnabled for plan?       │
│   NO → 402 upgrade_required │
│         Upgrade dialog shown│
│   YES → Continue            │
└──────────┬──────────────────┘
           ▼
┌─── GATE 3: Usage Limit ────┐
│ currentCount < maxProofs?   │
│   NO → 402 limit_reached   │
│         Limit warning shown │
│   YES → Continue            │
└──────────┬──────────────────┘
           ▼
┌─── GATE 4: Proof Gen ──────┐
│ SHA-256 preimage check      │
│ Pedersen commitment (lazy)  │
│ Noir circuit execution      │
│ UltraHonk proof generation  │
│ Barretenberg verification   │
│   FAIL → 422, no usage      │
│          increment          │
│   PASS → Store proof,       │
│          increment usage,   │
│          return proofId     │
└─────────────────────────────┘
```

---

*End of Response Four.*
