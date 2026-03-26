import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import { requireAuth } from "./auth";
import { db } from "./db";
import { users, tenants, tenantMembers } from "@shared/schema";
import { eq, and } from "drizzle-orm";

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey, { apiVersion: "2025-03-31.basil" as any });
}

export const PRICING_TIERS = [
  {
    id: "starter",
    name: "Starter",
    description: "For early-stage startups getting organized",
    features: [
      "Up to 10 stakeholders",
      "Basic cap table",
      "SAFE agreement tracking",
      "Email support",
    ],
    monthlyPrice: 49,
    highlighted: false,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing companies managing equity actively",
    features: [
      "Up to 50 stakeholders",
      "Full cap table with modeling",
      "ESOP management",
      "Document templates",
      "Encrypted view",
      "Priority support",
    ],
    monthlyPrice: 149,
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For established companies with complex equity needs",
    features: [
      "Unlimited stakeholders",
      "Advanced compliance tools",
      "409A valuation support",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    monthlyPrice: 399,
    highlighted: false,
  },
];

export function setupStripeRoutes(app: Express) {
  app.get("/api/stripe/pricing", (_req: Request, res: Response) => {
    res.json({ tiers: PRICING_TIERS });
  });

  app.get("/api/stripe/subscription", requireAuth, async (req: Request, res: Response) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
      if (!user?.stripeSubscriptionId) {
        return res.json({ subscription: null });
      }

      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      res.json({ subscription });
    } catch (error: any) {
      console.error("Error fetching subscription:", error.message);
      res.json({ subscription: null });
    }
  });

  const VALID_TIER_IDS = new Set(PRICING_TIERS.map(t => t.id));

  function buildPriceToTierMap(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const tier of PRICING_TIERS) {
      map[tier.id] = tier.id;
    }
    const envMap = process.env.STRIPE_PRICE_TIER_MAP;
    if (envMap) {
      for (const pair of envMap.split(",")) {
        const [stripePriceId, tierId] = pair.split(":");
        if (stripePriceId && tierId && VALID_TIER_IDS.has(tierId)) {
          map[stripePriceId] = tierId;
        }
      }
    }
    return map;
  }

  app.post("/api/stripe/create-checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const { priceId, tenantId } = req.body;
      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      const priceToTier = buildPriceToTierMap();
      const resolvedTierId = priceToTier[priceId];
      if (!resolvedTierId) {
        return res.status(400).json({ message: "Unknown price ID. Cannot determine subscription tier." });
      }

      const stripe = getStripeClient();
      const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const tenantSlug = tenantId || req.query.tenant as string || req.headers["x-tenant-slug"] as string;
      if (!tenantSlug) {
        return res.status(400).json({ message: "Tenant context is required for subscription checkout." });
      }
      const [targetTenant] = await db.select().from(tenants)
        .where(eq(tenants.slug, tenantSlug));
      const tenantIdResolved = targetTenant?.id || tenantSlug;
      const [membership] = await db.select().from(tenantMembers)
        .where(and(eq(tenantMembers.userId, user.id), eq(tenantMembers.tenantId, tenantIdResolved)));
      if (!membership) {
        return res.status(403).json({ message: "You are not a member of the specified organization." });
      }
      const resolvedTenantId = membership.tenantId;

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${baseUrl}/profile?checkout=success`,
        cancel_url: `${baseUrl}/profile?checkout=cancelled`,
        metadata: {
          userId: user.id,
          tierId: resolvedTierId,
          tenantId: resolvedTenantId,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            tierId: resolvedTierId,
            tenantId: resolvedTenantId,
          },
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error.message);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/create-portal", requireAuth, async (req: Request, res: Response) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found. Subscribe to a plan first." });
      }

      const stripe = getStripeClient();
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/profile`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Portal error:", error.message);
      res.status(500).json({ message: "Failed to open billing portal" });
    }
  });

  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      const stripe = getStripeClient();
      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;
      const isDev = process.env.NODE_ENV === "development";

      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.rawBody as any, sig as string, webhookSecret);
      } else if (isDev) {
        console.warn("[stripe] WARNING: Accepting unsigned webhook in development mode");
        event = req.body as Stripe.Event;
      } else {
        console.error("[stripe] Webhook signature verification failed: STRIPE_WEBHOOK_SECRET not set in production");
        return res.status(400).json({ error: "Webhook signature required" });
      }

      switch (event.type) {
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId!, customerId));
          if (user) {
            await db.update(users).set({ stripeSubscriptionId: subscription.id }).where(eq(users.id, user.id));

            const subMeta = subscription.metadata || {};
            const tierId = subMeta.tierId;
            const targetTenantId = subMeta.tenantId;

            const validPlans = ["starter", "professional", "enterprise"];
            if (tierId && validPlans.includes(tierId) && targetTenantId) {
              const [tenantExists] = await db.select().from(tenants).where(eq(tenants.id, targetTenantId));
              if (tenantExists) {
                await db.update(tenants).set({ plan: tierId }).where(eq(tenants.id, targetTenantId));
                console.log(`[stripe] Updated tenant ${targetTenantId} plan to ${tierId}`);
              } else {
                console.error(`[stripe] Tenant ${targetTenantId} not found, skipping plan update`);
              }
            } else {
              console.warn(`[stripe] Skipping plan update: tierId=${tierId}, tenantId=${targetTenantId}`);
            }
          }
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const [user] = await db.select().from(users).where(eq(users.stripeCustomerId!, customerId));
          if (user) {
            await db.update(users).set({ stripeSubscriptionId: null }).where(eq(users.id, user.id));
            const subMeta = subscription.metadata || {};
            const targetTenantId = subMeta.tenantId;
            if (targetTenantId) {
              const [tenantExists] = await db.select().from(tenants).where(eq(tenants.id, targetTenantId));
              if (tenantExists) {
                await db.update(tenants).set({ plan: "starter" }).where(eq(tenants.id, targetTenantId));
                console.log(`[stripe] Downgraded tenant ${targetTenantId} to starter (subscription deleted)`);
              } else {
                console.error(`[stripe] Tenant ${targetTenantId} not found for downgrade`);
              }
            } else {
              console.warn(`[stripe] Subscription deleted but no tenantId in metadata, skipping plan downgrade`);
            }
          }
          break;
        }
        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          console.log(`[stripe] Invoice payment succeeded for customer ${customerId}, invoice ${invoice.id}`);
          break;
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  });
}
