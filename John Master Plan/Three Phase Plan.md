# Tableicity: Three Phase Plan

**Created:** April 8, 2026
**Author:** App Builder Replit

---

## Phase 1 — Finish the Drawings (Now, Before Any Code)

We have 3 missing figures (FIG_1, FIG_2, FIG_3) and 2 figures needing reference numerals (FIG_6, FIG_7). This is pure patent work — no code changes. Once done, the Non-PPA Replit and the Professor have a complete, consistent set of 7 drawings to finalize the filing.

### Deliverables
- Create FIG_1 SVG (System Architecture: User Device, Four-Gate Middleware, Application Server, NOIR Circuit Engine, isolated tenant Database Schemas)
- Create FIG_2 SVG (Seeded Sandbox: seedZkpData() Initialization, Mock Securities Data Store, Privacy Vault Interface, Proof Allocation Meter)
- Create FIG_3 SVG (Authenticated ZKP Generation: authentication through proof request, allocation verification, circuit execution, Verification URL return)
- Update FIG_6 SVG with reference numerals (200-224 range)
- Update FIG_7 SVG with reference numerals (300-318 range)

### Style Requirements (All Drawings)
- Ellipses for states
- Rectangles for explanation boxes
- Black/white only
- Arial font
- Polygon arrowheads
- Reference numbers in italic

### Completion Criteria
All 7 figures exist in the John folder, in consistent style, with complete reference numerals that can be cited in the Detailed Description.

---

## Phase 2 — Build Haylo AI into Tableicity (Next Sprint, ~1-2 Weeks)

This is the real code work. Approached in dependency order:

### Step 1: Plumbing First
Small, low-risk additions that create the "pipes" for everything else.
- `/governor/check-balance` endpoint (pre-flight handshake)
- `/governor/deduct` endpoint (atomic deduction on success)
- `request_source` column added to `proof_usage` table (`MANUAL` vs `AI_HAYLO`)
- Intent-to-Circuit mapping table in middleware
- `verification_status` field in proof API responses

### Step 2: LLM Integration
The core "brain" of Haylo AI.
- Grok API integration (LLM 1 — The Architect)
- Auditor LLM integration (LLM 2 — The Negative Constraint Checker)
- Consensus Handler (parallel inference, JSON synthesis, deep equal check, conflict resolution loop)
- Structured `StateChangeProposal` JSON output pipeline

### Step 3: Frontend
The user-facing Haylo AI experience.
- Haylo AI chat interface for natural language term sheet interaction
- Shadow-View toggle (Proposed vs Actual cap table states side-by-side)
- Consensus Status Indicator (Architect + Auditor agreement state)
- Integration with existing Security Ritual (98% cap hold must execute even if AI finishes in 200ms)

### Step 4: Shadow Schema
The most architecturally complex piece.
- Branch logic: clone current `tenant_schema` into temporary `volatile_branch_schema` on AI request
- Execute: AI's consensus-approved changes applied to volatile branch only
- Audit: Four-Gate checks run against the branch
- Merge: Only on explicit human "Verify" approval does branch merge into master tenant schema
- Cleanup: Volatile branch dropped after merge or timeout

### Completion Criteria
Haylo AI chat interface operational. User can input a term sheet scenario, see AI consensus, view proposed vs actual cap table, approve via Security Ritual, and have changes merge to production schema. Proof Allocation Meter governs all AI-initiated proof requests.

---

## Phase 3 — 2nd Non-PPA Preparation (~8 Months)

Advanced circuits and documentation for the second patent filing.

### Technical Build
- Implement advanced Noir circuits: BBWA (Broad-Based Weighted Average), Secondary Sale Verifier (Rule 144), AI Scenario Validator (ESOP breach), KYC/AML Link (sanctions check)
- Fixed-point scaling library integration (both AI and Noir must use same 10^6 scaling factor)
- Cross-border data sovereignty proofs (Estonia/Germany/California routing logic)

### Patent Documentation
- Document dual-agent consensus loop with technical artifacts (API response codes, consensus JSON logs)
- Collect `request_source` usage data as evidence of AI-governed metering in production
- Document the Intent-to-Circuit mapping as a "Deterministic Translation Pipeline"
- Prepare 2nd Non-PPA with North Star Claims: Metered AI Governor, Consensus Verification Loop, Atomic Resource Deduction

### Filing
- File 2nd Non-PPA at USPTO
- Claims reference priority date from Foundation Non-PPA
- PCT filing for EU/EPO if not already done

### Completion Criteria
All advanced Noir circuits compiled and functional. Dual-agent consensus loop documented with production evidence. 2nd Non-PPA filed with claims that build on the Foundation filing's architectural hooks (Claim 22, Computational Governor language, source-aware tracking).

---

*No action to be taken until John and App Builder Replit agree on the Phase 1 plan.*
