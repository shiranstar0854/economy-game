import { clamp, round1 } from "./policy";
import type { EconomyState } from "./types";

export type EnterpriseState = {
  corporateRevenue: number;
  corporateDebt: number;
  corporateProfit: number;
  corporateDefaultRisk: number;
};

export function calculateEnterprise(previous: EconomyState, gdpGrowth: number, creditGrowth: number, baseRate: number): EnterpriseState {
  const corporateRevenue = clamp(previous.corporateRevenue + gdpGrowth * 0.9 + creditGrowth * 0.42, 80, 190);
  const corporateDebt = clamp(previous.corporateDebt + Math.max(0, creditGrowth) * 0.75 - baseRate * 0.12, 45, 140);
  const corporateProfit = clamp(corporateRevenue * 0.105 - corporateDebt * 0.025 - baseRate * 0.35, -8, 26);
  const corporateDefaultRisk = clamp(
    previous.corporateDefaultRisk + Math.max(0, -corporateProfit) * 0.4 + corporateDebt * 0.018 - gdpGrowth * 0.18,
    1,
    18,
  );

  return {
    corporateRevenue: round1(corporateRevenue),
    corporateDebt: round1(corporateDebt),
    corporateProfit: round1(corporateProfit),
    corporateDefaultRisk: round1(corporateDefaultRisk),
  };
}
