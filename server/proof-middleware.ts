import { Request, Response, NextFunction } from 'express';
import { getTenant } from './tenant';
import { storage } from './storage';
import { getProofTierConfig } from './proof-config';

function getCurrentBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function checkProofAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.tenantSlug;
    if (!slug) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const tenant = await getTenant(slug);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const config = getProofTierConfig(tenant.plan);

    if (!config.noirEnabled) {
      return res.status(402).json({
        error: 'upgrade_required',
        message: 'Privacy Vault requires a Professional or Enterprise plan.',
        currentPlan: tenant.plan,
      });
    }

    const billingMonth = getCurrentBillingMonth();
    const usage = await storage.getProofUsage(tenant.id, billingMonth);
    const currentCount = usage?.proofCount || 0;

    if (currentCount >= config.maxProofsPerMonth) {
      return res.status(402).json({
        error: 'limit_reached',
        message: `Monthly proof limit of ${config.maxProofsPerMonth} reached.`,
        currentCount,
        limit: config.maxProofsPerMonth,
        overagePriceCents: config.overagePriceCents,
      });
    }

    req.proofTierConfig = config;
    req.proofUsageCount = currentCount;
    req.proofBillingMonth = billingMonth;

    next();
  } catch (e: any) {
    console.error('[proof-middleware] Error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export async function checkProofReadAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.tenantSlug;
    if (!slug) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const tenant = await getTenant(slug);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const config = getProofTierConfig(tenant.plan);

    if (!config.noirEnabled) {
      return res.status(402).json({
        error: 'upgrade_required',
        message: 'Privacy Vault requires a Professional or Enterprise plan.',
        currentPlan: tenant.plan,
      });
    }

    next();
  } catch (e: any) {
    console.error('[proof-middleware] Error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
