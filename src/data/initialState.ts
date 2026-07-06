import type { EconomyState, HistoryPoint, PolicyDecision, RoundResult } from "../game/types";

export const initialDecision: PolicyDecision = {
  rate: "hold",
  lending: "normal",
  liquidity: "hold",
};

export const initialState: EconomyState = {
  round: 1,
  baseRate: 3.5,
  gdpGrowth: 4.2,
  inflation: 2.4,
  unemployment: 5.1,
  householdIncome: 100,
  householdConsumption: 68,
  householdSavings: 32,
  householdDebt: 42,
  confidence: 64,
  corporateRevenue: 120,
  corporateDebt: 78,
  corporateProfit: 12.5,
  corporateDefaultRisk: 3.8,
  deposits: 160,
  loans: 138,
  bankCapital: 18,
  badDebtRate: 2.6,
  liquidity: 55,
  stockIndex: 3200,
  bondYield: 3.1,
  riskAppetite: 58,
  volatility: 16,
  creditGrowth: 6.2,
  systemicRisk: "中",
};

export const initialResult: RoundResult = {
  title: "第 1 轮基准状态",
  financing: "企业融资环境处于中性区间，贷款扩张速度温和。",
  consumption: "居民收入和信心支撑消费，但债务水平已经需要观察。",
  bankingRisk: "银行坏账率可控，资本缓冲仍能吸收常规损失。",
  market: "股票指数与风险偏好处于平衡状态，债券收益率接近基准利率。",
  departments: [
    {
      key: "policy",
      name: "政府/央行政策",
      status: "稳定",
      metrics: ["利率 0%", "信用冲击 0", "流动性 0"],
      explanation: "初始政策处于中性状态，资金松紧没有额外冲击。",
    },
    {
      key: "household",
      name: "居民部门",
      status: "稳定",
      metrics: ["消费 68.0", "收入 100.0", "债务 42.0"],
      explanation: "居民消费由收入、债务和信心共同决定。",
    },
    {
      key: "enterprise",
      name: "企业部门",
      status: "稳定",
      metrics: ["债务 78.0", "利润 12.5", "违约风险 3.8%"],
      explanation: "企业通过融资扩张生产，同时承担债务和违约风险。",
    },
    {
      key: "banking",
      name: "银行部门",
      status: "稳定",
      metrics: ["坏账 2.6%", "资本 18.0", "流动性 55.0"],
      explanation: "银行在贷款收益和坏账损失之间维持平衡。",
    },
    {
      key: "market",
      name: "金融市场",
      status: "稳定",
      metrics: ["股票 3200点", "债券 3.1%", "风险偏好 58.0"],
      explanation: "市场价格随利率、流动性和风险预期变化。",
    },
  ],
  summary: "当前系统没有明显危机，但任何连续宽松或连续收紧都会改变风险结构。",
  deltas: {},
};

export const initialHistory: HistoryPoint[] = [
  {
    round: initialState.round,
    gdpGrowth: initialState.gdpGrowth,
    inflation: initialState.inflation,
    unemployment: initialState.unemployment,
    badDebtRate: initialState.badDebtRate,
    stockIndex: initialState.stockIndex,
    systemicRisk: initialState.systemicRisk,
  },
];
