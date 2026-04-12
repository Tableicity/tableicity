--
-- PostgreSQL database dump
--

\restrict EC7flhSeFwXC5FRMhFnIrUN2kgeCEdkxD7KJpeGdDTQbFQ0d6tjbU8LKBmZ9njs

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tenant_acme; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tenant_acme;


--
-- Name: tenant_globex; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA tenant_globex;


--
-- Name: tenant_initech-corp; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA "tenant_initech-corp";


--
-- Name: document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.document_type AS ENUM (
    'legal',
    'financial',
    'corporate',
    'investor',
    'other'
);


--
-- Name: haylo_intent_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.haylo_intent_status AS ENUM (
    'pending',
    'analyzing',
    'proposed',
    'approved',
    'rejected',
    'executed',
    'failed'
);


--
-- Name: phantom_grant_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.phantom_grant_status AS ENUM (
    'active',
    'vested',
    'paid_out',
    'forfeited',
    'cancelled'
);


--
-- Name: phantom_payout_trigger; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.phantom_payout_trigger AS ENUM (
    'exit',
    'ipo',
    'milestone',
    'annual',
    'termination'
);


--
-- Name: phantom_plan_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.phantom_plan_type AS ENUM (
    'appreciation_only',
    'full_value'
);


--
-- Name: proof_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.proof_status AS ENUM (
    'pending',
    'generating',
    'complete',
    'failed',
    'expired'
);


--
-- Name: request_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.request_source AS ENUM (
    'MANUAL',
    'AI_HAYLO'
);


--
-- Name: resource_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.resource_category AS ENUM (
    'esop',
    'legal',
    'compliance',
    'onboarding',
    'other'
);


--
-- Name: safe_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.safe_status AS ENUM (
    'draft',
    'sent_to_template',
    'sent',
    'signed',
    'converted',
    'cancelled'
);


--
-- Name: sar_settlement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sar_settlement_type AS ENUM (
    'cash',
    'stock',
    'choice'
);


--
-- Name: sar_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sar_status AS ENUM (
    'active',
    'vested',
    'exercised',
    'forfeited',
    'cancelled',
    'expired'
);


--
-- Name: security_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.security_status AS ENUM (
    'active',
    'cancelled',
    'exercised',
    'expired'
);


--
-- Name: share_class_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.share_class_type AS ENUM (
    'common',
    'preferred',
    'options'
);


--
-- Name: stakeholder_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stakeholder_type AS ENUM (
    'founder',
    'investor',
    'employee',
    'advisor',
    'board_member'
);


--
-- Name: update_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.update_status AS ENUM (
    'draft',
    'sent'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'platform_admin',
    'tenant_admin',
    'tenant_staff',
    'shareholder'
);


--
-- Name: warrant_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.warrant_status AS ENUM (
    'active',
    'exercised',
    'expired',
    'cancelled'
);


--
-- Name: esop_grant_status; Type: TYPE; Schema: tenant_acme; Owner: -
--

CREATE TYPE tenant_acme.esop_grant_status AS ENUM (
    'active',
    'partially_exercised',
    'fully_exercised',
    'forfeited',
    'cancelled',
    'expired'
);


--
-- Name: phantom_grant_status; Type: TYPE; Schema: tenant_acme; Owner: -
--

CREATE TYPE tenant_acme.phantom_grant_status AS ENUM (
    'active',
    'vested',
    'paid_out',
    'forfeited',
    'cancelled'
);


--
-- Name: phantom_payout_trigger; Type: TYPE; Schema: tenant_acme; Owner: -
--

CREATE TYPE tenant_acme.phantom_payout_trigger AS ENUM (
    'exit',
    'ipo',
    'milestone',
    'annual',
    'termination'
);


--
-- Name: phantom_plan_type; Type: TYPE; Schema: tenant_acme; Owner: -
--

CREATE TYPE tenant_acme.phantom_plan_type AS ENUM (
    'appreciation_only',
    'full_value'
);


--
-- Name: sar_settlement_type; Type: TYPE; Schema: tenant_acme; Owner: -
--

CREATE TYPE tenant_acme.sar_settlement_type AS ENUM (
    'cash',
    'stock',
    'choice'
);


--
-- Name: sar_status; Type: TYPE; Schema: tenant_acme; Owner: -
--

CREATE TYPE tenant_acme.sar_status AS ENUM (
    'active',
    'vested',
    'exercised',
    'forfeited',
    'cancelled',
    'expired'
);


--
-- Name: warrant_status; Type: TYPE; Schema: tenant_acme; Owner: -
--

CREATE TYPE tenant_acme.warrant_status AS ENUM (
    'active',
    'exercised',
    'expired',
    'cancelled'
);


--
-- Name: esop_grant_status; Type: TYPE; Schema: tenant_globex; Owner: -
--

CREATE TYPE tenant_globex.esop_grant_status AS ENUM (
    'active',
    'partially_exercised',
    'fully_exercised',
    'forfeited',
    'cancelled',
    'expired'
);


--
-- Name: phantom_grant_status; Type: TYPE; Schema: tenant_globex; Owner: -
--

CREATE TYPE tenant_globex.phantom_grant_status AS ENUM (
    'active',
    'vested',
    'paid_out',
    'forfeited',
    'cancelled'
);


--
-- Name: phantom_payout_trigger; Type: TYPE; Schema: tenant_globex; Owner: -
--

CREATE TYPE tenant_globex.phantom_payout_trigger AS ENUM (
    'exit',
    'ipo',
    'milestone',
    'annual',
    'termination'
);


--
-- Name: phantom_plan_type; Type: TYPE; Schema: tenant_globex; Owner: -
--

CREATE TYPE tenant_globex.phantom_plan_type AS ENUM (
    'appreciation_only',
    'full_value'
);


--
-- Name: sar_settlement_type; Type: TYPE; Schema: tenant_globex; Owner: -
--

CREATE TYPE tenant_globex.sar_settlement_type AS ENUM (
    'cash',
    'stock',
    'choice'
);


--
-- Name: sar_status; Type: TYPE; Schema: tenant_globex; Owner: -
--

CREATE TYPE tenant_globex.sar_status AS ENUM (
    'active',
    'vested',
    'exercised',
    'forfeited',
    'cancelled',
    'expired'
);


--
-- Name: warrant_status; Type: TYPE; Schema: tenant_globex; Owner: -
--

CREATE TYPE tenant_globex.warrant_status AS ENUM (
    'active',
    'exercised',
    'expired',
    'cancelled'
);


--
-- Name: esop_grant_status; Type: TYPE; Schema: tenant_initech-corp; Owner: -
--

CREATE TYPE "tenant_initech-corp".esop_grant_status AS ENUM (
    'active',
    'partially_exercised',
    'fully_exercised',
    'forfeited',
    'cancelled',
    'expired'
);


--
-- Name: phantom_grant_status; Type: TYPE; Schema: tenant_initech-corp; Owner: -
--

CREATE TYPE "tenant_initech-corp".phantom_grant_status AS ENUM (
    'active',
    'vested',
    'paid_out',
    'forfeited',
    'cancelled'
);


--
-- Name: phantom_payout_trigger; Type: TYPE; Schema: tenant_initech-corp; Owner: -
--

CREATE TYPE "tenant_initech-corp".phantom_payout_trigger AS ENUM (
    'exit',
    'ipo',
    'milestone',
    'annual',
    'termination'
);


--
-- Name: phantom_plan_type; Type: TYPE; Schema: tenant_initech-corp; Owner: -
--

CREATE TYPE "tenant_initech-corp".phantom_plan_type AS ENUM (
    'appreciation_only',
    'full_value'
);


--
-- Name: sar_settlement_type; Type: TYPE; Schema: tenant_initech-corp; Owner: -
--

CREATE TYPE "tenant_initech-corp".sar_settlement_type AS ENUM (
    'cash',
    'stock',
    'choice'
);


--
-- Name: sar_status; Type: TYPE; Schema: tenant_initech-corp; Owner: -
--

CREATE TYPE "tenant_initech-corp".sar_status AS ENUM (
    'active',
    'vested',
    'exercised',
    'forfeited',
    'cancelled',
    'expired'
);


--
-- Name: warrant_status; Type: TYPE; Schema: tenant_initech-corp; Owner: -
--

CREATE TYPE "tenant_initech-corp".warrant_status AS ENUM (
    'active',
    'exercised',
    'expired',
    'cancelled'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_slug text,
    user_id character varying NOT NULL,
    user_email text NOT NULL,
    user_role text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id character varying,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at text NOT NULL
);


--
-- Name: commitment_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commitment_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    holder_ref character varying NOT NULL,
    commitment_hash character varying NOT NULL,
    pedersen_commitment character varying,
    salt character varying NOT NULL,
    share_class character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at text
);


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    legal_name text,
    incorporation_date text,
    incorporation_state text,
    ein text,
    address text,
    total_authorized_shares integer DEFAULT 10000000
);


--
-- Name: data_store_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_store_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    org_id character varying NOT NULL,
    name text NOT NULL,
    created_at text
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    type public.document_type NOT NULL,
    description text,
    upload_date text NOT NULL,
    file_size text,
    uploaded_by text
);


--
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_verifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    code_hash text NOT NULL,
    expires_at text NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at text NOT NULL
);


--
-- Name: haylo_intents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.haylo_intents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    natural_language_input text NOT NULL,
    structured_intent jsonb,
    grok_raw_response text,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    proof_request_id character varying,
    rejection_reason text,
    created_at text,
    resolved_at text
);


--
-- Name: investor_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investor_updates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status public.update_status DEFAULT 'draft'::public.update_status NOT NULL,
    sent_date text,
    created_date text NOT NULL,
    recipient_count integer DEFAULT 0
);


--
-- Name: phantom_grants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.phantom_grants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    shares_equivalent integer NOT NULL,
    grant_price_per_unit numeric(12,4) NOT NULL,
    plan_type public.phantom_plan_type DEFAULT 'full_value'::public.phantom_plan_type NOT NULL,
    vesting_schedule text,
    cliff_months integer,
    vesting_months integer,
    payout_trigger public.phantom_payout_trigger DEFAULT 'exit'::public.phantom_payout_trigger NOT NULL,
    payout_date text,
    payout_amount numeric(14,2),
    current_share_price numeric(12,4),
    status public.phantom_grant_status DEFAULT 'active'::public.phantom_grant_status NOT NULL,
    notes text,
    created_at text
);


--
-- Name: platform_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_resources (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category public.resource_category DEFAULT 'other'::public.resource_category NOT NULL,
    document_type text DEFAULT 'legal'::text NOT NULL,
    content text,
    mime_type text,
    file_size text,
    file_size_bytes integer,
    auto_seed boolean DEFAULT true NOT NULL,
    created_by character varying,
    created_at text,
    updated_at text,
    admin_only boolean DEFAULT false NOT NULL
);


--
-- Name: proof_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proof_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    proof_type character varying NOT NULL,
    requested_by character varying NOT NULL,
    public_inputs jsonb DEFAULT '{}'::jsonb NOT NULL,
    status public.proof_status DEFAULT 'pending'::public.proof_status NOT NULL,
    created_at text,
    expires_at text,
    request_source character varying DEFAULT 'MANUAL'::character varying NOT NULL
);


--
-- Name: proof_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proof_results (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    request_id character varying NOT NULL,
    proof_hex text NOT NULL,
    verification_key_hex text NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    generated_at text
);


--
-- Name: proof_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proof_usage (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    billing_month character varying(7) NOT NULL,
    proof_count integer DEFAULT 0 NOT NULL,
    last_reset_at text,
    updated_at text
);


--
-- Name: safe_agreements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.safe_agreements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    investment_amount numeric(12,2) NOT NULL,
    valuation_cap numeric(15,2),
    discount_rate numeric(5,2),
    safe_type text DEFAULT 'post-money'::text NOT NULL,
    status public.safe_status DEFAULT 'draft'::public.safe_status NOT NULL,
    issue_date text,
    conversion_date text,
    notes text
);


--
-- Name: sars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sars (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    units integer NOT NULL,
    base_price numeric(12,4) NOT NULL,
    settlement_type public.sar_settlement_type DEFAULT 'cash'::public.sar_settlement_type NOT NULL,
    underlying_share_class text,
    vesting_schedule text,
    cliff_months integer,
    vesting_months integer,
    expiration_date text,
    exercise_date text,
    exercise_price numeric(12,4),
    exercised_units integer DEFAULT 0 NOT NULL,
    payout_amount numeric(14,2),
    status public.sar_status DEFAULT 'active'::public.sar_status NOT NULL,
    notes text,
    created_at text
);


--
-- Name: securities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.securities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    share_class_id character varying NOT NULL,
    certificate_id text,
    shares integer NOT NULL,
    price_per_share numeric(10,4),
    issue_date text NOT NULL,
    status public.security_status DEFAULT 'active'::public.security_status NOT NULL,
    vesting_schedule text,
    notes text
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: share_classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.share_classes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    type public.share_class_type NOT NULL,
    price_per_share numeric(10,4) DEFAULT 0.0001,
    authorized_shares integer NOT NULL,
    board_approval_date text,
    liquidation_preference numeric(10,2) DEFAULT 1.00
);


--
-- Name: stakeholders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stakeholders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    type public.stakeholder_type NOT NULL,
    title text,
    avatar_initials text
);


--
-- Name: tenant_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_members (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    role public.user_role DEFAULT 'tenant_staff'::public.user_role NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at text
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    plan text DEFAULT 'standard'::text NOT NULL,
    owner_email text NOT NULL,
    max_users integer DEFAULT 10,
    max_companies integer DEFAULT 1,
    created_at text,
    language character varying(10) DEFAULT 'en'::character varying,
    org_size character varying(50),
    time_zone character varying(100),
    trial_ends_at text,
    is_sandbox boolean DEFAULT false NOT NULL
);


--
-- Name: trial_signups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trial_signups (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone character varying(50),
    company_name character varying(255),
    password_hash text,
    agreed_to_terms boolean DEFAULT false,
    email_verified boolean DEFAULT false,
    verification_token character varying(255),
    user_id character varying,
    created_at text,
    account_created_at text,
    verified_at text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    is_platform_admin boolean DEFAULT false NOT NULL,
    created_at text,
    email_verified boolean DEFAULT false NOT NULL,
    google_id text,
    stripe_customer_id text,
    stripe_subscription_id text
);


--
-- Name: warrants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warrants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    name text NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    shares integer NOT NULL,
    exercise_price numeric(12,4) NOT NULL,
    issue_date text NOT NULL,
    expiration_date text NOT NULL,
    vesting_schedule text,
    status public.warrant_status DEFAULT 'active'::public.warrant_status NOT NULL,
    exercised_date text,
    exercised_shares integer DEFAULT 0 NOT NULL,
    notes text,
    created_at text
);


--
-- Name: companies; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    legal_name text,
    incorporation_date text,
    incorporation_state text,
    ein text,
    address text,
    total_authorized_shares integer DEFAULT 10000000
);


--
-- Name: data_store_categories; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.data_store_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    org_id character varying NOT NULL,
    name text NOT NULL,
    created_at text
);


--
-- Name: documents; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    type public.document_type NOT NULL,
    description text,
    upload_date text NOT NULL,
    file_size text,
    uploaded_by text,
    file_url text,
    file_size_bytes integer,
    mime_type text,
    encrypted boolean DEFAULT false NOT NULL,
    content text
);


--
-- Name: esop_grants; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.esop_grants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    pool_id character varying NOT NULL,
    plan_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    shares integer NOT NULL,
    exercise_price numeric(12,4) NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    vesting_start_date text,
    vesting_duration_months integer,
    cliff_months integer,
    vest_frequency_months integer,
    vested_shares integer DEFAULT 0 NOT NULL,
    exercised_shares integer DEFAULT 0 NOT NULL,
    status tenant_acme.esop_grant_status DEFAULT 'active'::tenant_acme.esop_grant_status NOT NULL,
    notes text,
    created_at text
);


--
-- Name: esop_plans; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.esop_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    pool_id character varying NOT NULL,
    name text NOT NULL,
    approved_date text NOT NULL,
    grant_type text DEFAULT 'stock_options'::text NOT NULL,
    grant_presets text,
    documents text,
    internal_note text,
    created_at text
);


--
-- Name: esop_pools; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.esop_pools (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    approved_date text NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    allocated_shares integer NOT NULL,
    granted_shares integer DEFAULT 0 NOT NULL,
    vested_shares integer DEFAULT 0 NOT NULL,
    exercised_shares integer DEFAULT 0 NOT NULL,
    created_at text
);


--
-- Name: haylo_intents; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.haylo_intents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    natural_language_input text NOT NULL,
    structured_intent jsonb,
    grok_raw_response text,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    proof_request_id character varying,
    rejection_reason text,
    created_at text,
    resolved_at text
);


--
-- Name: investment_rounds; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.investment_rounds (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    round_name character varying(255) NOT NULL,
    round_date text,
    created_at text
);


--
-- Name: investor_updates; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.investor_updates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status public.update_status DEFAULT 'draft'::public.update_status NOT NULL,
    sent_date text,
    created_date text NOT NULL,
    recipient_count integer DEFAULT 0
);


--
-- Name: phantom_grants; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.phantom_grants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    shares_equivalent integer NOT NULL,
    grant_price_per_unit numeric(12,4) NOT NULL,
    plan_type tenant_acme.phantom_plan_type DEFAULT 'full_value'::tenant_acme.phantom_plan_type NOT NULL,
    vesting_schedule text,
    cliff_months integer,
    vesting_months integer,
    payout_trigger tenant_acme.phantom_payout_trigger DEFAULT 'exit'::tenant_acme.phantom_payout_trigger NOT NULL,
    payout_date text,
    payout_amount numeric(14,2),
    current_share_price numeric(12,4),
    status tenant_acme.phantom_grant_status DEFAULT 'active'::tenant_acme.phantom_grant_status NOT NULL,
    notes text,
    created_at text
);


--
-- Name: privacy_labels; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.privacy_labels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    hashed_id text NOT NULL,
    encrypted_label text,
    created_at text
);


--
-- Name: safe_agreements; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.safe_agreements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    investment_amount numeric(12,2) NOT NULL,
    valuation_cap numeric(15,2),
    discount_rate numeric(5,2),
    safe_type text DEFAULT 'post-money'::text NOT NULL,
    status public.safe_status DEFAULT 'draft'::public.safe_status NOT NULL,
    issue_date text,
    conversion_date text,
    notes text,
    investment_round_id character varying,
    investment_round_name character varying(255),
    raise_goal numeric(15,2),
    end_date text,
    template_variables jsonb,
    template_id character varying,
    doc_ref character varying(50)
);


--
-- Name: safe_templates; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.safe_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    template_name character varying(255) NOT NULL,
    template_type character varying(50) DEFAULT 'safe'::character varying NOT NULL,
    template_version character varying(50) DEFAULT '1.0'::character varying,
    description text,
    raw_content text NOT NULL,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at text,
    updated_at text
);


--
-- Name: sars; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.sars (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    units integer NOT NULL,
    base_price numeric(12,4) NOT NULL,
    settlement_type tenant_acme.sar_settlement_type DEFAULT 'cash'::tenant_acme.sar_settlement_type NOT NULL,
    underlying_share_class text,
    vesting_schedule text,
    cliff_months integer,
    vesting_months integer,
    expiration_date text,
    exercise_date text,
    exercise_price numeric(12,4),
    exercised_units integer DEFAULT 0 NOT NULL,
    payout_amount numeric(14,2),
    status tenant_acme.sar_status DEFAULT 'active'::tenant_acme.sar_status NOT NULL,
    notes text,
    created_at text,
    exercise_trigger text
);


--
-- Name: securities; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.securities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    share_class_id character varying NOT NULL,
    certificate_id text,
    shares integer NOT NULL,
    price_per_share numeric(10,4),
    issue_date text NOT NULL,
    status public.security_status DEFAULT 'active'::public.security_status NOT NULL,
    vesting_schedule text,
    notes text
);


--
-- Name: share_classes; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.share_classes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    type public.share_class_type NOT NULL,
    price_per_share numeric(10,4) DEFAULT 0.0001,
    authorized_shares integer NOT NULL,
    board_approval_date text,
    liquidation_preference numeric(10,2) DEFAULT 1.00
);


--
-- Name: stakeholders; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.stakeholders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    user_id character varying,
    name text NOT NULL,
    email text NOT NULL,
    type public.stakeholder_type NOT NULL,
    title text,
    address text,
    avatar_initials text
);


--
-- Name: users; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


--
-- Name: warrants; Type: TABLE; Schema: tenant_acme; Owner: -
--

CREATE TABLE tenant_acme.warrants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    name text NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    shares integer NOT NULL,
    exercise_price numeric(12,4) NOT NULL,
    issue_date text NOT NULL,
    expiration_date text NOT NULL,
    vesting_schedule text,
    status tenant_acme.warrant_status DEFAULT 'active'::tenant_acme.warrant_status NOT NULL,
    exercised_date text,
    exercised_shares integer DEFAULT 0 NOT NULL,
    notes text,
    created_at text
);


--
-- Name: companies; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    legal_name text,
    incorporation_date text,
    incorporation_state text,
    ein text,
    address text,
    total_authorized_shares integer DEFAULT 10000000
);


--
-- Name: data_store_categories; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.data_store_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    org_id character varying NOT NULL,
    name text NOT NULL,
    created_at text
);


--
-- Name: documents; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    type public.document_type NOT NULL,
    description text,
    upload_date text NOT NULL,
    file_size text,
    uploaded_by text,
    file_url text,
    file_size_bytes integer,
    mime_type text,
    encrypted boolean DEFAULT false NOT NULL,
    content text
);


--
-- Name: esop_grants; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.esop_grants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    pool_id character varying NOT NULL,
    plan_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    shares integer NOT NULL,
    exercise_price numeric(12,4) NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    vesting_start_date text,
    vesting_duration_months integer,
    cliff_months integer,
    vest_frequency_months integer,
    vested_shares integer DEFAULT 0 NOT NULL,
    exercised_shares integer DEFAULT 0 NOT NULL,
    status tenant_globex.esop_grant_status DEFAULT 'active'::tenant_globex.esop_grant_status NOT NULL,
    notes text,
    created_at text
);


--
-- Name: esop_plans; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.esop_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    pool_id character varying NOT NULL,
    name text NOT NULL,
    approved_date text NOT NULL,
    grant_type text DEFAULT 'stock_options'::text NOT NULL,
    grant_presets text,
    documents text,
    internal_note text,
    created_at text
);


--
-- Name: esop_pools; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.esop_pools (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    approved_date text NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    allocated_shares integer NOT NULL,
    granted_shares integer DEFAULT 0 NOT NULL,
    vested_shares integer DEFAULT 0 NOT NULL,
    exercised_shares integer DEFAULT 0 NOT NULL,
    created_at text
);


--
-- Name: haylo_intents; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.haylo_intents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    natural_language_input text NOT NULL,
    structured_intent jsonb,
    grok_raw_response text,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    proof_request_id character varying,
    rejection_reason text,
    created_at text,
    resolved_at text
);


--
-- Name: investment_rounds; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.investment_rounds (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    round_name character varying(255) NOT NULL,
    round_date text,
    created_at text
);


--
-- Name: investor_updates; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.investor_updates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status public.update_status DEFAULT 'draft'::public.update_status NOT NULL,
    sent_date text,
    created_date text NOT NULL,
    recipient_count integer DEFAULT 0
);


--
-- Name: phantom_grants; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.phantom_grants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    shares_equivalent integer NOT NULL,
    grant_price_per_unit numeric(12,4) NOT NULL,
    plan_type tenant_globex.phantom_plan_type DEFAULT 'full_value'::tenant_globex.phantom_plan_type NOT NULL,
    vesting_schedule text,
    cliff_months integer,
    vesting_months integer,
    payout_trigger tenant_globex.phantom_payout_trigger DEFAULT 'exit'::tenant_globex.phantom_payout_trigger NOT NULL,
    payout_date text,
    payout_amount numeric(14,2),
    current_share_price numeric(12,4),
    status tenant_globex.phantom_grant_status DEFAULT 'active'::tenant_globex.phantom_grant_status NOT NULL,
    notes text,
    created_at text
);


--
-- Name: privacy_labels; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.privacy_labels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    hashed_id text NOT NULL,
    encrypted_label text,
    created_at text
);


--
-- Name: safe_agreements; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.safe_agreements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    investment_amount numeric(12,2) NOT NULL,
    valuation_cap numeric(15,2),
    discount_rate numeric(5,2),
    safe_type text DEFAULT 'post-money'::text NOT NULL,
    status public.safe_status DEFAULT 'draft'::public.safe_status NOT NULL,
    issue_date text,
    conversion_date text,
    notes text,
    investment_round_id character varying,
    investment_round_name character varying(255),
    raise_goal numeric(15,2),
    end_date text,
    template_variables jsonb,
    template_id character varying,
    doc_ref character varying(50)
);


--
-- Name: safe_templates; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.safe_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    template_name character varying(255) NOT NULL,
    template_type character varying(50) DEFAULT 'safe'::character varying NOT NULL,
    template_version character varying(50) DEFAULT '1.0'::character varying,
    description text,
    raw_content text NOT NULL,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at text,
    updated_at text
);


--
-- Name: sars; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.sars (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    units integer NOT NULL,
    base_price numeric(12,4) NOT NULL,
    settlement_type tenant_globex.sar_settlement_type DEFAULT 'cash'::tenant_globex.sar_settlement_type NOT NULL,
    underlying_share_class text,
    vesting_schedule text,
    cliff_months integer,
    vesting_months integer,
    expiration_date text,
    exercise_date text,
    exercise_price numeric(12,4),
    exercised_units integer DEFAULT 0 NOT NULL,
    payout_amount numeric(14,2),
    status tenant_globex.sar_status DEFAULT 'active'::tenant_globex.sar_status NOT NULL,
    notes text,
    created_at text,
    exercise_trigger text
);


--
-- Name: securities; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.securities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    share_class_id character varying NOT NULL,
    certificate_id text,
    shares integer NOT NULL,
    price_per_share numeric(10,4),
    issue_date text NOT NULL,
    status public.security_status DEFAULT 'active'::public.security_status NOT NULL,
    vesting_schedule text,
    notes text
);


--
-- Name: share_classes; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.share_classes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    type public.share_class_type NOT NULL,
    price_per_share numeric(10,4) DEFAULT 0.0001,
    authorized_shares integer NOT NULL,
    board_approval_date text,
    liquidation_preference numeric(10,2) DEFAULT 1.00
);


--
-- Name: stakeholders; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.stakeholders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    user_id character varying,
    name text NOT NULL,
    email text NOT NULL,
    type public.stakeholder_type NOT NULL,
    title text,
    address text,
    avatar_initials text
);


--
-- Name: users; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


--
-- Name: warrants; Type: TABLE; Schema: tenant_globex; Owner: -
--

CREATE TABLE tenant_globex.warrants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    name text NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    shares integer NOT NULL,
    exercise_price numeric(12,4) NOT NULL,
    issue_date text NOT NULL,
    expiration_date text NOT NULL,
    vesting_schedule text,
    status tenant_globex.warrant_status DEFAULT 'active'::tenant_globex.warrant_status NOT NULL,
    exercised_date text,
    exercised_shares integer DEFAULT 0 NOT NULL,
    notes text,
    created_at text
);


--
-- Name: companies; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".companies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    legal_name text,
    incorporation_date text,
    incorporation_state text,
    ein text,
    address text,
    total_authorized_shares integer DEFAULT 10000000
);


--
-- Name: data_store_categories; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".data_store_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    org_id character varying NOT NULL,
    name text NOT NULL,
    created_at text
);


--
-- Name: documents; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    type public.document_type NOT NULL,
    description text,
    upload_date text NOT NULL,
    file_size text,
    uploaded_by text,
    file_url text,
    file_size_bytes integer,
    mime_type text,
    encrypted boolean DEFAULT false NOT NULL,
    content text
);


--
-- Name: esop_grants; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".esop_grants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    pool_id character varying NOT NULL,
    plan_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    shares integer NOT NULL,
    exercise_price numeric(12,4) NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    vesting_start_date text,
    vesting_duration_months integer,
    cliff_months integer,
    vest_frequency_months integer,
    vested_shares integer DEFAULT 0 NOT NULL,
    exercised_shares integer DEFAULT 0 NOT NULL,
    status "tenant_initech-corp".esop_grant_status DEFAULT 'active'::"tenant_initech-corp".esop_grant_status NOT NULL,
    notes text,
    created_at text
);


--
-- Name: esop_plans; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".esop_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    pool_id character varying NOT NULL,
    name text NOT NULL,
    approved_date text NOT NULL,
    grant_type text DEFAULT 'stock_options'::text NOT NULL,
    grant_presets text,
    documents text,
    internal_note text,
    created_at text
);


--
-- Name: esop_pools; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".esop_pools (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    approved_date text NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    allocated_shares integer NOT NULL,
    granted_shares integer DEFAULT 0 NOT NULL,
    vested_shares integer DEFAULT 0 NOT NULL,
    exercised_shares integer DEFAULT 0 NOT NULL,
    created_at text
);


--
-- Name: haylo_intents; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".haylo_intents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    tenant_id character varying NOT NULL,
    user_id character varying NOT NULL,
    natural_language_input text NOT NULL,
    structured_intent jsonb,
    grok_raw_response text,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    proof_request_id character varying,
    rejection_reason text,
    created_at text,
    resolved_at text
);


--
-- Name: investment_rounds; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".investment_rounds (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    round_name character varying(255) NOT NULL,
    round_date text,
    created_at text
);


--
-- Name: investor_updates; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".investor_updates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    status public.update_status DEFAULT 'draft'::public.update_status NOT NULL,
    sent_date text,
    created_date text NOT NULL,
    recipient_count integer DEFAULT 0
);


--
-- Name: phantom_grants; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".phantom_grants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    shares_equivalent integer NOT NULL,
    grant_price_per_unit numeric(12,4) NOT NULL,
    plan_type "tenant_initech-corp".phantom_plan_type DEFAULT 'full_value'::"tenant_initech-corp".phantom_plan_type NOT NULL,
    vesting_schedule text,
    cliff_months integer,
    vesting_months integer,
    payout_trigger "tenant_initech-corp".phantom_payout_trigger DEFAULT 'exit'::"tenant_initech-corp".phantom_payout_trigger NOT NULL,
    payout_date text,
    payout_amount numeric(14,2),
    current_share_price numeric(12,4),
    status "tenant_initech-corp".phantom_grant_status DEFAULT 'active'::"tenant_initech-corp".phantom_grant_status NOT NULL,
    notes text,
    created_at text
);


--
-- Name: privacy_labels; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".privacy_labels (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    hashed_id text NOT NULL,
    encrypted_label text,
    created_at text
);


--
-- Name: safe_agreements; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".safe_agreements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    investment_amount numeric(12,2) NOT NULL,
    valuation_cap numeric(15,2),
    discount_rate numeric(5,2),
    safe_type text DEFAULT 'post-money'::text NOT NULL,
    status public.safe_status DEFAULT 'draft'::public.safe_status NOT NULL,
    issue_date text,
    conversion_date text,
    notes text,
    investment_round_id character varying,
    investment_round_name character varying(255),
    raise_goal numeric(15,2),
    end_date text,
    template_variables jsonb,
    template_id character varying,
    doc_ref character varying(50)
);


--
-- Name: safe_templates; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".safe_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    template_name character varying(255) NOT NULL,
    template_version character varying(50) DEFAULT '1.0'::character varying,
    raw_content text NOT NULL,
    is_active boolean DEFAULT true,
    created_at text,
    updated_at text,
    template_type character varying(50) DEFAULT 'safe'::character varying NOT NULL,
    description text,
    is_default boolean DEFAULT false
);


--
-- Name: sars; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".sars (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    grant_name text NOT NULL,
    grant_date text NOT NULL,
    units integer NOT NULL,
    base_price numeric(12,4) NOT NULL,
    settlement_type "tenant_initech-corp".sar_settlement_type DEFAULT 'cash'::"tenant_initech-corp".sar_settlement_type NOT NULL,
    underlying_share_class text,
    vesting_schedule text,
    cliff_months integer,
    vesting_months integer,
    expiration_date text,
    exercise_date text,
    exercise_price numeric(12,4),
    exercised_units integer DEFAULT 0 NOT NULL,
    payout_amount numeric(14,2),
    status "tenant_initech-corp".sar_status DEFAULT 'active'::"tenant_initech-corp".sar_status NOT NULL,
    notes text,
    created_at text,
    exercise_trigger text
);


--
-- Name: securities; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".securities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    share_class_id character varying NOT NULL,
    certificate_id text,
    shares integer NOT NULL,
    price_per_share numeric(10,4),
    issue_date text NOT NULL,
    status public.security_status DEFAULT 'active'::public.security_status NOT NULL,
    vesting_schedule text,
    notes text
);


--
-- Name: share_classes; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".share_classes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    type public.share_class_type NOT NULL,
    price_per_share numeric(10,4) DEFAULT 0.0001,
    authorized_shares integer NOT NULL,
    board_approval_date text,
    liquidation_preference numeric(10,2) DEFAULT 1.00
);


--
-- Name: stakeholders; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".stakeholders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    type public.stakeholder_type NOT NULL,
    title text,
    avatar_initials text,
    user_id character varying,
    address text
);


--
-- Name: users; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL
);


--
-- Name: warrants; Type: TABLE; Schema: tenant_initech-corp; Owner: -
--

CREATE TABLE "tenant_initech-corp".warrants (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    company_id character varying NOT NULL,
    stakeholder_id character varying NOT NULL,
    name text NOT NULL,
    underlying_share_class text DEFAULT 'Common'::text NOT NULL,
    shares integer NOT NULL,
    exercise_price numeric(12,4) NOT NULL,
    issue_date text NOT NULL,
    expiration_date text NOT NULL,
    vesting_schedule text,
    status "tenant_initech-corp".warrant_status DEFAULT 'active'::"tenant_initech-corp".warrant_status NOT NULL,
    exercised_date text,
    exercised_shares integer DEFAULT 0 NOT NULL,
    notes text,
    created_at text
);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, tenant_slug, user_id, user_email, user_role, action, entity_type, entity_id, details, ip_address, user_agent, created_at) FROM stdin;
78df20a1-dc4f-4f67-947c-df6604b6cb51	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-16T05:34:20.568Z
b274f51c-25d9-4134-8f30-fafdff134e3f	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.91.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-16T05:38:23.069Z
8c9a65cf-358f-4131-b937-65316724ef99	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-16T05:40:05.742Z
bf032c3a-7c21-477f-af63-87464f839f94	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.91.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-16T05:40:57.347Z
5c1904f9-f5f6-40af-9cac-e55379434e00	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	logout	auth	\N	\N	172.31.91.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-16T05:41:59.153Z
05b51cca-5b5a-4210-868c-cabd603817f0	\N	5f445caf-5a83-4692-98ea-20ad02b8a6f1	johndoe@acmetech.com	\N	login	auth	\N	\N	172.31.91.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-16T05:42:10.879Z
0a086373-6c69-4473-9461-f45567cde60c	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.91.226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16T06:19:44.338Z
b718761e-cb37-4d24-97c4-e014a155f124	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.91.226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16T07:02:55.897Z
45086287-08d9-4c5c-af3d-7bbe86a817f6	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	logout	auth	\N	\N	172.31.91.226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16T07:04:33.200Z
e669eb68-d607-4abe-a0b1-378de006d975	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.91.226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16T07:04:52.305Z
038d3747-1d06-4bb0-84fe-51a7ac0c55d1	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.91.226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16T07:05:09.407Z
307224b1-5c18-40d5-aa1e-56eb9551b7df	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.74.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-16T16:37:26.139Z
03f239d5-dd78-4820-a5c9-92529ccce336	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.74.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-16T16:37:43.678Z
b39ab604-5ec2-4113-a4d0-bce876f64eeb	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	logout	auth	\N	\N	172.31.74.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-16T17:02:17.409Z
40dc002c-d57f-47ef-8cee-de26a7e48eb7	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.74.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-16T17:02:24.153Z
4bc4a8cd-529b-4505-8b60-9b74b8eec43b	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.74.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-16T17:02:46.265Z
06a22d3e-3ce6-4999-acab-ba6e31215640	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	logout	auth	\N	\N	172.31.74.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-16T17:05:31.694Z
abad73ba-1143-4397-bbe9-96039823a174	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.74.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	2026-02-16T17:13:44.159Z
ce6c2008-7226-48b2-8865-a95279da85a6	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.74.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-16T18:46:19.401Z
a4a2cc29-da50-4b5a-bb99-be281ab0be0f	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.78.226	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-02-20T00:00:14.661Z
60010515-801a-4feb-8a39-e7557c067985	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.82.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-22T01:16:25.610Z
1977a1d1-d87d-42bf-b7b4-cfa067c93cd6	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.82.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-22T01:54:02.074Z
246c21b4-424b-4f23-b2a3-4e4f8f5b440e	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	create	share_class	abcc6c99-4671-4b86-856d-b17cf3d4383a	{"name": "Test Class VF4eHj", "type": "common"}	172.31.82.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-22T01:54:27.615Z
32e1285b-8fa1-40df-9b49-00129f3bfd7c	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	update	share_class	abcc6c99-4671-4b86-856d-b17cf3d4383a	{"name": "Edited Class AAc8SA", "type": "common", "pricePerShare": "0.0001", "authorizedShares": 500000, "boardApprovalDate": "", "liquidationPreference": "1.00"}	172.31.82.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-22T01:54:58.608Z
4538dba8-e947-4e9f-b438-5d6a0445bef6	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	delete	share_class	abcc6c99-4671-4b86-856d-b17cf3d4383a	\N	172.31.82.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-22T01:55:13.510Z
6546bd80-0910-46bd-b483-0269be820984	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.82.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-22T02:50:34.789Z
71208c9b-7b75-4347-8081-45514c5e3239	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.113.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-26T05:32:36.866Z
23d705d9-01e7-410f-be23-030e17d02aad	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	update	security	572ba515-eda4-44d8-a6a1-79edd5644c18	{"notes": "Founder shares with 4-year vesting, 1-year cliff", "shares": 99999, "status": "active", "issueDate": "2024-01-15", "shareClassId": "44d3ff9b-796c-417f-a125-b9882886e830", "certificateId": "CS-001", "pricePerShare": "0.0001", "stakeholderId": "d37319a8-5d2b-4eab-9e4d-3fdaa4b2c644", "vestingSchedule": "4-year, 1-year cliff"}	172.31.82.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-22T02:50:59.595Z
aeaf24f0-acf4-4d11-9c64-c01ddb3c2b5b	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	update	security	f86b6088-79d1-45f1-b25c-a25d18e6e96f	{"notes": "Founder shares with 4-year vesting, 1-year cliff", "shares": 1000000, "status": "active", "issueDate": "2024-01-15", "shareClassId": "44d3ff9b-796c-417f-a125-b9882886e830", "certificateId": "CS-002", "pricePerShare": "0.0001", "stakeholderId": "68040616-78fa-4fbe-a3f1-af2fb075c973", "vestingSchedule": "4-year, 1-year cliff"}	172.31.82.98	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-22T02:51:24.076Z
3ebc42ee-0050-4237-93c4-7b27a88b2355	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-23T01:44:41.835Z
8d5e06a7-a90f-4d6c-95bc-597edfbe186a	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T01:47:01.491Z
2c62ec01-5210-489d-ac47-938f1bff9710	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T02:03:24.495Z
b5ff948c-3000-49eb-baea-b63416d522c8	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T02:43:43.259Z
4784f6fa-e28a-4188-a18a-15c219503f50	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	create	safe_template	8226ffa4-b990-4ebd-8235-42cfdd775224	{"templateName": "Test Template", "templateType": "custom_note"}	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T02:44:18.041Z
5e6a04a7-706e-4505-afbb-673124355219	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	update	safe_template	8226ffa4-b990-4ebd-8235-42cfdd775224	{"description": "Updated description", "templateName": "Updated Test Template"}	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T02:44:18.073Z
f2368ca5-9339-4cee-a347-fa72a1b7bbd0	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	delete	safe_template	8226ffa4-b990-4ebd-8235-42cfdd775224	{}	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T02:44:18.093Z
90db4355-7b47-493e-9209-09e167425bbc	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-23T04:01:00.884Z
3a7f914f-d925-49b7-8296-4dd1a83fd276	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T04:53:11.672Z
073eed40-bc4b-42e4-986a-d01c34f7092d	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T05:22:06.418Z
87db0907-3f79-4b07-8206-b7b85ce7804e	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T05:34:11.925Z
f24f4990-7658-4196-a57f-f43d5429f322	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	create	safe_template	d704af38-c93a-4d48-bca3-594fe79aeac9	{"templateName": "My Custom SAFE", "templateType": "safe"}	172.31.66.162	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-23T05:35:10.117Z
9507458e-84b7-4ca6-9867-2d2dc2695dc5	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24T02:30:10.439Z
70e89442-9281-4766-bd9e-2af30406613e	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	create	stakeholder	1c48597d-13b2-4e34-a31b-faf5efc7ed94	{"name": "Test Investor API", "type": "investor"}	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24T02:31:01.652Z
52f375cb-f864-4e60-b9ba-1bf697f2aecf	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	update	stakeholder	1c48597d-13b2-4e34-a31b-faf5efc7ed94	{"name": "Test Investor API", "type": "investor", "email": "testinvestor@test.com", "title": "Angel Investor", "avatarInitials": "TI"}	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24T02:31:48.678Z
60e27fb8-e77d-4d0d-99a2-33d4fe8cee5c	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24T02:33:20.121Z
19c27dae-1051-46ac-be4d-603b22cec8bd	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	create	stakeholder	8db67999-8412-45b9-84d7-97775e55a883	{"name": "Test Address Investor", "type": "investor"}	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24T02:33:38.417Z
983078e9-f7be-4f54-a844-94767ca7bc4d	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	update	stakeholder	8db67999-8412-45b9-84d7-97775e55a883	{"address": "100 Updated Ave, Boston, MA 02101"}	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24T02:33:49.972Z
acdf510d-06ad-4a65-a251-151224001160	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	update	stakeholder	8db67999-8412-45b9-84d7-97775e55a883	{"name": "Test Address Investor Updated", "address": "555 Final St, Chicago, IL 60601"}	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24T02:33:57.948Z
f3ea6138-89aa-4389-b181-3dac5a657d13	acme	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	platform_admin	delete	stakeholder	8db67999-8412-45b9-84d7-97775e55a883	\N	172.31.67.226	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-24T02:34:16.644Z
450dd09d-e01c-48d1-afe4-b2fdd4a0b4cb	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	172.31.73.130	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-26T06:35:41.903Z
18d05ca4-9f0c-4d58-b5ef-31248c1a7709	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-26T06:41:52.167Z
43ae9ecd-0b3b-4e9f-b916-0fd3f56689a9	\N	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-26T06:43:23.759Z
fde9b912-437e-41a9-98c2-dce8f96ee3c8	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T04:31:00.175Z
eb11a722-d85b-4aef-8e17-1747c0c1a70c	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T05:30:45.533Z
6f0baa73-2b94-4355-aefb-88d1a8452b9b	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T06:03:56.460Z
088691d9-76ff-4309-86e7-f9310e244a5c	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T06:07:16.271Z
85e7d3ab-03cf-4671-87c3-8bf47f35e846	globex	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	platform_admin	exercise	esop_grant	dd44bc2e-a548-4ce0-9a67-6d6db2d77953	{"newStatus": "partially_exercised", "computedVested": 28125, "totalExercised": 28125, "sharesToExercise": 28125}	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T06:08:34.537Z
fb28be2b-c73f-4585-9692-b805e4b82384	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T06:34:59.087Z
6d798a7e-1782-4450-87b2-2e2df539f3d0	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T06:39:23.182Z
8c7b9b2b-f6a4-4dee-b191-27f9392ee14e	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T06:42:15.047Z
b0b08da3-01ca-4e45-8922-cded92f26c7a	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T08:01:09.732Z
226e47d7-3fe3-4536-9327-3e1031047937	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-27T08:30:37.378Z
62c4ac9c-5e65-40fc-87bd-8a32633fdd0f	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-28T00:59:48.287Z
5d2e3240-40e2-4506-81d3-c427f1447241	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-28T01:00:18.485Z
4336091f-7830-422f-a40c-797f0a83e5cf	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-28T01:01:52.791Z
ca99e0d8-dabb-45a6-bdbf-d7b1fc179f1e	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-28T01:03:40.129Z
9627b238-f73d-4f52-ba88-5f9cc452332f	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-28T01:05:41.473Z
879dcb71-3aa4-489f-b0eb-7149f5c5e53f	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-28T01:25:19.470Z
1b71b3a6-dfda-4284-94ac-563e55ec60ee	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-28T03:33:09.783Z
2e0fa814-145a-4cd4-aa5a-4dd4d3e89126	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-02-28T03:40:48.500Z
c42f79e2-1005-4d9d-aeba-f35b366be1e0	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.66.34	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-02-28T07:00:15.710Z
e61a5a9e-7afd-4d9c-b13d-1029093ee65a	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.70.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-10T21:42:54.517Z
9e11ba3d-8703-4550-bd68-ebc951dc2812	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.70.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-10T21:55:19.046Z
91e1c3f3-8abe-4ed5-b86e-0276b66012b5	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.70.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-10T22:57:45.263Z
e86a035b-4c43-4400-b77b-f03f1fb56dcc	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	172.31.70.66	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-10T23:07:07.998Z
2443ed59-abac-4f3a-aa7e-a663bee13c9c	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	172.31.70.66	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-10T23:18:39.880Z
fec093df-648f-486e-bc1d-6cfb53f070e1	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-11T23:40:22.478Z
75fed886-802d-4475-9d17-18cd1f3b2aa2	\N	d4c27ed8-d5f1-4e6b-84cd-82729c6498d1	testcookie@example.com	\N	register	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-14T00:31:05.300Z
2c23257c-51cd-40a2-b435-4a6df17ea518	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	logout	auth	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-15T19:29:44.121Z
0c4e21f9-4e5c-4ff4-ae1c-d8674b4fd532	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-16T04:40:56.303Z
d0ec47a3-d667-42e1-baff-c56e8ac40bb5	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	logout	auth	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-16T04:40:58.933Z
9ffb9cf1-b2a5-44df-bef3-c107549a1b36	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-16T20:55:17.378Z
a3be96b7-7534-4ff2-b67d-c9145ba25854	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-16T20:55:39.496Z
4e558ee1-703a-46d8-8e7b-f2d6c873b7bd	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-16T20:56:48.863Z
ced5cfbc-b564-4d11-99a6-acd3d6ec5eba	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-16T20:59:07.806Z
300087e1-d7ed-414c-9936-b521bac7819b	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-16T21:01:58.970Z
cb8edc1a-56dc-4047-8a81-9e8ce17e29fb	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-17T05:40:25.157Z
9ab6f368-9fd3-4e4d-bbed-ced171781453	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-17T05:42:58.715Z
e4d23fc3-7866-4621-a1a5-6c8e2a3a961e	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-17T23:28:20.005Z
1825c8f3-8f01-4d11-a552-ffde7b9a2d4a	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-18T06:35:13.310Z
3b749d4f-bd45-4178-b335-8ea5cf1a027c	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-19T23:05:36.607Z
0d27927f-b05a-4530-990b-a5534fdbe35b	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-19T23:07:44.895Z
ed7d68c6-1afe-4748-b432-c17434485a04	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-19T23:08:19.921Z
61fa0089-ac43-4e95-ac18-2cd801d72be5	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T05:07:09.585Z
c0c7e37b-8c1e-4a28-af33-e3212a62fda9	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T05:11:09.346Z
fb1ef69f-200d-4e79-9b3d-b70b46372da1	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T05:20:01.992Z
34789b17-6b38-4eb6-a910-d9fb679aca7e	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T05:40:17.793Z
a243fbeb-cf40-4c7f-b42d-3dc7f5193233	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T05:45:11.534Z
f2dd031b-0c50-47ec-9c5b-6f83be73cb97	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T05:55:53.335Z
0ced9679-1219-413c-9f42-78d2d5d8518e	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T06:35:30.412Z
27a33ac4-3124-455c-a2cb-9e9761e692a0	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T06:38:38.870Z
327ed012-ec58-4d09-b77d-d9bf83b1fdd5	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T06:51:47.748Z
44544195-9a47-4557-bd34-2f15ea47ccae	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	curl/8.14.1	2026-03-26T07:05:25.757Z
fa3dca72-0a46-4248-9912-d88921033084	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-26T07:10:41.579Z
637c32ed-e7bd-465a-8890-b88a63c37ff4	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-03-27T17:16:43.109Z
c00ff368-1c27-47d0-9047-f5186acd2fd8	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-29T02:48:30.510Z
050d4a5b-a0e4-47d2-8cf4-074d35fdb0b9	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	logout	auth	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-03-29T02:48:35.512Z
1bdb9e91-10f8-447b-97ba-9d5e37b285f7	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-04-10T00:02:16.997Z
b5ab7555-d032-4760-9562-b453c4a23c5d	\N	50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	\N	logout	auth	\N	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	2026-04-10T00:44:36.961Z
f9199486-61ae-4020-a686-e600b65cb9b2	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-04-10T03:38:38.669Z
9d0d0590-4357-42f3-9971-5dec4d608d0d	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-04-10T03:44:27.398Z
c8bf211d-f198-41dd-93d4-d87f264a7ede	\N	e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	\N	login	auth	\N	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2026-04-10T05:32:33.585Z
\.


--
-- Data for Name: commitment_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commitment_records (id, tenant_id, holder_ref, commitment_hash, pedersen_commitment, salt, share_class, is_active, created_at) FROM stdin;
b4205910-78a7-4176-a2a6-38dd17ba1c48	7c107aab-53a4-479b-8930-9ff801b93ba0	436c0217-bd29-4b2a-af88-434144022f53	0f7e8a3238943463f33bcf1920086aaa20db33d1ff9c058feaeac2927f69dfe3	\N	8716976946c51cdd210c3c14e15d2983dad8d92beb2cfa3ba072c66788ba6f06	e58917d8-54f6-4049-8f45-b09aa7c4d5e6	t	2026-03-26T04:54:53.037Z
cd5819a4-8c74-462d-9558-c7f275195cd6	7c107aab-53a4-479b-8930-9ff801b93ba0	9dd26f3e-4453-4edc-83b6-538ef11a7c3c	f07ad17040baf1b80971097a5cc06c28ab79581ce8b591c1f6162e81a69d3981	\N	97627f545a51aaa8aadf555de69e69dca99fadfecf64644898aa4232365d4544	87f60111-3a02-4069-8754-939519f685d9	t	2026-03-26T04:54:53.042Z
0edad341-b394-451f-89db-29de4250d814	7c107aab-53a4-479b-8930-9ff801b93ba0	fbacebb8-1dcf-4e22-940a-cc42debd9c4c	6602cf445f36742ac6ff8e79df17d0fd8537e22ac0b93c48457d392129f87428	\N	afb1f327e37fb41d02b51fcd262033ace24f886d669826708a1a8bef4d8602d1	87f60111-3a02-4069-8754-939519f685d9	t	2026-03-26T04:54:53.046Z
9f3cc99d-12fa-410d-bc52-a34ee01fbccb	7c107aab-53a4-479b-8930-9ff801b93ba0	85c33785-03a2-4674-a5f2-a04e3d9c2243	4d1fd0eabb2b94487043d9ba3f3922d96e4f0aa7a146653ca6460577445f6217	0x0c5093fa8db6672f2791222141903ad3da806bfa14c3806387297d24aebc1db9	0fd93a4860b05932af59222d51182543c0270c7e5c890d7d90b84607a3803d0c	e58917d8-54f6-4049-8f45-b09aa7c4d5e6	t	2026-03-26T04:54:53.004Z
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, legal_name, incorporation_date, incorporation_state, ein, address, total_authorized_shares) FROM stdin;
f0614545-ea45-42b2-8cb9-aa880c576ace	Acme Technologies Inc.	Acme Technologies, Inc.	2024-01-15	Delaware	12-3456789	123 Innovation Way, San Francisco, CA 94107	10000000
\.


--
-- Data for Name: data_store_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.data_store_categories (id, org_id, name, created_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, company_id, name, type, description, upload_date, file_size, uploaded_by) FROM stdin;
a476c5ee-8cb1-4eb5-99e6-f4f435f3b186	f0614545-ea45-42b2-8cb9-aa880c576ace	Certificate of Incorporation	legal	Delaware C-Corp incorporation documents	2024-01-15	2.4 MB	Sarah Chen
d7777944-fb4e-47fe-871d-c528aa248ba1	f0614545-ea45-42b2-8cb9-aa880c576ace	Series A Term Sheet	investor	Signed term sheet for Series A financing	2025-02-20	1.1 MB	Sarah Chen
effbaf2c-133e-470d-a298-e7992ab4554d	f0614545-ea45-42b2-8cb9-aa880c576ace	Board Meeting Minutes - Q4 2024	corporate	Minutes from the Q4 2024 board meeting	2025-01-10	850 KB	Marcus Rivera
78c6228f-4b26-4479-866e-4073e010cf0c	f0614545-ea45-42b2-8cb9-aa880c576ace	Employee Stock Option Plan	legal	2024 ESOP agreement and schedule	2024-06-15	1.8 MB	Sarah Chen
b3790c7c-cad0-472b-9cb0-1b898d532cc4	f0614545-ea45-42b2-8cb9-aa880c576ace	Financial Projections 2025	financial	Revenue forecasts and financial model for 2025	2025-01-05	3.2 MB	Sarah Chen
\.


--
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_verifications (id, user_id, code_hash, expires_at, attempts, used, created_at) FROM stdin;
8667fbd3-f58b-4929-9193-f9882a3297cd	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$zJJoO3SrVUrDhkKbWWUOnu4GzTWVvwOl5Hk1fG315JxE8.T0ZgYiC	2026-02-16T19:24:00.413Z	0	f	2026-02-16T19:14:00.413Z
1af960c0-0102-419c-96ec-93b398c24322	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$nqFX/lwxlvGpoW1WmJ4oleL1XpZ0Zd0ax43VNaaXmNEwGs1RBwzqK	2026-02-16T20:30:35.499Z	0	f	2026-02-16T20:20:35.499Z
a9455aa1-2c25-4509-b55d-c29c202877b0	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$cfzozY7VYcDOa11lTBn7Aef69kKYMClGUkLAdqmC4t8m8ZbOaSe5i	2026-02-20T00:03:50.202Z	0	f	2026-02-19T23:53:50.202Z
4d80261b-c3f7-49bf-9593-d715d4dc954e	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$msnoR9EGMshOGgpGbZE49u8QVutZMqpz7WVjiJjw6fx5U7v9KYzTS	2026-02-20T00:06:09.361Z	0	f	2026-02-19T23:56:09.361Z
f4ba7149-a215-42eb-b213-c4c9d41cda06	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$2ehf7/8s9rRasKwTlcg38e02vywlmJD/vxTwz/btmbeGIhVV/FWw.	2026-02-20T00:07:58.466Z	0	t	2026-02-19T23:57:58.466Z
20a373cc-f101-4dca-a1b4-5f37fd3d616c	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$75QjYGRcl10.wenT4Icf0On/yJyY6dThtil2EzdCHWXoqFsU8tdOG	2026-02-22T01:26:07.177Z	0	t	2026-02-22T01:16:07.177Z
87bc1583-833e-4a9f-9b9a-58dbe33e8156	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$P9dlI87XksozoOoOSKED6.R4KeunXRP1U2AXrhw6SpC.KsCWg9zn6	2026-02-22T02:03:45.898Z	0	t	2026-02-22T01:53:45.898Z
efba8ef1-07d0-4415-b449-22ab298cb611	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$u2QYDX8//HV7GBXv1ke/JOW9ulzwHFjBS6A5OZ1py1hxmX5jSSveC	2026-02-22T03:00:18.909Z	0	t	2026-02-22T02:50:18.909Z
1f2f9b74-fb1e-4555-812b-d44915d7e211	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$/AHoApbxDvhvaLH1vl5fr.3.tjhLStlox/I.3Xpv2h3sZ93gKNqya	2026-02-22T04:40:55.830Z	0	f	2026-02-22T04:30:55.830Z
47bbb23e-eefe-4e46-b307-d479e3667849	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$VRu/aqeKHfo01ao0HvAyQeij3QthvpsP4WIW4ewQftB4RLYz3rjsq	2026-02-22T19:21:07.068Z	0	f	2026-02-22T19:11:07.068Z
04e50e75-33a8-414a-a50d-54d025a3321c	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$cfmlVHfExgDhmYFbUTt3a.4eYKEzQMnGNeXAAZKdnJApnVAC2WKvO	2026-02-22T22:50:57.057Z	0	f	2026-02-22T22:40:57.057Z
53231b9e-e767-4533-9a08-ba4ab88f58f5	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$9iu1vzxBvI0m2Cv/hUNCfuGZRQc9ilRlAC/2ha5dMx8tban4IkGne	2026-02-23T01:54:33.021Z	0	t	2026-02-23T01:44:33.021Z
590181b7-cd61-4dd0-9d7f-03eb19885e79	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$XxSDjHJlBC.WFnADnd4Ia.Mx55jsWdYdVmXNryv1xf2hHj0k80zkq	2026-02-23T01:56:42.717Z	0	t	2026-02-23T01:46:42.717Z
ed9cdebf-172a-4647-a6c5-531125636a0d	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$R4bU8UBkfyPA/bUoYuJigOkUJJpZZPfqceJZe.Zuqoa9GTpsFPUXa	2026-02-23T02:13:05.230Z	0	t	2026-02-23T02:03:05.230Z
6f889df4-1eca-48d5-92b3-75a9628ac91c	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$syTejAHm8FnF1bU9V1AFV.pGJF2C0BDhnryAbACRyouy75GttAJlu	2026-02-23T02:53:28.800Z	0	t	2026-02-23T02:43:28.800Z
c4910892-8146-4cff-8acc-687518f37065	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$pfHLtIFD7icHFg5RfOR.7uqdtBIVXxYKz.YEGlmI.jA/sads6r4Dq	2026-02-23T04:10:51.157Z	0	t	2026-02-23T04:00:51.157Z
63ae5c69-5c00-40fb-967e-34825d120f05	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$AVFBrfw4KVeeoF3cKXkNhexsKHyaQaNOZpH7vBVZi4.vQUqntiBpi	2026-02-23T04:28:19.278Z	0	f	2026-02-23T04:18:19.279Z
85658f92-af06-4ca6-8698-434afaefb14e	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$/tKdsAKX6SBSyx/xI4EnrOSyi8BXdVuz7V5fHB5n2EkLKOyOsW2W.	2026-02-23T05:02:55.599Z	0	t	2026-02-23T04:52:55.599Z
f6fa5b8f-cd19-4995-98fe-8b28391786d4	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$9OSAUuhq9hujxErBpZReyO2qI07rsXR5o0JIvtmcXfFYyWMTOq2ZC	2026-02-23T05:31:50.992Z	0	t	2026-02-23T05:21:50.992Z
164d12bb-6062-40ae-8220-43a2c5e39fcf	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$PlkUaaCQKk2Y3lXUDI7qDujB22.urif1r.Z/BnAnP8d9PRzJwd2m6	2026-02-23T05:43:52.023Z	0	t	2026-02-23T05:33:52.023Z
d35dbffe-1ddf-4201-82b2-b789720188e2	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$ZqNbIAOGFQIF0K0sC05G8umETBGCxfNwX2o32nNzQ6qKT4du1yXym	2026-02-24T02:39:44.900Z	0	f	2026-02-24T02:29:44.900Z
63c7f7ab-3e43-48e7-853c-7bc8b6058bd7	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$VQoMePzalG.641BoKaj1geX6NTbEx4vN8yE5n8TicBkNbs/ky53Dq	2026-02-26T06:45:26.060Z	0	t	2026-02-26T06:35:26.060Z
1bec72a6-9c36-407b-ad47-d776a4dd4c8e	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$J8YPJdf/IhcvOPDgcdw7W.AVBpNKQHwan4NoQXH83ylN6kT/BCJR6	2026-02-24T02:39:55.029Z	1	t	2026-02-24T02:29:55.029Z
ba9cd065-8f6d-4e24-b749-3897d677a86d	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$FvJ2gPCnsW3tmayUT0sC1ehY23P8.FILtwc9KhZ6ZXA45VfeOd032	2026-02-24T02:43:12.812Z	0	t	2026-02-24T02:33:12.812Z
c3acf8c1-658e-4ddb-9eaa-a4fd0e7b9072	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$IG9awdIloWJRyZThQMqPkO0KX9n7q373k4EAu/0fdiy5IegSNydce	2026-02-25T23:57:09.882Z	0	f	2026-02-25T23:47:09.882Z
4b22371f-904a-47c3-8261-b169a4ee3090	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$RaJh3PIwhvr7Fm.wt2Oc.u2aaN3ZilQZvXG2.nbH.NqV1Z64jYd2y	2026-02-26T06:51:00.089Z	0	f	2026-02-26T06:41:00.090Z
0a72bebd-a767-452b-b221-611c0df60d60	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$0goMq2fsrxlNIMsQ.PMjtu2TOj8Dg9NqbFeH1BzaqAgw238IzK5CG	2026-02-26T05:42:12.145Z	1	t	2026-02-26T05:32:12.145Z
674a765b-6985-4695-a268-0c266eef59ee	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$diK930cthcxpTJ/ekhEQIOapW.ZMnqUX0V2jr3UegDvSEHozc4QZm	2026-02-26T06:11:01.982Z	0	f	2026-02-26T06:01:01.982Z
89b4f9a5-91de-4fcf-8dea-15fb39e494b0	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$LdV57elxHI9ZKavmyWRnouUxT1D6MhkhHDU8lxeLz0FTEDZa8jSKy	2026-02-26T06:12:56.321Z	0	f	2026-02-26T06:02:56.321Z
6439c10c-d42a-4221-bcb7-bd7d852272e1	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$.TCMEpmMdNjfInYqL1HZKu5cXChn/iN2.QZbMsV4In5DVZGPLFVae	2026-02-26T06:14:07.663Z	1	f	2026-02-26T06:04:07.663Z
7e8b2639-0e89-4e58-b940-c951c9e2a187	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$an54zxm15bykQ6lPhpExBOEw/LPJn3c1SHPefyXoTO4cL/.zfUVRO	2026-02-26T06:51:43.370Z	0	t	2026-02-26T06:41:43.370Z
892493a7-3120-4339-9d82-42cfcb5b4608	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$Z3UY5X.z55kpOjH02LbjN.c.8.VnBzE9qAMjJm1YR9gGvrqq83eDq	2026-02-26T06:52:30.739Z	0	f	2026-02-26T06:42:30.740Z
87bffcc8-3b70-4c6c-bb82-a1a00201d314	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$m.BtwAv/pRF9pCeQXi9QKuLvw00fdsjidxFdLTVNt3uspkmdaLrtm	2026-02-26T06:53:09.737Z	0	t	2026-02-26T06:43:09.737Z
bc4fad5d-f81d-4eee-a023-f2754ce4571a	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$wpWwSQTu2JVmtjvgFeHYlOl.WLh.n6a7lW0B2WHrQqssgy4TdT9Xq	2026-02-26T06:55:17.694Z	0	f	2026-02-26T06:45:17.694Z
7b29201b-2a56-47a6-8de3-7df5ec8ca894	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$SVKaQdMgjYfOFUoh7zM5j.WL.odtrL6gBxnqzJBnmcPFNc.k1vlLy	2026-02-26T06:55:57.181Z	0	f	2026-02-26T06:45:57.181Z
0822f86a-6725-4698-9b61-b1586149c252	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$2KWS8sl6lRvAS8Jde8nN9ubALZKjNKIscY4b5Hwnj0jTDtczIZl0e	2026-02-26T06:57:34.898Z	0	f	2026-02-26T06:47:34.898Z
ea5ce9db-3f04-4d5b-ba98-9071a541c2ca	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$vCjnPQgaZcibE8Lwl.69i.WkwcOVXZMmPP6UHWSe4tRyIPMaOgZKC	2026-02-26T06:58:20.602Z	0	f	2026-02-26T06:48:20.602Z
091489e6-2fbb-4664-891d-3e111682a87e	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$t/le0AwAreN.xi7S.PKr0OyxSliNsRFgAHRAV/dApwNCaStRxmbYe	2026-02-26T06:59:47.581Z	0	f	2026-02-26T06:49:47.581Z
254a3461-d0d1-4d9b-a2cd-50ef69223dde	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$Zmu5vIIhtpJz8Ne0AfX/MuWN0Fgpt/3abaCmY4CaA9OFzSaV7YBv2	2026-02-26T07:00:36.794Z	0	f	2026-02-26T06:50:36.794Z
ed2b4bc2-f304-46d9-8000-ba36adeef17c	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	$2b$10$0MP9E0dShcHLUjvUeQ6dju0mEJ5s5OElZUWJHS0zeO3PCZAPeUHUO	2026-02-26T07:01:14.624Z	0	f	2026-02-26T06:51:14.624Z
4b15a91f-ee2a-42ad-88b0-ff64c80ebee4	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$dl1K1HLsMJHvySi9FI1hCOKEQOh0EkJH4cmSsu/OK/0Nj1XJ9b1am	2026-02-26T07:02:45.751Z	0	f	2026-02-26T06:52:45.751Z
9424a1a5-5ded-4b6b-986f-08fdd85d9d9d	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$EyRtDeNxvYRszWEgWiFUE.U1wz5GrI.fBs0/0FGpwIp0AhTUoA6Qy	2026-02-26T07:03:59.373Z	0	f	2026-02-26T06:53:59.373Z
553b66f8-5251-4906-80e5-c47b8b520225	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$V71oHfbWves6tR.f8K/XMujLn7q.VU6BeL.thp9hjpq6B9RKFNOAy	2026-02-26T07:06:07.852Z	0	f	2026-02-26T06:56:07.852Z
e01aecce-eb8d-4c63-904b-f1701dd1f521	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$QVch8l2ZKTykxwr/i.sIb.4b3Zj0VWRwqtkiFiewPplwBN9af/arK	2026-02-28T01:11:37.249Z	0	t	2026-02-28T01:01:37.249Z
8f10ff98-42b5-4e8a-97fb-f8823dcd1fc7	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$D8jDzrk/J7A0BaN4YhxQ2uJL75LeOPQBkj2ayjBTzp6NKGhNwcrYi	2026-02-27T04:40:41.141Z	1	t	2026-02-27T04:30:41.141Z
5f36e3f6-7fa4-42ce-9d50-339d0200a8d0	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$5OX4/ppL2fDf/ZcWMD2YqOyihbjEBvwYrUACMFolZTPIYFFcA.aJ.	2026-02-27T05:40:20.263Z	1	t	2026-02-27T05:30:20.263Z
6d6e4afb-b3e6-4089-901b-b22e97c404fe	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$FP/ramgVMwugFfrfa3viCOkUTW4M4UyapuLzRd3qTBby.ygZWECPS	2026-02-27T06:13:35.608Z	0	t	2026-02-27T06:03:35.608Z
6c36f3da-3ca5-4126-979d-7cc91b684010	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$Ej3P/v9MK9CyXGuxz5f6c.tgqyf2WCmAEmpRBEJhFSrWfPSgJ6Xkq	2026-02-27T06:17:07.959Z	0	t	2026-02-27T06:07:07.959Z
33be608d-f312-421b-a34a-9f5275ac70f1	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$6g0KRkLTgc6JE9E7b0eB7./ADVpGMMZQy2GKW3PsgE48xKevWZija	2026-02-27T06:44:06.169Z	0	t	2026-02-27T06:34:06.169Z
60dfb7e1-63fc-45af-a8fb-f365fe18509d	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$WA7SQnN5X5YjwjReqUIXIusdDQdyKSE4T60F5EsvWmB.J0BHMQdDG	2026-02-27T06:48:56.218Z	0	t	2026-02-27T06:38:56.218Z
f3788107-c908-421c-8e6a-933748ea62ba	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$KB/AMF72UkJP1y5arTJnxOZaJ4IEF7P2G14fZx0cit/tMYFWoUI5C	2026-02-27T06:51:58.524Z	0	t	2026-02-27T06:41:58.524Z
86eeca44-7198-40ab-aa98-2ba11b070d43	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$4G.JNrPMAness7nRy6RgG.7hPIppb8Xtk43uROgDdaXh67HSGzUyG	2026-02-27T08:10:49.553Z	0	t	2026-02-27T08:00:49.553Z
0f3ad544-8bd7-431b-9185-9bfc59abff33	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$AS8kpeXlzIpO8sN4yduYGOX9mMDTaODfhkMtbbNzoDu0wUNa9TPwy	2026-02-27T08:40:25.253Z	0	t	2026-02-27T08:30:25.253Z
a6ac6bd5-0b44-4a9f-a89a-51b1d240d926	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$Zutoq5dM7tMabWamEE9rBu6xFZjZ3eO2XtnB.1m/GaZkhrQLLdIs2	2026-02-28T01:08:56.468Z	0	f	2026-02-28T00:58:56.468Z
6fe5e916-ab51-4e76-b460-efc4f0e8b977	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$vxukaecDq3BzNEcGPyQzE.NvVAOx3JKettm2hvbKHfIMBlc5Vz0Bi	2026-02-28T01:08:57.119Z	0	f	2026-02-28T00:58:57.119Z
f0dc61aa-4ce2-421d-ab1a-10084b0816e1	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$OAEKfNBYLnORsF31RgDoG.ujweAv6GRKz6jBZx.ZLNXwdGMFMpJ3u	2026-02-28T01:09:35.553Z	0	t	2026-02-28T00:59:35.553Z
20d57b76-388c-471a-a1bf-18c47a688811	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$viebOFLjAbkkWYoQEVVDCOK3Dv1wIZj9ZYooaRaPVaht2VJFyFrGi	2026-02-28T01:09:57.477Z	0	t	2026-02-28T00:59:57.477Z
e38e55bd-2262-4010-98e4-a7545235ab9c	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$U4yCU7sj8uj/ZgJLYRasNO45DgIKQ7GSx5oFbuOxOylRVWjOjklCm	2026-02-28T01:13:23.814Z	0	t	2026-02-28T01:03:23.814Z
73f88825-3bfa-4aa0-9a58-ab1b5b1b4bdc	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$RUnHzSVIcrh3kIOj3iTjLeYaUP7NpECBHazAoo8sf3AAKGZHF.qwS	2026-02-28T01:15:30.985Z	0	t	2026-02-28T01:05:30.986Z
b2e53ea4-f5b7-43c9-9176-50401bd27924	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$WtLl3mAoC1uVScRotMJzVuIkATIqmYvKMsM4vjJmHRsubfEfMmFtW	2026-02-28T01:35:04.605Z	0	t	2026-02-28T01:25:04.605Z
ba0fff43-28a3-480a-89db-292244141aef	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$4aosVr1tfIQbteRgk89KNuZdCmTVz26w9mJvUAqAvHl7JZErZeVpa	2026-02-28T03:42:53.554Z	0	t	2026-02-28T03:32:53.554Z
1657e93f-9a2b-48e1-ac47-5e5c78d1d663	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$L2LlN5mygOa4FyI0gMV8AOE8nIWrS3NTQRC2wUuFpZuCb1vBa3fUa	2026-02-28T03:50:32.916Z	0	t	2026-02-28T03:40:32.916Z
3b51daa7-fbbc-4667-93fc-7de07b54c343	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$tSC4KsaKMejthv/BoMuTn.h./ttNkuYZlhSWJLykqnCR4Xty85Omu	2026-02-28T03:51:52.994Z	0	f	2026-02-28T03:41:52.994Z
7ad2648a-1427-4be6-94b3-8d9b700383a6	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$EIi04svaA41f1Y4VhKZJYuueU/3Sw84KWZCr5WKRCrb1MK7I6KBP.	2026-02-28T07:10:01.347Z	0	t	2026-02-28T07:00:01.347Z
43faee99-5bc1-4e86-9fa3-3c03c3fda5e7	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$6uOreDx2h0CY.J1.KbBqOuFVd.5qZczKLnxHA/DjR86zyB7eiHDkK	2026-03-10T07:08:11.027Z	0	f	2026-03-10T06:58:11.027Z
c2c5fa9b-32db-405f-b087-89f860606572	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$nAI/Y8NkWG8BtgSIYLSw8edk8qNGd4DBXvvYjsCr2hiwI72DYsWG.	2026-03-10T21:34:07.121Z	0	f	2026-03-10T21:24:07.121Z
16c1333f-9923-47ac-bf54-db8b9d85e8d4	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$1dyILHK4gKfrLIS90nKdfetIFKZ1bIH4Ko99vTTDJJp60VVerTQWi	2026-03-10T21:39:21.199Z	1	f	2026-03-10T21:29:21.199Z
a469b176-3fa9-4470-9f1d-6b3d5cf9bad3	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$InvAWNfPv5azOtMYXCKMreIGqlevjDj6U3wGtsK/dH0NVOrmfF2b2	2026-03-10T21:52:26.507Z	0	t	2026-03-10T21:42:26.508Z
b1ac7ce8-4f58-4d18-8ecb-8abb8f7f9b09	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$oVuufq7QA3REhpiR1lMRHeA.H4ysnG8pFsRNN1axd.gLAuQHXCjTi	2026-03-10T21:54:23.780Z	0	f	2026-03-10T21:44:23.780Z
b2c3f2e5-5c1c-4395-8d53-5759e0cde828	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$2hccffO5tLLB9.U9j3.4HuHXZk9mX/s2UYeRd3tpm6zKEPMUuSmvu	2026-03-10T22:03:18.930Z	0	f	2026-03-10T21:53:18.930Z
d6ad9add-b2fa-420e-8be6-3fefd7449431	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$6tV3o1uPiOSPJOoUe2/KGOz3GIz3u2UPWv0LWaltYyHj2D2/hTjS6	2026-03-10T22:03:22.848Z	0	f	2026-03-10T21:53:22.848Z
4e872988-640e-4a43-871d-c573628c5c68	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$rw6NjWLOEiPmD.JUvfWTsenN8c9l0omdGzBGbDnjGqXYOyEWYb8GC	2026-03-10T22:04:27.245Z	0	f	2026-03-10T21:54:27.245Z
9e3efb47-7b2f-4f65-9c75-7bf945691074	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$NjgGRYrFPy9WF83/R0ufiOnXQvO37GJn5U19U3q9Roo9.7/6FJL/K	2026-03-10T22:05:03.482Z	0	t	2026-03-10T21:55:03.482Z
69075a8a-2242-4b33-9aae-8cf4d9c94f29	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$2pfKuV95IvKMD0Wl.8xdwe1DZbVsCY2FZQlpovrbNOwjjVj2VTEWC	2026-03-10T22:54:28.790Z	0	f	2026-03-10T22:44:28.790Z
6e8d3267-e3e6-4e3a-a419-2d9c1fe6c273	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$YZqT1rjENROUFmLh7UaoguiXKOlAUUNaa1kHHu9PjLv7Y71YLfw/2	2026-03-10T23:07:29.401Z	0	t	2026-03-10T22:57:29.401Z
2395a673-17d5-41f7-a427-473271604e26	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$2e.N41F/0UJbIPvzBildteZmqF0HaHWo6JYXfKEpexZUFvVOOMdbC	2026-03-10T23:17:01.439Z	0	t	2026-03-10T23:07:01.439Z
43ba11f5-9806-40c1-876c-909d8e446b76	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$T0w6aYh.e1mgjMsc1ygJSuzUFvboB6Hhv4qa26SZxA8yFG9n8eQsO	2026-03-10T23:28:29.779Z	0	t	2026-03-10T23:18:29.779Z
770923d9-ba17-45ec-afff-f4a79d7b4062	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$sIHe3YDkPGB5lo2pPSDG8.S00OD/66uUHfgALzJ2dOAk7wp.yB4Hi	2026-03-11T23:49:57.358Z	0	t	2026-03-11T23:39:57.358Z
0b801f8f-0f04-4475-976a-fafbb5666675	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$uwY5Mvx5u6esmCgMlvVKXeTTYyfJYMUEDRnec/jy7DqgiRv3T7k7S	2026-03-11T23:56:43.707Z	0	f	2026-03-11T23:46:43.707Z
25db16cc-de1b-4b66-b985-71655443d15e	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$3zhYVNUC5ApYqs91EO4WguxaWnVdaIrMg1jRu4Jld2j3RLlWZbfjC	2026-03-13T23:56:20.962Z	0	f	2026-03-13T23:46:20.962Z
ff48a2e3-dc36-4ebc-9880-4cb7311e41d5	d4c27ed8-d5f1-4e6b-84cd-82729c6498d1	$2b$10$ow1fC6r4t4gQTsTW0Aq.oeSRaexiXMjCyGbPilx4eote77R/0ApWW	2026-03-14T00:41:05.292Z	0	f	2026-03-14T00:31:05.292Z
10091bd5-46d8-45ac-b238-83633d2db388	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$J1GhTLyOk42BEXVPqZkZs.jFKTyE2DfwfqpLeH3j8.JblPTewIBVW	2026-03-16T04:50:40.856Z	0	t	2026-03-16T04:40:40.856Z
1add8464-6abc-4356-85d7-f3c67c3aeb3c	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$lGBVwBK07ezwLQTxqnfzC.ZhR0DcsQISiSrzeNXT//R8afLItrV26	2026-03-16T21:05:06.082Z	0	f	2026-03-16T20:55:06.082Z
7fa13391-653c-40f0-b220-9622ce0a7a57	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$9wZzjN5EgnbJh.POOg08QOeKvoyxuwmQOLEmm7sr.oc5j38Bbek9q	2026-03-16T21:05:11.623Z	0	t	2026-03-16T20:55:11.623Z
d68f902b-d297-47e8-9212-74b7f12ec859	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$ll8Fbwo7VnAOhcatsBHd6O9UrYEjh.pQgtU5LrVBMsQy5UUq5j/s2	2026-03-16T21:05:31.052Z	1	f	2026-03-16T20:55:31.052Z
9132689d-760d-4551-9e69-34aecf9ea3c6	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$9bryo1uddlKwMh/KQFJdIeV.ofjQ2ewY3JHBj4FmRFdcqwspP3AJm	2026-03-16T21:05:39.247Z	0	t	2026-03-16T20:55:39.247Z
8dba2451-2f15-40ee-892e-01b4faa45078	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$Jb2c05HNsUTyVIHgquH33O4Mrb2TYvdAJgqpx1heUmq66ieXEB56C	2026-03-16T21:06:48.594Z	0	t	2026-03-16T20:56:48.595Z
1adda2f4-7597-48ec-a71e-00dd7376e1d1	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$yjgnjnvRiMybJBNmw6fuy.tMhA89z/6BxIU1QVY7hNBaOO6DStJVC	2026-03-16T21:08:58.246Z	0	t	2026-03-16T20:58:58.246Z
c0d5fd68-fbe1-4a8f-bc34-eb28e7d7a880	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$v22LdSv15QQyIYOafSst.ezMCpaKlQPd0cBWKuJX1SGxWuzJFgdR.	2026-03-16T21:11:51.499Z	0	t	2026-03-16T21:01:51.499Z
72937780-6ab1-4feb-b886-49923efcfd84	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$.ZL/DG4sClfQj1Y5l6cqUORQqkhUIIyinfSi3PMbmncBc7hT86jge	2026-03-17T05:50:24.705Z	0	t	2026-03-17T05:40:24.705Z
97e5622e-a3ff-445c-91d7-6b78417cfe43	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$K83RcZLwBRdib5SODiJ82u1El803rZQlf8/iAJRO1164wgl.HDMzy	2026-03-17T05:52:58.404Z	0	t	2026-03-17T05:42:58.404Z
ab4f177e-09ca-46e5-94d6-585a690fd72e	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$y2ImaUvqTW1YyjVv6Wq4EuxDduzZ8P/jHe8MuSLIPpmXQe/ZfsNQq	2026-03-17T23:38:19.729Z	0	t	2026-03-17T23:28:19.729Z
57c1fa48-2dd7-439d-a9a4-f0642d6ae90d	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$vSCqcSOpKzUMZiy5rt88UeiUTWfOemdeg7vzN/nKz0LFLUigIyo/i	2026-03-18T06:45:00.746Z	0	t	2026-03-18T06:35:00.746Z
c429b0d6-6919-46db-b03b-922edc4b8a45	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$YIA5Qh2I1D2wWZvXU1zksuw9pwqYAIWrgTxKHEdPsGAiRZjpRAAfS	2026-03-19T23:15:20.887Z	0	t	2026-03-19T23:05:20.887Z
7e19d90d-437e-4bf2-8361-7a02c4c91871	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$xPpTF2h8OO2J4dA.qAqez.9XbI3TH9qxrHq09aUfilV8X9jCnofPC	2026-03-19T23:17:32.132Z	0	t	2026-03-19T23:07:32.132Z
102516f1-a785-4f71-b434-a9aea38d92b1	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$tnarvHMtDnB9f8RTWiiYh.nxmSP1YHfn7k6WF5laei3sAxlPWRati	2026-03-19T23:18:14.454Z	0	t	2026-03-19T23:08:14.454Z
9ae1fbbe-69ce-40c8-b06b-95790b3edd47	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$mB2yrNlNUSbup9ZTKo49Wetcx41C2CpoX0LR1U/xQsod1ij7SUz6y	2026-03-26T05:14:52.449Z	0	f	2026-03-26T05:04:52.449Z
11d2b4cb-b3ab-4ace-8de2-146d2691d386	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$Z6.dszpTBXXlVi6xi0WbZ.KGmNhddHybswMN.etRqeZ/8DZu.NWym	2026-03-26T05:16:54.446Z	0	t	2026-03-26T05:06:54.446Z
428e26b6-7066-493f-8b6a-ee629e6fe045	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$qsqK1VqwvYAxbsFQ0l912ezOWTVdqWJuhW/JTzHLUk.mFkydF7a3i	2026-03-26T05:20:58.279Z	0	t	2026-03-26T05:10:58.280Z
2b510b78-42e8-4cd9-94e5-d1fde111da53	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$PdO3aJzFlKkdanB84NN/OulIiF5TttBdgP1xi9WrQwVpu6XF/7cO2	2026-03-26T05:29:51.207Z	0	t	2026-03-26T05:19:51.208Z
4c949c62-4580-4d3c-97be-ec39f67f4f16	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$SOs2Zj.sDFXl/lil2kLPg.3lpHNttzmgJpVpcdFGUfIYRdGHKBU4O	2026-03-26T05:50:01.980Z	0	t	2026-03-26T05:40:01.980Z
240931f1-ad6b-4ac1-87f6-456bc1da7071	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$mcHfz.6euopalK0wwDtnteRG1jAyuONBq/QFqrx2uxYxhR7Fy3zNG	2026-03-26T05:51:59.153Z	0	f	2026-03-26T05:41:59.153Z
b06431fd-8f31-4fe7-b0ab-f5ec582f2f82	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$q.Iehz0xVpZNWfQIHA1Yaex1HsMqLJZytFK502MNxvFNvtovV45xK	2026-03-26T05:52:05.442Z	0	f	2026-03-26T05:42:05.442Z
355ad25f-d88c-4efc-8e3d-26866a555d2b	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$uIlr6FnomeGhOO2zZNM1VeRs43pdPr2lzqzZDzr/paOZ3QlWfwKLq	2026-03-26T05:52:21.133Z	0	f	2026-03-26T05:42:21.133Z
356c7d97-5701-4976-b191-40bb4f1fb330	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$CtR626HO7Sj0mSVXUpBaeOclSfBHPRiBG9rtpsqPgaHEUauNMCn76	2026-03-26T05:54:51.872Z	0	t	2026-03-26T05:44:51.872Z
8f913955-e5c2-47c7-aa11-10336af19a4b	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$xNdo9x73vNRsy.cf4FAdDuea4gPUpUwHZdtWPUM21kthB6PSEwbrK	2026-03-26T06:05:39.582Z	0	t	2026-03-26T05:55:39.582Z
20388521-ce32-4cb9-8b32-ada11374c8ff	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$j5/Y1XY1UUEPCsPpJ1vYB.hhbmcpS8/H/2gvnY79zvA0mXOFLPOMy	2026-03-26T06:07:58.180Z	0	f	2026-03-26T05:57:58.180Z
72257de5-da66-47d2-bbea-28745a4c08e0	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$sBUkukVEycLmr5QRjEeXoeahBgnkuvE.NSBlsJSWyuot16IR4eiNC	2026-03-26T06:08:14.492Z	0	f	2026-03-26T05:58:14.492Z
cf2ad04a-37cc-426d-b5b0-9486439f8632	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$tz2hWC2mzuhL7VC3F0BtjeyHVgkq9BIqklOYydeL6N1.JqL.7NBMi	2026-03-26T06:08:40.069Z	0	f	2026-03-26T05:58:40.069Z
f261c627-b770-4a50-a047-851540e0a3f1	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$aEIZ9uJDiG0Kgm2318TXHexZCbPumTmr7Fcigji0ZZC7U7LsoF8tG	2026-03-26T06:45:19.702Z	0	t	2026-03-26T06:35:19.702Z
0f7f3de2-cef5-4a5e-b2f1-ca9c17f41560	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$Rtu0Tmdyj0e504uRgAJRtOgsrLpVJobP47iwPrfwMMNmf8YgbKNNm	2026-03-26T06:48:16.545Z	0	t	2026-03-26T06:38:16.545Z
aa9f1334-11af-4098-a635-a83eb1783963	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$aqC95WF7AfJLFdqO4oB/IOZprK07GFXgUtoulzI4LQ6/IhiReolC.	2026-03-26T07:00:40.680Z	0	f	2026-03-26T06:50:40.680Z
9a193752-e385-4c6c-8736-0cb195d9dce4	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$ZbVxkgJ5qzd8Jl/wjTMjteD.CKHfAsscnLMIkLBhSaP12iDEtFdeO	2026-03-26T07:01:26.216Z	0	t	2026-03-26T06:51:26.216Z
944b84a5-dfed-468a-b298-f0db1734cbba	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$CvubkWVGKE2AgmU.r1H7ieiRzNtz5PyjWfC35mVOb9.RJW9S9vLzO	2026-03-26T07:02:46.377Z	0	f	2026-03-26T06:52:46.377Z
ae0368b6-db7c-43a8-995f-b9b9bc666572	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$WlsYMM4aVCOIX0pn3pWgfOO9e22hNeIJaKXTHXIwsxdstkVwDlmQi	2026-03-26T07:14:37.496Z	0	f	2026-03-26T07:04:37.496Z
c776a97a-2647-412b-a056-52732992ff17	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$02aSqDkbMethWCV8wqBYXO3wvv2mVQi67iOon1r2Yr9iqTtJPTDGi	2026-03-26T07:14:45.665Z	0	f	2026-03-26T07:04:45.665Z
ebf89b77-c04d-4710-a600-870ef2b6e984	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$P1vkwQpbz/QstjLU1WgxRu9gasMfTaGXppX2sn68rAi8J3aFFLSfO	2026-03-26T07:14:51.515Z	0	f	2026-03-26T07:04:51.515Z
447ec6da-9b39-4963-a762-8b6c99d61f42	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$CoViBSUt2SNIBcxi.TvxyORPx1Q6EGRGxa0yifMmDzEFJjzR3.MB2	2026-03-26T07:15:25.496Z	0	t	2026-03-26T07:05:25.496Z
4813616c-0ead-44a5-987b-36cec8f51809	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$6IOoAj0A8lxPD61N91AYz.3IMBKUChFqa9CCupSQ/hfM79u/S8Z0.	2026-03-26T07:19:56.111Z	0	f	2026-03-26T07:09:56.111Z
ce425da2-33ca-4bd1-bafc-c9a07a42c679	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$uswcGJ/39be1Ozu2cY2pSeOdIUIs3.RVxT4.6BGVCUlvzJRETh3aW	2026-03-26T07:20:20.989Z	0	t	2026-03-26T07:10:20.989Z
087fd989-1550-4870-95d6-2d673a4cb2e9	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$N1oUhV.VqMGjiK.fT5ErpuTcilCYShepWVj9hFX82N6YnuO6fn6Pa	2026-03-27T17:26:30.337Z	0	t	2026-03-27T17:16:30.337Z
68118d97-e1dc-4f79-8b3e-d18fc3d7890a	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$yLbhsfsupUO9o2z8vcY0e.cv3HbGZ4UP1h56ofboFEuwrnSN4Idde	2026-03-29T02:58:24.110Z	0	t	2026-03-29T02:48:24.110Z
55493fca-8ec0-42be-902b-798f4b512680	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$1TsqOfXSjy5.sZmf5ONfAeSlA47ZQa2uZmRm8R.PiENWGUvvnCu9u	2026-04-01T20:05:10.721Z	0	f	2026-04-01T19:55:10.721Z
d71cb6b6-b560-4da5-9d46-ca981aba5381	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$ZxQaElZF9fd54nUyy5TIPOZGoDY3.97mHh6dUpC0chtBjnYTe70O.	2026-04-01T20:05:15.956Z	0	f	2026-04-01T19:55:15.956Z
0efcb98a-0f82-47d3-bb37-f63cd25ece3c	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$r7u22JEmOSxKeiZ2jPsdPerBcWDxOQPcfALM7t/pD5/z6xcT0FC3y	2026-04-01T22:42:26.390Z	0	f	2026-04-01T22:32:26.391Z
f367dac4-5dde-4203-ada3-d9254488ea08	50e7a53a-575a-4477-b75c-bcbc53deb44e	$2b$10$Jfmfye2h2vrvaXiekd1Xi.lECOwWgEEoC0rm5ipmWxPpN54XJ1zue	2026-04-10T00:12:09.650Z	0	t	2026-04-10T00:02:09.650Z
68f8a63b-5d41-4a6c-a9d6-264947ea9905	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$8eMSUGnN35s1vAXc6G7eLOmHkwz//cudSN208USpYrIAfyhhi.iy6	2026-04-10T03:46:55.472Z	0	f	2026-04-10T03:36:55.472Z
9a59e249-da33-40bc-9cd3-f7cd884801ab	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$4lMqQlS75E7iODahVwvIiOaV5Ra4jnq123N4gWji98jFZScDr7hsa	2026-04-10T03:47:02.050Z	0	f	2026-04-10T03:37:02.051Z
4b2a774b-8724-4b71-97c5-bcfbe54e7f8e	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$C2LtwQ4.ktAVXz3b5eu3MeKckbsc8aSjT1mi0hCqQH9XNZkS0za2G	2026-04-10T03:48:25.401Z	0	t	2026-04-10T03:38:25.401Z
0988e984-ce1f-43c5-b048-2739c2c76316	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$LvrpTm10pIDLgIz4NKGP2OKC1RohA3cETvYJKvgQh8MI8xKJ4pse2	2026-04-10T03:54:14.732Z	0	t	2026-04-10T03:44:14.733Z
87f36050-3b49-4efd-9ade-8b0d3de90ccc	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$xaAQG6dbDfWublnrRPbIIuDGssNm8rT8CPo0x4i/gbJTkL2tVp9yy	2026-04-10T05:37:02.094Z	0	f	2026-04-10T05:27:02.094Z
85266fb7-95b5-402c-8af3-7f7136a3977f	e5e98577-2262-48c2-8ecf-120f1e533bc6	$2b$10$VpMcHw9ukFObOKTqEtqptewbRz4tzQLa277JMPYZR.BJBN/gwAB8.	2026-04-10T05:42:22.989Z	0	t	2026-04-10T05:32:22.989Z
\.


--
-- Data for Name: haylo_intents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.haylo_intents (id, tenant_id, user_id, natural_language_input, structured_intent, grok_raw_response, status, proof_request_id, rejection_reason, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: investor_updates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.investor_updates (id, company_id, title, content, status, sent_date, created_date, recipient_count) FROM stdin;
a91520eb-e7ab-4b34-9e82-edc59ec4c0af	f0614545-ea45-42b2-8cb9-aa880c576ace	Q4 2024 Investor Update	Dear Investors,\n\nWe're excited to share our Q4 2024 progress.\n\nHighlights:\n- Revenue grew 45% QoQ to $850K ARR\n- Launched enterprise tier with 3 Fortune 500 customers\n- Team expanded to 18 members\n- Closed Series A term sheet with Sequoia leading\n\nKey Metrics:\n- MRR: $71K\n- Customers: 127 (up from 89)\n- NRR: 135%\n- Burn Rate: $180K/mo\n- Runway: 24 months\n\nLooking Ahead:\nWe're focused on scaling our go-to-market motion and building out the enterprise feature set. We expect to close Series A in Q1 2025.\n\nThank you for your continued support.\n\nBest,\nSarah Chen\nCEO, Acme Technologies	sent	2025-01-15	2025-01-12	3
c0c64505-c633-4af0-acc8-34ef3083b69c	f0614545-ea45-42b2-8cb9-aa880c576ace	Q1 2025 Investor Update	Dear Investors,\n\nQ1 2025 has been a transformative quarter for Acme Technologies.\n\nHighlights:\n- Successfully closed $2.5M Series A led by Sequoia Capital\n- Revenue reached $1.2M ARR\n- Launched API v2.0 with 10x performance improvement\n- Hired VP Engineering (Emily Zhang, ex-Stripe)\n\nKey Metrics:\n- MRR: $100K\n- Customers: 168\n- NRR: 142%\n- Team: 22 members\n\nWe're entering an exciting growth phase. More details in our upcoming board meeting.\n\nBest,\nSarah	sent	2025-04-10	2025-04-08	3
1dd91ac3-43c9-4db1-b269-42e1453267de	f0614545-ea45-42b2-8cb9-aa880c576ace	Q2 2025 Investor Update (Draft)	Dear Investors,\n\nHere's our mid-year update.\n\nHighlights:\n- Revenue tracking to $2M ARR\n- Expansion into European market\n- SOC 2 Type II certification achieved\n- Product-led growth motion gaining traction\n\nKey Metrics:\n- MRR: $165K\n- Customers: 220+\n- Enterprise accounts: 8	draft	\N	2025-07-01	0
\.


--
-- Data for Name: phantom_grants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.phantom_grants (id, company_id, stakeholder_id, grant_name, grant_date, shares_equivalent, grant_price_per_unit, plan_type, vesting_schedule, cliff_months, vesting_months, payout_trigger, payout_date, payout_amount, current_share_price, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: platform_resources; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.platform_resources (id, name, description, category, document_type, content, mime_type, file_size, file_size_bytes, auto_seed, created_by, created_at, updated_at, admin_only) FROM stdin;
\.


--
-- Data for Name: proof_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proof_requests (id, tenant_id, proof_type, requested_by, public_inputs, status, created_at, expires_at, request_source) FROM stdin;
c3c87391-d0e2-4c64-aeed-0bc7423c3e53	7c107aab-53a4-479b-8930-9ff801b93ba0	ownership_threshold	e5e98577-2262-48c2-8ecf-120f1e533bc6	{"holderRef": "85c33785-03a2-4674-a5f2-a04e3d9c2243", "threshold": 500000, "shareClass": "e58917d8-54f6-4049-8f45-b09aa7c4d5e6"}	complete	2026-03-26T07:06:10.442Z	2026-03-29T07:06:10.442Z	MANUAL
f72753be-1690-404d-9454-4deefdbeb118	7c107aab-53a4-479b-8930-9ff801b93ba0	ownership_threshold	e5e98577-2262-48c2-8ecf-120f1e533bc6	{"holderRef": "85c33785-03a2-4674-a5f2-a04e3d9c2243", "threshold": 100000, "shareClass": "e58917d8-54f6-4049-8f45-b09aa7c4d5e6"}	complete	2026-03-26T07:06:39.118Z	2026-03-29T07:06:39.118Z	MANUAL
b578f855-1249-4f1b-9e7d-e89cfd74dae0	7c107aab-53a4-479b-8930-9ff801b93ba0	ownership_threshold	test-user	{"threshold": 1000}	complete	2024-12-29T00:00:00Z	2025-01-01T00:00:00Z	MANUAL
aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee	7c107aab-53a4-479b-8930-9ff801b93ba0	ownership_threshold	test-user	{"threshold": 1000}	expired	2024-12-29T00:00:00Z	2025-01-01T00:00:00Z	MANUAL
\.


--
-- Data for Name: proof_results; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proof_results (id, request_id, proof_hex, verification_key_hex, verified, generated_at) FROM stdin;
93c2947e-b205-4d76-8bd3-61c3a816968f	c3c87391-d0e2-4c64-aeed-0bc7423c3e53	000001c10000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000006ded05fa0c9f88757d5ea14952442f5f9c00000000000000000000000000000000002a55080f37286f7fddcc8d5558839b0000000000000000000000000000008586df6627859bd7aafc2e46814423438e000000000000000000000000000000000008df7ce5f1f4074ccb9796647f0c31000000000000000000000000000000e7eee9711b894a56968f5df4faf36f2cb60000000000000000000000000000000000261bcce6c0f1f628dc13234e56b4930000000000000000000000000000008e0883d7b93dea4f36d2d81f30fc9788790000000000000000000000000000000000173dba38469e52af8ee732e8c741dd0000000000000000000000000000009bfc5cd6286d765989b2a6432e3ed24e6900000000000000000000000000000000001373ec3c9505cd456e190ad34717f00000000000000000000000000000009ad8f52cc2cc7669104a6008d52a19e2800000000000000000000000000000000000276f946d379ef68ede848dd1439ac100000000000000000000000000000041a8522a6dbc4d4db707b185953cf5cfc80000000000000000000000000000000000121419bd7f459e549f28e8d29f88e7000000000000000000000000000000711a8423c3e517489298b5b4d1608c9a3f000000000000000000000000000000000003604a03bddf33542136a3d38c148900000000000000000000000000000041a8522a6dbc4d4db707b185953cf5cfc80000000000000000000000000000000000121419bd7f459e549f28e8d29f88e7000000000000000000000000000000711a8423c3e517489298b5b4d1608c9a3f000000000000000000000000000000000003604a03bddf33542136a3d38c1489000000000000000000000000000000d8436d5a8f1d89f4d1c9481ff8e190445f000000000000000000000000000000000020dea97635749eab1890084cef9537000000000000000000000000000000c939209bbe00d9c9c8cae45c58744bf108000000000000000000000000000000000021b38c3d703cf3e5984c1e8eeb95ec00000000000000000000000000000064cdc201d190c8d361a3cda9b4cae6d49900000000000000000000000000000000000932bce32f1952e8a4668bfef313290000000000000000000000000000002279158eca47fb287575696f9d26dccd3d000000000000000000000000000000000029786927ff74563c5a3e209ca6443e000000000000000000000000000000d9bd82e02dc54f85d43b331ba41a75fd4f00000000000000000000000000000000002d933bbe35ddea4a0731a60db40e640000000000000000000000000000000f410b4cd35cd6c345b2da582c9bd6164600000000000000000000000000000000001aeafb65064db88d8b208ea0cf56f9187bc1622c0005fbd6e061511a4a3dc6838bd1d82a42b78688bb94f54c4bd10217e88d10b5319a2de16fe46567371a96a4a816704f76b90abb26609ea3b42eff1f10e95b025ac87e2d165f82a6c9ecf26c72c62ce9a5076536415bf4266d70d61b60c76b3324bd858f70bc1526d82f2bbd9b88230af9cd67ede84ebc298c3da60b0d0e6105a6c3fa404fe9ca1f9a4e0a7942a5635383e8290ccd55502663a52623ed016bb33cdc42f5cf28bd1faa5304c8ba6f1d45eee997c63b77b29342568c0f7829ebafac6c6e23b1eae2e2107a017be111119e3b3398a8e2c87175da2fbe11c95e577c7f6aff2abd626324f1e019d71d6c92cc51c42c6ceb6f00bf5224dc0c678f66775aa4d5b3f3f424607d28521f65d2192a9358a73572793d0b1605ca0fdf3c6f7e73c96a92a0c259c2adc3ead5f556485647357f21dd9b3d604226e709d84594a0bf2c3c9e3b9fb0381df0e2a87ba45af21530b4e1a11f624ea74ea819cbf0a41db31076f82015e3966526d9c634f927fab495e353a28f17de96657226e4fc3a4419541ecf8a3ae6517d12de5d99d2d3f4df5d1c1dcead5b077099b13003de2d946f658cc1422026011128293974ffff33eca3fb61e6b89dbae885012948ab9aa11bd6ec26c7d2bd696084a85916753c32fc78352f5d575717f68cd40318c5fc23ff58ae1e9c2f2775912174b0e9a1eab9933049bc92e856fee9d5ad1bd598a8e141b8fadff5e63590a76a5801210ce51f8b2568c736f1b86f462b470a312765ec69ede8ead3328bbb4b38822728fefbcdbb1c71ba707d0721548a0c2e1c0796f0955ea6d8e600345170f52436c04e27819a85ebc9323af708bdd39400be19e21d81151c2ac8ac2701bdb637ae34f6ebe1e1e443d0a79a593661024a0ba9acd071745c4a11d964db56b3496a98aa24bc8facb4eb6f5aaaac91ca8f350a2ca71dc7a80bae19ce6e307b9fff0571a841b250f0306a2435149aa029241b1fcc1b008ecb58b3ce7dd9d595fcd5fbda79f5377a55802331c25b2925b65e8921415b29b22385b64965104b63bafa1b19d9c1ee927724ff77fcf8a91f9f79580deed103081559f46fffd3af4955299a56a5b87134b3a2c1639bf66bc47bcc77169c921d372a4548651bae238c22657e687a0492275cd024b60d95a5a2b598cc10d88b48800c04e7139a5dc12e4275da8c01d388085f9eb30b1c4e5de0dc441f2c0d1bdeb3dc96fb0d1ed0410f81299081516f4d0b444417833d757bd770ae0d1973fd24b5c1089c4f1e9777c3ecb383db789f0f4ceac874b8d7605c7fb27fd2271cab9a7e2a802febe27d3e46033ce9f0538bfe0456f9e838b90123d59913df2e340be167d1ac6ef57c50177c537765c5271c83efd22eab7155720208c2b9f810c215dbd5709db44918ba976a0d1b0ddf5b006699f45e872917969fa4aef88c10fda8ce81e63534e75c042004c24a09d418573f9d8d84a156905b553f18fc931a36d01f9776881c65e6e2e899e2979c4182165bd4c2b536da08eb373668b65b03e9ca8efd3a75b4221922a8c50eb43ff17c85f8c76a638ff05b3f3f2a7323ef03682fafc834ddbefe428a49b926fed182ea35fb8543c3156f1b705c05712faa30165cf8cac0dca2b68d94fbb5d6ced618c0bdf59200546caa86bca1bc2235652765e0e3a6478980ae12acf8c9b728cc4197843fee5836decd2a60ba2b6f7a1101d3e617e955811c36ea823713869f6540d7f5af883fe4473797e955c4b411060f202c30c43739c70d6c400c8b75cd12bc02943b6d505594ef42b204e952ce862afe8200c01958116ea330d99d6720e272fa6cc76394b6faad53b401763901231bc991cb981b2b43f39ff4a62bac0e1e8d3845aa8e00275ce9c5c4f1116fed74160ee7ff431187c688de75af53258a95c5ea937164f049756f18c4a522267a340624f59283aac83e4f728db5d701fcade217e539c4bd0ae4e30ce61ba5f36b412112d03438419356537a827e66cd82cc893cc0d9d39f58d3ff376fab5ce54ec805fe95f4c09b4bf0e0eaa35ad72b42da9494268ca8afecbae6ae70d4378cd03c23a86d780e07afdb89232698902e563660b1e72b7d9048bf63926192316eb28c0da395fecf0b207d775136419dc30a21f3adc10e7cd96c435e593e48424379321ac50096967b4123d7079a97c970e73e13965887aecd634ae1afc026aa7863e0072a3d21618f86e662179272444e24ca7f5ff5b93360cf97ab6f8e76e37fb3f4118658081fefdd4e80e4a1b95b041c70f099fe46bd4b06500be7e5e24623bb9007122a15823245909507f2e81087d13d6ffe3a598e01c9ed3b333c6ed44c201f1d7b27ce1621faa422247be8f6cd952d049987092dd23720747982b20827dd262fbe9507129cb49b461792f0049a6ff1f1a8a4d767cd6b2443bf92a3e001d41b140b9b6bfe6cff35144e2745a51a84e7b11413e3e291ce79318e8760391d47a02336402aa9c35a64e7da2f479b18d1640a1cd18557eed047f6b45fe9819dd92f1d0dba8254dbc0de3182d93de033abc9d88c9518dffe31cbba5122e69f50d1bb1c28e2a241a99791f5faaac5e5571ace18d2db39020f8c565cb16b46afa0a83f1ffc5a3156189301705f6bd760ff4d1daa20edf938a377986e75405e457be6521eb62e9ef9bf6f73cf5db52228fa1ec4b04352807d53def912b2b1883930b6091990591e45ed74f3af8e8e8032a81f7a084107bfa285a5d1758a4d08791525920b43dedd241464587f70edb07dec0fdea9d375995b2dd6f44e63a6d09546c15b0840d1b9d6792ff1290f19d3c12f667899cdbaa115adaf299fdcae6eccb7b7db15e9f6c865918a58917ae59b7cb8bc3f4548b07dbc528919dd384b0c624f01ec06e8cd81d55c4170712fa224aa03be343b8e05801aaa938d028064181e361a81279cb26b1a7c9645743f79eaf63f8cc7c33ce9064ee15999a58e0dcdb2c215321105d1794f6a17f26b6dab79013193900cf12516bcc56d48d59d5adb52580c170cb9720070205fb681fed2999afcc3861596d480d267d43ba99b0abf4921454c03f5f49f9b14ba6d3ed4a334af5369218503ba20460810184482a7b303974cb52e2ab0d1ed2f2a0bd15cb190846e8bc6f3a77d67e75b8d8c62c82c060c6896580bcfc3514b6ba9f7411a9e0b3018de2333925011d68cd2b751f6da91a129246111dad6d2fc531320b3729c52ad205ba1ea0f112b1de9d4c258fa6c011dc537280214659afccc9c409218f1e7e417419dc90ad2d3c00413d0220d25551d8f81fa2bf81d7373593434e432147b721f85e047f9540c925a51c97b2fe0f8d72c8f8a019169ab9e8644e90dca0e00b2338596cc77c23bdf616f1a44ec09a1b10b4f6b227ba1324dbb405463f4aee792fbd7c75d7545fee0c1e662b66055f6661e4ac72aa412555eefc8243d9a793dafb3aa1f41f138faa46f9da2ca43c28db808d43c06d27bc5cbb4ec94be09d037b509a328030e0fdde7420309d66baaffe46eebbb121ed11aac8f983e8572c3aae68eed749e65ed52b905a0137ade167cff55c5df03e397e9e37d474b04154fbec77dd26137dd7bd9bfa714d115eaa3cbf1e2270e25d8d995a586b27d9633401f4c46dfa397eb4546d21299e7684c1336e5b056150846f2d86ced668a4534e487f7e47b5560482a29f2d508b282af0b8e0b2d68741baedde6980e0214ecbd925e92db516d1583f9c476165e2a26716841f21874f826121497ffa1d3f4bc9b0d16655cfb229915efcf163c915a0e5ab39debe115f60a8ec68e89866af550d060f48be76aaaabbe9040636700a4af8a8a1d86541a570cdde643ff8003fc6e493ee02b4d6b189b60b7d1b42b03d6e643de606f9306fd26e991e3a0fb663d29d51b65699047365742291ce15bac8452e77469449ca27b0e3594c42ccddf8a0f1c0308e910442c623a3e7c2209713e95e40a4f9fac0e3d16521e0500c81d9b0be72c29f58511e2ac922808fbe24fef0d89e71cb82549e1019a163b6fa2e77b5d0f49831d31bb810a6a5177658a70d9e7973f8370c9c1e322e2443e4badfe1a172ca15cfc4cecb3d4f0842f8b954298e65e21359e8e1a332fd054f2d4fbd81d9ba31477e7e6ef8b04af060ad6dda40fa55e258ac17c4de02d218ab0c7959ba9fb5d36ec50d3caa599e603d37959d9d46fc9cad0a5ffaac401833e2d7912b668de5f70f7ff558fb8c665d422324a6a09ee1ceb8073a1027523bdc02256b1ba026cfec7c364a30c8896718f7fb671822a8f4d79e410bd6f03240ccf643a34dd767920769a3742a2321031f09d98d9634bdb01d12b40cb1e0804e3a71720c8a0029f67142ad395aeb666b93f67e717dcfc8b54c491c5555d3f03b578212f8d1dfdfe0ae1d9c2abf9e66c8acbc656f25586be6bdc8c5156e99c108355e75950d47696a1a6bc2472c7a9fe27a82ff21dd4885ab149d335a5b4f71faa7852e714bb197295e2fcf7ed06d7968c7d2962a8155f7770a80c0fab716915e40fab05115ed14b05a6cbb0eb230d2d46f2484b44b7b08d6a4fe404a5b5ff2708439d386ca413246d9eea93182e2c2c5bd91a18a0a50f9f0f09016fa568200b5f4453d004fbc5695c1d460e8ac0a4517a6b92b1a0b5697e6161c9caf85bc528313cc74bd42fe4b64382e3073c5741b3d352e62e6ecad40efe08e535e53eb52d3db0679f48c06d88ae94d35826d479f436f1d4dc7836ff561233d2773aafae05d8d6d85578aeb78b9987afb0ef361dcad0d2412b473615b6d037f6b5fdaf05271799d7e38731933e7a94731fada5f3bb676298424ee1bde28a64356c6d876e227e04eb534a0cda821abc80a13198cca8fd58d22b915b0c431ea8a995c8d8cd0b3a37b0b28b003913dcd2303973de94c09da5a7a369e708c1be4b48d01906c000a96515d6c64af82f3ace2f51b67355bd59e7e229238ec88f5ef233221779662980003db7b094e61cb78e7ac25761482b605900dd5e57c501e3676b45417d45007d22b155d3736d8a1e6c667a74a154687c194269f87cd51ca8d9e5564643150e579ab3d23be24d73d1ff9f82ba3fda3e7b4924fe697dd2b33ea639cf7a5b7027d3df7ba8217f792aad1d419dbcd4ad51da525225a6d313c2e75750b8c6fef819df621afddb731c50284a3774592251eb2dd80c503707dd44e8b640263c845128c9248ed055d0dd71949fa0c087d4da441831eafc6a89434c95ccf0f446f26f20bb0c53be895c57481c3d92f142f294f2d420ebec4826de811fac321b244e0208875dfaf1e7dc5945a2cf9bd30339631338ed92e33deb9a088ec9b0085bbd590cc8f717469c92d10d4e620788c05bb1aa099d54cce55b54317cd3fed43e5d3c26c41aa44ad5d3b5ed2e96fbe568886515cd35b2eb07c1720a64fe7cd769f1bd000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b2fc8f0185df2b71ed95b85eec5128e030a1287584d084466983fb514efbd4014ec183172ed06111957893c433e553fb22f478f46cb5d07fb5bd4b496d3d7191faddd2b25d84c70686aeed7d2ee965054a94363c2e6d483248cbbd30b7d695f293db059bc45be7d6a90ffd0941b1a251d43b6f94682e808cd1b8a0cf67df08609058c90c0ebf1a3cf41a2f4221bef1c0bf043b1a13e1c8f69525d5d4ad1945e1b881121be5f130819e2eeec058bc0faa313cfeddf6ba5c43867d9b988f6b9780e8b03aa2d8a8d97953207f37e95cab65da56295e02b3cebb4237314d0379d3f2099d82a29004cd1c61a35faf87bd4856cc9891164a63b352bcff768c4dd960d17d7ba5e6dd63ca459f88ca509db71acef626f790649d55cbe8d8e5c9a28fe5a252014f1eda4bf6134aa086b64daeb1f3ae3aca45cd9f9c3ced2f2bb460d05c32a9b1ad96e5ef99fe56d6fd58208b51d5162935e9d978882d8d6cfea7ccf0df028c79ac99951811ead75e44826b18e005f4e74d01a5c0f28382dc521ee2474c11693c9edf7354f1284ced0f3170e532ac9c3e752e10675462bff0f03f3b4df072abbedfc4c63b21da58f86407a102e8df03d6cd1ba27493bc094c18dc4b20a892824c229ba57bf9da0afe18b3b836c6af38279ebcd7aa5ced377893a52ed503d01b85a810b8121cbc742aa6a2a751c2a782b9356300560697860e813d309124a2fb3b4d40477fa09ad2e77ebd9034b38b76a66323610eefb95391c0d4b4868cd0b78cc24f1fe110db2d31b4b6d39c48b75d8fc5a3ef4b69c9a97f42928e55ccf04577acb227fd555682d369c16ea2faab15dcc13169dc12cf77c4f70e3b3323d045ce1bebe928fdef5f8e4d14adf5f5897ad18820e04f7bd1fa3155200c1c4551359683e05760636acda7a82853f8169dac1ba1d9237c34fa20bb42c6a4a930105f73f427961f37345ca7888309256a5d1d77b3197856dec30a58416154463e90923abf0d2e7dfac353958253de71a1bbf4c05e16ef2209f18486e2906d28c0c09b8e96a9fa96aa8921f350d57ececa9610629e315988f3ebe9371f2c45bfe3c1762ebd0aa5b201d40f511f1480e7016fcb2c03e2133afea39702e50e508744f227a3683d8c8c81d28b5503b94c2f0b761fbb04e3d656c0dedb70b47419466c4248efbf3810047ca7e0a23afbdc169eaed9e9b35667036564f15bade693402d019841d8a9ef724fc93274a8460f6f9157dc525c2abe395ac9938395d87e4d58e2f1fad49afe36155b7404d2761202bf347f5e5f36690324a5135a5f218b63cf72911baf19e77e7f1e9ce1b4be06a63ea5245c813c23f3d47abe4245c9b4005362a354760f2a4cda09d37c1c6d73e4173bcc747124aedf32e5a682b14d6f9c2a226337a2d662799d8adc5ba2a483b7a92a11a7f42a0bd4d8f8faa6f9ad4c781902a3e3ffd66ccc70151d6e8eddab6248768e3fff4d8b4aca0b4b1faedc82648e90497d2b5145c35d7cf0a9d75e1e5bb1dfab8a91c1ab021c8ee43c906ca62c0850497d2b5145c35d7cf0a9d75e1e5bb1dfab8a91c1ab021c8ee43c906ca62c0851c3ab82a1c0cf28011a97dabbff2efdabc9fe66ff9f1cd42e18cbb8b4b1280dd00300b0409e083e0cc47f90766d6df71e860ee00a3571f05fb12ceca1e1bf1ad2c8d8e3842cda6832041292e54752f8c2050b9dd8fe99d72c8e2b89e26ab76dc2decc0512789c31ad1868c7a2de7b194e16c527f647369545ced1347ef497561049ff86e0e8c6f866041f625411d9f2cd7787d7fc90230c99e92553270b9f57529c1e49a92a0ba773409e74a679d8be4a72fdeab387508a4dab4a0fee607557803a4660bbefe44b928d9125808535b427b2be5a513052f1b19a52d61964022671d21984bc20be66dcbbc95e0b3c27e894f86037057d1d49a5ea8cce01eb498480c91517f6bb66ad7e41de86a32703eaddb1b8c73397e4678a642b5bf9d9c3e2600000000000000000000000000000045a9f4627dc72c8c269f3f5e4b17ffc78700000000000000000000000000000000000a29f135247155274ed21369f2a48a0000000000000000000000000000005e07fb3add4bba0e25f33370b74b55ef8900000000000000000000000000000000001296607b190d4aabf2bdaee61dd09000000000000000000000000000000094a98fbf2f5de6a559f38c4358d1aab382000000000000000000000000000000000004a91a2125c6c874a7c3423eb3d755000000000000000000000000000000b21f446f77f90dec73899de09e57bbdad200000000000000000000000000000000001261374c0b917a3e85153334e1e454000000000000000000000000000000d420dfe2d710f395ba79dd924a97bb0b1c0000000000000000000000000000000000126dbdaad2f93a9c3688295985c3c9000000000000000000000000000000b39d4633987415795442e98a50f6ec45a40000000000000000000000000000000000170016b4433e1f59b0e7d84e9e4dfa000000000000000000000000000000a2127750b34a11ab79bf655574716794b0000000000000000000000000000000000008ec5acccf8333b73a61c1345a1524000000000000000000000000000000d26f24735982d18e08c9d3a99f303212bd00000000000000000000000000000000001a3c23d405a844f8f6e19a57381dc60000000000000000000000000000008451e19699616019d92380eb2d8420d2ee00000000000000000000000000000000000ac0bec027e2a2858ad20059ae6d680000000000000000000000000000001de35051f958d6afb07b264608ce2aff1f000000000000000000000000000000000028202b968ef5ecb855c152311619030000000000000000000000000000007f44eb499cedbb1eaba7991504294eb156000000000000000000000000000000000004323b6ce0868f2ac27679e87f4e5700000000000000000000000000000012e5802d38804f0dbd28267dd13952169300000000000000000000000000000000000e933c9891ebc91473ab5705c31ca5000000000000000000000000000000eb7dcf81386379aff386aff9b7f121407500000000000000000000000000000000001a760d9daae52f72993e1e6a0ea48f00000000000000000000000000000090b31db3ba1a60c0f5ba489f240ca77b5200000000000000000000000000000000001b0544f32c7ca9e07b0d9bc90c8e1e00000000000000000000000000000082ee636c1db0826345c1d3f7eeeae345f0000000000000000000000000000000000023889b2126e69523ab8f16ae12617700000000000000000000000000000037b78425223c6b4cd8894e2e739b9e4eac0000000000000000000000000000000000202720448721747fa3d8e234b4de70000000000000000000000000000000e7ec91c265249d50d72302361adcacaa9f00000000000000000000000000000000000336004a962e49e37c5cad74aa4471000000000000000000000000000000a1d8c98cf683352a5fccebc8f45c0035d4000000000000000000000000000000000009e14c8fc1be401d458a9eed41bec2000000000000000000000000000000a61a704e2f30243041121e428a4b9a67da000000000000000000000000000000000001b2170cacdeff973b2e176981f01900000000000000000000000000000005f779ecdc75fda181472295cd421a6de9000000000000000000000000000000000011090fc6e32f205b5bd9cda723b521000000000000000000000000000000fadc7431289d1be24176da0ef1d457e15000000000000000000000000000000000000c0410ca9b25c9a9af0f62bca9c8bc0000000000000000000000000000002e04b974f43b75bb311e87578e3a3bced700000000000000000000000000000000002c711137704fa2652fcf240b0eddb6000000000000000000000000000000d1410f213d0222a5b47955981c2d19a8fd000000000000000000000000000000000018a162163e185a030c55448b2c479600000000000000000000000000000099e176164dea28e5fbb8f14dd22d0a473e0000000000000000000000000000000000290a8eb8f94ae9b62ab6ed25418cef0000000000000000000000000000002c87a3a4f9c7ca95f753e0b194a006382e00000000000000000000000000000000001f030a3512505e09637a0b2b000b7900000000000000000000000000000050c633ab2179ae1377cbf2463f0489295c000000000000000000000000000000000023ddfd9071e6951438edff6ced58320000000000000000000000000000004c3f65718294e7795e6997a1cf33989840000000000000000000000000000000000012dda72c6981b45f98eb8e9b8b8f900000000000000000000000000000001c5b90021d603bc89bc80b478558ace0e7000000000000000000000000000000000007eeca95bf426c83069b80152ffc1c0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000235e7cb22f1a5672832d9af5ebed897e924f02177b3300199b67763dd3ea8cfe1742c9c5c120669023c77612e0576ac15fa0805ac517c69fad77a51caab05ed50493274977c83233c66c166d099dccdab239769f20b9c6df3d86c3be42a2777e02a3394bbcf2b529074f4be86a95baac3d180a2851672b3e0f47773ac4eefd950e9e8b00da1bf1da46c78c72d58db40737dadb1142250cf1e8917a2d18a9f24315e5ae5abf9696cb58cafa905cbd974d59e45e48afc3de6117cb8ff21b7386a8103197f87a8b48b4816989013620510894e850d6be31f5bcf7759499f083474829112d2cd399e02f723b37c804de7044d43332dc3aa2863f7c5cfa75d90a321802761f9bae6ec051dd1852953555a14f9a91fd6fe134fe1d851576bf4219efe003535a5f9ad8e1570238742788e1cfffe5fe29a1f008c9b49c321e100e7311e923d6d865b80fa38114c22d91c61cd5ca2c88c8914e78e98e2007fbf2c58c74632dc5719550381cb6a125987e030d434328201219fbbe28107c5808f4654f1dd722350b17489d4d6033ccf5fe97b38dc5d0917c51e2c11cb7655b07d7a8a2613119b7b47e189dd3d1c228ff76bc57fc3e35335c694ef72db4d8327ad47ccf55932565b65b3d1154e4a95201f38bffcdd97f32e3d26bfbf44655f533640ba5c6eb00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000119ef26778c1b169b7f7c19f5d2d501b700000000000000000000000000000000000674132d7ddac9900a3c553f94479a000000000000000000000000000000a28e460c7231fdf544f5aa78b629d18d0f00000000000000000000000000000000001c05ba9269fc03632f01edff9ceebf000000000000000000000000000000ee0fb6f376dbda830a8826215829930dc900000000000000000000000000000000000449afe0470b69487f51f70f3d84300000000000000000000000000000006bf65c20df0821651196bf0fd4bda274a3000000000000000000000000000000000004b1350c393cd71cf0249b9c539941	0000000000008000000000000000000f00000000000000020000000000000001000000000000000000000000000000000000000000ffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000002b443f7b97f312dcceccaa4e3e400aa5a9053256635d9d7331b313fd8bd4ee38191020a651878caf46d087d35dfc60e1d2b9293809d6b5aa5450c7264160e9f422a9178230d3793b01e8798fc2257b03c577b711126f84d52aaca434ea1be3142a172183c5d5336f5e1c9b8ae825d2790860187ea066fc4c65b8e4d67919f89015ed3b22e7e32d06923474bd73c8c806e86b1d428ba00a7636bcc3fa997eb4bc0c089c1551e2969112be93f01b4ff5f38c0ab423b4c8a6f8c9c29245b4423fd414e655cdce5a36c4c3092ad84a23cde403ae680c2f11d10fa361444db06109f405046a800321e155303c48788a51f023f4672882b343a4c8123fa55ab497a00d2ff933d3e0f8fa346600210b2570b71aab1bca33e1fbec95ef160629ed6f2f981819fceda4a532f3d03e5b9ccbe606b93bfbf1c9fa507048a64c69f452f0953f297038fc5bf22705fc7489808d32c6178f79879699f6544ced88425ba42d7da613a2074243a32d484b3f59cc167dd75fde64eea59fa7cd7b055fa972c03bec31099d870f1175715b1f028bd1850bb40def3378e97240a171d8a1b227bf32731b22eb1d7c4d147e05bb49e9e3aa761b2b7d533e8896c7fa8879e09b52563b2c96284ed7766564ba8551366bb710a7319cf31fe65f0b8ebf018d5eb7f87c55fdcb0bca3d879b096868e2dc6022bfb4799799c435c9c8dead4be4a388b83ffc81b71ad6b0b5a83da84d2153b0a05f8ea219d9918520c72a39a04f07501bd0d8df9b1b88cbc4bc54d736bedb6f82acff2ab2a39e7ab68f0cc5ec06605c5f674690ba0faa3162c2a54e5d040c1284c15bfb1e18fd0ff24ff8861ef43a8b8028cebb160b61564dbd74d74b86f6bf8b61f0f14e54add2a5d5bee45b020ec4c3401e497b00c11feae33f0fe6b20588cb6a44766e47ef50a73ebd2153c3906d7e48f11cfe24289bc4bf823406c908ae3389a70b131e580d85ba1b597519e725ac841845b60203ce975fcaf256b712487a80ed41ff20086c0daf362ee68b65b602c74a813a0acb0fa68af7ebe4c111992ebd55510817b64b3b32c9be7abf5a62d2b6836af725287d2660008404ac2bbbf648337406d90daf410d63a9fbd744407fe3a2d0791e1832a543b117f42c26b9a732163b4d542e1174857487e78723f4db23d15a4224dac392ad7df86fbde2e91d5a43300d9b371b6fab682a183abbca2790f7977605d25b7d995e0811fd38e005598baf940ab777e3f4dd56eb5c334e5e534d648613c6d8e4f6edb40a90b4f8977cb3b6cfaccdf04180daf34c5a797724d854c31b1d3c75b5ad1734fa0dd5b23186c6b3922359480f8971a02f24acf163363956f42d7acd5cc4311c3b9ea045e4b06a8655857cfaaf5d05260a5282d7db53a6924913c57252e2efb7e1a84dbd16221afd2c18b973e122b66c98ef22170b29e30738226507bf9760b72c119e116375258d25bd7ab6955671e24cf82835cae5f394191beeb1d09046a6328ad88d42bc74840ccd6ea1eb9b680613031e19d67396f7e82b5e1f17f6ebf7684e5445a306e02606639d75a8c9cb7b3b783dcd3a52fc713d11111ba6772075806b6aa1c4ba71c94e9815ec62b7fcd4a0c1987a21f7e2133f25891729fc2704cb30635b04a3de404156d60d087b44495187c946663d511b1a1413c9f36223e711c87263791942a03dc61890ef469545504e060b8b6adc84cb19e50d958d412909743979f4347636649b5d9a2bbde399aad06122adb4118259159bacc20068c83f29064ea39689ef67fadb06fe8ca37ad7fade15a1b92f11102d265495da9c15d2665339c3fdb2f15658c33c4af09350a485bedd8cc1ed6a5c12e225d5c0052d3f077549f6968e292f934d355894d85fef09a170606127e9942d520acd029d98ad81ec9b4ff7f59a86da4a9ac24fad08a535387e27ee7727c71222cbc5b8b90cf75d304ec4c3f72d8db2c01dbf2ffa344c866f888dcd152019217f18b0d34916a363971c5bd26fbaf2f969a50ad31c04216948e899a8f3b5570479deefc7fd8f1d3b67a99033a7b8d3ca9d706c54f8046d97091f7c029f14dc2e09b431279878b8db7ec7e9dd40db9a4c2dc3dd7de19314c48e0b1112e0da82165be3e63c2d0715802d1954a73b90acfaa7af76bdb27150d1fd413a2570dcca1c3aa37f55775424ba308d8b3b1c2d90661b8248f8660ad61afc7eea0e04a65720070942eec073ddaf0ab221bd3255bc5490e1f9a1efdd28ee3dcdf574a213320000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000213b825e996cc8d600f363dca4481a54d6dd3da85900cd9f0a61fa02600851998151cb86205f2dc38a5651840c1a4b4928f3f3c98f77c2abd08336562986dc404	t	2026-03-26T07:06:15.318Z
35c1e838-ab0c-4482-9f47-fc0c2689def2	f72753be-1690-404d-9454-4deefdbeb118	000001c1000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000206a630d722bc3e989f738b463c047cff600000000000000000000000000000000000ce36b4de7defd0c069f56d0e47584000000000000000000000000000000dce252c4944c58b3c9c0a54b7e92a0686d000000000000000000000000000000000007493738d1662c242d0f5905619538000000000000000000000000000000cd6e6847c259c6ac8e65a7ab35257dc4f600000000000000000000000000000000000f4b1c928f359c6baf22e81ab0fa960000000000000000000000000000001e20ea44ff1bf1ba239907ad83f9caf42300000000000000000000000000000000002e1eded784b03f0d6c3326b1db68280000000000000000000000000000008547241a4322a77e325e8a1c776dd5fd26000000000000000000000000000000000027613b5afb44eb90e4d40a51753a7c000000000000000000000000000000f6e4663a916b017f4552c5daef232d6a6700000000000000000000000000000000002cb4eda8e92921da83d1be07ca706200000000000000000000000000000041a8522a6dbc4d4db707b185953cf5cfc80000000000000000000000000000000000121419bd7f459e549f28e8d29f88e7000000000000000000000000000000711a8423c3e517489298b5b4d1608c9a3f000000000000000000000000000000000003604a03bddf33542136a3d38c148900000000000000000000000000000041a8522a6dbc4d4db707b185953cf5cfc80000000000000000000000000000000000121419bd7f459e549f28e8d29f88e7000000000000000000000000000000711a8423c3e517489298b5b4d1608c9a3f000000000000000000000000000000000003604a03bddf33542136a3d38c1489000000000000000000000000000000efe9a8360a7e638c8996c44955b09e8e6a000000000000000000000000000000000024789dbe051bc4df1d4e6775df95fa000000000000000000000000000000df4e23ad1ea96f67a91f5ccce7d91e301c000000000000000000000000000000000021b28a52b5866194a0c34639ba36a3000000000000000000000000000000bce231872e295f935fde0c490e40643934000000000000000000000000000000000014af8d363579483b08aac2fe81cf2e000000000000000000000000000000f0663c1fc39a972c3a328256e323c3b8590000000000000000000000000000000000302edeb20dd7a7ccbd97386d0ab8b100000000000000000000000000000030cb360b3516109620f1239d1bddcd15fa00000000000000000000000000000000002c46285ca1dc0a46a15702bc605d8e000000000000000000000000000000e3245bfaedc2c5d3f5de441ef1594bcd0e00000000000000000000000000000000002144197d0eea803cc2c7527335bf840d68f6df49957e89303379c5f5a0d61e98c28546f688846cd57c86deab9a011e22fb5793979c21a0881ccbf08be0823e8f7163018330ec246e656eb54465fee3246508bcdcfbd857715873ed1008a6602ff7d25b5274c54a44c4267c034a2ffb04f2957bea297cb870fb1dbb73927e387f667e619d9214ab0c3515427cec15c41f991e84bdf33847f347e1281c540d9b7ee9cd123040890cbc7c523596ce00b52beb9fa45e28eebc5ef86c9c11e4e0b27e475494ccbc1a2f013e05fd450decad07dfdcbfeb516ff67a619929243202b4614a0958601ce679e71cff18d85806ae11af48ea6118ef457eb12343f93106c1f5ae41ae524b088b97a7f64a9c0cdbf808771e1a0bad3ee2c0f0c49d7f0f442f1a390266338560a145b8a3878564f5f60996eb3f42993d368c7628c5bf00b90d9864419647e0022979ce98da55b7161124fdb28bee2bb59d0106f23c2995f42c104470de5e2adac8785726de332360ab06e62f2e7b244c6d636814fc542b8dc04445c9e0f9d2e15d3a8892e08036991022a97cc170b10237d5bcc16e55ff5a142d52d7dd8ab7b4b2fe3c4385dd2db7942fde6ac2edb4418dbea56589632f26ea8a9a76161504e95ef997334c08f9dd35303c735c20b403eae56407d3ef724c3491f7ec7b90d916d24626439eee2cfc6d2cbfa036a22387d853b7717bbfefb6611af6f2db40c7e3bda234b085763132820504f5bf216d28c5e1604761fb50a86281ceca2b687b82383cca0beef00f5def0c8e45ae524b87c89a8c81a0cf3ea4e769cb55792e886743dfff18e13a1b64c6165ca672bbf9e15340a780e28ee31824ade2e868cd619a1b33d52362ea18f5be006dd2870164f33fedba2a4fbac6b4c5bfb613745640cfea5a7839bea9f667c007def683287becf08798ec69c3273540cfd914eaffae70d47300faeb640ba5a8177aa3cbaa2c4f8c206a895eaa8a6a5304b93fc5bd922a32398b66198fc555710966881dac4862cefb6abd763e7686fa7e98f07e48eab78b4dd6014829e215110a07d5248a0c3907aad6e254f61064e3626f98a35eb944e6bc39852cc415568a2e3635c36d38eeab44900377b8f32fc096562539d0059c9162a55dadde194af717ecf4aba1a68c8f6b28ffae14eb6a5b5a931c67872e429e69592eae6d6ac8be239a067f69e5005416634b6848958c014272b38f08b8725bfb446776680a55e730513bb4c02f7f9fdc7b6af4f4c36e52a5f4d6176c8fa891a46430cce7e471d02f2f2932cc4d2c4dd12f554fe9b078c49a25d6122c71bee8a2692adb42351e5a246ea1fac6f2cede0835df0a59275f3e2e2156aaefcdf0c8082ac7d1a24908a403b628f8481b1befc0a6f304fdfbdbe983b726abf10d7377499084496b976eb51e5b5a673e6bdb7e0c7032cf09fb23c4876eb8cb9208e7b63d5a0b723d07f24c2d2978816150e335f7d3f0e8897b256314ee6bc2c73d7e3ed69f779f343c511118068101b50ba61c2d373cf4b0a5835691a2d619cad1614f9519e023cf9adf1f1ccafb18cab03c113deaf5faf4bef51d0d7fbfc09fe0a5e1633908f6bc11cb042f558af8afacd80b0a3fb4ca1bb33cc4ce4b52bcdb1f9bce347ea49e001408da09c7a99acc738f901c2c9d972cc725ee559c41291e4f9e7dd0f31ac9ce5ff2880c5fd4d7ed5e7ddee8f1d7a3434e5b01ea19e9506831c1439c3a231893600e9b2af33fafe10b5d10673cec4575ca992277856a2d8a61abfb3b6d7cc9dd10962d2d8b8ec389ae82be14d2e3913c80ea56a992d104c250f93962bac3fed56bfa050976ffc50ade798a7bd555da2495064a7d1779419619548d615a8fe612628a1c1f9b66b6982636f9781cb7ddd269b11790eb044f310f795f60149f3be2fa279501961e934bf7aca61b7d78f1ee7f3a42222b524ecf77133d932b094b3c7ce8832576789574349b18f0d085f0ff29acf65e2f89b8089a461ad8aaf960e9f321f21141e3ef79de21e019ae02dc37bea497ce9103b4a267cb90a1ceba0559d990ac0e7327cc6699abc23f823a3beaa8d10bcf6474d909ca9f8c9e29ddfd71279e2814e7474440178dc7d58ddc422e6e27b3e79c1fc5bcc85e5ff075a2d4603a21f52311905905c6976229330bd55c62334f631846ab553047da909b5eadd278636a1d834eb1083ace3210cb6dff9c01419d48dafdc357825250a47672600d09c8161ea07b90ad824eface12546d31478d4be6d91f249e3c5313216a2004560b2a1c08139debcfbbbe4418e0558b76490845fcd6d3d131153e6b356714c11b1950e5159a615c034a7211dbc2b0b542f240c90f57cf3eb26686fb4efdb26428e7c2f52b34a3fce4291bbcf7cfdf259103049d5e5553d5d727d178c7033fce44b8daa12758815edc3702dca68c44c940a30c4992fe8b89488860c2a76261daefb0a8511a3da8556fbc3a56944bf0a632d58a4aed365583cef24945280934c512ba8a9c070a6bb0bf2555f8d5d34d7fd910ca05a4cd3c8ac326693657e9a5d9afa018291156c4c3f1bcba577d869be331769a646583ce461b622a2007196c7b8a1cfd1111e4524d68b4c1047459deb5ce63f62fbe9d1d1736dd2701cb43a7a8c06a60ea15f00ad356b92ffdf590fcea605e4accf350e4d5740ff48d533efb3bd6cefb1506c88b22264a263ed1cb28b95c0fd65f873462ba79b9cb63472012ef2f42e3a0279eb9b812145e40c3a5d532acc58eec0804f2eeeabe34246668213b298ef21406754638bfc48d9fea6cd4390b031032e777d15a504f99223dfbe545f46a8e161f6d0d9489e9031c0038d8b36916b5fb950c21ab26b956be9eefe00ceea1d724226f42579024109a0439c16896f11383894e1e2c80c52057cf21adbf3c712c940d579fd7ab97ce213331a3b77ce2a534bf1e7d6ba6fa132cbbfbbfa0eefcd5ba12ac1c03c542f90efa66a47b3fd46f535ebb5cd400a767c6242b7826a2159ef92470c5bb90e4a2af9b6fe126ef03f710bcd3c0374fd2f571c1f5165f2fec03d82fc725e022487242b15b1ec3289554c6311f6e096e63761b1fdd259da1cc09f9196381e0bbf1b3c1dfb4c3c06ae8cbd0d1c3d0c2e061373dbc5489ff1ef6865c29ada34a4577dbe9ac451f85693cf532ac968639cc717c0e26a23b09671dd83f01bcedbd14f3e5e9a901c55bf228859ab5bdfa014fe5fc4f0e43dee04671bb92277f0a18854d375e9e10f24072e4076e7816ddee864f5f9614248370c889970221b19f045044965767d147e5daffbd3c59f6e4e706bf22e7e31b8176a3d9af04264ccb36a69ec8d024f19c88cf80c78f59778d2884dbaeacdc3c9adc54efdd680d168ebc2f34e01089b92d794abe3e3e27fb5405210d7637225cc070dea88307182a261116b4a6106822e627ae2e10154774450919df58dbe402bcdea77c6d762e62c3cda52c7ab15c2c49747d28c0e994367e6a0fa0e628864d56a983d924f61d5c3dbb2cc81cfb8cb29830bdfa67850f909d24294dccb8eea11d37f70317bc2b8fd1d610940d87f234611e538b0340ae2ef642fd8618344e1b1513137fe69028daa6f6dbb3d0e3b926ee092c3025bc0cca9d11d5ed09e150637b666228edfe2c823bfb2296f37b6949ccdc88d844a672574250806228685377f7d9d25f4ce61b223ae4e849507a24ffd8a18c914ff72a1ecf74d9f4efa1e095de22215ea7661c4c6b898bf1509370e8d416f381fa57ad4be46351a2ef6a23bef49292aa9a3d0a03c1b21d0a3d2aeeab2c2484cd2b93b39c08f0c9fd80fd58fa4a8148ecc76e267bd6fef1d1ec08a2033de4126395025793b6851e750dbe1a844d3bb2ca2c220bf7d0d04b99331d360cf0198f68c8b0732eb4e68095e16b94ddf8a20b7cc3541865707fa34e7d6f07ea738c123a5eb955deebe54d2fa6097ee00597059cdb471dd4ebd131e068c97a60b76e14299aeb7244278553ce56b9a274132055a606502924d7ea43466680c00110a2b3ed045a80a6c6ec6db841bbaa56e06e51a5673119551b60b3d97a2f37e6452999f5dc31c0f38253e9983b63bd076c974d1c723d2e255b656164ca6f72b5020794b47e7aa003624521cb327c84b797aab4ba2fe01aecf2783ffb89a328272cc496b6e5efd291f1fd27b298bc4a0e1276bb2c227729362e8c7afa1dcb3ec6b1a6d5e2e389afd60c5ab586f3d79d45a32edd33850f00dd50f67605de9c06cba200d5058ceb56636a8a293acbd9d8c0ad61fd7a3c86255312a094fe5c4f4dfcfb61a8a1f2ff6f1c81a6e786272feb7f92d4744e327105d8db45956139ebe96c090b4ed0eebf26fe12572d361f3d1419cc203546a5a30da44f01a08ccef90dbc65ac57335be3c46735a2992fbe8e8c142f7aca2d57d816535ac0d5a456f69ce032f33d68ce03c8204a2da6a869d45674d31b6341f459155451b7d85191451e2dc934f4a4061747d13304dc2f4226de40b22a32a10d4d1b7cb67dd66714603619dc5b8546e86cf6d8cc58cc7e10920b0fcf561d611efd07cdb35daf3a049a62b04ebf52d3867389abdcc8210621950bc758b155764e6c27be0acdd078c758ad370e8fd6eb412566b1766e34f776e7aa20a8ecdb96484c2d6db557c96bcc9c3f3f956e59bc03f39b44e3e214c317d8538e6ad4d612f5af175b6fd058d61e3aae54fef6ce75e6cba28d844e883cf970cf7b8d2963a5d2002853809843a9a7fb16e6e48ab028ad3c5c56cc80020f3f3cbdae3c442482fcbc295a9c922d4e0853e78992b8937887232196905c778e058b6dddd8df21e5c125279f1991a2dbb3bc4c317751bb72b9b5fd359310bb8912a2581508e2601a658e2299cc5bec5a1b8457b7f4438238ae3c8f6350caae168faa16b54eefac5f784a2795a91ae7e0a6b02467b217fa2b2dd70ecc50192ed11cbadb3a9f43c90ff03f00285de1c5a6280dda364af3a9cdf32262da15da5cb1782ca4e440050f16c3280ce3a5546061b544fee5a5b05715ccd62a7b5f152cdb0508e877dc8e0043338c197eca49b0bf4684c2cf64c540ae14ccf03b1e55feae8ca96651af58e6e0333b14f4b84adcce4547a7125a50910856fe309e50e7ba7e424b19295cd7433a74af266cfa4e1da097de07b0a8774c4710b7334bc2313ed44ea7200747cff52f270021c7d2170c9c6bd4150671f5d97206c3c44e814d52abc56373a8fe2551720a9313d2d4df6ad03b8f3423f14b97bb9817abc9016a36597146799d64246f59fb7c1667f81ee64b85907cc56f758fc32d919a53007698780448fc67007717a511510ded913918e9fd019140c61ee2b327f31b9e472090798dc5375e1fb83800e3b90acd690cb5c5cfc6f44887e45266df58a70f099cb40875e91aa3e2e17247d3e913cd90652ff5f540775053b0d95480fda9330c8cb1436bef186a83c7de4b96c800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000096f40aaa0249798cb381158bb1a1070a692cb197120917ede06b45789ccaa7903abdd960fb32564022b7e753aeb74c08da1a6197c6b669298b6ae40f3c87a50264360be761f905760edbcb81de87f4678c59b88d5b5a98cc9a99484ef66a12c213be0f9812db648a3d9b1f8ccdb0f0776dddccaf14d4bb749325e8079a70c6b05e2c80d82ffb93904b3c8f0f630e38f4f24bc9a182b19d77b644f207f6a6e142947e53a096c1b9b4d214687ca9bafd0921828b7ab1bc716bb410a28a3ad63212741905d7afceadc12a2435125a6b2a97ec350f86e5432d6c4db31cfefe834ff1d229b8063d06a7039d700472298ad6ae6fb959528fd69c371c33c7eb5adcbff041384491a926765659116435193bd20cb661731d5dd7b93ad7683091c4254bc1ec0f06965581c804dbff92b4339e0ff1817fa72aed2286ec468308c64e9b54c2bb349e6e480c12e8d33d59a39b1760c41a81476f61d660cd510b36fe525c5b9155e8c280f77d45217b6253212501ce6fc07f36f790dad6cfdda12941c227afc0f34967e0dbb5647cd542cfcbb3fe56ddeb15446b82d76a89fe8a1b7dda376030e4ea5c99c83a22a0486b2a61a7f77b49fd50a59965d9e3b6668daf182eb84911f11a276bd4e64c7a81ec0b3a79892551d65bad0245f49455d87ba9e924a6b7b19a3601280142f5c3de499a011264e24275e29575384ad96c10943b222d0e723201eda24b49e9eec633abdc78b33359b7239759ade71f6b505e9789bc00d95b9022ea7b3a5d54415379bada53796e9682172a4c70c7f560d4f49f8bd1c6949c32cdba06243a06ce4cefbdcaeea66d266cfcc00e8e1d5301c01268875497cfc7a23ad82f2b02cae1d40b1de3c8afb76ce9423219f32ca95ba9cf4abc88e668a171e63554d53bbce8e7c38e7cd36acdca0ee40ccf037fa0f706a93669c3fbaa5f825b63d1b7b6f22a37361e95c7ee30e26cba3ad636aa0a2e3293b8b64645b64651c0fdd3c8db989b83b54c19e22c832a85f0fd44555fb5dede8e4fdafa142066f0f31ea8ba7065e9203dfd44e1274ca52b562f0544a217aeb8c3c7aca217f929527a043baf21d95b7a7bfc07a8052323c67139fc6f055b5a92a87e39d71022d4824860e87cba4dece65b4b99d97db66a6f64fcef4cb3b00aa230aa52dcd7fd7db11748aa2bba0d53f598dc05730c2b02f25ec1b5a632b7fea2053f9a8a82767492ab26ae9adb615f0c08d2230cdd1b2b23cae3f215bfeae754ad59778e8e5bafe203f1a0ad86d599e58f0b771121c3a841386f839288df6ffebecd8bb4851cd241360631ea5524d49909452a19b33c00c271888e4a4f49e35052ab63e3de6bfa5061cb4e0eb9a09878b32ee27d1abfdc14342a1f70a7bd07e42f62cf69561fccf247eb9490c02ec6aa34f14ef767d2868c01c87518a4dca0ca5423d8364eee5671abd2fea12441671b8701f4ef2772049112441dffaa670386ea424dc3647f7712861dee8e05b3502574d1868c9c00251338390bab4a0dec69674a78d2c8c06f82861dee8e05b3502574d1868c9c00251338390bab4a0dec69674a78d2c8c06f816742e48458928cd8bc2134ca26d296e17c1ee67f87a834b2b0dcd931319cd2421cdc776d7accf6b9d42fac13c466c5edde912b4f76f5feb0a3b9b5590ec41e8221bf0ad534a0c235445329d3eb7f9050c51a15d0b89353a2a20a5abdd09f6b100c151b3a5086fd56823bc6324ce7d52d2600d504883236a8085452113d349c42f8fa5355630d5afd2970ee313f673edf38622ec280af7b1c85d46cfa24d4d9a02def3d4a8680c5775295d4ea869098297db8d0dac7208c592b8d1abb4b399002b2f729bee7fbd498b0aa1ae1a59ceb85be9614e0569a263c7535514eaa522a521270a45b1760e069448b187f21afca81a6af883727c6473ba9d37ffa3ae7fbd1b955dbab9a22b2d68aed910a105871260db05153fa2ebf96b9e31ab167dc44e000000000000000000000000000000ec83336a9f2f19d63656bb1d5316fdb50800000000000000000000000000000000002238d32f947718757b1f0786201ee80000000000000000000000000000001393cf975d0c85143aa003fe6e9b3c75650000000000000000000000000000000000063676ae7353f66cf47c21aec245c00000000000000000000000000000003800b2ee085d20be228529d1269ad2e378000000000000000000000000000000000023a7f36982d78bae7fee69d4f2a43f0000000000000000000000000000002183d301a254c0098b16fa6df218c104a20000000000000000000000000000000000296da6ced5af8da2260a257aeba5880000000000000000000000000000001805d8a06dabf2fe0957228ac1ae37a72600000000000000000000000000000000002175a763fc89b5c5ace67008ac2714000000000000000000000000000000b55339bb1d592f3985589b8090c37364b20000000000000000000000000000000000306345a3951428360cf47a8bd9423a000000000000000000000000000000dca5a48273b9d0dc691e136856126fed7d00000000000000000000000000000000001a1ddf5b4ca21d998a36ad5143571e000000000000000000000000000000f9555c37410df5c1cb78ab47f065d25a1d00000000000000000000000000000000002c44415e625a9f94dc2e33e48436b9000000000000000000000000000000ca9fa5b41dbd89b928b2e9063c4699229400000000000000000000000000000000001fa04533988ca3aba066e9ce52d67f000000000000000000000000000000e3ca2b12a860c60e1f2c2bb830bad766ff0000000000000000000000000000000000271b80bd3550b92ce7d383f32de931000000000000000000000000000000496c8caff55b250fcb0e77bba5839e0b26000000000000000000000000000000000018212a55d2aed2b472899232ab29ff000000000000000000000000000000b5c2b395971dada2121bbf68931bc1e1790000000000000000000000000000000000243e0adabb52b0df1efde1a8e0d4bb0000000000000000000000000000004f2f6da7fe1f104b6913d90d26bd6cc55c00000000000000000000000000000000002cfd862bef82516f82bd314e25c588000000000000000000000000000000d0a7baa7c4ce93cf9c5e2858b53444c96400000000000000000000000000000000001d5e19f78f34ae39194612ecab51ad00000000000000000000000000000065957d163b5127faea40406d297c92e12e00000000000000000000000000000000000c454b13b8a549dcea4aeabc1414160000000000000000000000000000006c6a77ff2a03fb3c2a71f64de51357a279000000000000000000000000000000000027aafcde4b27bff00b745672d7c6f2000000000000000000000000000000a12a5ec8d7aa8ed2868fdbc487a3b15859000000000000000000000000000000000001ebcbc67b716b7af615948607aece0000000000000000000000000000003b5b2f0d22b5b99621a587a6e271de250e000000000000000000000000000000000014a2c0e5e2e56aac686b5dcdf5e208000000000000000000000000000000626f32c6b9927a6381a91e95960338b5b5000000000000000000000000000000000028de1cb6cce79cce08c5ff6f61850d000000000000000000000000000000dacbb8c4ebfe137c0a55aceab582b70476000000000000000000000000000000000020df361a72caa3c655145b7d3a12b40000000000000000000000000000008e1ee2898e9524e330f0bbb8d7abdea69100000000000000000000000000000000000d9e7ddc0fb27e85664b84618587da000000000000000000000000000000a58e222764bde1fb82b37d81d1f62708fb000000000000000000000000000000000029abf68cf2dae661fe352551d921f600000000000000000000000000000025c31f095a0b79680f1a342fbc78c4e8340000000000000000000000000000000000019cf7c93792e274105ae43f95ca180000000000000000000000000000009984c1630ffe179f7e88ba83389ef9867b0000000000000000000000000000000000065e3893ef2d9e84ec251de51b952000000000000000000000000000000025fafb8a89b71e5a38d50505077050ca15000000000000000000000000000000000009db0ba51c835c62f60d7f9ec2870e000000000000000000000000000000823d82f01b3478a29b5d1f8efab907b946000000000000000000000000000000000013095b5a309d86d975f2b3a56a608e00000000000000000000000000000039e65d9845992bad5c69bb920c63700f1100000000000000000000000000000000002d34f874182653df60daef22b3ecda00000000000000000000000000000052d52738b9470249432a9a844d3e58a54a00000000000000000000000000000000000f79dc3156b7dd04a30397059d2dca0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000120d2e7b2ad2946e531cf784b595049fc718602a85b722079fa08a62d4190f0a02300f9bf7288f01d4e5a7311863e0dad65a13f281e923a20d2f370a8d78543826c5221879ac58c35b796131ca96282026a1d8fc18a928f2b461523dd7f45bc41c2371132dbb7f92f3f9f10fae94c0407fbf80599a603e8e3fd0466401433f1a143aba3728d2e2e369298cb73d46d681764d8bade054265b00ff5a1967b020971e08b38d704c03d5cdeed24a0376a29772b20d78a876b850bfcf33f0d1783fd604a43db9e7687ab53ea2b6e4641f8d10bd786dd1853d61313f29238e06876cc51fe5cf2e11c74e8bdad1db916ee7b87ea8254f9e67f8eeaf3e8fe89d746c8a2f0529de6bd45242e7ed65261f2ffed1d0622be4dcb70d5aaf28ad7dad27f06530023471d858d5797c29c5b37d150f3a5e9854b95cacb04ba3541d7f50dc4dcf4f25690ec42f095171435865c3538b3d32f2739b00d4d1d816810c1ffded25e31c1cd33fbf89a0644781d4924b1667b8137462a43de9801d09487d541da997ffa11d4f5d87bb59dfa0265c1e29fe121a562e2ee9428a1eb0d956d271b466ae8202204d36e0bb9398413959cbaf9b6d6510900e9d53188a4c014ba171c418adb2c60a04ad0024048b67081ffc5e5b7c07eaf0a67572a5a13f06827c4c69ddbc669000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006335a28c26151400d759be6e811c0debfc000000000000000000000000000000000028940c64c025266a4daea4935d98c30000000000000000000000000000005611d266e108f6cf603d4482126be59bb500000000000000000000000000000000001a533b702e532e4c5bf0f5d3c846b20000000000000000000000000000009553eed90523e4a39eb0e5a54fc5f1ea7200000000000000000000000000000000001500bf1ee0abc91190dc91f1abc969000000000000000000000000000000201734d2dbd1ddb6842278fcd5a5df9099000000000000000000000000000000000028761234290b341b5569457b3bd8fb	0000000000008000000000000000000f00000000000000020000000000000001000000000000000000000000000000000000000000ffffffff000000000000000000000000000000000000000000000000000000000000000000000000000000002b443f7b97f312dcceccaa4e3e400aa5a9053256635d9d7331b313fd8bd4ee38191020a651878caf46d087d35dfc60e1d2b9293809d6b5aa5450c7264160e9f422a9178230d3793b01e8798fc2257b03c577b711126f84d52aaca434ea1be3142a172183c5d5336f5e1c9b8ae825d2790860187ea066fc4c65b8e4d67919f89015ed3b22e7e32d06923474bd73c8c806e86b1d428ba00a7636bcc3fa997eb4bc0c089c1551e2969112be93f01b4ff5f38c0ab423b4c8a6f8c9c29245b4423fd414e655cdce5a36c4c3092ad84a23cde403ae680c2f11d10fa361444db06109f405046a800321e155303c48788a51f023f4672882b343a4c8123fa55ab497a00d2ff933d3e0f8fa346600210b2570b71aab1bca33e1fbec95ef160629ed6f2f981819fceda4a532f3d03e5b9ccbe606b93bfbf1c9fa507048a64c69f452f0953f297038fc5bf22705fc7489808d32c6178f79879699f6544ced88425ba42d7da613a2074243a32d484b3f59cc167dd75fde64eea59fa7cd7b055fa972c03bec31099d870f1175715b1f028bd1850bb40def3378e97240a171d8a1b227bf32731b22eb1d7c4d147e05bb49e9e3aa761b2b7d533e8896c7fa8879e09b52563b2c96284ed7766564ba8551366bb710a7319cf31fe65f0b8ebf018d5eb7f87c55fdcb0bca3d879b096868e2dc6022bfb4799799c435c9c8dead4be4a388b83ffc81b71ad6b0b5a83da84d2153b0a05f8ea219d9918520c72a39a04f07501bd0d8df9b1b88cbc4bc54d736bedb6f82acff2ab2a39e7ab68f0cc5ec06605c5f674690ba0faa3162c2a54e5d040c1284c15bfb1e18fd0ff24ff8861ef43a8b8028cebb160b61564dbd74d74b86f6bf8b61f0f14e54add2a5d5bee45b020ec4c3401e497b00c11feae33f0fe6b20588cb6a44766e47ef50a73ebd2153c3906d7e48f11cfe24289bc4bf823406c908ae3389a70b131e580d85ba1b597519e725ac841845b60203ce975fcaf256b712487a80ed41ff20086c0daf362ee68b65b602c74a813a0acb0fa68af7ebe4c111992ebd55510817b64b3b32c9be7abf5a62d2b6836af725287d2660008404ac2bbbf648337406d90daf410d63a9fbd744407fe3a2d0791e1832a543b117f42c26b9a732163b4d542e1174857487e78723f4db23d15a4224dac392ad7df86fbde2e91d5a43300d9b371b6fab682a183abbca2790f7977605d25b7d995e0811fd38e005598baf940ab777e3f4dd56eb5c334e5e534d648613c6d8e4f6edb40a90b4f8977cb3b6cfaccdf04180daf34c5a797724d854c31b1d3c75b5ad1734fa0dd5b23186c6b3922359480f8971a02f24acf163363956f42d7acd5cc4311c3b9ea045e4b06a8655857cfaaf5d05260a5282d7db53a6924913c57252e2efb7e1a84dbd16221afd2c18b973e122b66c98ef22170b29e30738226507bf9760b72c119e116375258d25bd7ab6955671e24cf82835cae5f394191beeb1d09046a6328ad88d42bc74840ccd6ea1eb9b680613031e19d67396f7e82b5e1f17f6ebf7684e5445a306e02606639d75a8c9cb7b3b783dcd3a52fc713d11111ba6772075806b6aa1c4ba71c94e9815ec62b7fcd4a0c1987a21f7e2133f25891729fc2704cb30635b04a3de404156d60d087b44495187c946663d511b1a1413c9f36223e711c87263791942a03dc61890ef469545504e060b8b6adc84cb19e50d958d412909743979f4347636649b5d9a2bbde399aad06122adb4118259159bacc20068c83f29064ea39689ef67fadb06fe8ca37ad7fade15a1b92f11102d265495da9c15d2665339c3fdb2f15658c33c4af09350a485bedd8cc1ed6a5c12e225d5c0052d3f077549f6968e292f934d355894d85fef09a170606127e9942d520acd029d98ad81ec9b4ff7f59a86da4a9ac24fad08a535387e27ee7727c71222cbc5b8b90cf75d304ec4c3f72d8db2c01dbf2ffa344c866f888dcd152019217f18b0d34916a363971c5bd26fbaf2f969a50ad31c04216948e899a8f3b5570479deefc7fd8f1d3b67a99033a7b8d3ca9d706c54f8046d97091f7c029f14dc2e09b431279878b8db7ec7e9dd40db9a4c2dc3dd7de19314c48e0b1112e0da82165be3e63c2d0715802d1954a73b90acfaa7af76bdb27150d1fd413a2570dcca1c3aa37f55775424ba308d8b3b1c2d90661b8248f8660ad61afc7eea0e04a65720070942eec073ddaf0ab221bd3255bc5490e1f9a1efdd28ee3dcdf574a213320000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000213b825e996cc8d600f363dca4481a54d6dd3da85900cd9f0a61fa02600851998151cb86205f2dc38a5651840c1a4b4928f3f3c98f77c2abd08336562986dc404	t	2026-03-26T07:06:43.927Z
15dfb834-210e-4708-8e40-01fac46dc49d	b578f855-1249-4f1b-9e7d-e89cfd74dae0INSERT01	deadbeef	deadbeef	t	2024-12-29T00:00:00Z
1abac20a-6874-46c6-8931-6b164b0a1f06	aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee	deadbeef	deadbeef	t	2024-12-29T00:00:00Z
\.


--
-- Data for Name: proof_usage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proof_usage (id, tenant_id, billing_month, proof_count, last_reset_at, updated_at) FROM stdin;
7e28528e-cfda-49d4-969b-c7fff26f1738	7c107aab-53a4-479b-8930-9ff801b93ba0	2026-03	2	\N	2026-03-26T07:06:43.976Z
\.


--
-- Data for Name: safe_agreements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.safe_agreements (id, company_id, stakeholder_id, investment_amount, valuation_cap, discount_rate, safe_type, status, issue_date, conversion_date, notes) FROM stdin;
fbb6e6f8-842c-4568-9652-eb6314a43568	f0614545-ea45-42b2-8cb9-aa880c576ace	1b0d772a-a6e3-4ef6-9f87-27c3011d7d91	500000.00	10000000.00	20.00	post-money	signed	2024-06-01	\N	YC standard SAFE agreement
6918271c-2da0-4f97-8afb-f8f7fc9c8f7d	f0614545-ea45-42b2-8cb9-aa880c576ace	97562a09-11c4-4502-9da7-a41791a33c36	250000.00	8000000.00	\N	post-money	signed	2024-04-15	\N	Early bridge SAFE
16114bea-55c4-454c-8649-7cca2974d4c3	f0614545-ea45-42b2-8cb9-aa880c576ace	7c317ccd-1e51-4cfa-a32e-11c36b2770d2	150000.00	12000000.00	15.00	pre-money	draft	2025-12-01	\N	Pending bridge round SAFE
\.


--
-- Data for Name: sars; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sars (id, company_id, stakeholder_id, grant_name, grant_date, units, base_price, settlement_type, underlying_share_class, vesting_schedule, cliff_months, vesting_months, expiration_date, exercise_date, exercise_price, exercised_units, payout_amount, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: securities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.securities (id, company_id, stakeholder_id, share_class_id, certificate_id, shares, price_per_share, issue_date, status, vesting_schedule, notes) FROM stdin;
7a1cb29e-8be9-43b6-8e25-7b66de2349a1	f0614545-ea45-42b2-8cb9-aa880c576ace	7d3e97b7-a459-48d1-9219-1067574dbc30	6cfa5747-bbb6-4fbd-8210-72a3bc8ee141	CS-001	3000000	0.0001	2024-01-15	active	4-year, 1-year cliff	Founder shares with 4-year vesting, 1-year cliff
7f1e4c61-0e85-4143-b349-657227bc480d	f0614545-ea45-42b2-8cb9-aa880c576ace	47c08400-7500-4c75-9b0e-115f92da7184	6cfa5747-bbb6-4fbd-8210-72a3bc8ee141	CS-002	2500000	0.0001	2024-01-15	active	4-year, 1-year cliff	Founder shares with 4-year vesting, 1-year cliff
79f99cc1-558c-4c67-944c-1ed89d48dc49	f0614545-ea45-42b2-8cb9-aa880c576ace	97562a09-11c4-4502-9da7-a41791a33c36	8ab126fe-8f51-42f9-aaab-817b9ccde482	SA-001	800000	1.2500	2025-03-15	active	\N	Series A lead investor
0aeadaea-c785-487b-a6e2-1384c1e1dc77	f0614545-ea45-42b2-8cb9-aa880c576ace	7c317ccd-1e51-4cfa-a32e-11c36b2770d2	8ab126fe-8f51-42f9-aaab-817b9ccde482	SA-002	400000	1.2500	2025-03-15	active	\N	\N
2bd1697f-c280-4067-8707-82bbfd7f4d53	f0614545-ea45-42b2-8cb9-aa880c576ace	e2987c46-2d03-484d-9659-73e62b2db442	2daf741f-997d-4026-b098-2d9e6a75ab60	OPT-001	150000	0.5000	2024-09-01	active	4-year, 1-year cliff	\N
e9daf110-db01-4089-8d1f-d7e362474aa0	f0614545-ea45-42b2-8cb9-aa880c576ace	618951d8-cd52-425e-863a-946d4015f8c5	2daf741f-997d-4026-b098-2d9e6a75ab60	OPT-003	50000	0.5000	2025-01-15	active	2-year, no cliff	\N
3fea44ec-b9a4-48c2-a7f1-fb37636069f7	f0614545-ea45-42b2-8cb9-aa880c576ace	9ca87318-d689-4e2a-b9a5-0433a6e2f89d	2daf741f-997d-4026-b098-2d9e6a75ab60	OPT-002	100000	0.5000	2024-11-01	active	4-year, 1-year cliff	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
k1D2swEgwngBnKGbqkhZTmyw-FHdYpQG	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-17T03:36:55.030Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"pendingMfaUserId":"e5e98577-2262-48c2-8ecf-120f1e533bc6","pendingMfaEmail":"abc17@gmail.com"}	2026-04-17 03:36:56
hSLmPO719QIsySD3vmGO3o5Sus27LiN3	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-17T03:37:01.631Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"pendingMfaUserId":"e5e98577-2262-48c2-8ecf-120f1e533bc6","pendingMfaEmail":"abc17@gmail.com"}	2026-04-17 03:37:03
3Bv5RN21vE0J0Mlll5wIjLIiaW24zpmU	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-17T05:32:33.585Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":"e5e98577-2262-48c2-8ecf-120f1e533bc6"}}	2026-04-17 05:32:45
YBKFW80XJteEe4z9AJP0ppBdLv6iBo5h	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-17T03:38:38.670Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":"e5e98577-2262-48c2-8ecf-120f1e533bc6"}}	2026-04-17 03:39:09
56775qV5eVYaucImlFC2X5HnsIhOGq80	{"cookie": {"path": "/", "secure": false, "expires": "2026-04-17T05:27:01.622Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "e5e98577-2262-48c2-8ecf-120f1e533bc6"}, "pendingMfaEmail": null, "pendingMfaUserId": null}	2026-04-17 05:28:20
E_zf4xLMh0EmZLuZuPbuPKw2scQJDedW	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-17T03:44:27.398Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":"e5e98577-2262-48c2-8ecf-120f1e533bc6"}}	2026-04-17 03:45:17
\.


--
-- Data for Name: share_classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.share_classes (id, company_id, name, type, price_per_share, authorized_shares, board_approval_date, liquidation_preference) FROM stdin;
6cfa5747-bbb6-4fbd-8210-72a3bc8ee141	f0614545-ea45-42b2-8cb9-aa880c576ace	Common Stock	common	0.0001	8000000	2024-01-15	1.00
8ab126fe-8f51-42f9-aaab-817b9ccde482	f0614545-ea45-42b2-8cb9-aa880c576ace	Series A Preferred	preferred	1.2500	1500000	2025-03-01	1.00
2daf741f-997d-4026-b098-2d9e6a75ab60	f0614545-ea45-42b2-8cb9-aa880c576ace	Employee Stock Options	options	0.5000	500000	2024-06-15	0.00
\.


--
-- Data for Name: stakeholders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stakeholders (id, company_id, name, email, type, title, avatar_initials) FROM stdin;
7d3e97b7-a459-48d1-9219-1067574dbc30	f0614545-ea45-42b2-8cb9-aa880c576ace	Sarah Chen	sarah@acmetech.com	founder	CEO & Co-Founder	SC
47c08400-7500-4c75-9b0e-115f92da7184	f0614545-ea45-42b2-8cb9-aa880c576ace	Marcus Rivera	marcus@acmetech.com	founder	CTO & Co-Founder	MR
97562a09-11c4-4502-9da7-a41791a33c36	f0614545-ea45-42b2-8cb9-aa880c576ace	Sequoia Capital	deals@sequoia.com	investor	Lead Investor	SQ
7c317ccd-1e51-4cfa-a32e-11c36b2770d2	f0614545-ea45-42b2-8cb9-aa880c576ace	Andreessen Horowitz	invest@a16z.com	investor	Investor	AH
1b0d772a-a6e3-4ef6-9f87-27c3011d7d91	f0614545-ea45-42b2-8cb9-aa880c576ace	Y Combinator	invest@ycombinator.com	investor	Seed Investor	YC
e2987c46-2d03-484d-9659-73e62b2db442	f0614545-ea45-42b2-8cb9-aa880c576ace	Emily Zhang	emily@acmetech.com	employee	VP Engineering	EZ
9ca87318-d689-4e2a-b9a5-0433a6e2f89d	f0614545-ea45-42b2-8cb9-aa880c576ace	David Kim	david@acmetech.com	employee	Head of Product	DK
618951d8-cd52-425e-863a-946d4015f8c5	f0614545-ea45-42b2-8cb9-aa880c576ace	James Parker	james@advisory.com	advisor	Strategic Advisor	JP
7c5c00d0-cf29-4f32-b3cc-5525a93295a3	f0614545-ea45-42b2-8cb9-aa880c576ace	Test Investor ABC	testinvestor@example.com	investor	Angel Investor	TI
\.


--
-- Data for Name: tenant_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenant_members (id, tenant_id, user_id, role, status, created_at) FROM stdin;
c6bd0c2e-53fe-4ca7-bbdb-301f374b9d5b	7c107aab-53a4-479b-8930-9ff801b93ba0	50e7a53a-575a-4477-b75c-bcbc53deb44e	tenant_admin	active	2026-02-16
c9e2eb9d-22ec-485c-af3d-cb2c547c69ee	e36d07b8-c9b4-4992-9e32-e63d27f13bb4	50e7a53a-575a-4477-b75c-bcbc53deb44e	tenant_admin	active	2026-02-16
481b408e-377b-4b8f-a10f-82622c92d11e	7c107aab-53a4-479b-8930-9ff801b93ba0	5f445caf-5a83-4692-98ea-20ad02b8a6f1	shareholder	active	2026-02-16
a5b67ad5-8c41-4005-b3d1-1da1f8196cd0	7c107aab-53a4-479b-8930-9ff801b93ba0	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	tenant_admin	active	2026-02-21
207b61c3-9159-4ff5-a402-4a2215b130f0	e36d07b8-c9b4-4992-9e32-e63d27f13bb4	cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	tenant_admin	active	2026-02-21
7e1414e2-e376-463b-90dd-6fc1e5e400ac	7c107aab-53a4-479b-8930-9ff801b93ba0	58e8d28a-8d76-4fbc-86df-e7b4cb6e9eff	shareholder	active	2026-02-24
965973d1-9ff7-4363-9106-7e3382ab352f	7c107aab-53a4-479b-8930-9ff801b93ba0	e5e98577-2262-48c2-8ecf-120f1e533bc6	tenant_admin	active	2026-02-27
f73944fb-df30-4023-b114-4c69eaf3d3d9	e36d07b8-c9b4-4992-9e32-e63d27f13bb4	e5e98577-2262-48c2-8ecf-120f1e533bc6	tenant_admin	active	2026-02-27
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tenants (id, slug, name, status, plan, owner_email, max_users, max_companies, created_at, language, org_size, time_zone, trial_ends_at, is_sandbox) FROM stdin;
e36d07b8-c9b4-4992-9e32-e63d27f13bb4	globex	Globex Corporation	active	enterprise	admin@globex.com	10	1	2026-02-16	en	\N	\N	\N	f
81dce617-9df9-4dd6-9f42-46a8576eee57	initech-corp	Initech Corp	active	standard	admin@initech.com	10	1	2026-02-16	en	\N	\N	\N	f
7c107aab-53a4-479b-8930-9ff801b93ba0	acme	Archer Technologies	active	professional	sarah@archertech.com	10	1	2026-02-16	en	\N	\N	\N	f
\.


--
-- Data for Name: trial_signups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trial_signups (id, full_name, email, phone, company_name, password_hash, agreed_to_terms, email_verified, verification_token, user_id, created_at, account_created_at, verified_at) FROM stdin;
1fc81a55-29c4-48c7-9dff-f2bf8b8f29e0	Test User lnw_ej	testuser_vfr1hl@example.com	(555) 123-4567	Test Corp kLF-_Y	$2b$12$wJKTFurIq8xiMXd5Nb4aweApbb4OA6X1WrR015b/hbdzvJW42hVN2	t	f	ef54af822bb6f9b72f86dee5c9d6c7f949390d4985ae70dae941c7f5a97360bb	5275fb47-709f-45c2-b817-3257d7d5b90b	2026-02-21T03:39:55.443Z	2026-02-21T03:41:00.225Z	\N
d0f65fc8-5d0d-4549-bfc1-48e0dba03f82	Test User WAxCqv	testuser_sxgwb9@example.com	5551234567	TestCorp y3Q7i-	$2b$12$2L0OzBKmRR0w9vc8vpQ4nOjWm2a3lTesf1WTI40SRzQec1JQDq44u	t	f	a23bcdf6ad22542f5c3751ab33c5333946655fa7ee71ee04f23962c0b93d8b76	0129f128-29cf-44cc-8b72-1523a3aefa23	2026-02-22T01:15:18.896Z	2026-02-22T01:15:33.630Z	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password_hash, first_name, last_name, is_platform_admin, created_at, email_verified, google_id, stripe_customer_id, stripe_subscription_id) FROM stdin;
5f445caf-5a83-4692-98ea-20ad02b8a6f1	johndoe@acmetech.com	$2b$12$jgwwvfctLEoknJ2PMVMQvOxtlowYeXblvLC6Ol1EgDumrtLzVRag6	John	Doe	f	2026-02-16	t	\N	\N	\N
5275fb47-709f-45c2-b817-3257d7d5b90b	testuser_vfr1hl@example.com	$2b$12$wJKTFurIq8xiMXd5Nb4aweApbb4OA6X1WrR015b/hbdzvJW42hVN2	Test	User lnw_ej	f	2026-02-21	f	\N	\N	\N
0129f128-29cf-44cc-8b72-1523a3aefa23	testuser_sxgwb9@example.com	$2b$12$2L0OzBKmRR0w9vc8vpQ4nOjWm2a3lTesf1WTI40SRzQec1JQDq44u	Test	User WAxCqv	f	2026-02-22	f	\N	\N	\N
50e7a53a-575a-4477-b75c-bcbc53deb44e	admin@exemptifi.com	$2b$12$bn3HEI.FJwQcXZ1Oa14FWeLq6vLVkqbNmSnvVYwqT5Dz.UVn0yARq	Platform	Admin	t	2026-02-16	t	\N	\N	\N
e5e98577-2262-48c2-8ecf-120f1e533bc6	abc17@gmail.com	$2b$12$3A6GMh9NVDpCVo1gNqJCiugZZAByNlTu6QUkYbjuyMfvP9zWNdpum	Super	Admin	t	2026-02-27	t	\N	\N	\N
d4c27ed8-d5f1-4e6b-84cd-82729c6498d1	testcookie@example.com	$2b$12$ADoTiy3IadXgtormVTUDZ.ZCZmcJwF58SAAtzsjre5gQ4zieflJDK	Test	User	f	2026-03-14	f	\N	\N	\N
58e8d28a-8d76-4fbc-86df-e7b4cb6e9eff	johndoe@archertech.com	$2b$12$EamPJBALxfmeYMZ0T60FQuHGoPTdASKYlFHMno7sUFz6G0eVjGh8u	John	Doe	f	2026-02-24	f	\N	\N	\N
cdff4f45-3fc6-40cb-be2c-ce8e8b0eb258	admin@tableicty.com	$2b$12$NHuYYoFHLvCm3ACcazSR8epHd1faHQ7GF9wVQBAkkY0vKUG1jKeP2	Platform	Admin	t	2026-02-21	t	\N	\N	\N
\.


--
-- Data for Name: warrants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warrants (id, company_id, stakeholder_id, name, underlying_share_class, shares, exercise_price, issue_date, expiration_date, vesting_schedule, status, exercised_date, exercised_shares, notes, created_at) FROM stdin;
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.companies (id, name, legal_name, incorporation_date, incorporation_state, ein, address, total_authorized_shares) FROM stdin;
34217844-6950-47f4-a038-72742ce3c0af	Archer Technologies Inc.	Archer Technologies, Inc.	2024-01-15	Delaware	12-3456789	123 Innovation Way, San Francisco, CA 94107	10000000
\.


--
-- Data for Name: data_store_categories; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.data_store_categories (id, org_id, name, created_at) FROM stdin;
ee42a00c-8ecf-4792-8102-277f781df0b8	34217844-6950-47f4-a038-72742ce3c0af	Test Drives	2026-02-28T06:54:46.245Z
abd59010-92ca-48ac-9171-84cfc429aed8	34217844-6950-47f4-a038-72742ce3c0af	Documents	2026-02-28T06:54:46.295Z
648d2203-3bb2-4c01-b6b5-bbadf8ebcaa9	34217844-6950-47f4-a038-72742ce3c0af	Notes	2026-02-28T06:54:46.299Z
645afefb-b567-46e3-b53b-c3001b501d37	34217844-6950-47f4-a038-72742ce3c0af	Other	2026-02-28T06:54:46.302Z
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.documents (id, company_id, name, type, description, upload_date, file_size, uploaded_by, file_url, file_size_bytes, mime_type, encrypted, content) FROM stdin;
f8b74c71-9e4f-419a-a71d-70e87ef20fc7	34217844-6950-47f4-a038-72742ce3c0af	Certificate of Incorporation	legal	Delaware C-Corp incorporation documents	2024-01-15	2.4 MB	Sarah Mitchell	\N	\N	\N	f	\N
f478b631-4c99-4240-bb05-44583d859abd	34217844-6950-47f4-a038-72742ce3c0af	Board Meeting Minutes - Q4 2024	corporate	Minutes from the Q4 2024 board meeting	2025-01-10	850 KB	James Carter	\N	\N	\N	t	\N
0525198f-bcbe-4b84-86f7-16a863c03954	34217844-6950-47f4-a038-72742ce3c0af	Financial Projections 2025	financial	Revenue forecasts and financial model for 2025	2025-01-05	3.2 MB	Sarah Mitchell	\N	\N	\N	f	\N
60315926-ea93-4a2d-9f54-554f695d2e35	34217844-6950-47f4-a038-72742ce3c0af	Employee Stock Option Plan	legal	2024 ESOP agreement and schedule	2024-06-15	1.8 MB	Sarah Mitchell	\N	\N	\N	f	\N
c9494d98-f72b-41be-871f-676f47bd339d	34217844-6950-47f4-a038-72742ce3c0af	Test Drive Checklist — Warrants	other	[Category: Test Drives] | Page: /equity-plans/warrants	2026-02-28	\N	System	\N	\N	\N	f	\N
9452db96-0557-44f8-baec-8fbc721107da	34217844-6950-47f4-a038-72742ce3c0af	Test Drive Checklist — Pools	other	[Category: Test Drives] | Page: /equity-plans/pools	2026-02-28	\N	System	\N	\N	\N	f	\N
21e846ed-7c2c-48e7-9aa2-6fff0fb84645	34217844-6950-47f4-a038-72742ce3c0af	Test Drive Checklist — Plans	other	[Category: Test Drives] | Page: /equity-plans/plans	2026-02-28	\N	System	\N	\N	\N	f	\N
bba2d7ea-6d44-4c60-8495-37276b5ef664	34217844-6950-47f4-a038-72742ce3c0af	Test Drive Checklist — Grants	other	[Category: Test Drives] | Page: /equity-plans/grants	2026-02-28	\N	System	\N	\N	\N	f	\N
146350e0-6fa8-4311-98ce-f4e248c52545	34217844-6950-47f4-a038-72742ce3c0af	Test Drive Checklist — Exercising	other	[Category: Test Drives] | Page: /equity-plans/exercising	2026-02-28	\N	System	\N	\N	\N	f	\N
bfb36404-c3ef-45ca-b048-c525fe254287	34217844-6950-47f4-a038-72742ce3c0af	Test Drive Checklist — Phantom Shares	other	[Category: Test Drives] | Page: /equity-plans/phantom	2026-02-28	\N	System	\N	\N	\N	f	\N
8772f50c-5fac-47b7-aca5-eea1c138be41	34217844-6950-47f4-a038-72742ce3c0af	Test Drive Checklist — SARs	other	[Category: Test Drives] | Page: /equity-plans/sars	2026-02-28	\N	System	\N	\N	\N	f	\N
d6898b57-1e9d-458f-bbc1-978961da49ad	34217844-6950-47f4-a038-72742ce3c0af	Series A Term Sheet	investor	Signed term sheet for Series A financing	2025-02-20	1.1 MB	Sarah Mitchell	\N	\N	\N	t	\N
3ed6538f-f329-4eae-a3df-1a93285f71e9	34217844-6950-47f4-a038-72742ce3c0af	Series A Term Sheet — Quantum Innovations Inc.	investor	[Category: Test Drives] | Haylo AI Sample Term Sheet\n\nSERIES A PREFERRED STOCK TERM SHEET\nQuantum Innovations Inc.\nConfidential — For Discussion Purposes Only\n\nDate: March 15, 2025\n\nPARTIES\nIssuer: Archer Technologies, Inc. (the "Company")\nLead Investor: Quantum Innovations Inc. ("Lead Investor")\nRound Type: Series A Preferred Stock Financing\n\nOFFERING TERMS\nAggregate Amount: $5,000,000\nPre-Money Valuation: $20,000,000\nPost-Money Valuation: $25,000,000\nPrice Per Share: $20.00\nShares Issued: 250,000 shares of Series A Preferred Stock\n\nCAPITALIZATION SUMMARY (PRE-CLOSE)\nCommon Stock Outstanding: 5,500,000 shares (Sarah Mitchell: 3,000,000; James Carter: 2,500,000)\nSeries A Preferred Outstanding: 1,200,000 shares (Haystack Capital: 800,000; Wei Chen: 400,000)\nOptions Outstanding: 300,000 shares (Michael Reynolds: 150,000; Kenji Tanaka: 100,000; Robert Harrison: 50,000)\nTotal Fully Diluted: 7,000,000 shares\n\nSAFES PENDING CONVERSION\nPriya Patel — $500,000 Post-Money SAFE at $10M cap, 20% discount\nHaystack Capital — $250,000 Post-Money SAFE at $8M cap\nWei Chen — $150,000 Pre-Money SAFE at $12M cap, 15% discount\n\nTERMS AND CONDITIONS\nLiquidation Preference: 1x non-participating\nAnti-Dilution: Broad-based weighted average\nDividends: Non-cumulative, at Board discretion\nVoting Rights: As-converted basis, one vote per share\nBoard Composition: 2 Founder seats, 1 Investor seat, 1 Independent seat\nProtective Provisions: Standard Series A protective provisions per NVCA template\nESOP Expansion: Option pool to be increased to 20% of post-money capitalization pre-close\nRight of First Refusal: Company and Investors have ROFR on Common Stock transfers\nDrag-Along: Standard drag-along provisions\nInformation Rights: Quarterly financials, annual audited statements, annual budget\n\nCLOSING CONDITIONS\nSatisfactory completion of legal due diligence\nBoard approval of option pool expansion\nConversion or termination of outstanding SAFEs\nExecution of Investor Rights Agreement, Voting Agreement, and ROFR Agreement\n\nThis term sheet is non-binding except for confidentiality, exclusivity (60 days), and governing law (Delaware) provisions.	2026-04-10	\N	System	\N	\N	\N	f	\N
\.


--
-- Data for Name: esop_grants; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.esop_grants (id, company_id, pool_id, plan_id, stakeholder_id, grant_name, grant_date, shares, exercise_price, underlying_share_class, vesting_start_date, vesting_duration_months, cliff_months, vest_frequency_months, vested_shares, exercised_shares, status, notes, created_at) FROM stdin;
a08a1842-e8b4-4412-bc0d-7c4230404ffb	34217844-6950-47f4-a038-72742ce3c0af	00c03781-1e6d-474e-ad03-16a79cc7cd40	3f075fda-f8cd-4049-8665-57fc01998d76	efaeaf4b-32f4-4eb5-b54a-b572d0d6de93	Stock Option Grant — Engineering	2024-08-01	75000	1.5000	Common Stock	2024-08-01	48	12	1	0	0	active	Standard 4-year vesting with 1-year cliff. Engineering team member.	2026-02-27T06:02:27.687Z
97de6565-fdab-4db1-bd0b-06d929f3c247	34217844-6950-47f4-a038-72742ce3c0af	00c03781-1e6d-474e-ad03-16a79cc7cd40	3f075fda-f8cd-4049-8665-57fc01998d76	01b066f1-a359-42dd-a12f-7c3fd3261f3d	Stock Option Grant — Product	2024-10-15	50000	2.0000	Common Stock	2024-10-15	48	12	1	0	0	active	Standard 4-year vesting with 1-year cliff. Engineering team member.	2026-02-27T06:02:27.698Z
faf1b3c6-d726-4cfb-8afc-11d9bc99ce8a	34217844-6950-47f4-a038-72742ce3c0af	00c03781-1e6d-474e-ad03-16a79cc7cd40	f79f44c4-ddaf-4d84-b59f-7e06a9fd0593	efaeaf4b-32f4-4eb5-b54a-b572d0d6de93	Leadership RSU Grant	2025-01-15	25000	0.0000	Common Stock	2025-01-15	36	0	3	0	0	active	Quarterly vesting RSU for VP-level leadership.	2026-02-27T06:02:27.705Z
25498b53-3de2-4aed-86a3-5dd2a596d31a	34217844-6950-47f4-a038-72742ce3c0af	00c03781-1e6d-474e-ad03-16a79cc7cd40	3f075fda-f8cd-4049-8665-57fc01998d76	2e413580-8e11-4e2e-bc08-b56e13c2c790	Stock Option Grant — Dev Team	2025-02-01	50000	2.0000	Common	2025-02-01	48	12	1	0	0	active	\N	2026-02-27 23:18:44.182305+00
\.


--
-- Data for Name: esop_plans; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.esop_plans (id, company_id, pool_id, name, approved_date, grant_type, grant_presets, documents, internal_note, created_at) FROM stdin;
3f075fda-f8cd-4049-8665-57fc01998d76	34217844-6950-47f4-a038-72742ce3c0af	00c03781-1e6d-474e-ad03-16a79cc7cd40	Engineering Stock Option Plan	2024-07-01	stock_options	\N	\N	Standard 4-year vesting with 1-year cliff for engineering team members.	2026-02-27T02:48:27.674Z
f79f44c4-ddaf-4d84-b59f-7e06a9fd0593	34217844-6950-47f4-a038-72742ce3c0af	00c03781-1e6d-474e-ad03-16a79cc7cd40	Leadership RSU Plan	2024-09-15	stock	\N	\N	Restricted stock units for VP-level and above. 3-year vesting, quarterly.	2026-02-27T02:48:27.678Z
caf869c8-1f87-4dab-8b75-6e02fac45f7b	34217844-6950-47f4-a038-72742ce3c0af	00c03781-1e6d-474e-ad03-16a79cc7cd40	Advisor Warrant Program	2025-01-10	warrants	\N	\N	Strategic advisor warrants. 2-year vesting, no cliff.	2026-02-27T02:48:27.681Z
\.


--
-- Data for Name: esop_pools; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.esop_pools (id, company_id, name, approved_date, underlying_share_class, allocated_shares, granted_shares, vested_shares, exercised_shares, created_at) FROM stdin;
9954a413-3d50-4831-a769-5b5272ddcb2a	34217844-6950-47f4-a038-72742ce3c0af	2025 Expansion Pool	2025-04-01	Common Stock	250000	50000	0	0	2025-04-01
00c03781-1e6d-474e-ad03-16a79cc7cd40	34217844-6950-47f4-a038-72742ce3c0af	2024 Employee Option Pool	2024-06-15	Common Stock	500000	200500	75000	0	2024-06-15
\.


--
-- Data for Name: haylo_intents; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.haylo_intents (id, tenant_id, user_id, natural_language_input, structured_intent, grok_raw_response, status, proof_request_id, rejection_reason, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: investment_rounds; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.investment_rounds (id, company_id, round_name, round_date, created_at) FROM stdin;
d3f6e49c-c870-4865-9846-7f033e211dad	34217844-6950-47f4-a038-72742ce3c0af	Seed Round	2024-03-15	2026-02-26T21:11:28.350Z
b9e86328-1f48-47ec-a756-792071eaa33a	34217844-6950-47f4-a038-72742ce3c0af	Series A	2025-03-01	2026-02-26T21:11:28.383Z
c62206ab-57a8-4d01-b10b-188fa9f07dea	34217844-6950-47f4-a038-72742ce3c0af	Bridge Round	2025-12-01	2026-02-26T21:11:28.386Z
\.


--
-- Data for Name: investor_updates; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.investor_updates (id, company_id, title, content, status, sent_date, created_date, recipient_count) FROM stdin;
7306fcb1-98e7-4ffc-bee1-52813b53c6fb	34217844-6950-47f4-a038-72742ce3c0af	Q4 2024 Investor Update	Dear Investors,\n\nWe're excited to share our Q4 2024 progress.\n\nHighlights:\n- Revenue grew 45% QoQ to $850K ARR\n- Launched enterprise tier with 3 Fortune 500 customers\n- Team expanded to 18 members\n- Closed Series A term sheet with Haystack Capital leading\n\nKey Metrics:\n- MRR: $71K\n- Customers: 127 (up from 89)\n- NRR: 135%\n- Burn Rate: $180K/mo\n- Runway: 24 months\n\nLooking Ahead:\nWe're focused on scaling our go-to-market motion and building out the enterprise feature set. We expect to close Series A in Q1 2025.\n\nThank you for your continued support.\n\nBest,\nSarah Mitchell\nCEO, Archer Technologies	sent	2025-01-15	2025-01-12	3
87b0b54a-c879-432b-b66b-4626b5d2ef82	34217844-6950-47f4-a038-72742ce3c0af	Q1 2025 Investor Update	Dear Investors,\n\nQ1 2025 has been a transformative quarter for Archer Technologies.\n\nHighlights:\n- Successfully closed $2.5M Series A led by Haystack Capital Partners\n- Revenue reached $1.2M ARR\n- Launched API v2.0 with 10x performance improvement\n- Hired VP Engineering (Michael Reynolds, ex-Stripe)\n\nKey Metrics:\n- MRR: $100K\n- Customers: 168\n- NRR: 142%\n- Team: 22 members\n\nWe're entering an exciting growth phase. More details in our upcoming board meeting.\n\nBest,\nSarah	sent	2025-04-10	2025-04-08	3
8158b913-e69c-4347-9566-63d06e5d456d	34217844-6950-47f4-a038-72742ce3c0af	Q2 2025 Investor Update (Draft)	Dear Investors,\n\nHere's our mid-year update.\n\nHighlights:\n- Revenue tracking to $2M ARR\n- Expansion into European market\n- SOC 2 Type II certification achieved\n- Product-led growth motion gaining traction\n\nKey Metrics:\n- MRR: $165K\n- Customers: 220+\n- Enterprise accounts: 8	draft	\N	2025-07-01	0
\.


--
-- Data for Name: phantom_grants; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.phantom_grants (id, company_id, stakeholder_id, grant_name, grant_date, shares_equivalent, grant_price_per_unit, plan_type, vesting_schedule, cliff_months, vesting_months, payout_trigger, payout_date, payout_amount, current_share_price, status, notes, created_at) FROM stdin;
668a1ced-bdb0-46b8-a2db-9ba7c25271b3	34217844-6950-47f4-a038-72742ce3c0af	efaeaf4b-32f4-4eb5-b54a-b572d0d6de93	Executive Phantom Plan	2024-08-01	10000	5.0000	full_value	4-year with 1-year cliff, monthly thereafter	12	48	exit	\N	\N	\N	active	Full value phantom plan for senior engineering leadership. Payout at exit event.	2026-02-27T04:26:38.801Z
4860e9eb-00a4-4dda-a5ca-dba5f4ca7e7f	34217844-6950-47f4-a038-72742ce3c0af	01b066f1-a359-42dd-a12f-7c3fd3261f3d	Growth Incentive Plan	2025-01-15	5000	3.0000	appreciation_only	3-year with 6-month cliff	6	36	ipo	\N	\N	\N	active	Appreciation-only phantom plan. Payout equals share price increase above $3.00 grant price.	2026-02-27T04:26:38.846Z
\.


--
-- Data for Name: privacy_labels; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.privacy_labels (id, company_id, stakeholder_id, hashed_id, encrypted_label, created_at) FROM stdin;
793aaaf3-df84-4aa5-b8db-7e0a799dbf03	34217844-6950-47f4-a038-72742ce3c0af	9dd26f3e-4453-4edc-83b6-538ef11a7c3c	0f30739800950fb1cd7221d0a70fb3616618c4653863533ed727ddd191b7ff1c	MTS9-T77L	2026-03-16T20:56:29.579Z
f0f19701-25a8-4b8a-bcfb-189d50f63cb6	34217844-6950-47f4-a038-72742ce3c0af	fbacebb8-1dcf-4e22-940a-cc42debd9c4c	bc6f802b2511884666c4b844c31ac636017f247e9316e9daa9330e02f10b7bb2	DGZL-6FQ8	2026-03-16T20:56:29.616Z
8e38a031-f537-49f6-b1de-424ef1ee7edc	34217844-6950-47f4-a038-72742ce3c0af	85c33785-03a2-4674-a5f2-a04e3d9c2243	035bce7725927de411bbb98510c2aa1586a7f6bbd47183aa014630dc6db2ec7f	Q64Z-KV6X	2026-03-16T20:56:29.620Z
2e8beaa0-d432-4d75-aba2-647506362dac	34217844-6950-47f4-a038-72742ce3c0af	436c0217-bd29-4b2a-af88-434144022f53	aab76d00b516b9d3bac8b952e64c568ed2e6c278229d7299bcf92919f494df6f	RUKB-MC5H	2026-03-16T20:56:29.624Z
cdabc38b-b268-4c40-9aa0-982d335fa8bb	34217844-6950-47f4-a038-72742ce3c0af	b11b12c8-21d4-4e7e-b83f-c1a6daa957a7	21cd141d899d96604b5d5ff999fdb741b32fcf4a1fad45db757528164c6b2968	DLDN-DKC5	2026-03-16T20:56:29.627Z
897b62e6-3503-4ba4-adfa-af7ef95e028d	34217844-6950-47f4-a038-72742ce3c0af	efaeaf4b-32f4-4eb5-b54a-b572d0d6de93	c40cbdd56f3c1fd4d8a4caee5d105d2cc8ecd12117f8c191f733becc5911775a	7U2U-KZ6W	2026-03-16T20:56:29.631Z
7f5d8db0-5a5f-4cd6-ad2c-cf66d859cdcc	34217844-6950-47f4-a038-72742ce3c0af	01b066f1-a359-42dd-a12f-7c3fd3261f3d	2ac1cfb51fa3b4ac23ebfd6a6b02cefe533f41e2b5a74348e0f51eefddc5d7dd	BM8K-PRH3	2026-03-16T20:56:29.635Z
07f85aff-615a-4e16-a72a-4517cb407501	34217844-6950-47f4-a038-72742ce3c0af	5ee01de8-6233-4d16-85bd-8abe6253e1cc	12167413a01ea8f0563080e6349825fd2e52c73b86737c51b5a618b18a0699db	BHMB-M7H5	2026-03-16T20:56:29.639Z
0ca15e8e-f2b1-4193-ae39-f010d33b69ed	34217844-6950-47f4-a038-72742ce3c0af	2e413580-8e11-4e2e-bc08-b56e13c2c790	afccdf8fb1c224ad39fa2848a9dbb4eeb3128ce046a4ece4f2ae0e8ccd5f61af	MDAW-R2FC	2026-03-16T20:56:29.642Z
\.


--
-- Data for Name: safe_agreements; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.safe_agreements (id, company_id, stakeholder_id, investment_amount, valuation_cap, discount_rate, safe_type, status, issue_date, conversion_date, notes, investment_round_id, investment_round_name, raise_goal, end_date, template_variables, template_id, doc_ref) FROM stdin;
61868dc9-322d-44ff-8c48-8a723556b8e0	34217844-6950-47f4-a038-72742ce3c0af	b11b12c8-21d4-4e7e-b83f-c1a6daa957a7	500000.00	10000000.00	20.00	post-money	signed	2024-06-01	\N	YC standard SAFE agreement	\N	\N	\N	\N	\N	\N	\N
70f49e02-8867-4e99-9f66-ac20d71b58a9	34217844-6950-47f4-a038-72742ce3c0af	436c0217-bd29-4b2a-af88-434144022f53	150000.00	12000000.00	15.00	pre-money	draft	2025-12-01	\N	Pending bridge round SAFE	\N	\N	\N	\N	\N	\N	\N
b5a4826f-4018-44c3-a88c-4b75718e6b11	34217844-6950-47f4-a038-72742ce3c0af	85c33785-03a2-4674-a5f2-a04e3d9c2243	250000.00	8000000.00	\N	post-money	signed	2024-04-15	\N	Early bridge SAFE	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: safe_templates; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.safe_templates (id, template_name, template_type, template_version, description, raw_content, is_active, is_default, created_at, updated_at) FROM stdin;
d2fc81c2-5974-4fd5-8bd3-0d712828fcce	Standard SAFE Agreement	safe	1.0	Y Combinator standard post-money SAFE template with valuation cap and discount provisions.	THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED (THE "SECURITIES ACT"), OR UNDER THE SECURITIES LAWS OF CERTAIN STATES. THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR HYPOTHECATED EXCEPT AS PERMITTED IN THIS SAFE AND UNDER THE ACT AND APPLICABLE STATE SECURITIES LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.\n\n\nSIMPLE AGREEMENT FOR FUTURE EQUITY\n\n\nParties\n\n{{company_name}}, a {{state_of_registration}} corporation ("Company").\nThe party set out in Schedule 1 ("Investor").\n\n\nEXECUTED AS AN AGREEMENT\n\n\nAgreed Terms\n\nTHIS CERTIFIES THAT in exchange for the payment by {{investor_name}} {{investor_trust_name}} {{investor_trust_number}} (the "Investor") of {{purchase_amount}} (the "Purchase Amount"), {{company_name}}, a {{state_of_registration}} corporation (the "Company"), issues to the Investor the right to certain shares of the Company's Capital Stock, subject to the terms described below.\n\n\n1. Events\n\n(a) Equity Financing.\n\nIf there is an Equity Financing before the termination of this Safe, on the initial closing of such Equity Financing, this Safe will automatically convert into the number of shares of Safe Preferred Stock equal to the Purchase Amount divided by the Conversion Price.\n\nIn connection with the automatic conversion of this Safe into shares of Safe Preferred Stock, the Investor will execute and deliver to the Company all of the transaction documents related to the Equity Financing; provided, that such documents are the same documents to be entered into with the purchasers of Standard Preferred Stock, with appropriate variations for the Safe Preferred Stock if applicable, and provided further, that such documents have customary exceptions to any drag-along applicable to the Investor.\n\n(b) Liquidity Event.\n\nIf there is a Liquidity Event before the termination of this Safe, this Safe will automatically be entitled to receive a portion of Proceeds, due and payable to the Investor immediately prior to, or concurrent with, the consummation of such Liquidity Event, equal to the greater of (i) the Purchase Amount (the "Cash-Out Amount") or (ii) the amount payable on the number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price (the "Conversion Amount").\n\nNotwithstanding the foregoing, in connection with a Change of Control intended to qualify as a tax-free reorganization, the Company may reduce the cash portion of Proceeds payable to the Investor by the amount determined by its board of directors in good faith for such Change of Control to qualify as a tax-free reorganization for U.S. federal income tax purposes, provided that such reduction (A) does not reduce the total Proceeds payable to such Investor and (B) is applied in the same manner and proportion to all holders of Safes.\n\n(c) Dissolution Event.\n\nIf there is a Dissolution Event before the termination of this Safe, the Investor will automatically be entitled to receive a portion of Proceeds equal to the Cash-Out Amount, due and payable to the Investor immediately prior to the consummation of the Dissolution Event.\n\n(d) Liquidation Priority.\n\nIn a Liquidity Event or Dissolution Event, this Safe is intended to operate like standard non-participating Preferred Stock. The Investor's right to receive its Cash-Out Amount is:\n\n(i) Junior to payment of outstanding indebtedness and creditor claims, including contractual claims for payment and convertible promissory notes (to the extent such convertible promissory notes are not actually or notionally converted into Capital Stock);\n\n(ii) On par with payments for other Safes and/or Preferred Stock, and if the applicable Proceeds are insufficient to permit full payments to the Investor and such other Safes and/or Preferred Stock, the applicable Proceeds will be distributed pro rata to the Investor and such other Safes and/or Preferred Stock in proportion to the full payments that would otherwise be due; and\n\n(iii) Senior to payments for Common Stock.\n\nThe Investor's right to receive its Conversion Amount is (A) on par with payments for Common Stock and other Safes and/or Preferred Stock who are also receiving Conversion Amounts or Proceeds on a similar as-converted to Common Stock basis, and (B) junior to payments described in clauses (i) and (ii) above (in the latter case, to the extent such payments are Cash-Out Amounts or similar liquidation preferences).\n\n(e) Termination.\n\nThis Safe will automatically terminate (without relieving the Company of any obligations arising from a prior breach of or non-compliance with this Safe) immediately following the earliest to occur of: (i) the issuance of Capital Stock to the Investor pursuant to the automatic conversion of this Safe under Section 1(a); or (ii) the payment, or setting aside for payment, of amounts due the Investor pursuant to Section 1(b) or Section 1(c).\n\n\n2. Definitions\n\n"Capital Stock" means the capital stock of the Company, including, without limitation, the "Common Stock" and the "Preferred Stock."\n\n"Change of Control" means (i) a transaction or series of related transactions in which any "person" or "group" becomes the "beneficial owner", directly or indirectly, of more than 50% of the outstanding voting securities of the Company having the right to vote for the election of members of the Company's board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a transaction or series of related transactions in which the holders of the voting securities of the Company outstanding immediately prior to such transaction or series of related transactions retain, immediately after such transaction or series of related transactions, at least a majority of the total voting power represented by the outstanding voting securities of the Company or such other surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially all of the assets of the Company.\n\n"Company Capitalization" is calculated as of immediately prior to the Equity Financing and includes all shares of Capital Stock issued and outstanding, all Converting Securities, all issued and outstanding Options and Promised Options, and the Unissued Option Pool.\n\n"Converting Securities" includes this Safe and other convertible securities issued by the Company.\n\n"Conversion Price" means either: (1) the Safe Price or (2) the Discount Price, whichever calculation results in a greater number of shares of Safe Preferred Stock.\n\n"Discount Price" means the price per share of the Standard Preferred Stock sold in the Equity Financing multiplied by the Discount Rate.\n\n"Discount Rate" means 100% minus {{discount_percentage}}.\n\n"Dissolution Event" means (i) a voluntary termination of operations, (ii) a general assignment for the benefit of the Company's creditors or (iii) any other liquidation, dissolution or winding up of the Company (excluding a Liquidity Event), whether voluntary or involuntary.\n\n"Equity Financing" means a bona fide transaction or series of transactions with the principal purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a fixed valuation.\n\n"Liquidity Capitalization" is calculated as of immediately prior to the Liquidity Event.\n\n"Liquidity Event" means a Change of Control or an Initial Public Offering.\n\n"Liquidity Price" means the price per share equal to the Post-Money Valuation Cap divided by the Liquidity Capitalization.\n\n"Options" includes options, restricted stock awards or purchases, RSUs, SARs, warrants or similar securities, vested or unvested.\n\n"Post-Money Valuation Cap" has the meaning set out in Schedule 1.\n\n"Proceeds" means cash and other assets that are proceeds from the Liquidity Event or the Dissolution Event, as applicable, and legally available for distribution.\n\n"Safe Price" means the price per share equal to the Post-Money Valuation Cap divided by the Company Capitalization.\n\n"Standard Preferred Stock" means the shares of the series of Preferred Stock issued to the investors investing new money in the Company in connection with the initial closing of the Equity Financing.\n\n\n3. Company Representations\n\n(a) The Company is a corporation duly organized, validly existing and in good standing under the laws of its state of incorporation, and has the power and authority to own, lease and operate its properties and carry on its business as now conducted.\n\n(b) The execution, delivery and performance by the Company of this Safe is within the power of the Company and has been duly authorized by all necessary actions on the part of the Company. This Safe constitutes a legal, valid and binding obligation of the Company.\n\n(c) The performance and consummation of the transactions contemplated by this Safe do not and will not violate any material judgment, statute, rule or regulation applicable to the Company.\n\n(d) No consents or approvals are required in connection with the performance of this Safe, other than the Company's corporate approvals and any qualifications or filings under applicable securities laws.\n\n(e) To its knowledge, the Company owns or possesses sufficient legal rights to all intellectual property necessary for its business as now conducted.\n\n\n4. Investor Representations\n\n(a) The Investor has full legal capacity, power and authority to execute and deliver this Safe and to perform its obligations hereunder.\n\n(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D under the Securities Act.\n\n\n5. Miscellaneous\n\n(a) Any provision of this Safe may be amended, waived or modified by written consent of the Company and the Investor.\n\n(b) Any notice required or permitted by this Safe will be deemed sufficient when delivered personally or by overnight courier or sent by email.\n\n(c) The Investor is not entitled, as a holder of this Safe, to vote or be deemed a holder of Capital Stock for any purpose other than tax purposes.\n\n(d) Neither this Safe nor the rights in this Safe are transferable or assignable, by operation of law or otherwise, by either party without the prior written consent of the other.\n\n(e) In the event any one or more of the provisions of this Safe is for any reason held to be invalid, illegal or unenforceable, such provision(s) only will be deemed null and void.\n\n(f) All rights and obligations hereunder will be governed by the laws of the State that the Company is registered in.\n\n(g) The parties acknowledge and agree that for United States federal and state income tax purposes this Safe is, and at all times has been, intended to be characterized as stock.\n\n\nSchedule 1 - SAFE Details\n\nInvestor Details\n\nItem 1: Investor\n{{investor_name}}\n\nItem 2: Address\n{{investor_address}}\n\nItem 3: Email\n{{investor_email}}\n\nItem 4: Trust Details (if applicable)\n{{investor_trust_name}} {{investor_trust_number}}\n\nKey Terms\n\nItem 5: Purchase Amount\n{{purchase_amount}}\n\nItem 6: Discount Rate\n{{discount_percentage}}\n\nItem 7: Valuation Cap\n{{valuation_cap}} ({{pre_post_money}}-money)\n\nItem 8: Investment Round\n{{investment_round}}\n\nItem 9: Raise Goal\n{{raise_goal}}\n\nItem 10: End Date\n{{end_date}}\n\nItem 11: Effective Date\n{{effective_date}}\n\nItem 12: SAFE Reference\n{{safe_id}}\n\nAdditional Notes\n{{notes}}	t	t	2026-02-24T22:23:13.819Z	2026-02-24T22:23:13.819Z
ed5bd3ad-0772-4771-a8a0-d55ea230a506	Convertible Note Agreement	convertible_note	1.0	Standard convertible promissory note with interest rate, maturity date, and qualified financing conversion.	CONVERTIBLE PROMISSORY NOTE\n\nDate: {{effective_date}}\nPrincipal Amount: {{purchase_amount}}\n\nFOR VALUE RECEIVED, {{company_name}}, a {{state_of_registration}} corporation (the "Company"), hereby promises to pay to the order of {{investor_name}} (the "Holder"), the principal sum of {{purchase_amount}} (the "Principal Amount"), together with interest thereon from the date hereof at the rate of {{interest_rate}} per annum (the "Interest Rate"), upon the terms and conditions set forth herein.\n\n1. MATURITY DATE\nUnless earlier converted pursuant to Section 3 below, all unpaid principal, together with any unpaid and accrued interest, shall be due and payable on demand by the Holder at any time on or after {{maturity_date}} (the "Maturity Date").\n\n2. INTEREST\nInterest shall accrue on the unpaid principal balance of this Note at the Interest Rate, computed on the basis of the actual number of days elapsed and a year of 365 days. Interest shall be payable upon maturity or conversion, whichever occurs first.\n\n3. CONVERSION\n3.1 Automatic Conversion. Upon the closing of a Qualified Financing (as defined below), the outstanding principal and accrued interest under this Note shall automatically convert into shares of the equity securities issued in such Qualified Financing at a conversion price equal to the lesser of:\n(a) {{valuation_cap}} divided by the Company's fully diluted capitalization immediately prior to the closing of such Qualified Financing (the "Cap Price"); or\n(b) {{discount_percentage}} discount to the price per share paid by the investors in such Qualified Financing (the "Discount Price").\n\n3.2 Qualified Financing. A "Qualified Financing" means the next sale (or series of related sales) by the Company of its equity securities following the date hereof from which the Company receives gross proceeds of not less than {{qualified_financing_amount}} (excluding the conversion of this Note and other convertible securities).\n\n3.3 Voluntary Conversion. At any time prior to the Maturity Date, the Holder may elect to convert all outstanding principal and accrued interest into shares of the Company's common stock at a conversion price based on the {{pre_post_money}} valuation cap of {{valuation_cap}}.\n\n4. EVENTS OF DEFAULT\nThe following shall constitute Events of Default:\n(a) The Company fails to pay any amount due under this Note within five (5) business days of when due;\n(b) The Company files for bankruptcy or makes an assignment for the benefit of creditors;\n(c) A material adverse change occurs in the Company's business, operations, or financial condition.\n\n5. REPRESENTATIONS AND WARRANTIES\n5.1 The Company represents and warrants that it is duly organized and validly existing under the laws of the State of {{state_of_registration}}.\n5.2 The Company has full power and authority to execute and deliver this Note.\n\n6. MISCELLANEOUS\n6.1 This Note shall be governed by and construed in accordance with the laws of the State of {{state_of_registration}}.\n6.2 Any notices required hereunder shall be sent to:\n\nCompany: {{company_name}}\nAddress: {{company_address}}\n\nHolder: {{investor_name}}\nAddress: {{investor_address}}\nEmail: {{investor_email}}\n\nIN WITNESS WHEREOF, the Company has executed this Convertible Promissory Note as of the date first written above.\n\n{{company_name}}\n\nBy: ___________________________\nName:\nTitle:\n\nHOLDER:\n\n{{investor_name}}\n\nBy: ___________________________\n\nSchedule of Terms:\nInvestment Round: {{investment_round}}\nRaise Goal: {{raise_goal}}\nEnd Date: {{end_date}}\nReference: {{safe_id}}\n\n{{notes}}	t	t	2026-02-24T22:23:13.823Z	2026-02-24T22:23:13.823Z
36822924-8005-44f1-8ab1-9015054c1848	Warrant Agreement	warrant	1.0	Stock purchase warrant with exercise price, expiration date, and net exercise provisions.	STOCK PURCHASE WARRANT\n\nTHIS WARRANT AND THE SHARES ISSUABLE UPON EXERCISE HEREOF HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED.\n\nWarrant No.: {{safe_id}}\nDate of Issuance: {{effective_date}}\n\n{{company_name}}, a {{state_of_registration}} corporation (the "Company"), hereby certifies that, for value received, {{investor_name}} (the "Holder"), is entitled to purchase from the Company up to {{number_of_shares}} shares of the Company's Common Stock (the "Warrant Shares") at an exercise price of {{exercise_price}} per share (the "Exercise Price"), subject to the terms and conditions set forth herein.\n\n1. EXERCISE OF WARRANT\n1.1 Exercise Period. This Warrant may be exercised, in whole or in part, at any time and from time to time on or after the date hereof and on or before {{expiration_date}} (the "Expiration Date").\n\n1.2 Method of Exercise. This Warrant shall be exercised by the Holder by:\n(a) Delivery to the Company of a duly executed Exercise Notice in the form attached hereto; and\n(b) Payment of the aggregate Exercise Price for the Warrant Shares being purchased, by cash, check, or wire transfer.\n\n1.3 Net Exercise. In lieu of exercising this Warrant by payment of the Exercise Price, the Holder may elect to receive shares equal to the value of this Warrant (or the portion thereof being exercised) by surrender of this Warrant, in which event the Company shall issue to the Holder a number of Warrant Shares computed using the following formula:\n\nX = Y(A-B) / A\n\nWhere: X = the number of Warrant Shares to be issued\n       Y = the number of Warrant Shares for which the Warrant is being exercised\n       A = the Fair Market Value of one share of Common Stock\n       B = the Exercise Price\n\n2. ADJUSTMENTS\n2.1 Stock Splits and Dividends. If the Company effects a stock split, stock dividend, or similar transaction, the number of Warrant Shares and the Exercise Price shall be proportionally adjusted.\n\n2.2 Reorganization. In the event of any reorganization, merger, consolidation, or similar transaction, this Warrant shall be exercisable for the kind and amount of securities or other property that the Holder would have been entitled to receive had the Warrant been exercised immediately prior to such transaction.\n\n3. TRANSFER\nThis Warrant and the rights hereunder are not transferable without the prior written consent of the Company, except to affiliates of the Holder.\n\n4. REPRESENTATIONS\n4.1 The Company represents that it is duly organized under the laws of {{state_of_registration}}.\n4.2 The Warrant Shares, when issued upon proper exercise, shall be validly issued, fully paid, and non-assessable.\n\n5. MISCELLANEOUS\n5.1 Governing Law. This Warrant shall be governed by the laws of the State of {{state_of_registration}}.\n5.2 Notices. All notices shall be sent to:\n\nCompany: {{company_name}}\nAddress: {{company_address}}\n\nHolder: {{investor_name}}\nAddress: {{investor_address}}\nEmail: {{investor_email}}\n\nIN WITNESS WHEREOF, the Company has caused this Warrant to be executed as of the Date of Issuance.\n\n{{company_name}}\n\nBy: ___________________________\nName:\nTitle:\n\nInvestment Context:\nRound: {{investment_round}}\nValuation Cap: {{valuation_cap}}\nRaise Goal: {{raise_goal}}\n\n{{notes}}	t	t	2026-02-24T22:23:13.827Z	2026-02-24T22:23:13.827Z
\.


--
-- Data for Name: sars; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.sars (id, company_id, stakeholder_id, grant_name, grant_date, units, base_price, settlement_type, underlying_share_class, vesting_schedule, cliff_months, vesting_months, expiration_date, exercise_date, exercise_price, exercised_units, payout_amount, status, notes, created_at, exercise_trigger) FROM stdin;
098e7f38-c50a-4393-973d-25116aa0d1da	34217844-6950-47f4-a038-72742ce3c0af	efaeaf4b-32f4-4eb5-b54a-b572d0d6de93	VP Engineering SAR	2024-10-01	15000	4.0000	cash	\N	4-year with 1-year cliff, monthly thereafter	12	48	2034-10-01	\N	\N	0	\N	active	Cash-settled SAR for senior engineering leadership. Appreciation above $4.00 base price paid in cash.	2026-02-27T05:28:31.138Z	exit
2194cc22-a2c7-4a64-97f6-a6cb26069440	34217844-6950-47f4-a038-72742ce3c0af	01b066f1-a359-42dd-a12f-7c3fd3261f3d	Product Lead SAR	2025-02-01	8000	5.5000	stock	Common	3-year with 6-month cliff	6	36	2035-02-01	\N	\N	0	\N	active	Stock-settled SAR. On exercise, appreciation value is converted to Common shares at current FMV.	2026-02-27T05:28:31.142Z	ipo
\.


--
-- Data for Name: securities; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.securities (id, company_id, stakeholder_id, share_class_id, certificate_id, shares, price_per_share, issue_date, status, vesting_schedule, notes) FROM stdin;
9c505963-4b93-41a5-ac0c-24b8406ee89b	34217844-6950-47f4-a038-72742ce3c0af	85c33785-03a2-4674-a5f2-a04e3d9c2243	e58917d8-54f6-4049-8f45-b09aa7c4d5e6	SA-001	800000	1.2500	2025-03-15	active	\N	Series A lead investor
654a98cc-4824-4a3c-85f6-7faf2c4078c5	34217844-6950-47f4-a038-72742ce3c0af	436c0217-bd29-4b2a-af88-434144022f53	e58917d8-54f6-4049-8f45-b09aa7c4d5e6	SA-002	400000	1.2500	2025-03-15	active	\N	\N
df3042a9-c049-4944-af35-642d37fe86fc	34217844-6950-47f4-a038-72742ce3c0af	9dd26f3e-4453-4edc-83b6-538ef11a7c3c	87f60111-3a02-4069-8754-939519f685d9	CS-001	3000000	0.0200	2024-01-15	active	4-year, 1-year cliff	Founder shares with 4-year vesting, 1-year cliff
3b2ccc70-893b-4c4a-8c40-debf56938402	34217844-6950-47f4-a038-72742ce3c0af	fbacebb8-1dcf-4e22-940a-cc42debd9c4c	87f60111-3a02-4069-8754-939519f685d9	CS-002	2500000	0.0200	2024-01-15	active	4-year, 1-year cliff	Founder shares with 4-year vesting, 1-year cliff
\.


--
-- Data for Name: share_classes; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.share_classes (id, company_id, name, type, price_per_share, authorized_shares, board_approval_date, liquidation_preference) FROM stdin;
e58917d8-54f6-4049-8f45-b09aa7c4d5e6	34217844-6950-47f4-a038-72742ce3c0af	Series A Preferred	preferred	1.2500	1500000	2025-03-01	1.00
8ddf7d3c-731d-4785-a639-c624010d4b5b	34217844-6950-47f4-a038-72742ce3c0af	Employee Stock Options	options	0.5000	500000	2024-06-15	0.00
87f60111-3a02-4069-8754-939519f685d9	34217844-6950-47f4-a038-72742ce3c0af	Common Stock	common	0.0200	8000000	2024-01-15	1.00
\.


--
-- Data for Name: stakeholders; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.stakeholders (id, company_id, user_id, name, email, type, title, address, avatar_initials) FROM stdin;
9dd26f3e-4453-4edc-83b6-538ef11a7c3c	34217844-6950-47f4-a038-72742ce3c0af	\N	Sarah Mitchell	sarah@archertech.com	founder	CEO & Co-Founder	\N	SM
fbacebb8-1dcf-4e22-940a-cc42debd9c4c	34217844-6950-47f4-a038-72742ce3c0af	\N	James Carter	james@archertech.com	founder	CTO & Co-Founder	\N	JC
85c33785-03a2-4674-a5f2-a04e3d9c2243	34217844-6950-47f4-a038-72742ce3c0af	\N	Haystack Capital Partners	deals@haystackcap.com	investor	Lead Investor	2800 Sand Hill Rd, Menlo Park, CA 94025	HC
436c0217-bd29-4b2a-af88-434144022f53	34217844-6950-47f4-a038-72742ce3c0af	\N	Wei Chen	wei.chen@blueridgevc.com	investor	Investor	88 Post St, Suite 1200, San Francisco, CA 94104	WC
b11b12c8-21d4-4e7e-b83f-c1a6daa957a7	34217844-6950-47f4-a038-72742ce3c0af	\N	Priya Patel	priya@catalystventures.com	investor	Seed Investor	335 Pioneer Way, Mountain View, CA 94041	PP
efaeaf4b-32f4-4eb5-b54a-b572d0d6de93	34217844-6950-47f4-a038-72742ce3c0af	\N	Michael Reynolds	michael@archertech.com	employee	VP Engineering	\N	MR
01b066f1-a359-42dd-a12f-7c3fd3261f3d	34217844-6950-47f4-a038-72742ce3c0af	\N	Kenji Tanaka	kenji@archertech.com	employee	Head of Product	\N	KT
5ee01de8-6233-4d16-85bd-8abe6253e1cc	34217844-6950-47f4-a038-72742ce3c0af	\N	Robert Harrison	robert@harrisonadvisory.com	advisor	Strategic Advisor	\N	RH
2e413580-8e11-4e2e-bc08-b56e13c2c790	34217844-6950-47f4-a038-72742ce3c0af	58e8d28a-8d76-4fbc-86df-e7b4cb6e9eff	John Doe	johndoe@archertech.com	employee	Senior Engineer	\N	JD
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.users (id, username, password) FROM stdin;
\.


--
-- Data for Name: warrants; Type: TABLE DATA; Schema: tenant_acme; Owner: -
--

COPY tenant_acme.warrants (id, company_id, stakeholder_id, name, underlying_share_class, shares, exercise_price, issue_date, expiration_date, vesting_schedule, status, exercised_date, exercised_shares, notes, created_at) FROM stdin;
8b467c96-562e-4b0a-9771-cb787897cf44	34217844-6950-47f4-a038-72742ce3c0af	85c33785-03a2-4674-a5f2-a04e3d9c2243	Series A Warrant	Preferred Series A	50000	2.5000	2024-09-15	2029-09-15	\N	active	\N	0	Issued as part of Series A financing round to Haystack Capital Partners.	2026-02-27T03:45:55.905Z
625ca1e6-4d88-4fdc-ab0e-a502126a299e	34217844-6950-47f4-a038-72742ce3c0af	436c0217-bd29-4b2a-af88-434144022f53	Bridge Loan Warrant	Common Stock	25000	1.7500	2025-01-10	2030-01-10	\N	active	\N	0	Issued in connection with bridge financing from Wei Chen.	2026-02-27T03:45:55.911Z
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.companies (id, name, legal_name, incorporation_date, incorporation_state, ein, address, total_authorized_shares) FROM stdin;
08682406-2c23-4028-92b5-17c12a719ef8	Archer Technologies Inc.	Archer Technologies, Inc.	2024-01-15	Delaware	12-3456789	123 Innovation Way, San Francisco, CA 94107	10000000
\.


--
-- Data for Name: data_store_categories; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.data_store_categories (id, org_id, name, created_at) FROM stdin;
e669e116-1d65-4712-900f-cb2fe08268ad	08682406-2c23-4028-92b5-17c12a719ef8	Test Drives	2026-02-28T06:54:46.493Z
bd57f192-55c2-4777-a48f-e91142ebfe58	08682406-2c23-4028-92b5-17c12a719ef8	Documents	2026-02-28T06:54:46.497Z
d3b1191d-8635-41f0-98bd-aef6d21ad862	08682406-2c23-4028-92b5-17c12a719ef8	Notes	2026-02-28T06:54:46.499Z
70c83b4c-2160-41cd-9c4e-a75fca0a525e	08682406-2c23-4028-92b5-17c12a719ef8	Other	2026-02-28T06:54:46.519Z
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.documents (id, company_id, name, type, description, upload_date, file_size, uploaded_by, file_url, file_size_bytes, mime_type, encrypted, content) FROM stdin;
90668ff4-eaa4-49d5-a700-46288673e596	08682406-2c23-4028-92b5-17c12a719ef8	Certificate of Incorporation	legal	Delaware C-Corp incorporation documents	2024-01-15	2.4 MB	Sarah Mitchell	\N	\N	\N	f	\N
4981be6d-9d4e-4393-b610-cae0eec14199	08682406-2c23-4028-92b5-17c12a719ef8	Series A Term Sheet	investor	Signed term sheet for Series A financing	2025-02-20	1.1 MB	Sarah Mitchell	\N	\N	\N	f	\N
750d7b2a-d201-4c3c-ac98-54809ec5771a	08682406-2c23-4028-92b5-17c12a719ef8	Financial Projections 2025	financial	Revenue forecasts and financial model for 2025	2025-01-05	3.2 MB	Sarah Mitchell	\N	\N	\N	f	\N
f0c97962-e503-469d-8af4-3d8b5803a30e	08682406-2c23-4028-92b5-17c12a719ef8	Board Meeting Minutes - Q4 2024	corporate	Minutes from the Q4 2024 board meeting	2025-01-10	850 KB	James Carter	\N	\N	\N	f	\N
387fb6e8-e567-4b13-91d7-419d4f7d0b23	08682406-2c23-4028-92b5-17c12a719ef8	Employee Stock Option Plan	legal	2024 ESOP agreement and schedule	2024-06-15	1.8 MB	Sarah Mitchell	\N	\N	\N	f	\N
d8c70c3f-7219-4f6d-bc29-afee7e250d8a	08682406-2c23-4028-92b5-17c12a719ef8	Test Drive Checklist — Warrants	other	[Category: Test Drives] | Page: /equity-plans/warrants	2026-02-28	\N	System	\N	\N	\N	f	\N
e3244bc1-7c11-4f23-a373-a6f0050cac80	08682406-2c23-4028-92b5-17c12a719ef8	Test Drive Checklist — Pools	other	[Category: Test Drives] | Page: /equity-plans/pools	2026-02-28	\N	System	\N	\N	\N	f	\N
f7dc770d-9050-4466-8475-168d4d71e264	08682406-2c23-4028-92b5-17c12a719ef8	Test Drive Checklist — Plans	other	[Category: Test Drives] | Page: /equity-plans/plans	2026-02-28	\N	System	\N	\N	\N	f	\N
b41d547d-2722-47ff-a1a8-6e7e2fc82b04	08682406-2c23-4028-92b5-17c12a719ef8	Test Drive Checklist — Grants	other	[Category: Test Drives] | Page: /equity-plans/grants	2026-02-28	\N	System	\N	\N	\N	f	\N
ce80bdea-f486-4652-b61f-19c12560bc3b	08682406-2c23-4028-92b5-17c12a719ef8	Test Drive Checklist — Exercising	other	[Category: Test Drives] | Page: /equity-plans/exercising	2026-02-28	\N	System	\N	\N	\N	f	\N
68d67024-4305-44bd-a6f3-d40efe0f5f83	08682406-2c23-4028-92b5-17c12a719ef8	Test Drive Checklist — Phantom Shares	other	[Category: Test Drives] | Page: /equity-plans/phantom	2026-02-28	\N	System	\N	\N	\N	f	\N
2ad75ab8-4b83-4f6a-9732-dab8efcb69f0	08682406-2c23-4028-92b5-17c12a719ef8	Test Drive Checklist — SARs	other	[Category: Test Drives] | Page: /equity-plans/sars	2026-02-28	\N	System	\N	\N	\N	f	\N
10749443-8cb2-4d8a-8bd5-c5dc378a0194	08682406-2c23-4028-92b5-17c12a719ef8	Series A Term Sheet — Quantum Innovations Inc.	investor	[Category: Test Drives] | Haylo AI Sample Term Sheet\n\nSERIES A PREFERRED STOCK TERM SHEET\nQuantum Innovations Inc.\nConfidential — For Discussion Purposes Only\n\nDate: March 15, 2025\n\nPARTIES\nIssuer: Archer Technologies, Inc. (the "Company")\nLead Investor: Quantum Innovations Inc. ("Lead Investor")\nRound Type: Series A Preferred Stock Financing\n\nOFFERING TERMS\nAggregate Amount: $5,000,000\nPre-Money Valuation: $20,000,000\nPost-Money Valuation: $25,000,000\nPrice Per Share: $20.00\nShares Issued: 250,000 shares of Series A Preferred Stock\n\nCAPITALIZATION SUMMARY (PRE-CLOSE)\nCommon Stock Outstanding: 5,500,000 shares (Sarah Mitchell: 3,000,000; James Carter: 2,500,000)\nSeries A Preferred Outstanding: 1,200,000 shares (Haystack Capital: 800,000; Wei Chen: 400,000)\nOptions Outstanding: 300,000 shares (Michael Reynolds: 150,000; Kenji Tanaka: 100,000; Robert Harrison: 50,000)\nTotal Fully Diluted: 7,000,000 shares\n\nSAFES PENDING CONVERSION\nPriya Patel — $500,000 Post-Money SAFE at $10M cap, 20% discount\nHaystack Capital — $250,000 Post-Money SAFE at $8M cap\nWei Chen — $150,000 Pre-Money SAFE at $12M cap, 15% discount\n\nTERMS AND CONDITIONS\nLiquidation Preference: 1x non-participating\nAnti-Dilution: Broad-based weighted average\nDividends: Non-cumulative, at Board discretion\nVoting Rights: As-converted basis, one vote per share\nBoard Composition: 2 Founder seats, 1 Investor seat, 1 Independent seat\nProtective Provisions: Standard Series A protective provisions per NVCA template\nESOP Expansion: Option pool to be increased to 20% of post-money capitalization pre-close\nRight of First Refusal: Company and Investors have ROFR on Common Stock transfers\nDrag-Along: Standard drag-along provisions\nInformation Rights: Quarterly financials, annual audited statements, annual budget\n\nCLOSING CONDITIONS\nSatisfactory completion of legal due diligence\nBoard approval of option pool expansion\nConversion or termination of outstanding SAFEs\nExecution of Investor Rights Agreement, Voting Agreement, and ROFR Agreement\n\nThis term sheet is non-binding except for confidentiality, exclusivity (60 days), and governing law (Delaware) provisions.	2026-04-10	\N	System	\N	\N	\N	f	\N
\.


--
-- Data for Name: esop_grants; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.esop_grants (id, company_id, pool_id, plan_id, stakeholder_id, grant_name, grant_date, shares, exercise_price, underlying_share_class, vesting_start_date, vesting_duration_months, cliff_months, vest_frequency_months, vested_shares, exercised_shares, status, notes, created_at) FROM stdin;
df32b991-ea5b-41c9-9bd1-12041be38597	08682406-2c23-4028-92b5-17c12a719ef8	4f351038-0161-41c7-a69d-f02c2ab3105a	07825901-02af-421a-be2d-1a867912bfd8	81003cda-a233-4ccd-99cf-f3d903d8b705	Stock Option Grant — Product	2024-10-15	50000	2.0000	Common Stock	2024-10-15	48	12	1	0	0	active	Standard 4-year vesting with 1-year cliff. Engineering team member.	2026-02-27T06:02:27.771Z
5bd4b20c-72db-4015-844d-523f78ea1ef3	08682406-2c23-4028-92b5-17c12a719ef8	4f351038-0161-41c7-a69d-f02c2ab3105a	7c01a6e8-de67-4908-82e4-df83610c4062	96b8cdc2-096c-4d3d-8023-522bb2613139	Leadership RSU Grant	2025-01-15	25000	0.0000	Common Stock	2025-01-15	36	0	3	0	0	active	Quarterly vesting RSU for VP-level leadership.	2026-02-27T06:02:27.781Z
dd44bc2e-a548-4ce0-9a67-6d6db2d77953	08682406-2c23-4028-92b5-17c12a719ef8	4f351038-0161-41c7-a69d-f02c2ab3105a	07825901-02af-421a-be2d-1a867912bfd8	96b8cdc2-096c-4d3d-8023-522bb2613139	Stock Option Grant — Engineering	2024-08-01	75000	1.5000	Common Stock	2024-08-01	48	12	1	28125	28125	partially_exercised	Standard 4-year vesting with 1-year cliff. Engineering team member.	2026-02-27T06:02:27.767Z
4153c76a-202e-462c-8292-829b5ef5661b	08682406-2c23-4028-92b5-17c12a719ef8	87e57182-d304-4df0-9dcd-043f3620ec01	07825901-02af-421a-be2d-1a867912bfd8	92734aaa-c9e6-4a15-809a-170101f07c9c	Stock Option Grant — Dev Team	2025-02-01	50000	2.0000	Common Stock	2025-02-01	48	12	1	0	0	active	Standard 4-year vesting with 1-year cliff. Dev team member.	2026-02-28T04:08:10.839Z
\.


--
-- Data for Name: esop_plans; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.esop_plans (id, company_id, pool_id, name, approved_date, grant_type, grant_presets, documents, internal_note, created_at) FROM stdin;
07825901-02af-421a-be2d-1a867912bfd8	08682406-2c23-4028-92b5-17c12a719ef8	4f351038-0161-41c7-a69d-f02c2ab3105a	Engineering Stock Option Plan	2024-07-01	stock_options	\N	\N	Standard 4-year vesting with 1-year cliff for engineering team members.	2026-02-27T02:48:27.730Z
7c01a6e8-de67-4908-82e4-df83610c4062	08682406-2c23-4028-92b5-17c12a719ef8	4f351038-0161-41c7-a69d-f02c2ab3105a	Leadership RSU Plan	2024-09-15	stock	\N	\N	Restricted stock units for VP-level and above. 3-year vesting, quarterly.	2026-02-27T02:48:27.733Z
704f3d66-d80d-4124-a251-0034ee76ecf2	08682406-2c23-4028-92b5-17c12a719ef8	4f351038-0161-41c7-a69d-f02c2ab3105a	Advisor Warrant Program	2025-01-10	warrants	\N	\N	Strategic advisor warrants. 2-year vesting, no cliff.	2026-02-27T02:48:27.736Z
\.


--
-- Data for Name: esop_pools; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.esop_pools (id, company_id, name, approved_date, underlying_share_class, allocated_shares, granted_shares, vested_shares, exercised_shares, created_at) FROM stdin;
87e57182-d304-4df0-9dcd-043f3620ec01	08682406-2c23-4028-92b5-17c12a719ef8	2025 Expansion Pool	2025-04-01	Common Stock	250000	50000	0	0	2025-04-01
4f351038-0161-41c7-a69d-f02c2ab3105a	08682406-2c23-4028-92b5-17c12a719ef8	2024 Employee Option Pool	2024-06-15	Common Stock	500000	190500	75000	28125	2024-06-15
\.


--
-- Data for Name: haylo_intents; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.haylo_intents (id, tenant_id, user_id, natural_language_input, structured_intent, grok_raw_response, status, proof_request_id, rejection_reason, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: investment_rounds; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.investment_rounds (id, company_id, round_name, round_date, created_at) FROM stdin;
23f997e5-5f69-41d7-8295-16340ec137f8	08682406-2c23-4028-92b5-17c12a719ef8	Seed Round	2024-03-15	2026-02-27T02:05:48.777Z
3b2c43b3-e90a-43f0-8fef-0d93b4ad8521	08682406-2c23-4028-92b5-17c12a719ef8	Series A	2025-03-01	2026-02-27T02:05:48.780Z
244e3a0b-b852-4106-98a9-bd10c67b5d67	08682406-2c23-4028-92b5-17c12a719ef8	Bridge Round	2025-12-01	2026-02-27T02:05:48.783Z
\.


--
-- Data for Name: investor_updates; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.investor_updates (id, company_id, title, content, status, sent_date, created_date, recipient_count) FROM stdin;
81499501-e5b4-49fc-ada4-5d6d8f6e257f	08682406-2c23-4028-92b5-17c12a719ef8	Q4 2024 Investor Update	Dear Investors,\n\nWe're excited to share our Q4 2024 progress.\n\nHighlights:\n- Revenue grew 45% QoQ to $850K ARR\n- Launched enterprise tier with 3 Fortune 500 customers\n- Team expanded to 18 members\n- Closed Series A term sheet with Haystack Capital leading\n\nKey Metrics:\n- MRR: $71K\n- Customers: 127 (up from 89)\n- NRR: 135%\n- Burn Rate: $180K/mo\n- Runway: 24 months\n\nLooking Ahead:\nWe're focused on scaling our go-to-market motion and building out the enterprise feature set. We expect to close Series A in Q1 2025.\n\nThank you for your continued support.\n\nBest,\nSarah Mitchell\nCEO, Archer Technologies	sent	2025-01-15	2025-01-12	3
c5a48e61-96be-4b10-9ef2-dd46b81507dc	08682406-2c23-4028-92b5-17c12a719ef8	Q2 2025 Investor Update (Draft)	Dear Investors,\n\nHere's our mid-year update.\n\nHighlights:\n- Revenue tracking to $2M ARR\n- Expansion into European market\n- SOC 2 Type II certification achieved\n- Product-led growth motion gaining traction\n\nKey Metrics:\n- MRR: $165K\n- Customers: 220+\n- Enterprise accounts: 8	draft	\N	2025-07-01	0
86fc783d-a382-408e-8189-b0df8ae0c7e4	08682406-2c23-4028-92b5-17c12a719ef8	Q1 2025 Investor Update	Dear Investors,\n\nQ1 2025 has been a transformative quarter for Archer Technologies.\n\nHighlights:\n- Successfully closed $2.5M Series A led by Haystack Capital Partners\n- Revenue reached $1.2M ARR\n- Launched API v2.0 with 10x performance improvement\n- Hired VP Engineering (Michael Reynolds, ex-Stripe)\n\nKey Metrics:\n- MRR: $100K\n- Customers: 168\n- NRR: 142%\n- Team: 22 members\n\nWe're entering an exciting growth phase. More details in our upcoming board meeting.\n\nBest,\nSarah	sent	2025-04-10	2025-04-08	3
\.


--
-- Data for Name: phantom_grants; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.phantom_grants (id, company_id, stakeholder_id, grant_name, grant_date, shares_equivalent, grant_price_per_unit, plan_type, vesting_schedule, cliff_months, vesting_months, payout_trigger, payout_date, payout_amount, current_share_price, status, notes, created_at) FROM stdin;
27caa557-6181-456e-b872-a0d40adb59b9	08682406-2c23-4028-92b5-17c12a719ef8	96b8cdc2-096c-4d3d-8023-522bb2613139	Executive Phantom Plan	2024-08-01	10000	5.0000	full_value	4-year with 1-year cliff, monthly thereafter	12	48	exit	\N	\N	\N	active	Full value phantom plan for senior engineering leadership. Payout at exit event.	2026-02-27T04:26:38.890Z
838cb4f8-eefa-4f7b-9e58-c1e272203ccb	08682406-2c23-4028-92b5-17c12a719ef8	81003cda-a233-4ccd-99cf-f3d903d8b705	Growth Incentive Plan	2025-01-15	5000	3.0000	appreciation_only	3-year with 6-month cliff	6	36	ipo	\N	\N	\N	active	Appreciation-only phantom plan. Payout equals share price increase above $3.00 grant price.	2026-02-27T04:26:38.894Z
\.


--
-- Data for Name: privacy_labels; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.privacy_labels (id, company_id, stakeholder_id, hashed_id, encrypted_label, created_at) FROM stdin;
90faf50d-4053-4d58-b53a-63951f58b078	08682406-2c23-4028-92b5-17c12a719ef8	c46ccae3-2e0b-40f2-b604-ff79cdcd960c	5e6e2a3d972e65546628873bbb22335aa123da6d67f2209ceecb30c9e9b1378f	WNEJ-27P2	2026-03-16T20:56:29.697Z
178781a8-eda6-4ddb-9962-a80088e6cc76	08682406-2c23-4028-92b5-17c12a719ef8	7ca094ea-4406-4057-b0a4-84c6cc03e683	ad701e2ffdb7d7ce7357ab24a92e289c3427793ba88aa3208022c6c5e1abe1e4	CC9R-XPS7	2026-03-16T20:56:29.701Z
ff472b05-8825-4d2e-821f-5b00d126d01d	08682406-2c23-4028-92b5-17c12a719ef8	0e56b81a-ece6-49d0-8516-d3c936db4f8e	0b1e77183240eaaf51271f32399a962fdeade2742c052264c4ffc6643b1893d8	HH7H-KR72	2026-03-16T20:56:29.705Z
a8cc3d19-4ece-4489-975e-0e1707916cb2	08682406-2c23-4028-92b5-17c12a719ef8	382b3c5e-1acc-4a25-8b1a-ddd03784fd2a	08b2e12a3e4b0dafb25399b4894b5207e91d1bbeb125c4a8a81587954ca44278	9J5J-34RX	2026-03-16T20:56:29.716Z
3a98b2f4-e339-460b-adec-81e800d3182e	08682406-2c23-4028-92b5-17c12a719ef8	b9856acd-3507-42dc-b383-24d91acfb035	fe763af3be08948b6efd6e0739793092781235929c83944cf0da5cd0db719edf	ABJL-4WHJ	2026-03-16T20:56:29.720Z
f934fd38-6c3c-4b67-9227-7c2cd2c1af92	08682406-2c23-4028-92b5-17c12a719ef8	96b8cdc2-096c-4d3d-8023-522bb2613139	fdbc69281f76b434413db3a8067c22cb77ed3ad50de4612ba8f1d34393c4e6ca	URPC-2S8W	2026-03-16T20:56:29.724Z
d44b3fea-9057-4c07-a788-940c452b58af	08682406-2c23-4028-92b5-17c12a719ef8	81003cda-a233-4ccd-99cf-f3d903d8b705	eddeaa0a3a907154ead523cd91b23384da2db5107566078ec0a504b91f4e15a6	MY6M-RTZ5	2026-03-16T20:56:29.728Z
7bf6d2d5-b7cc-4871-8caa-3226990f88ad	08682406-2c23-4028-92b5-17c12a719ef8	3504ffe7-fc77-4b40-a65a-1449b6289d39	1b634724a975818391fdfe3ebf1fff48d600437701b2693ca14a205d80785707	S2U3-P7MQ	2026-03-16T20:56:29.731Z
db5899ac-4a96-4aa1-b715-66d337abb8d8	08682406-2c23-4028-92b5-17c12a719ef8	92734aaa-c9e6-4a15-809a-170101f07c9c	3c7c75d343ed7e99b7418375b9b46c6c7ffcca19798c621cb0d09e7f8f32b7b2	PSSY-F5YH	2026-03-16T20:56:29.737Z
\.


--
-- Data for Name: safe_agreements; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.safe_agreements (id, company_id, stakeholder_id, investment_amount, valuation_cap, discount_rate, safe_type, status, issue_date, conversion_date, notes, investment_round_id, investment_round_name, raise_goal, end_date, template_variables, template_id, doc_ref) FROM stdin;
1d2f3f46-1a10-4f52-91e9-d753818dc313	08682406-2c23-4028-92b5-17c12a719ef8	0e56b81a-ece6-49d0-8516-d3c936db4f8e	250000.00	8000000.00	\N	post-money	signed	2024-04-15	\N	Early bridge SAFE	\N	\N	\N	\N	\N	\N	\N
3578efe3-fe47-4f01-891d-24b587938932	08682406-2c23-4028-92b5-17c12a719ef8	382b3c5e-1acc-4a25-8b1a-ddd03784fd2a	150000.00	12000000.00	15.00	pre-money	draft	2025-12-01	\N	Pending bridge round SAFE	\N	\N	\N	\N	\N	\N	\N
a1e50453-32fa-4ae7-938a-141a84852856	08682406-2c23-4028-92b5-17c12a719ef8	b9856acd-3507-42dc-b383-24d91acfb035	500000.00	10000000.00	20.00	post-money	signed	2024-06-01	\N	YC standard SAFE agreement	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: safe_templates; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.safe_templates (id, template_name, template_type, template_version, description, raw_content, is_active, is_default, created_at, updated_at) FROM stdin;
37e705fb-2372-4356-a1c6-8cb591ee0edb	Standard SAFE Agreement	safe	1.0	Y Combinator standard post-money SAFE template with valuation cap and discount provisions.	THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED (THE "SECURITIES ACT"), OR UNDER THE SECURITIES LAWS OF CERTAIN STATES. THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR HYPOTHECATED EXCEPT AS PERMITTED IN THIS SAFE AND UNDER THE ACT AND APPLICABLE STATE SECURITIES LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.\n\n\nSIMPLE AGREEMENT FOR FUTURE EQUITY\n\n\nParties\n\n{{company_name}}, a {{state_of_registration}} corporation ("Company").\nThe party set out in Schedule 1 ("Investor").\n\n\nEXECUTED AS AN AGREEMENT\n\n\nAgreed Terms\n\nTHIS CERTIFIES THAT in exchange for the payment by {{investor_name}} {{investor_trust_name}} {{investor_trust_number}} (the "Investor") of {{purchase_amount}} (the "Purchase Amount"), {{company_name}}, a {{state_of_registration}} corporation (the "Company"), issues to the Investor the right to certain shares of the Company's Capital Stock, subject to the terms described below.\n\n\n1. Events\n\n(a) Equity Financing.\n\nIf there is an Equity Financing before the termination of this Safe, on the initial closing of such Equity Financing, this Safe will automatically convert into the number of shares of Safe Preferred Stock equal to the Purchase Amount divided by the Conversion Price.\n\nIn connection with the automatic conversion of this Safe into shares of Safe Preferred Stock, the Investor will execute and deliver to the Company all of the transaction documents related to the Equity Financing; provided, that such documents are the same documents to be entered into with the purchasers of Standard Preferred Stock, with appropriate variations for the Safe Preferred Stock if applicable, and provided further, that such documents have customary exceptions to any drag-along applicable to the Investor.\n\n(b) Liquidity Event.\n\nIf there is a Liquidity Event before the termination of this Safe, this Safe will automatically be entitled to receive a portion of Proceeds, due and payable to the Investor immediately prior to, or concurrent with, the consummation of such Liquidity Event, equal to the greater of (i) the Purchase Amount (the "Cash-Out Amount") or (ii) the amount payable on the number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price (the "Conversion Amount").\n\nNotwithstanding the foregoing, in connection with a Change of Control intended to qualify as a tax-free reorganization, the Company may reduce the cash portion of Proceeds payable to the Investor by the amount determined by its board of directors in good faith for such Change of Control to qualify as a tax-free reorganization for U.S. federal income tax purposes, provided that such reduction (A) does not reduce the total Proceeds payable to such Investor and (B) is applied in the same manner and proportion to all holders of Safes.\n\n(c) Dissolution Event.\n\nIf there is a Dissolution Event before the termination of this Safe, the Investor will automatically be entitled to receive a portion of Proceeds equal to the Cash-Out Amount, due and payable to the Investor immediately prior to the consummation of the Dissolution Event.\n\n(d) Liquidation Priority.\n\nIn a Liquidity Event or Dissolution Event, this Safe is intended to operate like standard non-participating Preferred Stock. The Investor's right to receive its Cash-Out Amount is:\n\n(i) Junior to payment of outstanding indebtedness and creditor claims, including contractual claims for payment and convertible promissory notes (to the extent such convertible promissory notes are not actually or notionally converted into Capital Stock);\n\n(ii) On par with payments for other Safes and/or Preferred Stock, and if the applicable Proceeds are insufficient to permit full payments to the Investor and such other Safes and/or Preferred Stock, the applicable Proceeds will be distributed pro rata to the Investor and such other Safes and/or Preferred Stock in proportion to the full payments that would otherwise be due; and\n\n(iii) Senior to payments for Common Stock.\n\nThe Investor's right to receive its Conversion Amount is (A) on par with payments for Common Stock and other Safes and/or Preferred Stock who are also receiving Conversion Amounts or Proceeds on a similar as-converted to Common Stock basis, and (B) junior to payments described in clauses (i) and (ii) above (in the latter case, to the extent such payments are Cash-Out Amounts or similar liquidation preferences).\n\n(e) Termination.\n\nThis Safe will automatically terminate (without relieving the Company of any obligations arising from a prior breach of or non-compliance with this Safe) immediately following the earliest to occur of: (i) the issuance of Capital Stock to the Investor pursuant to the automatic conversion of this Safe under Section 1(a); or (ii) the payment, or setting aside for payment, of amounts due the Investor pursuant to Section 1(b) or Section 1(c).\n\n\n2. Definitions\n\n"Capital Stock" means the capital stock of the Company, including, without limitation, the "Common Stock" and the "Preferred Stock."\n\n"Change of Control" means (i) a transaction or series of related transactions in which any "person" or "group" becomes the "beneficial owner", directly or indirectly, of more than 50% of the outstanding voting securities of the Company having the right to vote for the election of members of the Company's board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a transaction or series of related transactions in which the holders of the voting securities of the Company outstanding immediately prior to such transaction or series of related transactions retain, immediately after such transaction or series of related transactions, at least a majority of the total voting power represented by the outstanding voting securities of the Company or such other surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially all of the assets of the Company.\n\n"Company Capitalization" is calculated as of immediately prior to the Equity Financing and includes all shares of Capital Stock issued and outstanding, all Converting Securities, all issued and outstanding Options and Promised Options, and the Unissued Option Pool.\n\n"Converting Securities" includes this Safe and other convertible securities issued by the Company.\n\n"Conversion Price" means either: (1) the Safe Price or (2) the Discount Price, whichever calculation results in a greater number of shares of Safe Preferred Stock.\n\n"Discount Price" means the price per share of the Standard Preferred Stock sold in the Equity Financing multiplied by the Discount Rate.\n\n"Discount Rate" means 100% minus {{discount_percentage}}.\n\n"Dissolution Event" means (i) a voluntary termination of operations, (ii) a general assignment for the benefit of the Company's creditors or (iii) any other liquidation, dissolution or winding up of the Company (excluding a Liquidity Event), whether voluntary or involuntary.\n\n"Equity Financing" means a bona fide transaction or series of transactions with the principal purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a fixed valuation.\n\n"Liquidity Capitalization" is calculated as of immediately prior to the Liquidity Event.\n\n"Liquidity Event" means a Change of Control or an Initial Public Offering.\n\n"Liquidity Price" means the price per share equal to the Post-Money Valuation Cap divided by the Liquidity Capitalization.\n\n"Options" includes options, restricted stock awards or purchases, RSUs, SARs, warrants or similar securities, vested or unvested.\n\n"Post-Money Valuation Cap" has the meaning set out in Schedule 1.\n\n"Proceeds" means cash and other assets that are proceeds from the Liquidity Event or the Dissolution Event, as applicable, and legally available for distribution.\n\n"Safe Price" means the price per share equal to the Post-Money Valuation Cap divided by the Company Capitalization.\n\n"Standard Preferred Stock" means the shares of the series of Preferred Stock issued to the investors investing new money in the Company in connection with the initial closing of the Equity Financing.\n\n\n3. Company Representations\n\n(a) The Company is a corporation duly organized, validly existing and in good standing under the laws of its state of incorporation, and has the power and authority to own, lease and operate its properties and carry on its business as now conducted.\n\n(b) The execution, delivery and performance by the Company of this Safe is within the power of the Company and has been duly authorized by all necessary actions on the part of the Company. This Safe constitutes a legal, valid and binding obligation of the Company.\n\n(c) The performance and consummation of the transactions contemplated by this Safe do not and will not violate any material judgment, statute, rule or regulation applicable to the Company.\n\n(d) No consents or approvals are required in connection with the performance of this Safe, other than the Company's corporate approvals and any qualifications or filings under applicable securities laws.\n\n(e) To its knowledge, the Company owns or possesses sufficient legal rights to all intellectual property necessary for its business as now conducted.\n\n\n4. Investor Representations\n\n(a) The Investor has full legal capacity, power and authority to execute and deliver this Safe and to perform its obligations hereunder.\n\n(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D under the Securities Act.\n\n\n5. Miscellaneous\n\n(a) Any provision of this Safe may be amended, waived or modified by written consent of the Company and the Investor.\n\n(b) Any notice required or permitted by this Safe will be deemed sufficient when delivered personally or by overnight courier or sent by email.\n\n(c) The Investor is not entitled, as a holder of this Safe, to vote or be deemed a holder of Capital Stock for any purpose other than tax purposes.\n\n(d) Neither this Safe nor the rights in this Safe are transferable or assignable, by operation of law or otherwise, by either party without the prior written consent of the other.\n\n(e) In the event any one or more of the provisions of this Safe is for any reason held to be invalid, illegal or unenforceable, such provision(s) only will be deemed null and void.\n\n(f) All rights and obligations hereunder will be governed by the laws of the State that the Company is registered in.\n\n(g) The parties acknowledge and agree that for United States federal and state income tax purposes this Safe is, and at all times has been, intended to be characterized as stock.\n\n\nSchedule 1 - SAFE Details\n\nInvestor Details\n\nItem 1: Investor\n{{investor_name}}\n\nItem 2: Address\n{{investor_address}}\n\nItem 3: Email\n{{investor_email}}\n\nItem 4: Trust Details (if applicable)\n{{investor_trust_name}} {{investor_trust_number}}\n\nKey Terms\n\nItem 5: Purchase Amount\n{{purchase_amount}}\n\nItem 6: Discount Rate\n{{discount_percentage}}\n\nItem 7: Valuation Cap\n{{valuation_cap}} ({{pre_post_money}}-money)\n\nItem 8: Investment Round\n{{investment_round}}\n\nItem 9: Raise Goal\n{{raise_goal}}\n\nItem 10: End Date\n{{end_date}}\n\nItem 11: Effective Date\n{{effective_date}}\n\nItem 12: SAFE Reference\n{{safe_id}}\n\nAdditional Notes\n{{notes}}	t	t	2026-02-27T02:05:48.801Z	2026-02-27T02:05:48.801Z
1182ab10-c628-4475-9c09-1bd2f9859ed7	Convertible Note Agreement	convertible_note	1.0	Standard convertible promissory note with interest rate, maturity date, and qualified financing conversion.	CONVERTIBLE PROMISSORY NOTE\n\nDate: {{effective_date}}\nPrincipal Amount: {{purchase_amount}}\n\nFOR VALUE RECEIVED, {{company_name}}, a {{state_of_registration}} corporation (the "Company"), hereby promises to pay to the order of {{investor_name}} (the "Holder"), the principal sum of {{purchase_amount}} (the "Principal Amount"), together with interest thereon from the date hereof at the rate of {{interest_rate}} per annum (the "Interest Rate"), upon the terms and conditions set forth herein.\n\n1. MATURITY DATE\nUnless earlier converted pursuant to Section 3 below, all unpaid principal, together with any unpaid and accrued interest, shall be due and payable on demand by the Holder at any time on or after {{maturity_date}} (the "Maturity Date").\n\n2. INTEREST\nInterest shall accrue on the unpaid principal balance of this Note at the Interest Rate, computed on the basis of the actual number of days elapsed and a year of 365 days. Interest shall be payable upon maturity or conversion, whichever occurs first.\n\n3. CONVERSION\n3.1 Automatic Conversion. Upon the closing of a Qualified Financing (as defined below), the outstanding principal and accrued interest under this Note shall automatically convert into shares of the equity securities issued in such Qualified Financing at a conversion price equal to the lesser of:\n(a) {{valuation_cap}} divided by the Company's fully diluted capitalization immediately prior to the closing of such Qualified Financing (the "Cap Price"); or\n(b) {{discount_percentage}} discount to the price per share paid by the investors in such Qualified Financing (the "Discount Price").\n\n3.2 Qualified Financing. A "Qualified Financing" means the next sale (or series of related sales) by the Company of its equity securities following the date hereof from which the Company receives gross proceeds of not less than {{qualified_financing_amount}} (excluding the conversion of this Note and other convertible securities).\n\n3.3 Voluntary Conversion. At any time prior to the Maturity Date, the Holder may elect to convert all outstanding principal and accrued interest into shares of the Company's common stock at a conversion price based on the {{pre_post_money}} valuation cap of {{valuation_cap}}.\n\n4. EVENTS OF DEFAULT\nThe following shall constitute Events of Default:\n(a) The Company fails to pay any amount due under this Note within five (5) business days of when due;\n(b) The Company files for bankruptcy or makes an assignment for the benefit of creditors;\n(c) A material adverse change occurs in the Company's business, operations, or financial condition.\n\n5. REPRESENTATIONS AND WARRANTIES\n5.1 The Company represents and warrants that it is duly organized and validly existing under the laws of the State of {{state_of_registration}}.\n5.2 The Company has full power and authority to execute and deliver this Note.\n\n6. MISCELLANEOUS\n6.1 This Note shall be governed by and construed in accordance with the laws of the State of {{state_of_registration}}.\n6.2 Any notices required hereunder shall be sent to:\n\nCompany: {{company_name}}\nAddress: {{company_address}}\n\nHolder: {{investor_name}}\nAddress: {{investor_address}}\nEmail: {{investor_email}}\n\nIN WITNESS WHEREOF, the Company has executed this Convertible Promissory Note as of the date first written above.\n\n{{company_name}}\n\nBy: ___________________________\nName:\nTitle:\n\nHOLDER:\n\n{{investor_name}}\n\nBy: ___________________________\n\nSchedule of Terms:\nInvestment Round: {{investment_round}}\nRaise Goal: {{raise_goal}}\nEnd Date: {{end_date}}\nReference: {{safe_id}}\n\n{{notes}}	t	t	2026-02-27T02:05:48.807Z	2026-02-27T02:05:48.807Z
706aeba5-6954-4134-8829-a6a08ac22e57	Warrant Agreement	warrant	1.0	Stock purchase warrant with exercise price, expiration date, and net exercise provisions.	STOCK PURCHASE WARRANT\n\nTHIS WARRANT AND THE SHARES ISSUABLE UPON EXERCISE HEREOF HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED.\n\nWarrant No.: {{safe_id}}\nDate of Issuance: {{effective_date}}\n\n{{company_name}}, a {{state_of_registration}} corporation (the "Company"), hereby certifies that, for value received, {{investor_name}} (the "Holder"), is entitled to purchase from the Company up to {{number_of_shares}} shares of the Company's Common Stock (the "Warrant Shares") at an exercise price of {{exercise_price}} per share (the "Exercise Price"), subject to the terms and conditions set forth herein.\n\n1. EXERCISE OF WARRANT\n1.1 Exercise Period. This Warrant may be exercised, in whole or in part, at any time and from time to time on or after the date hereof and on or before {{expiration_date}} (the "Expiration Date").\n\n1.2 Method of Exercise. This Warrant shall be exercised by the Holder by:\n(a) Delivery to the Company of a duly executed Exercise Notice in the form attached hereto; and\n(b) Payment of the aggregate Exercise Price for the Warrant Shares being purchased, by cash, check, or wire transfer.\n\n1.3 Net Exercise. In lieu of exercising this Warrant by payment of the Exercise Price, the Holder may elect to receive shares equal to the value of this Warrant (or the portion thereof being exercised) by surrender of this Warrant, in which event the Company shall issue to the Holder a number of Warrant Shares computed using the following formula:\n\nX = Y(A-B) / A\n\nWhere: X = the number of Warrant Shares to be issued\n       Y = the number of Warrant Shares for which the Warrant is being exercised\n       A = the Fair Market Value of one share of Common Stock\n       B = the Exercise Price\n\n2. ADJUSTMENTS\n2.1 Stock Splits and Dividends. If the Company effects a stock split, stock dividend, or similar transaction, the number of Warrant Shares and the Exercise Price shall be proportionally adjusted.\n\n2.2 Reorganization. In the event of any reorganization, merger, consolidation, or similar transaction, this Warrant shall be exercisable for the kind and amount of securities or other property that the Holder would have been entitled to receive had the Warrant been exercised immediately prior to such transaction.\n\n3. TRANSFER\nThis Warrant and the rights hereunder are not transferable without the prior written consent of the Company, except to affiliates of the Holder.\n\n4. REPRESENTATIONS\n4.1 The Company represents that it is duly organized under the laws of {{state_of_registration}}.\n4.2 The Warrant Shares, when issued upon proper exercise, shall be validly issued, fully paid, and non-assessable.\n\n5. MISCELLANEOUS\n5.1 Governing Law. This Warrant shall be governed by the laws of the State of {{state_of_registration}}.\n5.2 Notices. All notices shall be sent to:\n\nCompany: {{company_name}}\nAddress: {{company_address}}\n\nHolder: {{investor_name}}\nAddress: {{investor_address}}\nEmail: {{investor_email}}\n\nIN WITNESS WHEREOF, the Company has caused this Warrant to be executed as of the Date of Issuance.\n\n{{company_name}}\n\nBy: ___________________________\nName:\nTitle:\n\nInvestment Context:\nRound: {{investment_round}}\nValuation Cap: {{valuation_cap}}\nRaise Goal: {{raise_goal}}\n\n{{notes}}	t	t	2026-02-27T02:05:48.810Z	2026-02-27T02:05:48.810Z
\.


--
-- Data for Name: sars; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.sars (id, company_id, stakeholder_id, grant_name, grant_date, units, base_price, settlement_type, underlying_share_class, vesting_schedule, cliff_months, vesting_months, expiration_date, exercise_date, exercise_price, exercised_units, payout_amount, status, notes, created_at, exercise_trigger) FROM stdin;
50eea6f1-52fc-4b70-8a8a-925fd55228d5	08682406-2c23-4028-92b5-17c12a719ef8	96b8cdc2-096c-4d3d-8023-522bb2613139	VP Engineering SAR	2024-10-01	15000	4.0000	cash	\N	4-year with 1-year cliff, monthly thereafter	12	48	2034-10-01	\N	\N	0	\N	active	Cash-settled SAR for senior engineering leadership. Appreciation above $4.00 base price paid in cash.	2026-02-27T05:28:31.193Z	\N
961e5e91-b783-439a-92b6-8c003217f1d9	08682406-2c23-4028-92b5-17c12a719ef8	81003cda-a233-4ccd-99cf-f3d903d8b705	Product Lead SAR	2025-02-01	8000	5.5000	stock	Common	3-year with 6-month cliff	6	36	2035-02-01	\N	\N	0	\N	active	Stock-settled SAR. On exercise, appreciation value is converted to Common shares at current FMV.	2026-02-27T05:28:31.197Z	\N
\.


--
-- Data for Name: securities; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.securities (id, company_id, stakeholder_id, share_class_id, certificate_id, shares, price_per_share, issue_date, status, vesting_schedule, notes) FROM stdin;
f122456f-9969-49e5-9858-0d609a8de18c	08682406-2c23-4028-92b5-17c12a719ef8	c46ccae3-2e0b-40f2-b604-ff79cdcd960c	0339a324-b2eb-4167-a7cb-191d473e832f	CS-001	3000000	0.0001	2024-01-15	active	4-year, 1-year cliff	Founder shares with 4-year vesting, 1-year cliff
7c531821-c8f2-416d-82f3-9fcde6d6e5b9	08682406-2c23-4028-92b5-17c12a719ef8	0e56b81a-ece6-49d0-8516-d3c936db4f8e	fb1c9bca-1f0e-4389-ae45-f7b47c576349	SA-001	800000	1.2500	2025-03-15	active	\N	Series A lead investor
244b811a-dee6-4e47-90df-766787397b6f	08682406-2c23-4028-92b5-17c12a719ef8	7ca094ea-4406-4057-b0a4-84c6cc03e683	0339a324-b2eb-4167-a7cb-191d473e832f	CS-002	2500000	0.0001	2024-01-15	active	4-year, 1-year cliff	Founder shares with 4-year vesting, 1-year cliff
1a3fc0fc-00fa-4d66-9873-e821b431eaf6	08682406-2c23-4028-92b5-17c12a719ef8	81003cda-a233-4ccd-99cf-f3d903d8b705	0a7b06c2-d9ee-4965-aab0-98802301d362	OPT-002	100000	0.5000	2024-11-01	active	4-year, 1-year cliff	\N
9d1e0d0c-f0f6-4287-bc68-f3a871df0abb	08682406-2c23-4028-92b5-17c12a719ef8	92734aaa-c9e6-4a15-809a-170101f07c9c	0339a324-b2eb-4167-a7cb-191d473e832f	CS-003	200000	0.0001	2025-02-01	active	4-year, 1-year cliff	Employee equity grant
a2805a18-a87b-451e-b407-11c449a5e8cf	08682406-2c23-4028-92b5-17c12a719ef8	96b8cdc2-096c-4d3d-8023-522bb2613139	0a7b06c2-d9ee-4965-aab0-98802301d362	OPT-001	150000	0.5000	2024-09-01	active	4-year, 1-year cliff	\N
054c8a41-3f97-4406-89f2-45630ea0d1a8	08682406-2c23-4028-92b5-17c12a719ef8	382b3c5e-1acc-4a25-8b1a-ddd03784fd2a	fb1c9bca-1f0e-4389-ae45-f7b47c576349	SA-002	400000	1.2500	2025-03-15	active	\N	\N
4d2cc5b0-8efc-4f91-a151-597d89ccc68b	08682406-2c23-4028-92b5-17c12a719ef8	3504ffe7-fc77-4b40-a65a-1449b6289d39	0a7b06c2-d9ee-4965-aab0-98802301d362	OPT-003	50000	0.5000	2025-01-15	active	2-year, no cliff	\N
d07b61c5-0554-4a5c-947a-0a92af46fa36	08682406-2c23-4028-92b5-17c12a719ef8	96b8cdc2-096c-4d3d-8023-522bb2613139	0339a324-b2eb-4167-a7cb-191d473e832f	\N	28125	1.5000	2026-02-27	active	\N	\N
\.


--
-- Data for Name: share_classes; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.share_classes (id, company_id, name, type, price_per_share, authorized_shares, board_approval_date, liquidation_preference) FROM stdin;
0339a324-b2eb-4167-a7cb-191d473e832f	08682406-2c23-4028-92b5-17c12a719ef8	Common Stock	common	0.0001	8000000	2024-01-15	1.00
fb1c9bca-1f0e-4389-ae45-f7b47c576349	08682406-2c23-4028-92b5-17c12a719ef8	Series A Preferred	preferred	1.2500	1500000	2025-03-01	1.00
0a7b06c2-d9ee-4965-aab0-98802301d362	08682406-2c23-4028-92b5-17c12a719ef8	Employee Stock Options	options	0.5000	500000	2024-06-15	0.00
\.


--
-- Data for Name: stakeholders; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.stakeholders (id, company_id, user_id, name, email, type, title, address, avatar_initials) FROM stdin;
c46ccae3-2e0b-40f2-b604-ff79cdcd960c	08682406-2c23-4028-92b5-17c12a719ef8	\N	Sarah Mitchell	sarah@archertech.com	founder	CEO & Co-Founder	\N	SM
7ca094ea-4406-4057-b0a4-84c6cc03e683	08682406-2c23-4028-92b5-17c12a719ef8	\N	James Carter	james@archertech.com	founder	CTO & Co-Founder	\N	JC
0e56b81a-ece6-49d0-8516-d3c936db4f8e	08682406-2c23-4028-92b5-17c12a719ef8	\N	Haystack Capital Partners	deals@haystackcap.com	investor	Lead Investor	2800 Sand Hill Rd, Menlo Park, CA 94025	HC
382b3c5e-1acc-4a25-8b1a-ddd03784fd2a	08682406-2c23-4028-92b5-17c12a719ef8	\N	Wei Chen	wei.chen@blueridgevc.com	investor	Investor	88 Post St, Suite 1200, San Francisco, CA 94104	WC
b9856acd-3507-42dc-b383-24d91acfb035	08682406-2c23-4028-92b5-17c12a719ef8	\N	Priya Patel	priya@catalystventures.com	investor	Seed Investor	335 Pioneer Way, Mountain View, CA 94041	PP
96b8cdc2-096c-4d3d-8023-522bb2613139	08682406-2c23-4028-92b5-17c12a719ef8	\N	Michael Reynolds	michael@archertech.com	employee	VP Engineering	\N	MR
81003cda-a233-4ccd-99cf-f3d903d8b705	08682406-2c23-4028-92b5-17c12a719ef8	\N	Kenji Tanaka	kenji@archertech.com	employee	Head of Product	\N	KT
3504ffe7-fc77-4b40-a65a-1449b6289d39	08682406-2c23-4028-92b5-17c12a719ef8	\N	Robert Harrison	robert@harrisonadvisory.com	advisor	Strategic Advisor	\N	RH
92734aaa-c9e6-4a15-809a-170101f07c9c	08682406-2c23-4028-92b5-17c12a719ef8	\N	John Doe	johndoe@archertech.com	employee	Senior Engineer	\N	JD
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.users (id, username, password) FROM stdin;
\.


--
-- Data for Name: warrants; Type: TABLE DATA; Schema: tenant_globex; Owner: -
--

COPY tenant_globex.warrants (id, company_id, stakeholder_id, name, underlying_share_class, shares, exercise_price, issue_date, expiration_date, vesting_schedule, status, exercised_date, exercised_shares, notes, created_at) FROM stdin;
5594e166-d3b3-433f-84e6-98749bac3810	08682406-2c23-4028-92b5-17c12a719ef8	0e56b81a-ece6-49d0-8516-d3c936db4f8e	Series A Warrant	Preferred Series A	50000	2.5000	2024-09-15	2029-09-15	\N	active	\N	0	Issued as part of Series A financing round to Haystack Capital Partners.	2026-02-27T03:45:55.952Z
2ec05491-cb44-4fcb-b20d-dd229bf26d81	08682406-2c23-4028-92b5-17c12a719ef8	382b3c5e-1acc-4a25-8b1a-ddd03784fd2a	Bridge Loan Warrant	Common Stock	25000	1.7500	2025-01-10	2030-01-10	\N	active	\N	0	Issued in connection with bridge financing from Wei Chen.	2026-02-27T03:45:55.956Z
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".companies (id, name, legal_name, incorporation_date, incorporation_state, ein, address, total_authorized_shares) FROM stdin;
19c5fba4-7d2b-4eb4-84d9-ea35849889a1	New Company	\N	\N	\N	\N	\N	10000000
\.


--
-- Data for Name: data_store_categories; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".data_store_categories (id, org_id, name, created_at) FROM stdin;
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".documents (id, company_id, name, type, description, upload_date, file_size, uploaded_by, file_url, file_size_bytes, mime_type, encrypted, content) FROM stdin;
\.


--
-- Data for Name: esop_grants; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".esop_grants (id, company_id, pool_id, plan_id, stakeholder_id, grant_name, grant_date, shares, exercise_price, underlying_share_class, vesting_start_date, vesting_duration_months, cliff_months, vest_frequency_months, vested_shares, exercised_shares, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: esop_plans; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".esop_plans (id, company_id, pool_id, name, approved_date, grant_type, grant_presets, documents, internal_note, created_at) FROM stdin;
\.


--
-- Data for Name: esop_pools; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".esop_pools (id, company_id, name, approved_date, underlying_share_class, allocated_shares, granted_shares, vested_shares, exercised_shares, created_at) FROM stdin;
\.


--
-- Data for Name: haylo_intents; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".haylo_intents (id, tenant_id, user_id, natural_language_input, structured_intent, grok_raw_response, status, proof_request_id, rejection_reason, created_at, resolved_at) FROM stdin;
\.


--
-- Data for Name: investment_rounds; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".investment_rounds (id, company_id, round_name, round_date, created_at) FROM stdin;
\.


--
-- Data for Name: investor_updates; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".investor_updates (id, company_id, title, content, status, sent_date, created_date, recipient_count) FROM stdin;
\.


--
-- Data for Name: phantom_grants; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".phantom_grants (id, company_id, stakeholder_id, grant_name, grant_date, shares_equivalent, grant_price_per_unit, plan_type, vesting_schedule, cliff_months, vesting_months, payout_trigger, payout_date, payout_amount, current_share_price, status, notes, created_at) FROM stdin;
\.


--
-- Data for Name: privacy_labels; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".privacy_labels (id, company_id, stakeholder_id, hashed_id, encrypted_label, created_at) FROM stdin;
\.


--
-- Data for Name: safe_agreements; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".safe_agreements (id, company_id, stakeholder_id, investment_amount, valuation_cap, discount_rate, safe_type, status, issue_date, conversion_date, notes, investment_round_id, investment_round_name, raise_goal, end_date, template_variables, template_id, doc_ref) FROM stdin;
\.


--
-- Data for Name: safe_templates; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".safe_templates (id, template_name, template_version, raw_content, is_active, created_at, updated_at, template_type, description, is_default) FROM stdin;
9284da98-69a1-47b1-b43d-86c9abb56123	Standard SAFE Agreement	1.0	THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED (THE "SECURITIES ACT"), OR UNDER THE SECURITIES LAWS OF CERTAIN STATES. THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR HYPOTHECATED EXCEPT AS PERMITTED IN THIS SAFE AND UNDER THE ACT AND APPLICABLE STATE SECURITIES LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.\n\n\nSIMPLE AGREEMENT FOR FUTURE EQUITY\n\n\nParties\n\n{{company_name}}, a {{state_of_registration}} corporation ("Company").\nThe party set out in Schedule 1 ("Investor").\n\n\nEXECUTED AS AN AGREEMENT\n\n\nAgreed Terms\n\nTHIS CERTIFIES THAT in exchange for the payment by {{investor_name}} {{investor_trust_name}} {{investor_trust_number}} (the "Investor") of {{purchase_amount}} (the "Purchase Amount"), {{company_name}}, a {{state_of_registration}} corporation (the "Company"), issues to the Investor the right to certain shares of the Company's Capital Stock, subject to the terms described below.\n\n\n1. Events\n\n(a) Equity Financing.\n\nIf there is an Equity Financing before the termination of this Safe, on the initial closing of such Equity Financing, this Safe will automatically convert into the number of shares of Safe Preferred Stock equal to the Purchase Amount divided by the Conversion Price.\n\nIn connection with the automatic conversion of this Safe into shares of Safe Preferred Stock, the Investor will execute and deliver to the Company all of the transaction documents related to the Equity Financing; provided, that such documents are the same documents to be entered into with the purchasers of Standard Preferred Stock, with appropriate variations for the Safe Preferred Stock if applicable, and provided further, that such documents have customary exceptions to any drag-along applicable to the Investor.\n\n(b) Liquidity Event.\n\nIf there is a Liquidity Event before the termination of this Safe, this Safe will automatically be entitled to receive a portion of Proceeds, due and payable to the Investor immediately prior to, or concurrent with, the consummation of such Liquidity Event, equal to the greater of (i) the Purchase Amount (the "Cash-Out Amount") or (ii) the amount payable on the number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price (the "Conversion Amount").\n\nNotwithstanding the foregoing, in connection with a Change of Control intended to qualify as a tax-free reorganization, the Company may reduce the cash portion of Proceeds payable to the Investor by the amount determined by its board of directors in good faith for such Change of Control to qualify as a tax-free reorganization for U.S. federal income tax purposes, provided that such reduction (A) does not reduce the total Proceeds payable to such Investor and (B) is applied in the same manner and proportion to all holders of Safes.\n\n(c) Dissolution Event.\n\nIf there is a Dissolution Event before the termination of this Safe, the Investor will automatically be entitled to receive a portion of Proceeds equal to the Cash-Out Amount, due and payable to the Investor immediately prior to the consummation of the Dissolution Event.\n\n(d) Liquidation Priority.\n\nIn a Liquidity Event or Dissolution Event, this Safe is intended to operate like standard non-participating Preferred Stock. The Investor's right to receive its Cash-Out Amount is:\n\n(i) Junior to payment of outstanding indebtedness and creditor claims, including contractual claims for payment and convertible promissory notes (to the extent such convertible promissory notes are not actually or notionally converted into Capital Stock);\n\n(ii) On par with payments for other Safes and/or Preferred Stock, and if the applicable Proceeds are insufficient to permit full payments to the Investor and such other Safes and/or Preferred Stock, the applicable Proceeds will be distributed pro rata to the Investor and such other Safes and/or Preferred Stock in proportion to the full payments that would otherwise be due; and\n\n(iii) Senior to payments for Common Stock.\n\nThe Investor's right to receive its Conversion Amount is (A) on par with payments for Common Stock and other Safes and/or Preferred Stock who are also receiving Conversion Amounts or Proceeds on a similar as-converted to Common Stock basis, and (B) junior to payments described in clauses (i) and (ii) above (in the latter case, to the extent such payments are Cash-Out Amounts or similar liquidation preferences).\n\n(e) Termination.\n\nThis Safe will automatically terminate (without relieving the Company of any obligations arising from a prior breach of or non-compliance with this Safe) immediately following the earliest to occur of: (i) the issuance of Capital Stock to the Investor pursuant to the automatic conversion of this Safe under Section 1(a); or (ii) the payment, or setting aside for payment, of amounts due the Investor pursuant to Section 1(b) or Section 1(c).\n\n\n2. Definitions\n\n"Capital Stock" means the capital stock of the Company, including, without limitation, the "Common Stock" and the "Preferred Stock."\n\n"Change of Control" means (i) a transaction or series of related transactions in which any "person" or "group" becomes the "beneficial owner", directly or indirectly, of more than 50% of the outstanding voting securities of the Company having the right to vote for the election of members of the Company's board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a transaction or series of related transactions in which the holders of the voting securities of the Company outstanding immediately prior to such transaction or series of related transactions retain, immediately after such transaction or series of related transactions, at least a majority of the total voting power represented by the outstanding voting securities of the Company or such other surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially all of the assets of the Company.\n\n"Company Capitalization" is calculated as of immediately prior to the Equity Financing and includes all shares of Capital Stock issued and outstanding, all Converting Securities, all issued and outstanding Options and Promised Options, and the Unissued Option Pool.\n\n"Converting Securities" includes this Safe and other convertible securities issued by the Company.\n\n"Conversion Price" means either: (1) the Safe Price or (2) the Discount Price, whichever calculation results in a greater number of shares of Safe Preferred Stock.\n\n"Discount Price" means the price per share of the Standard Preferred Stock sold in the Equity Financing multiplied by the Discount Rate.\n\n"Discount Rate" means 100% minus {{discount_percentage}}.\n\n"Dissolution Event" means (i) a voluntary termination of operations, (ii) a general assignment for the benefit of the Company's creditors or (iii) any other liquidation, dissolution or winding up of the Company (excluding a Liquidity Event), whether voluntary or involuntary.\n\n"Equity Financing" means a bona fide transaction or series of transactions with the principal purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a fixed valuation.\n\n"Liquidity Capitalization" is calculated as of immediately prior to the Liquidity Event.\n\n"Liquidity Event" means a Change of Control or an Initial Public Offering.\n\n"Liquidity Price" means the price per share equal to the Post-Money Valuation Cap divided by the Liquidity Capitalization.\n\n"Options" includes options, restricted stock awards or purchases, RSUs, SARs, warrants or similar securities, vested or unvested.\n\n"Post-Money Valuation Cap" has the meaning set out in Schedule 1.\n\n"Proceeds" means cash and other assets that are proceeds from the Liquidity Event or the Dissolution Event, as applicable, and legally available for distribution.\n\n"Safe Price" means the price per share equal to the Post-Money Valuation Cap divided by the Company Capitalization.\n\n"Standard Preferred Stock" means the shares of the series of Preferred Stock issued to the investors investing new money in the Company in connection with the initial closing of the Equity Financing.\n\n\n3. Company Representations\n\n(a) The Company is a corporation duly organized, validly existing and in good standing under the laws of its state of incorporation, and has the power and authority to own, lease and operate its properties and carry on its business as now conducted.\n\n(b) The execution, delivery and performance by the Company of this Safe is within the power of the Company and has been duly authorized by all necessary actions on the part of the Company. This Safe constitutes a legal, valid and binding obligation of the Company.\n\n(c) The performance and consummation of the transactions contemplated by this Safe do not and will not violate any material judgment, statute, rule or regulation applicable to the Company.\n\n(d) No consents or approvals are required in connection with the performance of this Safe, other than the Company's corporate approvals and any qualifications or filings under applicable securities laws.\n\n(e) To its knowledge, the Company owns or possesses sufficient legal rights to all intellectual property necessary for its business as now conducted.\n\n\n4. Investor Representations\n\n(a) The Investor has full legal capacity, power and authority to execute and deliver this Safe and to perform its obligations hereunder.\n\n(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D under the Securities Act.\n\n\n5. Miscellaneous\n\n(a) Any provision of this Safe may be amended, waived or modified by written consent of the Company and the Investor.\n\n(b) Any notice required or permitted by this Safe will be deemed sufficient when delivered personally or by overnight courier or sent by email.\n\n(c) The Investor is not entitled, as a holder of this Safe, to vote or be deemed a holder of Capital Stock for any purpose other than tax purposes.\n\n(d) Neither this Safe nor the rights in this Safe are transferable or assignable, by operation of law or otherwise, by either party without the prior written consent of the other.\n\n(e) In the event any one or more of the provisions of this Safe is for any reason held to be invalid, illegal or unenforceable, such provision(s) only will be deemed null and void.\n\n(f) All rights and obligations hereunder will be governed by the laws of the State that the Company is registered in.\n\n(g) The parties acknowledge and agree that for United States federal and state income tax purposes this Safe is, and at all times has been, intended to be characterized as stock.\n\n\nSchedule 1 - SAFE Details\n\nInvestor Details\n\nItem 1: Investor\n{{investor_name}}\n\nItem 2: Address\n{{investor_address}}\n\nItem 3: Email\n{{investor_email}}\n\nItem 4: Trust Details (if applicable)\n{{investor_trust_name}} {{investor_trust_number}}\n\nKey Terms\n\nItem 5: Purchase Amount\n{{purchase_amount}}\n\nItem 6: Discount Rate\n{{discount_percentage}}\n\nItem 7: Valuation Cap\n{{valuation_cap}} ({{pre_post_money}}-money)\n\nItem 8: Investment Round\n{{investment_round}}\n\nItem 9: Raise Goal\n{{raise_goal}}\n\nItem 10: End Date\n{{end_date}}\n\nItem 11: Effective Date\n{{effective_date}}\n\nItem 12: SAFE Reference\n{{safe_id}}\n\nAdditional Notes\n{{notes}}	t	2026-02-23 01:38:34.334846+00	2026-02-23 01:38:34.334846+00	safe	\N	f
\.


--
-- Data for Name: sars; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".sars (id, company_id, stakeholder_id, grant_name, grant_date, units, base_price, settlement_type, underlying_share_class, vesting_schedule, cliff_months, vesting_months, expiration_date, exercise_date, exercise_price, exercised_units, payout_amount, status, notes, created_at, exercise_trigger) FROM stdin;
\.


--
-- Data for Name: securities; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".securities (id, company_id, stakeholder_id, share_class_id, certificate_id, shares, price_per_share, issue_date, status, vesting_schedule, notes) FROM stdin;
\.


--
-- Data for Name: share_classes; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".share_classes (id, company_id, name, type, price_per_share, authorized_shares, board_approval_date, liquidation_preference) FROM stdin;
\.


--
-- Data for Name: stakeholders; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".stakeholders (id, company_id, name, email, type, title, avatar_initials, user_id, address) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".users (id, username, password) FROM stdin;
\.


--
-- Data for Name: warrants; Type: TABLE DATA; Schema: tenant_initech-corp; Owner: -
--

COPY "tenant_initech-corp".warrants (id, company_id, stakeholder_id, name, underlying_share_class, shares, exercise_price, issue_date, expiration_date, vesting_schedule, status, exercised_date, exercised_shares, notes, created_at) FROM stdin;
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: commitment_records commitment_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commitment_records
    ADD CONSTRAINT commitment_records_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: data_store_categories data_store_categories_org_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_store_categories
    ADD CONSTRAINT data_store_categories_org_id_name_key UNIQUE (org_id, name);


--
-- Name: data_store_categories data_store_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_store_categories
    ADD CONSTRAINT data_store_categories_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- Name: haylo_intents haylo_intents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.haylo_intents
    ADD CONSTRAINT haylo_intents_pkey PRIMARY KEY (id);


--
-- Name: investor_updates investor_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investor_updates
    ADD CONSTRAINT investor_updates_pkey PRIMARY KEY (id);


--
-- Name: phantom_grants phantom_grants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.phantom_grants
    ADD CONSTRAINT phantom_grants_pkey PRIMARY KEY (id);


--
-- Name: platform_resources platform_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_resources
    ADD CONSTRAINT platform_resources_pkey PRIMARY KEY (id);


--
-- Name: proof_requests proof_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proof_requests
    ADD CONSTRAINT proof_requests_pkey PRIMARY KEY (id);


--
-- Name: proof_results proof_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proof_results
    ADD CONSTRAINT proof_results_pkey PRIMARY KEY (id);


--
-- Name: proof_usage proof_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proof_usage
    ADD CONSTRAINT proof_usage_pkey PRIMARY KEY (id);


--
-- Name: proof_usage proof_usage_tenant_id_billing_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proof_usage
    ADD CONSTRAINT proof_usage_tenant_id_billing_month_key UNIQUE (tenant_id, billing_month);


--
-- Name: safe_agreements safe_agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.safe_agreements
    ADD CONSTRAINT safe_agreements_pkey PRIMARY KEY (id);


--
-- Name: sars sars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sars
    ADD CONSTRAINT sars_pkey PRIMARY KEY (id);


--
-- Name: securities securities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.securities
    ADD CONSTRAINT securities_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: share_classes share_classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_classes
    ADD CONSTRAINT share_classes_pkey PRIMARY KEY (id);


--
-- Name: stakeholders stakeholders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stakeholders
    ADD CONSTRAINT stakeholders_pkey PRIMARY KEY (id);


--
-- Name: tenant_members tenant_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_members
    ADD CONSTRAINT tenant_members_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);


--
-- Name: trial_signups trial_signups_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_signups
    ADD CONSTRAINT trial_signups_email_key UNIQUE (email);


--
-- Name: trial_signups trial_signups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trial_signups
    ADD CONSTRAINT trial_signups_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: warrants warrants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warrants
    ADD CONSTRAINT warrants_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: data_store_categories data_store_categories_org_id_name_key; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.data_store_categories
    ADD CONSTRAINT data_store_categories_org_id_name_key UNIQUE (org_id, name);


--
-- Name: data_store_categories data_store_categories_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.data_store_categories
    ADD CONSTRAINT data_store_categories_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: esop_grants esop_grants_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.esop_grants
    ADD CONSTRAINT esop_grants_pkey PRIMARY KEY (id);


--
-- Name: esop_plans esop_plans_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.esop_plans
    ADD CONSTRAINT esop_plans_pkey PRIMARY KEY (id);


--
-- Name: esop_pools esop_pools_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.esop_pools
    ADD CONSTRAINT esop_pools_pkey PRIMARY KEY (id);


--
-- Name: haylo_intents haylo_intents_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.haylo_intents
    ADD CONSTRAINT haylo_intents_pkey PRIMARY KEY (id);


--
-- Name: investment_rounds investment_rounds_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.investment_rounds
    ADD CONSTRAINT investment_rounds_pkey PRIMARY KEY (id);


--
-- Name: investor_updates investor_updates_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.investor_updates
    ADD CONSTRAINT investor_updates_pkey PRIMARY KEY (id);


--
-- Name: phantom_grants phantom_grants_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.phantom_grants
    ADD CONSTRAINT phantom_grants_pkey PRIMARY KEY (id);


--
-- Name: privacy_labels privacy_labels_company_id_stakeholder_id_key; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.privacy_labels
    ADD CONSTRAINT privacy_labels_company_id_stakeholder_id_key UNIQUE (company_id, stakeholder_id);


--
-- Name: privacy_labels privacy_labels_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.privacy_labels
    ADD CONSTRAINT privacy_labels_pkey PRIMARY KEY (id);


--
-- Name: safe_agreements safe_agreements_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.safe_agreements
    ADD CONSTRAINT safe_agreements_pkey PRIMARY KEY (id);


--
-- Name: safe_templates safe_templates_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.safe_templates
    ADD CONSTRAINT safe_templates_pkey PRIMARY KEY (id);


--
-- Name: sars sars_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.sars
    ADD CONSTRAINT sars_pkey PRIMARY KEY (id);


--
-- Name: securities securities_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.securities
    ADD CONSTRAINT securities_pkey PRIMARY KEY (id);


--
-- Name: share_classes share_classes_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.share_classes
    ADD CONSTRAINT share_classes_pkey PRIMARY KEY (id);


--
-- Name: stakeholders stakeholders_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.stakeholders
    ADD CONSTRAINT stakeholders_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: warrants warrants_pkey; Type: CONSTRAINT; Schema: tenant_acme; Owner: -
--

ALTER TABLE ONLY tenant_acme.warrants
    ADD CONSTRAINT warrants_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: data_store_categories data_store_categories_org_id_name_key; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.data_store_categories
    ADD CONSTRAINT data_store_categories_org_id_name_key UNIQUE (org_id, name);


--
-- Name: data_store_categories data_store_categories_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.data_store_categories
    ADD CONSTRAINT data_store_categories_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: esop_grants esop_grants_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.esop_grants
    ADD CONSTRAINT esop_grants_pkey PRIMARY KEY (id);


--
-- Name: esop_plans esop_plans_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.esop_plans
    ADD CONSTRAINT esop_plans_pkey PRIMARY KEY (id);


--
-- Name: esop_pools esop_pools_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.esop_pools
    ADD CONSTRAINT esop_pools_pkey PRIMARY KEY (id);


--
-- Name: haylo_intents haylo_intents_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.haylo_intents
    ADD CONSTRAINT haylo_intents_pkey PRIMARY KEY (id);


--
-- Name: investment_rounds investment_rounds_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.investment_rounds
    ADD CONSTRAINT investment_rounds_pkey PRIMARY KEY (id);


--
-- Name: investor_updates investor_updates_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.investor_updates
    ADD CONSTRAINT investor_updates_pkey PRIMARY KEY (id);


--
-- Name: phantom_grants phantom_grants_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.phantom_grants
    ADD CONSTRAINT phantom_grants_pkey PRIMARY KEY (id);


--
-- Name: privacy_labels privacy_labels_company_id_stakeholder_id_key; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.privacy_labels
    ADD CONSTRAINT privacy_labels_company_id_stakeholder_id_key UNIQUE (company_id, stakeholder_id);


--
-- Name: privacy_labels privacy_labels_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.privacy_labels
    ADD CONSTRAINT privacy_labels_pkey PRIMARY KEY (id);


--
-- Name: safe_agreements safe_agreements_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.safe_agreements
    ADD CONSTRAINT safe_agreements_pkey PRIMARY KEY (id);


--
-- Name: safe_templates safe_templates_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.safe_templates
    ADD CONSTRAINT safe_templates_pkey PRIMARY KEY (id);


--
-- Name: sars sars_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.sars
    ADD CONSTRAINT sars_pkey PRIMARY KEY (id);


--
-- Name: securities securities_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.securities
    ADD CONSTRAINT securities_pkey PRIMARY KEY (id);


--
-- Name: share_classes share_classes_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.share_classes
    ADD CONSTRAINT share_classes_pkey PRIMARY KEY (id);


--
-- Name: stakeholders stakeholders_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.stakeholders
    ADD CONSTRAINT stakeholders_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: warrants warrants_pkey; Type: CONSTRAINT; Schema: tenant_globex; Owner: -
--

ALTER TABLE ONLY tenant_globex.warrants
    ADD CONSTRAINT warrants_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: data_store_categories data_store_categories_org_id_name_key; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".data_store_categories
    ADD CONSTRAINT data_store_categories_org_id_name_key UNIQUE (org_id, name);


--
-- Name: data_store_categories data_store_categories_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".data_store_categories
    ADD CONSTRAINT data_store_categories_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: esop_grants esop_grants_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".esop_grants
    ADD CONSTRAINT esop_grants_pkey PRIMARY KEY (id);


--
-- Name: esop_plans esop_plans_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".esop_plans
    ADD CONSTRAINT esop_plans_pkey PRIMARY KEY (id);


--
-- Name: esop_pools esop_pools_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".esop_pools
    ADD CONSTRAINT esop_pools_pkey PRIMARY KEY (id);


--
-- Name: haylo_intents haylo_intents_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".haylo_intents
    ADD CONSTRAINT haylo_intents_pkey PRIMARY KEY (id);


--
-- Name: investment_rounds investment_rounds_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".investment_rounds
    ADD CONSTRAINT investment_rounds_pkey PRIMARY KEY (id);


--
-- Name: investor_updates investor_updates_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".investor_updates
    ADD CONSTRAINT investor_updates_pkey PRIMARY KEY (id);


--
-- Name: phantom_grants phantom_grants_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".phantom_grants
    ADD CONSTRAINT phantom_grants_pkey PRIMARY KEY (id);


--
-- Name: privacy_labels privacy_labels_company_id_stakeholder_id_key; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".privacy_labels
    ADD CONSTRAINT privacy_labels_company_id_stakeholder_id_key UNIQUE (company_id, stakeholder_id);


--
-- Name: privacy_labels privacy_labels_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".privacy_labels
    ADD CONSTRAINT privacy_labels_pkey PRIMARY KEY (id);


--
-- Name: safe_agreements safe_agreements_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".safe_agreements
    ADD CONSTRAINT safe_agreements_pkey PRIMARY KEY (id);


--
-- Name: safe_templates safe_templates_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".safe_templates
    ADD CONSTRAINT safe_templates_pkey PRIMARY KEY (id);


--
-- Name: sars sars_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".sars
    ADD CONSTRAINT sars_pkey PRIMARY KEY (id);


--
-- Name: securities securities_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".securities
    ADD CONSTRAINT securities_pkey PRIMARY KEY (id);


--
-- Name: share_classes share_classes_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".share_classes
    ADD CONSTRAINT share_classes_pkey PRIMARY KEY (id);


--
-- Name: stakeholders stakeholders_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".stakeholders
    ADD CONSTRAINT stakeholders_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: warrants warrants_pkey; Type: CONSTRAINT; Schema: tenant_initech-corp; Owner: -
--

ALTER TABLE ONLY "tenant_initech-corp".warrants
    ADD CONSTRAINT warrants_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- PostgreSQL database dump complete
--

\unrestrict EC7flhSeFwXC5FRMhFnIrUN2kgeCEdkxD7KJpeGdDTQbFQ0d6tjbU8LKBmZ9njs

