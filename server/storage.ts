import { eq, and, sql } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db } from "./db";
import {
  companies, stakeholders, shareClasses, securities,
  safeAgreements, documents, investorUpdates, investmentRounds, safeTemplates, esopPools, esopPlans, esopGrants,
  type Company, type InsertCompany,
  type Stakeholder, type InsertStakeholder,
  type ShareClass, type InsertShareClass,
  type Security, type InsertSecurity,
  type SafeAgreement, type InsertSafeAgreement,
  type SafeTemplate, type InsertSafeTemplate,
  type Document, type InsertDocument,
  type InvestorUpdate, type InsertInvestorUpdate,
  type InvestmentRound, type InsertInvestmentRound,
  type EsopPool, type InsertEsopPool,
  type EsopPlan, type InsertEsopPlan,
  type EsopGrant, type InsertEsopGrant,
  type Warrant, type InsertWarrant,
  type PhantomGrant, type InsertPhantomGrant,
  type Sar, type InsertSar,
  type DataStoreCategory, type InsertDataStoreCategory,
  type PrivacyLabel, type InsertPrivacyLabel,
  type CommitmentRecord, type InsertCommitmentRecord,
  type ProofRequest, type InsertProofRequest,
  type ProofResult, type InsertProofResult,
  type ProofUsage,
  warrants, phantomGrants, sars, dataStoreCategories, privacyLabels,
  commitmentRecords, proofRequests, proofResults, proofUsage,
} from "@shared/schema";
import * as schema from "@shared/schema";

export interface IStorage {
  getCompany(): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company>;

  getStakeholders(companyId: string): Promise<Stakeholder[]>;
  getStakeholder(id: string): Promise<Stakeholder | undefined>;
  getStakeholderByUserId(companyId: string, userId: string): Promise<Stakeholder | undefined>;
  createStakeholder(data: InsertStakeholder): Promise<Stakeholder>;
  updateStakeholder(id: string, data: Partial<InsertStakeholder>): Promise<Stakeholder>;
  deleteStakeholder(id: string): Promise<void>;

  getShareClasses(companyId: string): Promise<ShareClass[]>;
  getShareClass(id: string): Promise<ShareClass | undefined>;
  createShareClass(data: InsertShareClass): Promise<ShareClass>;
  updateShareClass(id: string, data: Partial<InsertShareClass>): Promise<ShareClass>;
  deleteShareClass(id: string): Promise<void>;

  getSecurities(companyId: string): Promise<Security[]>;
  getSecurity(id: string): Promise<Security | undefined>;
  createSecurity(data: InsertSecurity): Promise<Security>;
  updateSecurity(id: string, data: Partial<InsertSecurity>): Promise<Security>;
  deleteSecurity(id: string): Promise<void>;

  getInvestmentRounds(companyId: string): Promise<InvestmentRound[]>;
  getInvestmentRound(id: string): Promise<InvestmentRound | undefined>;
  createInvestmentRound(data: InsertInvestmentRound): Promise<InvestmentRound>;

  getSafeAgreements(companyId: string): Promise<SafeAgreement[]>;
  getSafeAgreement(id: string): Promise<SafeAgreement | undefined>;
  createSafeAgreement(data: InsertSafeAgreement): Promise<SafeAgreement>;
  updateSafeAgreement(id: string, data: Partial<InsertSafeAgreement>): Promise<SafeAgreement>;
  deleteSafeAgreement(id: string): Promise<void>;

  getActiveSafeTemplate(): Promise<SafeTemplate | undefined>;
  getSafeTemplates(): Promise<SafeTemplate[]>;
  getSafeTemplatesByType(templateType: string): Promise<SafeTemplate[]>;
  getSafeTemplate(id: string): Promise<SafeTemplate | undefined>;
  createSafeTemplate(data: InsertSafeTemplate): Promise<SafeTemplate>;
  updateSafeTemplate(id: string, data: Partial<InsertSafeTemplate>): Promise<SafeTemplate>;
  deleteSafeTemplate(id: string): Promise<void>;

  getDocuments(companyId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(data: InsertDocument): Promise<Document>;
  updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string): Promise<void>;

  getInvestorUpdates(companyId: string): Promise<InvestorUpdate[]>;
  getInvestorUpdate(id: string): Promise<InvestorUpdate | undefined>;
  createInvestorUpdate(data: InsertInvestorUpdate): Promise<InvestorUpdate>;
  updateInvestorUpdate(id: string, data: Partial<InsertInvestorUpdate>): Promise<InvestorUpdate>;

  getEsopPools(companyId: string): Promise<EsopPool[]>;
  getEsopPool(id: string): Promise<EsopPool | undefined>;
  createEsopPool(data: InsertEsopPool & { companyId: string }): Promise<EsopPool>;
  updateEsopPool(id: string, data: Partial<InsertEsopPool>): Promise<EsopPool>;
  deleteEsopPool(id: string): Promise<void>;

  getEsopPlans(companyId: string): Promise<EsopPlan[]>;
  getEsopPlan(id: string): Promise<EsopPlan | undefined>;
  createEsopPlan(data: InsertEsopPlan & { companyId: string }): Promise<EsopPlan>;
  updateEsopPlan(id: string, data: Partial<InsertEsopPlan>): Promise<EsopPlan>;
  deleteEsopPlan(id: string): Promise<void>;

  getEsopGrants(companyId: string): Promise<EsopGrant[]>;
  getEsopGrant(id: string): Promise<EsopGrant | undefined>;
  createEsopGrant(data: InsertEsopGrant & { companyId: string }): Promise<EsopGrant>;
  updateEsopGrant(id: string, data: Partial<InsertEsopGrant & { status: string; vestedShares: number; exercisedShares: number }>): Promise<EsopGrant>;
  deleteEsopGrant(id: string): Promise<void>;

  getWarrants(companyId: string): Promise<Warrant[]>;
  getWarrant(id: string): Promise<Warrant | undefined>;
  createWarrant(data: InsertWarrant & { companyId: string }): Promise<Warrant>;
  updateWarrant(id: string, data: Partial<InsertWarrant & { status: string; exercisedDate: string; exercisedShares: number }>): Promise<Warrant>;
  deleteWarrant(id: string): Promise<void>;

  getPhantomGrants(companyId: string): Promise<PhantomGrant[]>;
  getPhantomGrant(id: string): Promise<PhantomGrant | undefined>;
  createPhantomGrant(data: InsertPhantomGrant & { companyId: string }): Promise<PhantomGrant>;
  updatePhantomGrant(id: string, data: Partial<InsertPhantomGrant & { status: string; payoutDate: string; payoutAmount: string; currentSharePrice: string }>): Promise<PhantomGrant>;
  deletePhantomGrant(id: string): Promise<void>;

  getSars(companyId: string): Promise<Sar[]>;
  getSar(id: string): Promise<Sar | undefined>;
  createSar(data: InsertSar & { companyId: string }): Promise<Sar>;
  updateSar(id: string, data: Partial<InsertSar & { status: string; exerciseDate: string; exercisePrice: string; exercisedUnits: number; payoutAmount: string }>): Promise<Sar>;
  deleteSar(id: string): Promise<void>;

  getDataStoreCategories(orgId: string): Promise<DataStoreCategory[]>;
  createDataStoreCategory(data: InsertDataStoreCategory): Promise<DataStoreCategory>;
  deleteDataStoreCategory(id: string): Promise<void>;

  getPrivacyLabels(companyId: string): Promise<PrivacyLabel[]>;
  upsertPrivacyLabel(data: InsertPrivacyLabel): Promise<PrivacyLabel>;

  getCommitmentRecords(tenantId: string): Promise<CommitmentRecord[]>;
  getCommitmentRecord(id: string): Promise<CommitmentRecord | undefined>;
  getCommitmentByHolderAndClass(tenantId: string, holderRef: string, shareClass: string): Promise<CommitmentRecord | undefined>;
  createCommitmentRecord(data: InsertCommitmentRecord): Promise<CommitmentRecord>;
  updateCommitmentRecord(id: string, data: Partial<InsertCommitmentRecord>): Promise<CommitmentRecord>;

  getProofRequests(tenantId: string): Promise<ProofRequest[]>;
  getProofRequest(id: string): Promise<ProofRequest | undefined>;
  createProofRequest(data: InsertProofRequest): Promise<ProofRequest>;
  updateProofRequest(id: string, data: Partial<InsertProofRequest>): Promise<ProofRequest>;

  getProofResult(requestId: string): Promise<ProofResult | undefined>;
  createProofResult(data: InsertProofResult): Promise<ProofResult>;

  getProofUsage(tenantId: string, billingMonth: string): Promise<ProofUsage | undefined>;
  incrementProofUsage(tenantId: string, billingMonth: string): Promise<ProofUsage>;
}

export class DatabaseStorage implements IStorage {
  private _db: NodePgDatabase<typeof schema>;

  constructor(dbInstance?: NodePgDatabase<typeof schema>) {
    this._db = dbInstance || db;
  }

  async getCompany(): Promise<Company | undefined> {
    const [company] = await this._db.select().from(companies).limit(1);
    return company;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const [company] = await this._db.insert(companies).values(data).returning();
    return company;
  }

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company> {
    const [company] = await this._db.update(companies).set(data).where(eq(companies.id, id)).returning();
    return company;
  }

  async getStakeholders(companyId: string): Promise<Stakeholder[]> {
    return this._db.select().from(stakeholders).where(eq(stakeholders.companyId, companyId));
  }

  async getStakeholder(id: string): Promise<Stakeholder | undefined> {
    const [s] = await this._db.select().from(stakeholders).where(eq(stakeholders.id, id));
    return s;
  }

  async getStakeholderByUserId(companyId: string, userId: string): Promise<Stakeholder | undefined> {
    const [s] = await this._db.select().from(stakeholders).where(
      and(eq(stakeholders.companyId, companyId), eq(stakeholders.userId, userId))
    );
    return s;
  }

  async createStakeholder(data: InsertStakeholder): Promise<Stakeholder> {
    const [s] = await this._db.insert(stakeholders).values(data).returning();
    return s;
  }

  async updateStakeholder(id: string, data: Partial<InsertStakeholder>): Promise<Stakeholder> {
    const [s] = await this._db.update(stakeholders).set(data).where(eq(stakeholders.id, id)).returning();
    return s;
  }

  async deleteStakeholder(id: string): Promise<void> {
    await this._db.delete(stakeholders).where(eq(stakeholders.id, id));
  }

  async getShareClasses(companyId: string): Promise<ShareClass[]> {
    return this._db.select().from(shareClasses).where(eq(shareClasses.companyId, companyId));
  }

  async getShareClass(id: string): Promise<ShareClass | undefined> {
    const [s] = await this._db.select().from(shareClasses).where(eq(shareClasses.id, id));
    return s;
  }

  async createShareClass(data: InsertShareClass): Promise<ShareClass> {
    const [s] = await this._db.insert(shareClasses).values(data).returning();
    return s;
  }

  async updateShareClass(id: string, data: Partial<InsertShareClass>): Promise<ShareClass> {
    const [s] = await this._db.update(shareClasses).set(data).where(eq(shareClasses.id, id)).returning();
    return s;
  }

  async deleteShareClass(id: string): Promise<void> {
    await this._db.delete(shareClasses).where(eq(shareClasses.id, id));
  }

  async getSecurities(companyId: string): Promise<Security[]> {
    return this._db.select().from(securities).where(eq(securities.companyId, companyId));
  }

  async getSecurity(id: string): Promise<Security | undefined> {
    const [s] = await this._db.select().from(securities).where(eq(securities.id, id));
    return s;
  }

  async createSecurity(data: InsertSecurity): Promise<Security> {
    const [s] = await this._db.insert(securities).values(data).returning();
    return s;
  }

  async updateSecurity(id: string, data: Partial<InsertSecurity>): Promise<Security> {
    const [s] = await this._db.update(securities).set(data).where(eq(securities.id, id)).returning();
    return s;
  }

  async deleteSecurity(id: string): Promise<void> {
    await this._db.delete(securities).where(eq(securities.id, id));
  }

  async getInvestmentRounds(companyId: string): Promise<InvestmentRound[]> {
    return this._db.select().from(investmentRounds).where(eq(investmentRounds.companyId, companyId));
  }

  async getInvestmentRound(id: string): Promise<InvestmentRound | undefined> {
    const [r] = await this._db.select().from(investmentRounds).where(eq(investmentRounds.id, id));
    return r;
  }

  async createInvestmentRound(data: InsertInvestmentRound): Promise<InvestmentRound> {
    const [r] = await this._db.insert(investmentRounds).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning();
    return r;
  }

  async getSafeAgreements(companyId: string): Promise<SafeAgreement[]> {
    return this._db.select().from(safeAgreements).where(eq(safeAgreements.companyId, companyId));
  }

  async getSafeAgreement(id: string): Promise<SafeAgreement | undefined> {
    const [s] = await this._db.select().from(safeAgreements).where(eq(safeAgreements.id, id));
    return s;
  }

  async createSafeAgreement(data: InsertSafeAgreement): Promise<SafeAgreement> {
    const [s] = await this._db.insert(safeAgreements).values(data).returning();
    return s;
  }

  async updateSafeAgreement(id: string, data: Partial<InsertSafeAgreement>): Promise<SafeAgreement> {
    const [s] = await this._db.update(safeAgreements).set(data).where(eq(safeAgreements.id, id)).returning();
    return s;
  }

  async deleteSafeAgreement(id: string): Promise<void> {
    await this._db.delete(safeAgreements).where(eq(safeAgreements.id, id));
  }

  async getActiveSafeTemplate(): Promise<SafeTemplate | undefined> {
    const [t] = await this._db.select().from(safeTemplates).where(eq(safeTemplates.isActive, true)).limit(1);
    return t;
  }

  async getSafeTemplates(): Promise<SafeTemplate[]> {
    return this._db.select().from(safeTemplates);
  }

  async getSafeTemplatesByType(templateType: string): Promise<SafeTemplate[]> {
    return this._db.select().from(safeTemplates).where(eq(safeTemplates.templateType, templateType));
  }

  async getSafeTemplate(id: string): Promise<SafeTemplate | undefined> {
    const [t] = await this._db.select().from(safeTemplates).where(eq(safeTemplates.id, id));
    return t;
  }

  async createSafeTemplate(data: InsertSafeTemplate): Promise<SafeTemplate> {
    const [t] = await this._db.insert(safeTemplates).values({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).returning();
    return t;
  }

  async updateSafeTemplate(id: string, data: Partial<InsertSafeTemplate>): Promise<SafeTemplate> {
    const [t] = await this._db.update(safeTemplates).set({
      ...data,
      updatedAt: new Date().toISOString(),
    }).where(eq(safeTemplates.id, id)).returning();
    return t;
  }

  async deleteSafeTemplate(id: string): Promise<void> {
    await this._db.delete(safeTemplates).where(eq(safeTemplates.id, id));
  }

  async getDocuments(companyId: string): Promise<Document[]> {
    return this._db.select().from(documents).where(eq(documents.companyId, companyId));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [s] = await this._db.select().from(documents).where(eq(documents.id, id));
    return s;
  }

  async createDocument(data: InsertDocument): Promise<Document> {
    const [s] = await this._db.insert(documents).values(data).returning();
    return s;
  }

  async updateDocument(id: string, data: Partial<InsertDocument>): Promise<Document> {
    const [s] = await this._db.update(documents).set(data).where(eq(documents.id, id)).returning();
    return s;
  }

  async deleteDocument(id: string): Promise<void> {
    await this._db.delete(documents).where(eq(documents.id, id));
  }

  async getInvestorUpdates(companyId: string): Promise<InvestorUpdate[]> {
    return this._db.select().from(investorUpdates).where(eq(investorUpdates.companyId, companyId));
  }

  async getInvestorUpdate(id: string): Promise<InvestorUpdate | undefined> {
    const [s] = await this._db.select().from(investorUpdates).where(eq(investorUpdates.id, id));
    return s;
  }

  async createInvestorUpdate(data: InsertInvestorUpdate): Promise<InvestorUpdate> {
    const [s] = await this._db.insert(investorUpdates).values(data).returning();
    return s;
  }

  async updateInvestorUpdate(id: string, data: Partial<InsertInvestorUpdate>): Promise<InvestorUpdate> {
    const [s] = await this._db.update(investorUpdates).set(data).where(eq(investorUpdates.id, id)).returning();
    return s;
  }

  async getEsopPools(companyId: string): Promise<EsopPool[]> {
    return this._db.select().from(esopPools).where(eq(esopPools.companyId, companyId));
  }

  async getEsopPool(id: string): Promise<EsopPool | undefined> {
    const [p] = await this._db.select().from(esopPools).where(eq(esopPools.id, id));
    return p;
  }

  async createEsopPool(data: InsertEsopPool & { companyId: string }): Promise<EsopPool> {
    const [p] = await this._db.insert(esopPools).values({
      ...data,
      grantedShares: data.grantedShares ?? 0,
      vestedShares: data.vestedShares ?? 0,
      exercisedShares: data.exercisedShares ?? 0,
      createdAt: data.createdAt ?? new Date().toISOString(),
    }).returning();
    return p;
  }

  async updateEsopPool(id: string, data: Partial<InsertEsopPool>): Promise<EsopPool> {
    const [p] = await this._db.update(esopPools).set(data).where(eq(esopPools.id, id)).returning();
    return p;
  }

  async deleteEsopPool(id: string): Promise<void> {
    await this._db.delete(esopPools).where(eq(esopPools.id, id));
  }

  async getEsopPlans(companyId: string): Promise<EsopPlan[]> {
    return this._db.select().from(esopPlans).where(eq(esopPlans.companyId, companyId));
  }

  async getEsopPlan(id: string): Promise<EsopPlan | undefined> {
    const [p] = await this._db.select().from(esopPlans).where(eq(esopPlans.id, id));
    return p;
  }

  async createEsopPlan(data: InsertEsopPlan & { companyId: string }): Promise<EsopPlan> {
    const [p] = await this._db.insert(esopPlans).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning();
    return p;
  }

  async updateEsopPlan(id: string, data: Partial<InsertEsopPlan>): Promise<EsopPlan> {
    const [p] = await this._db.update(esopPlans).set(data).where(eq(esopPlans.id, id)).returning();
    return p;
  }

  async deleteEsopPlan(id: string): Promise<void> {
    await this._db.delete(esopPlans).where(eq(esopPlans.id, id));
  }

  async getEsopGrants(companyId: string): Promise<EsopGrant[]> {
    return this._db.select().from(esopGrants).where(eq(esopGrants.companyId, companyId));
  }

  async getEsopGrant(id: string): Promise<EsopGrant | undefined> {
    const [g] = await this._db.select().from(esopGrants).where(eq(esopGrants.id, id));
    return g;
  }

  async createEsopGrant(data: InsertEsopGrant & { companyId: string }): Promise<EsopGrant> {
    const [g] = await this._db.insert(esopGrants).values({
      ...data,
      vestedShares: 0,
      exercisedShares: 0,
      createdAt: new Date().toISOString(),
    }).returning();
    return g;
  }

  async updateEsopGrant(id: string, data: Partial<InsertEsopGrant & { status: string; vestedShares: number; exercisedShares: number }>): Promise<EsopGrant> {
    const [g] = await this._db.update(esopGrants).set(data).where(eq(esopGrants.id, id)).returning();
    return g;
  }

  async deleteEsopGrant(id: string): Promise<void> {
    await this._db.delete(esopGrants).where(eq(esopGrants.id, id));
  }

  async getWarrants(companyId: string): Promise<Warrant[]> {
    return this._db.select().from(warrants).where(eq(warrants.companyId, companyId));
  }

  async getWarrant(id: string): Promise<Warrant | undefined> {
    const [w] = await this._db.select().from(warrants).where(eq(warrants.id, id));
    return w;
  }

  async createWarrant(data: InsertWarrant & { companyId: string }): Promise<Warrant> {
    const [w] = await this._db.insert(warrants).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning();
    return w;
  }

  async updateWarrant(id: string, data: Partial<InsertWarrant & { status: string; exercisedDate: string; exercisedShares: number }>): Promise<Warrant> {
    const [w] = await this._db.update(warrants).set(data).where(eq(warrants.id, id)).returning();
    return w;
  }

  async deleteWarrant(id: string): Promise<void> {
    await this._db.delete(warrants).where(eq(warrants.id, id));
  }

  async getPhantomGrants(companyId: string): Promise<PhantomGrant[]> {
    return this._db.select().from(phantomGrants).where(eq(phantomGrants.companyId, companyId));
  }

  async getPhantomGrant(id: string): Promise<PhantomGrant | undefined> {
    const [g] = await this._db.select().from(phantomGrants).where(eq(phantomGrants.id, id));
    return g;
  }

  async createPhantomGrant(data: InsertPhantomGrant & { companyId: string }): Promise<PhantomGrant> {
    const [g] = await this._db.insert(phantomGrants).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning();
    return g;
  }

  async updatePhantomGrant(id: string, data: Partial<InsertPhantomGrant & { status: string; payoutDate: string; payoutAmount: string; currentSharePrice: string }>): Promise<PhantomGrant> {
    const [g] = await this._db.update(phantomGrants).set(data).where(eq(phantomGrants.id, id)).returning();
    return g;
  }

  async deletePhantomGrant(id: string): Promise<void> {
    await this._db.delete(phantomGrants).where(eq(phantomGrants.id, id));
  }

  async getSars(companyId: string): Promise<Sar[]> {
    return this._db.select().from(sars).where(eq(sars.companyId, companyId));
  }

  async getSar(id: string): Promise<Sar | undefined> {
    const [s] = await this._db.select().from(sars).where(eq(sars.id, id));
    return s;
  }

  async createSar(data: InsertSar & { companyId: string }): Promise<Sar> {
    const [s] = await this._db.insert(sars).values({ ...data, createdAt: new Date().toISOString() }).returning();
    return s;
  }

  async updateSar(id: string, data: Partial<InsertSar & { status: string; exerciseDate: string; exercisePrice: string; exercisedUnits: number; payoutAmount: string }>): Promise<Sar> {
    const [s] = await this._db.update(sars).set(data).where(eq(sars.id, id)).returning();
    return s;
  }

  async deleteSar(id: string): Promise<void> {
    await this._db.delete(sars).where(eq(sars.id, id));
  }

  async getDataStoreCategories(orgId: string): Promise<DataStoreCategory[]> {
    return this._db.select().from(dataStoreCategories).where(eq(dataStoreCategories.orgId, orgId));
  }

  async createDataStoreCategory(data: InsertDataStoreCategory): Promise<DataStoreCategory> {
    const [cat] = await this._db.insert(dataStoreCategories).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning();
    return cat;
  }

  async deleteDataStoreCategory(id: string): Promise<void> {
    await this._db.delete(dataStoreCategories).where(eq(dataStoreCategories.id, id));
  }

  async getPrivacyLabels(companyId: string): Promise<PrivacyLabel[]> {
    return this._db.select().from(privacyLabels).where(eq(privacyLabels.companyId, companyId));
  }

  async upsertPrivacyLabel(data: InsertPrivacyLabel): Promise<PrivacyLabel> {
    const existing = await this._db.select().from(privacyLabels)
      .where(and(eq(privacyLabels.companyId, data.companyId), eq(privacyLabels.stakeholderId, data.stakeholderId)));
    if (existing.length > 0) {
      const [updated] = await this._db.update(privacyLabels)
        .set({ encryptedLabel: data.encryptedLabel, hashedId: data.hashedId })
        .where(eq(privacyLabels.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await this._db.insert(privacyLabels).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning();
    return created;
  }

  async getCommitmentRecords(tenantId: string): Promise<CommitmentRecord[]> {
    return this._db.select().from(commitmentRecords)
      .where(and(eq(commitmentRecords.tenantId, tenantId), eq(commitmentRecords.isActive, true)));
  }

  async getCommitmentRecord(id: string): Promise<CommitmentRecord | undefined> {
    const [record] = await this._db.select().from(commitmentRecords).where(eq(commitmentRecords.id, id));
    return record;
  }

  async getCommitmentByHolderAndClass(tenantId: string, holderRef: string, shareClass: string): Promise<CommitmentRecord | undefined> {
    const [record] = await this._db.select().from(commitmentRecords)
      .where(and(
        eq(commitmentRecords.tenantId, tenantId),
        eq(commitmentRecords.holderRef, holderRef),
        eq(commitmentRecords.shareClass, shareClass),
        eq(commitmentRecords.isActive, true),
      ));
    return record;
  }

  async createCommitmentRecord(data: InsertCommitmentRecord): Promise<CommitmentRecord> {
    const [record] = await this._db.insert(commitmentRecords).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning();
    return record;
  }

  async updateCommitmentRecord(id: string, data: Partial<InsertCommitmentRecord>): Promise<CommitmentRecord> {
    const [record] = await this._db.update(commitmentRecords).set(data).where(eq(commitmentRecords.id, id)).returning();
    return record;
  }

  async getProofRequests(tenantId: string): Promise<ProofRequest[]> {
    return this._db.select().from(proofRequests).where(eq(proofRequests.tenantId, tenantId));
  }

  async getProofRequest(id: string): Promise<ProofRequest | undefined> {
    const [request] = await this._db.select().from(proofRequests).where(eq(proofRequests.id, id));
    return request;
  }

  async createProofRequest(data: InsertProofRequest): Promise<ProofRequest> {
    const [request] = await this._db.insert(proofRequests).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning();
    return request;
  }

  async updateProofRequest(id: string, data: Partial<InsertProofRequest>): Promise<ProofRequest> {
    const [request] = await this._db.update(proofRequests).set(data).where(eq(proofRequests.id, id)).returning();
    return request;
  }

  async getProofResult(requestId: string): Promise<ProofResult | undefined> {
    const [result] = await this._db.select().from(proofResults).where(eq(proofResults.requestId, requestId));
    return result;
  }

  async createProofResult(data: InsertProofResult): Promise<ProofResult> {
    const [result] = await this._db.insert(proofResults).values({
      ...data,
      generatedAt: new Date().toISOString(),
    }).returning();
    return result;
  }

  async getProofUsage(tenantId: string, billingMonth: string): Promise<ProofUsage | undefined> {
    const [record] = await this._db.select().from(proofUsage)
      .where(and(eq(proofUsage.tenantId, tenantId), eq(proofUsage.billingMonth, billingMonth)));
    return record;
  }

  async incrementProofUsage(tenantId: string, billingMonth: string): Promise<ProofUsage> {
    const now = new Date().toISOString();
    const result = await this._db.execute(sql`
      INSERT INTO proof_usage (id, tenant_id, billing_month, proof_count, updated_at)
      VALUES (gen_random_uuid(), ${tenantId}, ${billingMonth}, 1, ${now})
      ON CONFLICT (tenant_id, billing_month) DO UPDATE
      SET proof_count = proof_usage.proof_count + 1, updated_at = ${now}
      RETURNING *
    `);
    return result.rows[0] as unknown as ProofUsage;
  }
}

export function createTenantStorage(tenantDb: NodePgDatabase<typeof schema>): IStorage {
  return new DatabaseStorage(tenantDb);
}

export const storage = new DatabaseStorage();
