import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { DatabaseStorage, createTenantStorage, type IStorage } from "./storage";
import { getTenantDb, getTenant, listTenants, createTenant, deleteTenantSchema } from "./tenant";
import { requireAuth, getUserTenantRole } from "./auth";
import {
  insertStakeholderSchema, insertShareClassSchema, insertSecuritySchema,
  insertSafeAgreementSchema, insertDocumentSchema, insertInvestorUpdateSchema,
  insertTenantSchema, insertInvestmentRoundSchema, insertEsopPoolSchema, insertEsopPlanSchema, insertEsopGrantSchema,
  insertPlatformResourceSchema, insertWarrantSchema, insertPhantomGrantSchema, insertSarSchema, platformResources,
} from "@shared/schema";
import { logFromRequest, getAuditLogs } from "./audit";
import { computeVestedShares } from "./utils/vesting";
import { seedTemplatesForTenant, seedPlatformResourcesToTenant } from "./seed";
import multer from "multer";
import path from "path";
import fs from "fs";

declare global {
  namespace Express {
    interface Request {
      tenantSlug?: string;
      tenantStorage?: IStorage;
      tenantRole?: string;
      proofTierConfig?: import('./proof-config').ProofTierConfig;
      proofUsageCount?: number;
      proofBillingMonth?: string;
    }
  }
}

async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const slug = (req.query.tenant as string) || req.headers["x-tenant-id"] as string;

  if (!slug) {
    return res.status(400).json({ message: "Missing tenant. Provide ?tenant=slug query parameter." });
  }

  const tenant = await getTenant(slug);
  if (!tenant || tenant.status !== "active") {
    return res.status(404).json({ message: `Tenant '${slug}' not found or inactive.` });
  }

  if (req.isAuthenticated() && req.user) {
    if (!req.user.isPlatformAdmin) {
      const role = await getUserTenantRole(req.user.id, slug);
      if (!role) {
        return res.status(403).json({ message: "You do not have access to this tenant." });
      }
      req.tenantRole = role;
    } else {
      req.tenantRole = "platform_admin";
    }
  }

  const tenantDb = getTenantDb(slug);
  req.tenantSlug = slug;
  req.tenantStorage = createTenantStorage(tenantDb);
  next();
}

function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.tenantRole;
    if (!role) {
      return res.status(403).json({ message: "Access denied" });
    }
    if (role === "platform_admin" || allowedRoles.includes(role)) {
      return next();
    }
    return res.status(403).json({ message: "You do not have permission to access this resource" });
  };
}

async function ensureCompany(storage: IStorage) {
  let company = await storage.getCompany();
  if (!company) {
    company = await storage.createCompany({
      name: "New Company",
      totalAuthorizedShares: 10000000,
    });
  }
  return company;
}

const TRIAL_STORAGE_LIMIT = 250 * 1024 * 1024; // 250 MB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function parseFileSize(sizeStr: string): number {
  const match = sizeStr.trim().match(/^([\d.]+)\s*(B|KB|MB|GB)$/i);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  return Math.round(num * (multipliers[unit] || 0));
}

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
      "image/png",
      "image/jpeg",
      "image/gif",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported. Allowed: PDF, Word, Excel, PowerPoint, text, CSV, images."));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  const proofModule = await import("./proof-routes");
  const proofRouter = proofModule.default;
  const { publicRouter: proofPublicRouter } = proofModule;
  app.use("/api/v1", proofPublicRouter);
  app.use("/api/v1/proofs", requireAuth, tenantMiddleware, proofRouter);

  const hayloModule = await import("./haylo");
  const hayloRouter = hayloModule.default;
  app.use("/api/v1/haylo", requireAuth, tenantMiddleware, hayloRouter);

  app.use("/uploads", requireAuth, (req, res, next) => {
    const express = require("express");
    express.static(uploadsDir)(req, res, next);
  });

  app.get("/api/tenants", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const tenants = await listTenants();
      res.json(tenants);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tenants", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const parsed = insertTenantSchema.parse(req.body);
      if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(parsed.slug) && parsed.slug.length > 1) {
        return res.status(400).json({ message: "Slug must contain only lowercase letters, numbers, and hyphens" });
      }
      if (parsed.slug.length < 2 || parsed.slug.length > 63) {
        return res.status(400).json({ message: "Slug must be between 2 and 63 characters" });
      }
      const tenant = await createTenant(parsed);

      const { db } = await import("./db");
      const { tenantMembers } = await import("@shared/schema");
      await db.insert(tenantMembers).values({
        tenantId: tenant.id,
        userId: req.user!.id,
        role: "tenant_admin",
        status: "active",
        createdAt: new Date().toISOString().split("T")[0],
      });

      try {
        const tenantDb = getTenantDb(parsed.slug);
        const tenantStorage = createTenantStorage(tenantDb);
        await seedPlatformResourcesToTenant(tenantStorage);
      } catch {}

      logFromRequest(req, "create", "tenant", tenant.id, { slug: parsed.slug, name: parsed.name });
      res.status(201).json(tenant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/tenants/:id", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const { tenants } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const allowedFields: Record<string, any> = {};
      if (req.body.plan) allowedFields.plan = req.body.plan;
      if (req.body.status) allowedFields.status = req.body.status;
      if (req.body.trialEndsAt !== undefined) allowedFields.trialEndsAt = req.body.trialEndsAt;
      if (req.body.maxUsers !== undefined) allowedFields.maxUsers = req.body.maxUsers;
      if (req.body.name) allowedFields.name = req.body.name;
      if (Object.keys(allowedFields).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      const [updated] = await db.update(tenants).set(allowedFields).where(eq(tenants.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Tenant not found" });
      logFromRequest(req, "update", "tenant", updated.id, allowedFields);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/tenants/:id", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const { tenants, tenantMembers } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const [tenant] = await db.select().from(tenants).where(eq(tenants.id, req.params.id));
      if (!tenant) return res.status(404).json({ message: "Tenant not found" });
      await db.delete(tenantMembers).where(eq(tenantMembers.tenantId, tenant.id));
      await deleteTenantSchema(tenant.slug);
      logFromRequest(req, "delete", "tenant", tenant.id, { slug: tenant.slug, name: tenant.name });
      res.json({ message: "Tenant deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const { users, tenantMembers, tenants } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isPlatformAdmin: users.isPlatformAdmin,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      }).from(users);
      const allMembers = await db.select().from(tenantMembers);
      const allTenants = await db.select({ id: tenants.id, slug: tenants.slug, name: tenants.name }).from(tenants);
      const enriched = allUsers.map((u) => {
        const memberships = allMembers
          .filter((m) => m.userId === u.id)
          .map((m) => {
            const t = allTenants.find((t) => t.id === m.tenantId);
            return { tenantId: m.tenantId, tenantName: t?.name, tenantSlug: t?.slug, role: m.role };
          });
        return { ...u, memberships };
      });
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const { users, tenantMembers, trialSignups } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      if (req.params.id === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const [user] = await db.select().from(users).where(eq(users.id, req.params.id));
      if (!user) return res.status(404).json({ message: "User not found" });
      await db.delete(tenantMembers).where(eq(tenantMembers.userId, user.id));
      await db.delete(trialSignups).where(eq(trialSignups.userId, user.id));
      await db.delete(users).where(eq(users.id, user.id));
      logFromRequest(req, "delete", "user", user.id, { email: user.email });
      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const { users, tenants, trialSignups } = await import("@shared/schema");
      const allUsers = await db.select().from(users);
      const allTenants = await db.select().from(tenants);
      const allTrials = await db.select().from(trialSignups);
      const now = new Date().toISOString().split("T")[0];
      res.json({
        totalUsers: allUsers.length,
        verifiedUsers: allUsers.filter((u) => u.emailVerified).length,
        totalTenants: allTenants.length,
        activeTenants: allTenants.filter((t) => t.status === "active").length,
        sandboxTenants: allTenants.filter((t) => t.isSandbox).length,
        trialTenants: allTenants.filter((t) => t.trialEndsAt).length,
        expiredTrials: allTenants.filter((t) => t.trialEndsAt && t.trialEndsAt < now).length,
        totalSignups: allTrials.length,
        plans: {
          trial: allTenants.filter((t) => t.plan === "trial").length,
          standard: allTenants.filter((t) => t.plan === "standard").length,
          pro: allTenants.filter((t) => t.plan === "pro").length,
          enterprise: allTenants.filter((t) => t.plan === "enterprise").length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/platform-resources", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const resources = await db.select().from(platformResources);
      const sanitized = resources.map(({ content, ...rest }) => ({
        ...rest,
        hasContent: !!content,
      }));
      res.json(sanitized);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/platform-resources", requireAuth, upload.single("file"), async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      let fileContent: string | undefined;
      let mimeType: string | undefined;
      let fileSize: string | undefined;
      let fileSizeBytes: number | undefined;

      if (req.file) {
        const MAX_DB_FILE_SIZE = 10 * 1024 * 1024;
        if (req.file.size <= MAX_DB_FILE_SIZE) {
          const fileBuffer = fs.readFileSync(req.file.path);
          fileContent = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`;
        }
        mimeType = req.file.mimetype;
        fileSizeBytes = req.file.size;
        fileSize = formatBytes(req.file.size);
        try { fs.unlinkSync(req.file.path); } catch {}
      }

      const [resource] = await db.insert(platformResources).values({
        name: req.body.name || "Untitled Resource",
        description: req.body.description || "",
        category: req.body.category || "other",
        documentType: req.body.documentType || "legal",
        content: fileContent || req.body.content || null,
        mimeType: mimeType || req.body.mimeType || null,
        fileSize,
        fileSizeBytes: fileSizeBytes || null,
        autoSeed: req.body.adminOnly === "true" || req.body.adminOnly === true ? false : req.body.autoSeed !== "false",
        adminOnly: req.body.adminOnly === "true" || req.body.adminOnly === true,
        createdBy: req.user!.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();

      res.status(201).json(resource);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/platform-resources/:id", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const allowed = ["name", "description", "category", "documentType", "autoSeed", "adminOnly"];
      const updates: any = { updatedAt: new Date().toISOString() };
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          if (key === "autoSeed" || key === "adminOnly") {
            updates[key] = req.body[key] === true || req.body[key] === "true";
          } else {
            updates[key] = req.body[key];
          }
        }
      }
      if (updates.adminOnly === true) {
        updates.autoSeed = false;
      }
      const [updated] = await db.update(platformResources).set(updates).where(eq(platformResources.id, req.params.id)).returning();
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/platform-resources/:id", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      await db.delete(platformResources).where(eq(platformResources.id, req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/platform-resources/:id/download", requireAuth, async (req, res) => {
    if (!req.user!.isPlatformAdmin) {
      return res.status(403).json({ message: "Platform admin access required" });
    }
    try {
      const { db } = await import("./db");
      const { eq } = await import("drizzle-orm");
      const [resource] = await db.select().from(platformResources).where(eq(platformResources.id, req.params.id));
      if (!resource || !resource.content) {
        return res.status(404).json({ message: "Resource not found or has no file content" });
      }
      const matches = resource.content.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const buffer = Buffer.from(matches[2], "base64");
        res.setHeader("Content-Type", matches[1]);
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(resource.name)}"`);
        return res.send(buffer);
      }
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(resource.name)}.txt"`);
      return res.send(resource.content);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/tenant-resources", requireAuth, tenantMiddleware, async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const docs = await req.tenantStorage!.getDocuments(company.id);
      const resourceDocs = docs.filter((d) => d.description && d.description.includes("[Platform Resource]"));
      res.json(resourceDocs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/my-position", requireAuth, tenantMiddleware, async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const stakeholder = await req.tenantStorage!.getStakeholderByUserId(company.id, req.user!.id);
      if (!stakeholder) {
        return res.status(404).json({ message: "No stakeholder record found for your account" });
      }
      const allSecurities = await req.tenantStorage!.getSecurities(company.id);
      const mySecurities = allSecurities.filter(s => s.stakeholderId === stakeholder.id);
      const allShareClasses = await req.tenantStorage!.getShareClasses(company.id);
      const relevantClassIds = new Set(mySecurities.map(s => s.shareClassId));
      const myShareClasses = allShareClasses.filter(sc => relevantClassIds.has(sc.id));
      const allSafes = await req.tenantStorage!.getSafeAgreements(company.id);
      const mySafes = allSafes.filter(s => s.stakeholderId === stakeholder.id);
      const totalShares = mySecurities
        .filter(s => s.status === "active")
        .reduce((sum, s) => sum + s.shares, 0);
      const totalAuthorized = company.totalAuthorizedShares || 0;
      const ownershipPercentage = totalAuthorized > 0 ? ((totalShares / totalAuthorized) * 100).toFixed(2) : "0.00";

      res.json({
        company: { name: company.name, legalName: company.legalName },
        stakeholder,
        securities: mySecurities,
        shareClasses: myShareClasses,
        safeAgreements: mySafes,
        summary: {
          totalShares,
          ownershipPercentage,
          totalValue: mySecurities
            .filter(s => s.status === "active")
            .reduce((sum, s) => sum + (s.shares * parseFloat(s.pricePerShare || "0")), 0)
            .toFixed(2),
          activeSecurities: mySecurities.filter(s => s.status === "active").length,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/company", requireAuth, tenantMiddleware, async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stakeholders", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const data = await req.tenantStorage!.getStakeholders(company.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/stakeholders", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertStakeholderSchema.parse({ ...req.body, companyId: company.id });
      const stakeholder = await req.tenantStorage!.createStakeholder(parsed);
      logFromRequest(req, "create", "stakeholder", stakeholder.id, { name: parsed.name, type: parsed.type });
      res.status(201).json(stakeholder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/stakeholders/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const allowed = ["name", "email", "type", "title", "address", "avatarInitials"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const stakeholder = await req.tenantStorage!.updateStakeholder(req.params.id, updates);
      logFromRequest(req, "update", "stakeholder", req.params.id, updates);
      res.json(stakeholder);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/stakeholders/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      logFromRequest(req, "delete", "stakeholder", req.params.id);
      await req.tenantStorage!.deleteStakeholder(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/share-classes", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const data = await req.tenantStorage!.getShareClasses(company.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/share-classes", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertShareClassSchema.parse({ ...req.body, companyId: company.id });
      const shareClass = await req.tenantStorage!.createShareClass(parsed);
      logFromRequest(req, "create", "share_class", shareClass.id, { name: parsed.name, type: parsed.type });
      res.status(201).json(shareClass);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/share-classes/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const allowed = ["name", "type", "authorizedShares", "pricePerShare", "liquidationPreference", "boardApprovalDate"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const shareClass = await req.tenantStorage!.updateShareClass(req.params.id, updates);
      logFromRequest(req, "update", "share_class", req.params.id, updates);
      res.json(shareClass);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/share-classes/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      logFromRequest(req, "delete", "share_class", req.params.id);
      await req.tenantStorage!.deleteShareClass(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/securities", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const data = await req.tenantStorage!.getSecurities(company.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/securities", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertSecuritySchema.parse({ ...req.body, companyId: company.id });
      const security = await req.tenantStorage!.createSecurity(parsed);
      logFromRequest(req, "create", "security", security.id, { shares: parsed.shares, stakeholderId: parsed.stakeholderId });
      res.status(201).json(security);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/securities/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const allowed = ["stakeholderId", "shareClassId", "shares", "pricePerShare", "issueDate", "status", "vestingSchedule", "notes", "certificateId"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const security = await req.tenantStorage!.updateSecurity(req.params.id, updates);
      logFromRequest(req, "update", "security", req.params.id, updates);
      res.json(security);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/securities/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      logFromRequest(req, "delete", "security", req.params.id);
      await req.tenantStorage!.deleteSecurity(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/investment-rounds", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const data = await req.tenantStorage!.getInvestmentRounds(company.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/investment-rounds", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertInvestmentRoundSchema.parse({ ...req.body, companyId: company.id });
      const round = await req.tenantStorage!.createInvestmentRound(parsed);
      logFromRequest(req, "create", "investment_round", round.id, { roundName: parsed.roundName });
      res.status(201).json(round);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/safes", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const data = await req.tenantStorage!.getSafeAgreements(company.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/safes", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertSafeAgreementSchema.parse({ ...req.body, companyId: company.id });
      const existingSafes = await req.tenantStorage!.getSafeAgreements(company.id);
      const year = new Date().getFullYear();
      const seq = String(existingSafes.length + 1).padStart(3, "0");
      const docRef = `SAFE-${year}-${seq}`;
      const safe = await req.tenantStorage!.createSafeAgreement({ ...parsed, docRef } as any);
      logFromRequest(req, "create", "safe_agreement", safe.id, { investmentAmount: parsed.investmentAmount, docRef });
      res.status(201).json(safe);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/safes/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const allowed = ["status", "investmentAmount", "valuationCap", "discountRate", "safeType", "issueDate", "conversionDate", "notes", "investmentRoundId", "investmentRoundName", "raiseGoal", "endDate", "templateVariables", "templateId", "docRef"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const safe = await req.tenantStorage!.updateSafeAgreement(req.params.id, updates);
      logFromRequest(req, "update", "safe_agreement", req.params.id, updates);
      res.json(safe);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/safes/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const safeId = req.params.id;
      logFromRequest(req, "delete", "safe_agreement", safeId);

      const company = await ensureCompany(req.tenantStorage!);
      const docs = await req.tenantStorage!.getDocuments(company.id);
      const relatedDocs = docs.filter((d) => d.description?.includes(`Ref: ${safeId}`));
      for (const doc of relatedDocs) {
        await req.tenantStorage!.deleteDocument(doc.id);
        logFromRequest(req, "delete", "document", doc.id, { reason: "safe_agreement_deleted", safeId });
      }

      await req.tenantStorage!.deleteSafeAgreement(safeId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/safe-templates", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      let templates = await req.tenantStorage!.getSafeTemplates();
      if (templates.length === 0) {
        console.log(`[safe-templates] No templates found for tenant=${req.query.tenant}, auto-seeding defaults...`);
        await seedTemplatesForTenant(req.tenantStorage!);
        templates = await req.tenantStorage!.getSafeTemplates();
        console.log(`[safe-templates] Auto-seeded ${templates.length} templates for tenant=${req.query.tenant}`);
      }
      const { type } = req.query;
      if (type && typeof type === "string") {
        templates = templates.filter((t: any) => t.templateType === type);
      }
      console.log(`[safe-templates] tenant=${req.query.tenant}, type=${type || 'all'}, count=${templates.length}`);
      res.json(templates);
    } catch (error: any) {
      console.error(`[safe-templates] Error:`, error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/safe-templates/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const template = await req.tenantStorage!.getSafeTemplate(req.params.id);
      if (!template) return res.status(404).json({ message: "Template not found" });
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/safe-templates", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const { templateName, templateType, rawContent, templateVersion, description, isDefault } = req.body;
      if (!templateName || !rawContent) {
        return res.status(400).json({ message: "templateName and rawContent are required" });
      }
      const template = await req.tenantStorage!.createSafeTemplate({
        templateName,
        templateType: templateType || "safe",
        rawContent,
        templateVersion: templateVersion || "1.0",
        description: description || null,
        isActive: true,
        isDefault: isDefault || false,
      });
      logFromRequest(req, "create", "safe_template", template.id, { templateName, templateType: templateType || "safe" });
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/safe-templates/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const allowed = ["templateName", "templateType", "templateVersion", "description", "rawContent", "isActive", "isDefault"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const template = await req.tenantStorage!.updateSafeTemplate(req.params.id, updates);
      logFromRequest(req, "update", "safe_template", req.params.id, updates);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/safe-templates/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      await req.tenantStorage!.deleteSafeTemplate(req.params.id);
      logFromRequest(req, "delete", "safe_template", req.params.id, {});
      res.json({ message: "Template deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/documents", requireAuth, tenantMiddleware, async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const data = await req.tenantStorage!.getDocuments(company.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/documents", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertDocumentSchema.parse({ ...req.body, companyId: company.id });
      const doc = await req.tenantStorage!.createDocument(parsed);
      logFromRequest(req, "create", "document", doc.id, { name: parsed.name, type: parsed.type });
      res.status(201).json(doc);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/documents/upload", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const company = await ensureCompany(req.tenantStorage!);
      const docs = await req.tenantStorage!.getDocuments(company.id);
      const totalUsed = docs.reduce((sum, d) => {
        if (d.fileSizeBytes) return sum + d.fileSizeBytes;
        if (d.content) return sum + Buffer.byteLength(d.content, "utf8");
        if (d.fileSize) return sum + parseFileSize(d.fileSize);
        return sum;
      }, 0);

      const tenantSlug = req.tenantSlug!;
      const tenant = await getTenant(tenantSlug);
      const isTrial = tenant?.plan === "trial";

      if (isTrial && (totalUsed + req.file.size) > TRIAL_STORAGE_LIMIT) {
        fs.unlinkSync(req.file.path);
        return res.status(413).json({
          message: `Storage limit exceeded. Trial accounts have a 250 MB limit. Currently using ${(totalUsed / (1024 * 1024)).toFixed(1)} MB.`,
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const docName = req.body.name || req.file.originalname;
      const docType = req.body.type || "other";

      let fileContent: string | undefined;
      const MAX_DB_FILE_SIZE = 10 * 1024 * 1024;
      if (req.file.size <= MAX_DB_FILE_SIZE) {
        try {
          const fileBuffer = fs.readFileSync(req.file.path);
          fileContent = `data:${req.file.mimetype};base64,${fileBuffer.toString("base64")}`;
        } catch {}
      }

      const doc = await req.tenantStorage!.createDocument({
        companyId: company.id,
        name: docName,
        type: docType,
        description: req.body.description || "",
        uploadDate: new Date().toISOString().split("T")[0],
        fileSize: formatBytes(req.file.size),
        uploadedBy: req.body.uploadedBy || `${req.user!.firstName} ${req.user!.lastName}`,
        fileUrl,
        fileSizeBytes: req.file.size,
        mimeType: req.file.mimetype,
        encrypted: false,
        ...(fileContent ? { content: fileContent } : {}),
      });

      logFromRequest(req, "create", "document", doc.id, { name: docName, type: docType, fileSize: req.file.size });
      res.status(201).json(doc);
    } catch (error: any) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/documents/:id/download", requireAuth, tenantMiddleware, async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const docs = await req.tenantStorage!.getDocuments(company.id);
      const doc = docs.find((d) => d.id === req.params.id);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (doc.fileUrl) {
        const filePath = path.join(uploadsDir, path.basename(doc.fileUrl));
        if (fs.existsSync(filePath)) {
          const mimeType = doc.mimeType || "application/octet-stream";
          res.setHeader("Content-Type", mimeType);
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.name)}"`);
          return fs.createReadStream(filePath).pipe(res);
        }
      }

      if (doc.content) {
        const isBase64 = doc.content.startsWith("data:");
        if (isBase64) {
          const matches = doc.content.match(/^data:(.+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], "base64");
            res.setHeader("Content-Type", mimeType);
            res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.name)}"`);
            return res.send(buffer);
          }
        }
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.name)}.txt"`);
        return res.send(doc.content);
      }

      return res.status(404).json({ message: "File content no longer available. The file may have been lost during a server restart." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/documents/storage-usage", requireAuth, tenantMiddleware, async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const docs = await req.tenantStorage!.getDocuments(company.id);
      const totalUsed = docs.reduce((sum, d) => {
        if (d.fileSizeBytes) return sum + d.fileSizeBytes;
        if (d.content) return sum + Buffer.byteLength(d.content, "utf8");
        if (d.fileSize) return sum + parseFileSize(d.fileSize);
        return sum;
      }, 0);

      const tenantSlug = req.tenantSlug!;
      const tenant = await getTenant(tenantSlug);
      const isTrial = tenant?.plan === "trial";

      res.json({
        usedBytes: totalUsed,
        usedFormatted: formatBytes(totalUsed),
        limitBytes: isTrial ? TRIAL_STORAGE_LIMIT : null,
        limitFormatted: isTrial ? "250 MB" : null,
        plan: tenant?.plan || "standard",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/documents/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const allowed = ["name", "type", "description", "uploadedBy", "encrypted", "content"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const doc = await req.tenantStorage!.updateDocument(req.params.id, updates);
      logFromRequest(req, "update", "document", req.params.id, updates);
      res.json(doc);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/documents/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      logFromRequest(req, "delete", "document", req.params.id);
      await req.tenantStorage!.deleteDocument(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/categories", requireAuth, tenantMiddleware, async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const categories = await req.tenantStorage!.getDataStoreCategories(company.id);
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const { name } = req.body;
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ message: "Category name is required" });
      }
      const existing = await req.tenantStorage!.getDataStoreCategories(company.id);
      if (existing.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
        return res.status(409).json({ message: "Category already exists" });
      }
      const category = await req.tenantStorage!.createDataStoreCategory({ orgId: company.id, name: name.trim() });
      logFromRequest(req, "create", "category", category.id, { name: category.name });
      res.status(201).json(category);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/categories/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      logFromRequest(req, "delete", "category", req.params.id);
      await req.tenantStorage!.deleteDataStoreCategory(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/privacy/hashes", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const crypto = await import("crypto");
      const company = await ensureCompany(req.tenantStorage!);
      const allStakeholders = await req.tenantStorage!.getStakeholders(company.id);
      const salt = company.id;
      const hashes: Record<string, string> = {};
      for (const s of allStakeholders) {
        const full = crypto.createHmac("sha256", salt).update(s.id).digest("hex");
        hashes[s.id] = "0x" + full.slice(0, 8) + "..." + full.slice(-4);
      }
      res.json(hashes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/privacy/labels", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const labels = await req.tenantStorage!.getPrivacyLabels(company.id);
      const map: Record<string, string> = {};
      for (const l of labels) {
        if (l.encryptedLabel) map[l.stakeholderId] = l.encryptedLabel;
      }
      res.json(map);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/privacy/labels/:stakeholderId", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const crypto = await import("crypto");
      const company = await ensureCompany(req.tenantStorage!);
      const { label } = req.body;
      if (typeof label !== "string" || !label.trim()) return res.status(400).json({ message: "label is required" });
      if (label.length > 64) return res.status(400).json({ message: "Label must be 64 characters or fewer" });
      const stakeholders = await req.tenantStorage!.getStakeholders(company.id);
      const exists = stakeholders.some(s => s.id === req.params.stakeholderId);
      if (!exists) return res.status(404).json({ message: "Stakeholder not found" });
      const salt = company.id;
      const hashedId = crypto.createHmac("sha256", salt).update(req.params.stakeholderId).digest("hex");
      const result = await req.tenantStorage!.upsertPrivacyLabel({
        companyId: company.id,
        stakeholderId: req.params.stakeholderId,
        hashedId,
        encryptedLabel: label,
      });
      logFromRequest(req, "update", "privacy_label", req.params.stakeholderId, { label });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/updates", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const data = await req.tenantStorage!.getInvestorUpdates(company.id);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/updates", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertInvestorUpdateSchema.parse({ ...req.body, companyId: company.id });
      const update = await req.tenantStorage!.createInvestorUpdate(parsed);
      logFromRequest(req, "create", "investor_update", update.id, { title: parsed.title });
      res.status(201).json(update);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/updates/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const allowed = ["title", "content", "status", "sentDate", "recipientCount"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const update = await req.tenantStorage!.updateInvestorUpdate(req.params.id, updates);
      logFromRequest(req, "update", "investor_update", req.params.id, updates);
      res.json(update);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/esop-pools", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const pools = await req.tenantStorage!.getEsopPools(company.id);
      res.json(pools);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/esop-pools", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertEsopPoolSchema.parse(req.body);
      const pool = await req.tenantStorage!.createEsopPool({ ...parsed, companyId: company.id });
      logFromRequest(req, "create", "esop_pool", pool.id, { name: parsed.name });
      res.status(201).json(pool);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/esop-pools/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const allowed = ["name", "approvedDate", "underlyingShareClass", "allocatedShares", "grantedShares", "vestedShares", "exercisedShares"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const pool = await req.tenantStorage!.updateEsopPool(req.params.id, updates);
      logFromRequest(req, "update", "esop_pool", req.params.id, updates);
      res.json(pool);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/esop-pools/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      logFromRequest(req, "delete", "esop_pool", req.params.id);
      await req.tenantStorage!.deleteEsopPool(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/esop-plans", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const plans = await req.tenantStorage!.getEsopPlans(company.id);
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/esop-plans", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertEsopPlanSchema.parse(req.body);
      const plan = await req.tenantStorage!.createEsopPlan({ ...parsed, companyId: company.id });
      logFromRequest(req, "create", "esop_plan", plan.id, { name: parsed.name });
      res.status(201).json(plan);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/esop-plans/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const allowed = ["name", "poolId", "approvedDate", "grantType", "grantPresets", "documents", "internalNote"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      const plan = await req.tenantStorage!.updateEsopPlan(req.params.id, updates);
      logFromRequest(req, "update", "esop_plan", req.params.id, updates);
      res.json(plan);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/esop-plans/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      logFromRequest(req, "delete", "esop_plan", req.params.id);
      await req.tenantStorage!.deleteEsopPlan(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/esop-grants", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const grants = await req.tenantStorage!.getEsopGrants(company.id);
      const enriched = grants.map((grant) => ({
        ...grant,
        vestedShares: computeVestedShares({
          shares: grant.shares,
          vestingStartDate: grant.vestingStartDate,
          vestingDurationMonths: grant.vestingDurationMonths,
          cliffMonths: grant.cliffMonths,
          vestFrequencyMonths: grant.vestFrequencyMonths,
        }),
      }));
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/esop-grants", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const company = await ensureCompany(req.tenantStorage!);
      const parsed = insertEsopGrantSchema.parse(req.body);
      const grant = await req.tenantStorage!.createEsopGrant({ ...parsed, companyId: company.id });
      const pool = await req.tenantStorage!.getEsopPool(parsed.poolId);
      if (pool) {
        await req.tenantStorage!.updateEsopPool(pool.id, {
          grantedShares: (pool.grantedShares || 0) + parsed.shares,
        } as any);
      }
      logFromRequest(req, "create", "esop_grant", grant.id, { name: parsed.grantName, shares: parsed.shares });
      res.status(201).json(grant);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/esop-grants/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getEsopGrant(req.params.id);
      if (!existing) return res.status(404).json({ message: "Grant not found" });
      const allowed = ["grantName", "grantDate", "shares", "exercisePrice", "underlyingShareClass", "vestingStartDate", "vestingDurationMonths", "cliffMonths", "vestFrequencyMonths", "vestedShares", "notes", "status"];
      const updates: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      if (updates.shares !== undefined && updates.shares !== existing.shares) {
        const delta = updates.shares - existing.shares;
        const pool = await req.tenantStorage!.getEsopPool(existing.poolId);
        if (pool) {
          await req.tenantStorage!.updateEsopPool(pool.id, {
            grantedShares: Math.max(0, (pool.grantedShares || 0) + delta),
          } as any);
        }
      }
      const grant = await req.tenantStorage!.updateEsopGrant(req.params.id, updates);
      logFromRequest(req, "update", "esop_grant", req.params.id, updates);
      res.json(grant);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/esop-grants/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getEsopGrant(req.params.id);
      if (existing) {
        const pool = await req.tenantStorage!.getEsopPool(existing.poolId);
        if (pool) {
          await req.tenantStorage!.updateEsopPool(pool.id, {
            grantedShares: Math.max(0, (pool.grantedShares || 0) - existing.shares),
          } as any);
        }
      }
      logFromRequest(req, "delete", "esop_grant", req.params.id);
      await req.tenantStorage!.deleteEsopGrant(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/esop-grants/:id/exercise", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const { sharesToExercise } = req.body;
      if (!sharesToExercise || sharesToExercise <= 0) {
        return res.status(400).json({ message: "sharesToExercise must be positive" });
      }
      const grant = await req.tenantStorage!.getEsopGrant(req.params.id);
      if (!grant) return res.status(404).json({ message: "Grant not found" });
      if (grant.status === "fully_exercised" || grant.status === "cancelled" || grant.status === "forfeited") {
        return res.status(400).json({ message: "Grant cannot be exercised" });
      }
      const computedVested = computeVestedShares({
        shares: grant.shares,
        vestingStartDate: grant.vestingStartDate,
        vestingDurationMonths: grant.vestingDurationMonths,
        cliffMonths: grant.cliffMonths,
        vestFrequencyMonths: grant.vestFrequencyMonths,
      });
      const exercisable = computedVested - (grant.exercisedShares || 0);
      if (sharesToExercise > exercisable) {
        return res.status(400).json({ message: `Only ${exercisable} shares are exercisable (${computedVested} vested - ${grant.exercisedShares || 0} already exercised)` });
      }
      const company = await req.tenantStorage!.getCompany();
      if (!company) return res.status(404).json({ message: "No company found" });
      const shareClasses = await req.tenantStorage!.getShareClasses(grant.companyId);
      const matchingClass = shareClasses.find((sc: any) => sc.name === grant.underlyingShareClass);
      if (!matchingClass) {
        return res.status(400).json({ message: `Share class "${grant.underlyingShareClass}" not found. Cannot issue securities.` });
      }
      await req.tenantStorage!.createSecurity({
        companyId: company.id,
        stakeholderId: grant.stakeholderId,
        shareClassId: matchingClass.id,
        shares: sharesToExercise,
        pricePerShare: grant.exercisePrice,
        issueDate: new Date().toISOString().split("T")[0],
        certificateNumber: `ESOP-EX-${Date.now()}`,
        status: "active",
      });
      const newExercisedShares = (grant.exercisedShares || 0) + sharesToExercise;
      const newStatus = newExercisedShares >= grant.shares ? "fully_exercised" : "partially_exercised";
      const updated = await req.tenantStorage!.updateEsopGrant(req.params.id, {
        exercisedShares: newExercisedShares,
        vestedShares: computedVested,
        status: newStatus,
      });
      const pool = await req.tenantStorage!.getEsopPool(grant.poolId);
      if (pool) {
        await req.tenantStorage!.updateEsopPool(pool.id, {
          exercisedShares: (pool.exercisedShares || 0) + sharesToExercise,
          vestedShares: Math.max(pool.vestedShares || 0, computedVested),
        } as any);
      }
      logFromRequest(req, "exercise", "esop_grant", req.params.id, { sharesToExercise, newStatus, totalExercised: newExercisedShares, computedVested });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/warrants", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await req.tenantStorage!.getCompany();
      if (!company) return res.status(404).json({ message: "No company found" });
      const result = await req.tenantStorage!.getWarrants(company.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/warrants", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const parsed = insertWarrantSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      const company = await req.tenantStorage!.getCompany();
      if (!company) return res.status(404).json({ message: "No company found" });
      const result = await req.tenantStorage!.createWarrant({ ...parsed.data, companyId: company.id });
      logFromRequest(req, "create", "warrant", result.id);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/warrants/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getWarrant(req.params.id);
      if (!existing) return res.status(404).json({ message: "Warrant not found" });

      if (existing.status === "exercised") {
        const exercisedAllowed = ["notes"];
        const updates: Record<string, any> = {};
        for (const key of exercisedAllowed) {
          if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        if (Object.keys(updates).length === 0) return res.status(400).json({ message: "Exercised warrants can only have notes edited" });
        logFromRequest(req, "update", "warrant", req.params.id);
        const result = await req.tenantStorage!.updateWarrant(req.params.id, updates);
        return res.json(result);
      }

      if (req.body.status === "exercised" && existing.status === "active") {
        const sharesToExercise = req.body.exercisedShares || existing.shares;
        if (sharesToExercise > existing.shares) {
          return res.status(400).json({ message: "Cannot exercise more shares than the warrant allows" });
        }
        const company = await req.tenantStorage!.getCompany();
        if (!company) return res.status(404).json({ message: "No company found" });
        const shareClasses = await req.tenantStorage!.getShareClasses(company.id);
        const matchingClass = shareClasses.find(sc => sc.name === existing.underlyingShareClass);
        if (!matchingClass) {
          return res.status(400).json({ message: `Share class "${existing.underlyingShareClass}" not found. Create it before exercising.` });
        }
        await req.tenantStorage!.createSecurity({
          companyId: company.id,
          stakeholderId: existing.stakeholderId,
          shareClassId: matchingClass.id,
          shares: sharesToExercise,
          pricePerShare: existing.exercisePrice,
          issueDate: req.body.exercisedDate || new Date().toISOString().split("T")[0],
          certificateId: `WE-${existing.id.slice(0, 8).toUpperCase()}`,
          status: "active",
        });
        logFromRequest(req, "exercise", "warrant", req.params.id);
        const result = await req.tenantStorage!.updateWarrant(req.params.id, req.body);
        return res.json(result);
      }

      const allowedFields = ["name", "underlyingShareClass", "shares", "exercisePrice", "issueDate", "expirationDate", "vestingSchedule", "notes"];
      const updates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      logFromRequest(req, "update", "warrant", req.params.id);
      const result = await req.tenantStorage!.updateWarrant(req.params.id, updates);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/warrants/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getWarrant(req.params.id);
      if (!existing) return res.status(404).json({ message: "Warrant not found" });
      if (existing.status === "exercised") return res.status(400).json({ message: "Cannot delete an exercised warrant" });
      logFromRequest(req, "delete", "warrant", req.params.id);
      await req.tenantStorage!.deleteWarrant(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/phantom-grants", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await req.tenantStorage!.getCompany();
      if (!company) return res.status(404).json({ message: "No company found" });
      const result = await req.tenantStorage!.getPhantomGrants(company.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/phantom-grants", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const parsed = insertPhantomGrantSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors.map(e => e.message).join(", ") });
      const company = await req.tenantStorage!.getCompany();
      if (!company) return res.status(404).json({ message: "No company found" });
      const result = await req.tenantStorage!.createPhantomGrant({ ...parsed.data, companyId: company.id });
      logFromRequest(req, "create", "phantom_grant", result.id);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/phantom-grants/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getPhantomGrant(req.params.id);
      if (!existing) return res.status(404).json({ message: "Phantom grant not found" });
      if (existing.status === "paid_out") {
        const paidOutAllowed = ["notes"];
        const updates: Record<string, any> = {};
        for (const key of paidOutAllowed) {
          if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        if (Object.keys(updates).length === 0) return res.status(400).json({ message: "Paid out grants can only have notes edited" });
        logFromRequest(req, "update", "phantom_grant", req.params.id);
        const result = await req.tenantStorage!.updatePhantomGrant(req.params.id, updates);
        return res.json(result);
      }
      const allowedFields = ["grantName", "grantDate", "sharesEquivalent", "grantPricePerUnit", "planType", "vestingSchedule", "cliffMonths", "vestingMonths", "payoutTrigger", "currentSharePrice", "notes"];
      const updates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      logFromRequest(req, "update", "phantom_grant", req.params.id);
      const result = await req.tenantStorage!.updatePhantomGrant(req.params.id, updates);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/phantom-grants/:id/payout", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getPhantomGrant(req.params.id);
      if (!existing) return res.status(404).json({ message: "Phantom grant not found" });
      if (existing.status === "paid_out") return res.status(400).json({ message: "Payout already recorded" });
      if (existing.status === "forfeited" || existing.status === "cancelled") {
        return res.status(400).json({ message: `Cannot pay out a ${existing.status} grant` });
      }

      const currentPrice = parseFloat(req.body.currentSharePrice || "0");
      const grantPrice = parseFloat(existing.grantPricePerUnit || "0");
      const units = existing.sharesEquivalent;

      let payoutAmount: number;
      if (existing.planType === "appreciation_only") {
        payoutAmount = Math.max((currentPrice - grantPrice) * units, 0);
      } else {
        payoutAmount = currentPrice * units;
      }

      if (req.body.payoutAmount) {
        payoutAmount = parseFloat(req.body.payoutAmount);
      }

      const result = await req.tenantStorage!.updatePhantomGrant(req.params.id, {
        status: "paid_out",
        payoutDate: req.body.payoutDate || new Date().toISOString().split("T")[0],
        payoutAmount: payoutAmount.toFixed(2),
        currentSharePrice: currentPrice.toFixed(4),
      });

      logFromRequest(req, "payout", "phantom_grant", req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/phantom-grants/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getPhantomGrant(req.params.id);
      if (!existing) return res.status(404).json({ message: "Phantom grant not found" });
      if (existing.status === "paid_out") return res.status(400).json({ message: "Cannot delete a paid out phantom grant" });
      logFromRequest(req, "delete", "phantom_grant", req.params.id);
      await req.tenantStorage!.deletePhantomGrant(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/sars", requireAuth, tenantMiddleware, requireRole(["tenant_admin", "tenant_staff"]), async (req, res) => {
    try {
      const company = await req.tenantStorage!.getCompany();
      if (!company) return res.status(404).json({ message: "No company found" });
      const result = await req.tenantStorage!.getSars(company.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sars", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const parsed = insertSarSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten() });
      const company = await req.tenantStorage!.getCompany();
      if (!company) return res.status(404).json({ message: "No company found" });
      logFromRequest(req, "create", "sar", "new");
      const result = await req.tenantStorage!.createSar({ ...parsed.data, companyId: company.id });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/sars/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getSar(req.params.id);
      if (!existing) return res.status(404).json({ message: "SAR not found" });
      if (existing.status === "exercised") {
        const exercisedAllowed = ["notes"];
        const updates: Record<string, any> = {};
        for (const key of exercisedAllowed) {
          if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        if (Object.keys(updates).length === 0) return res.status(400).json({ message: "Exercised SARs can only have notes edited" });
        logFromRequest(req, "update", "sar", req.params.id);
        const result = await req.tenantStorage!.updateSar(req.params.id, updates);
        return res.json(result);
      }
      const allowedFields = ["grantName", "grantDate", "units", "basePrice", "settlementType", "underlyingShareClass", "vestingSchedule", "cliffMonths", "vestingMonths", "expirationDate", "exerciseTrigger", "notes"];
      const updates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }
      logFromRequest(req, "update", "sar", req.params.id);
      const result = await req.tenantStorage!.updateSar(req.params.id, updates);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/sars/:id/exercise", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getSar(req.params.id);
      if (!existing) return res.status(404).json({ message: "SAR not found" });
      if (existing.status === "exercised") return res.status(400).json({ message: "Already exercised" });
      if (existing.status === "forfeited" || existing.status === "cancelled" || existing.status === "expired") {
        return res.status(400).json({ message: `Cannot exercise a ${existing.status} SAR` });
      }

      const currentPrice = parseFloat(req.body.currentSharePrice || "0");
      const basePrice = parseFloat(existing.basePrice || "0");
      const units = req.body.exercisedUnits || existing.units;
      const appreciation = Math.max(currentPrice - basePrice, 0);
      let payoutAmount = appreciation * units;

      if (existing.settlementType === "stock" || (existing.settlementType === "choice" && req.body.settleInStock)) {
        const company = await req.tenantStorage!.getCompany();
        if (!company) return res.status(404).json({ message: "No company found" });
        const shareClasses = await req.tenantStorage!.getShareClasses(company.id);
        const shareClassName = existing.underlyingShareClass || "Common";
        const matchingClass = shareClasses.find(sc => sc.name === shareClassName);
        if (!matchingClass) {
          return res.status(400).json({ message: `Share class "${shareClassName}" not found. Create it before exercising.` });
        }
        const sharesToIssue = currentPrice > 0 ? Math.floor(payoutAmount / currentPrice) : 0;
        if (sharesToIssue > 0) {
          await req.tenantStorage!.createSecurity({
            companyId: company.id,
            stakeholderId: existing.stakeholderId,
            shareClassId: matchingClass.id,
            shares: sharesToIssue,
            pricePerShare: currentPrice.toFixed(4),
            issueDate: req.body.exerciseDate || new Date().toISOString().split("T")[0],
            certificateId: `SAR-${existing.id.slice(0, 8).toUpperCase()}`,
            status: "active",
          });
        }
      }

      const result = await req.tenantStorage!.updateSar(req.params.id, {
        status: "exercised",
        exerciseDate: req.body.exerciseDate || new Date().toISOString().split("T")[0],
        exercisePrice: currentPrice.toFixed(4),
        exercisedUnits: units,
        payoutAmount: payoutAmount.toFixed(2),
      });

      logFromRequest(req, "exercise", "sar", req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/sars/:id", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const existing = await req.tenantStorage!.getSar(req.params.id);
      if (!existing) return res.status(404).json({ message: "SAR not found" });
      if (existing.status === "exercised") return res.status(400).json({ message: "Cannot delete an exercised SAR" });
      logFromRequest(req, "delete", "sar", req.params.id);
      await req.tenantStorage!.deleteSar(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/audit-logs", requireAuth, tenantMiddleware, requireRole(["tenant_admin"]), async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await getAuditLogs(req.tenantSlug!, req.user!.id, limit, offset);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
