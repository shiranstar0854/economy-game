export type VariableKey =
  | "residentIncome"
  | "consumptionIntent"
  | "savingsTendency"
  | "enterpriseOrders"
  | "enterpriseProfit"
  | "investmentIntent"
  | "employmentLevel"
  | "creditExpansion"
  | "debtPressure"
  | "badDebtRisk"
  | "housePriceIndex"
  | "localFinance"
  | "externalDemand"
  | "residentExpectation"
  | "longTermEfficiency";

export type MetricKey =
  | "growth"
  | "employment"
  | "inflationPressure"
  | "debtPressure"
  | "badDebtRisk"
  | "stabilityIndex";

export type EconomyStatus = "健康扩张" | "需求不足" | "经济过热" | "债务驱动" | "金融收缩" | "滞胀";

export type PolicyKey =
  | "rateCut"
  | "rateRaise"
  | "fiscalSpending"
  | "householdSubsidy"
  | "corporateTaxCut"
  | "creditRegulation"
  | "realEstateSupport"
  | "industrialUpgrade";

export type EventKey = "realEstateDownturn" | "exportBoost" | "exportDrop" | "financialRisk" | "techBreakthrough";

export type ScoreMap<T extends string> = Record<T, number>;
export type EconomyVariables = ScoreMap<VariableKey>;
export type EconomyMetrics = ScoreMap<MetricKey>;

export type PolicyDecision = {
  selectedPolicies: PolicyKey[];
};

export type PolicyDefinition = {
  key: PolicyKey;
  label: string;
  category: "货币" | "财政" | "监管" | "结构";
  description: string;
  variableEffects: Partial<Record<VariableKey, number>>;
  metricEffects?: Partial<Record<MetricKey, number>>;
  suitable: string[];
  risks: string[];
  sideEffects: string[];
};

export type EventDefinition = {
  key: EventKey;
  label: string;
  description: string;
  transmission: string[];
  variableEffects: Partial<Record<VariableKey, number>>;
  metricEffects?: Partial<Record<MetricKey, number>>;
};

export type StatusInfo = {
  status: EconomyStatus;
  mainContradiction: string;
  reason: string;
  suggestion: string;
};

export type EconomyState = {
  round: number;
  quarterLabel: string;
  variables: EconomyVariables;
  metrics: EconomyMetrics;
  status: EconomyStatus;
  mainContradiction: string;
  lastEvent: EventDefinition | null;
};

export type RoundResult = {
  title: string;
  selectedPolicies: PolicyKey[];
  event: EventDefinition | null;
  variableDeltas: Partial<Record<VariableKey, number>>;
  metricDeltas: Partial<Record<MetricKey, number>>;
  sideEffects: string[];
  feedback: string[];
  statusReason: string;
};

export type HistoryPoint = {
  round: number;
  quarterLabel: string;
  status: EconomyStatus;
  growth: number;
  employment: number;
  inflationPressure: number;
  debtPressure: number;
  badDebtRisk: number;
  stabilityIndex: number;
};
