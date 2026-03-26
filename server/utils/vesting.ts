export interface VestingParams {
  shares: number;
  vestingStartDate: string | null;
  vestingDurationMonths: number | null;
  cliffMonths: number | null;
  vestFrequencyMonths: number | null;
}

export function computeVestedShares(params: VestingParams, asOfDate?: Date): number {
  const { shares, vestingStartDate, vestingDurationMonths, cliffMonths, vestFrequencyMonths } = params;

  if (!vestingStartDate || !vestingDurationMonths) {
    return shares;
  }

  const now = asOfDate || new Date();
  const start = new Date(vestingStartDate);
  const monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  if (monthsElapsed < 0) {
    return 0;
  }

  if (cliffMonths && monthsElapsed < cliffMonths) {
    return 0;
  }

  if (monthsElapsed >= vestingDurationMonths) {
    return shares;
  }

  const freq = vestFrequencyMonths || 1;
  const vestingPeriods = Math.floor(monthsElapsed / freq);
  const totalPeriods = Math.floor(vestingDurationMonths / freq);

  if (totalPeriods <= 0) {
    return shares;
  }

  return Math.min(shares, Math.max(0, Math.floor((shares * vestingPeriods) / totalPeriods)));
}
