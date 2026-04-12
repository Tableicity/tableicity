export interface ProofTierConfig {
  noirEnabled: boolean;
  maxProofsPerMonth: number;
  overagePriceCents: number;
}

const BETA_MODE = true;

const PROOF_TIER_PRODUCTION: Record<string, ProofTierConfig> = {
  trial:        { noirEnabled: false, maxProofsPerMonth: 0,   overagePriceCents: 0 },
  standard:     { noirEnabled: false, maxProofsPerMonth: 0,   overagePriceCents: 0 },
  starter:      { noirEnabled: false, maxProofsPerMonth: 0,   overagePriceCents: 0 },
  professional: { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 2500 },
  enterprise:   { noirEnabled: true,  maxProofsPerMonth: 100, overagePriceCents: 1500 },
};

const PROOF_TIER_BETA: Record<string, ProofTierConfig> = {
  trial:        { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 0 },
  standard:     { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 0 },
  starter:      { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 0 },
  professional: { noirEnabled: true,  maxProofsPerMonth: 10,  overagePriceCents: 2500 },
  enterprise:   { noirEnabled: true,  maxProofsPerMonth: 100, overagePriceCents: 1500 },
};

export const PROOF_TIER_CONFIG = BETA_MODE ? PROOF_TIER_BETA : PROOF_TIER_PRODUCTION;

export function getProofTierConfig(plan: string): ProofTierConfig {
  return PROOF_TIER_CONFIG[plan] || PROOF_TIER_CONFIG.starter;
}
