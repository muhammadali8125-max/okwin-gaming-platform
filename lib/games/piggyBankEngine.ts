// Piggy Bank Smash (Golden Gullak) Game Engine
// Provably Fair Crash & Multiplier Hit Mechanics

export type HammerType = "bronze" | "silver" | "gold";

export interface HammerConfig {
  id: HammerType;
  name: string;
  badge: string;
  color: string;
  minGain: number;
  maxGain: number;
  baseCrackRisk: number; // e.g. 0.08 = 8%
  riskLabel: string;
  maxMultiplierCap: number;
}

export const HAMMERS: Record<HammerType, HammerConfig> = {
  bronze: {
    id: "bronze",
    name: "Bronze Hammer",
    badge: "Low Risk",
    color: "#cd7f32",
    minGain: 0.12,
    maxGain: 0.22,
    baseCrackRisk: 0.07,
    riskLabel: "7% Crack Risk / Hit",
    maxMultiplierCap: 8.0,
  },
  silver: {
    id: "silver",
    name: "Silver Hammer",
    badge: "Medium Risk",
    color: "#cbd5e1",
    minGain: 0.30,
    maxGain: 0.50,
    baseCrackRisk: 0.14,
    riskLabel: "14% Crack Risk / Hit",
    maxMultiplierCap: 25.0,
  },
  gold: {
    id: "gold",
    name: "Golden Hammer",
    badge: "High Roller",
    color: "#f59e0b",
    minGain: 0.70,
    maxGain: 1.25,
    baseCrackRisk: 0.22,
    riskLabel: "22% Crack Risk / Hit",
    maxMultiplierCap: 50.0,
  },
};

export const MAX_PIGGY_WIN_CAP = 50000; // ₨ 50,000 hard ceiling to protect operator

export interface HitResult {
  isCrack: boolean;
  multiplierGain: number;
  newMultiplier: number;
  crackStage: 0 | 1 | 2 | 3; // 0 = pristine, 1 = hairline, 2 = deep, 3 = critical shatter
  payoutPKR: number;
}

/**
 * Calculates a single hammer strike on the Golden Piggy Bank
 */
export function calculatePiggyHit(
  betAmount: number,
  currentMultiplier: number,
  hammer: HammerType,
  hitCount: number,
  tightHouseEdge = false
): HitResult {
  const config = HAMMERS[hammer];

  // As multiplier and hit count increase, crack probability scales smoothly
  const edgePenalty = tightHouseEdge ? 0.04 : 0.0;
  const escalation = Math.min(0.35, hitCount * 0.025);
  const totalCrackProbability = Math.min(0.85, config.baseCrackRisk + escalation + edgePenalty);

  const roll = Math.random();
  const isCrack = roll < totalCrackProbability;

  if (isCrack) {
    return {
      isCrack: true,
      multiplierGain: 0,
      newMultiplier: currentMultiplier,
      crackStage: 3,
      payoutPKR: 0,
    };
  }

  // Calculate random multiplier gain within hammer bounds
  const rawGain = config.minGain + Math.random() * (config.maxGain - config.minGain);
  const roundedGain = Math.round(rawGain * 100) / 100;
  const nextMultiplier = Math.min(
    config.maxMultiplierCap,
    Math.round((currentMultiplier + roundedGain) * 100) / 100
  );

  // Determine visual crack stage
  let crackStage: 0 | 1 | 2 | 3 = 0;
  if (nextMultiplier > 4.0 || hitCount >= 6) {
    crackStage = 2; // Deep cracks, golden steam
  } else if (nextMultiplier > 2.0 || hitCount >= 3) {
    crackStage = 1; // Hairline cracks
  }

  const rawPayout = Math.round(betAmount * nextMultiplier);
  const cappedPayout = Math.min(MAX_PIGGY_WIN_CAP, rawPayout);

  return {
    isCrack: false,
    multiplierGain: roundedGain,
    newMultiplier: nextMultiplier,
    crackStage,
    payoutPKR: cappedPayout,
  };
}
