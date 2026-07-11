import type { EconomyState } from "./types";

export type SubjectSnapshot = {
  name: string;
  status: "改善" | "承压" | "稳定";
  summary: string;
};

function trend(value: number, low = 45, high = 60): SubjectSnapshot["status"] {
  if (value < low) return "承压";
  if (value > high) return "改善";
  return "稳定";
}

export function buildSubjectSnapshots(state: EconomyState): SubjectSnapshot[] {
  const v = state.variables;
  return [
    {
      name: "家庭",
      status: trend((v.residentIncome + v.consumptionIntent + v.residentExpectation) / 3),
      summary: "收入、消费和预期决定内需强弱。",
    },
    {
      name: "企业",
      status: trend((v.enterpriseOrders + v.enterpriseProfit + v.investmentIntent) / 3),
      summary: "订单、利润和投资意愿决定生产扩张。",
    },
    {
      name: "银行",
      status: v.badDebtRisk > 62 || v.creditExpansion < 42 ? "承压" : v.creditExpansion > 60 ? "改善" : "稳定",
      summary: "信贷和坏账决定资金传导是否顺畅。",
    },
    {
      name: "政府",
      status: trend(v.localFinance),
      summary: "财政和监管用于修正系统失衡。",
    },
    {
      name: "外部模块",
      status: trend((v.housePriceIndex + v.externalDemand) / 2),
      summary: "房地产和外需改变财富效应与订单。",
    },
  ];
}
