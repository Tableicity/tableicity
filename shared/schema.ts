import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, pgEnum, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stakeholderTypeEnum = pgEnum("stakeholder_type", ["founder", "investor", "employee", "advisor", "board_member"]);
export const shareClassTypeEnum = pgEnum("share_class_type", ["common", "preferred", "options"]);
export const securityStatusEnum = pgEnum("security_status", ["active", "cancelled", "exercised", "expired"]);
export const safeStatusEnum = pgEnum("safe_status", ["draft", "sent_to_template", "sent", "signed", "converted", "cancelled"]);
export const templateTypeEnum = pgEnum("template_type", ["safe", "convertible_note", "warrant", "custom_note"]);
export const documentTypeEnum = pgEnum("document_type", ["legal", "financial", "corporate", "investor", "other"]);
export const updateStatusEnum = pgEnum("update_status", ["draft", "sent"]);
export const userRoleEnum = pgEnum("user_role", ["platform_admin", "tenant_admin", "tenant_staff", "shareholder"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  emailVerified: boolean("email_verified").notNull().default(false),
  googleId: text("google_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: text("created_at"),
});

export const tenantMembers = pgTable("tenant_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: userRoleEnum("role").notNull().default("tenant_staff"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at"),
});

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  plan: text("plan").notNull().default("standard"),
  ownerEmail: text("owner_email").notNull(),
  maxUsers: integer("max_users").default(10),
  maxCompanies: integer("max_companies").default(1),
  language: varchar("language", { length: 10 }).default("en"),
  orgSize: varchar("org_size", { length: 50 }),
  timeZone: varchar("time_zone", { length: 100 }),
  isSandbox: boolean("is_sandbox").notNull().default(false),
  trialEndsAt: text("trial_ends_at"),
  createdAt: text("created_at"),
});

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  incorporationDate: text("incorporation_date"),
  incorporationState: text("incorporation_state"),
  ein: text("ein"),
  address: text("address"),
  totalAuthorizedShares: integer("total_authorized_shares").default(10000000),
});

export const stakeholders = pgTable("stakeholders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  userId: varchar("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  type: stakeholderTypeEnum("type").notNull(),
  title: text("title"),
  address: text("address"),
  avatarInitials: text("avatar_initials"),
});

export const shareClasses = pgTable("share_classes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  type: shareClassTypeEnum("type").notNull(),
  pricePerShare: decimal("price_per_share", { precision: 10, scale: 4 }).default("0.0001"),
  authorizedShares: integer("authorized_shares").notNull(),
  boardApprovalDate: text("board_approval_date"),
  liquidationPreference: decimal("liquidation_preference", { precision: 10, scale: 2 }).default("1.00"),
});

export const securities = pgTable("securities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  stakeholderId: varchar("stakeholder_id").notNull(),
  shareClassId: varchar("share_class_id").notNull(),
  certificateId: text("certificate_id"),
  shares: integer("shares").notNull(),
  pricePerShare: decimal("price_per_share", { precision: 10, scale: 4 }),
  issueDate: text("issue_date").notNull(),
  status: securityStatusEnum("status").notNull().default("active"),
  vestingSchedule: text("vesting_schedule"),
  notes: text("notes"),
});

export const investmentRounds = pgTable("investment_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  roundName: varchar("round_name", { length: 255 }).notNull(),
  roundDate: text("round_date"),
  createdAt: text("created_at"),
});

export const safeAgreements = pgTable("safe_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  stakeholderId: varchar("stakeholder_id").notNull(),
  docRef: varchar("doc_ref", { length: 50 }),
  investmentAmount: decimal("investment_amount", { precision: 12, scale: 2 }).notNull(),
  valuationCap: decimal("valuation_cap", { precision: 15, scale: 2 }),
  discountRate: decimal("discount_rate", { precision: 5, scale: 2 }),
  safeType: text("safe_type").notNull().default("post-money"),
  status: safeStatusEnum("status").notNull().default("draft"),
  issueDate: text("issue_date"),
  conversionDate: text("conversion_date"),
  notes: text("notes"),
  investmentRoundId: varchar("investment_round_id"),
  investmentRoundName: varchar("investment_round_name", { length: 255 }),
  raiseGoal: decimal("raise_goal", { precision: 15, scale: 2 }),
  endDate: text("end_date"),
  templateVariables: jsonb("template_variables"),
  templateId: varchar("template_id"),
});

export const safeTemplates = pgTable("safe_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  templateType: varchar("template_type", { length: 50 }).notNull().default("safe"),
  templateVersion: varchar("template_version", { length: 50 }).default("1.0"),
  description: text("description"),
  rawContent: text("raw_content").notNull(),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  type: documentTypeEnum("type").notNull(),
  description: text("description"),
  uploadDate: text("upload_date").notNull(),
  fileSize: text("file_size"),
  uploadedBy: text("uploaded_by"),
  fileUrl: text("file_url"),
  fileSizeBytes: integer("file_size_bytes"),
  mimeType: text("mime_type"),
  encrypted: boolean("encrypted").notNull().default(false),
  content: text("content"),
});

export const investorUpdates = pgTable("investor_updates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: updateStatusEnum("status").notNull().default("draft"),
  sentDate: text("sent_date"),
  createdDate: text("created_date").notNull(),
  recipientCount: integer("recipient_count").default(0),
});

export const esopPools = pgTable("esop_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  approvedDate: text("approved_date").notNull(),
  underlyingShareClass: text("underlying_share_class").notNull().default("Common"),
  allocatedShares: integer("allocated_shares").notNull(),
  grantedShares: integer("granted_shares").notNull().default(0),
  vestedShares: integer("vested_shares").notNull().default(0),
  exercisedShares: integer("exercised_shares").notNull().default(0),
  createdAt: text("created_at"),
});

export const esopPlans = pgTable("esop_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  poolId: varchar("pool_id").notNull(),
  name: text("name").notNull(),
  approvedDate: text("approved_date").notNull(),
  grantType: text("grant_type").notNull().default("stock_options"),
  grantPresets: text("grant_presets"),
  documents: text("documents"),
  internalNote: text("internal_note"),
  createdAt: text("created_at"),
});

export const esopGrantStatusEnum = pgEnum("esop_grant_status", ["active", "partially_exercised", "fully_exercised", "forfeited", "cancelled", "expired"]);

export const esopGrants = pgTable("esop_grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  poolId: varchar("pool_id").notNull(),
  planId: varchar("plan_id").notNull(),
  stakeholderId: varchar("stakeholder_id").notNull(),
  grantName: text("grant_name").notNull(),
  grantDate: text("grant_date").notNull(),
  shares: integer("shares").notNull(),
  exercisePrice: decimal("exercise_price", { precision: 12, scale: 4 }).notNull(),
  underlyingShareClass: text("underlying_share_class").notNull().default("Common"),
  vestingStartDate: text("vesting_start_date"),
  vestingDurationMonths: integer("vesting_duration_months"),
  cliffMonths: integer("cliff_months"),
  vestFrequencyMonths: integer("vest_frequency_months"),
  vestedShares: integer("vested_shares").notNull().default(0),
  exercisedShares: integer("exercised_shares").notNull().default(0),
  status: esopGrantStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const warrantStatusEnum = pgEnum("warrant_status", ["active", "exercised", "expired", "cancelled"]);

export const warrants = pgTable("warrants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  stakeholderId: varchar("stakeholder_id").notNull(),
  name: text("name").notNull(),
  underlyingShareClass: text("underlying_share_class").notNull().default("Common"),
  shares: integer("shares").notNull(),
  exercisePrice: decimal("exercise_price", { precision: 12, scale: 4 }).notNull(),
  issueDate: text("issue_date").notNull(),
  expirationDate: text("expiration_date").notNull(),
  vestingSchedule: text("vesting_schedule"),
  status: warrantStatusEnum("status").notNull().default("active"),
  exercisedDate: text("exercised_date"),
  exercisedShares: integer("exercised_shares").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const phantomGrantStatusEnum = pgEnum("phantom_grant_status", ["active", "vested", "paid_out", "forfeited", "cancelled"]);
export const phantomPlanTypeEnum = pgEnum("phantom_plan_type", ["appreciation_only", "full_value"]);
export const phantomPayoutTriggerEnum = pgEnum("phantom_payout_trigger", ["exit", "ipo", "milestone", "annual", "termination"]);

export const phantomGrants = pgTable("phantom_grants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  stakeholderId: varchar("stakeholder_id").notNull(),
  grantName: text("grant_name").notNull(),
  grantDate: text("grant_date").notNull(),
  sharesEquivalent: integer("shares_equivalent").notNull(),
  grantPricePerUnit: decimal("grant_price_per_unit", { precision: 12, scale: 4 }).notNull(),
  planType: phantomPlanTypeEnum("plan_type").notNull().default("full_value"),
  vestingSchedule: text("vesting_schedule"),
  cliffMonths: integer("cliff_months"),
  vestingMonths: integer("vesting_months"),
  payoutTrigger: phantomPayoutTriggerEnum("payout_trigger").notNull().default("exit"),
  payoutDate: text("payout_date"),
  payoutAmount: decimal("payout_amount", { precision: 14, scale: 2 }),
  currentSharePrice: decimal("current_share_price", { precision: 12, scale: 4 }),
  status: phantomGrantStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const sarStatusEnum = pgEnum("sar_status", ["active", "vested", "exercised", "forfeited", "cancelled", "expired"]);
export const sarSettlementTypeEnum = pgEnum("sar_settlement_type", ["cash", "stock", "choice"]);

export const sars = pgTable("sars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  stakeholderId: varchar("stakeholder_id").notNull(),
  grantName: text("grant_name").notNull(),
  grantDate: text("grant_date").notNull(),
  units: integer("units").notNull(),
  basePrice: decimal("base_price", { precision: 12, scale: 4 }).notNull(),
  settlementType: sarSettlementTypeEnum("settlement_type").notNull().default("cash"),
  underlyingShareClass: text("underlying_share_class"),
  vestingSchedule: text("vesting_schedule"),
  cliffMonths: integer("cliff_months"),
  vestingMonths: integer("vesting_months"),
  expirationDate: text("expiration_date"),
  exerciseDate: text("exercise_date"),
  exercisePrice: decimal("exercise_price", { precision: 12, scale: 4 }),
  exercisedUnits: integer("exercised_units").notNull().default(0),
  payoutAmount: decimal("payout_amount", { precision: 14, scale: 2 }),
  exerciseTrigger: text("exercise_trigger"),
  status: sarStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: text("created_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantSlug: text("tenant_slug"),
  userId: varchar("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  userRole: text("user_role"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull(),
});

export const emailVerifications = pgTable("email_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  used: boolean("used").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).omit({ passwordHash: true });

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password is required"),
});

export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertTenantMemberSchema = createInsertSchema(tenantMembers).omit({ id: true, createdAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true });
export const insertStakeholderSchema = createInsertSchema(stakeholders).omit({ id: true });
export const insertShareClassSchema = createInsertSchema(shareClasses).omit({ id: true });
export const insertSecuritySchema = createInsertSchema(securities).omit({ id: true });
export const insertInvestmentRoundSchema = createInsertSchema(investmentRounds).omit({ id: true });
export const insertSafeAgreementSchema = createInsertSchema(safeAgreements).omit({ id: true });
export const insertSafeTemplateSchema = createInsertSchema(safeTemplates).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export const insertInvestorUpdateSchema = createInsertSchema(investorUpdates).omit({ id: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type TenantMember = typeof tenantMembers.$inferSelect;
export type InsertTenantMember = z.infer<typeof insertTenantMemberSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = z.infer<typeof insertStakeholderSchema>;
export type ShareClass = typeof shareClasses.$inferSelect;
export type InsertShareClass = z.infer<typeof insertShareClassSchema>;
export type Security = typeof securities.$inferSelect;
export type InsertSecurity = z.infer<typeof insertSecuritySchema>;
export type InvestmentRound = typeof investmentRounds.$inferSelect;
export type InsertInvestmentRound = z.infer<typeof insertInvestmentRoundSchema>;
export type SafeAgreement = typeof safeAgreements.$inferSelect;
export type InsertSafeAgreement = z.infer<typeof insertSafeAgreementSchema>;
export type SafeTemplate = typeof safeTemplates.$inferSelect;
export type InsertSafeTemplate = z.infer<typeof insertSafeTemplateSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InvestorUpdate = typeof investorUpdates.$inferSelect;
export type InsertInvestorUpdate = z.infer<typeof insertInvestorUpdateSchema>;

export const trialSignups = pgTable("trial_signups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  companyName: varchar("company_name", { length: 255 }),
  passwordHash: text("password_hash"),
  agreedToTerms: boolean("agreed_to_terms").default(false),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: varchar("verification_token", { length: 255 }),
  userId: varchar("user_id"),
  createdAt: text("created_at"),
  accountCreatedAt: text("account_created_at"),
  verifiedAt: text("verified_at"),
});

export const insertTrialSignupSchema = createInsertSchema(trialSignups).omit({ id: true, createdAt: true, accountCreatedAt: true, verifiedAt: true, passwordHash: true, agreedToTerms: true, emailVerified: true, verificationToken: true, userId: true }).extend({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(1, "Phone number is required"),
  companyName: z.string().min(1, "Company name is required"),
});
export type TrialSignup = typeof trialSignups.$inferSelect;
export type InsertTrialSignup = z.infer<typeof insertTrialSignupSchema>;

export const resourceCategoryEnum = pgEnum("resource_category", ["esop", "legal", "compliance", "onboarding", "other"]);

export const platformResources = pgTable("platform_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: resourceCategoryEnum("category").notNull().default("other"),
  documentType: text("document_type").notNull().default("legal"),
  content: text("content"),
  mimeType: text("mime_type"),
  fileSize: text("file_size"),
  fileSizeBytes: integer("file_size_bytes"),
  autoSeed: boolean("auto_seed").notNull().default(true),
  adminOnly: boolean("admin_only").notNull().default(false),
  createdBy: varchar("created_by"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertPlatformResourceSchema = createInsertSchema(platformResources).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });
export type PlatformResource = typeof platformResources.$inferSelect;
export type InsertPlatformResource = z.infer<typeof insertPlatformResourceSchema>;

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true });
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export const insertEsopPoolSchema = createInsertSchema(esopPools).omit({ id: true, createdAt: true, companyId: true, grantedShares: true, vestedShares: true, exercisedShares: true }).extend({
  name: z.string().min(1, "Pool name is required"),
  allocatedShares: z.number().int().positive("Amount must be greater than 0"),
  approvedDate: z.string().min(1, "Date is required"),
  underlyingShareClass: z.string().min(1, "Share class is required"),
});
export type EsopPool = typeof esopPools.$inferSelect;
export type InsertEsopPool = z.infer<typeof insertEsopPoolSchema>;

export const insertEsopPlanSchema = createInsertSchema(esopPlans).omit({ id: true, createdAt: true, companyId: true }).extend({
  name: z.string().min(1, "Plan name is required"),
  poolId: z.string().min(1, "Pool is required"),
  approvedDate: z.string().min(1, "Date is required"),
  grantType: z.string().min(1, "Grant type is required"),
});
export type EsopPlan = typeof esopPlans.$inferSelect;
export type InsertEsopPlan = z.infer<typeof insertEsopPlanSchema>;

export const insertEsopGrantSchema = createInsertSchema(esopGrants).omit({ id: true, createdAt: true, companyId: true, vestedShares: true, exercisedShares: true, status: true }).extend({
  grantName: z.string().min(1, "Grant name is required"),
  poolId: z.string().min(1, "Pool is required"),
  planId: z.string().min(1, "Plan is required"),
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  shares: z.coerce.number().int().positive("Shares must be greater than 0"),
  exercisePrice: z.string().min(1, "Exercise price is required"),
  grantDate: z.string().min(1, "Grant date is required"),
  underlyingShareClass: z.string().min(1, "Share class is required"),
});
export type EsopGrant = typeof esopGrants.$inferSelect;
export type InsertEsopGrant = z.infer<typeof insertEsopGrantSchema>;

export const insertWarrantSchema = createInsertSchema(warrants).omit({ id: true, createdAt: true, companyId: true, exercisedDate: true, exercisedShares: true, status: true }).extend({
  name: z.string().min(1, "Warrant name is required"),
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  shares: z.coerce.number().int().positive("Shares must be greater than 0"),
  exercisePrice: z.string().min(1, "Exercise price is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expirationDate: z.string().min(1, "Expiration date is required"),
  underlyingShareClass: z.string().min(1, "Share class is required"),
});
export type Warrant = typeof warrants.$inferSelect;
export type InsertWarrant = z.infer<typeof insertWarrantSchema>;

export const insertPhantomGrantSchema = createInsertSchema(phantomGrants).omit({ id: true, createdAt: true, companyId: true, payoutDate: true, payoutAmount: true, currentSharePrice: true, status: true }).extend({
  grantName: z.string().min(1, "Grant name is required"),
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  sharesEquivalent: z.coerce.number().int().positive("Units must be greater than 0"),
  grantPricePerUnit: z.string().min(1, "Grant price is required"),
  grantDate: z.string().min(1, "Grant date is required"),
  planType: z.enum(["appreciation_only", "full_value"]),
  payoutTrigger: z.enum(["exit", "ipo", "milestone", "annual", "termination"]),
});
export type PhantomGrant = typeof phantomGrants.$inferSelect;
export type InsertPhantomGrant = z.infer<typeof insertPhantomGrantSchema>;

export const insertSarSchema = createInsertSchema(sars).omit({ id: true, createdAt: true, companyId: true, exerciseDate: true, exercisePrice: true, exercisedUnits: true, payoutAmount: true, status: true }).extend({
  grantName: z.string().min(1, "Grant name is required"),
  stakeholderId: z.string().min(1, "Stakeholder is required"),
  units: z.coerce.number().int().positive("Units must be greater than 0"),
  basePrice: z.string().min(1, "Base price is required"),
  grantDate: z.string().min(1, "Grant date is required"),
  settlementType: z.enum(["cash", "stock", "choice"]),
});
export type Sar = typeof sars.$inferSelect;
export type InsertSar = z.infer<typeof insertSarSchema>;

export const insertEmailVerificationSchema = createInsertSchema(emailVerifications).omit({ id: true });
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type InsertEmailVerification = z.infer<typeof insertEmailVerificationSchema>;

export const dataStoreCategories = pgTable("data_store_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at"),
});

export const insertDataStoreCategorySchema = createInsertSchema(dataStoreCategories).omit({ id: true, createdAt: true });
export type DataStoreCategory = typeof dataStoreCategories.$inferSelect;
export type InsertDataStoreCategory = z.infer<typeof insertDataStoreCategorySchema>;

export const privacyLabels = pgTable("privacy_labels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  stakeholderId: varchar("stakeholder_id").notNull(),
  hashedId: text("hashed_id").notNull(),
  encryptedLabel: text("encrypted_label"),
  createdAt: text("created_at"),
});

export const insertPrivacyLabelSchema = createInsertSchema(privacyLabels).omit({ id: true, createdAt: true });
export type PrivacyLabel = typeof privacyLabels.$inferSelect;
export type InsertPrivacyLabel = z.infer<typeof insertPrivacyLabelSchema>;

export const proofStatusEnum = pgEnum("proof_status", ["pending", "generating", "complete", "failed", "expired"]);

export const commitmentRecords = pgTable("commitment_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  holderRef: varchar("holder_ref").notNull(),
  commitmentHash: varchar("commitment_hash").notNull(),
  pedersenCommitment: varchar("pedersen_commitment"),
  salt: varchar("salt").notNull(),
  shareClass: varchar("share_class").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at"),
});

export const insertCommitmentRecordSchema = createInsertSchema(commitmentRecords).omit({ id: true, createdAt: true });
export type CommitmentRecord = typeof commitmentRecords.$inferSelect;
export type InsertCommitmentRecord = z.infer<typeof insertCommitmentRecordSchema>;

export const proofRequests = pgTable("proof_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  proofType: varchar("proof_type").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  publicInputs: jsonb("public_inputs").default({}).notNull(),
  status: proofStatusEnum("status").notNull().default("pending"),
  createdAt: text("created_at"),
  expiresAt: text("expires_at"),
});

export const insertProofRequestSchema = createInsertSchema(proofRequests).omit({ id: true, createdAt: true });
export type ProofRequest = typeof proofRequests.$inferSelect;
export type InsertProofRequest = z.infer<typeof insertProofRequestSchema>;

export const proofResults = pgTable("proof_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  proofHex: text("proof_hex").notNull(),
  verificationKeyHex: text("verification_key_hex").notNull(),
  verified: boolean("verified").notNull().default(false),
  generatedAt: text("generated_at"),
});

export const insertProofResultSchema = createInsertSchema(proofResults).omit({ id: true, generatedAt: true });
export type ProofResult = typeof proofResults.$inferSelect;
export type InsertProofResult = z.infer<typeof insertProofResultSchema>;

export const proofUsage = pgTable("proof_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  billingMonth: varchar("billing_month", { length: 7 }).notNull(),
  proofCount: integer("proof_count").notNull().default(0),
  lastResetAt: text("last_reset_at"),
  updatedAt: text("updated_at"),
}, (table) => ({
  tenantMonthUnique: uniqueIndex("proof_usage_tenant_month_idx").on(table.tenantId, table.billingMonth),
}));

export type ProofUsage = typeof proofUsage.$inferSelect;
