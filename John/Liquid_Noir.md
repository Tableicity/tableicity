# LIQUID ENCRYPTION — NOIR ZERO-KNOWLEDGE PROOF INTEGRATION GUIDE
## Drafted by the Tableicity Architect | Source: Tableicity Privacy Vault (Production)

---

## WHAT THIS DOCUMENT IS

This is a field-tested blueprint for adding Zero-Knowledge Proofs (ZKP) to your application using Aztec's Noir language and NoirJS. Every pattern in here is taken directly from a working production implementation on Tableicity — the equity management platform that pioneered this approach. Your Liquid Encryption agent should treat this as the trail map. The trail has already been blazed.

---

## YOUR CONTEXT: LIQUID ENCRYPTION

| Aspect | Liquid Encryption | Tableicity (Reference) |
|--------|------------------|----------------------|
| Core Product | AI-powered story-based file authentication | Equity/cap table management |
| What Gets Proved | "This document was correctly reconstituted from its shredded liquid state" | "This stakeholder owns ≥ X shares without revealing the exact number" |
| Private Inputs | Document hash, shred manifest, story authentication score | Share count, salt |
| Public Inputs | Document ID commitment, authenticity threshold | Ownership threshold, Pedersen commitment |
| Who Verifies | Document recipient, auditor, compliance officer | Investor, regulator, counterparty |

**The circuit logic is different. The architecture is identical.**

---

## PART 1: THE NOIR STACK — EXACT VERSIONS (DO NOT DEVIATE)

### Package Versions (Locked)
```
nargo: v0.36.0
@noir-lang/noir_js: v0.36.0
@noir-lang/backend_barretenberg: v0.36.0
```

**WARNING**: These three packages must be the same version. Mixing versions causes cryptic WASM failures. Tableicity locked these after extensive compatibility testing. Do not upgrade unless you are prepared to recompile all circuits and retest.

### Installation
```bash
npm install @noir-lang/noir_js@0.36.0 @noir-lang/backend_barretenberg@0.36.0
```

For the Noir compiler (nargo), if your Replit supports it:
```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
noirup -v 0.36.0
```

If nargo cannot be installed on your Replit (common limitation), you compile circuits locally and commit the compiled JSON artifact to the repo. NoirJS only needs the compiled artifact, not the compiler.

---

## PART 2: THE GATE SYSTEM — HOW TO BUILD THIS WITHOUT BREAKING EVERYTHING

Tableicity used a 5-gate progression. Each gate has an entry condition and exit criteria. No gate opens until the previous one passes. This discipline is why it worked.

### Gate 0: Foundation (Prove the toolchain works)
**Entry**: Nothing exists yet
**Task**: 
1. Install the npm packages above
2. Write a trivial test circuit (see Part 3)
3. Compile it, load it with NoirJS, generate a proof, verify it
4. Log "NoirJS proof generation: SUCCESS"

**Exit**: The test proof verifies. Your existing app still boots. Nothing broke.

### Gate 1: Commitment Engine (Data layer)
**Entry**: Gate 0 passed
**Task**:
1. Add database tables for commitments, proof requests, and proof results (see Part 4)
2. Write a script to generate commitments from your existing data
3. Create stub functions for proof generation and verification

**Exit**: Tables exist, commitments generate, existing app unaffected.

### Gate 2: Circuit + API (The real proof)
**Entry**: Gate 1 passed
**Task**:
1. Write your actual Noir circuit (see Part 5 for Liquid Encryption's circuit)
2. Compile it, commit the ACIR artifact
3. Implement the proof service (generate + verify)
4. Create API routes
5. Build frontend shell pages

**Exit**: You can generate a real proof from the API and verify it.

### Gate 3: Wire Frontend + Public Verify
**Entry**: Gate 2 passed
**Task**:
1. Connect frontend pages to the proof API
2. Add public verification endpoint (no auth required, rate-limited)
3. Add proof TTL (72 hours is Tableicity's default)

**Exit**: End-to-end flow works. External party can verify a proof via URL.

### Gate 4: Monetization + Tier Gating
**Entry**: Gate 3 passed
**Task**:
1. Add tier configuration (which plans get how many proofs)
2. Add middleware that checks tier before allowing proof generation
3. Add usage tracking per billing period
4. Add upgrade CTAs for gated users

**Exit**: Free tier users see upgrade prompts. Paid users generate proofs within their limits.

---

## PART 3: TEST CIRCUIT (Gate 0)

This is the "hello world" of Noir. Your agent writes this first to prove the toolchain works.

### File: `noir_circuits/test_hash/src/main.nr`
```noir
use std::hash::pedersen_hash;

fn main(shares: u64, salt: Field) -> pub Field {
    let shares_field = shares as Field;
    pedersen_hash([shares_field, salt])
}
```

This circuit takes two private inputs, hashes them with Pedersen, and returns the hash as a public output. It proves: "I know the preimage of this hash" without revealing the preimage.

### Compile
```bash
cd noir_circuits/test_hash
nargo compile
```
This produces `target/test_hash.json` — the compiled ACIR artifact that NoirJS loads at runtime.

### Test Script Pattern
```typescript
import { Noir } from '@noir-lang/noir_js';
import { readFileSync } from 'fs';

const circuit = JSON.parse(readFileSync('noir_circuits/test_hash/target/test_hash.json', 'utf-8'));
const noir = new Noir(circuit);

const result = await noir.execute({
  shares: "10000",
  salt: "0x1234abcd..."  // 62 hex chars max (31 bytes) — see salt rules below
});

console.log("Pedersen hash:", result.returnValue);
console.log("NoirJS proof generation: SUCCESS");
```

---

## PART 4: DATABASE SCHEMA (Gate 1)

Tableicity uses Drizzle ORM with PostgreSQL. Adapt to whatever ORM your Liquid Encryption Replit uses. The table structure is what matters.

### Table 1: `commitment_records`
| Column | Type | Notes |
|--------|------|-------|
| id | auto-increment PK | |
| tenant_id | FK to tenants/orgs | Multi-tenancy scoping |
| holder_ref | varchar(64) | Opaque reference to the entity (document ID, user ID, etc.) |
| commitment_hash | varchar(128) | SHA-256 hex of (data \|\| holder_ref \|\| salt) |
| pedersen_commitment | varchar(128), nullable | Computed on first use, then cached |
| salt | varchar(64) | Random per record — see salt rules |
| share_class | varchar(32) | Category/type field (for you: "document", "fragment", etc.) |
| created_at | timestamp | |
| is_active | boolean, default true | Soft delete |

**Unique constraint**: `(tenant_id, holder_ref, share_class)` — one commitment per entity per category per tenant.

### Table 2: `proof_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | auto-increment PK | |
| tenant_id | FK | |
| proof_type | varchar(32) | e.g., 'ownership_threshold', 'document_authenticity' |
| requested_by | FK to users | Who triggered it |
| public_inputs | jsonb, default {} | The non-secret inputs to the circuit |
| status | varchar(16), default 'pending' | pending → generating → complete / failed / expired |
| created_at | timestamp | |
| expires_at | timestamp, nullable | TTL enforcement |

### Table 3: `proof_results`
| Column | Type | Notes |
|--------|------|-------|
| id | auto-increment PK | |
| request_id | FK to proof_requests, UNIQUE | One result per request |
| proof_hex | text | The generated proof (NEVER expose via API) |
| verification_key_hex | text | VK for verification |
| verified | boolean, default false | Has it been verified? |
| generated_at | timestamp | |

### Table 4: `proof_usage` (for monetization)
| Column | Type | Notes |
|--------|------|-------|
| id | auto-increment PK | |
| tenant_id | FK | |
| billing_month | varchar(7) | Format: "2026-03" |
| proof_count | integer, default 0 | Atomic increment |

**Unique constraint**: `(tenant_id, billing_month)` — enables `INSERT ... ON CONFLICT DO UPDATE` for atomic increment.

---

## PART 5: YOUR CIRCUIT — LIQUID ENCRYPTION DOCUMENT AUTHENTICITY

Here is where Liquid Encryption diverges from Tableicity. Tableicity proves "I own ≥ X shares." You need to prove "This document was authentically reconstituted."

### Proposed Circuit: `noir_circuits/document_authenticity/src/main.nr`
```noir
use std::hash::pedersen_hash;

fn main(
    authenticity_score: u64,    // PRIVATE — the AI's authentication score (0-100)
    salt: Field,                // PRIVATE — random salt for this document
    threshold: pub u64,         // PUBLIC  — minimum score to consider authentic (e.g., 80)
    commitment: pub Field       // PUBLIC  — Pedersen hash of (score, salt)
) {
    // Step 1: Verify the commitment matches the private inputs
    let score_field = authenticity_score as Field;
    let computed = pedersen_hash([score_field, salt]);
    assert(computed == commitment, "Commitment mismatch");

    // Step 2: Prove the score meets the threshold
    assert(authenticity_score >= threshold, "Below authenticity threshold");
}
```

**What this proves**: "The AI scored this document reconstitution at or above the threshold" — without revealing the exact score.

**Why this matters for Liquid Encryption**: A third party (auditor, recipient, compliance officer) can verify that a document's story-based authentication passed without knowing the actual authentication score, the story content, or the document fragments.

### Alternative Circuit: Fragment Count Proof
If you also want to prove the document was properly shredded/reconstituted:
```noir
use std::hash::pedersen_hash;

fn main(
    fragment_count: u64,        // PRIVATE — number of fragments the doc was shredded into
    reconstituted_count: u64,   // PRIVATE — number successfully reconstituted
    salt: Field,                // PRIVATE
    completeness_threshold: pub u64,  // PUBLIC — minimum % completeness (e.g., 95)
    commitment: pub Field       // PUBLIC — Pedersen hash of (fragment_count, salt)
) {
    let fc_field = fragment_count as Field;
    let computed = pedersen_hash([fc_field, salt]);
    assert(computed == commitment, "Commitment mismatch");

    // Prove completeness: reconstituted/total >= threshold/100
    // Use integer math to avoid floating point
    assert(reconstituted_count * 100 >= completeness_threshold * fragment_count,
           "Below completeness threshold");
}
```

### Compile
```bash
cd noir_circuits/document_authenticity
nargo compile
```
Commit `target/document_authenticity.json` to the repo.

---

## PART 6: THE PROOF SERVICE (Gate 2)

This is the core backend module. Direct translation from Tableicity's working implementation.

### File: `server/proof-service.ts` (or equivalent in your stack)
```typescript
import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@noir-lang/backend_barretenberg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// --- Interfaces ---

export interface AuthenticityProofInput {
  authenticityScore: number;
  salt: string;
  threshold: number;
  commitment: string;
}

export interface ProofOutput {
  proofHex: string;
  verificationKeyHex: string;
}

// --- Circuit Loading (cached) ---

let circuitJSON: any = null;
function getCircuit() {
  if (!circuitJSON) {
    const path = resolve(process.cwd(), 'noir_circuits/document_authenticity/target/document_authenticity.json');
    circuitJSON = JSON.parse(readFileSync(path, 'utf-8'));
  }
  return circuitJSON;
}

let hashCircuitJSON: any = null;
function getHashCircuit() {
  if (!hashCircuitJSON) {
    const path = resolve(process.cwd(), 'noir_circuits/test_hash/target/test_hash.json');
    hashCircuitJSON = JSON.parse(readFileSync(path, 'utf-8'));
  }
  return hashCircuitJSON;
}

// --- CRITICAL: Salt Handling ---
// BN254 field modulus is ~254 bits. Salts MUST be truncated to 31 bytes (62 hex chars)
// to fit within the field. This caused silent failures until we figured it out.

function toFieldSafeSalt(salt: string): string {
  const raw = salt.startsWith('0x') ? salt.slice(2) : salt;
  const truncated = raw.substring(0, 62);  // 31 bytes = 62 hex chars
  return '0x' + truncated;
}

// --- Pedersen Commitment Generation ---
// Uses the test_hash helper circuit to compute Pedersen hashes.
// Computed once per record, then cached in the commitment_records table.

export async function generatePedersenCommitment(score: number, salt: string): Promise<string> {
  const hashCircuit = getHashCircuit();
  const noir = new Noir(hashCircuit);
  const fieldSalt = toFieldSafeSalt(salt);
  const inputs = {
    shares: score.toString(),  // The test_hash circuit uses "shares" as the param name
    salt: fieldSalt,
  };
  const { returnValue } = await noir.execute(inputs);
  return typeof returnValue === 'string' ? returnValue : String(returnValue);
}

// --- Proof Generation ---

export async function generateAuthenticityProof(input: AuthenticityProofInput): Promise<ProofOutput> {
  const circuit = getCircuit();
  const backend = new UltraHonkBackend(circuit);
  const noir = new Noir(circuit);

  const fieldSalt = toFieldSafeSalt(input.salt);

  const inputs = {
    authenticity_score: input.authenticityScore.toString(),
    salt: fieldSalt,
    threshold: input.threshold.toString(),
    commitment: input.commitment,
  };

  const { witness } = await noir.execute(inputs);
  const proof = await backend.generateProof(witness);
  const vk = await backend.getVerificationKey();

  return {
    proofHex: Buffer.from(proof.proof).toString('hex'),
    verificationKeyHex: Buffer.from(vk).toString('hex'),
  };
}

// --- Proof Verification ---

export async function verifyAuthenticityProof(
  proofHex: string,
  vkHex: string,
  publicInputs: string[]
): Promise<boolean> {
  const circuit = getCircuit();
  const backend = new UltraHonkBackend(circuit);

  const proofBuffer = Uint8Array.from(Buffer.from(proofHex, 'hex'));
  const vkBuffer = Uint8Array.from(Buffer.from(vkHex, 'hex'));

  const proof = { proof: proofBuffer, publicInputs };
  const isValid = await backend.verifyProof(proof, vkBuffer);
  return isValid;
}
```

---

## PART 7: API ROUTES (Gate 2-3)

### Route Structure
```
POST /api/v1/proofs/authenticity      — Generate a proof (auth required, tier-gated)
POST /api/v1/proofs/verify            — Verify a proof (auth required)
GET  /api/v1/proofs/:proofId          — Get proof details (auth required)
GET  /api/v1/proofs                   — List proofs for audit (auth required)
GET  /api/v1/proofs/usage             — Get usage stats (auth required)
GET  /api/v1/verify/:proofId          — Public verify (NO auth, rate-limited, CORS enabled)
```

### Public Verify Endpoint — Critical Design Decisions
The public verify endpoint is what makes ZKP useful to external parties. Key rules from Tableicity:

1. **No authentication required** — anyone with the proof ID can verify
2. **Rate-limited**: 10 requests per minute per IP
3. **CORS enabled**: `Access-Control-Allow-Origin: *`
4. **Returns status ONLY** — no PII, no proof hex, no tenant info, no holder info
5. **Response format**:
```json
{
  "proofId": 42,
  "proofType": "document_authenticity",
  "status": "complete",
  "isValid": true,
  "createdAt": "2026-03-29T...",
  "expiresAt": "2026-04-01T..."
}
```

### Proof TTL
Proofs expire after 72 hours by default. On every verify request, check if `expiresAt < now` and update status to "expired" if so. Seeded demo proofs can use a 1-year TTL.

---

## PART 8: MONETIZATION GATING (Gate 4)

### Tier Configuration
```typescript
export interface ProofTierConfig {
  noirEnabled: boolean;
  maxProofsPerMonth: number;
  overagePriceCents: number;
}

// Beta mode: everyone gets access during testing
const BETA_MODE = true;

const PRODUCTION_TIERS: Record<string, ProofTierConfig> = {
  free:         { noirEnabled: false, maxProofsPerMonth: 0,   overagePriceCents: 0 },
  starter:      { noirEnabled: false, maxProofsPerMonth: 0,   overagePriceCents: 0 },
  professional: { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 2500 },
  enterprise:   { noirEnabled: true,  maxProofsPerMonth: 100, overagePriceCents: 1500 },
};

const BETA_TIERS: Record<string, ProofTierConfig> = {
  free:         { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 0 },
  starter:      { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 0 },
  professional: { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 2500 },
  enterprise:   { noirEnabled: true,  maxProofsPerMonth: 100, overagePriceCents: 1500 },
};

export const PROOF_TIER_CONFIG = BETA_MODE ? BETA_TIERS : PRODUCTION_TIERS;
```

### Middleware Pattern
Apply before any proof generation route:
```typescript
export async function checkProofAccess(req, res, next) {
  const tenant = await getTenant(req.tenantSlug);
  const config = getProofTierConfig(tenant.plan);

  if (!config.noirEnabled) {
    return res.status(402).json({ error: 'upgrade_required' });
  }

  const usage = await getProofUsage(tenant.id, getCurrentBillingMonth());
  if (usage.proofCount >= config.maxProofsPerMonth) {
    return res.status(402).json({ error: 'limit_reached', limit: config.maxProofsPerMonth });
  }

  next();
}
```

### Usage Tracking (Atomic)
```sql
INSERT INTO proof_usage (tenant_id, billing_month, proof_count)
VALUES ($1, $2, 1)
ON CONFLICT (tenant_id, billing_month) DO UPDATE
SET proof_count = proof_usage.proof_count + 1;
```

---

## PART 9: FRONTEND — SECURITY RITUAL UX

This is Tableicity's signature UX pattern for proof generation. Instead of a boring spinner, the user sees an animated multi-step progress bar that communicates what's happening cryptographically.

### Steps for Liquid Encryption
1. "Validating document commitment records..." (0-25%)
2. "Computing SHA-256 + Pedersen hashes..." (25-50%)
3. "Executing Noir zero-knowledge circuit..." (50-85%)
4. "Finalizing cryptographic proof..." (85-100%)

### Implementation Pattern
```tsx
const RITUAL_STEPS = [
  { label: "Validating document commitment records...", target: 25 },
  { label: "Computing SHA-256 + Pedersen hashes...", target: 50 },
  { label: "Executing Noir zero-knowledge circuit...", target: 85 },
  { label: "Finalizing cryptographic proof...", target: 100 },
];

// Use requestAnimationFrame for smooth progress animation
// Each step advances on a timer while the actual API call runs
// When the API resolves, jump to 100% and show the result
```

The actual proof generation happens as a single API call. The ritual steps are UX theater timed to the expected duration (~5-15 seconds). The animation uses `requestAnimationFrame` with proper cleanup on unmount.

---

## PART 10: SANDBOX SEEDING — DEMO WITHOUT REAL CRYPTOGRAPHY

New users need to see the feature working immediately. Tableicity seeds sandbox tenants with pre-computed data:

1. **4 commitment records** from the first 4 entities in the system
2. **1 pre-verified proof** with a 1-year TTL

The seeded proof uses a `seed_demo_` prefix on its proofHex — it's not a real Noir proof. The verify endpoint checks `status === 'complete' && verified === true` — no cryptographic re-verification. This means the demo works without running the Noir circuit.

### Seeding Function Pattern
```typescript
async function seedZkpData(tenantId: string) {
  // Check if commitments already exist (idempotent)
  const existing = await getCommitments(tenantId);
  if (existing.length === 0) {
    // Create commitment records for first 4 entities
    for (const entity of entities.slice(0, 4)) {
      const salt = randomBytes(32).toString('hex');
      const preimage = `${entity.value}||${entity.ref}||${salt}`;
      const hash = createHash('sha256').update(preimage).digest('hex');
      await createCommitment({ tenantId, holderRef: entity.ref, commitmentHash: hash, salt, ... });
    }
  }

  // Check if proofs already exist (idempotent — separate check)
  const existingProofs = await getProofs(tenantId);
  if (existingProofs.length === 0) {
    // Create one pre-verified demo proof
    const proofRequest = await createProofRequest({ tenantId, proofType: 'document_authenticity', status: 'complete', ... });
    await createProofResult({ requestId: proofRequest.id, proofHex: 'seed_demo_...', verified: true, ... });
  }
}
```

**Key**: Check commitments and proofs independently. If seeding fails halfway (commitments created, proofs failed), the next run will only create the missing proofs. This was a real bug we caught.

---

## PART 11: SECURITY RULES — NON-NEGOTIABLE

These rules are absolute. They come from the Tableicity architect's standing orders.

1. **Private inputs NEVER appear in any API response** — shares/scores, salts, story content
2. **proofHex is NEVER exposed in any frontend-facing endpoint** — only verification status
3. **Public verify returns status only** — no PII, no tenant info, no holder info
4. **Salt values are truncated to 31 bytes (62 hex chars)** — BN254 field constraint
5. **Rate limit public endpoints** — 10 requests/min per IP minimum
6. **Enable trust proxy** if behind a reverse proxy (Replit, AWS ALB, etc.) — needed for accurate IP-based rate limiting
7. **Feature flag the entire ZKP section** — if `NOIR_ENABLED` env var is not `true`, the sidebar section and routes should not render/register
8. **Proof generation errors must not leak circuit details** — return generic "Proof generation failed" to the client

---

## PART 12: LESSONS LEARNED (SAVE YOUR AGENT HOURS)

These are real issues hit during the Tableicity implementation:

### 1. Salt Overflow
**Problem**: 32-byte random salts (64 hex chars) overflow the BN254 field modulus (~254 bits).
**Solution**: Always truncate to 31 bytes (62 hex chars) before passing to Noir. Use `toFieldSafeSalt()`.

### 2. Pedersen vs SHA-256
**Problem**: You need both. SHA-256 for data integrity (linking to your real data). Pedersen for the Noir circuit (it's the hash Noir can compute efficiently).
**Solution**: Store both. `commitmentHash` = SHA-256 (for data verification). `pedersenCommitment` = Pedersen (for the circuit). Compute Pedersen lazily on first proof generation, then cache it.

### 3. Circuit Input Types
**Problem**: Noir expects string representations of numbers, not actual numbers.
**Solution**: Always `.toString()` all numeric inputs before passing to the circuit.

### 4. Pre-compiled Artifacts
**Problem**: nargo may not install on your deployment environment.
**Solution**: Compile circuits locally, commit the `target/*.json` files to the repo. NoirJS loads JSON artifacts at runtime — it doesn't need the compiler.

### 5. WASM Memory
**Problem**: UltraHonkBackend allocates significant WASM memory. Can cause issues in memory-constrained environments.
**Solution**: Don't keep backends alive indefinitely. Create → use → let GC collect. Cache only the circuit JSON, not the backend instances.

### 6. Idempotent Seeding
**Problem**: Seed script ran twice, created duplicate commitments.
**Solution**: Check for existing records before inserting. Use unique constraints as a safety net. Check commitments and proofs independently — partial failures happen.

### 7. Environment Variable Gating
**Problem**: ZKP sidebar showed for all users during development.
**Solution**: Gate the sidebar accordion on `VITE_NOIR_ENABLED=true` (frontend) and routes on `NOIR_ENABLED=true` (backend). In production, only enable when the feature is ready.

---

## PART 13: FILE STRUCTURE FOR LIQUID ENCRYPTION

```
liquid-encryption/
├── noir_circuits/
│   ├── test_hash/
│   │   ├── src/main.nr                    ← Gate 0: hello world circuit
│   │   ├── Nargo.toml
│   │   └── target/test_hash.json          ← Compiled artifact (commit this)
│   │
│   └── document_authenticity/
│       ├── src/main.nr                    ← Gate 2: your real circuit
│       ├── Nargo.toml
│       └── target/document_authenticity.json  ← Compiled artifact (commit this)
│
├── server/ (or wherever your backend lives)
│   ├── proof-service.ts                   ← NoirJS integration
│   ├── proof-routes.ts                    ← Express/API routes
│   ├── proof-middleware.ts                ← Tier gating middleware
│   └── proof-config.ts                   ← Tier definitions + BETA_MODE flag
│
├── client/src/ (or frontend equivalent)
│   └── pages/
│       ├── privacy-vault.tsx              ← Main proof generation page
│       ├── verify-proof.tsx               ← Internal verify page
│       ├── audit-proofs.tsx               ← Proof history/audit
│       └── public-verify.tsx              ← Public verify (no auth)
│
├── scripts/
│   └── generate-commitments.ts            ← Seed/migration script
│
└── shared/
    └── schema.ts                          ← Database tables (add proof tables here)
```

### Nargo.toml (for each circuit)
```toml
[package]
name = "document_authenticity"
type = "bin"
authors = [""]
compiler_version = ">=0.36.0"

[dependencies]
```

---

## PART 14: QUICK-START SEQUENCE FOR YOUR AGENT

Give your Liquid Encryption agent these instructions in order:

1. **"Read Liquid_Noir.md completely before writing any code."**

2. **"Gate 0: Install @noir-lang/noir_js@0.36.0 and @noir-lang/backend_barretenberg@0.36.0. Create the test_hash circuit from Part 3. Compile it (or use the pre-compiled artifact if nargo isn't available). Write a test script that generates and verifies a proof. Log SUCCESS or FAILED. Do not modify any existing files."**

3. **"Gate 1: Add the four database tables from Part 4 to the schema. Create a commitment generation script. Create proof-service.ts with stub functions. Verify existing app still boots."**

4. **"Gate 2: Create the document_authenticity circuit from Part 5. Implement proof-service.ts from Part 6. Create API routes from Part 7. Build frontend shell pages. Test: score 85, threshold 80 → proof verifies TRUE. Score 70, threshold 80 → proof generation FAILS."**

5. **"Gate 3: Wire frontend to API. Add public verify endpoint. Add proof TTL (72 hours). Add Security Ritual progress animation from Part 9."**

6. **"Gate 4: Add tier config from Part 8. Add proof access middleware. Add usage tracking. Add upgrade CTAs for gated users."**

---

## ARCHITECT'S NOTE

The Noir ZKP stack on Tableicity went through 5 gates, a stack correction (Django → Express), salt truncation bugs, WASM compatibility issues, and a full monetization layer. Every pattern in this document comes from that lived experience.

Your Liquid Encryption agent has a significant advantage: this trail is already blazed. The circuit logic will be different (document authenticity vs. ownership threshold), but the infrastructure — the proof service, the API routes, the database schema, the tier gating, the security rules, the seeding strategy, the frontend ritual — is identical.

Follow the gates. Lock the versions. Truncate the salts. Never expose private inputs.

Good luck.

— *The Tableicity Architect*
