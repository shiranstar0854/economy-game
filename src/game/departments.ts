import { lendingImpact, liquidityImpact, rateImpact, round1 } from "./policy";
import type { DepartmentResult, EconomyState, PolicyDecision } from "./types";

function statusFromDelta(delta: number, pressure = false): DepartmentResult["status"] {
  if (pressure && delta > 0.2) return "承压";
  if (delta > 0.2) return "扩张";
  if (delta < -0.2) return "收缩";
  return "稳定";
}

function signed(value: number, unit = "") {
  if (value > 0) return `+${round1(value)}${unit}`;
  if (value < 0) return `${round1(value)}${unit}`;
  return `0${unit}`;
}

export function buildDepartmentResults(previous: EconomyState, next: EconomyState, decision: PolicyDecision): DepartmentResult[] {
  const rate = rateImpact[decision.rate];
  const lending = lendingImpact[decision.lending];
  const liquidity = liquidityImpact[decision.liquidity];
  const consumptionDelta = next.householdConsumption - previous.householdConsumption;
  const debtDelta = next.corporateDebt - previous.corporateDebt;
  const badDebtDelta = next.badDebtRate - previous.badDebtRate;
  const stockDelta = next.stockIndex - previous.stockIndex;
  const policyPressure = rate.credit + lending.credit + liquidity.liquidity * 0.15;

  return [
    {
      key: "policy",
      name: "政府/央行政策",
      status: statusFromDelta(policyPressure),
      metrics: [`利率 ${signed(rate.rateDelta, "%")}`, `信用冲击 ${signed(rate.credit + lending.credit)}`, `流动性 ${signed(liquidity.liquidity)}`],
      explanation: `${rate.label}、放贷${lending.label}、流动性${liquidity.label}共同决定本轮资金松紧。`,
    },
    {
      key: "household",
      name: "居民部门",
      status: statusFromDelta(consumptionDelta),
      metrics: [`消费 ${signed(consumptionDelta)}`, `收入 ${next.householdIncome.toFixed(1)}`, `债务 ${next.householdDebt.toFixed(1)}`],
      explanation: "居民通过收入、信心和债务压力把宏观变化传导到消费需求。",
    },
    {
      key: "enterprise",
      name: "企业部门",
      status: next.corporateDefaultRisk > previous.corporateDefaultRisk + 0.2 ? "承压" : statusFromDelta(next.corporateProfit - previous.corporateProfit),
      metrics: [`债务 ${signed(debtDelta)}`, `利润 ${next.corporateProfit.toFixed(1)}`, `违约风险 ${next.corporateDefaultRisk.toFixed(1)}%`],
      explanation: "企业把信用扩张转化为收入和投资，但债务和利率会反向挤压利润。",
    },
    {
      key: "banking",
      name: "银行部门",
      status: statusFromDelta(badDebtDelta, true),
      metrics: [`坏账 ${signed(badDebtDelta, "pct")}`, `资本 ${next.bankCapital.toFixed(1)}`, `流动性 ${next.liquidity.toFixed(1)}`],
      explanation: "银行连接居民储蓄和企业贷款，坏账上升会侵蚀资本并放大系统压力。",
    },
    {
      key: "market",
      name: "金融市场",
      status: next.volatility > previous.volatility + 0.4 ? "承压" : statusFromDelta(stockDelta),
      metrics: [`股票 ${signed(stockDelta, "点")}`, `债券 ${next.bondYield.toFixed(1)}%`, `风险偏好 ${next.riskAppetite.toFixed(1)}`],
      explanation: "市场根据利率、流动性、企业利润和坏账压力重新定价风险资产。",
    },
  ];
}
