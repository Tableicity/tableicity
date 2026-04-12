# Tableicity Master Plan: Haylo AI & Second Non-PPA

**Created:** April 8, 2026
**Author:** App Builder Replit (on behalf of John the Conductor)
**Purpose:** Comprehensive knowledge base consolidating 4 meetings (2 Gemini, 2 Non-PPA Replit) for the Haylo AI feature build and 2nd Non-PPA filing in ~8 months.

---

## Table of Contents

1. [The Three-Entity Workflow](#1-the-three-entity-workflow)
2. [Competitive Gap Analysis](#2-competitive-gap-analysis)
3. [Haylo AI Architecture](#3-haylo-ai-architecture)
4. [The Four-Gate Middleware (Expanded for AI)](#4-the-four-gate-middleware-expanded-for-ai)
5. [Dual-LLM Consensus Engine](#5-dual-llm-consensus-engine)
6. [Noir Circuit Roadmap](#6-noir-circuit-roadmap)
7. [Patent Filing Strategy](#7-patent-filing-strategy)
8. [Current Non-PPA Hooks for Haylo AI](#8-current-non-ppa-hooks-for-haylo-ai)
9. [2nd Non-PPA North Star Claims](#9-2nd-non-ppa-north-star-claims)
10. [Technical Build Requirements](#10-technical-build-requirements)
11. [Future-Proof Plumbing](#11-future-proof-plumbing)
12. [Drawing Reference Numerals](#12-drawing-reference-numerals)
13. [Marketing & Launch Materials](#13-marketing--launch-materials)
14. [Scratchpad: Critical Technical Constraints](#14-scratchpad-critical-technical-constraints)
15. [Path Forward](#15-path-forward)

---

## 1. The Three-Entity Workflow

| Entity | Role | Scope |
|---|---|---|
| **John (Conductor)** | Decision-maker, passes messages between all parties | Strategy, approval, direction |
| **App Builder Replit (this Replit)** | Builds Haylo AI into live Tableicity platform | Code, features, technical implementation |
| **Non-PPA Replit** | Updates patent documentation, diagrams, claims language | Works with the Professor on filings |
| **Gemini** | Strategic advisor on competitive positioning and patent claims | Gap analysis, claim drafting, marketing |

**Pipeline:**
1. **Now** → App Builder Replit builds Haylo AI into Tableicity (the code)
2. **Now** → Non-PPA Replit + Professor update current Non-PPA with Haylo AI hooks
3. **~8 months** → File 2nd Non-PPA covering advanced Noir circuits, dual-agent consensus, cross-border sovereignty

---

## 2. Competitive Gap Analysis

### Security Gap (The "How")
- **Carta/Cake:** Traditional multi-tenant databases. Central DB breach = every cap table exposed. Rely on encryption-at-rest and "trust us" policies.
- **Tableicity:** Schema-per-Tenant isolation. Breach in one "room" doesn't compromise the building. ZKPs enable "Trustless Verification" — prove a startup has enough authorized shares without the VC seeing existing investor names.

### Onboarding Gap (The "Speed")
- **Carta/Cake:** High-touch sales cycle, manual data migration taking days/weeks.
- **Tableicity:** Seeded Sandbox + atomic provisioning triggered by email. "Time-to-Value" in minutes. Ready-to-play environment immediately.

### Feature Gap (The "AI Term Sheet")
- **Carta:** "Scenario Modeling" is a calculator, not an intelligence layer.
- **Tableicity Opportunity:** Since data is isolated at the schema level, safely feed tenant data into an LLM context (via RAG) for "What-If" Term Sheet Scenarios without data bleeding into global model training.

### Competitive Moat Summary

| Feature | Tableicity | Carta/Cake |
|---|---|---|
| Data Privacy | Architectural (Isolated Schemas) | Policy-based (Centralized) |
| Verification | Cryptographic (Noir ZKPs) | Manual Audits / PDF Exports |
| Speed | Instant Seeded Sandbox | Sales/Onboarding lag |
| AI Reliability | Metered & Governor-controlled | Uncontrolled chat (expensive or hallucinations) |
| Compliance | Privacy-by-Design (EU/US Localized) | General GDPR/SOC2 |

---

## 3. Haylo AI Architecture

### The Two-Layer System
- **Layer 1 — AI Inference (The Strategist):** LLM takes proposed term sheet + tenant cap table data, simulates dilution and exit waterfalls.
- **Layer 2 — Noir Circuit (The Cryptographic Auditor):** ZKP proves the AI's output doesn't exceed authorized shares, respects anti-dilution rights, and the math isn't hallucinated. Private witnesses (names, holdings) never leave the circuit.

### The "Proposed State" Workflow
The AI **never writes directly to the database.** Flow:
1. Grok reads term sheet → outputs structured JSON intent
2. Auditor LLM cross-checks → consensus or conflict resolution loop
3. Middleware checks Proof Allocation Meter (has credits?)
4. If approved, changes execute in a **Shadow Schema** (cloned sandbox) — never the master
5. Human clicks "Verify" → Security Ritual (98% cap hold) → merge to master schema

### Key Principle
> "Tableicity never sees your cap table. Our AI proposes the strategy, your browser proves the math, and our servers simply record the truth."

---

## 4. The Four-Gate Middleware (Expanded for AI)

| Gate | Name | Function | Patent Alignment |
|---|---|---|---|
| **Gate 1** | Contextual Identity Isolation ("Who") | Every query tagged with cryptographically verified TenantID before reaching LLM. Even if AI hallucinates another company's data, middleware blocks at schema layer. | Isolated Data Architecture claim |
| **Gate 2** | Schema-Bound Query Translation ("How") | Translates LLM's natural language intent into structured, machine-readable format (SQL/API calls) matching isolated tenant's unique schema. | Live AI-Cap Table Interaction claim |
| **Gate 3** | Policy Enforcement & ZKP Check ("Should") | Before any state change, middleware runs proposed change through regulatory rules or ZKP circuits. "Black-boxed" as a "Deterministic Validation Layer." | Advanced Guardrails strategy |
| **Gate 4** | Closed-Loop Feedback & Verification ("Result") | After update, middleware verifies new state and provides "confirmation proof" back to LLM and user. | Primary Moat claim (closed-loop feedback) |

### Gate 3 "Black Box" Definition (for Foundation Filing)
- **Input Interception:** Middleware intercepts AI's proposed transaction
- **Constraint Mapping:** Fetches "Governance Rules" from Isolated Tenant Schema
- **Proof Generation:** Generates computational proof satisfying all rules without exposing cap table to broader LLM environment
- **Binary Execution:** Valid proof → commit; Invalid → "Invalid State" error back to AI

---

## 5. Dual-LLM Consensus Engine

### LLM Roles
| LLM | Role | Function |
|---|---|---|
| **Grok 4.1 Fast (The Architect)** | Primary intake engine | Parses 50-page PDFs (Term Sheets), extracts specific intent (valuations, option pool changes, dilution percentages) |
| **Auditor LLM (The Negative Constraint Checker)** | Secondary adversarial model | Only job: find reasons why Grok's proposal is illegal or mathematically inconsistent based on current tenant schema |

### The Consensus Handshake
1. **Parallel Inference:** System dispatches Term Sheet to both Grok and Auditor simultaneously
2. **JSON Synthesis:** Both models output a strictly typed `StateChangeProposal` object
3. **Comparator Logic:** Middleware executes deterministic "Deep Equal" check on JSON fields
   - **Match:** Proposal moves to the Governor
   - **Mismatch:** Conflict Resolution Loop — Auditor's critiques fed back to Grok for "Second Opinion"
4. **Governor Check:** Only after consensus does system ping Proof Allocation Meter (56) for credits

### Patent Value
Enables claiming a **"Consensus-Based Inference Architecture"** in the 2nd Non-PPA:
> "A system... where a primary inference agent generates a proposed equity state-change, and a secondary, independent verification agent must reach consensus on the logical validity of said proposal prior to cryptographic proof generation."

---

## 6. Noir Circuit Roadmap

### Currently Implemented (v1 — Foundation)
| Circuit | Status |
|---|---|
| `ownership_threshold` | Compiled, deployed, functional |

### Phase 2 Circuits (for 2nd Non-PPA, ~8 months)

| Circuit | Private Witnesses | Public Proof Output | Business Value |
|---|---|---|---|
| **Integrity Check** | Individual shareholder names & exact share counts | Proof that Sum(shares) == Total_Authorized | Auditor Trust: Verifies cap table balance without exposing CSV |
| **Down Round Shield (BBWA)** | Series A liquidation preferences, conversion prices | Proof that "Down Round" triggered correct Weighted Average adjustment | VC Relations: Proves existing rights were respected |
| **AI Scenario Validator** | Current dilution state and ESOP pool size | Proof that AI-proposed Option Pool Expansion doesn't breach board limits | Strategic AI: AI runs scenarios without "seeing" names |
| **Secondary Sale Verifier** | Seller's cost basis and holding period (Rule 144) | Proof that seller held shares long enough for legal secondary transfer | Liquidity: Automates legal checks for secondary markets |
| **KYC/AML Link** | Founder's government ID or SSN hash | Proof that UBO is not on a sanctions list | EU/US Compliance: Vital for Estonian/German server architecture |

### Circuit Code Samples (from Gemini)

**Full Ratchet Anti-Dilution:**
```noir
fn main(
    original_invest_amount: u64,
    current_shares: u64,
    pub down_round_price: u64,
    pub claimed_new_shares: u64
) {
    let new_conversion_price = down_round_price;
    let calculated_shares = original_invest_amount / new_conversion_price;
    assert(calculated_shares == claimed_new_shares);
}
```

**Broad-Based Weighted Average (BBWA):**
```noir
use dep::std;
fn main(
    prev_total_shares: u64,
    investor_original_cp: u64,
    pub new_round_investment: u64,
    pub new_shares_issued: u64,
    pub claimed_new_cp: u64
) {
    let b = new_round_investment / investor_original_cp;
    let numerator = prev_total_shares + b;
    let denominator = prev_total_shares + new_shares_issued;
    let calculated_cp2 = (investor_original_cp * numerator) / denominator;
    assert(calculated_cp2 == claimed_new_cp);
}
```

### Critical Technical Note
> Financial calculations require decimals, but ZK circuits operate on large integers (Fields). Use a Fixed-Point Library like `noir-fixed-point` — scale all values by 10^6 to maintain precision. Both AI and Noir circuits must use the **same scaling factor** to avoid "off-by-one" proof failures.

---

## 7. Patent Filing Strategy

### Bifurcated Approach

| Phase | Focus | Key Claim Targets |
|---|---|---|
| **Foundation Non-PPA (filed now)** | Foundational Tech | AI interaction with isolated schemas, Four-Gate Middleware, Schema-per-Tenant, ZKP pipeline |
| **2nd Non-PPA (~8 months)** | Specific Logic | Advanced Noir circuits (BBWA, Secondary Sale), dual-agent consensus loop, cross-border data sovereignty proofs, Metered AI Governor |

### EU "Zero Grace Day" Risk
- Unlike the US (one-year grace period), the EU requires **Absolute Novelty**
- Must file before any public disclosure in Estonia/Germany
- Use Paris Convention to claim priority from US filing for subsequent EU filings
- PCT filing within 12 months to bridge into EU/EPO

### The "Black Box" Strategy
- Claim 22 says "external inference interface" — NOT "OpenAI" or "Grok" or "Llama"
- Vendor-agnostic language protects the logic regardless of LLM changes
- Gate 3 described as "Deterministic Validation Layer" — broad claim covering all ZKP-gated AI interactions

---

## 8. Current Non-PPA Hooks for Haylo AI

These items are already (or should be) in the Foundation Non-PPA to create legal bridges for the 2nd filing:

| Hook | Location | Language |
|---|---|---|
| **Claim 22 (Bridge Claim)** | Claims section | "External inference interface configured to receive non-deterministic natural language inputs and translate said inputs into deterministic state-change requests" |
| **Computational Governor** | FIG. 2 & FIG. 3 descriptions | "The Proof Allocation Meter (56) is further configured to act as a computational governor for external inference agents" |
| **Source-Aware Tracking** | FIG. 4 description | `request_origin` metadata distinguishing manual vs. AI-initiated requests |
| **Haylo AI Annotation** | FIG. 1 drawing | Small text annotation near User Device (10): "Optional Inference Interface (Haylo AI)" |
| **Inference-Driven Interface** | FIG. 3, Step 106 | Privacy Vault Interface (54) defined as including optional Inference-Driven Interface |
| **Verification Status Mechanism** | FIG. 3, Step 112 | Feedback described as "Verification Status Confirmation Mechanism" (technical, not just UI) |

---

## 9. 2nd Non-PPA North Star Claims

### Claim 1: The Metered AI Governor
> "A system for resource-constrained autonomous equity modeling, comprising an asynchronous inference interface (Haylo AI) configured to generate a plurality of iterative equity state-change proposals, characterized in that each proposal is intercepted by a computational governor (Gate 3) which queries a real-time proof allocation meter to verify the availability of cryptographic credits prior to the execution of a Zero-Knowledge Proof (ZKP) circuit."

### Claim 2: The Consensus-Based Verification Loop
> "The system of claim 1, further comprising a secondary verification agent (Auditor LLM) operating in a consensus loop with the primary inference interface, wherein a state-change proposal is only submitted to the ZKP circuit if both agents reach a deterministic consensus on the proposal's adherence to the governance rules stored in the isolated tenant schema."

### Claim 3: Atomic Resource Deduction
> "The system of claim 1, wherein the computational governor executes an atomic deduction from the proof allocation meter only upon the successful generation of a valid cryptographic proof, such that non-deterministic 'hallucinations' or failed inference cycles by the AI agent do not deplete the tenant's metered allocation."

### Lead Claim (2nd Non-PPA)
> "A system for AI-driven corporate governance comprising an inference engine configured to iteratively generate equity state-change proposals, wherein each proposal is validated by a ZKP circuit governed by a real-time computational resource meter to prevent non-deterministic state corruption."

---

## 10. Technical Build Requirements

### Endpoints to Build
| Endpoint | Purpose |
|---|---|
| `GET /governor/check-balance` | Pre-flight handshake — AI must receive session token before generating |
| `POST /governor/deduct` | Atomic deduction on successful proof only |
| `POST /api/haylo/analyze` | Term sheet intake (Grok processing) |
| `POST /api/haylo/audit` | Auditor LLM cross-check |
| `POST /api/haylo/consensus` | Consensus comparison + conflict resolution |

### Database Changes
| Change | Details |
|---|---|
| `request_source` column | Add to `proof_usage` table: `MANUAL` vs `AI_HAYLO` |
| `haylo_sessions` table | Track AI session state, proposals, consensus results |
| `shadow_schemas` | Temporary volatile branch schemas for AI experiments |

### Frontend Components
| Component | Purpose |
|---|---|
| Haylo AI Chat Interface | Natural language term sheet interaction |
| Shadow-View Toggle | "Proposed" vs "Actual" cap table states side-by-side |
| Consensus Status Indicator | Shows Architect + Auditor agreement state |
| Security Ritual (existing) | 98% cap hold — must execute even if AI finishes in 200ms |

### JSON Handshake Schema (Both LLMs Must Follow)
```json
{
  "proposal_id": "uuid",
  "intent": "increase_option_pool",
  "parameters": {
    "new_shares": 5000,
    "price_per_share": 10.50,
    "valuation_cap": 20000000
  },
  "consensus_score": 1.0,
  "rule_violation": false,
  "zkp_circuit_requirement": "ESOP_BOUND_CHECK",
  "request_origin": "AI_HAYLO"
}
```

### API Response Codes (for Patent Documentation)
| Code | Meaning |
|---|---|
| `200` | Proposal accepted, proof generated, meter deducted |
| `402` | Proof allocation exhausted — meter at zero |
| `409` | Consensus mismatch — Architect and Auditor disagree |
| `422` | Governance rule violation detected |
| `429` | Rate limit exceeded for AI-initiated requests |

---

## 11. Future-Proof Plumbing

### Intent-to-Circuit Mapping Table
Build this in middleware now, even before circuits exist:

| AI Intent | Circuit Type | Status |
|---|---|---|
| "Verify ownership threshold" | `OWNERSHIP_THRESHOLD` | Active (v1) |
| "Increase option pool" | `ESOP_BOUND_CHECK` | Pipe ready, circuit TBD |
| "Convert SAFE to preferred" | `SAFE_MATH_VALIDATOR` | Pipe ready, circuit TBD |
| "Anti-dilution adjustment" | `CIRC_ANTI_DILUTE` | Pipe ready, circuit TBD |
| "Secondary sale compliance" | `SECONDARY_SALE_RULE144` | Pipe ready, circuit TBD |
| "KYC/AML check" | `KYC_AML_SANCTIONS` | Pipe ready, circuit TBD |

### Shadow Result Object
API response must expect `verification_status` field:
- **Today:** Returns `MOCK_VERIFIED` from Sandbox
- **Tomorrow:** Returns real Noir Proof Blob — zero code changes in AI layer

### Architecture Principle: Stateless Decoupling
- AI service = **Requestor** (generates proposals)
- NOIR service = **Prover** (generates proofs)
- These are completely decoupled — AI team and ZKP team can work independently

### Browser-Side Proving (Long-Term Vision)
- Move Noir prover to WASM in the browser
- Servers become "blind" storage/verification nodes
- Private cap table data stays in user's RAM
- Use IndexedDB as temporary "Witness" data buffer during session
- Use Web Workers to prevent UI freeze during proof generation
- This is the ultimate "Zero-Knowledge SaaS" goal — **not the launch feature**

---

## 12. Drawing Reference Numerals

### FIG. 6 Reference Numerals (Need to Add)
From Gemini's review, these should be assigned:

| Element | Suggested Numeral |
|---|---|
| Three-Layer Privacy Stack | (200) |
| Layer 1: Schema Isolation | (202) |
| Layer 2: ZKP Verification | (204) |
| Layer 3: Encrypted View | (206) |
| Normal View | (208) |
| Privacy Toggle | (210) |
| HMAC-SHA-256 Engine | (212) |
| Masked View | (214) |
| Display Priority Chain | (216) |
| Label (Priority 1) | (218) |
| Hash (Priority 2) | (220) |
| Placeholder (Priority 3) | (222) |
| RBAC Enforcement | (224) |

### FIG. 7 Reference Numerals (Need to Add)
| Element | Suggested Numeral |
|---|---|
| Progressive Onboarding Pipeline | (300) |
| Stage 1: Lead Capture | (302) |
| Stage 2: Account Creation | (304) |
| Stage 3: Atomic Provisioning | (306) |
| Stage 3a: Schema Creation | (308) |
| Stage 3b: Seed Data | (310) |
| Stage 3c: seedZkpData() | (312) |
| Stage 3d: Resources + Checklists | (314) |
| Stage 4: Silent Auto-Login | (316) |
| Stage 5: Guided First Experience | (318) |

### Existing Reference Numerals (FIG. 1-5)
| Range | Figure | Coverage |
|---|---|---|
| 10-42 | FIG. 1 | System Architecture |
| 50-56 | FIG. 2 | Seeded Sandbox |
| 100-112 | FIG. 3 | Authenticated ZKP Generation |
| 60-70 | FIG. 4 | Atomic Usage Tracking |
| 80-88 | FIG. 5 | Security Ritual UX |

---

## 13. Marketing & Launch Materials

### Branded Terms
- **Sovereign Schema Isolation** (Schema-per-Tenant)
- **Haylo AI Governor** (Four-Gate Middleware + AI)
- **Security Ritual** (98% Cap Hold UX)
- **Atomic Provisioning** (Single-click onboarding)

### Strategic Footer (for marketing pages)
> "Tableicity technology, including its Schema-per-Tenant isolation, Atomic-Metered Sandbox, and Multi-Agent AI Governance loop, is protected by multiple pending patent applications in the United States (USPTO) and International jurisdictions (EPO)."

### Video Storyboard (60-90 seconds)
1. Scene 1 (0-10s): Legacy chaos — shared database, AI grabbing random data
2. Scene 2 (10-25s): Tableicity vaults — isolated glass vaults per company
3. Scene 3 (25-45s): Haylo AI Governor — four-gate barrier, meter, consensus stamp
4. Scene 4 (45-60s): Proof of Truth — verification key sent to investor, no raw data
5. Scene 5 (60-75s): Security Ritual — 98% hold, atomic commit, snap to 100%
6. Scene 6 (75-90s): CTA — "Start Your Atomic Onboarding"

### SEO Tags
Primary: Cap Table Management, Equity Management Software, Zero Knowledge Proofs, ZKP Finance, AI Corporate Governance, Grok 4.1 AI, Multi-Tenant Security, Noir ZKP
Technical: #FinTech, #ZKP, #NoirLang, #PostgreSQL, #SchemaIsolation, #AgenticAI, #Grok, #PrivacyEngineering, #Tableicity, #PatentPending

---

## 14. Scratchpad: Critical Technical Constraints

### NOIR Version Lock (DO NOT CHANGE)
- nargo: v0.36.0
- @noir-lang/noir_js: v0.36.0
- @noir-lang/backend_barretenberg: v0.36.0

### BETA_MODE
- `BETA_MODE = true` in `server/proof-config.ts` line 7
- Compile-time constant (NOT environment variable)
- When true: all tiers get 10 proofs/month at no charge
- When false: starter=0/disabled, professional=10/month@$25 overage, enterprise=100/month@$15 overage

### Salt Handling
- Always use `toFieldSafeSalt()` — truncate to 62 hex chars = 31 bytes
- BN254 field modulus constraint

### Authentication
- Session-based ONLY (express-session + passport-local + connect-pg-simple)
- NO JWTs anywhere

### Database Architecture
- Schema-per-tenant isolation (`tenant_{slug}` PostgreSQL schemas)
- ZKP tables are PER-TENANT, NOT in public schema

### Transaction Scope
- Proof creation and usage increment are SEPARATE SQL operations
- Only the upsert itself is atomic

### PPA Curve Terminology
> "BN254 elliptic curve pair, with Pedersen operations computed on the embedded Grumpkin curve"

### Admin Accounts (all password: `admin123!`)
- abc17@gmail.com (acme + globex tenants)
- admin@exemptifi.com (platform admin)

### GitHub
- Push via API — git CLI push doesn't work with connector token

### SVG Drawing Style
- Ellipses for states, rectangles for explanation boxes
- Black/white only, Arial font, polygon arrowheads
- Reference numbers in italic

---

## 15. Path Forward

### Immediate Actions (This Sprint)
1. Add reference numerals to FIG_6 and FIG_7 SVGs (using numeral scheme from Section 12)
2. Create FIG_1, FIG_2, FIG_3 SVGs in the ellipse/Arial/BW/polygon style
3. Pass updated drawings to Non-PPA Replit for patent text alignment

### Haylo AI Build (Next Sprint — ~1-2 weeks)
1. Set up Grok API integration (LLM 1 — The Architect)
2. Set up Auditor LLM integration (LLM 2 — The Negative Constraint Checker)
3. Build the Consensus Handler (parallel inference, JSON synthesis, deep equal check)
4. Build `/governor/check-balance` and `/governor/deduct` endpoints
5. Add `request_source` column to proof_usage table
6. Build the Intent-to-Circuit mapping table in middleware
7. Build the Haylo AI chat interface (frontend)
8. Build the Shadow-View toggle (Proposed vs Actual cap table)
9. Integrate with existing Security Ritual (98% cap hold)
10. Build shadow schema branch/merge logic

### 2nd Non-PPA Preparation (~8 months)
1. Implement advanced Noir circuits (BBWA, Secondary Sale, KYC/AML)
2. Document dual-agent consensus loop with technical artifacts
3. Document cross-border data sovereignty proofs (Estonia/Germany/California)
4. Collect API response code logs as "technical artifacts" for patent evidence
5. File 2nd Non-PPA with North Star Claims from Section 9

---

*This document is the single source of truth for the Haylo AI vision. All technical decisions for the build should reference this plan. Updated as needed by the Conductor.*
