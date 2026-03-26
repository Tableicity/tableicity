import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import * as schema from '../shared/schema';

async function main() {
  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Usage: npx tsx scripts/generate-commitments.ts <tenant-id>');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const tenant = await db.select().from(schema.tenants).where(eq(schema.tenants.id, tenantId)).limit(1);
  if (!tenant.length) {
    console.error(`Tenant ${tenantId} not found`);
    await pool.end();
    process.exit(1);
  }

  console.log(`Generating commitments for tenant: ${tenant[0].name} (${tenantId})`);

  const tenantSlug = tenant[0].slug;
  const schemaName = `tenant_${tenantSlug}`;

  let stakeholderRows: Array<{ id: string; name: string; type: string }>;
  try {
    const result = await pool.query(
      `SELECT id, name, type FROM "${schemaName}".stakeholders WHERE id IS NOT NULL`
    );
    stakeholderRows = result.rows;
  } catch (e: any) {
    console.error(`Failed to read stakeholders from ${schemaName}:`, e.message);
    await pool.end();
    process.exit(1);
  }

  if (!stakeholderRows.length) {
    console.log('No stakeholders found for this tenant.');
    await pool.end();
    return;
  }

  let securitiesRows: Array<{ stakeholder_id: string; share_class_id: string; shares: string }>;
  try {
    const result = await pool.query(
      `SELECT stakeholder_id, share_class_id, shares FROM "${schemaName}".securities WHERE status = 'active'`
    );
    securitiesRows = result.rows;
  } catch (e: any) {
    console.error(`Failed to read securities from ${schemaName}:`, e.message);
    await pool.end();
    process.exit(1);
  }

  let generated = 0;
  for (const security of securitiesRows) {
    const holderRef = security.stakeholder_id;
    const shareClass = security.share_class_id || 'default';
    const shares = security.shares || '0';

    const existing = await db.select().from(schema.commitmentRecords)
      .where(eq(schema.commitmentRecords.tenantId, tenantId))
      .then(rows => rows.find(r => r.holderRef === holderRef && r.shareClass === shareClass));

    if (existing) {
      continue;
    }

    const salt = randomBytes(32).toString('hex');
    const preimage = `${shares}||${holderRef}||${salt}`;
    const commitmentHash = createHash('sha256').update(preimage).digest('hex');

    await db.insert(schema.commitmentRecords).values({
      tenantId,
      holderRef,
      commitmentHash,
      salt,
      shareClass,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    generated++;
  }

  console.log(`Generated ${generated} commitments for tenant ${tenant[0].name}`);
  console.log(`Skipped ${securitiesRows.length - generated} existing commitments`);

  await pool.end();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
