import type { EconomyState } from "./types";

export function describeCreditCondition(state: EconomyState) {
  const { creditExpansion, badDebtRisk, debtPressure } = state.variables;
  if (badDebtRisk >= 65) return "坏账风险偏高，银行更可能惜贷。";
  if (creditExpansion <= 42) return "信贷扩张偏弱，企业融资可能受阻。";
  if (debtPressure >= 68) return "债务压力较高，继续扩张信贷会放大后续风险。";
  if (creditExpansion >= 65) return "信用供给充足，但需要观察是否推高债务。";
  return "信用环境大体中性。";
}
