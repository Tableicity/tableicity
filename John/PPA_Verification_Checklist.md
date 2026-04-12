# PPA Expansion — Cross-Verification Checklist

Every claim in the expanded PPA has been verified against the actual codebase. No claim describes functionality that does not exist.

## New Detailed Description Sections

| Section | Key Code Reference | Verified In File | Status |
|---------|-------------------|-----------------|--------|
| 10. Progressive Onboarding Pipeline | `provisionSandboxForUser()` | server/seed.ts | VERIFIED |
| 10. Stage 1 — Lead Capture | `POST /api/trial-signup`, `trialSignups` table | server/trial.ts, shared/schema.ts | VERIFIED |
| 10. Stage 2 — Account Creation | `POST /api/trial-create-account`, bcrypt 12 rounds | server/trial.ts | VERIFIED |
| 10. Stage 3 — Atomic Provisioning | `GET /api/trial-verify` → `provisionSandboxForUser()` | server/trial.ts → server/seed.ts | VERIFIED |
| 10. Schema creation | `CREATE SCHEMA IF NOT EXISTS` | server/tenant.ts (line 49) | VERIFIED |
| 10. 20+ tables | Table DDL statements | server/tenant.ts | VERIFIED |
| 10. seedZkpData (4 commitments + 1 proof) | `seedZkpData()` | server/seed.ts | VERIFIED |
| 10. seedTestDriveDocuments | `seedTestDriveDocuments()` | server/seed.ts | VERIFIED |
| 10. Stage 4 — Silent auto-login | `POST /api/trial-auto-login`, Passport `req.login()` | server/trial.ts | VERIFIED |
| 10. Stage 5 — Tenant Provider | `TenantProvider`, localStorage `tableicty_tenant` | client/src/lib/tenant-context.tsx | VERIFIED |
| 11. Sandbox-to-Live Transition | `POST /api/trial-create-organization` | server/trial.ts | VERIFIED |
| 11. Dual-state concurrent access | `TenantProvider` tenant list + switcher | client/src/lib/tenant-context.tsx | VERIFIED |
| 11. search_path routing | `SET search_path TO "tenant_{slug}", public` | server/tenant.ts (line 22) | VERIFIED |
| 12. tenant_members table | `pgTable("tenant_members", ...)` | shared/schema.ts | VERIFIED |
| 12. tenantMiddleware chain | `tenantMiddleware()` | server/routes.ts (line 32) | VERIFIED |
| 12. getUserTenantRole | `getUserTenantRole()` | server/auth.ts (line 601) | VERIFIED |
| 12. requireRole middleware | `requireRole()` | server/routes.ts (line 62) | VERIFIED |
| 12. isPlatformAdmin bypass | `req.user.isPlatformAdmin` check | server/routes.ts | VERIFIED |
| 13. Stripe checkout metadata | `metadata: { userId, tierId, tenantId }` | server/stripe.ts (line 153) | VERIFIED |
| 13. Webhook plan update | `db.update(tenants).set({ plan: tierId })` | server/stripe.ts (line 231) | VERIFIED |
| 13. checkProofAccess reads plan | `getProofTierConfig(tenant.plan)` | server/proof-middleware.ts (line 23) | VERIFIED |
| 13. noirEnabled flag | `config.noirEnabled` check | server/proof-middleware.ts (line 26) | VERIFIED |
| 14. Five instrument types | esop_pools/plans/grants, warrants, phantom_grants, sars, securities | shared/schema.ts, server/routes.ts | VERIFIED |
| 14. ESOP exercise → createSecurity | `req.tenantStorage!.createSecurity()` | server/routes.ts (line 1323+) | VERIFIED |
| 14. Warrant exercise → createSecurity | `createSecurity()` in warrant PATCH | server/routes.ts | VERIFIED |
| 14. SAR conditional settlement | `settlementType === 'stock'` check | server/routes.ts | VERIFIED |
| 14. Phantom = no cap table impact | Payout only, no createSecurity call | server/routes.ts (line 1531+) | VERIFIED |
| 14. computeVestedShares | `computeVestedShares()` | server/utils/vesting.ts (line 9) | VERIFIED |
| 14. Server-side validation at exercise | `vested - alreadyExercised` check | server/routes.ts | VERIFIED |

## New Claims

| Claim | Description | Code Reference | Status |
|-------|------------|----------------|--------|
| 19 | Progressive onboarding with atomic provisioning | server/trial.ts + server/seed.ts pipeline | VERIFIED |
| 20 | Platform resource seeding with deduplication | `seedPlatformResourcesToTenant()` in server/seed.ts | VERIFIED |
| 21 | Synthetic proofs in same pipeline as live | `seed_demo_` prefix, same verification endpoint | VERIFIED |
| 22 | Dual-state environment operation | TenantProvider + tenantMiddleware routing | VERIFIED |
| 23 | No re-authentication on transition | Session continuity across tenant switch | VERIFIED |
| 24 | Multi-org membership with schema-routed RBAC | tenant_members + tenantMiddleware + requireRole | VERIFIED |
| 25 | DB-level schema isolation enforcement | `SET search_path` prevents cross-tenant queries | VERIFIED |
| 26 | Subscription-integrated cryptographic monetization | Stripe webhook → tenants.plan → checkProofAccess | VERIFIED |
| 27 | Dual config maps via BETA_MODE | PROOF_TIER_BETA vs PROOF_TIER_PRODUCTION | VERIFIED |
| 28 | Webhook signature verification + metadata scoping | Signature check in production, metadata extraction | VERIFIED |
| 29 | Multi-instrument with differentiated cap table impact | Exercise routes with conditional createSecurity | VERIFIED |
| 30 | Server-side vesting at exercise time | computeVestedShares() called in exercise route | VERIFIED |
| 31 | Guided onboarding with seeded checklists | seedTestDriveDocuments + category tags + banners | VERIFIED |
| 32 | Platform resource auto-propagation | seedPlatformResourcesToTenant + adminOnly interlock | VERIFIED |

## Gemini Fabrications — Confirmed NOT in PPA

| Fabrication | In Expanded PPA? | Status |
|-------------|-----------------|--------|
| Client-side ZKP execution | NO | SAFE |
| Single-use execution token | NO | SAFE |
| Non-authenticated proof generation | NO | SAFE |
| Verification Certificate document | NO | SAFE |
| Local salt storage in Secure Enclave/TEE | NO | SAFE |
| Distributed ledger / blockchain | NO | SAFE |
| Erasure coding / Reed-Solomon | NO | SAFE |
| 8-Node Shredder | NO | SAFE |
| Recursive SNARKs / batched proofs | NO | SAFE |

## Summary

- **Original PPA**: 18 claims (Claims 1-18)
- **Expanded PPA**: 32 claims (Claims 1-32)
- **New claims added**: 14 (Claims 19-32)
- **New Detailed Description sections**: 5 (Sections 10-14)
- **New Embodiments**: 3 (Embodiments 4-6)
- **New Diagrams**: 3 (Diagrams 3-5)
- **Fabricated claims included**: 0
- **Every claim traceable to code**: Yes
