import { DatabaseStorage, createTenantStorage } from "./storage";
import { getTenantDb, createTenant, getTenant, provisionTenantSchema } from "./tenant";
import { db } from "./db";
import { users, tenantMembers, tenants, platformResources } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { IStorage } from "./storage";

const LABEL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generatePrivacyLabel(): string {
  let result = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) result += "-";
    result += LABEL_CHARS[Math.floor(Math.random() * LABEL_CHARS.length)];
  }
  return result;
}

export async function seedPlatformResourcesToTenant(storage: IStorage) {
  const resources = await db.select().from(platformResources).where(eq(platformResources.autoSeed, true));
  if (resources.length === 0) return;

  const company = await storage.getCompany();
  if (!company) return;

  const existingDocs = await storage.getDocuments(company.id).catch(() => []);

  for (const resource of resources) {
    const marker = `[Platform Resource: ${resource.id}]`;
    const alreadySeeded = existingDocs.some((d) => d.description && d.description.includes(marker));
    if (alreadySeeded) continue;

    try {

      await storage.createDocument({
        companyId: company.id,
        name: resource.name,
        type: resource.documentType as any,
        description: `${resource.description || ""} ${marker}`.trim(),
        uploadDate: new Date().toISOString().split("T")[0],
        fileSize: resource.fileSize || "",
        uploadedBy: "Platform Admin",
        content: resource.content || null,
        mimeType: resource.mimeType || null,
        fileSizeBytes: resource.fileSizeBytes || null,
        encrypted: false,
      });
    } catch (err) {
      console.log(`Failed to seed resource '${resource.name}':`, err);
    }
  }
}

async function seedPlatformAdmin() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@tableicty.com"));

  if (existing) return existing;

  const passwordHash = await bcrypt.hash("admin123!", 12);
  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@tableicty.com",
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      isPlatformAdmin: true,
      createdAt: new Date().toISOString().split("T")[0],
    })
    .returning();

  console.log("Created platform admin user: admin@tableicty.com / admin123!");
  return admin;
}

async function seedTenantMembership(userId: string, tenantSlug: string, role: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug));
  if (!tenant) return;

  const [existing] = await db
    .select()
    .from(tenantMembers)
    .where(eq(tenantMembers.userId, userId));

  const existingForTenant = await db
    .select()
    .from(tenantMembers)
    .where(eq(tenantMembers.tenantId, tenant.id));

  const alreadyMember = existingForTenant.find(m => m.userId === userId);
  if (alreadyMember) return;

  await db.insert(tenantMembers).values({
    tenantId: tenant.id,
    userId,
    role: role as any,
    status: "active",
    createdAt: new Date().toISOString().split("T")[0],
  });
}

export async function seedTenantData(storage: IStorage, shareholderUserId?: string) {
  let company = await storage.getCompany();
  if (!company) {
    company = await storage.createCompany({
      name: "Archer Technologies Inc.",
      legalName: "Archer Technologies, Inc.",
      incorporationDate: "2024-01-15",
      incorporationState: "Delaware",
      ein: "12-3456789",
      address: "123 Innovation Way, San Francisco, CA 94107",
      totalAuthorizedShares: 10000000,
    });
  }

  const existingStakeholders = await storage.getStakeholders(company.id);
  if (existingStakeholders.length > 0) {
    await seedInvestmentRoundsAndEsop(storage, company.id);
    const existingInvestors = existingStakeholders.filter(s => s.type === "investor");
    if (existingInvestors.length >= 2) {
      await seedWarrants(storage, company.id, existingInvestors);
    }
    const existingEmployees = existingStakeholders.filter(s => s.type === "employee");
    await seedEsopGrants(storage, company.id, existingEmployees);
    await seedPhantomGrants(storage, company.id, existingEmployees);
    await seedSars(storage, company.id, existingEmployees);
    await seedDataStoreCategories(storage, company.id);
    await seedTestDriveDocuments(storage, company.id);
    await seedPrivacyLabels(storage, company.id, existingStakeholders);
    return;
  }

  const founders = await Promise.all([
    storage.createStakeholder({
      companyId: company.id,
      name: "Sarah Mitchell",
      email: "sarah@archertech.com",
      type: "founder",
      title: "CEO & Co-Founder",
      avatarInitials: "SM",
    }),
    storage.createStakeholder({
      companyId: company.id,
      name: "James Carter",
      email: "james@archertech.com",
      type: "founder",
      title: "CTO & Co-Founder",
      avatarInitials: "JC",
    }),
  ]);

  const investors = await Promise.all([
    storage.createStakeholder({
      companyId: company.id,
      name: "Haystack Capital Partners",
      email: "deals@haystackcap.com",
      type: "investor",
      title: "Lead Investor",
      address: "2800 Sand Hill Rd, Menlo Park, CA 94025",
      avatarInitials: "HC",
    }),
    storage.createStakeholder({
      companyId: company.id,
      name: "Wei Chen",
      email: "wei.chen@blueridgevc.com",
      type: "investor",
      title: "Investor",
      address: "88 Post St, Suite 1200, San Francisco, CA 94104",
      avatarInitials: "WC",
    }),
    storage.createStakeholder({
      companyId: company.id,
      name: "Priya Patel",
      email: "priya@catalystventures.com",
      type: "investor",
      title: "Seed Investor",
      address: "335 Pioneer Way, Mountain View, CA 94041",
      avatarInitials: "PP",
    }),
  ]);

  const employees = await Promise.all([
    storage.createStakeholder({
      companyId: company.id,
      name: "Michael Reynolds",
      email: "michael@archertech.com",
      type: "employee",
      title: "VP Engineering",
      avatarInitials: "MR",
    }),
    storage.createStakeholder({
      companyId: company.id,
      name: "Kenji Tanaka",
      email: "kenji@archertech.com",
      type: "employee",
      title: "Head of Product",
      avatarInitials: "KT",
    }),
  ]);

  const advisor = await storage.createStakeholder({
    companyId: company.id,
    name: "Robert Harrison",
    email: "robert@harrisonadvisory.com",
    type: "advisor",
    title: "Strategic Advisor",
    avatarInitials: "RH",
  });

  const johnDoe = await storage.createStakeholder({
    companyId: company.id,
    userId: shareholderUserId || null,
    name: "John Doe",
    email: "johndoe@archertech.com",
    type: "employee",
    title: "Senior Engineer",
    avatarInitials: "JD",
  });

  const crypto = await import("crypto");
  const allStakeholders = [founders[0], founders[1], investors[0], investors[1], investors[2], employees[0], employees[1], advisor, johnDoe];
  for (let i = 0; i < allStakeholders.length; i++) {
    const s = allStakeholders[i];
    const hashedId = crypto.createHmac("sha256", company.id).update(s.id).digest("hex");
    await storage.upsertPrivacyLabel({
      companyId: company.id,
      stakeholderId: s.id,
      hashedId,
      encryptedLabel: generatePrivacyLabel(),
    });
  }

  const commonClass = await storage.createShareClass({
    companyId: company.id,
    name: "Common Stock",
    type: "common",
    pricePerShare: "0.02",
    authorizedShares: 8000000,
    boardApprovalDate: "2024-01-15",
    liquidationPreference: "1.00",
  });

  const seriesAClass = await storage.createShareClass({
    companyId: company.id,
    name: "Series A Preferred",
    type: "preferred",
    pricePerShare: "1.25",
    authorizedShares: 1500000,
    boardApprovalDate: "2025-03-01",
    liquidationPreference: "1.00",
  });

  const optionsClass = await storage.createShareClass({
    companyId: company.id,
    name: "Employee Stock Options",
    type: "options",
    pricePerShare: "0.50",
    authorizedShares: 500000,
    boardApprovalDate: "2024-06-15",
    liquidationPreference: "0.00",
  });

  await Promise.all([
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: founders[0].id,
      shareClassId: commonClass.id,
      shares: 3000000,
      pricePerShare: "0.02",
      issueDate: "2024-01-15",
      status: "active",
      certificateId: "CS-001",
      notes: "Founder shares with 4-year vesting, 1-year cliff",
      vestingSchedule: "4-year, 1-year cliff",
    }),
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: founders[1].id,
      shareClassId: commonClass.id,
      shares: 2500000,
      pricePerShare: "0.02",
      issueDate: "2024-01-15",
      status: "active",
      certificateId: "CS-002",
      notes: "Founder shares with 4-year vesting, 1-year cliff",
      vestingSchedule: "4-year, 1-year cliff",
    }),
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: investors[0].id,
      shareClassId: seriesAClass.id,
      shares: 800000,
      pricePerShare: "1.25",
      issueDate: "2025-03-15",
      status: "active",
      certificateId: "SA-001",
      notes: "Series A lead investor",
    }),
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: investors[1].id,
      shareClassId: seriesAClass.id,
      shares: 400000,
      pricePerShare: "1.25",
      issueDate: "2025-03-15",
      status: "active",
      certificateId: "SA-002",
    }),
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: employees[0].id,
      shareClassId: optionsClass.id,
      shares: 150000,
      pricePerShare: "0.50",
      issueDate: "2024-09-01",
      status: "active",
      certificateId: "OPT-001",
      vestingSchedule: "4-year, 1-year cliff",
    }),
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: employees[1].id,
      shareClassId: optionsClass.id,
      shares: 100000,
      pricePerShare: "0.50",
      issueDate: "2024-11-01",
      status: "active",
      certificateId: "OPT-002",
      vestingSchedule: "4-year, 1-year cliff",
    }),
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: advisor.id,
      shareClassId: optionsClass.id,
      shares: 50000,
      pricePerShare: "0.50",
      issueDate: "2025-01-15",
      status: "active",
      certificateId: "OPT-003",
      vestingSchedule: "2-year, no cliff",
    }),
  ]);

  await Promise.all([
    storage.createSafeAgreement({
      companyId: company.id,
      stakeholderId: investors[2].id,
      investmentAmount: "500000",
      valuationCap: "10000000",
      discountRate: "20",
      safeType: "post-money",
      status: "signed",
      issueDate: "2024-06-01",
      notes: "YC standard SAFE agreement",
    }),
    storage.createSafeAgreement({
      companyId: company.id,
      stakeholderId: investors[0].id,
      investmentAmount: "250000",
      valuationCap: "8000000",
      discountRate: null,
      safeType: "post-money",
      status: "signed",
      issueDate: "2024-04-15",
      notes: "Early bridge SAFE",
    }),
    storage.createSafeAgreement({
      companyId: company.id,
      stakeholderId: investors[1].id,
      investmentAmount: "150000",
      valuationCap: "12000000",
      discountRate: "15",
      safeType: "pre-money",
      status: "draft",
      issueDate: "2025-12-01",
      notes: "Pending bridge round SAFE",
    }),
  ]);

  await Promise.all([
    storage.createDocument({
      companyId: company.id,
      name: "Certificate of Incorporation",
      type: "legal",
      description: "Delaware C-Corp incorporation documents",
      uploadDate: "2024-01-15",
      fileSize: "2.4 MB",
      uploadedBy: "Sarah Mitchell",
    }),
    storage.createDocument({
      companyId: company.id,
      name: "Series A Term Sheet",
      type: "investor",
      description: "Signed term sheet for Series A financing",
      uploadDate: "2025-02-20",
      fileSize: "1.1 MB",
      uploadedBy: "Sarah Mitchell",
      encrypted: true,
    }),
    storage.createDocument({
      companyId: company.id,
      name: "Board Meeting Minutes - Q4 2024",
      type: "corporate",
      description: "Minutes from the Q4 2024 board meeting",
      uploadDate: "2025-01-10",
      fileSize: "850 KB",
      uploadedBy: "James Carter",
      encrypted: true,
    }),
    storage.createDocument({
      companyId: company.id,
      name: "Financial Projections 2025",
      type: "financial",
      description: "Revenue forecasts and financial model for 2025",
      uploadDate: "2025-01-05",
      fileSize: "3.2 MB",
      uploadedBy: "Sarah Mitchell",
    }),
    storage.createDocument({
      companyId: company.id,
      name: "Employee Stock Option Plan",
      type: "legal",
      description: "2024 ESOP agreement and schedule",
      uploadDate: "2024-06-15",
      fileSize: "1.8 MB",
      uploadedBy: "Sarah Mitchell",
    }),
  ]);

  await Promise.all([
    storage.createInvestorUpdate({
      companyId: company.id,
      title: "Q4 2024 Investor Update",
      content: "Dear Investors,\n\nWe're excited to share our Q4 2024 progress.\n\nHighlights:\n- Revenue grew 45% QoQ to $850K ARR\n- Launched enterprise tier with 3 Fortune 500 customers\n- Team expanded to 18 members\n- Closed Series A term sheet with Haystack Capital leading\n\nKey Metrics:\n- MRR: $71K\n- Customers: 127 (up from 89)\n- NRR: 135%\n- Burn Rate: $180K/mo\n- Runway: 24 months\n\nLooking Ahead:\nWe're focused on scaling our go-to-market motion and building out the enterprise feature set. We expect to close Series A in Q1 2025.\n\nThank you for your continued support.\n\nBest,\nSarah Mitchell\nCEO, Archer Technologies",
      status: "sent",
      sentDate: "2025-01-15",
      createdDate: "2025-01-12",
      recipientCount: 3,
    }),
    storage.createInvestorUpdate({
      companyId: company.id,
      title: "Q1 2025 Investor Update",
      content: "Dear Investors,\n\nQ1 2025 has been a transformative quarter for Archer Technologies.\n\nHighlights:\n- Successfully closed $2.5M Series A led by Haystack Capital Partners\n- Revenue reached $1.2M ARR\n- Launched API v2.0 with 10x performance improvement\n- Hired VP Engineering (Michael Reynolds, ex-Stripe)\n\nKey Metrics:\n- MRR: $100K\n- Customers: 168\n- NRR: 142%\n- Team: 22 members\n\nWe're entering an exciting growth phase. More details in our upcoming board meeting.\n\nBest,\nSarah",
      status: "sent",
      sentDate: "2025-04-10",
      createdDate: "2025-04-08",
      recipientCount: 3,
    }),
    storage.createInvestorUpdate({
      companyId: company.id,
      title: "Q2 2025 Investor Update (Draft)",
      content: "Dear Investors,\n\nHere's our mid-year update.\n\nHighlights:\n- Revenue tracking to $2M ARR\n- Expansion into European market\n- SOC 2 Type II certification achieved\n- Product-led growth motion gaining traction\n\nKey Metrics:\n- MRR: $165K\n- Customers: 220+\n- Enterprise accounts: 8",
      status: "draft",
      createdDate: "2025-07-01",
      recipientCount: 0,
    }),
  ]);

  await seedInvestmentRoundsAndEsop(storage, company.id);
  await seedWarrants(storage, company.id, investors);
  await seedEsopGrants(storage, company.id, employees);
  await seedPhantomGrants(storage, company.id, employees);
  await seedSars(storage, company.id, employees);
  await seedDataStoreCategories(storage, company.id);
  await seedTestDriveDocuments(storage, company.id);

  console.log("Tenant database seeded successfully");
}

async function seedInvestmentRoundsAndEsop(storage: IStorage, companyId: string) {
  const existingRounds = await storage.getInvestmentRounds(companyId);
  if (existingRounds.length === 0) {
    await storage.createInvestmentRound({
      companyId,
      roundName: "Seed Round",
      roundDate: "2024-03-15",
      createdAt: "2024-03-15",
    });

    await storage.createInvestmentRound({
      companyId,
      roundName: "Series A",
      roundDate: "2025-03-01",
      createdAt: "2025-03-01",
    });

    await storage.createInvestmentRound({
      companyId,
      roundName: "Bridge Round",
      roundDate: "2025-12-01",
      createdAt: "2025-12-01",
    });
    console.log("Seeded investment rounds");
  }

  const existingPools = await storage.getEsopPools(companyId);
  if (existingPools.length === 0) {
    const esopPool = await storage.createEsopPool({
      companyId,
      name: "2024 Employee Option Pool",
      approvedDate: "2024-06-15",
      underlyingShareClass: "Common Stock",
      allocatedShares: 500000,
      grantedShares: 190500,
      vestedShares: 75000,
      exercisedShares: 0,
      createdAt: "2024-06-15",
    });

    await storage.createEsopPool({
      companyId,
      name: "2025 Expansion Pool",
      approvedDate: "2025-04-01",
      underlyingShareClass: "Common Stock",
      allocatedShares: 250000,
      grantedShares: 50000,
      vestedShares: 0,
      exercisedShares: 0,
      createdAt: "2025-04-01",
    });

    await storage.createEsopPlan({
      companyId,
      poolId: esopPool.id,
      name: "Engineering Stock Option Plan",
      approvedDate: "2024-07-01",
      grantType: "stock_options",
      grantPresets: null,
      documents: null,
      internalNote: "Standard 4-year vesting with 1-year cliff for engineering team members.",
      createdAt: "2024-07-01",
    });

    await storage.createEsopPlan({
      companyId,
      poolId: esopPool.id,
      name: "Leadership RSU Plan",
      approvedDate: "2024-09-15",
      grantType: "stock",
      grantPresets: null,
      documents: null,
      internalNote: "Restricted stock units for VP-level and above. 3-year vesting, quarterly.",
      createdAt: "2024-09-15",
    });

    await storage.createEsopPlan({
      companyId,
      poolId: esopPool.id,
      name: "Advisor Warrant Program",
      approvedDate: "2025-01-10",
      grantType: "warrants",
      grantPresets: null,
      documents: null,
      internalNote: "Strategic advisor warrants. 2-year vesting, no cliff.",
      createdAt: "2025-01-10",
    });
    console.log("Seeded ESOP pools and plans");
  }
}

async function seedEsopGrants(storage: IStorage, companyId: string, employees: any[]) {
  const existing = await storage.getEsopGrants(companyId);
  if (existing.length > 0 || employees.length < 2) return;

  const pools = await storage.getEsopPools(companyId);
  const plans = await storage.getEsopPlans(companyId);
  if (pools.length === 0 || plans.length === 0) return;

  const mainPool = pools[0];
  const stockOptionPlan = plans.find(p => p.grantType === "stock_options") || plans[0];
  const rsuPlan = plans.find(p => p.grantType === "stock") || plans[0];

  const michael = employees.find(e => e.name?.includes("Michael") || e.name?.includes("Reynolds")) || employees[0];
  const kenji = employees.find(e => e.name?.includes("Kenji") || e.name?.includes("Tanaka")) || employees[1];

  await storage.createEsopGrant({
    companyId,
    poolId: mainPool.id,
    planId: stockOptionPlan.id,
    stakeholderId: michael.id,
    grantName: "Stock Option Grant — Engineering",
    grantDate: "2024-08-01",
    shares: 75000,
    exercisePrice: "1.5000",
    underlyingShareClass: "Common Stock",
    vestingStartDate: "2024-08-01",
    vestingDurationMonths: 48,
    cliffMonths: 12,
    vestFrequencyMonths: 1,
    notes: "Standard 4-year vesting with 1-year cliff. Engineering team member.",
  });

  await storage.createEsopGrant({
    companyId,
    poolId: mainPool.id,
    planId: stockOptionPlan.id,
    stakeholderId: kenji.id,
    grantName: "Stock Option Grant — Product",
    grantDate: "2024-10-15",
    shares: 50000,
    exercisePrice: "2.0000",
    underlyingShareClass: "Common Stock",
    vestingStartDate: "2024-10-15",
    vestingDurationMonths: 48,
    cliffMonths: 12,
    vestFrequencyMonths: 1,
    notes: "Standard 4-year vesting with 1-year cliff. Engineering team member.",
  });

  await storage.createEsopGrant({
    companyId,
    poolId: mainPool.id,
    planId: rsuPlan.id,
    stakeholderId: michael.id,
    grantName: "Leadership RSU Grant",
    grantDate: "2025-01-15",
    shares: 25000,
    exercisePrice: "0.0000",
    underlyingShareClass: "Common Stock",
    vestingStartDate: "2025-01-15",
    vestingDurationMonths: 36,
    cliffMonths: 0,
    vestFrequencyMonths: 3,
    notes: "Quarterly vesting RSU for VP-level leadership.",
  });

  console.log("Seeded ESOP grants");
}

async function fixEsopGrantNames(storage: IStorage, companyId: string, employees: any[]) {
  const grants = await storage.getEsopGrants(companyId);
  const plans = await storage.getEsopPlans(companyId);
  const pools = await storage.getEsopPools(companyId);
  const michael = employees.find(e => e.name?.includes("Michael") || e.name?.includes("Reynolds"));
  const kenji = employees.find(e => e.name?.includes("Kenji") || e.name?.includes("Tanaka"));
  const johnDoe = employees.find(e => e.name?.includes("John") && e.name?.includes("Doe"));
  const stockOptionPlan = plans.find(p => p.grantType === "stock_options");
  const rsuPlan = plans.find(p => p.grantType === "stock");
  const mainPool = pools[0];

  const poolNameFixes: Record<string, string> = {
    "Employee Stock Ownership Program (ESOP)": "2024 Employee Option Pool",
  };
  for (const pool of pools) {
    const fixedName = poolNameFixes[pool.name];
    if (fixedName) {
      await storage.updateEsopPool(pool.id, { name: fixedName } as any);
    }
  }

  const planNameFixes: Record<string, { name: string; grantType: string }> = {
    "ESOP Employee Fund": { name: "Engineering Stock Option Plan", grantType: "stock_options" },
  };
  for (const plan of plans) {
    const fix = planNameFixes[plan.name];
    if (fix) {
      await storage.updateEsopPlan(plan.id, { name: fix.name, grantType: fix.grantType as any });
    }
  }

  if (!rsuPlan && mainPool) {
    const existingRsu = plans.find(p => p.name === "Leadership RSU Plan");
    if (!existingRsu) {
      await storage.createEsopPlan({
        companyId,
        poolId: mainPool.id,
        name: "Leadership RSU Plan",
        approvedDate: "2024-09-15",
        grantType: "stock",
        grantPresets: null,
        documents: null,
        internalNote: "Restricted stock units for VP-level and above. 3-year vesting, quarterly.",
        createdAt: "2024-09-15",
      });
    }
  }

  const refreshedPlans = await storage.getEsopPlans(companyId);
  const refreshedStockOptionPlan = refreshedPlans.find(p => p.grantType === "stock_options");
  const refreshedRsuPlan = refreshedPlans.find(p => p.grantType === "stock");

  const nameMap: Record<string, string> = {
    "Michael Reynolds — Stock Option Grant": "Stock Option Grant — Engineering",
    "Kenji Tanaka — Stock Option Grant": "Stock Option Grant — Product",
    "Michael Reynolds — Leadership RSU": "Leadership RSU Grant",
  };

  for (const grant of grants) {
    const updates: Record<string, any> = {};

    const newName = nameMap[grant.grantName];
    if (newName) {
      updates.grantName = newName;
    }

    const effectiveName = newName || grant.grantName;

    if (effectiveName === "Stock Option Grant — Engineering") {
      if (michael && grant.stakeholderId !== michael.id) updates.stakeholderId = michael.id;
      if (refreshedStockOptionPlan && grant.planId !== refreshedStockOptionPlan.id) updates.planId = refreshedStockOptionPlan.id;
    }

    if (effectiveName === "Stock Option Grant — Product") {
      if (kenji && grant.stakeholderId !== kenji.id) updates.stakeholderId = kenji.id;
      if (refreshedStockOptionPlan && grant.planId !== refreshedStockOptionPlan.id) updates.planId = refreshedStockOptionPlan.id;
    }

    if (effectiveName === "Leadership RSU Grant") {
      if (michael && grant.stakeholderId !== michael.id) updates.stakeholderId = michael.id;
      if (refreshedRsuPlan && grant.planId !== refreshedRsuPlan.id) updates.planId = refreshedRsuPlan.id;
    }

    if (Object.keys(updates).length > 0) {
      await storage.updateEsopGrant(grant.id, updates);
    }
  }

  if (mainPool && refreshedStockOptionPlan) {
    const grantNames = grants.map(g => nameMap[g.grantName] || g.grantName);

    if (johnDoe && !grantNames.includes("Stock Option Grant — Dev Team")) {
      await storage.createEsopGrant({
        companyId,
        poolId: mainPool.id,
        planId: refreshedStockOptionPlan.id,
        stakeholderId: johnDoe.id,
        grantName: "Stock Option Grant — Dev Team",
        grantDate: "2025-02-01",
        shares: 50000,
        exercisePrice: "2.0000",
        underlyingShareClass: "Common Stock",
        vestingStartDate: "2025-02-01",
        vestingDurationMonths: 48,
        cliffMonths: 12,
        vestFrequencyMonths: 1,
        notes: "Standard 4-year vesting with 1-year cliff. Dev team member.",
      });
    }

  }
}

async function seedWarrants(storage: IStorage, companyId: string, investors: any[]) {
  const existing = await storage.getWarrants(companyId);
  if (existing.length === 0) {
    await storage.createWarrant({
      companyId,
      stakeholderId: investors[0].id,
      name: "Series A Warrant",
      underlyingShareClass: "Preferred Series A",
      shares: 50000,
      exercisePrice: "2.5000",
      issueDate: "2024-09-15",
      expirationDate: "2029-09-15",
      vestingSchedule: null,
      status: "active",
      notes: "Issued as part of Series A financing round to Haystack Capital Partners.",
    });

    await storage.createWarrant({
      companyId,
      stakeholderId: investors[1].id,
      name: "Bridge Loan Warrant",
      underlyingShareClass: "Common Stock",
      shares: 25000,
      exercisePrice: "1.7500",
      issueDate: "2025-01-10",
      expirationDate: "2030-01-10",
      vestingSchedule: null,
      status: "active",
      notes: "Issued in connection with bridge financing from Wei Chen.",
    });

    console.log("Seeded warrants");
  }
}

async function seedPhantomGrants(storage: IStorage, companyId: string, employees: any[]) {
  const existing = await storage.getPhantomGrants(companyId);
  if (existing.length === 0 && employees.length >= 2) {
    const michael = employees.find(e => e.name?.includes("Michael") || e.name?.includes("Reynolds")) || employees[0];
    const kenji = employees.find(e => e.name?.includes("Kenji") || e.name?.includes("Tanaka")) || employees[1];
    await storage.createPhantomGrant({
      companyId,
      stakeholderId: michael.id,
      grantName: "Executive Phantom Plan",
      grantDate: "2024-08-01",
      sharesEquivalent: 10000,
      grantPricePerUnit: "5.0000",
      planType: "full_value",
      payoutTrigger: "exit",
      vestingSchedule: "4-year with 1-year cliff, monthly thereafter",
      cliffMonths: 12,
      vestingMonths: 48,
      notes: "Full value phantom plan for senior engineering leadership. Payout at exit event.",
    });

    await storage.createPhantomGrant({
      companyId,
      stakeholderId: kenji.id,
      grantName: "Growth Incentive Plan",
      grantDate: "2025-01-15",
      sharesEquivalent: 5000,
      grantPricePerUnit: "3.0000",
      planType: "appreciation_only",
      payoutTrigger: "ipo",
      vestingSchedule: "3-year with 6-month cliff",
      cliffMonths: 6,
      vestingMonths: 36,
      notes: "Appreciation-only phantom plan. Payout equals share price increase above $3.00 grant price.",
    });

    console.log("Seeded phantom grants");
  }
}

async function seedSars(storage: IStorage, companyId: string, employees: any[]) {
  const existing = await storage.getSars(companyId);
  if (existing.length === 0 && employees.length >= 2) {
    const michael = employees.find(e => e.name?.includes("Michael") || e.name?.includes("Reynolds")) || employees[0];
    const kenji = employees.find(e => e.name?.includes("Kenji") || e.name?.includes("Tanaka")) || employees[1];
    await storage.createSar({
      companyId,
      stakeholderId: michael.id,
      grantName: "VP Engineering SAR",
      grantDate: "2024-10-01",
      units: 15000,
      basePrice: "4.0000",
      settlementType: "cash",
      vestingSchedule: "4-year with 1-year cliff, monthly thereafter",
      cliffMonths: 12,
      vestingMonths: 48,
      expirationDate: "2034-10-01",
      exerciseTrigger: "exit",
      notes: "Cash-settled SAR for senior engineering leadership. Appreciation above $4.00 base price paid in cash.",
    });

    await storage.createSar({
      companyId,
      stakeholderId: kenji.id,
      grantName: "Product Lead SAR",
      grantDate: "2025-02-01",
      units: 8000,
      basePrice: "5.5000",
      settlementType: "stock",
      underlyingShareClass: "Common",
      vestingSchedule: "3-year with 6-month cliff",
      cliffMonths: 6,
      vestingMonths: 36,
      expirationDate: "2035-02-01",
      exerciseTrigger: "ipo",
      notes: "Stock-settled SAR. On exercise, appreciation value is converted to Common shares at current FMV.",
    });

    console.log("Seeded SARs");
  }
}

async function seedShareholderUser() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, "johndoe@archertech.com"));

  if (existing) return existing;

  const passwordHash = await bcrypt.hash("shareholder123!", 12);
  const [user] = await db
    .insert(users)
    .values({
      email: "johndoe@archertech.com",
      passwordHash,
      firstName: "John",
      lastName: "Doe",
      isPlatformAdmin: false,
      createdAt: new Date().toISOString().split("T")[0],
    })
    .returning();

  console.log("Created shareholder user: johndoe@archertech.com / shareholder123!");
  return user;
}

async function linkStakeholderToUser(storage: IStorage, tenantDb: any, userId: string, stakeholderEmail: string) {
  const company = await storage.getCompany();
  if (!company) return;
  const stakeholders = await storage.getStakeholders(company.id);
  const stakeholder = stakeholders.find(s => s.email === stakeholderEmail);
  if (stakeholder && !stakeholder.userId) {
    await storage.updateStakeholder(stakeholder.id, { userId } as any);
    console.log(`Linked stakeholder "${stakeholder.name}" to user ${userId}`);
  }
}

export async function seedTemplatesForTenant(storage: IStorage) {
  const existingTemplates = await storage.getSafeTemplates();
  if (existingTemplates.length > 0) return;

  const today = new Date().toISOString().split("T")[0];

  await storage.createSafeTemplate({
    templateName: "Standard SAFE Agreement",
    templateType: "safe",
    templateVersion: "1.0",
    description: "Y Combinator standard post-money SAFE template with valuation cap and discount provisions.",
    rawContent: SAFE_TEMPLATE_CONTENT,
    isActive: true,
    isDefault: true,
    createdAt: today,
    updatedAt: today,
  });

  await storage.createSafeTemplate({
    templateName: "Convertible Note Agreement",
    templateType: "convertible_note",
    templateVersion: "1.0",
    description: "Standard convertible promissory note with interest rate, maturity date, and qualified financing conversion.",
    rawContent: CONVERTIBLE_NOTE_TEMPLATE_CONTENT,
    isActive: true,
    isDefault: true,
    createdAt: today,
    updatedAt: today,
  });

  await storage.createSafeTemplate({
    templateName: "Warrant Agreement",
    templateType: "warrant",
    templateVersion: "1.0",
    description: "Stock purchase warrant with exercise price, expiration date, and net exercise provisions.",
    rawContent: WARRANT_TEMPLATE_CONTENT,
    isActive: true,
    isDefault: true,
    createdAt: today,
    updatedAt: today,
  });

  console.log("Seeded document templates");
}

async function seedSuperAdmin() {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, "abc17@gmail.com"));

  if (existing) return existing;

  const passwordHash = await bcrypt.hash("admin123!", 12);
  const [superAdmin] = await db
    .insert(users)
    .values({
      email: "abc17@gmail.com",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      isPlatformAdmin: true,
      emailVerified: true,
      createdAt: new Date().toISOString().split("T")[0],
    })
    .returning();

  console.log("Created super admin user: abc17@gmail.com / admin123!");
  return superAdmin;
}

export async function seedDatabase() {
  const admin = await seedPlatformAdmin();
  const superAdmin = await seedSuperAdmin();
  const shareholderUser = await seedShareholderUser();

  const existingTenant = await getTenant("acme");
  if (!existingTenant) {
    await createTenant({
      slug: "acme",
      name: "Archer Technologies",
      ownerEmail: "sarah@archertech.com",
      plan: "standard",
      status: "active",
    });
    console.log("Created 'acme' tenant");
  } else {
    await provisionTenantSchema("acme");
  }

  const acmeDb = getTenantDb("acme");
  const acmeStorage = createTenantStorage(acmeDb);
  await seedTenantData(acmeStorage, shareholderUser.id);
  await seedTemplatesForTenant(acmeStorage);
  await seedTenantMembership(admin.id, "acme", "tenant_admin");
  await seedTenantMembership(superAdmin.id, "acme", "tenant_admin");
  await seedTenantMembership(shareholderUser.id, "acme", "shareholder");
  await linkStakeholderToUser(acmeStorage, acmeDb, shareholderUser.id, "johndoe@archertech.com");

  const existingGlobex = await getTenant("globex");
  if (!existingGlobex) {
    await createTenant({
      slug: "globex",
      name: "Acme Technologies Inc.",
      ownerEmail: "admin@exemptifi.com",
      plan: "enterprise",
      status: "active",
    });
    console.log("Created 'globex' tenant");
  } else {
    await provisionTenantSchema("globex");
  }

  const globexDb2 = getTenantDb("globex");
  const globexStorage2 = createTenantStorage(globexDb2);
  await seedTenantData(globexStorage2);
  await seedTemplatesForTenant(globexStorage2);
  await seedTenantMembership(admin.id, "globex", "tenant_admin");
  await seedTenantMembership(superAdmin.id, "globex", "tenant_admin");

  await migrateAllTenantSchemas();

  console.log("Multi-tenant database seeded successfully");
}

async function migrateAllTenantSchemas() {
  const allTenants = await db.select().from(tenants);
  for (const tenant of allTenants) {
    await provisionTenantSchema(tenant.slug);
    try {
      const tenantDb = getTenantDb(tenant.slug);
      const tenantStorage = createTenantStorage(tenantDb);
      const company = await tenantStorage.getCompany();
      if (company) {
        const allStakeholders = await tenantStorage.getStakeholders(company.id);
        const existingWarrants = await tenantStorage.getWarrants(company.id);
        if (existingWarrants.length === 0) {
          const investors = allStakeholders.filter(s => s.type === "investor");
          if (investors.length >= 2) {
            await seedWarrants(tenantStorage, company.id, investors);
          }
        }
        const employees = allStakeholders.filter(s => s.type === "employee");
        await fixEsopGrantNames(tenantStorage, company.id, employees);
        await seedEsopGrants(tenantStorage, company.id, employees);
        await seedPhantomGrants(tenantStorage, company.id, employees);
        await seedSars(tenantStorage, company.id, employees);
        await seedPrivacyLabels(tenantStorage, company.id, allStakeholders);
      }
    } catch (e) {
    }
  }
}

export async function provisionSandboxForUser(userId: string, userEmail: string): Promise<string> {
  const sandboxSlug = `sandbox-${userId.slice(0, 8)}`;

  const existing = await getTenant(sandboxSlug);
  if (existing) {
    const [existingMembership] = await db
      .select()
      .from(tenantMembers)
      .where(eq(tenantMembers.tenantId, existing.id));
    const isMember = existingMembership && existingMembership.userId === userId;
    if (!isMember) {
      const allMemberships = await db
        .select()
        .from(tenantMembers)
        .where(eq(tenantMembers.tenantId, existing.id));
      const userMembership = allMemberships.find(m => m.userId === userId);
      if (!userMembership) {
        await db.insert(tenantMembers).values({
          tenantId: existing.id,
          userId,
          role: "tenant_admin",
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
        });
      }
    }
    return sandboxSlug;
  }

  await provisionTenantSchema(sandboxSlug);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 6);

  await db.insert(tenants).values({
    slug: sandboxSlug,
    name: "Archer Technologies Inc. (Sandbox)",
    status: "active",
    plan: "trial",
    ownerEmail: userEmail,
    maxUsers: 10,
    maxCompanies: 1,
    isSandbox: true,
    trialEndsAt: trialEndsAt.toISOString(),
    createdAt: new Date().toISOString().split("T")[0],
  });

  const sandboxDb = getTenantDb(sandboxSlug);
  const sandboxStorage = createTenantStorage(sandboxDb);
  await seedTenantData(sandboxStorage);
  await seedTemplatesForTenant(sandboxStorage);
  await seedPlatformResourcesToTenant(sandboxStorage);

  await db.insert(tenantMembers).values({
    tenantId: (await getTenant(sandboxSlug))!.id,
    userId,
    role: "tenant_admin",
    status: "active",
    createdAt: new Date().toISOString().split("T")[0],
  });

  console.log(`[SANDBOX] Created sandbox org "${sandboxSlug}" for user ${userEmail}`);
  return sandboxSlug;
}

async function seedGlobexData(storage: IStorage) {
  let company = await storage.getCompany();
  if (!company) {
    company = await storage.createCompany({
      name: "Globex Corporation",
      legalName: "Globex Corporation, Inc.",
      incorporationDate: "2023-06-01",
      incorporationState: "California",
      ein: "98-7654321",
      address: "456 Tech Blvd, Palo Alto, CA 94301",
      totalAuthorizedShares: 5000000,
    });
  }

  const existingStakeholders = await storage.getStakeholders(company.id);
  if (existingStakeholders.length > 0) return;

  const founder = await storage.createStakeholder({
    companyId: company.id,
    name: "Alex Morgan",
    email: "alex@globex.com",
    type: "founder",
    title: "CEO & Founder",
    avatarInitials: "AM",
  });

  const investor = await storage.createStakeholder({
    companyId: company.id,
    name: "Benchmark Capital",
    email: "deals@benchmark.com",
    type: "investor",
    title: "Lead Investor",
    address: "2480 Sand Hill Rd, Menlo Park, CA 94025",
    avatarInitials: "BC",
  });

  const employee = await storage.createStakeholder({
    companyId: company.id,
    name: "Jordan Lee",
    email: "jordan@globex.com",
    type: "employee",
    title: "VP Engineering",
    avatarInitials: "JL",
  });

  const commonClass = await storage.createShareClass({
    companyId: company.id,
    name: "Common Stock",
    type: "common",
    pricePerShare: "0.001",
    authorizedShares: 4000000,
    boardApprovalDate: "2023-06-01",
    liquidationPreference: "1.00",
  });

  const seriesSeedClass = await storage.createShareClass({
    companyId: company.id,
    name: "Seed Preferred",
    type: "preferred",
    pricePerShare: "0.75",
    authorizedShares: 800000,
    boardApprovalDate: "2024-01-15",
    liquidationPreference: "1.00",
  });

  await Promise.all([
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: founder.id,
      shareClassId: commonClass.id,
      shares: 2000000,
      pricePerShare: "0.001",
      issueDate: "2023-06-01",
      status: "active",
      certificateId: "GX-001",
      vestingSchedule: "4-year, 1-year cliff",
    }),
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: investor.id,
      shareClassId: seriesSeedClass.id,
      shares: 500000,
      pricePerShare: "0.75",
      issueDate: "2024-02-01",
      status: "active",
      certificateId: "GX-SA-001",
    }),
    storage.createSecurity({
      companyId: company.id,
      stakeholderId: employee.id,
      shareClassId: commonClass.id,
      shares: 100000,
      pricePerShare: "0.001",
      issueDate: "2024-03-01",
      status: "active",
      certificateId: "GX-OPT-001",
      vestingSchedule: "4-year, 1-year cliff",
    }),
  ]);

  await storage.createDocument({
    companyId: company.id,
    name: "Certificate of Incorporation",
    type: "legal",
    description: "California corporation documents",
    uploadDate: "2023-06-01",
    fileSize: "1.8 MB",
    uploadedBy: "Alex Morgan",
  });

  console.log("Globex tenant seeded successfully");
}

const SAFE_TEMPLATE_CONTENT = `THIS INSTRUMENT AND ANY SECURITIES ISSUABLE PURSUANT HERETO HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED (THE "SECURITIES ACT"), OR UNDER THE SECURITIES LAWS OF CERTAIN STATES. THESE SECURITIES MAY NOT BE OFFERED, SOLD OR OTHERWISE TRANSFERRED, PLEDGED OR HYPOTHECATED EXCEPT AS PERMITTED IN THIS SAFE AND UNDER THE ACT AND APPLICABLE STATE SECURITIES LAWS PURSUANT TO AN EFFECTIVE REGISTRATION STATEMENT OR AN EXEMPTION THEREFROM.


SIMPLE AGREEMENT FOR FUTURE EQUITY


Parties

{{company_name}}, a {{state_of_registration}} corporation ("Company").
The party set out in Schedule 1 ("Investor").


EXECUTED AS AN AGREEMENT


Agreed Terms

THIS CERTIFIES THAT in exchange for the payment by {{investor_name}} {{investor_trust_name}} {{investor_trust_number}} (the "Investor") of {{purchase_amount}} (the "Purchase Amount"), {{company_name}}, a {{state_of_registration}} corporation (the "Company"), issues to the Investor the right to certain shares of the Company's Capital Stock, subject to the terms described below.


1. Events

(a) Equity Financing.

If there is an Equity Financing before the termination of this Safe, on the initial closing of such Equity Financing, this Safe will automatically convert into the number of shares of Safe Preferred Stock equal to the Purchase Amount divided by the Conversion Price.

In connection with the automatic conversion of this Safe into shares of Safe Preferred Stock, the Investor will execute and deliver to the Company all of the transaction documents related to the Equity Financing; provided, that such documents are the same documents to be entered into with the purchasers of Standard Preferred Stock, with appropriate variations for the Safe Preferred Stock if applicable, and provided further, that such documents have customary exceptions to any drag-along applicable to the Investor.

(b) Liquidity Event.

If there is a Liquidity Event before the termination of this Safe, this Safe will automatically be entitled to receive a portion of Proceeds, due and payable to the Investor immediately prior to, or concurrent with, the consummation of such Liquidity Event, equal to the greater of (i) the Purchase Amount (the "Cash-Out Amount") or (ii) the amount payable on the number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price (the "Conversion Amount").

Notwithstanding the foregoing, in connection with a Change of Control intended to qualify as a tax-free reorganization, the Company may reduce the cash portion of Proceeds payable to the Investor by the amount determined by its board of directors in good faith for such Change of Control to qualify as a tax-free reorganization for U.S. federal income tax purposes, provided that such reduction (A) does not reduce the total Proceeds payable to such Investor and (B) is applied in the same manner and proportion to all holders of Safes.

(c) Dissolution Event.

If there is a Dissolution Event before the termination of this Safe, the Investor will automatically be entitled to receive a portion of Proceeds equal to the Cash-Out Amount, due and payable to the Investor immediately prior to the consummation of the Dissolution Event.

(d) Liquidation Priority.

In a Liquidity Event or Dissolution Event, this Safe is intended to operate like standard non-participating Preferred Stock. The Investor's right to receive its Cash-Out Amount is:

(i) Junior to payment of outstanding indebtedness and creditor claims, including contractual claims for payment and convertible promissory notes (to the extent such convertible promissory notes are not actually or notionally converted into Capital Stock);

(ii) On par with payments for other Safes and/or Preferred Stock, and if the applicable Proceeds are insufficient to permit full payments to the Investor and such other Safes and/or Preferred Stock, the applicable Proceeds will be distributed pro rata to the Investor and such other Safes and/or Preferred Stock in proportion to the full payments that would otherwise be due; and

(iii) Senior to payments for Common Stock.

The Investor's right to receive its Conversion Amount is (A) on par with payments for Common Stock and other Safes and/or Preferred Stock who are also receiving Conversion Amounts or Proceeds on a similar as-converted to Common Stock basis, and (B) junior to payments described in clauses (i) and (ii) above (in the latter case, to the extent such payments are Cash-Out Amounts or similar liquidation preferences).

(e) Termination.

This Safe will automatically terminate (without relieving the Company of any obligations arising from a prior breach of or non-compliance with this Safe) immediately following the earliest to occur of: (i) the issuance of Capital Stock to the Investor pursuant to the automatic conversion of this Safe under Section 1(a); or (ii) the payment, or setting aside for payment, of amounts due the Investor pursuant to Section 1(b) or Section 1(c).


2. Definitions

"Capital Stock" means the capital stock of the Company, including, without limitation, the "Common Stock" and the "Preferred Stock."

"Change of Control" means (i) a transaction or series of related transactions in which any "person" or "group" becomes the "beneficial owner", directly or indirectly, of more than 50% of the outstanding voting securities of the Company having the right to vote for the election of members of the Company's board of directors, (ii) any reorganization, merger or consolidation of the Company, other than a transaction or series of related transactions in which the holders of the voting securities of the Company outstanding immediately prior to such transaction or series of related transactions retain, immediately after such transaction or series of related transactions, at least a majority of the total voting power represented by the outstanding voting securities of the Company or such other surviving or resulting entity or (iii) a sale, lease or other disposition of all or substantially all of the assets of the Company.

"Company Capitalization" is calculated as of immediately prior to the Equity Financing and includes all shares of Capital Stock issued and outstanding, all Converting Securities, all issued and outstanding Options and Promised Options, and the Unissued Option Pool.

"Converting Securities" includes this Safe and other convertible securities issued by the Company.

"Conversion Price" means either: (1) the Safe Price or (2) the Discount Price, whichever calculation results in a greater number of shares of Safe Preferred Stock.

"Discount Price" means the price per share of the Standard Preferred Stock sold in the Equity Financing multiplied by the Discount Rate.

"Discount Rate" means 100% minus {{discount_percentage}}.

"Dissolution Event" means (i) a voluntary termination of operations, (ii) a general assignment for the benefit of the Company's creditors or (iii) any other liquidation, dissolution or winding up of the Company (excluding a Liquidity Event), whether voluntary or involuntary.

"Equity Financing" means a bona fide transaction or series of transactions with the principal purpose of raising capital, pursuant to which the Company issues and sells Preferred Stock at a fixed valuation.

"Liquidity Capitalization" is calculated as of immediately prior to the Liquidity Event.

"Liquidity Event" means a Change of Control or an Initial Public Offering.

"Liquidity Price" means the price per share equal to the Post-Money Valuation Cap divided by the Liquidity Capitalization.

"Options" includes options, restricted stock awards or purchases, RSUs, SARs, warrants or similar securities, vested or unvested.

"Post-Money Valuation Cap" has the meaning set out in Schedule 1.

"Proceeds" means cash and other assets that are proceeds from the Liquidity Event or the Dissolution Event, as applicable, and legally available for distribution.

"Safe Price" means the price per share equal to the Post-Money Valuation Cap divided by the Company Capitalization.

"Standard Preferred Stock" means the shares of the series of Preferred Stock issued to the investors investing new money in the Company in connection with the initial closing of the Equity Financing.


3. Company Representations

(a) The Company is a corporation duly organized, validly existing and in good standing under the laws of its state of incorporation, and has the power and authority to own, lease and operate its properties and carry on its business as now conducted.

(b) The execution, delivery and performance by the Company of this Safe is within the power of the Company and has been duly authorized by all necessary actions on the part of the Company. This Safe constitutes a legal, valid and binding obligation of the Company.

(c) The performance and consummation of the transactions contemplated by this Safe do not and will not violate any material judgment, statute, rule or regulation applicable to the Company.

(d) No consents or approvals are required in connection with the performance of this Safe, other than the Company's corporate approvals and any qualifications or filings under applicable securities laws.

(e) To its knowledge, the Company owns or possesses sufficient legal rights to all intellectual property necessary for its business as now conducted.


4. Investor Representations

(a) The Investor has full legal capacity, power and authority to execute and deliver this Safe and to perform its obligations hereunder.

(b) The Investor is an accredited investor as such term is defined in Rule 501 of Regulation D under the Securities Act.


5. Miscellaneous

(a) Any provision of this Safe may be amended, waived or modified by written consent of the Company and the Investor.

(b) Any notice required or permitted by this Safe will be deemed sufficient when delivered personally or by overnight courier or sent by email.

(c) The Investor is not entitled, as a holder of this Safe, to vote or be deemed a holder of Capital Stock for any purpose other than tax purposes.

(d) Neither this Safe nor the rights in this Safe are transferable or assignable, by operation of law or otherwise, by either party without the prior written consent of the other.

(e) In the event any one or more of the provisions of this Safe is for any reason held to be invalid, illegal or unenforceable, such provision(s) only will be deemed null and void.

(f) All rights and obligations hereunder will be governed by the laws of the State that the Company is registered in.

(g) The parties acknowledge and agree that for United States federal and state income tax purposes this Safe is, and at all times has been, intended to be characterized as stock.


Schedule 1 - SAFE Details

Investor Details

Item 1: Investor
{{investor_name}}

Item 2: Address
{{investor_address}}

Item 3: Email
{{investor_email}}

Item 4: Trust Details (if applicable)
{{investor_trust_name}} {{investor_trust_number}}

Key Terms

Item 5: Purchase Amount
{{purchase_amount}}

Item 6: Discount Rate
{{discount_percentage}}

Item 7: Valuation Cap
{{valuation_cap}} ({{pre_post_money}}-money)

Item 8: Investment Round
{{investment_round}}

Item 9: Raise Goal
{{raise_goal}}

Item 10: End Date
{{end_date}}

Item 11: Effective Date
{{effective_date}}

Item 12: SAFE Reference
{{safe_id}}

Additional Notes
{{notes}}`;

const CONVERTIBLE_NOTE_TEMPLATE_CONTENT = `CONVERTIBLE PROMISSORY NOTE

Date: {{effective_date}}
Principal Amount: {{purchase_amount}}

FOR VALUE RECEIVED, {{company_name}}, a {{state_of_registration}} corporation (the "Company"), hereby promises to pay to the order of {{investor_name}} (the "Holder"), the principal sum of {{purchase_amount}} (the "Principal Amount"), together with interest thereon from the date hereof at the rate of {{interest_rate}} per annum (the "Interest Rate"), upon the terms and conditions set forth herein.

1. MATURITY DATE
Unless earlier converted pursuant to Section 3 below, all unpaid principal, together with any unpaid and accrued interest, shall be due and payable on demand by the Holder at any time on or after {{maturity_date}} (the "Maturity Date").

2. INTEREST
Interest shall accrue on the unpaid principal balance of this Note at the Interest Rate, computed on the basis of the actual number of days elapsed and a year of 365 days. Interest shall be payable upon maturity or conversion, whichever occurs first.

3. CONVERSION
3.1 Automatic Conversion. Upon the closing of a Qualified Financing (as defined below), the outstanding principal and accrued interest under this Note shall automatically convert into shares of the equity securities issued in such Qualified Financing at a conversion price equal to the lesser of:
(a) {{valuation_cap}} divided by the Company's fully diluted capitalization immediately prior to the closing of such Qualified Financing (the "Cap Price"); or
(b) {{discount_percentage}} discount to the price per share paid by the investors in such Qualified Financing (the "Discount Price").

3.2 Qualified Financing. A "Qualified Financing" means the next sale (or series of related sales) by the Company of its equity securities following the date hereof from which the Company receives gross proceeds of not less than {{qualified_financing_amount}} (excluding the conversion of this Note and other convertible securities).

3.3 Voluntary Conversion. At any time prior to the Maturity Date, the Holder may elect to convert all outstanding principal and accrued interest into shares of the Company's common stock at a conversion price based on the {{pre_post_money}} valuation cap of {{valuation_cap}}.

4. EVENTS OF DEFAULT
The following shall constitute Events of Default:
(a) The Company fails to pay any amount due under this Note within five (5) business days of when due;
(b) The Company files for bankruptcy or makes an assignment for the benefit of creditors;
(c) A material adverse change occurs in the Company's business, operations, or financial condition.

5. REPRESENTATIONS AND WARRANTIES
5.1 The Company represents and warrants that it is duly organized and validly existing under the laws of the State of {{state_of_registration}}.
5.2 The Company has full power and authority to execute and deliver this Note.

6. MISCELLANEOUS
6.1 This Note shall be governed by and construed in accordance with the laws of the State of {{state_of_registration}}.
6.2 Any notices required hereunder shall be sent to:

Company: {{company_name}}
Address: {{company_address}}

Holder: {{investor_name}}
Address: {{investor_address}}
Email: {{investor_email}}

IN WITNESS WHEREOF, the Company has executed this Convertible Promissory Note as of the date first written above.

{{company_name}}

By: ___________________________
Name:
Title:

HOLDER:

{{investor_name}}

By: ___________________________

Schedule of Terms:
Investment Round: {{investment_round}}
Raise Goal: {{raise_goal}}
End Date: {{end_date}}
Reference: {{safe_id}}

{{notes}}`;

const WARRANT_TEMPLATE_CONTENT = `STOCK PURCHASE WARRANT

THIS WARRANT AND THE SHARES ISSUABLE UPON EXERCISE HEREOF HAVE NOT BEEN REGISTERED UNDER THE SECURITIES ACT OF 1933, AS AMENDED.

Warrant No.: {{safe_id}}
Date of Issuance: {{effective_date}}

{{company_name}}, a {{state_of_registration}} corporation (the "Company"), hereby certifies that, for value received, {{investor_name}} (the "Holder"), is entitled to purchase from the Company up to {{number_of_shares}} shares of the Company's Common Stock (the "Warrant Shares") at an exercise price of {{exercise_price}} per share (the "Exercise Price"), subject to the terms and conditions set forth herein.

1. EXERCISE OF WARRANT
1.1 Exercise Period. This Warrant may be exercised, in whole or in part, at any time and from time to time on or after the date hereof and on or before {{expiration_date}} (the "Expiration Date").

1.2 Method of Exercise. This Warrant shall be exercised by the Holder by:
(a) Delivery to the Company of a duly executed Exercise Notice in the form attached hereto; and
(b) Payment of the aggregate Exercise Price for the Warrant Shares being purchased, by cash, check, or wire transfer.

1.3 Net Exercise. In lieu of exercising this Warrant by payment of the Exercise Price, the Holder may elect to receive shares equal to the value of this Warrant (or the portion thereof being exercised) by surrender of this Warrant, in which event the Company shall issue to the Holder a number of Warrant Shares computed using the following formula:

X = Y(A-B) / A

Where: X = the number of Warrant Shares to be issued
       Y = the number of Warrant Shares for which the Warrant is being exercised
       A = the Fair Market Value of one share of Common Stock
       B = the Exercise Price

2. ADJUSTMENTS
2.1 Stock Splits and Dividends. If the Company effects a stock split, stock dividend, or similar transaction, the number of Warrant Shares and the Exercise Price shall be proportionally adjusted.

2.2 Reorganization. In the event of any reorganization, merger, consolidation, or similar transaction, this Warrant shall be exercisable for the kind and amount of securities or other property that the Holder would have been entitled to receive had the Warrant been exercised immediately prior to such transaction.

3. TRANSFER
This Warrant and the rights hereunder are not transferable without the prior written consent of the Company, except to affiliates of the Holder.

4. REPRESENTATIONS
4.1 The Company represents that it is duly organized under the laws of {{state_of_registration}}.
4.2 The Warrant Shares, when issued upon proper exercise, shall be validly issued, fully paid, and non-assessable.

5. MISCELLANEOUS
5.1 Governing Law. This Warrant shall be governed by the laws of the State of {{state_of_registration}}.
5.2 Notices. All notices shall be sent to:

Company: {{company_name}}
Address: {{company_address}}

Holder: {{investor_name}}
Address: {{investor_address}}
Email: {{investor_email}}

IN WITNESS WHEREOF, the Company has caused this Warrant to be executed as of the Date of Issuance.

{{company_name}}

By: ___________________________
Name:
Title:

Investment Context:
Round: {{investment_round}}
Valuation Cap: {{valuation_cap}}
Raise Goal: {{raise_goal}}

{{notes}}`;

const DEFAULT_CATEGORIES = ["Test Drives", "Documents", "Notes", "Other"];

async function seedDataStoreCategories(storage: IStorage, companyId: string) {
  try {
    const existing = await storage.getDataStoreCategories(companyId);
    const existingNames = new Set(existing.map(c => c.name.toLowerCase()));
    for (const name of DEFAULT_CATEGORIES) {
      if (!existingNames.has(name.toLowerCase())) {
        await storage.createDataStoreCategory({ orgId: companyId, name });
      }
    }
  } catch (err) {
    console.log("Note: Could not seed data store categories (table may not exist yet)");
  }
}

const TEST_DRIVE_CHECKLISTS = [
  { name: "Test Drive Checklist — Warrants", pageLink: "/equity-plans/warrants" },
  { name: "Test Drive Checklist — Pools", pageLink: "/equity-plans/pools" },
  { name: "Test Drive Checklist — Plans", pageLink: "/equity-plans/plans" },
  { name: "Test Drive Checklist — Grants", pageLink: "/equity-plans/grants" },
  { name: "Test Drive Checklist — Exercising", pageLink: "/equity-plans/exercising" },
  { name: "Test Drive Checklist — Phantom Shares", pageLink: "/equity-plans/phantom" },
  { name: "Test Drive Checklist — SARs", pageLink: "/equity-plans/sars" },
];

async function seedPrivacyLabels(storage: IStorage, companyId: string, stakeholders: any[]) {
  try {
    const existing = await storage.getPrivacyLabels(companyId);
    const hasOldFormat = existing.some(l => l.encryptedLabel && /^(Founder|Fund|Employee|Advisor|Board|Entity|Investor|Seed-VC)-/.test(l.encryptedLabel));
    if (existing.length > 0 && !hasOldFormat) return;
    const crypto = await import("crypto");
    for (const s of stakeholders) {
      const hashedId = crypto.createHmac("sha256", companyId).update(s.id).digest("hex");
      await storage.upsertPrivacyLabel({
        companyId,
        stakeholderId: s.id,
        hashedId,
        encryptedLabel: generatePrivacyLabel(),
      });
    }
  } catch (err) {
    console.log("Note: Could not seed privacy labels");
  }
}

async function seedTestDriveDocuments(storage: IStorage, companyId: string) {
  try {
    const docs = await storage.getDocuments(companyId);
    const existingNames = new Set(docs.map(d => d.name));
    for (const item of TEST_DRIVE_CHECKLISTS) {
      if (!existingNames.has(item.name)) {
        await storage.createDocument({
          companyId,
          name: item.name,
          type: "other",
          description: `[Category: Test Drives] | Page: ${item.pageLink}`,
          uploadDate: new Date().toISOString().split("T")[0],
          uploadedBy: "System",
          encrypted: false,
        });
      }
    }
  } catch (err) {
    console.log("Note: Could not seed test drive documents");
  }
}
