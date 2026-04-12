import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { getTenant } from './tenant';
import { checkProofAccess } from './proof-middleware';
import { generateOwnershipProof, generatePedersenCommitment } from './proof-service';
import { createHash } from 'crypto';

const router = Router();

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-3-fast';

const SYSTEM_PROMPT = `You are Haylo AI, an equity management assistant embedded in Tableicity, a cap table management platform. Your role is to analyze natural language equity scenarios and produce structured JSON responses.

When a user describes an equity scenario (e.g., term sheet analysis, dilution modeling, SAFE conversion, ownership verification), you must:

1. Parse the equity-relevant data from their input
2. Identify the type of operation (ownership_verification, dilution_analysis, safe_conversion, term_sheet_review, equity_scenario)
3. Extract structured parameters
4. Provide a clear human-readable summary

IMPORTANT RULES:
- You NEVER modify the database directly. You only propose structured intents.
- All state changes must go through the Four-Gate Middleware for validation.
- You operate within tenant-isolated schemas — you cannot access cross-tenant data.
- For ownership verification requests, extract: stakeholder name/reference, share class, number of shares, and threshold percentage.

Always respond with valid JSON in this exact format:
{
  "intentType": "ownership_verification" | "dilution_analysis" | "safe_conversion" | "term_sheet_review" | "equity_scenario",
  "summary": "Human-readable summary of what was analyzed",
  "parameters": {
    // Relevant extracted parameters based on intentType
  },
  "recommendations": ["List of actionable recommendations"],
  "canGenerateProof": true/false,
  "proofParameters": {
    // Only if canGenerateProof is true
    "holderRef": "stakeholder reference",
    "shareClass": "share class name",
    "shares": 0,
    "threshold": 0
  }
}

If the input is unclear or not equity-related, respond with:
{
  "intentType": "clarification_needed",
  "summary": "Explanation of what additional information is needed",
  "parameters": {},
  "recommendations": ["What the user should provide"],
  "canGenerateProof": false
}`;

const intentInputSchema = z.object({
  input: z.string().min(1).max(5000),
});

const approveSchema = z.object({
  executeProof: z.boolean().default(false),
});

async function callGrokAPI(userInput: string, tenantContext: { tenantName: string; plan: string }): Promise<{ structured: any; rawResponse: string }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not configured');
  }

  const contextMessage = `Tenant context: Company "${tenantContext.tenantName}" on "${tenantContext.plan}" plan.\n\nUser request: ${userInput}`;

  const response = await fetch(GROK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contextMessage },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[haylo] Grok API error:', response.status, errorText.substring(0, 200));
    throw new Error(`Inference engine returned ${response.status}`);
  }

  const data = await response.json() as any;
  const rawContent = data.choices?.[0]?.message?.content || '';

  let structured;
  try {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      structured = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (parseError) {
    structured = {
      intentType: 'clarification_needed',
      summary: 'The AI response could not be parsed into a structured format.',
      parameters: { rawResponse: rawContent.substring(0, 500) },
      recommendations: ['Please try rephrasing your request with specific equity details.'],
      canGenerateProof: false,
    };
  }

  return { structured, rawResponse: rawContent };
}

async function getAuthorizedTenantId(req: Request): Promise<string | null> {
  const slug = req.tenantSlug;
  if (!slug) return null;
  const tenant = await getTenant(slug);
  return tenant?.id || null;
}

router.post('/intent', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const parsed = intentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
    }

    const { input } = parsed.data;
    const userId = (req.user as any).id;
    const slug = req.tenantSlug!;
    const tenant = await getTenant(slug);

    const intent = await storage.createHayloIntent({
      tenantId,
      userId,
      naturalLanguageInput: input,
      status: 'analyzing',
    });

    try {
      const { structured, rawResponse } = await callGrokAPI(input, {
        tenantName: tenant?.name || slug,
        plan: tenant?.plan || 'trial',
      });

      const updatedIntent = await storage.updateHayloIntent(intent.id, {
        structuredIntent: structured,
        grokRawResponse: rawResponse,
        status: 'proposed',
      } as any);

      return res.json({
        intentId: updatedIntent.id,
        status: 'proposed',
        structured,
        createdAt: updatedIntent.createdAt,
      });
    } catch (aiError: any) {
      await storage.updateHayloIntent(intent.id, {
        status: 'failed',
        rejectionReason: aiError.message,
      } as any);

      return res.status(502).json({
        error: 'Inference engine error',
        message: aiError.message,
        intentId: intent.id,
      });
    }
  } catch (e: any) {
    console.error('[haylo] intent error:', e.message?.substring(0, 100));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/approve/:intentId', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { intentId } = req.params;
    const intent = await storage.getHayloIntent(intentId);

    if (!intent || intent.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    if (intent.status !== 'proposed') {
      return res.status(400).json({ error: `Intent is in '${intent.status}' state, cannot approve` });
    }

    const parsed = approveSchema.safeParse(req.body);
    const executeProof = parsed.success ? parsed.data.executeProof : false;

    const structured = intent.structuredIntent as any;

    if (executeProof && structured?.canGenerateProof && structured?.proofParameters) {
      const proofAccessGranted = await new Promise<boolean>((resolve) => {
        checkProofAccess(req, res, (err?: any) => {
          if (err) resolve(false);
          else resolve(true);
        });
      });
      if (!proofAccessGranted || res.headersSent) {
        return;
      }
      const { holderRef, shareClass, shares, threshold } = structured.proofParameters;

      const commitmentRecord = await storage.getCommitmentByHolderAndClass(tenantId, holderRef, shareClass);
      if (!commitmentRecord) {
        await storage.updateHayloIntent(intentId, {
          status: 'failed',
          rejectionReason: 'No commitment record found for the specified holder and share class',
          resolvedAt: new Date().toISOString(),
        } as any);

        return res.status(404).json({
          error: 'No commitment found',
          message: 'The stakeholder/share class combination has no commitment record for proof generation.',
        });
      }

      const preimage = `${shares}||${holderRef}||${commitmentRecord.salt}`;
      const expectedHash = createHash('sha256').update(preimage).digest('hex');
      if (expectedHash !== commitmentRecord.commitmentHash) {
        await storage.updateHayloIntent(intentId, {
          status: 'failed',
          rejectionReason: 'Share data does not match committed cap table data',
          resolvedAt: new Date().toISOString(),
        } as any);

        return res.status(403).json({ error: 'Shares value does not match committed cap table data' });
      }

      let pedersenCommitment = commitmentRecord.pedersenCommitment;
      if (!pedersenCommitment) {
        pedersenCommitment = await generatePedersenCommitment(shares, commitmentRecord.salt);
        await storage.updateCommitmentRecord(commitmentRecord.id, { pedersenCommitment });
      }

      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

      const proofRequest = await storage.createProofRequest({
        tenantId,
        proofType: 'ownership_threshold',
        requestedBy: (req.user as any).id,
        publicInputs: { threshold, holderRef, shareClass },
        status: 'generating',
        requestSource: 'AI_HAYLO',
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

        await storage.updateHayloIntent(intentId, {
          status: 'executed',
          proofRequestId: proofRequest.id,
          resolvedAt: new Date().toISOString(),
        } as any);

        return res.json({
          intentId,
          status: 'executed',
          proofId: proofRequest.id,
          proofStatus: 'complete',
          expiresAt,
        });
      } catch (proofError: any) {
        await storage.updateProofRequest(proofRequest.id, { status: 'failed' } as any);
        await storage.updateHayloIntent(intentId, {
          status: 'failed',
          proofRequestId: proofRequest.id,
          rejectionReason: proofError.message,
          resolvedAt: new Date().toISOString(),
        } as any);

        return res.status(422).json({
          error: 'Proof generation failed',
          message: proofError.message?.includes('Below threshold')
            ? 'Holdings do not meet the specified threshold'
            : 'Circuit constraint not satisfied',
        });
      }
    }

    await storage.updateHayloIntent(intentId, {
      status: 'approved',
      resolvedAt: new Date().toISOString(),
    } as any);

    return res.json({
      intentId,
      status: 'approved',
      message: 'Intent approved and recorded.',
    });
  } catch (e: any) {
    console.error('[haylo] approve error:', e.message?.substring(0, 100));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reject/:intentId', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { intentId } = req.params;
    const intent = await storage.getHayloIntent(intentId);

    if (!intent || intent.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    if (intent.status !== 'proposed') {
      return res.status(400).json({ error: `Intent is in '${intent.status}' state, cannot reject` });
    }

    const reason = req.body.reason || 'User rejected';

    await storage.updateHayloIntent(intentId, {
      status: 'rejected',
      rejectionReason: reason,
      resolvedAt: new Date().toISOString(),
    } as any);

    return res.json({
      intentId,
      status: 'rejected',
    });
  } catch (e: any) {
    console.error('[haylo] reject error:', e.message?.substring(0, 100));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/intents', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const intents = await storage.getHayloIntents(tenantId);
    const sorted = intents.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return res.json({ intents: sorted, total: sorted.length });
  } catch (e: any) {
    console.error('[haylo] list intents error:', e.message?.substring(0, 100));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/intents/:intentId', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const { intentId } = req.params;
    const intent = await storage.getHayloIntent(intentId);

    if (!intent || intent.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    return res.json(intent);
  } catch (e: any) {
    console.error('[haylo] get intent error:', e.message?.substring(0, 100));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/term-sheet', async (req: Request, res: Response) => {
  try {
    const tenantId = await getAuthorizedTenantId(req);
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant context required' });
    }

    const slug = req.tenantSlug!;
    const tenant = await getTenant(slug);
    const tenantStorage = req.tenantStorage;
    if (!tenantStorage) {
      return res.status(500).json({ error: 'Tenant storage not available' });
    }

    const company = await tenantStorage.getCompany();
    if (!company) {
      return res.status(404).json({ error: 'No company found' });
    }

    const docs = await tenantStorage.getDocuments(company.id);
    const SEEDED_NAME = 'Series A Term Sheet \u2014 Quantum Innovations Inc.';
    const SEEDED_MARKER = '[Category: Test Drives] | Haylo AI Sample Term Sheet';
    const termSheetDoc = docs.find(d =>
      d.name === SEEDED_NAME &&
      d.description?.includes(SEEDED_MARKER) &&
      d.uploadedBy === 'System'
    );

    if (!termSheetDoc) {
      return res.json({ found: false, content: null, documentName: null });
    }

    const content = termSheetDoc.description?.replace(/^\[Category:.*?\]\s*\|\s*Haylo AI Sample Term Sheet\n\n/, '') || '';

    return res.json({
      found: true,
      content,
      documentName: termSheetDoc.name,
      documentId: termSheetDoc.id,
    });
  } catch (e: any) {
    console.error('[haylo] term-sheet error:', e.message?.substring(0, 100));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
