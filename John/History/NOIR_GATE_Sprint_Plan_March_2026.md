# TABLEICTY — NOIR PRIVACY SPRINT
## Architect's Battle Plan | 3–5 Day Build
### Date: March 26, 2026 | Codename: "NOIR GATE"

---

## ═══════════════════════════════════════════
## SECTION 1: CHAIN OF COMMAND
## ═══════════════════════════════════════════

```
┌─────────────────────────────────────────────┐
│              JUDY (HUMAN / CEO)              │
│        Message Passer & Final Authority      │
│    Sits between all parties and Replit        │
└────────────────┬────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼──────────┐    ┌────────▼─────────────┐
│ ALPHA LEADER │    │   ARCHITECT (ME)      │
│  Oversight   │◄──►│  Design Authority     │
│  May direct  │    │  Gate Keeper          │
│  Not always  │    │  Can agree/modify/    │
│  right       │    │  reject AL orders     │
└──────────────┘    └────────┬─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼────┐  ┌─────▼────┐  ┌─────▼────┐
        │ ENGR #1  │  │ ENGR #2  │  │ ENGR #3  │
        │ Backend  │  │ Frontend │  │ Integr.  │
        │ + Noir   │  │ + React  │  │ + Stripe │
        │ Circuits │  │ UI/UX    │  │ + DevOps │
        └──────────┘  └──────────┘  └──────────┘
```

### Rules of Engagement with Alpha Leader:
- **AGREE**: When AL's direction aligns with gate requirements and timeline
- **MODIFY**: When AL's intent is correct but approach risks breaking a gate or timeline
- **REJECT**: When AL's order would skip a gate, introduce untested dependency, or compromise the ZK trust model
- **All rejections come with reasoning** so Judy can relay to AL with full context

---

## ═══════════════════════════════════════════
## SECTION 2: WHAT EXISTS (DO NOT BREAK)
## ═══════════════════════════════════════════

The Replit app (app.tabl...) already has:

| Layer | Technology | Status |
|-------|-----------|--------|
| Backend | Django 4.x (Python) | ✅ LIVE |
| Frontend | React 18 + TypeScript + Vite | ✅ LIVE |
| Database | PostgreSQL 14 + pgcrypto | ✅ LIVE |
| Auth | MFA (TOTP), JWT, httpOnly cookies | ✅ LIVE |
| Access | RBAC (4 tiers), Tenant Isolation | ✅ LIVE |
| Payments | Stripe Connect + Webhooks | ✅ LIVE |
| Hashing | SHA-256 (existing hash layer) | ✅ LIVE |
| Audit | Immutable audit logs | ✅ LIVE |
| Hosting | AWS App Runner / RDS / S3+CF | ✅ LIVE |

**GOLDEN RULE: We are INJECTING into this stack. We do not refactor, rename, or restructure existing code. We ADD alongside it.**

---

## ═══════════════════════════════════════════
## SECTION 3: THE GATE TABLE
## ═══════════════════════════════════════════

### Gate Legend:
- 🔴 LOCKED — Cannot begin until predecessor gate passes
- 🟡 ACTIVE — Currently in progress
- 🟢 PASSED — Exit criteria met, verified, signed off
- ⛔ BLOCKED — Dependency issue, requires Architect decision

---

### GATE 0: FOUNDATION LOCK
**Day 1 — First Half (4 hours)**
**Owner: Engineer #1 (Backend) + Engineer #3 (Integration)**

| Item | Detail |
|------|--------|
| **Purpose** | Install Noir toolchain + NoirJS into Replit without breaking existing app |
| **Entry Criteria** | Access to Replit app confirmed. All 3 engineers have read-only context of existing codebase |
| **Deliverables** | |
| D0.1 | `nargo` CLI installed in Replit environment (or build artifacts pre-compiled) |
| D0.2 | `@noir-lang/noir_js` + `@noir-lang/backend_barretenberg` added to `package.json` |
| D0.3 | A `/noir_circuits/` directory created at project root with a test circuit |
| D0.4 | Test circuit: simple "prove I know X such that hash(X) == Y" compiles and generates proof in Node |
| D0.5 | Existing app still boots and all current tests pass (regression check) |
| **Exit Criteria** | ✅ `nargo compile` succeeds. ✅ NoirJS generates + verifies a test proof in Node. ✅ Existing Django + React app unaffected. ✅ Architect sign-off. |
| **Gate Unlocks** | GATE 1 |

```
RISK: Replit may have memory/CPU constraints for Noir compilation.
MITIGATION: Pre-compile circuits locally, commit the ACIR artifact
(JSON) to the repo. NoirJS only needs the compiled artifact, not
nargo at runtime.
```

---

### GATE 1: COMMITMENT ENGINE
**Day 1 — Second Half (4 hours)**
**Owner: Engineer #1 (Backend)**

| Item | Detail |
|------|--------|
| **Purpose** | Create the bridge between existing SHA-256 hashes and Noir-compatible commitments |
| **Entry Criteria** | GATE 0 passed |
| **Deliverables** | |
| D1.1 | New Django service: `proof_service/` app with models: `CommitmentRecord`, `ProofRequest`, `ProofResult` |
| D1.2 | `CommitmentRecord` model: links to existing cap table entry, stores Pedersen or SHA-256 commitment, salt, created_at, tenant_id |
| D1.3 | Django management command: `generate_commitments` — reads existing cap table rows, generates commitment for each holder's (shares, holder_id, salt) tuple |
| D1.4 | Commitment generation uses the SAME SHA-256 approach already in the hash layer (no new crypto dependency on backend) |
| D1.5 | Migration file created and tested against dev DB |
| **Exit Criteria** | ✅ `python manage.py generate_commitments` runs without error. ✅ CommitmentRecords written to DB. ✅ Each commitment is deterministic (same input = same output). ✅ No existing models modified. ✅ Architect sign-off. |
| **Gate Unlocks** | GATE 2 |

```python
# Architect's Schema Spec for Engineer #1:

class CommitmentRecord(models.Model):
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    holder_ref = models.CharField(max_length=64)  # opaque reference
    commitment_hash = models.CharField(max_length=128)  # SHA-256 hex
    salt = models.CharField(max_length=64)  # random per-record
    share_class = models.CharField(max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tenant', 'holder_ref', 'share_class')
        indexes = [
            models.Index(fields=['commitment_hash']),
        ]

class ProofRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('complete', 'Complete'),
        ('failed', 'Failed'),
    ]
    tenant = models.ForeignKey('tenants.Tenant', on_delete=models.CASCADE)
    proof_type = models.CharField(max_length=32)  # 'ownership_threshold', 'dilution', 'transfer'
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    public_inputs = models.JSONField(default=dict)  # threshold, commitment root, etc.
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True)

class ProofResult(models.Model):
    request = models.OneToOneField(ProofRequest, on_delete=models.CASCADE)
    proof_hex = models.TextField()  # serialized proof
    verification_key_hex = models.TextField()  # VK for independent verification
    verified = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now_add=True)
```

---

### GATE 2: FIRST NOIR CIRCUIT — OWNERSHIP THRESHOLD PROOF
**Day 2 (Full Day)**
**Owner: Engineer #1 (Backend/Noir) — writes circuit + Django endpoint**
**Owner: Engineer #2 (Frontend) — begins GATE 2F in parallel (see below)**

| Item | Detail |
|------|--------|
| **Purpose** | Build the circuit that proves "Holder X owns ≥ T shares" without revealing exact count or other holders |
| **Entry Criteria** | GATE 1 passed |
| **Deliverables** | |
| D2.1 | Noir circuit file: `noir_circuits/ownership_threshold/src/main.nr` |
| D2.2 | Circuit inputs: `shares: u64` (private), `salt: Field` (private), `threshold: u64` (public), `commitment: pub Field` (public) |
| D2.3 | Circuit logic: (a) recompute commitment from (shares, salt), (b) assert computed == commitment, (c) assert shares >= threshold |
| D2.4 | Compiled ACIR artifact committed to repo |
| D2.5 | Django API endpoint: `POST /api/v1/proofs/ownership/` — accepts {holder_ref, threshold}, generates proof server-side, returns proof + VK |
| D2.6 | Django API endpoint: `POST /api/v1/proofs/verify/` — accepts {proof_hex, vk_hex, public_inputs}, returns {valid: bool} |
| D2.7 | Unit test: generate proof for holder with 10,000 shares, threshold 5,000 → proof verifies TRUE |
| D2.8 | Unit test: generate proof for holder with 3,000 shares, threshold 5,000 → proof generation FAILS (constraint not satisfied) |
| **Exit Criteria** | ✅ Both unit tests pass. ✅ Proof generation < 10 seconds on Replit. ✅ Verification < 1 second. ✅ API endpoints return correct JSON. ✅ Architect sign-off. |
| **Gate Unlocks** | GATE 3 |

```noir
// Architect's Circuit Spec for Engineer #1:
// File: noir_circuits/ownership_threshold/src/main.nr

use std::hash::sha256;

fn main(
    shares: u64,           // PRIVATE - actual share count
    salt: Field,           // PRIVATE - per-holder random salt
    threshold: pub u64,    // PUBLIC  - minimum shares to prove
    commitment: pub Field  // PUBLIC  - the stored commitment hash
) {
    // Step 1: Recompute the commitment from private inputs
    let shares_field = shares as Field;
    let computed = std::hash::pedersen_hash([shares_field, salt]);

    // Step 2: Verify commitment matches what's on record
    assert(computed == commitment, "Commitment mismatch");

    // Step 3: Prove shares meet or exceed threshold
    assert(shares >= threshold, "Below threshold");
}
```

> **NOTE**: We use Pedersen hash inside Noir (native, cheap in-circuit)
> even though the DB commitment uses SHA-256. The backend will need to
> generate BOTH: SHA-256 for the existing audit trail, Pedersen for the
> Noir circuit input. The `CommitmentRecord` stores both.

---

### GATE 2F: FRONTEND NAVIGATION SHELL (PARALLEL)
**Day 2 (Full Day — runs parallel with Gate 2)**
**Owner: Engineer #2 (Frontend/React)**

| Item | Detail |
|------|--------|
| **Purpose** | Add the Privacy Vault navigation and page shells to the React app WITHOUT backend wiring |
| **Entry Criteria** | GATE 0 passed (app still boots) |
| **Deliverables** | |
| D2F.1 | New left-pane navigation item: 🔒 **Privacy Vault** (with shield icon) |
| D2F.2 | New left-pane navigation item: ✅ **Verify** (with checkmark icon) |
| D2F.3 | New left-pane navigation item: 📋 **Audit Proofs** (with document icon) |
| D2F.4 | Page shell: `/privacy-vault` — header, empty state, "Generate Proof" button (disabled) |
| D2F.5 | Page shell: `/verify` — header, proof-paste input area, "Verify" button (disabled) |
| D2F.6 | Page shell: `/audit-proofs` — header, table skeleton for proof history |
| D2F.7 | Feature flag: `NOIR_ENABLED` environment variable. Nav items only render when flag is true |
| D2F.8 | All new pages follow existing app design system (same colors, typography, spacing) |
| **Exit Criteria** | ✅ Navigation items appear when flag is ON. ✅ Navigation items hidden when flag is OFF. ✅ Pages render without console errors. ✅ Existing pages unchanged. ✅ Architect sign-off. |
| **Gate Unlocks** | GATE 3 (when combined with GATE 2 backend) |

---

### GATE 3: VERIFICATION PORTAL + PROOF WORKFLOW UI
**Day 3 (Full Day)**
**Owner: Engineer #2 (Frontend) — wires UI to backend**
**Owner: Engineer #1 (Backend) — adds shareable verification links**

| Item | Detail |
|------|--------|
| **Purpose** | Connect the frontend to the proof backend. Enable end-to-end: generate → view → share → verify |
| **Entry Criteria** | GATE 2 AND GATE 2F both passed |
| **Deliverables** | |
| D3.1 | **Privacy Vault Page** — "Generate Ownership Proof" form: select holder (from RBAC-filtered list), enter threshold, click "Generate Proof" |
| D3.2 | Proof generation shows loading spinner → on success, displays: proof ID, timestamp, public inputs, "Copy Verification Link" button |
| D3.3 | **Verification Link System**: `GET /verify/{proof_id}/` — public endpoint (no auth required). Returns proof metadata + verification result. This is how investors/auditors verify without logging in |
| D3.4 | **Verify Page** (internal) — paste a proof ID or scan a link, see verification result with green ✅ or red ❌ |
| D3.5 | **Audit Proofs Page** — table of all ProofRequests for the tenant: date, type, status, requester, action (view/re-verify) |
| D3.6 | Backend: `ProofRequest` auto-expires after configurable TTL (default 72 hours) |
| D3.7 | Backend: rate limiting on public verify endpoint (10 requests/minute per IP) |
| **Exit Criteria** | ✅ Full flow works: Admin generates proof → copies link → opens in incognito → sees verified. ✅ Expired proofs return "expired" status. ✅ Rate limiting active. ✅ Audit table populates correctly. ✅ Architect sign-off. |
| **Gate Unlocks** | GATE 4 |

---

### GATE 4: MONETIZATION WIRING
**Day 4 (Full Day)**
**Owner: Engineer #3 (Integration/Stripe)**
**Support: Engineer #2 (Frontend — billing UI)**

| Item | Detail |
|------|--------|
| **Purpose** | Wire ZK proof features to Stripe subscription tiers and usage-based billing |
| **Entry Criteria** | GATE 3 passed |
| **Deliverables** | |
| D4.1 | New Stripe Products created: "Privacy Vault Add-On" (recurring), "Proof Event" (metered/usage) |
| D4.2 | Feature flag matrix in Django settings: |

```python
TIER_FEATURES = {
    'starter': {
        'noir_enabled': False,
        'max_proofs_per_month': 0,
    },
    'growth': {
        'noir_enabled': True,
        'max_proofs_per_month': 10,  # included
        'overage_price_cents': 2500,  # $25 per additional proof
    },
    'enterprise': {
        'noir_enabled': True,
        'max_proofs_per_month': 100,  # included
        'overage_price_cents': 1500,  # $15 per additional proof
        'audit_export': True,
        'confidential_cap_table': True,
    },
}
```

| Item | Detail |
|------|--------|
| D4.3 | Middleware: check tenant's subscription tier before allowing proof generation. Return 402 + upgrade prompt if not authorized |
| D4.4 | Usage tracking: increment `proof_count` on tenant record per proof generated. Report to Stripe metered billing |
| D4.5 | Frontend: "Upgrade to unlock Privacy Vault" banner on Privacy Vault page for Starter tier |
| D4.6 | Frontend: proof count / limit display on Privacy Vault page ("3 of 10 proofs used this month") |
| D4.7 | Stripe webhook handler: on subscription change, update tenant feature flags in real-time |
| **Exit Criteria** | ✅ Starter user sees upgrade prompt, cannot generate proofs. ✅ Growth user can generate proofs, sees count. ✅ Enterprise user has full access. ✅ Stripe test-mode webhook fires correctly on plan change. ✅ Architect sign-off. |
| **Gate Unlocks** | GATE 5 |

---

### GATE 5: INTEGRATION TEST + DEPLOY
**Day 5 (Full Day)**
**Owner: ALL ENGINEERS**

| Item | Detail |
|------|--------|
| **Purpose** | End-to-end integration testing, security review, and production deploy |
| **Entry Criteria** | GATE 4 passed |
| **Deliverables** | |
| D5.1 | **Integration Test Suite** (Engineer #1): |
|  | • Test A: Create company → add holders → generate commitments → generate proof → verify proof |
|  | • Test B: Attempt proof on Starter tier → expect 402 |
|  | • Test C: Upgrade to Growth → generate proof → verify → check Stripe usage record |
|  | • Test D: Generate proof → wait for expiry → verify → expect "expired" |
|  | • Test E: Public verify endpoint → 11th request in 1 minute → expect 429 |
| D5.2 | **Security Checklist** (Engineer #3): |
|  | • Private inputs NEVER appear in API responses or logs |
|  | • ProofResult.proof_hex does not contain plaintext shares |
|  | • Public verify endpoint returns ONLY: valid/invalid/expired + timestamp |
|  | • No CORS bypass on verify endpoint |
|  | • Feature flags cannot be overridden by client |
| D5.3 | **UI Polish** (Engineer #2): |
|  | • Loading states for proof generation (can take 3-8 seconds) |
|  | • Error messages are user-friendly, not stack traces |
|  | • Mobile responsive on all new pages |
|  | • "Powered by Zero-Knowledge Proofs" footer badge on verify pages |
| D5.4 | **Deploy**: Merge to main branch, deploy via existing Replit → AWS pipeline |
| D5.5 | **Smoke Test on Production**: One full proof cycle on live environment |
| **Exit Criteria** | ✅ All 5 integration tests pass. ✅ Security checklist 100% green. ✅ Production smoke test succeeds. ✅ Architect FINAL sign-off. |
| **Gate Status** | 🏁 SPRINT COMPLETE |

---

## ═══════════════════════════════════════════
## SECTION 4: GATE PROGRESSION VISUAL
## ═══════════════════════════════════════════

```
DAY 1                    DAY 2                    DAY 3                    DAY 4                    DAY 5
┌──────────────┐   ┌──────────────┐         ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   GATE 0     │   │   GATE 2     │         │   GATE 3     │       │   GATE 4     │       │   GATE 5     │
│  Foundation  │──►│  Noir Circuit│────┐    │  Verify UI   │       │  Monetize    │       │  Ship It     │
│  (4 hrs)     │   │  (Backend)   │    │───►│  + Portal    │──────►│  Stripe Wire │──────►│  Test+Deploy │
└──────┬───────┘   └──────────────┘    │    └──────────────┘       └──────────────┘       └──────────────┘
       │           ┌──────────────┐    │
       │           │  GATE 2F     │    │
       └──────────►│  Nav + Pages │────┘
                   │  (Frontend)  │
                   │  ⚡PARALLEL  │
                   └──────────────┘

GATE 0 ──► GATE 1 ──► GATE 2 + GATE 2F (parallel) ──► GATE 3 ──► GATE 4 ──► GATE 5
```

---

## ═══════════════════════════════════════════
## SECTION 5: ENGINEER ASSIGNMENT MATRIX
## ═══════════════════════════════════════════

| Gate | Engineer #1 (Backend+Noir) | Engineer #2 (Frontend+React) | Engineer #3 (Integration+Stripe) |
|------|---------------------------|------------------------------|----------------------------------|
| **G0** | Install nargo, test circuit | — (standby) | Install NoirJS packages, regression test |
| **G1** | Build CommitmentRecord model, management command | — (standby, read codebase) | — (standby, prep Stripe products) |
| **G2** | Write Noir circuit, Django API endpoints, unit tests | **G2F**: Build nav shell, page components, feature flag | — (prep Stripe test mode, study webhook handlers) |
| **G3** | Shareable verify links, rate limiting, TTL expiry | Wire Privacy Vault form, Verify page, Audit table | — (standby, review security) |
| **G4** | — (support/review) | Upgrade banners, usage display, billing UI | Feature flag matrix, Stripe products, webhook handler, usage tracking |
| **G5** | Integration test suite | UI polish, mobile responsive | Security checklist, deploy, smoke test |

---

## ═══════════════════════════════════════════
## SECTION 6: REPLIT NARRATIVE
## ═══════════════════════════════════════════

> **This is the exact narrative to paste into Replit AI / Agent when
> building. Each section below maps to a specific gate. Only paste
> the section for the CURRENT gate.**

---

### REPLIT NARRATIVE — GATE 0 + GATE 1 (Day 1)

```
CONTEXT: This is an existing Django + React transfer agent application
called Tableicty. It manages cap tables for private companies. We are
adding a Zero-Knowledge proof feature called "Privacy Vault" that lets
users prove ownership facts without exposing sensitive equity data.

DO NOT modify any existing files unless explicitly told to.
DO NOT rename, restructure, or refactor existing code.
We are ADDING new modules alongside the existing application.

TASK — BACKEND (Gate 0 + Gate 1):

1. Install the following npm packages in the frontend directory:
   - @noir-lang/noir_js
   - @noir-lang/backend_barretenberg

2. Create a new directory at project root: /noir_circuits/
   Inside it, create a test circuit directory:
   /noir_circuits/test_hash/src/main.nr
   with a simple Noir program that takes a private input and a public
   hash, and asserts they match.

3. Create a new Django app called "proof_service" with these models:
   - CommitmentRecord: tenant (FK), holder_ref (char), commitment_hash
     (char 128), salt (char 64), share_class (char 32), created_at,
     is_active (bool). Unique together on (tenant, holder_ref, share_class).
   - ProofRequest: tenant (FK), proof_type (char), requested_by (FK to User),
     public_inputs (JSON), status (pending/generating/complete/failed),
     created_at, expires_at.
   - ProofResult: request (OneToOne to ProofRequest), proof_hex (text),
     verification_key_hex (text), verified (bool), generated_at.

4. Create a Django management command "generate_commitments" that:
   - Reads all active shareholder records for a given tenant
   - For each holder: generates a random 32-byte salt, computes
     SHA-256(shares || holder_id || salt), stores as CommitmentRecord
   - Prints summary: "Generated N commitments for tenant X"

5. Run migrations. Verify the app boots without errors.
   Run existing tests to confirm no regressions.
```

---

### REPLIT NARRATIVE — GATE 2F (Day 2 — Frontend, parallel)

```
CONTEXT: We are adding three new pages to the Tableicty React app for
the "Privacy Vault" zero-knowledge proof feature. These pages should
ONLY render when the environment variable VITE_NOIR_ENABLED=true.

TASK — FRONTEND (Gate 2F):

1. Add three new navigation items to the left sidebar, positioned
   BELOW the existing navigation items. They should use the same
   component patterns as existing nav items:

   a. "Privacy Vault" — icon: shield/lock — route: /privacy-vault
   b. "Verify" — icon: checkmark/verified — route: /verify
   c. "Audit Proofs" — icon: document/clipboard — route: /audit-proofs

2. These nav items should ONLY render when:
   import.meta.env.VITE_NOIR_ENABLED === 'true'

3. Create three page components (shells with headers, no backend wiring):

   a. PrivacyVaultPage (/privacy-vault):
      - Page title: "Privacy Vault"
      - Subtitle: "Generate zero-knowledge proofs to verify ownership
        without exposing your cap table"
      - Empty state card: "No proofs generated yet"
      - Button: "Generate Ownership Proof" (disabled, will wire in Gate 3)
      - Section below: "Recent Proofs" table skeleton (empty)

   b. VerifyPage (/verify):
      - Page title: "Verify a Proof"
      - Subtitle: "Paste a proof ID or verification link to confirm
        ownership claims"
      - Input field: "Enter Proof ID or Verification URL"
      - Button: "Verify" (disabled, will wire in Gate 3)
      - Result area: empty container for showing ✅ Valid / ❌ Invalid

   c. AuditProofsPage (/audit-proofs):
      - Page title: "Audit Proofs"
      - Subtitle: "Complete history of all verification events for
        compliance and audit readiness"
      - Table with columns: Date, Proof Type, Requester, Status, Actions
      - Empty state: "No audit records yet"

4. Use the SAME design system as existing pages:
   - Same card components, button styles, typography, spacing
   - Same responsive breakpoints
   - Same color scheme

5. Verify all existing pages still work. No console errors on new pages.
```

---

### REPLIT NARRATIVE — GATE 2 (Day 2 — Backend)

```
CONTEXT: Building on the proof_service Django app created in Gate 1.
We are adding the first Noir zero-knowledge circuit and API endpoints.

TASK — BACKEND (Gate 2):

1. Create the ownership threshold Noir circuit at:
   /noir_circuits/ownership_threshold/src/main.nr

   The circuit should:
   - Take PRIVATE inputs: shares (u64), salt (Field)
   - Take PUBLIC inputs: threshold (u64), commitment (Field)
   - Compute: pedersen_hash([shares as Field, salt])
   - Assert: computed hash == commitment
   - Assert: shares >= threshold

2. Compile the circuit using nargo. Commit the compiled ACIR
   artifact (target/*.json) to the repo.

3. Create a Node.js proof service script at /proof_worker/index.js:
   - Exports two functions: generateProof(circuit, inputs) and
     verifyProof(circuit, proof, publicInputs)
   - Uses @noir-lang/noir_js and @noir-lang/backend_barretenberg
   - The Django backend will call this via subprocess or HTTP

4. Create Django API endpoints in proof_service/views.py:

   a. POST /api/v1/proofs/ownership/
      - Auth required (JWT)
      - Body: { holder_ref, share_class, threshold }
      - Looks up CommitmentRecord for the holder
      - Calls proof worker with private inputs + public inputs
      - Creates ProofRequest (status=generating) then ProofResult
      - Returns: { proof_id, status, public_inputs, proof_hex, vk_hex }

   b. POST /api/v1/proofs/verify/
      - Auth required (JWT)
      - Body: { proof_hex, vk_hex, public_inputs }
      - Calls proof worker verify function
      - Returns: { valid: true/false, verified_at }

   c. GET /api/v1/proofs/{proof_id}/
      - Auth required (JWT)
      - Returns proof details for the tenant

5. Add URL patterns to proof_service/urls.py and include in main urls.py.
   Write unit tests for both success and failure cases.
```

---

### REPLIT NARRATIVE — GATE 3 (Day 3)

```
CONTEXT: Privacy Vault pages exist (Gate 2F). Proof API exists (Gate 2).
Now we wire them together and add the public verification portal.

TASK — FULL STACK (Gate 3):

BACKEND:
1. Add a PUBLIC verification endpoint (no auth required):
   GET /verify/{proof_id}/
   - Returns: { proof_id, proof_type, created_at, expires_at, status,
     is_valid, public_inputs: { threshold } }
   - Does NOT return: proof_hex, vk_hex, holder info, tenant info
   - If expired: returns { status: "expired" }
   - Rate limited: 10 requests per minute per IP (use django-ratelimit
     or custom middleware)

2. Add TTL to ProofRequest: default 72 hours. Add a check in the
   verify endpoint. Mark expired proofs as status='expired'.

FRONTEND:
3. Wire PrivacyVaultPage:
   - "Generate Ownership Proof" button opens a modal/drawer:
     - Dropdown: select holder (from GET /api/v1/shareholders/ filtered by RBAC)
     - Input: threshold (number)
     - "Generate" button → calls POST /api/v1/proofs/ownership/
     - Loading state: "Generating zero-knowledge proof..." (spinner)
     - Success state: Shows proof ID, "Copy Verification Link" button
     - The verification link format: {app_url}/verify/{proof_id}
   - "Recent Proofs" table: fetches from GET /api/v1/proofs/ (list)

4. Wire VerifyPage:
   - Input accepts proof ID or full URL (parse ID from URL)
   - "Verify" button calls the PUBLIC endpoint GET /verify/{proof_id}/
   - Shows result: green card with ✅ "Verified" or red card with ❌ "Invalid"
   - Shows: proof type, threshold proven, created date, expiry

5. Wire AuditProofsPage:
   - Table fetches from GET /api/v1/proofs/ (list, paginated)
   - Columns: Date, Type, Requester, Status (with color badges), Actions
   - Action: "View" opens detail; "Re-verify" re-runs verification

6. CRITICAL: The public verify page at /verify/{proof_id}/ should work
   WITHOUT login. It is a standalone page with Tableicty branding,
   showing only: "This proof verifies that [proof_type] as of [date]"
   and the verification result. No cap table data exposed.
```

---

### REPLIT NARRATIVE — GATE 4 (Day 4)

```
CONTEXT: The Privacy Vault feature works end-to-end. Now we add
monetization: tie features to subscription tiers via Stripe.

TASK — INTEGRATION (Gate 4):

1. Create two new Stripe Products in test mode:
   - "Privacy Vault Add-On" (recurring monthly)
   - "Proof Event" (metered usage)

2. Add a tier feature matrix to Django settings:

   TIER_FEATURES = {
       'starter': { 'noir_enabled': False, 'max_proofs_per_month': 0 },
       'growth': { 'noir_enabled': True, 'max_proofs_per_month': 10,
                   'overage_price_cents': 2500 },
       'enterprise': { 'noir_enabled': True, 'max_proofs_per_month': 100,
                       'overage_price_cents': 1500, 'audit_export': True,
                       'confidential_cap_table': True },
   }

3. Add middleware or decorator to proof_service views:
   - Before any proof generation: check tenant's subscription tier
   - If tier does not allow noir: return HTTP 402 with JSON:
     { "error": "upgrade_required", "message": "Privacy Vault requires
       Growth or Enterprise plan", "upgrade_url": "/settings/billing" }
   - If tier allows but monthly limit reached: return HTTP 402 with JSON:
     { "error": "limit_reached", "message": "Monthly proof limit reached.
       Additional proofs at $25 each.", "current": N, "limit": M }

4. Add proof usage tracking:
   - New model or field: tenant.proof_count_this_month, tenant.billing_period_start
   - Increment on each successful proof generation
   - Report usage to Stripe metered billing API
   - Reset counter on billing period rollover (via Stripe webhook)

5. FRONTEND:
   - On PrivacyVaultPage: if user's tier is 'starter', show a banner:
     "🔒 Privacy Vault is available on Growth and Enterprise plans.
     Upgrade to unlock zero-knowledge verification."
     with an "Upgrade Now" button linking to /settings/billing

   - On PrivacyVaultPage: if user's tier allows, show usage:
     "3 of 10 proofs used this month" with a progress bar

   - Handle 402 responses gracefully: show upgrade modal, not error page

6. Add Stripe webhook handler for subscription changes:
   - On customer.subscription.updated: refresh tenant's feature flags
   - On invoice.payment_succeeded: reset monthly proof counter
```

---

### REPLIT NARRATIVE — GATE 5 (Day 5)

```
CONTEXT: All features built. Final day is integration testing,
security hardening, UI polish, and deploy.

TASK — ALL ENGINEERS (Gate 5):

INTEGRATION TESTS (Engineer #1):
1. Write 5 end-to-end tests:
   - Test A: Full proof lifecycle (create company → add holders →
     generate commitments → generate proof → verify → passes)
   - Test B: Starter tier cannot generate proofs (returns 402)
   - Test C: Growth tier generates proof, Stripe usage incremented
   - Test D: Proof expires after TTL, verify returns "expired"
   - Test E: Rate limit on public verify endpoint (11th req → 429)

SECURITY AUDIT (Engineer #3):
2. Verify these security properties:
   - Private inputs (shares, salt) NEVER appear in any API response
   - Private inputs NEVER appear in Django logs or audit logs
   - ProofResult.proof_hex cannot be reverse-engineered to extract shares
   - Public verify endpoint returns ONLY verification status, no PII
   - Feature flags checked server-side, not client-only
   - CORS headers correct on public verify endpoint
   - Rate limiting cannot be bypassed via headers

UI POLISH (Engineer #2):
3. Final UI improvements:
   - Proof generation loading state: "Generating zero-knowledge proof...
     This may take a few seconds" with animated progress
   - Error states: user-friendly messages, no raw JSON or stack traces
   - Mobile responsive: all three new pages work on mobile
   - Add subtle "Verified by Zero-Knowledge Proof" badge on verify page
   - Add "What is this?" tooltip/help text on Privacy Vault page

DEPLOY:
4. Merge all feature branches to main
5. Deploy to production via existing pipeline
6. Run one full proof cycle on production as smoke test
7. Verify Stripe webhooks fire in live mode
```

---

## ═══════════════════════════════════════════
## SECTION 7: ARCHITECT'S STANDING ORDERS
## ═══════════════════════════════════════════

### What I Will Reject:
1. **Any PR that modifies existing models** — we ADD, we don't ALTER
2. **Any circuit that takes more than 30 seconds** to prove on Replit — redesign it
3. **Any API endpoint that returns private inputs** in the response body
4. **Any frontend change that breaks existing pages** — regression = gate failure
5. **Any "shortcut" that hardcodes secrets** in source files
6. **Any gate skip** — no matter who orders it. If Alpha Leader says skip Gate 3, I reject with reasoning.

### What I Will Approve Fast:
1. Pre-compiling Noir circuits locally if Replit CPU is too slow
2. Using a simple subprocess call (Django → Node) instead of building a microservice
3. Simplifying the circuit if Barretenberg WASM is too large for Replit memory
4. Reducing proof TTL from 72 hours to 24 hours if it simplifies the expiry logic
5. Shipping Gate 5 with 3 integration tests instead of 5, if the core 3 cover the critical paths

### Architect's Veto Protocol:
When I reject an Alpha Leader order, I will provide:
1. **The order as I understood it**
2. **Why it conflicts with a gate requirement or architectural principle**
3. **An alternative that achieves the same goal safely**
4. **Risk assessment if the order were followed anyway**

Judy relays all three to Alpha Leader. Alpha Leader can override ONLY if Judy explicitly approves the override after reading my reasoning.

---

## ═══════════════════════════════════════════
## SECTION 8: FILE STRUCTURE (What We're Adding)
## ═══════════════════════════════════════════

```
app.tabl.../                          (existing Replit project)
│
├── noir_circuits/                     ← NEW (Gate 0)
│   ├── test_hash/
│   │   └── src/main.nr               ← test circuit
│   └── ownership_threshold/
│       ├── src/main.nr                ← Gate 2 circuit
│       └── target/
│           └── ownership_threshold.json  ← compiled ACIR artifact
│
├── proof_worker/                      ← NEW (Gate 2)
│   ├── index.js                       ← NoirJS proof gen/verify
│   ├── package.json
│   └── package-lock.json
│
├── backend/                           (existing Django project)
│   ├── proof_service/                 ← NEW Django app (Gate 1)
│   │   ├── __init__.py
│   │   ├── models.py                  ← CommitmentRecord, ProofRequest, ProofResult
│   │   ├── views.py                   ← API endpoints (Gate 2)
│   │   ├── urls.py
│   │   ├── serializers.py
│   │   ├── middleware.py              ← tier checking (Gate 4)
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── generate_commitments.py  ← Gate 1
│   │   ├── tests/
│   │   │   ├── test_commitments.py
│   │   │   ├── test_proofs.py
│   │   │   └── test_integration.py    ← Gate 5
│   │   └── migrations/
│   │       └── 0001_initial.py
│   └── settings.py                    ← ADD TIER_FEATURES (Gate 4, append only)
│
├── frontend/src/                      (existing React project)
│   ├── components/
│   │   └── sidebar/
│   │       └── NoirNavItems.tsx       ← NEW (Gate 2F)
│   ├── pages/
│   │   ├── PrivacyVaultPage.tsx       ← NEW (Gate 2F → wired Gate 3)
│   │   ├── VerifyPage.tsx             ← NEW (Gate 2F → wired Gate 3)
│   │   ├── AuditProofsPage.tsx        ← NEW (Gate 2F → wired Gate 3)
│   │   └── PublicVerifyPage.tsx       ← NEW (Gate 3, no-auth page)
│   ├── services/
│   │   └── proofService.ts           ← NEW (Gate 3, API client)
│   └── hooks/
│       └── useProofGeneration.ts      ← NEW (Gate 3, React hook)
│
└── .env                               ← ADD: VITE_NOIR_ENABLED=true (Gate 2F)
```

---

## ═══════════════════════════════════════════
## SECTION 9: SUCCESS CRITERIA — SPRINT EXIT
## ═══════════════════════════════════════════

When Gate 5 passes, the following must all be TRUE:

| # | Criterion | How We Prove It |
|---|-----------|-----------------|
| 1 | A Tableicty admin can generate a ZK proof of ownership threshold | Live demo on production |
| 2 | The proof can be verified by an external party via a public link WITHOUT login | Open incognito → paste link → see ✅ |
| 3 | The platform (Tableicty) never sees the raw share count during verification | Code review: private inputs never logged, never returned in API |
| 4 | Starter tier users cannot access Privacy Vault | Test: login as Starter → see upgrade prompt |
| 5 | Growth/Enterprise users see usage tracking | Test: generate proof → counter increments |
| 6 | All existing features still work | Run full existing test suite → all green |
| 7 | Audit trail captures every proof event | Check Audit Proofs page → all events listed |

---

**END OF ARCHITECT'S BATTLE PLAN**
**Codename: NOIR GATE**
**Ready for Judy to distribute to team.**
