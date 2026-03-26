# Tableicity — Equity Management Platform

**Own Your Equity, Privately.**

Tableicity is a multi-tenant SaaS platform that gives startups complete control over their capitalization tables, equity instruments, SAFE agreements, and investor communications — all secured with tenant-isolated databases, encrypted privacy views, and zero-knowledge cryptographic proofs.

Built for founders who refuse to treat their ownership data as public property.

---

## Table of Contents

- [Vision](#vision)
- [Key Features](#key-features)
- [Privacy Vault (Zero-Knowledge Proofs)](#privacy-vault-zero-knowledge-proofs)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment Guide](#aws-deployment-guide)
- [Project Structure](#project-structure)
- [Development Milestones](#development-milestones)
- [Current Status](#current-status)
- [Roadmap](#roadmap)
- [License](#license)

---

## Vision

Most equity management tools are built for investors. Tableicity is built for **founders**.

Every startup deserves a secure, affordable way to manage their cap table, issue equity, track SAFEs, and communicate with investors — without handing sensitive ownership data to a third-party platform that monetizes access. Tableicity gives each company its own isolated database schema, encrypted views for sensitive data, zero-knowledge proof verification of ownership claims, and full control over who sees what.

---

## Key Features

### Cap Table Management
- **Share Classes** — Define Common, Preferred, and Option share classes with custom terms (liquidation preferences, conversion ratios, anti-dilution provisions)
- **Securities Tracking** — Issue, track, and manage all outstanding certificates with full audit trail
- **Stakeholder Directory** — Manage founders, investors, employees, advisors, and board members with role-based access
- **Dashboard** — Real-time ownership overview, key metrics, and employee equity utilization charts

### Equity Instruments (5 Types)
- **Stock Options (ESOP)** — Full Pool → Plan → Grant → Exercise hierarchy with server-side vesting computation (cliff vesting, monthly/quarterly schedules)
- **Warrants** — Standalone warrant issuance and exercise tracking with cap table impact
- **Phantom Shares** — Cash-settled phantom equity grants (no cap table dilution)
- **Stock Appreciation Rights (SARs)** — Both cash-settled and stock-settled variants
- **Direct Stock (Securities)** — Common and preferred share certificates

### SAFE Agreements
- **3-Step Creation Wizard** — Guided flow for creating SAFEs with investment amount, valuation cap, discount rate, and MFN provisions
- **Template Library** — Reusable SAFE document templates with variable injection
- **PDF Generation** — Client-side PDF export with jsPDF
- **Status Workflow** — Draft → Active → Converted lifecycle tracking

### Data Room & Documents
- **Secure Document Storage** — Upload, organize, and share documents with stakeholders
- **Category Management** — Dynamic categories (Test Drives, Documents, Notes, custom categories)
- **Platform Resource Library** — Master documents auto-seeded to new tenants
- **Document Deduplication** — Prevents duplicate uploads

### Privacy & Security
- **Encrypted View (Privacy Mode)** — Toggle that replaces stakeholder names with SHA-256 HMAC hashes (`0x{first8}...{last4}`), with custom editable labels per stakeholder
- **Schema-Per-Tenant Isolation** — Each company gets its own PostgreSQL schema, eliminating cross-tenant data leaks
- **Role-Based Access Control** — Platform Admin, Tenant Admin, Tenant Staff, and Shareholder roles
- **Email-Verified MFA** — Two-factor authentication via email verification codes
- **Comprehensive Audit Logs** — Every action tracked with user, IP, timestamp, and entity details

### Onboarding & Trial
- **3-Click Onboarding** — Lead capture → Email verification → Sandbox provisioning
- **Test Drive System** — Guided banners on equity plan pages with pre-seeded sample data
- **Sandbox Environments** — New users get a fully populated demo organization to explore

### Investor Relations
- **Investor Updates** — Draft, preview, and distribute company communications to stakeholders
- **My Position Portal** — Shareholder self-service view of their holdings and vesting schedules

### Subscription & Billing
- **Three Pricing Tiers** — Starter ($49/mo), Professional ($149/mo), Enterprise ($399/mo)
- **Stripe Integration** — Checkout sessions with tenant-scoped metadata, customer portal, webhook-driven subscription sync with signature verification
- **Profile Page** — Account settings, password management, and billing history

### Platform Administration
- **Multi-Tenant Management** — Create, configure, and monitor tenant organizations
- **User Administration** — Platform-wide user management and role assignment
- **Platform Resources** — Curated resource library with admin-only private resources
- **Compliance Section** — 401A Validations, Form 3921, Rule 701, ASC 718 (Pro Feature placeholders)

---

## Privacy Vault (Zero-Knowledge Proofs)

Tableicity integrates Aztec's [Noir](https://noir-lang.org/) zero-knowledge proving system to let stakeholders prove ownership claims without revealing exact share counts.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Proof Lifecycle                        │
│                                                          │
│  1. COMMIT    Cap table data → SHA-256 + Pedersen hash  │
│  2. GENERATE  Noir circuit proves: shares ≥ threshold   │
│  3. VERIFY    Anyone can verify proof via public URL     │
│  4. EXPIRE    Proofs auto-expire after 72 hours          │
└─────────────────────────────────────────────────────────┘
```

### Key Properties

- **Zero-Knowledge** — The verifier learns only that the prover holds at least X shares. The exact number is never revealed.
- **Non-Interactive** — Once generated, proofs can be verified by anyone with the proof ID. No interaction with the prover required.
- **Tamper-Proof** — Proofs are cryptographically bound to the committed cap table data. Any alteration invalidates the proof.
- **Time-Limited** — Each proof has a 72-hour TTL. Expired proofs cannot be verified.

### Architecture

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Circuit | Noir v0.36.0 (`ownership_threshold`) | Proves shares ≥ threshold without revealing exact count |
| Backend | `@noir-lang/noir_js` + `backend_barretenberg` (UltraHonk) | Witness generation, proof creation, verification |
| Commitments | SHA-256 hash + Pedersen commitment (BN254 curve) | Bind proof to cap table data without exposing values |
| Salt | 31-byte field-safe values (248 bits, fits BN254 modulus) | Prevent brute-force recovery of share counts |

### Monetization Tiers

| Plan | Monthly Proofs | Overage | Noir Enabled |
|------|---------------|---------|-------------|
| Starter | 0 | — | No |
| Professional | 10 | $25/proof | Yes |
| Enterprise | 100 | $15/proof | Yes |

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/proofs/ownership` | Required + Plan Gating | Generate an ownership threshold proof |
| `POST` | `/api/v1/proofs/verify` | Required | Verify proof with raw hex inputs |
| `GET` | `/api/v1/proofs/usage` | Required | Monthly usage and plan limits |
| `GET` | `/api/v1/proofs/commitments` | Required | List active commitment records |
| `GET` | `/api/v1/proofs/:proofId` | Required | Retrieve proof status and metadata |
| `GET` | `/api/v1/verify/:proofId` | Public (Rate Limited) | Public verification — returns status only, no PII |

### Security Guarantees

- Private inputs (share counts, salt values) are **never** included in any API response
- `proofHex` and `verificationKeyHex` are stored in the database but **never** returned to clients
- The public verify endpoint returns **only** `{proofId, proofType, status, createdAt, expiresAt, isValid}` — no tenant info, no holder info, no PII
- Rate limited to 10 requests per minute per IP on the public verify endpoint
- CORS enabled (`Access-Control-Allow-Origin: *`) on public verify for cross-origin verification
- Feature access enforced **server-side** via `checkProofAccess` middleware — not client-only gating

### Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/privacy-vault` | Required | Generate proofs, view usage meter, browse proof history |
| `/verify-proof` | Required | Internal proof verification by ID |
| `/audit-proofs` | Required | Complete audit trail of all proof activity |
| `/public/verify/:proofId` | None | Public verification page with ZKP badge |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (React)                         │
│  Vite + Tailwind CSS + shadcn/ui + TanStack Query        │
│  wouter routing │ Recharts │ jsPDF │ Framer Motion       │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP/JSON
┌──────────────────────┴───────────────────────────────────┐
│                 Server (Express.js)                        │
│  Passport Auth │ Stripe │ Multer │ AWS SES │ Noir/WASM   │
│  Session-based auth with connect-pg-simple                │
│  Rate Limiting │ CORS │ Trust Proxy                       │
└──────────────────────┬───────────────────────────────────┘
                       │ Drizzle ORM
┌──────────────────────┴───────────────────────────────────┐
│              PostgreSQL Database                           │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────────┐  │
│  │   public     │ │ tenant_acme  │ │ tenant_globex     │  │
│  │  (users,     │ │ (companies,  │ │ (companies,       │  │
│  │   tenants,   │ │  stakeholders│ │  stakeholders     │  │
│  │   sessions,  │ │  securities, │ │  securities,      │  │
│  │   proofs,    │ │  SAFEs,      │ │  SAFEs,           │  │
│  │   usage)     │ │  documents)  │ │  documents)       │  │
│  └─────────────┘ └──────────────┘ └───────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Model

Each tenant gets a dedicated PostgreSQL schema (`tenant_{slug}`). This provides:
- **Complete data isolation** — No WHERE clause filtering; schemas are physically separate
- **Independent migrations** — Tables are provisioned per-schema via `server/tenant.ts`
- **Sandbox support** — Trial tenants get pre-seeded sample data via `server/seed.ts`

### Authentication Flow

1. User registers with email/password
2. Email verification code sent via AWS SES (or logged in development)
3. On login, MFA code sent to verified email
4. Session stored in PostgreSQL via `connect-pg-simple`
5. Passport.js manages session lifecycle with role-based route guards

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **State/Data** | TanStack Query v5, React Hook Form, Zod |
| **Routing** | wouter |
| **Backend** | Express.js, TypeScript (tsx) |
| **ORM** | Drizzle ORM + drizzle-zod |
| **Database** | PostgreSQL |
| **Auth** | Passport.js (Local + Google OAuth), bcryptjs, express-session |
| **Payments** | Stripe (Checkout, Customer Portal, Webhooks) |
| **Email** | AWS SES |
| **ZK Proofs** | Noir v0.36.0, @noir-lang/noir_js, @noir-lang/backend_barretenberg (UltraHonk) |
| **File Upload** | Multer |
| **PDF** | jsPDF (client-side) |
| **Charts** | Recharts |
| **Rate Limiting** | express-rate-limit |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 14+
- **npm** 9+

### Installation

```bash
# Clone the repository
git clone https://github.com/Tableicity/tableicity.git
cd tableicity

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The app starts on `http://localhost:5000` with both the Express API and Vite dev server.

### Build for Production

```bash
# Build frontend and bundle server
npm run build

# Start production server
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Secret for express-session encryption |
| `NODE_ENV` | Yes | `development` or `production` |
| `AWS_ACCESS_KEY_ID` | Production | AWS credentials for SES email |
| `AWS_SECRET_ACCESS_KEY` | Production | AWS credentials for SES email |
| `STRIPE_SECRET_KEY` | Optional | Stripe API secret key |
| `STRIPE_PUBLISHABLE_KEY` | Optional | Stripe publishable key (exposed to client) |
| `STRIPE_WEBHOOK_SECRET` | Production | Required for webhook signature verification |
| `STRIPE_PRICE_TIER_MAP` | Optional | Maps Stripe price IDs to tiers (format: `price_xxx:professional,price_yyy:enterprise`) |
| `VITE_NOIR_ENABLED` | Optional | Set to `true` to show Privacy Vault in sidebar |
| `PORT` | Optional | Server port (default: 5000) |

---

## Database

### Schema Overview

**Public Schema (Global):**

| Table | Purpose |
|-------|---------|
| `users` | User accounts, passwords, Stripe customer/subscription IDs |
| `tenants` | Organizations with plan type and sandbox status |
| `tenant_members` | User-to-tenant mapping with roles |
| `trial_signups` | Onboarding lead capture |
| `platform_resources` | Global document library |
| `commitment_records` | SHA-256 + Pedersen commitments for ZK proofs |
| `proof_requests` | Proof lifecycle tracking (generating → complete → expired) |
| `proof_results` | Generated proofs and verification keys (never exposed via API) |
| `proof_usage` | Monthly usage tracking per tenant (UNIQUE on tenant_id + billing_month) |
| `session` | Express session store |

**Per-Tenant Schema (`tenant_{slug}`):**

| Table | Purpose |
|-------|---------|
| `companies` | Legal entity details, authorized shares |
| `stakeholders` | Equity holders (founders, investors, employees) |
| `share_classes` | Common, Preferred, Option class definitions |
| `securities` | Issued certificates and shares |
| `safe_agreements` | SAFE instruments with terms |
| `safe_templates` | Reusable SAFE document templates |
| `esop_pools` | Option pool allocations |
| `esop_plans` | Incentive plan configurations |
| `esop_grants` | Individual option/equity grants |
| `warrants` | Warrant instruments |
| `phantom_grants` | Phantom share grants |
| `sars` | Stock Appreciation Rights |
| `documents` | Data room files |
| `document_templates` | Document template library |
| `investor_updates` | Stakeholder communications |
| `audit_logs` | Action tracking |
| `data_store_categories` | Custom document categories |
| `privacy_labels` | Encrypted view custom labels |

### Backup & Restore

```bash
# Export full database
pg_dump $DATABASE_URL --no-owner --no-acl -F c -f tableicity_backup.dump

# Restore to new database (e.g., AWS RDS)
pg_restore --no-owner --no-acl -d "postgresql://user:pass@rds-endpoint:5432/tableicity" tableicity_backup.dump
```

---

## Docker Deployment

Docker is the bridge between your GitHub repository and AWS App Runner. Here's how it fits into the deployment pipeline:

### How Docker Fits In

```
GitHub Repo → Docker Build → Container Image → AWS ECR → App Runner
```

1. **Dockerfile** defines how to build and run the application
2. **Docker builds** create a portable container image with all dependencies baked in
3. **AWS ECR** (Elastic Container Registry) stores the built image
4. **App Runner** pulls the image from ECR and runs it

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production=true

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "dist/index.cjs"]
```

### Build & Push to ECR (Manual Process)

```bash
# 1. Build the Docker image locally
docker build -t tableicity .

# 2. Tag for ECR
docker tag tableicity:latest <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/tableicity:latest

# 3. Authenticate with ECR
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com

# 4. Push to ECR
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/tableicity:latest
```

### App Runner Configuration

In the AWS Console for App Runner:
- **Source**: ECR image (manual trigger — no auto-deploy)
- **Port**: 5000
- **Environment Variables**: Set all variables from the table above
- **Health Check**: `GET /api/auth/me` (returns 401 for unauthenticated, confirming the server is alive)
- **Instance Size**: 1 vCPU / 2 GB RAM minimum recommended

### Local Docker Testing

```bash
# Run locally with your database
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/tableicity" \
  -e SESSION_SECRET="your-secret" \
  -e NODE_ENV=production \
  tableicity
```

---

## AWS Deployment Guide

### Recommended Architecture

```
                    ┌──────────────┐
                    │  CloudFront  │
                    │   (CDN)      │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │  App Runner  │
                    │  (Express +  │
                    │   React)     │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
       ┌──────┴───────┐        ┌───────┴──────┐
       │   RDS         │        │   S3          │
       │  (PostgreSQL) │        │  (Documents)  │
       └───────────────┘        └──────────────┘
```

### Services

| AWS Service | Purpose | Notes |
|-------------|---------|-------|
| **App Runner** | Runs the Express server (API + static frontend) | Manual deploy from ECR image |
| **RDS (PostgreSQL)** | Database | Restore from `tableicity_backup.dump` |
| **S3** | Document storage (future) | For data room file uploads |
| **CloudFront** | CDN for static assets | Optional but recommended |
| **SES** | Transactional email | Email verification and MFA codes |
| **ECR** | Docker image registry | Store built container images |

### Deployment Workflow (No Auto-Triggers)

1. Push code to GitHub
2. Pull code to local machine (or build server)
3. `docker build` the image
4. `docker push` to ECR
5. Manually trigger new deployment in App Runner console

### Security Notes for Production

- **Stripe Webhooks**: `STRIPE_WEBHOOK_SECRET` is **required** in production. Unsigned webhook events are rejected when `NODE_ENV=production`.
- **Trust Proxy**: Express is configured with `trust proxy = 1`. Ensure the app runs behind exactly one trusted reverse proxy (App Runner, CloudFront, or load balancer) for accurate IP-based rate limiting.
- **Rate Limiting**: The public proof verification endpoint (`/api/v1/verify/:proofId`) is rate-limited to 10 requests per minute per IP. The rate limiter uses `req.ip` which relies on the trust proxy setting.

---

## Project Structure

```
tableicity/
├── client/                          # React frontend
│   └── src/
│       ├── components/              # Reusable UI components
│       │   ├── ui/                  # shadcn/ui primitives
│       │   ├── app-sidebar.tsx      # Main navigation sidebar
│       │   ├── auth-background.tsx  # Auth page layout
│       │   ├── marketing-slideshow.tsx  # Login slideshow
│       │   ├── privacy-toggle.tsx   # Encrypted view toggle
│       │   └── tenant-switcher.tsx  # Multi-tenant org switcher
│       ├── hooks/                   # Custom React hooks
│       │   ├── use-auth.ts          # Authentication state
│       │   ├── use-privacy-mode.ts  # Privacy mode toggle
│       │   └── use-toast.ts         # Toast notifications
│       ├── lib/                     # Utilities
│       │   ├── queryClient.ts       # TanStack Query config
│       │   ├── auth-context.tsx     # Auth provider
│       │   └── tenant-context.tsx   # Tenant provider
│       └── pages/                   # Route pages
│           ├── dashboard.tsx        # Main dashboard
│           ├── stakeholders.tsx     # Stakeholder management
│           ├── securities.tsx       # Securities tracking
│           ├── share-classes.tsx    # Share class config
│           ├── safes.tsx            # SAFE agreements list
│           ├── safe-create.tsx      # SAFE creation wizard
│           ├── profile.tsx          # Account & subscription
│           ├── data-room.tsx        # Document management
│           ├── tenants.tsx          # Platform admin
│           ├── privacy-vault.tsx    # ZK proof generation & usage
│           ├── verify-proof.tsx     # Internal proof verification
│           ├── audit-proofs.tsx     # Proof audit trail
│           ├── public-verify.tsx    # Public ZK verification page
│           └── equity-plans/        # Equity instruments
│               ├── pools.tsx        # Option pools
│               ├── plans.tsx        # Grant plans
│               ├── grants.tsx       # Individual grants
│               ├── exercising.tsx   # Exercise tracking
│               ├── warrants.tsx     # Warrants
│               ├── phantom.tsx      # Phantom shares
│               └── sars.tsx         # SARs
├── server/                          # Express backend
│   ├── index.ts                     # Server entry point (trust proxy, error handling)
│   ├── routes.ts                    # API route definitions + tenant middleware
│   ├── auth.ts                      # Authentication, MFA, Google OAuth
│   ├── storage.ts                   # IStorage interface + DatabaseStorage
│   ├── tenant.ts                    # Schema provisioning & backfill
│   ├── seed.ts                      # Sample data seeding
│   ├── stripe.ts                    # Stripe subscription routes + webhooks
│   ├── proof-routes.ts              # ZK proof API routes + public verify
│   ├── proof-service.ts             # Noir circuit execution (generate/verify)
│   ├── proof-config.ts              # Tier-based proof limits
│   ├── proof-middleware.ts          # Plan gating + usage enforcement
│   ├── trial.ts                     # Trial signup flow
│   ├── email-verification.ts        # Email/MFA code handling
│   ├── audit.ts                     # Audit logging
│   └── db.ts                        # Database connection
├── shared/
│   └── schema.ts                    # Drizzle ORM schema (single source of truth)
├── noir_circuits/                   # Noir ZK circuits
│   ├── ownership_threshold/         # Main ownership proof circuit
│   │   ├── src/main.nr              # Circuit source
│   │   └── target/                  # Compiled ACIR bytecode
│   └── test_hash/                   # Pedersen commitment helper circuit
├── scripts/
│   └── generate-commitments.ts      # Commitment seeding script
├── John_Assets/                     # Marketing & slideshow images
├── attached_assets/                 # Uploaded assets
├── package.json                     # Dependencies & scripts
├── drizzle.config.ts                # Drizzle Kit configuration
├── vite.config.ts                   # Vite build configuration
└── tailwind.config.ts               # Tailwind CSS configuration
```

---

## Development Milestones

### Gate 1: Foundation (Completed)
- Project scaffolding with React + Express + PostgreSQL
- Authentication system (registration, login, sessions, MFA)
- Multi-tenant architecture with schema-per-tenant isolation
- Role-based access control (Platform Admin, Tenant Admin, Staff, Shareholder)
- Core database schema design with Drizzle ORM
- Cap table management (stakeholders, share classes, securities)
- SAFE agreement creation wizard with templates and PDF generation
- All 5 equity instrument types (ESOP, Warrants, Phantom, SARs, Direct Stock)
- Data Room, Investor Updates, Audit Logs
- Trial onboarding with sandbox provisioning
- Stripe subscription integration
- Encrypted privacy mode

### Gate 2: Zero-Knowledge Proof System (Completed)
- Noir v0.36.0 circuit design (`ownership_threshold`)
- SHA-256 commitment generation linking cap table to ZK proofs
- Pedersen commitment computation (BN254 field-safe)
- Proof generation via NoirJS + UltraHonk backend
- Internal and public verification endpoints
- Privacy Vault UI with proof history and status badges
- Proof audit trail page

### Gate 3: Public Verification (Completed)
- Public verify page at `/public/verify/:proofId` (no auth required)
- Standalone dark-themed verification UI with Tableicity branding
- Expired/Invalid/Verified state handling
- "Copy Proof ID" functionality

### Gate 4: Monetization Wiring (Completed)
- `proof_usage` table with atomic upsert (ON CONFLICT)
- Tier-based proof limits (Starter: disabled, Professional: 10/mo, Enterprise: 100/mo)
- `checkProofAccess` middleware for server-side plan gating
- Usage meter on Privacy Vault page
- Stripe checkout with tenant-scoped metadata (server-derived tierId, validated tenantId)
- Webhook plan updates scoped to specific tenant (no multi-tenant fallback)
- Webhook signature verification enforced in production

### Gate 5: Integration Testing + Security + Deploy (Completed)
- 5 integration tests passing:
  - Full proof lifecycle (generate → verify → valid)
  - Starter tier returns 402
  - Usage counter increments on proof generation
  - Expired proofs return `status: expired`
  - Rate limiting returns 429 on 11th request
- Security hardening:
  - Private inputs never in API responses or logs
  - Public verify returns status only (no PII)
  - CORS headers on public verify
  - Trust proxy configured for rate limiter integrity
- UI polish:
  - "Generating zero-knowledge proof..." spinner
  - "Verified by Zero-Knowledge Proof" badge
  - User-friendly error messages
  - Mobile responsive layouts

---

## Current Status

**Status**: Feature-complete through all 5 gates. Production-ready.

### What's Working
- Full authentication flow with email-verified MFA
- Complete cap table management (stakeholders, share classes, securities)
- All 5 equity instrument types with vesting and exercise tracking
- SAFE agreement creation, tracking, and PDF generation
- Document management with categories and platform resources
- Privacy mode with encrypted stakeholder views
- Zero-Knowledge Proof system (Noir v0.36.0) with monetization gating
- Public proof verification with rate limiting and CORS
- Trial onboarding with sandbox provisioning
- Stripe subscription management with tenant-scoped webhooks
- Dark/light theme with responsive design
- Platform administration for multi-tenant management

---

## Roadmap

### Near Term
- [ ] AWS deployment (App Runner + RDS + S3 + CloudFront)
- [ ] Docker containerization and ECR pipeline
- [ ] Complete Stripe product setup and live billing
- [ ] S3-backed document storage for data room uploads
- [ ] Custom domain setup (app.tableicity.com)

### Medium Term
- [ ] 409A valuation integration
- [ ] Compliance module activation (401A, Form 3921, Rule 701, ASC 718)
- [ ] Scenario modeling (dilution analysis, waterfall calculations)
- [ ] Electronic signature integration for SAFE documents
- [ ] Stakeholder self-service portal enhancements
- [ ] API access for third-party integrations
- [ ] Proof of reserves circuits (aggregate portfolio proofs)

### Long Term
- [ ] Multi-currency support
- [ ] International equity instrument variants
- [ ] Board consent and resolution management
- [ ] Secondary transaction support
- [ ] Mobile application
- [ ] SOC 2 compliance certification

---

## License

Proprietary. All rights reserved.

Copyright (c) 2025-2026 Tableicity. Unauthorized copying, modification, or distribution of this software is strictly prohibited.
