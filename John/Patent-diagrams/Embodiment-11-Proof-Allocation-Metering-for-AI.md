# Embodiment 11: Conditional Proof Allocation Metering for AI-Originated Requests with Computational Governor

_For inclusion in the Non-PPA filing as Section 16 (Detailed Description) and Embodiment 1.11 (Specific Embodiments)._

---

## Section 16. Conditional Proof Access Gating for External Inference Agent Requests

[NEW-Q] The Equity Management Platform implements a conditional proof access gating mechanism that distinguishes between non-proof approval operations and proof-generating operations initiated by the external inference interface described in Section 15. This mechanism ensures that the Proof Allocation Meter (56) functions as a Computational Governor specifically for cryptographic operations, without impeding non-cryptographic intent approvals that do not consume circuit resources.

[NEW-R] In conventional middleware architectures, access control gates are applied uniformly to all requests matching a route pattern. The Equity Management Platform departs from this pattern for inference-agent-originated requests by implementing a conditional middleware invocation model: the checkProofAccess middleware (Gate 3 — Policy Enforcement (404) as shown in FIG. 8) is not applied as a static route-level middleware on the approval endpoint. Instead, the approval route handler evaluates the executeProof parameter from the request body and invokes the checkProofAccess middleware programmatically only when the parameter is true. This conditional invocation ensures that:

(a) Intent approvals without proof generation (executeProof = false) proceed through Gate 1 (400) and Gate 2 (402) only, recording the approval in the tenant's isolated schema without querying the Proof Allocation Meter (56), without checking the tenant's subscription tier, and without consuming any cryptographic credits;

(b) Intent approvals with proof generation (executeProof = true) invoke the full four-gate pipeline, including Gate 3 (404) with its tier verification, meter query, and governance enforcement checks, before any computationally expensive NOIR circuit operation is executed; and

(c) If the conditional invocation of Gate 3 (404) determines that the tenant's proof allocation is exhausted or the subscription tier does not permit cryptographic operations, the approval request is rejected with an appropriate error response, and the intent remains in "proposed" status — available for re-approval once the allocation is replenished or the subscription is upgraded.

[NEW-S] The conditional gating mechanism operates through a Promise-based middleware wrapper that invokes checkProofAccess with the current request context and monitors the response state. If the middleware calls next() (indicating access is granted), the Promise resolves with a success signal, and the route handler proceeds with proof generation. If the middleware sends an error response (indicating access is denied — e.g., 402 "upgrade required" or 402 "limit reached"), the response is committed directly to the client, and the route handler terminates without executing any further logic. This wrapper preserves the existing middleware's response format and error semantics while enabling conditional invocation within a single route handler.

[NEW-T] The Proof Allocation Meter (56) enforces a billing-period-scoped usage limit through the proof_usage table, which maintains a UNIQUE constraint on (tenant_id, billing_month). Usage is tracked via an atomic PostgreSQL upsert (INSERT ... ON CONFLICT DO UPDATE) that increments the proof_count field only upon successful proof generation — as described in Gate 4 (406) of FIG. 8. This atomic increment is executed identically for both manual (request_source: "MANUAL") and AI-originated (request_source: "AI_HAYLO") proof requests, ensuring that:

(a) A single shared meter governs the total cryptographic operations per tenant per billing period, regardless of the request source;

(b) Failed proof generation attempts — whether due to circuit constraint violations (e.g., ownership below threshold), commitment hash mismatches, or infrastructure errors — do not decrement the allocation, as the usage increment occurs only after successful proof storage via createProofResult() (65);

(c) The meter cannot be circumvented by routing requests through the inference interface rather than the manual Privacy Vault Interface (54), because both paths converge at the same checkProofAccess middleware and the same incrementProofUsage() function.

[NEW-U] The Computational Governor behavior described in FIG. 9 at the Meter Pre-Flight Check (508) is architecturally significant for AI-originated requests because inference engines, unlike human users, can generate rapid sequences of intent-to-approval requests. Without the Governor Hard-Stop mechanism, an automated or semi-automated workflow could exhaust a tenant's proof allocation within seconds. The conditional gating ensures that even if the inference engine proposes multiple proof-eligible intents in rapid succession, each approval with executeProof = true is individually checked against the remaining allocation before any circuit execution begins.

---

## Embodiment 1.11: Meter Governance Enforcement for Sequential AI-Originated Proof Requests

[NEW-V] In an eleventh embodiment, a tenant administrator on a professional subscription tier (maxProofsPerMonth: 10) uses the Haylo AI console interface to perform multiple ownership verifications in sequence, demonstrating the Computational Governor behavior of the Proof Allocation Meter (56) for AI-originated requests.

[NEW-W] The administrator has previously consumed 8 proof allocations during the current billing period (7 manually via the Privacy Vault Interface (54), and 1 via a prior Haylo AI approval with executeProof = true). The proof_usage table for the tenant records proof_count: 8 for the current billing month.

[NEW-X] The administrator submits a first natural language query to the External Inference Engine (502): "Does Alex Rivera own at least 5% of Common Stock?" The inference engine returns a structured intent with canGenerateProof: true. The administrator approves with executeProof = true. The Application Server (20) conditionally invokes checkProofAccess, which retrieves the tenant's plan ("professional"), obtains the tier configuration (maxProofsPerMonth: 10), queries the current usage (8), and confirms that 8 < 10. The request proceeds through NOIR Circuit Execution (510), the proof is generated and stored, and incrementProofUsage() atomically updates the count to 9. The intent is marked "executed" with request_source: "AI_HAYLO".

[NEW-Y] The administrator submits a second query: "Verify that the founding team collectively holds more than 51% of voting shares." The inference engine returns a structured intent with canGenerateProof: true. The administrator approves with executeProof = true. The conditional invocation of checkProofAccess queries the updated usage (9), confirms 9 < 10, and permits the request. The proof is generated, the count is atomically incremented to 10, and the intent is marked "executed" with request_source: "AI_HAYLO".

[NEW-Z] The administrator submits a third query: "Check if Series B investors hold at least 20% of preferred shares." The inference engine returns a structured intent with canGenerateProof: true. The administrator approves with executeProof = true. The conditional invocation of checkProofAccess queries the usage (10), determines that 10 >= 10 (the monthly limit), and returns a 402 "limit_reached" response. No NOIR circuit execution occurs. No usage is incremented. The intent remains in "proposed" status — the administrator may re-approve without proof execution (executeProof = false) to record the analysis without consuming circuit resources, or wait until the next billing period when the allocation resets.

[NEW-AA] Had the administrator approved any of these intents without requesting proof generation (executeProof = false), the approval would have succeeded regardless of the meter state. The third intent, for example, could be approved as a non-proof analytical result — recording the AI's equity analysis and recommendations in the tenant's intent history — without triggering Gate 3 (404) or consuming any allocation. This distinction ensures that the inference interface remains useful for equity analysis and scenario modeling even when the cryptographic proof allocation is fully consumed.

[NEW-BB] The source-tagging mechanism produces the following audit trail in the tenant's proof_requests table for this session:

| Request ID | Request Source | Status   | Proof Type            |
|-----------|---------------|----------|-----------------------|
| pr-001    | AI_HAYLO      | complete | ownership_threshold   |
| pr-002    | AI_HAYLO      | complete | ownership_threshold   |

Combined with the 7 prior manual requests (request_source: "MANUAL"), the tenant's billing-period usage of 10 is accurately attributed: 7 manual, 3 AI-originated (2 successful, 1 blocked by the Governor). This differential attribution enables the platform administrator to analyze the ratio of human-initiated to AI-initiated cryptographic operations across all tenants, informing capacity planning and pricing decisions for future billing periods.

[NEW-CC] This embodiment demonstrates three properties of the Computational Governor mechanism for AI-originated requests: (1) the shared meter treats manual and AI requests identically for quota enforcement, preventing allocation circumvention via the inference interface; (2) the conditional gating preserves the utility of the inference interface for non-cryptographic analysis even when the proof allocation is exhausted; and (3) the source-tagging mechanism enables precise attribution of cryptographic resource consumption to the originating interface, supporting audit, compliance, and monetization analytics within each tenant's isolated schema.
