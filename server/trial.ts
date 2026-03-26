import { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { users, tenants, tenantMembers, trialSignups } from "@shared/schema";
import { insertTrialSignupSchema } from "@shared/schema";
import { provisionTenantSchema, getTenantDb } from "./tenant";
import { createTenantStorage } from "./storage";
import { sendVerificationEmail } from "./email-verification";
import { provisionSandboxForUser, seedTemplatesForTenant, seedPlatformResourcesToTenant } from "./seed";
import { z } from "zod";

const createAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreedToTerms: z.boolean().refine(v => v === true, "You must agree to the terms"),
});

const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  phone: z.string().optional(),
  language: z.string().default("en"),
  orgSize: z.string().optional(),
  timeZone: z.string().optional(),
});

export function setupTrialRoutes(app: Express) {
  app.post("/api/trial-signup", async (req: Request, res: Response) => {
    try {
      const parsed = insertTrialSignupSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { fullName, email, phone, companyName } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();

      const [existing] = await db
        .select()
        .from(trialSignups)
        .where(eq(trialSignups.email, normalizedEmail));

      if (existing) {
        return res.json({
          id: existing.id,
          email: existing.email,
          fullName: existing.fullName,
          alreadyExists: true,
          hasAccount: !!existing.passwordHash,
        });
      }

      const [signup] = await db
        .insert(trialSignups)
        .values({
          fullName: fullName.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          companyName: companyName?.trim() || null,
          createdAt: new Date().toISOString(),
        })
        .returning();

      return res.status(201).json({
        id: signup.id,
        email: signup.email,
        fullName: signup.fullName,
      });
    } catch (error: any) {
      console.error("[TRIAL SIGNUP ERROR]", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/trial-create-account", async (req: Request, res: Response) => {
    try {
      const parsed = createAccountSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password, agreedToTerms } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();

      const [signup] = await db
        .select()
        .from(trialSignups)
        .where(eq(trialSignups.email, normalizedEmail));

      if (!signup) {
        return res.status(404).json({ message: "Please start from the sign-up page." });
      }

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail));

      if (existingUser) {
        return res.status(400).json({ message: "An account with this email already exists. Please sign in." });
      }

      const nameParts = signup.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "";

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
          isPlatformAdmin: false,
          emailVerified: false,
          createdAt: new Date().toISOString().split("T")[0],
        })
        .returning();

      const verificationToken = crypto.randomBytes(32).toString("hex");

      await db
        .update(trialSignups)
        .set({
          passwordHash,
          agreedToTerms,
          userId: user.id,
          verificationToken,
          accountCreatedAt: new Date().toISOString(),
        })
        .where(eq(trialSignups.id, signup.id));

      const verifyUrl = `/launch/verify?token=${verificationToken}`;
      console.log(`========================================`);
      console.log(`[TRIAL] Verification link for ${normalizedEmail}: ${verifyUrl}`);
      console.log(`========================================`);

      try {
        await sendTrialVerificationEmail(normalizedEmail, verifyUrl);
      } catch (emailErr) {
        console.log("[TRIAL] Email send failed (link was logged above)");
      }

      return res.status(201).json({
        success: true,
        email: normalizedEmail,
      });
    } catch (error: any) {
      console.error("[TRIAL CREATE ACCOUNT ERROR]", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.get("/api/trial-verify", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid verification link." });
      }

      const [signup] = await db
        .select()
        .from(trialSignups)
        .where(eq(trialSignups.verificationToken, token));

      if (!signup) {
        return res.status(404).json({ message: "Verification link is invalid or expired." });
      }

      if (signup.emailVerified) {
        return res.json({ success: true, alreadyVerified: true, email: signup.email });
      }

      await db
        .update(trialSignups)
        .set({
          emailVerified: true,
          verifiedAt: new Date().toISOString(),
        })
        .where(eq(trialSignups.id, signup.id));

      if (signup.userId) {
        await db
          .update(users)
          .set({ emailVerified: true })
          .where(eq(users.id, signup.userId));
      }

      let sandboxSlug: string | null = null;
      if (signup.userId) {
        try {
          sandboxSlug = await provisionSandboxForUser(signup.userId, signup.email);
        } catch (err) {
          console.error("[TRIAL] Failed to create sandbox:", err);
        }
      }

      const orgToken = crypto.randomBytes(32).toString("hex");
      await db
        .update(trialSignups)
        .set({ verificationToken: orgToken })
        .where(eq(trialSignups.id, signup.id));

      return res.json({ success: true, email: signup.email, orgToken, sandboxSlug });
    } catch (error: any) {
      console.error("[TRIAL VERIFY ERROR]", error);
      return res.status(500).json({ message: "Something went wrong." });
    }
  });

  app.post("/api/trial-auto-login", async (req: Request, res: Response) => {
    try {
      const { orgToken } = req.body;
      if (!orgToken || typeof orgToken !== "string") {
        return res.status(400).json({ message: "Invalid token." });
      }

      const [signup] = await db
        .select()
        .from(trialSignups)
        .where(eq(trialSignups.verificationToken, orgToken));

      if (!signup || !signup.userId || !signup.emailVerified) {
        return res.status(400).json({ message: "Invalid or unverified token." });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, signup.userId));

      if (!user) {
        return res.status(400).json({ message: "User not found." });
      }

      await new Promise<void>((resolve, reject) => {
        req.login(user, (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });

      await db
        .update(trialSignups)
        .set({ verificationToken: null })
        .where(eq(trialSignups.id, signup.id));

      return res.json({ success: true, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error: any) {
      console.error("[TRIAL AUTO-LOGIN ERROR]", error);
      return res.status(500).json({ message: "Something went wrong." });
    }
  });

  app.post("/api/trial-create-organization", async (req: Request, res: Response) => {
    try {
      const parsed = createOrgSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { orgToken } = req.body;
      if (!orgToken || typeof orgToken !== "string") {
        return res.status(400).json({ message: "Invalid or missing authorization token." });
      }

      const [signup] = await db
        .select()
        .from(trialSignups)
        .where(eq(trialSignups.verificationToken, orgToken));

      if (!signup || !signup.userId) {
        return res.status(400).json({ message: "Invalid token. Please verify your email first." });
      }

      if (!signup.emailVerified) {
        return res.status(400).json({ message: "Please verify your email first." });
      }

      const normalizedEmail = signup.email;

      const slug = parsed.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);

      let uniqueSlug = slug;
      let counter = 1;
      while (true) {
        const [existingTenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, uniqueSlug));
        if (!existingTenant) break;
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 6);

      await provisionTenantSchema(uniqueSlug);

      const tenantDb = getTenantDb(uniqueSlug);
      const tenantStorage = createTenantStorage(tenantDb);
      await seedTemplatesForTenant(tenantStorage);
      await seedPlatformResourcesToTenant(tenantStorage);

      const [tenant] = await db
        .insert(tenants)
        .values({
          slug: uniqueSlug,
          name: parsed.data.name.trim(),
          status: "active",
          plan: "trial",
          ownerEmail: normalizedEmail,
          maxUsers: 5,
          maxCompanies: 1,
          language: parsed.data.language || "en",
          orgSize: parsed.data.orgSize || null,
          timeZone: parsed.data.timeZone || null,
          trialEndsAt: trialEndsAt.toISOString(),
          createdAt: new Date().toISOString().split("T")[0],
        })
        .returning();

      await db
        .insert(tenantMembers)
        .values({
          tenantId: tenant.id,
          userId: signup.userId,
          role: "tenant_admin",
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
        });

      return res.status(201).json({
        success: true,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        trialEndsAt: tenant.trialEndsAt,
      });
    } catch (error: any) {
      console.error("[TRIAL CREATE ORG ERROR]", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });
  app.post("/api/organizations/create", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const parsed = createOrgSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const userId = req.user!.id;

      const userMemberships = await db
        .select()
        .from(tenantMembers)
        .where(and(eq(tenantMembers.userId, userId), eq(tenantMembers.status, "active")));

      const userTenantIds = userMemberships.map(m => m.tenantId);
      const userTenantsList = userTenantIds.length > 0
        ? await db.select().from(tenants)
        : [];
      const nonSandboxOrgs = userTenantsList.filter(
        t => userTenantIds.includes(t.id) && !t.isSandbox
      );

      const orgLimits: Record<string, number> = {
        trial: 1,
        standard: 1,
        pro: 3,
        enterprise: 999,
      };

      const userPlan = nonSandboxOrgs.length > 0
        ? nonSandboxOrgs[0].plan
        : "trial";
      const limit = orgLimits[userPlan] || 1;

      if (nonSandboxOrgs.length >= limit) {
        return res.status(403).json({
          message: "Organization limit reached. Upgrade your plan to create more.",
          limitReached: true,
          currentCount: nonSandboxOrgs.length,
          limit,
        });
      }

      const slug = parsed.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50);

      let uniqueSlug = slug;
      let counter = 1;
      while (true) {
        const [existingTenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.slug, uniqueSlug));
        if (!existingTenant) break;
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 6);

      await provisionTenantSchema(uniqueSlug);

      const tenantDb2 = getTenantDb(uniqueSlug);
      const tenantStorage2 = createTenantStorage(tenantDb2);
      await seedTemplatesForTenant(tenantStorage2);
      await seedPlatformResourcesToTenant(tenantStorage2);

      const [tenant] = await db
        .insert(tenants)
        .values({
          slug: uniqueSlug,
          name: parsed.data.name.trim(),
          status: "active",
          plan: "trial",
          ownerEmail: req.user!.email,
          maxUsers: 5,
          maxCompanies: 1,
          language: parsed.data.language || "en",
          orgSize: parsed.data.orgSize || null,
          timeZone: parsed.data.timeZone || null,
          isSandbox: false,
          trialEndsAt: trialEndsAt.toISOString(),
          createdAt: new Date().toISOString().split("T")[0],
        })
        .returning();

      await db
        .insert(tenantMembers)
        .values({
          tenantId: tenant.id,
          userId,
          role: "tenant_admin",
          status: "active",
          createdAt: new Date().toISOString().split("T")[0],
        });

      const tenantDb = getTenantDb(uniqueSlug);
      const tenantStorage = createTenantStorage(tenantDb);
      await tenantStorage.createCompany({
        name: parsed.data.name.trim(),
        totalAuthorizedShares: 10000000,
      });

      return res.status(201).json({
        success: true,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        trialEndsAt: tenant.trialEndsAt,
      });
    } catch (error: any) {
      console.error("[CREATE ORG ERROR]", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });
}

async function sendTrialVerificationEmail(email: string, verifyUrl: string) {
  const sesRegion = process.env.SES_REGION;
  const fromEmail = process.env.SES_FROM_EMAIL;
  const hasAwsCreds = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  if (!sesRegion || !fromEmail || !hasAwsCreds) {
    return;
  }

  const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");
  const ses = new SESClient({ region: sesRegion });

  const fullUrl = `${process.env.APP_URL || "https://tableicty.com"}${verifyUrl}`;

  await ses.send(new SendEmailCommand({
    Source: fromEmail,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "Verify Your Tableicity Account", Charset: "UTF-8" },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #1e3a5f;">Tableicity</h2>
              <p>Thanks for signing up! To complete the registration process, please click on the link below to verify your account.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${fullUrl}" style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Verify Your Account</a>
              </div>
              <p style="color: #666; font-size: 14px;">Have any questions? Please check out our help center.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px;">&copy; 2026 Tableicity, Inc - All Rights Reserved</p>
            </div>
          `,
        },
        Text: {
          Charset: "UTF-8",
          Data: `Verify your Tableicity account: ${fullUrl}`,
        },
      },
    },
  }));
}
