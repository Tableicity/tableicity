import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createHash } from 'crypto';
import rateLimit from 'express-rate-limit';
import { storage } from './storage';
import { generateOwnershipProof, verifyOwnershipProof, generatePedersenCommitment } from './proof-service';
import { getTenant } from './tenant';
import { checkProofAccess } from './proof-middleware';

const router = Router();
const publicRouter = Router();

function publicVerifyCors(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
}

const ownershipProofSchema = z.object({
  holderRef: z.string().min(1),
  shareClass: z.string().min(1),
  shares: z.number().int().nonnegative(),
  threshold: z.number().int().positive(),
});

const verifyProofSchema = z.object({
  proofHex: z.string().min(1),
  verificationKeyHex: z.string().min(1),
  publicInputs: z.array(z.string()),
});

async function getAuthorizedTenantId(req: Request): Promise<string | null> {
  const slug = req.tenantSlug;
  if (!slug) return null;
  const tenant = await getTenant(slug);
  return tenant?.id || null;
}

router.post('/ownership', checkProofAccess, async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const parsed = ownershipProofSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { holderRef, shareClass, shares, threshold } = parsed.data;

    const commitmentRecord = await storage.getCommitmentByHolderAndClass(tenantId, holderRef, shareClass);
    if (!commitmentRecord) {
      return res.status(404).json({ error: 'No commitment found for this holder and share class' });
    }

    const preimage = `${shares}||${holderRef}||${commitmentRecord.salt}`;
    const expectedHash = createHash('sha256').update(preimage).digest('hex');
    if (expectedHash !== commitmentRecord.commitmentHash) {
      return res.status(403).json({ error: 'Shares value does not match committed cap table data' });
    }

    let pedersenCommitment = commitmentRecord.pedersenCommitment;
    if (!pedersenCommitment) {
      pedersenCommitment = await generatePedersenCommitment(shares, commitmentRecord.salt);
      await storage.updateCommitmentRecord(commitmentRecord.id, {
        pedersenCommitment,
      });
    }

    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const proofRequest = await storage.createProofRequest({
      tenantId,
      proofType: 'ownership_threshold',
      requestedBy: (req.user as any).id,
      publicInputs: { threshold, holderRef, shareClass },
      status: 'generating',
      expiresAt,
    });

    try {
      const proofOutput = await generateOwnershipProof({
        shares,
        salt: commitmentRecord.salt,
        threshold,
        commitment: pedersenCommitment,
      });

      await storage.createProofResult({
        requestId: proofRequest.id,
        proofHex: proofOutput.proofHex,
        verificationKeyHex: proofOutput.verificationKeyHex,
        verified: true,
      });

      await storage.updateProofRequest(proofRequest.id, { status: 'complete' } as any);

      if (req.proofBillingMonth) {
        await storage.incrementProofUsage(tenantId, req.proofBillingMonth);
      }

      return res.json({
        proofId: proofRequest.id,
        status: 'complete',
        expiresAt,
      });
    } catch (proofError: any) {
      await storage.updateProofRequest(proofRequest.id, { status: 'failed' } as any);
      return res.status(422).json({
        error: 'Proof generation failed',
        message: proofError.message?.includes('Below threshold')
          ? 'Holdings do not meet the specified threshold'
          : 'Circuit constraint not satisfied',
      });
    }
  } catch (e: any) {
    console.error('[proof-routes] ownership error:', e.message?.substring(0, 100));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/verify', async (req: Request, res: Response) => {
  try {
    const parsed = verifyProofSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { proofHex, verificationKeyHex, publicInputs } = parsed.data;
    const isValid = await verifyOwnershipProof(proofHex, verificationKeyHex, publicInputs);

    return res.json({
      valid: isValid,
      verifiedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('[proof-routes] verify error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/commitments', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const commitments = await storage.getCommitmentRecords(tenantId);
    return res.json(commitments.filter(c => c.isActive));
  } catch (e: any) {
    console.error('[proof-routes] commitments error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/usage', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const slug = req.tenantSlug!;
    const tenant = await getTenant(slug);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { getProofTierConfig } = await import('./proof-config');
    const config = getProofTierConfig(tenant.plan);
    const now = new Date();
    const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usage = await storage.getProofUsage(tenantId, billingMonth);

    return res.json({
      plan: tenant.plan,
      noirEnabled: config.noirEnabled,
      maxProofsPerMonth: config.maxProofsPerMonth,
      currentCount: usage?.proofCount || 0,
      billingMonth,
      overagePriceCents: config.overagePriceCents,
    });
  } catch (e: any) {
    console.error('[proof-routes] usage error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:proofId', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { proofId } = req.params;
    const proofRequest = await storage.getProofRequest(proofId);
    if (!proofRequest || proofRequest.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    if (proofRequest.expiresAt && new Date(proofRequest.expiresAt) < new Date()) {
      if (proofRequest.status !== 'expired') {
        await storage.updateProofRequest(proofId, { status: 'expired' } as any);
      }
      return res.json({
        proofId: proofRequest.id,
        proofType: proofRequest.proofType,
        status: 'expired',
        createdAt: proofRequest.createdAt,
        expiresAt: proofRequest.expiresAt,
      });
    }

    const proofResult = await storage.getProofResult(proofId);

    return res.json({
      proofId: proofRequest.id,
      proofType: proofRequest.proofType,
      status: proofRequest.status,
      publicInputs: proofRequest.publicInputs,
      createdAt: proofRequest.createdAt,
      expiresAt: proofRequest.expiresAt,
      ...(proofResult ? {
        verified: proofResult.verified,
      } : {}),
    });
  } catch (e: any) {
    console.error('[proof-routes] get proof error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
    const offset = (page - 1) * limit;

    const proofs = await storage.getProofRequests(tenantId);
    const sorted = proofs.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const paginated = sorted.slice(offset, offset + limit);

    return res.json({
      proofs: paginated,
      total: proofs.length,
      page,
      limit,
      totalPages: Math.ceil(proofs.length / limit),
    });
  } catch (e: any) {
    console.error('[proof-routes] list proofs error:', e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const publicVerifyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification requests. Please try again later.' },
});

publicRouter.get('/verify/:proofId', publicVerifyCors, publicVerifyLimiter, async (req: Request, res: Response) => {
  try {
    const { proofId } = req.params;
    const proofRequest = await storage.getProofRequest(proofId);
    if (!proofRequest) {
      return res.status(404).json({ status: 'not_found', isValid: false });
    }

    if (proofRequest.expiresAt && new Date(proofRequest.expiresAt) < new Date()) {
      if (proofRequest.status !== 'expired') {
        await storage.updateProofRequest(proofId, { status: 'expired' } as any);
      }
      return res.json({
        proofId: proofRequest.id,
        status: 'expired',
        isValid: false,
      });
    }

    const proofResult = await storage.getProofResult(proofId);
    const isValid = proofRequest.status === 'complete' && proofResult?.verified === true;

    return res.json({
      proofId: proofRequest.id,
      proofType: proofRequest.proofType,
      status: proofRequest.status,
      createdAt: proofRequest.createdAt,
      expiresAt: proofRequest.expiresAt,
      isValid,
    });
  } catch (e: any) {
    console.error('[proof-routes] public verify error');
    return res.status(500).json({ status: 'error', isValid: false });
  }
});

export { publicRouter };
export default router;
