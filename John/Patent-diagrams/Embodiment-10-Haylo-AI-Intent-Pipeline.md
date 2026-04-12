# Embodiment 10: AI-Driven Equity Analysis via External Inference Interface with Human-in-the-Loop Approval

_For inclusion in the Non-PPA filing as Section 15 (Detailed Description) and Embodiment 1.10 (Specific Embodiments)._

---

## Section 15. External Inference Interface for Natural-Language-to-Middleware Translation

[NEW-A] The Equity Management Platform further comprises an external inference interface that enables natural-language-driven equity analysis and state-change operations while maintaining the deterministic access control, schema isolation, and cryptographic verification constraints of the Four-Gate Middleware (12). This interface, referred to as the Haylo AI Intent Pipeline, accepts unstructured natural language descriptions of equity scenarios from a user and transforms them into structured, deterministic intent objects through an external inference engine, subject to mandatory human review before any state change is committed.

[NEW-B] The inference interface operates on a fundamental architectural principle: the external inference engine (502) is a stateless, vendor-agnostic service that has no direct access to tenant data, cannot write to any database, and cannot bypass any gate of the Four-Gate Middleware (12). All state changes proposed by the inference engine must pass through the identical four-gate pipeline (400, 402, 404, 406 as shown in FIG. 8) applied to manual user requests, with an additional human-in-the-loop approval gate interposed between inference output and middleware execution.

[NEW-C] The system maintains a per-tenant intent lifecycle table (haylo_intents) within each tenant's isolated schema, tracking the complete state history of each inference request. Each intent record stores: the original natural language input, the structured JSON output produced by the inference engine, the raw inference response for audit purposes, the intent status (pending, analyzing, proposed, approved, rejected, executed, or failed), an optional reference to any proof request generated upon approval, and timestamps for creation and resolution. This table is provisioned alongside all other tenant tables during the atomic schema provisioning sequence described in Section 10 and FIG. 7.

[NEW-D] The intent lifecycle proceeds through the following stages:

Stage 1 — Natural Language Submission: The user submits an unstructured equity scenario description (e.g., "Can you verify that Jane Smith owns more than 10% of common shares?") via a dedicated console interface on the User Device (10). The Application Server (20) creates an intent record with status "analyzing" in the tenant's isolated schema.

Stage 2 — Inference Processing: The Application Server (20) forwards the user's input, along with non-sensitive tenant context (company name and subscription plan), to the External Inference Engine (502). The inference engine processes the input using a constrained system prompt that enforces structured JSON output containing: an intent type classification (ownership_verification, dilution_analysis, safe_conversion, term_sheet_review, or equity_scenario), extracted parameters, actionable recommendations, and a boolean flag indicating whether the scenario can trigger a Zero-Knowledge Proof generation. The inference engine's temperature parameter is set to 0.3 to maximize deterministic output consistency.

Stage 3 — Structured Intent Presentation: Upon receiving the inference response, the Application Server (20) extracts the structured JSON from the raw response, updates the intent record to status "proposed" with the structured output stored in a JSONB column, and returns the structured intent to the User Device (10) for human review. If the inference response cannot be parsed into valid JSON, the system creates a fallback "clarification_needed" intent with the raw response excerpt, ensuring graceful degradation without system failure.

Stage 4 — Human-in-the-Loop Review: The user reviews the structured intent on the console interface, which presents the intent type, summary, extracted parameters, recommendations, and — if applicable — proof parameters (stakeholder reference, share class, share count, and threshold percentage). The user may approve or reject the intent. Rejection records a reason and terminates the lifecycle. Approval may optionally include an executeProof flag indicating whether the approved intent should trigger Zero-Knowledge Proof generation.

Stage 5 — Conditional Middleware Execution: Upon approval without proof execution, the intent status is updated to "approved" and the lifecycle concludes — no middleware gates beyond Gate 1 (400) and Gate 2 (402) are traversed. Upon approval with proof execution (executeProof = true), the request is conditionally subjected to Gate 3 — Policy Enforcement and ZKP Check (404) of the Four-Gate Middleware as shown in FIG. 8. This conditional gating ensures that non-proof approvals are never blocked by subscription tier limits or meter exhaustion, while proof-generating approvals are fully governed by the same access control and metering pipeline applied to manual proof requests.

[NEW-E] A critical security property of the inference interface is the source-tagging mechanism: every proof request generated through the Haylo AI pipeline is tagged with a request_source field set to "AI_HAYLO" in the proof_requests table, distinguishing it from manually initiated proof requests tagged as "MANUAL." This source-awareness enables differential auditing, usage analytics, and regulatory reporting that distinguishes between human-initiated and AI-initiated cryptographic operations within each tenant's isolated schema.

[NEW-F] The inference interface is gated at the frontend by a feature flag (VITE_HAYLO_ENABLED), following the same pattern as the NOIR feature flag (VITE_NOIR_ENABLED) described in Section 5. When disabled, the sidebar navigation, console page, and activity log page are not rendered, and no inference API routes are accessible. This flag operates independently of the BETA_MODE constant, allowing the inference interface to be enabled or disabled without affecting the Four-Gate Middleware configuration.

---

## Embodiment 1.10: AI-Driven Ownership Verification via Haylo AI Intent Pipeline

[NEW-G] In a tenth embodiment, as shown in FIG. 9, a tenant administrator accesses the Haylo AI console interface on the User Device (10) to verify a stakeholder's ownership position using natural language, without directly interacting with the Privacy Vault Interface (54) or manually configuring proof parameters.

[NEW-H] The administrator submits a natural language query: "Verify that Sarah Chen holds at least 15% of Series A Preferred shares." The Application Server (20) creates an intent record in the tenant's haylo_intents table within the isolated Database Schema (30) with status "analyzing" and forwards the input to the External Inference Engine (502) along with non-sensitive tenant context (company name and subscription plan).

[NEW-I] As illustrated in FIG. 9, the External Inference Engine (502) processes the natural language input and produces Deterministic Intent Output (504) in structured JSON format:

```json
{
  "intentType": "ownership_verification",
  "summary": "Verify Sarah Chen's ownership of at least 15% of Series A Preferred shares",
  "parameters": {
    "stakeholder": "Sarah Chen",
    "shareClass": "Series A Preferred",
    "threshold": 15
  },
  "recommendations": [
    "Ensure commitment records exist for Sarah Chen's Series A Preferred holdings",
    "Verify the share count against the cap table before proof generation"
  ],
  "canGenerateProof": true,
  "proofParameters": {
    "holderRef": "Sarah Chen",
    "shareClass": "Series A Preferred",
    "shares": 50000,
    "threshold": 15
  }
}
```

The Application Server (20) updates the intent record to status "proposed" and presents the structured intent to the administrator's User Device (10).

[NEW-J] The administrator reviews the structured intent on the console interface, confirming that the extracted parameters match the intended verification. The console displays the intent type ("ownership_verification"), the human-readable summary, the extracted proof parameters, and the AI's recommendations. Satisfied with the extraction, the administrator clicks "Approve & Generate Proof," setting executeProof = true.

[NEW-K] Referring to FIG. 9, the approval request enters the Four-Gate Middleware Interception (506). Because executeProof is true, the system conditionally invokes the checkProofAccess middleware (Gate 3 — Policy Enforcement (404) as shown in FIG. 8). The Meter Pre-Flight Check (508) queries the Proof Allocation Meter (56) to verify that the tenant has remaining cryptographic credits for the current billing period. The middleware retrieves the tenant's plan (e.g., "professional"), calls getProofTierConfig("professional") which returns { noirEnabled: true, maxProofsPerMonth: 10 }, and confirms that the current usage count (e.g., 3) is below the limit.

[NEW-L] With proof access granted, the Application Server (20) proceeds to validate the proof parameters against the committed cap table data. The system retrieves the commitment record for "Sarah Chen" and "Series A Preferred" from the tenant's isolated schema, computes a SHA-256 hash of the share data combined with the stored salt, and verifies that the computed hash matches the stored commitment hash. If the Pedersen commitment has not been previously computed for this record, the system generates it via the test_hash helper circuit and caches it in the commitment record's pedersenCommitment field.

[NEW-M] As shown in FIG. 9 at NOIR Circuit Execution (510), the Application Server (20) invokes the ownership_threshold circuit via the NOIR Circuit Engine (40) with the validated parameters. The AI never touches the cryptographic math directly — the middleware triggers the existing circuit infrastructure. Upon successful proof generation, the Atomic Result with Metered Deduction (512) stores the proof record via createProofResult() (65) and increments the usage counter via incrementProofUsage() (66) using a PostgreSQL upsert that is race-condition-proof (68). The proof request record is tagged with request_source: "AI_HAYLO" to distinguish it from manually initiated proofs.

[NEW-N] The intent record is updated to status "executed" with a reference to the generated proof request ID. The Verified Result Output (514) returns the proof confirmation and Verification URL (42) to the administrator's User Device (10), displayed through the Security Ritual UX (FIG. 5) with the animated progress sequence transitioning from IDLE (80) through PROCESSING (82) and 98% CAP (84) to VERIFIED (86).

[NEW-O] Had the administrator approved the intent without requesting proof generation (executeProof = false), the intent would have been recorded as "approved" without invoking Gate 3 (404), without consuming any proof allocation credits, and without executing any NOIR circuit operations. Had the Proof Allocation Meter (56) been exhausted at the time of approval, the system would have returned a 402 response indicating the meter limit was reached, without executing any computationally expensive circuit operation — the Governor Hard-Stop mechanism shown in FIG. 9 ensures that AI-originated requests are blocked at the meter check before any circuit resources are consumed.

[NEW-P] This embodiment demonstrates three distinguishing properties of the Haylo AI integration: (1) the non-deterministic natural language input is transformed into a deterministic, structured intent before any system action occurs; (2) no state change is committed without explicit human approval — the inference engine proposes, the human disposes; and (3) AI-originated proof requests are subject to the identical Four-Gate Middleware pipeline as manual requests, with the additional source-tagging mechanism enabling differential auditability of human-initiated versus AI-initiated cryptographic operations within each tenant's isolated schema.
