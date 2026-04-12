# BRIEF DESCRIPTION OF THE DRAWINGS

**FIG. 1** is a system architecture diagram depicting the multi-layered component interaction flow of the privacy-preserving equity management platform, showing the User Device, Four-Gate Middleware, Application Server, NOIR Circuit Engine, and a plurality of isolated tenant Database Schemas across browser, server, and database layers.

**FIG. 2** is a block diagram of the Seeded Sandbox environment, illustrating the seedZkpData() Initialization Function, Mock Securities Data Store, Privacy Vault Interface, and Proof Allocation Meter within a tenant's isolated schema.

**FIG. 3** is a method flow diagram depicting the sequential steps of authenticated Zero-Knowledge Proof generation, from user authentication and tenant schema initialization through proof request, allocation verification, server-side circuit execution, and Verification URL return.

**FIG. 4** is a detailed process diagram of the proof generation and atomic usage tracking pipeline, showing the Incoming Proof Request, circuit parameter validation, ownership_threshold circuit execution, proof record storage via createProofResult(), and the separate atomic usage increment via PostgreSQL upsert through incrementProofUsage().

**FIG. 5** is a state transition diagram of the Security Ritual UX, depicting the five interface states — IDLE, PROCESSING, 98% CAP, VERIFIED, and ERROR — with transitions governed by user input, progress threshold, server-side proof completion, and failure conditions, including the requestAnimationFrame-based progress cap mechanism.

**FIG. 6** is a data flow diagram of the Encrypted View privacy toggle system, depicting the three-layer privacy stack (Schema Isolation, ZKP Verification, Visual Masking), the HMAC-SHA-256 hashing flow from normal view to masked view using companyId as the HMAC key, the display priority chain (Label over Hash over Placeholder), and the role-based access control governing label editing.

**FIG. 7** is a process flow diagram of the progressive onboarding pipeline with atomic schema provisioning, depicting the five sequential stages — Lead Capture, Account Creation, Email Verification with Atomic Provisioning, Silent Auto-Login, and Guided First Experience — wherein a single email verification event triggers the creation of an isolated database schema, seeding of equity data, generation of cryptographic commitment records and a pre-verified Zero-Knowledge Proof, and establishment of an authenticated session without re-entry of credentials.
