import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { pool } from "./db";
import { users, tenantMembers, tenants } from "@shared/schema";
import type { User } from "@shared/schema";
import { logAuditEvent } from "./audit";
import { createVerificationCode, verifyCode, sendVerificationEmail, canResendCode } from "./email-verification";
import { provisionSandboxForUser } from "./seed";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      isPlatformAdmin: boolean;
      emailVerified: boolean;
    }
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${"*".repeat(local.length)}@${domain}`;
  }
  const visible = local.slice(-2);
  return `${"*".repeat(local.length - 2)}${visible}@${domain}`;
}

function userToSession(user: any): Express.User {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isPlatformAdmin: user.isPlatformAdmin,
    emailVerified: user.emailVerified ?? false,
  };
}

export function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        pool: pool as any,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "tableicty-dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: false,
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email.toLowerCase()));
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            return done(null, false, { message: "Invalid email or password" });
          }
          return done(null, userToSession(user));
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (googleClientId && googleClientSecret) {
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value?.toLowerCase();
            if (!email) {
              return done(null, false, { message: "No email from Google" } as any);
            }

            const [existing] = await db
              .select()
              .from(users)
              .where(eq(users.email, email));

            if (existing) {
              if (!existing.googleId) {
                await db
                  .update(users)
                  .set({ googleId: profile.id })
                  .where(eq(users.id, existing.id));
              }
              return done(null, userToSession(existing));
            }

            const [newUser] = await db
              .insert(users)
              .values({
                email,
                passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
                firstName: profile.name?.givenName || "User",
                lastName: profile.name?.familyName || "",
                isPlatformAdmin: false,
                emailVerified: true,
                googleId: profile.id,
                createdAt: new Date().toISOString().split("T")[0],
              })
              .returning();

            return done(null, userToSession(newUser));
          } catch (err) {
            return done(err as Error);
          }
        }
      )
    );

    app.get("/api/auth/google", passport.authenticate("google", {
      scope: ["profile", "email"],
    }));

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login?error=google_failed" }),
      async (req: Request, res: Response) => {
        try {
          const googleUser = req.user!;
          const code = await createVerificationCode(googleUser.id);
          await sendVerificationEmail(googleUser.email, code);

          req.logout(() => {});
          (req.session as any).pendingMfaUserId = googleUser.id;
          (req.session as any).pendingMfaEmail = googleUser.email;
          (req.session as any).pendingMfaFromGoogle = true;

          const maskedEmail = maskEmail(googleUser.email);
          res.redirect(`/login?mfa=true&email=${encodeURIComponent(maskedEmail)}&google=true`);
        } catch (err) {
          res.redirect("/login?error=mfa_failed");
        }
      }
    );
  }

  app.get("/api/auth/google/available", (_req: Request, res: Response) => {
    res.json({ available: !!(googleClientId && googleClientSecret) });
  });

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      if (!user) {
        return done(null, false);
      }
      done(null, userToSession(user));
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail));
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [user] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          isPlatformAdmin: false,
          emailVerified: false,
          createdAt: new Date().toISOString().split("T")[0],
        })
        .returning();

      const code = await createVerificationCode(user.id);
      await sendVerificationEmail(normalizedEmail, code);

      logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: "register",
        entityType: "auth",
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });

      req.login(userToSession(user), (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration succeeded but login failed" });
        }
        return res.status(201).json({
          ...userToSession(user),
          requiresVerification: true,
          lab_code: code,
        });
      });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", async (err: any, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }

      try {
        (req.session as any).pendingMfaUserId = user.id;
        (req.session as any).pendingMfaEmail = user.email;

        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        const code = await createVerificationCode(user.id);
        await sendVerificationEmail(user.email, code);

        const maskedEmail = maskEmail(user.email);

        return res.json({
          requiresMfa: true,
          maskedEmail,
          lab_code: code,
        });
      } catch (mfaErr) {
        console.error("[LOGIN MFA ERROR]", mfaErr);
        return res.status(500).json({ message: "Failed to send verification code" });
      }
    })(req, res, next);
  });

  app.post("/api/auth/verify-login-mfa", async (req: Request, res: Response) => {
    const pendingUserId = (req.session as any).pendingMfaUserId;
    const pendingEmail = (req.session as any).pendingMfaEmail;

    if (!pendingUserId || !pendingEmail) {
      return res.status(400).json({ message: "No pending login. Please sign in again." });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Security code is required" });
    }

    const result = await verifyCode(pendingUserId, code);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, pendingUserId));

    if (!dbUser) {
      return res.status(400).json({ message: "User not found" });
    }

    const isFromGoogle = !!(req.session as any).pendingMfaFromGoogle;
    const sessionUser = userToSession({ ...dbUser, emailVerified: true });

    delete (req.session as any).pendingMfaUserId;
    delete (req.session as any).pendingMfaEmail;
    delete (req.session as any).pendingMfaFromGoogle;

    const userTenants = await db
      .select()
      .from(tenantMembers)
      .where(eq(tenantMembers.userId, dbUser.id));

    if (userTenants.length === 0 && !dbUser.isPlatformAdmin) {
      try {
        await provisionSandboxForUser(dbUser.id, dbUser.email);
        console.log(`[AUTH] Auto-provisioned sandbox for new user ${dbUser.email}`);
      } catch (sandboxErr) {
        console.error("[AUTH] Failed to auto-provision sandbox:", sandboxErr);
      }
    }

    if (!dbUser.emailVerified) {
      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, dbUser.id));
    }

    req.login(sessionUser, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({ message: "Login failed after verification" });
      }
      logAuditEvent({
        userId: sessionUser.id,
        userEmail: sessionUser.email,
        action: isFromGoogle ? "login_google" : "login",
        entityType: "auth",
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
      return res.json({
        ...sessionUser,
        requiresVerification: false,
      });
    });
  });

  app.post("/api/auth/resend-login-code", async (req: Request, res: Response) => {
    const pendingUserId = (req.session as any).pendingMfaUserId;
    const pendingEmail = (req.session as any).pendingMfaEmail;

    if (!pendingUserId || !pendingEmail) {
      return res.status(400).json({ message: "No pending login. Please sign in again." });
    }

    const canSend = await canResendCode(pendingUserId);
    if (!canSend) {
      return res.status(429).json({ message: "Please wait at least 60 seconds before requesting a new code" });
    }

    const code = await createVerificationCode(pendingUserId);
    await sendVerificationEmail(pendingEmail, code);

    return res.json({
      message: "A new security code has been sent to your email",
      maskedEmail: maskEmail(pendingEmail),
      lab_code: code,
    });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    if (req.user) {
      logAuditEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        action: "logout",
        entityType: "auth",
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
    }
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          return res.status(500).json({ message: "Session cleanup failed" });
        }
        res.clearCookie("connect.sid");
        return res.json({ message: "Logged out" });
      });
    });
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json({
      ...req.user,
      requiresVerification: !req.user!.emailVerified,
    });
  });

  app.post("/api/auth/change-password", requireAuth, async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, req.user!.id));

    return res.json({ message: "Password updated successfully" });
  });

  app.post("/api/auth/verify-email", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Verification code is required" });
    }

    const result = await verifyCode(req.user!.id, code);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, req.user!.id));

    const userTenants = await db
      .select()
      .from(tenantMembers)
      .where(eq(tenantMembers.userId, req.user!.id));

    if (userTenants.length === 0 && !req.user!.isPlatformAdmin) {
      try {
        await provisionSandboxForUser(req.user!.id, req.user!.email);
        console.log(`[AUTH] Auto-provisioned sandbox for new user ${req.user!.email}`);
      } catch (sandboxErr) {
        console.error("[AUTH] Failed to auto-provision sandbox:", sandboxErr);
      }
    }

    logAuditEvent({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: "email_verified",
      entityType: "auth",
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    });

    const updatedUser = userToSession({ ...req.user, emailVerified: true });
    req.login(updatedUser, (err) => {
      if (err) {
        return res.status(500).json({ message: "Verification succeeded but session update failed" });
      }
      return res.json({ message: "Email verified successfully", user: updatedUser });
    });
  });

  app.post("/api/auth/resend-code", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user!.emailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const canSend = await canResendCode(req.user!.id);
    if (!canSend) {
      return res.status(429).json({ message: "Please wait at least 60 seconds before requesting a new code" });
    }

    const code = await createVerificationCode(req.user!.id);
    await sendVerificationEmail(req.user!.email, code);

    return res.json({ message: "Verification code sent to your email" });
  });

  app.get("/api/auth/tenants", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      if (req.user!.isPlatformAdmin) {
        const allTenants = await db.select().from(tenants);
        const memberships = await db
          .select()
          .from(tenantMembers)
          .where(eq(tenantMembers.userId, req.user!.id));
        const membershipMap = new Map(memberships.map(m => [m.tenantId, m.role]));

        return res.json(
          allTenants.map(t => ({
            ...t,
            role: membershipMap.get(t.id) || "platform_admin",
          }))
        );
      }

      const memberships = await db
        .select()
        .from(tenantMembers)
        .where(
          and(
            eq(tenantMembers.userId, req.user!.id),
            eq(tenantMembers.status, "active")
          )
        );

      if (memberships.length === 0) {
        return res.json([]);
      }

      const tenantIds = memberships.map(m => m.tenantId);
      const userTenants = await db.select().from(tenants);
      const filtered = userTenants.filter(t => tenantIds.includes(t.id));
      const membershipMap = new Map(memberships.map(m => [m.tenantId, m.role]));

      return res.json(
        filtered.map(t => ({
          ...t,
          role: membershipMap.get(t.id) || "tenant_staff",
        }))
      );
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export async function getUserTenantRole(
  userId: string,
  tenantSlug: string
): Promise<string | null> {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug));
  if (!tenant) return null;

  const [membership] = await db
    .select()
    .from(tenantMembers)
    .where(
      and(
        eq(tenantMembers.userId, userId),
        eq(tenantMembers.tenantId, tenant.id),
        eq(tenantMembers.status, "active")
      )
    );

  return membership?.role || null;
}
