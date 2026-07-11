import type {
  EconomyMetrics,
  EconomyStatus,
  EconomyVariables,
  EventDefinition,
  MetricKey,
  PolicyDefinition,
  PolicyKey,
  StatusInfo,
  VariableKey,
} from "./types";

export const MAX_ROUNDS = 12;
export const MIN_POLICIES = 2;
export const MAX_POLICIES = 3;

export const variableLabels: Record<VariableKey, string> = {
  residentIncome: "居民收入",
  consumptionIntent: "消费意愿",
  savingsTendency: "储蓄倾向",
  enterpriseOrders: "企业订单",
  enterpriseProfit: "企业利润",
  investmentIntent: "投资意愿",
  employmentLevel: "就业水平",
  creditExpansion: "信贷扩张",
  debtPressure: "债务压力",
  badDebtRisk: "坏账风险",
  housePriceIndex: "房价指数",
  localFinance: "地方财政",
  externalDemand: "外需强度",
  residentExpectation: "居民预期",
  longTermEfficiency: "长期效率",
};

export const metricLabels: Record<MetricKey, string> = {
  growth: "增长",
  employment: "就业",
  inflationPressure: "通胀压力",
  debtPressure: "债务压力",
  badDebtRisk: "坏账风险",
  stabilityIndex: "稳定指数",
};

export const policyDefinitions: Record<PolicyKey, PolicyDefinition> = {
  rateCut: {
    key: "rateCut",
    label: "降息",
    category: "货币",
    description: "降低融资成本，刺激信贷、投资和短期需求。",
    variableEffects: { investmentIntent: 3, creditExpansion: 4, debtPressure: 3, badDebtRisk: 1 },
    metricEffects: { growth: 2, debtPressure: 3, badDebtRisk: 1 },
    suitable: ["需求不足", "增长偏弱", "投资不足"],
    risks: ["经济过热", "债务过高", "泡沫明显"],
    sideEffects: ["债务压力上升", "资产泡沫风险增加"],
  },
  rateRaise: {
    key: "rateRaise",
    label: "加息",
    category: "货币",
    description: "压制过热需求和通胀，但会削弱增长与就业。",
    variableEffects: { creditExpansion: -4, investmentIntent: -2, debtPressure: -2, consumptionIntent: -1 },
    metricEffects: { inflationPressure: -3, growth: -2, employment: -1, debtPressure: -2 },
    suitable: ["经济过热", "通胀较高", "泡沫明显"],
    risks: ["需求不足", "金融收缩", "就业压力大"],
    sideEffects: ["增长承压", "就业压力可能上升"],
  },
  fiscalSpending: {
    key: "fiscalSpending",
    label: "财政支出",
    category: "财政",
    description: "用公共支出托住订单、就业和短期增长。",
    variableEffects: { enterpriseOrders: 4, employmentLevel: 3, residentIncome: 2, debtPressure: 3, localFinance: -2 },
    metricEffects: { growth: 3, employment: 3, debtPressure: 3, stabilityIndex: 1 },
    suitable: ["需求不足", "就业压力大", "企业订单弱"],
    risks: ["地方债务高", "低效投资多"],
    sideEffects: ["财政压力上升", "低效投资风险增加"],
  },
  householdSubsidy: {
    key: "householdSubsidy",
    label: "居民补贴",
    category: "财政",
    description: "直接改善消费意愿和居民预期。",
    variableEffects: { consumptionIntent: 4, residentExpectation: 2, enterpriseOrders: 2, localFinance: -2 },
    metricEffects: { growth: 1, employment: 1, stabilityIndex: 1 },
    suitable: ["消费不足", "居民预期弱", "储蓄倾向高"],
    risks: ["财政压力高", "短期刺激依赖"],
    sideEffects: ["财政负担上升", "刺激效果可能回落"],
  },
  corporateTaxCut: {
    key: "corporateTaxCut",
    label: "企业减税",
    category: "财政",
    description: "改善企业利润，提振投资和招聘意愿。",
    variableEffects: { enterpriseProfit: 3, investmentIntent: 2, employmentLevel: 1, localFinance: -2 },
    metricEffects: { employment: 1 },
    suitable: ["企业利润弱", "民营投资不足", "就业压力上升"],
    risks: ["订单不足", "财政收入下降"],
    sideEffects: ["财政收入下降", "订单不足时扩张有限"],
  },
  creditRegulation: {
    key: "creditRegulation",
    label: "信贷监管",
    category: "监管",
    description: "控制高风险信贷，降低债务和坏账压力。",
    variableEffects: { creditExpansion: -3, badDebtRisk: -3, debtPressure: -2, investmentIntent: -1 },
    metricEffects: { growth: -1, debtPressure: -2, badDebtRisk: -3 },
    suitable: ["债务过高", "金融风险上升", "泡沫明显"],
    risks: ["需求不足", "融资困难"],
    sideEffects: ["短期投资受压", "部分企业融资变难"],
  },
  realEstateSupport: {
    key: "realEstateSupport",
    label: "房地产托底",
    category: "结构",
    description: "稳定房价、居民预期、地方财政和银行抵押品风险。",
    variableEffects: { housePriceIndex: 3, residentExpectation: 2, localFinance: 2, badDebtRisk: -2, debtPressure: 2 },
    metricEffects: { debtPressure: 2, badDebtRisk: -2, stabilityIndex: 1 },
    suitable: ["房地产下行", "财富缩水", "地方财政压力大", "银行风险上升"],
    risks: ["重新依赖房地产", "债务风险延后"],
    sideEffects: ["结构转型变慢", "债务风险可能后移"],
  },
  industrialUpgrade: {
    key: "industrialUpgrade",
    label: "产业升级",
    category: "结构",
    description: "提升长期效率，但短期见效慢。",
    variableEffects: { longTermEfficiency: 4, enterpriseProfit: 2, investmentIntent: 1, employmentLevel: -1, localFinance: -2 },
    metricEffects: { growth: -1, stabilityIndex: 1 },
    suitable: ["长期效率偏低", "旧增长模式失效", "产业结构升级"],
    risks: ["短期增长压力", "就业转换压力"],
    sideEffects: ["见效较慢", "传统行业就业转换压力上升"],
  },
};

export const eventDefinitions: EventDefinition[] = [
  {
    key: "realEstateDownturn",
    label: "房地产下行",
    description: "房价下跌引发财富缩水、地方财政走弱和银行风险上升。",
    transmission: ["房价下跌", "居民财富缩水", "消费意愿下降", "企业订单减少", "就业压力上升"],
    variableEffects: { housePriceIndex: -6, residentExpectation: -4, consumptionIntent: -3, localFinance: -4, badDebtRisk: 3 },
    metricEffects: { stabilityIndex: -3, badDebtRisk: 3 },
  },
  {
    key: "exportBoost",
    label: "外需增强",
    description: "出口订单改善带动企业利润、就业和短期增长。",
    transmission: ["外需增强", "企业订单增加", "利润改善", "就业稳定", "居民收入改善"],
    variableEffects: { externalDemand: 5, enterpriseOrders: 4, enterpriseProfit: 3, employmentLevel: 2 },
    metricEffects: { growth: 3, employment: 2 },
  },
  {
    key: "exportDrop",
    label: "外需下降",
    description: "外部需求走弱冲击订单、利润和就业。",
    transmission: ["外需下降", "企业订单减少", "利润走弱", "投资下降", "就业承压"],
    variableEffects: { externalDemand: -5, enterpriseOrders: -4, enterpriseProfit: -3, investmentIntent: -2, employmentLevel: -2 },
    metricEffects: { growth: -3, employment: -2, stabilityIndex: -2 },
  },
  {
    key: "financialRisk",
    label: "金融风险",
    description: "坏账暴露导致银行惜贷，信用链条变弱。",
    transmission: ["坏账上升", "银行惜贷", "企业融资困难", "投资下降", "就业下降"],
    variableEffects: { badDebtRisk: 6, creditExpansion: -4, investmentIntent: -3, enterpriseProfit: -2, employmentLevel: -2 },
    metricEffects: { badDebtRisk: 5, growth: -2, employment: -2, stabilityIndex: -4 },
  },
  {
    key: "techBreakthrough",
    label: "技术突破",
    description: "技术进步提高长期效率，但短期传导有限。",
    transmission: ["技术突破", "长期效率提升", "企业利润改善", "增长质量提高"],
    variableEffects: { longTermEfficiency: 6, enterpriseProfit: 2, investmentIntent: 2 },
    metricEffects: { growth: 2, stabilityIndex: 2 },
  },
];

export const statusInfo: Record<EconomyStatus, StatusInfo> = {
  健康扩张: {
    status: "健康扩张",
    mainContradiction: "系统较平衡",
    reason: "增长、就业、通胀、债务和坏账大体处于可控区间。",
    suggestion: "继续观察信用扩张和通胀变化，防止从平衡走向过热。",
  },
  需求不足: {
    status: "需求不足",
    mainContradiction: "居民消费弱，企业投资不足",
    reason: "消费意愿、企业订单和投资意愿偏弱，就业也承压。",
    suggestion: "优先修复消费和投资意愿，避免单纯依赖信贷刺激。",
  },
  经济过热: {
    status: "经济过热",
    mainContradiction: "需求过强，泡沫和通胀风险上升",
    reason: "增长、通胀、信贷和资产价格同步偏高。",
    suggestion: "需要给需求和信贷降温，同时观察就业和增长的回落幅度。",
  },
  债务驱动: {
    status: "债务驱动",
    mainContradiction: "增长依赖信贷，债务积累过快",
    reason: "增长尚可，但信贷扩张和债务压力明显偏高，利润支撑不足。",
    suggestion: "控制高风险信贷，避免增长质量继续恶化。",
  },
  金融收缩: {
    status: "金融收缩",
    mainContradiction: "银行惜贷，信用链条变弱",
    reason: "坏账风险上升、信贷扩张下降，企业融资和投资受到压制。",
    suggestion: "优先稳定银行和信用传导，再考虑刺激需求。",
  },
  滞胀: {
    status: "滞胀",
    mainContradiction: "通胀高但增长弱，政策两难",
    reason: "增长和就业偏弱，但价格压力仍高。",
    suggestion: "避免单向强刺激或强收紧，需要在稳定价格和托住就业之间平衡。",
  },
};

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export function quarterLabel(round: number) {
  const year = Math.floor((round - 1) / 4) + 1;
  const quarter = ((round - 1) % 4) + 1;
  return `第 ${year} 年 / 第 ${quarter} 季度`;
}

export function emptyDeltas<T extends string>(keys: readonly T[]): Partial<Record<T, number>> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Partial<Record<T, number>>;
}

export const variableKeys = Object.keys(variableLabels) as VariableKey[];
export const metricKeys = Object.keys(metricLabels) as MetricKey[];

export function addVariableEffects(target: EconomyVariables, effects: Partial<Record<VariableKey, number>>) {
  for (const key of variableKeys) {
    target[key] = round1(clamp(target[key] + (effects[key] ?? 0)));
  }
}

export function addMetricEffects(target: EconomyMetrics, effects: Partial<Record<MetricKey, number>>) {
  for (const key of metricKeys) {
    target[key] = round1(clamp(target[key] + (effects[key] ?? 0)));
  }
}
