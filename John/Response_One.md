# RESPONSE ONE — Code Integration: How NOIR Is Implemented Within the Backend and Frontend

## Prepared for: Provisional Patent Application
## Question: "Can you walk us through how NOIR is implemented within the Django backend and React frontend? What specific libraries or custom code handle ZKP generation?"

---

## CORRECTION TO THE QUESTION

The question references a "Django backend." This is inaccurate. Tableicity's backend is **Express.js + TypeScript**, not Django. This was identified and corrected at Gate 0 of the Noir sprint (documented in the Architect's Correction Order, March 26, 2026). The correction is material because it means the ZKP engine runs natively in the same JavaScript/TypeScript runtime as the backend — no subprocess bridge, no inter-process communication, no language boundary. The proof worker executes within the same Node.js process as the API server.

---

## PART A: THE LIBRARIES — EXACT PACKAGES AND VERSIONS

Three external packages from Aztec Labs form the cryptographic foundation. All three are version-locked to v0.36.0. Mixing versions causes WASM binary incompatibilities.

### 1. `@noir-lang/noir_js` (v0.36.0)
- **Source**: Aztec Labs (https://github.com/noir-lang/noir)
- **Role**: Executes compiled Noir circuits. Takes a compiled circuit artifact (JSON) and input values, produces a "witness" — the complete set of intermediate computed values that satisfy the circuit's constraints.
- **Specific functions used**:
  - `new Noir(circuitJSON)` — instantiates a circuit executor from a pre-compiled ACIR (Abstract Circuit Intermediate Representation) artifact
  - `noir.execute(inputs)` — runs the circuit with given inputs, producing a witness and any public return values
- **Where imported**: `server/proof-service.ts`, line 1

### 2. `@noir-lang/backend_barretenberg` (v0.36.0)
- **Source**: Aztec Labs
- **Role**: Implements the UltraHonk proving system built on the Barretenberg cryptographic library. Takes a witness from NoirJS and produces a zero-knowledge proof — a compact binary blob that cryptographically attests that the circuit's constraints were satisfied, without revealing the private inputs.
- **Specific functions used**:
  - `new UltraHonkBackend(circuitJSON)` — instantiates a proving backend, allocating WASM memory for the BN254 elliptic curve arithmetic
  - `backend.generateProof(witness)` — takes the witness, executes the multi-scalar multiplication and polynomial commitment operations, returns `{ proof: Uint8Array, publicInputs: string[] }`
  - `backend.getVerificationKey()` — extracts the verification key from the structured reference string (SRS), returned as a `Uint8Array`
  - `backend.verifyProof(proofData)` — takes a proof and public inputs, returns a boolean indicating whether the proof is valid
  - `backend.destroy()` — releases WASM memory (called in `finally` blocks to prevent memory leaks)
- **Where imported**: `server/proof-service.ts`, line 2

### 3. `nargo` (v0.36.0) — Noir Compiler
- **Role**: Compiles `.nr` (Noir language) source files into ACIR JSON artifacts. The compiler is used at build time, not at runtime. The compiled artifacts are committed to the repository. The runtime only loads the JSON.
- **Usage**: Invoked locally via command line: `cd noir_circuits/ownership_threshold && nargo compile`
- **Output**: `noir_circuits/ownership_threshold/target/ownership_threshold.json` — a JSON file containing the circuit's ACIR bytecode, ABI (input/output definitions), and constraint count

### Additional Libraries Used in the Proof Pipeline

- **Node.js `crypto` module (built-in)**: Used for SHA-256 hash computation in `server/proof-routes.ts`, line 3. The SHA-256 hash verifies data integrity before the Noir circuit runs. This is standard library, not a third-party dependency.
- **`zod`**: Runtime schema validation for all proof API inputs (proof-routes.ts, line 2). Validates that holderRef, shareClass, shares, and threshold are the correct types before any cryptographic operation begins.
- **`express-rate-limit`**: Rate-limits the public verification endpoint to 10 requests per minute per IP address (proof-routes.ts, line 4).

---

## PART B: THE CIRCUITS — CUSTOM NOIR CODE

Two custom Noir circuits exist in the codebase. Both are written in the Noir language (a Rust-like domain-specific language for zero-knowledge circuits).

### Circuit 1: `test_hash` — Pedersen Commitment Generator
**File**: `noir_circuits/test_hash/src/main.nr`

```noir
use std::hash::pedersen_hash;

fn main(shares: u64, salt: Field) -> pub Field {
    let shares_field = shares as Field;
    pedersen_hash([shares_field, salt])
}
```

**Purpose**: This circuit computes a Pedersen hash of two private inputs (a share count and a salt value) and returns the hash as a public output. It serves two roles:
1. **Gate 0 validation**: Proves the Noir toolchain is functional (the original "hello world" test)
2. **Production commitment generation**: Called by `generatePedersenCommitment()` in `server/proof-service.ts` to compute the Pedersen commitment that the ownership threshold circuit later verifies against

**Inputs**:
- `shares` (u64, private): The number of shares held by a stakeholder
- `salt` (Field, private): A random value unique to each commitment record, truncated to 31 bytes (248 bits) to fit within the BN254 elliptic curve field modulus

**Output**:
- A single Field element (public): The Pedersen hash of `[shares_as_field, salt]`

**Key technical detail**: The `pedersen_hash` function is from Noir's standard library (`std::hash::pedersen_hash`). It performs an elliptic curve operation on the BN254 curve — specifically, it maps the input array to a curve point via fixed-base scalar multiplication and returns the x-coordinate. This is algebraically efficient inside a ZK circuit (low constraint count), unlike SHA-256 which would require thousands of additional constraints.

### Circuit 2: `ownership_threshold` — The Core Proof Circuit
**File**: `noir_circuits/ownership_threshold/src/main.nr`

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

**Purpose**: This is the production circuit that generates the actual zero-knowledge proof. It proves two statements simultaneously:
1. "I know a share count and salt that hash to this public commitment" (commitment verification)
2. "The share count I know is greater than or equal to the public threshold" (ownership threshold)

**Inputs**:
- `shares` (u64, **private**): The actual number of shares — NEVER revealed
- `salt` (Field, **private**): The per-record salt — NEVER revealed
- `threshold` (u64, **public**): The minimum ownership threshold being proved
- `commitment` (Field, **public**): The previously computed Pedersen hash that the proof is verified against

**Constraints**:
1. `assert(computed == commitment)` — Ensures the prover actually knows the real share count and salt, not arbitrary values. Without this, someone could fabricate a proof with any shares value.
2. `assert(shares >= threshold)` — Ensures the real share count meets the threshold. If the actual shares are below the threshold, the circuit fails and no proof is generated.

**What the verifier sees**: Only the threshold value and the commitment hash. The verifier learns "this party holds at least X shares" without learning the actual number.

---

## PART C: THE BACKEND INTEGRATION — FILE-BY-FILE WALKTHROUGH

### File 1: `server/proof-service.ts` (108 lines)

This is the core cryptographic engine. It exports three functions:

#### `generatePedersenCommitment(shares: number, salt: string): Promise<string>`
- **Lines 44-54**
- Loads the `test_hash` compiled circuit artifact (cached after first load)
- Instantiates a NoirJS executor
- Passes the shares and field-safe salt as inputs
- Executes the circuit (no proof generation — just computation)
- Returns the Pedersen hash as a hex string
- **Called by**: `proof-routes.ts` when a commitment record doesn't yet have a cached Pedersen commitment
- **Caching behavior**: The result is stored in the `pedersenCommitment` column of the `commitment_records` table. Subsequent proofs for the same record skip this computation.

#### `generateOwnershipProof(input: OwnershipProofInput): Promise<ProofOutput>`
- **Lines 56-82**
- Loads the `ownership_threshold` compiled circuit artifact (cached)
- Instantiates an `UltraHonkBackend` (allocates WASM memory for the proving system)
- Instantiates a Noir executor
- Calls `toFieldSafeSalt()` to truncate the salt to 31 bytes (62 hex characters) — required because the BN254 field modulus is approximately 2^254, and a full 32-byte value could overflow
- Converts all numeric inputs to strings (Noir circuits expect string representations)
- Calls `noir.execute(inputs)` to generate the witness
- Calls `backend.generateProof(witness)` to produce the ZK proof
- Calls `backend.getVerificationKey()` to extract the VK
- Serializes both as hex strings
- Calls `backend.destroy()` in a `finally` block to release WASM memory
- **Returns**: `{ proofHex: string, verificationKeyHex: string }`
- **Error behavior**: If the circuit constraints fail (e.g., shares < threshold), NoirJS throws an exception. The calling route catches this and returns "Holdings do not meet the specified threshold."

#### `verifyOwnershipProof(proofHex: string, vkHex: string, publicInputs: string[]): Promise<boolean>`
- **Lines 84-107**
- Instantiates a fresh `UltraHonkBackend`
- Deserializes the proof and verification key from hex back to `Uint8Array`
- Calls `backend.verifyProof(proofData)` which performs the pairing check on the BN254 curve
- Returns `true` if valid, `false` if invalid
- Catches any verification errors and returns `false` (does not expose cryptographic error details)
- Calls `backend.destroy()` in a `finally` block

#### `toFieldSafeSalt(salt: string): string`
- **Lines 38-42**
- Strips the `0x` prefix if present
- Truncates to 62 hex characters (31 bytes = 248 bits)
- Re-adds the `0x` prefix
- **Why this exists**: The BN254 prime field modulus is `21888242871839275222246405745257275088548364400416034343698204186575808495617` (approximately 2^254). A 32-byte (256-bit) value can exceed this modulus, causing silent arithmetic errors in the circuit. Truncating to 31 bytes guarantees the value fits within the field.

### File 2: `server/proof-routes.ts` (318 lines)

Two Express routers: `router` (authenticated, tenant-scoped) and `publicRouter` (no authentication).

#### `POST /api/v1/proofs/ownership` (lines 44-127)
The proof generation endpoint. Step-by-step execution:

1. **Tenant authorization**: Extracts tenant slug from the session, looks up tenant ID
2. **Input validation**: Zod schema validates `holderRef`, `shareClass`, `shares` (non-negative integer), `threshold` (positive integer)
3. **Commitment lookup**: Queries `commitment_records` table for the matching (tenantId, holderRef, shareClass) record
4. **SHA-256 integrity check**: Computes `SHA-256(shares || holderRef || salt)` and compares to the stored `commitmentHash`. This verifies the caller knows the correct share count before the expensive proof generation begins.
5. **Pedersen commitment**: If the commitment record doesn't have a cached `pedersenCommitment`, generates one via `generatePedersenCommitment()` and updates the record
6. **Proof request record**: Creates a `proof_requests` row with status `'generating'` and a 72-hour TTL
7. **Proof generation**: Calls `generateOwnershipProof()` with the private inputs
8. **Proof result storage**: Creates a `proof_results` row with the proof hex, verification key hex, and `verified: true`
9. **Status update**: Updates the proof request status to `'complete'`
10. **Usage increment**: Atomically increments the `proof_usage` counter for the tenant's billing month
11. **Response**: Returns `{ proofId, status: 'complete', expiresAt }` — note: **proofHex is NOT returned** to the client

**Error handling**: If the circuit fails (e.g., shares below threshold), the proof request is updated to `'failed'` and a 422 response is returned. The error message is sanitized — circuit constraint details are never exposed.

#### `GET /api/v1/verify/:proofId` — Public Verification (lines 280-314)
The public verification endpoint. No authentication required.

1. **CORS**: Allows all origins (`Access-Control-Allow-Origin: *`)
2. **Rate limiting**: 10 requests per minute per IP via `express-rate-limit`
3. **TTL enforcement**: Checks `expiresAt` on every request; updates status to `'expired'` if past TTL
4. **Verification logic**: `proofRequest.status === 'complete' && proofResult.verified === true`
5. **Response**: Returns only `{ proofId, proofType, status, createdAt, expiresAt, isValid }` — NO proof hex, NO verification key, NO tenant info, NO holder info, NO PII of any kind

### File 3: `server/proof-middleware.ts` (86 lines)

Express middleware that gates proof generation on the tenant's subscription tier.

#### `checkProofAccess` (lines 11-56)
Applied before `POST /api/v1/proofs/ownership`:
1. Looks up the tenant's subscription plan
2. Checks `noirEnabled` flag from the tier config — if `false`, returns HTTP 402 with `error: 'upgrade_required'`
3. Queries `proof_usage` table for the current billing month
4. Compares current count against `maxProofsPerMonth` — if exceeded, returns HTTP 402 with `error: 'limit_reached'`
5. Attaches tier config and usage count to the request object for downstream use

### File 4: `server/proof-config.ts` (30 lines)

Tier configuration with a `BETA_MODE` toggle:

| Plan | Noir Enabled | Max Proofs/Month | Overage (cents) |
|------|-------------|-----------------|----------------|
| trial (beta) | true | 10 | 0 |
| starter (beta) | true | 10 | 0 |
| professional (beta) | true | 10 | 2500 |
| enterprise (beta) | true | 100 | 1500 |
| starter (production) | false | 0 | 0 |
| professional (production) | true | 10 | 2500 |
| enterprise (production) | true | 100 | 1500 |

`BETA_MODE = true` currently — all tiers get access during beta.

---

## PART D: THE FRONTEND INTEGRATION

### Sidebar Gating
**File**: `client/src/components/app-sidebar.tsx`, line 197

```typescript
const noirEnabled = import.meta.env.VITE_NOIR_ENABLED === 'true';
```

The entire "Zero Proofs" accordion group in the sidebar is conditionally rendered based on the `VITE_NOIR_ENABLED` environment variable. If the variable is not set or is not `'true'`, no ZKP-related navigation appears.

### Privacy Vault Page
**File**: `client/src/pages/privacy-vault.tsx` (585 lines)

This is the primary user-facing page. It contains:

1. **Usage bar**: Shows "X of Y proofs used this month" based on `GET /api/v1/proofs/usage`
2. **Commitment records table**: Fetches from `GET /api/v1/proofs/commitments`, displays holderRef and shareClass for each active commitment
3. **Generate Proof dialog**: Modal with dropdowns for selecting a commitment record, input for threshold value, and a "Generate" button that calls `POST /api/v1/proofs/ownership`
4. **Security Ritual Progress Bar** (lines 90-175): A 4-step animated progress sequence that replaces a standard spinner during proof generation:
   - Step 1: "Validating commitment records..." (2,500ms)
   - Step 2: "Computing SHA-256 + Pedersen hashes..." (3,500ms)
   - Step 3: "Executing Noir zero-knowledge circuit..." (4,500ms)
   - Step 4: "Finalizing cryptographic proof..." (2,000ms)
   - Uses `requestAnimationFrame` for smooth animation with proper cleanup on unmount
   - Includes percentage counter and step indicator dots
5. **Recent Proofs table**: Paginated list from `GET /api/v1/proofs` with status badges (Verified/Generating/Failed/Expired)
6. **Copy Verification Link**: Generates a public URL in the format `{origin}/public/verify/{proofId}` for external parties
7. **Upgrade CTA**: If the tier does not enable Noir, shows an upgrade banner with a link to the subscription page

### Additional Frontend Pages
- **`verify-proof.tsx`**: Internal verification — paste a proof ID, calls `GET /api/v1/proofs/:proofId`
- **`audit-proofs.tsx`**: Audit history — paginated table of all proof requests for the tenant
- **`public-verify.tsx`**: Public verification page (no authentication) — standalone branded page that calls `GET /api/v1/verify/:proofId` and displays a "Verified by Zero-Knowledge Proof" badge or an invalid/expired status

---

## PART E: THE DATABASE SCHEMA

Four tables in `shared/schema.ts` support the ZKP system:

### `commitment_records` (lines 517-531)
| Column | Type | Purpose |
|--------|------|---------|
| id | varchar, UUID PK | Unique identifier |
| tenantId | varchar | Tenant isolation scope |
| holderRef | varchar(64) | Opaque reference to a stakeholder (never exposes real identity) |
| commitmentHash | varchar(128) | SHA-256 hex digest of `(shares \|\| holderRef \|\| salt)` |
| pedersenCommitment | varchar(128), nullable | Cached Pedersen hash for Noir circuit, computed on first use |
| salt | varchar(64) | Random 32-byte value, truncated to 31 bytes at circuit execution time |
| shareClass | varchar(32) | Equity class (Common, Preferred, etc.) |
| createdAt | timestamp | Record creation time |
| isActive | boolean | Soft delete flag |

### `proof_requests` (lines 533-546)
| Column | Type | Purpose |
|--------|------|---------|
| id | varchar, UUID PK | Proof identifier (used in verification URLs) |
| tenantId | varchar | Tenant isolation scope |
| proofType | varchar(32) | Always `'ownership_threshold'` in current implementation |
| requestedBy | varchar | FK to users — who initiated the proof generation |
| publicInputs | jsonb | Stores `{ threshold, holderRef, shareClass }` — the non-secret parameters |
| status | varchar(16) | Lifecycle: `pending` → `generating` → `complete` / `failed` / `expired` |
| createdAt | timestamp | Request creation time |
| expiresAt | timestamp | TTL — 72 hours for user-generated proofs, 1 year for seeded demo proofs |

### `proof_results` (lines 548-559)
| Column | Type | Purpose |
|--------|------|---------|
| id | varchar, UUID PK | Unique identifier |
| requestId | varchar, unique | FK to proof_requests — one result per request |
| proofHex | text | The raw proof bytes as hex — NEVER exposed via any API endpoint |
| verificationKeyHex | text | The verification key as hex — NEVER exposed via any public endpoint |
| verified | boolean | Whether the proof passed verification |
| generatedAt | timestamp | Proof generation completion time |

### `proof_usage` (lines 561-572)
| Column | Type | Purpose |
|--------|------|---------|
| id | varchar, UUID PK | Unique identifier |
| tenantId | varchar | Tenant isolation scope |
| billingMonth | varchar(7) | Format: `"2026-04"` |
| proofCount | integer | Atomically incremented on each proof generation |

Unique constraint on `(tenantId, billingMonth)` enables atomic upsert via `INSERT ... ON CONFLICT DO UPDATE SET proof_count = proof_count + 1`.

---

## PART F: THE COMPILED ARTIFACTS

The compiled circuit artifacts are committed to the repository at:
- `noir_circuits/test_hash/target/test_hash.json`
- `noir_circuits/ownership_threshold/target/ownership_threshold.json`

These are ACIR (Abstract Circuit Intermediate Representation) artifacts produced by the `nargo compile` command. They contain:
- The circuit's constraint system (a set of polynomial equations over the BN254 field)
- The ABI (input names, types, visibility — public vs. private)
- The bytecode that NoirJS interprets to construct the witness

The runtime never invokes the compiler. It only reads these pre-compiled JSON files. This means the Noir compiler (`nargo`) is a build-time dependency only — it is not required in the production deployment environment.

---

*End of Response One.*
