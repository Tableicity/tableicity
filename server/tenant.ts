import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
import { pool as platformPool, db as platformDb } from "./db";

type TenantDb = NodePgDatabase<typeof schema>;

const tenantPools = new Map<string, Pool>();
const tenantDbs = new Map<string, TenantDb>();

export function getTenantDb(slug: string): TenantDb {
  if (tenantDbs.has(slug)) {
    return tenantDbs.get(slug)!;
  }

  const tenantPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  tenantPool.on("connect", (client) => {
    client.query(`SET search_path TO "tenant_${slug}", public`);
  });

  const db = drizzle(tenantPool, { schema });
  tenantPools.set(slug, tenantPool);
  tenantDbs.set(slug, db);

  return db;
}

export function clearTenantCache(slug: string) {
  const pool = tenantPools.get(slug);
  if (pool) {
    pool.end();
    tenantPools.delete(slug);
    tenantDbs.delete(slug);
  }
}

export async function provisionTenantSchema(slug: string): Promise<void> {
  const schemaName = `tenant_${slug}`;
  const client = await platformPool.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

    await client.query(`
      SET search_path TO "${schemaName}", public;

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        legal_name TEXT,
        incorporation_date TEXT,
        incorporation_state TEXT,
        ein TEXT,
        address TEXT,
        total_authorized_shares INTEGER DEFAULT 10000000
      );

      CREATE TABLE IF NOT EXISTS stakeholders (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        user_id VARCHAR,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        type public.stakeholder_type NOT NULL,
        title TEXT,
        address TEXT,
        avatar_initials TEXT
      );

      CREATE TABLE IF NOT EXISTS share_classes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        name TEXT NOT NULL,
        type public.share_class_type NOT NULL,
        price_per_share DECIMAL(10, 4) DEFAULT 0.0001,
        authorized_shares INTEGER NOT NULL,
        board_approval_date TEXT,
        liquidation_preference DECIMAL(10, 2) DEFAULT 1.00
      );

      CREATE TABLE IF NOT EXISTS securities (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        stakeholder_id VARCHAR NOT NULL,
        share_class_id VARCHAR NOT NULL,
        certificate_id TEXT,
        shares INTEGER NOT NULL,
        price_per_share DECIMAL(10, 4),
        issue_date TEXT NOT NULL,
        status public.security_status NOT NULL DEFAULT 'active',
        vesting_schedule TEXT,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS investment_rounds (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        round_name VARCHAR(255) NOT NULL,
        round_date TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS safe_agreements (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        stakeholder_id VARCHAR NOT NULL,
        doc_ref VARCHAR(50),
        investment_amount DECIMAL(12, 2) NOT NULL,
        valuation_cap DECIMAL(15, 2),
        discount_rate DECIMAL(5, 2),
        safe_type TEXT NOT NULL DEFAULT 'post-money',
        status public.safe_status NOT NULL DEFAULT 'draft',
        issue_date TEXT,
        conversion_date TEXT,
        notes TEXT,
        investment_round_id VARCHAR,
        investment_round_name VARCHAR(255),
        raise_goal DECIMAL(15, 2),
        end_date TEXT,
        template_variables JSONB,
        template_id VARCHAR
      );

      CREATE TABLE IF NOT EXISTS safe_templates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        template_name VARCHAR(255) NOT NULL,
        template_type VARCHAR(50) NOT NULL DEFAULT 'safe',
        template_version VARCHAR(50) DEFAULT '1.0',
        description TEXT,
        raw_content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        name TEXT NOT NULL,
        type public.document_type NOT NULL,
        description TEXT,
        upload_date TEXT NOT NULL,
        file_size TEXT,
        uploaded_by TEXT,
        file_url TEXT,
        file_size_bytes INTEGER,
        mime_type TEXT,
        encrypted BOOLEAN NOT NULL DEFAULT false,
        content TEXT
      );

      CREATE TABLE IF NOT EXISTS investor_updates (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        status public.update_status NOT NULL DEFAULT 'draft',
        sent_date TEXT,
        created_date TEXT NOT NULL,
        recipient_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS esop_pools (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        name TEXT NOT NULL,
        approved_date TEXT NOT NULL,
        underlying_share_class TEXT NOT NULL DEFAULT 'Common',
        allocated_shares INTEGER NOT NULL,
        granted_shares INTEGER NOT NULL DEFAULT 0,
        vested_shares INTEGER NOT NULL DEFAULT 0,
        exercised_shares INTEGER NOT NULL DEFAULT 0,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS esop_plans (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        pool_id VARCHAR NOT NULL,
        name TEXT NOT NULL,
        approved_date TEXT NOT NULL,
        grant_type TEXT NOT NULL DEFAULT 'stock_options',
        grant_presets TEXT,
        documents TEXT,
        internal_note TEXT,
        created_at TEXT
      );

      DO $$ BEGIN
        CREATE TYPE esop_grant_status AS ENUM ('active', 'partially_exercised', 'fully_exercised', 'forfeited', 'cancelled', 'expired');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS esop_grants (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        pool_id VARCHAR NOT NULL,
        plan_id VARCHAR NOT NULL,
        stakeholder_id VARCHAR NOT NULL,
        grant_name TEXT NOT NULL,
        grant_date TEXT NOT NULL,
        shares INTEGER NOT NULL,
        exercise_price DECIMAL(12,4) NOT NULL,
        underlying_share_class TEXT NOT NULL DEFAULT 'Common',
        vesting_start_date TEXT,
        vesting_duration_months INTEGER,
        cliff_months INTEGER,
        vest_frequency_months INTEGER,
        vested_shares INTEGER NOT NULL DEFAULT 0,
        exercised_shares INTEGER NOT NULL DEFAULT 0,
        status esop_grant_status NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TEXT
      );

      DO $$ BEGIN
        CREATE TYPE warrant_status AS ENUM ('active', 'exercised', 'expired', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS warrants (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        stakeholder_id VARCHAR NOT NULL,
        name TEXT NOT NULL,
        underlying_share_class TEXT NOT NULL DEFAULT 'Common',
        shares INTEGER NOT NULL,
        exercise_price DECIMAL(12,4) NOT NULL,
        issue_date TEXT NOT NULL,
        expiration_date TEXT NOT NULL,
        vesting_schedule TEXT,
        status warrant_status NOT NULL DEFAULT 'active',
        exercised_date TEXT,
        exercised_shares INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT
      );

      DO $$ BEGIN
        CREATE TYPE phantom_grant_status AS ENUM ('active', 'vested', 'paid_out', 'forfeited', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE phantom_plan_type AS ENUM ('appreciation_only', 'full_value');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE phantom_payout_trigger AS ENUM ('exit', 'ipo', 'milestone', 'annual', 'termination');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS phantom_grants (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        stakeholder_id VARCHAR NOT NULL,
        grant_name TEXT NOT NULL,
        grant_date TEXT NOT NULL,
        shares_equivalent INTEGER NOT NULL,
        grant_price_per_unit DECIMAL(12,4) NOT NULL,
        plan_type phantom_plan_type NOT NULL DEFAULT 'full_value',
        vesting_schedule TEXT,
        cliff_months INTEGER,
        vesting_months INTEGER,
        payout_trigger phantom_payout_trigger NOT NULL DEFAULT 'exit',
        payout_date TEXT,
        payout_amount DECIMAL(14,2),
        current_share_price DECIMAL(12,4),
        status phantom_grant_status NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TEXT
      );

      DO $$ BEGIN
        CREATE TYPE sar_status AS ENUM ('active', 'vested', 'exercised', 'forfeited', 'cancelled', 'expired');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
      DO $$ BEGIN
        CREATE TYPE sar_settlement_type AS ENUM ('cash', 'stock', 'choice');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS sars (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        stakeholder_id VARCHAR NOT NULL,
        grant_name TEXT NOT NULL,
        grant_date TEXT NOT NULL,
        units INTEGER NOT NULL,
        base_price DECIMAL(12,4) NOT NULL,
        settlement_type sar_settlement_type NOT NULL DEFAULT 'cash',
        underlying_share_class TEXT,
        vesting_schedule TEXT,
        cliff_months INTEGER,
        vesting_months INTEGER,
        expiration_date TEXT,
        exercise_date TEXT,
        exercise_price DECIMAL(12,4),
        exercised_units INTEGER NOT NULL DEFAULT 0,
        payout_amount DECIMAL(14,2),
        exercise_trigger TEXT,
        status sar_status NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TEXT
      );

      CREATE TABLE IF NOT EXISTS data_store_categories (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id VARCHAR NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT,
        UNIQUE (org_id, name)
      );

      CREATE TABLE IF NOT EXISTS privacy_labels (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id VARCHAR NOT NULL,
        stakeholder_id VARCHAR NOT NULL,
        hashed_id TEXT NOT NULL,
        encrypted_label TEXT,
        created_at TEXT,
        UNIQUE (company_id, stakeholder_id)
      );

      SET search_path TO public;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'stakeholders'
          AND column_name = 'user_id'
        ) THEN
          EXECUTE format('ALTER TABLE %I.stakeholders ADD COLUMN user_id VARCHAR', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'documents'
          AND column_name = 'file_url'
        ) THEN
          EXECUTE format('ALTER TABLE %I.documents ADD COLUMN file_url TEXT', '${schemaName}');
          EXECUTE format('ALTER TABLE %I.documents ADD COLUMN file_size_bytes INTEGER', '${schemaName}');
          EXECUTE format('ALTER TABLE %I.documents ADD COLUMN mime_type TEXT', '${schemaName}');
          EXECUTE format('ALTER TABLE %I.documents ADD COLUMN encrypted BOOLEAN NOT NULL DEFAULT false', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'investment_rounds'
        ) THEN
          EXECUTE format('CREATE TABLE %I.investment_rounds (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id VARCHAR NOT NULL,
            round_name VARCHAR(255) NOT NULL,
            round_date TEXT,
            created_at TEXT
          )', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'safe_agreements'
          AND column_name = 'investment_round_id'
        ) THEN
          EXECUTE format('ALTER TABLE %I.safe_agreements ADD COLUMN investment_round_id VARCHAR', '${schemaName}');
          EXECUTE format('ALTER TABLE %I.safe_agreements ADD COLUMN investment_round_name VARCHAR(255)', '${schemaName}');
          EXECUTE format('ALTER TABLE %I.safe_agreements ADD COLUMN raise_goal DECIMAL(15, 2)', '${schemaName}');
          EXECUTE format('ALTER TABLE %I.safe_agreements ADD COLUMN end_date TEXT', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'safe_agreements'
          AND column_name = 'template_variables'
        ) THEN
          EXECUTE format('ALTER TABLE %I.safe_agreements ADD COLUMN template_variables JSONB', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'safe_templates'
        ) THEN
          EXECUTE format('CREATE TABLE %I.safe_templates (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            template_name VARCHAR(255) NOT NULL,
            template_type VARCHAR(50) NOT NULL DEFAULT ''safe'',
            template_version VARCHAR(50) DEFAULT ''1.0'',
            description TEXT,
            raw_content TEXT NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TEXT,
            updated_at TEXT
          )', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'safe_templates'
          AND column_name = 'template_type'
        ) THEN
          EXECUTE format('ALTER TABLE %I.safe_templates ADD COLUMN template_type VARCHAR(50) NOT NULL DEFAULT ''safe''', '${schemaName}');
          EXECUTE format('ALTER TABLE %I.safe_templates ADD COLUMN description TEXT', '${schemaName}');
          EXECUTE format('ALTER TABLE %I.safe_templates ADD COLUMN is_default BOOLEAN DEFAULT FALSE', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'safe_agreements'
          AND column_name = 'template_id'
        ) THEN
          EXECUTE format('ALTER TABLE %I.safe_agreements ADD COLUMN template_id VARCHAR', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'safe_agreements'
          AND column_name = 'template_variables'
        ) THEN
          EXECUTE format('ALTER TABLE %I.safe_agreements ADD COLUMN template_variables JSONB', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'safe_agreements'
          AND column_name = 'doc_ref'
        ) THEN
          EXECUTE format('ALTER TABLE %I.safe_agreements ADD COLUMN doc_ref VARCHAR(50)', '${schemaName}');
        END IF;
      END
      $$;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'documents'
          AND column_name = 'content'
        ) THEN
          EXECUTE format('ALTER TABLE %I.documents ADD COLUMN content TEXT', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'stakeholders'
          AND column_name = 'address'
        ) THEN
          EXECUTE format('ALTER TABLE %I.stakeholders ADD COLUMN address TEXT', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'esop_pools'
        ) THEN
          EXECUTE format('CREATE TABLE %I.esop_pools (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id VARCHAR NOT NULL,
            name TEXT NOT NULL,
            approved_date TEXT NOT NULL,
            underlying_share_class TEXT NOT NULL DEFAULT ''Common'',
            allocated_shares INTEGER NOT NULL,
            granted_shares INTEGER NOT NULL DEFAULT 0,
            vested_shares INTEGER NOT NULL DEFAULT 0,
            exercised_shares INTEGER NOT NULL DEFAULT 0,
            created_at TEXT
          )', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'esop_plans'
        ) THEN
          EXECUTE format('CREATE TABLE %I.esop_plans (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id VARCHAR NOT NULL,
            pool_id VARCHAR NOT NULL,
            name TEXT NOT NULL,
            approved_date TEXT NOT NULL,
            grant_type TEXT NOT NULL DEFAULT ''stock_options'',
            grant_presets TEXT,
            documents TEXT,
            internal_note TEXT,
            created_at TEXT
          )', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'esop_grants'
        ) THEN
          BEGIN
            EXECUTE format('CREATE TYPE %I.esop_grant_status AS ENUM (''active'', ''partially_exercised'', ''fully_exercised'', ''forfeited'', ''cancelled'', ''expired'')', '${schemaName}');
          EXCEPTION WHEN duplicate_object THEN null;
          END;
          EXECUTE format('CREATE TABLE %I.esop_grants (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id VARCHAR NOT NULL,
            pool_id VARCHAR NOT NULL,
            plan_id VARCHAR NOT NULL,
            stakeholder_id VARCHAR NOT NULL,
            grant_name TEXT NOT NULL,
            grant_date TEXT NOT NULL,
            shares INTEGER NOT NULL,
            exercise_price DECIMAL(12,4) NOT NULL,
            underlying_share_class TEXT NOT NULL DEFAULT ''Common'',
            vesting_start_date TEXT,
            vesting_duration_months INTEGER,
            cliff_months INTEGER,
            vest_frequency_months INTEGER,
            vested_shares INTEGER NOT NULL DEFAULT 0,
            exercised_shares INTEGER NOT NULL DEFAULT 0,
            status %I.esop_grant_status NOT NULL DEFAULT ''active'',
            notes TEXT,
            created_at TEXT
          )', '${schemaName}', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'warrants'
        ) THEN
          BEGIN
            EXECUTE format('CREATE TYPE %I.warrant_status AS ENUM (''active'', ''exercised'', ''expired'', ''cancelled'')', '${schemaName}');
          EXCEPTION WHEN duplicate_object THEN null;
          END;
          EXECUTE format('CREATE TABLE %I.warrants (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id VARCHAR NOT NULL,
            stakeholder_id VARCHAR NOT NULL,
            name TEXT NOT NULL,
            underlying_share_class TEXT NOT NULL DEFAULT ''Common'',
            shares INTEGER NOT NULL,
            exercise_price DECIMAL(12,4) NOT NULL,
            issue_date TEXT NOT NULL,
            expiration_date TEXT NOT NULL,
            vesting_schedule TEXT,
            status %I.warrant_status NOT NULL DEFAULT ''active'',
            exercised_date TEXT,
            exercised_shares INTEGER NOT NULL DEFAULT 0,
            notes TEXT,
            created_at TEXT
          )', '${schemaName}', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'phantom_grants'
        ) THEN
          BEGIN
            EXECUTE format('CREATE TYPE %I.phantom_grant_status AS ENUM (''active'', ''vested'', ''paid_out'', ''forfeited'', ''cancelled'')', '${schemaName}');
          EXCEPTION WHEN duplicate_object THEN null;
          END;
          BEGIN
            EXECUTE format('CREATE TYPE %I.phantom_plan_type AS ENUM (''appreciation_only'', ''full_value'')', '${schemaName}');
          EXCEPTION WHEN duplicate_object THEN null;
          END;
          BEGIN
            EXECUTE format('CREATE TYPE %I.phantom_payout_trigger AS ENUM (''exit'', ''ipo'', ''milestone'', ''annual'', ''termination'')', '${schemaName}');
          EXCEPTION WHEN duplicate_object THEN null;
          END;
          EXECUTE format('CREATE TABLE %I.phantom_grants (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id VARCHAR NOT NULL,
            stakeholder_id VARCHAR NOT NULL,
            grant_name TEXT NOT NULL,
            grant_date TEXT NOT NULL,
            shares_equivalent INTEGER NOT NULL,
            grant_price_per_unit DECIMAL(12,4) NOT NULL,
            plan_type %I.phantom_plan_type NOT NULL DEFAULT ''full_value'',
            vesting_schedule TEXT,
            cliff_months INTEGER,
            vesting_months INTEGER,
            payout_trigger %I.phantom_payout_trigger NOT NULL DEFAULT ''exit'',
            payout_date TEXT,
            payout_amount DECIMAL(14,2),
            current_share_price DECIMAL(12,4),
            status %I.phantom_grant_status NOT NULL DEFAULT ''active'',
            notes TEXT,
            created_at TEXT
          )', '${schemaName}', '${schemaName}', '${schemaName}', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'sars'
        ) THEN
          BEGIN
            EXECUTE format('CREATE TYPE %I.sar_status AS ENUM (''active'', ''vested'', ''exercised'', ''forfeited'', ''cancelled'', ''expired'')', '${schemaName}');
          EXCEPTION WHEN duplicate_object THEN null;
          END;
          BEGIN
            EXECUTE format('CREATE TYPE %I.sar_settlement_type AS ENUM (''cash'', ''stock'', ''choice'')', '${schemaName}');
          EXCEPTION WHEN duplicate_object THEN null;
          END;
          EXECUTE format('CREATE TABLE %I.sars (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id VARCHAR NOT NULL,
            stakeholder_id VARCHAR NOT NULL,
            grant_name TEXT NOT NULL,
            grant_date TEXT NOT NULL,
            units INTEGER NOT NULL,
            base_price DECIMAL(12,4) NOT NULL,
            settlement_type %I.sar_settlement_type NOT NULL DEFAULT ''cash'',
            underlying_share_class TEXT,
            vesting_schedule TEXT,
            cliff_months INTEGER,
            vesting_months INTEGER,
            expiration_date TEXT,
            exercise_date TEXT,
            exercise_price DECIMAL(12,4),
            exercised_units INTEGER NOT NULL DEFAULT 0,
            payout_amount DECIMAL(14,2),
            exercise_trigger TEXT,
            status %I.sar_status NOT NULL DEFAULT ''active'',
            notes TEXT,
            created_at TEXT
          )', '${schemaName}', '${schemaName}', '${schemaName}');
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'sars'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = '${schemaName}'
          AND table_name = 'sars'
          AND column_name = 'exercise_trigger'
        ) THEN
          EXECUTE format('ALTER TABLE %I.sars ADD COLUMN exercise_trigger TEXT', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'data_store_categories'
        ) THEN
          EXECUTE format('CREATE TABLE %I.data_store_categories (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            org_id VARCHAR NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT,
            UNIQUE (org_id, name)
          )', '${schemaName}');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${schemaName}'
          AND table_name = 'privacy_labels'
        ) THEN
          EXECUTE format('CREATE TABLE %I.privacy_labels (
            id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id VARCHAR NOT NULL,
            stakeholder_id VARCHAR NOT NULL,
            hashed_id TEXT NOT NULL,
            encrypted_label TEXT,
            created_at TEXT,
            UNIQUE (company_id, stakeholder_id)
          )', '${schemaName}');
        END IF;
      END
      $$;
    `);
  } finally {
    client.release();
  }
}

export async function tenantSchemaExists(slug: string): Promise<boolean> {
  const result = await platformPool.query(
    `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
    [`tenant_${slug}`]
  );
  return result.rows.length > 0;
}

export async function listTenants(): Promise<schema.Tenant[]> {
  return platformDb.select().from(schema.tenants).orderBy(schema.tenants.name);
}

export async function getTenant(slug: string): Promise<schema.Tenant | undefined> {
  const [tenant] = await platformDb
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, slug));
  return tenant;
}

export async function createTenant(data: schema.InsertTenant): Promise<schema.Tenant> {
  await provisionTenantSchema(data.slug);

  const [tenant] = await platformDb
    .insert(schema.tenants)
    .values({
      ...data,
      createdAt: new Date().toISOString().split("T")[0],
    })
    .returning();

  return tenant;
}

export async function deleteTenantSchema(slug: string): Promise<void> {
  const schemaName = `tenant_${slug}`;
  clearTenantCache(slug);
  await platformPool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  await platformDb.delete(schema.tenants).where(eq(schema.tenants.slug, slug));
}
