# Tableicity — Equity Management Platform

## Overview
Tableicity is a multi-tenant SaaS equity management platform designed for startups. It provides comprehensive cap table management, SAFE tracking, employee equity plans, securities administration, document management, and investor communications. The platform incorporates a schema-per-tenant PostgreSQL isolation model, a Zero-Knowledge Proof (NOIR) Privacy Vault, and Haylo AI for natural language equity analysis. Key features include trial sign-up with auto-provisioned sandbox environments, robust role-based access control, encrypted privacy mode, Stripe billing integration, and a compliance-ready architecture. The project has filed a USPTO PPA and is pursuing a second Non-PPA with advanced Haylo AI embodiments.

## User Preferences
- Clear and concise communication.
- Iterative development — smaller, manageable steps with review.
- Detailed explanations for complex architectural decisions.
- Confirm before major structural changes or feature deletions.
- Focus on implementing new features and fixing bugs within established patterns.

## System Architecture

### Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, wouter, TanStack Query v5
- **Backend**: Express.js (Node.js), TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: `express-session` + `passport-local` + `bcrypt` + email-verified MFA
- **Payments**: Stripe (Checkout, Portal, Webhooks)
- **Email**: AWS SES (production)
- **Zero-Knowledge Proofs**: Aztec Noir v0.36.0, NoirJS, backend_barretenberg
- **AI**: Grok `grok-3-fast` via xAI API

### Multi-Tenancy
- **Schema-Per-Tenant Isolation**: Each tenant is provisioned with its own PostgreSQL schema for data isolation. A public schema manages platform-level data like users and tenants.
- **Tenant Provisioning**: New tenants are provisioned with raw SQL table creation and include seed data for sandbox environments.

### Authentication & Authorization
- **Authentication**: Session-based using `express-session` and `passport-local` with `bcrypt` for password hashing and email-verified MFA. Google OAuth is also supported.
- **Role-Based Access Control (RBAC)**: Defines roles such as `platform_admin`, `tenant_admin`, `tenant_staff`, and `shareholder`, each with specific access levels.

### Trial Sign-Up & Onboarding
- A progressive sign-up flow at `/launch` guides users through lead capture, password creation, email verification, and organization creation, which provisions a pre-seeded sandbox environment.

### UI/UX Architecture
- **Layouts**: Auth layout features a two-panel split. Main application uses a sidebar navigation structure.
- **Theming**: Defaults to dark mode for new users.
- **Interactive Elements**: Includes sequential guide tooltips, a test drive system with dismissible banners, and a consistent dialog pattern for user interactions.

### Feature Specifications
- **Equity Instruments**: Supports Stock Options (ESOP), Warrants, Stock-settled SARs, Cash-settled SARs, and Phantom Shares, each with dedicated CRUD operations and cap table impact. ESOP follows a Pool → Plan → Grant → Exercise hierarchy with server-side vesting.
- **SAFE Management**: Features a 3-step creation wizard, a template library with variable injection, and client-side PDF generation.
- **Document Management / Data Store**: Provides a secure data room with file uploads, downloads, dynamic categorization, and document deduplication.
- **Platform Resources**: Manages master documents, distinguishing between seedable resources for tenants and admin-only resources.
- **Encrypted View (Privacy Mode)**: Toggles data display for sensitive information, using SHA-256 HMAC hashing and custom labels, persisting via local storage.
- **Test Drive System**: Implements dismissible banners on equity pages to guide users to relevant data store categories.

### Zero-Knowledge Proof System (NOIR)
- **Version Lock**: Critical reliance on Noir packages v0.36.0.
- **Architecture**: Utilizes `ownership_threshold` and `test_hash` circuits. A proof service handles Pedersen commitment generation, ownership proof generation, and verification.
- **Security**: Private inputs are never exposed in API responses, and proof data is secured.
- **Monetization**: Integrates with a `proof_usage` table for metering and monetization, controlled by a `checkProofAccess` middleware.

### Haylo AI (Intent Pipeline)
- **Architecture**: A single-LLM intent pipeline using Grok `grok-3-fast` via xAI API for natural language equity analysis.
- **Intent Flow**: Users submit NL queries, which Grok parses into structured intents. These intents can be approved or rejected, with conditional proof generation gated by `checkProofAccess` middleware.
- **Console UI**: Features a term sheet banner, scenario checkboxes for quick analysis, and smart prompt construction.
- **Seeded Term Sheet**: Auto-provisioned "Series A Term Sheet — Quantum Innovations Inc." per sandbox environment.

### Compliance & Future Features
- Placeholder sections for advanced compliance features (401A Validations, Form 3921, Rule 701, ASC 718) and data encryption.
- Planned features include auditor LLM for Haylo AI.

## External Dependencies

- **PostgreSQL**: Primary relational database for all application data.
- **Stripe**: Handles all payment processing, subscriptions, and webhooks.
- **AWS SES**: Used for sending email notifications and verification codes in production environments.
- **xAI API (Grok)**: Powers the Haylo AI natural language processing capabilities.
- **Aztec Noir (v0.36.0)**: Core technology for Zero-Knowledge Proof generation and verification.
- **`bcrypt`**: Used for secure password hashing.
- **`passport-local`**: Provides local authentication strategy for user login.
- **`express-session`**: Manages user sessions on the backend.
- **`connect-pg-simple`**: Stores session data in PostgreSQL.
- **`Drizzle ORM`**: TypeScript ORM for interacting with the PostgreSQL database.
- **`multer`**: Handles file uploads for document management.