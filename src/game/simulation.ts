import {
  addMetricEffects,
  addVariableEffects,
  clamp,
  crisisPhaseLabels,
  eventDefinitions,
  MAX_ROUNDS,
  metricKeys,
  policyDefinitions,
  quarterLabel,
  round1,
  statusInfo,
  variableKeys,
} from "./policy";
import type {
  CrisisPhase,
  CrisisSettlement,
  EconomyMetrics,
  EconomyState,
  EconomyStatus,
  EconomyVariables,
  EventDefinition,
  HistoryPoint,
  MetricKey,
  OpponentMove,
  PolicyDecision,
  RoundResult,
  VariableKey,
} from "./types";

type CrisisData = Pick<
  EconomyState,
  | "systemicRisk"
  | "crisisPhase"
  | "currentThreat"
  | "nextThreat"
  | "opponentMoves"
  | "warningRoundsLeft"
  | "cascadeRounds"
  | "collapseReason"
  | "collapseChain"
>;

type PolicyRiskProfile = {
  adjustment: number;
  playerMove: string;
};

function cloneVariables(variables: EconomyVariables): EconomyVariables {
  return { ...variables };
}

function metricBase(variables: EconomyVariables): EconomyMetrics {
  const growth = clamp(
    24 +
      variables.enterpriseOrders * 0.18 +
      variables.investmentIntent * 0.18 +
      variables.employmentLevel * 0.14 +
      variables.creditExpansion * 0.1 +
      variables.externalDemand * 0.1 +
      variables.longTermEfficiency * 0.12 -
      variables.debtPressure * 0.08 -
      variables.badDebtRisk * 0.08,
  );
  const employment = clamp(variables.employmentLevel);
  const inflationPressure = clamp(
    18 +
      Math.max(0, growth - 55) * 0.36 +
      Math.max(0, variables.creditExpansion - 55) * 0.18 +
      Math.max(0, variables.housePriceIndex - 55) * 0.18 -
      Math.max(0, 45 - variables.enterpriseOrders) * 0.12,
  );
  const debtPressure = clamp(variables.debtPressure);
  const badDebtRisk = clamp(variables.badDebtRisk);
  const stabilityIndex = clamp(
    growth * 0.22 +
      employment * 0.22 +
      variables.residentExpectation * 0.14 +
      variables.longTermEfficiency * 0.1 +
      (100 - inflationPressure) * 0.1 +
      (100 - debtPressure) * 0.11 +
      (100 - badDebtRisk) * 0.11,
  );

  return {
    growth: round1(growth),
    employment: round1(employment),
    inflationPressure: round1(inflationPressure),
    debtPressure: round1(debtPressure),
    badDebtRisk: round1(badDebtRisk),
    stabilityIndex: round1(stabilityIndex),
  };
}

function identifyStatus(variables: EconomyVariables, metrics: EconomyMetrics): EconomyStatus {
  if (metrics.growth < 47 && metrics.employment < 52 && metrics.inflationPressure > 58) return "滞胀";
  if (metrics.badDebtRisk > 63 && variables.creditExpansion < 48 && variables.investmentIntent < 52) return "金融收缩";
  if (metrics.growth >= 50 && variables.creditExpansion > 66 && metrics.debtPressure > 66 && (variables.enterpriseProfit < 56 || metrics.badDebtRisk > 54)) {
    return "债务驱动";
  }
  if (metrics.growth > 66 && metrics.inflationPressure > 60 && variables.creditExpansion > 62 && variables.housePriceIndex > 60) return "经济过热";
  if (
    metrics.growth < 52 &&
    variables.consumptionIntent < 52 &&
    variables.enterpriseOrders < 52 &&
    variables.investmentIntent < 52 &&
    metrics.inflationPressure < 56
  ) {
    return "需求不足";
  }
  return "健康扩张";
}

function systemicRisk(variables: EconomyVariables, metrics: EconomyMetrics, previousRisk = 0, policyAdjustment = 0) {
  const base =
    variables.debtPressure * 0.28 +
    variables.badDebtRisk * 0.4 +
    Math.max(0, variables.creditExpansion - 55) * 0.42 +
    Math.max(0, variables.housePriceIndex - 65) * 0.25 +
    Math.max(0, 55 - variables.localFinance) * 0.3 +
    Math.max(0, 58 - variables.residentExpectation) * 0.3 +
    Math.max(0, 60 - metrics.stabilityIndex) * 0.45;
  const persistence = Math.max(0, previousRisk - base) * 0.3;
  return round1(clamp(base + persistence + policyAdjustment));
}

function normalCrisis(variables: EconomyVariables, metrics: EconomyMetrics): CrisisData {
  return {
    systemicRisk: systemicRisk(variables, metrics),
    crisisPhase: "normal",
    currentThreat: null,
    nextThreat: "债务、坏账与预期恶化累计到 70 将进入预警。",
    opponentMoves: [],
    warningRoundsLeft: null,
    cascadeRounds: 0,
    collapseReason: null,
    collapseChain: [],
  };
}

export function enrichState(
  round: number,
  variables: EconomyVariables,
  metricImpulse: Partial<Record<MetricKey, number>> = {},
  event: EventDefinition | null = null,
  crisis: CrisisData | null = null,
): EconomyState {
  const metrics = metricBase(variables);
  addMetricEffects(metrics, metricImpulse);
  const status = identifyStatus(variables, metrics);
  const info = statusInfo[status];
  return {
    round,
    quarterLabel: quarterLabel(round),
    variables,
    metrics,
    status,
    mainContradiction: info.mainContradiction,
    lastEvent: event,
    ...(crisis ?? normalCrisis(variables, metrics)),
  };
}

function applyTransmission(previous: EconomyState, next: EconomyVariables) {
  const before = previous.variables;
  const consumptionDelta = next.consumptionIntent - before.consumptionIntent;
  const externalDelta = next.externalDemand - before.externalDemand;
  next.enterpriseOrders = round1(clamp(next.enterpriseOrders + consumptionDelta * 0.32 + externalDelta * 0.42));

  const orderDelta = next.enterpriseOrders - before.enterpriseOrders;
  const efficiencyDelta = next.longTermEfficiency - before.longTermEfficiency;
  next.enterpriseProfit = round1(clamp(next.enterpriseProfit + orderDelta * 0.24 + efficiencyDelta * 0.16 - Math.max(0, next.debtPressure - 65) * 0.04));

  const profitDelta = next.enterpriseProfit - before.enterpriseProfit;
  const creditDelta = next.creditExpansion - before.creditExpansion;
  const debtDelta = next.debtPressure - before.debtPressure;
  next.investmentIntent = round1(clamp(next.investmentIntent + profitDelta * 0.24 + creditDelta * 0.22 - Math.max(0, debtDelta) * 0.08));

  const investmentDelta = next.investmentIntent - before.investmentIntent;
  next.employmentLevel = round1(clamp(next.employmentLevel + orderDelta * 0.12 + investmentDelta * 0.12));

  const employmentDelta = next.employmentLevel - before.employmentLevel;
  next.residentIncome = round1(clamp(next.residentIncome + employmentDelta * 0.26));
  next.residentExpectation = round1(clamp(next.residentExpectation + employmentDelta * 0.18 - Math.max(0, debtDelta) * 0.08 - Math.max(0, next.badDebtRisk - before.badDebtRisk) * 0.08));
  next.consumptionIntent = round1(clamp(next.consumptionIntent + (next.residentExpectation - before.residentExpectation) * 0.12 + (next.residentIncome - before.residentIncome) * 0.1));
  next.savingsTendency = round1(clamp(next.savingsTendency - (next.consumptionIntent - before.consumptionIntent) * 0.12 + Math.max(0, 50 - next.residentExpectation) * 0.04));
}

function policyRiskProfile(previous: EconomyState, decision: PolicyDecision): PolicyRiskProfile {
  const selected = new Set(decision.selectedPolicies);
  let defensive = 0;
  let reckless = 0;

  if (selected.has("creditRegulation")) defensive += previous.metrics.debtPressure > 55 || previous.metrics.badDebtRisk > 50 ? 4 : 1;
  if (selected.has("rateRaise")) defensive += previous.metrics.debtPressure > 60 || previous.metrics.inflationPressure > 60 ? 3 : 0;
  if (selected.has("industrialUpgrade")) defensive += 2;
  if (selected.has("realEstateSupport") && (previous.variables.housePriceIndex < 52 || previous.metrics.badDebtRisk > 58)) defensive += 2;
  if (selected.has("householdSubsidy") && previous.variables.consumptionIntent < 50 && previous.metrics.debtPressure < 70) defensive += 2;
  if (selected.has("fiscalSpending") && previous.variables.enterpriseOrders < 50 && previous.metrics.debtPressure < 70) defensive += 2;

  if (previous.metrics.debtPressure > 60 && selected.has("rateCut")) reckless += 3;
  if (previous.metrics.debtPressure > 65 && selected.has("fiscalSpending")) reckless += 2;
  if (previous.metrics.debtPressure > 65 && previous.variables.creditExpansion > 60 && selected.has("realEstateSupport")) reckless += 3;
  if (previous.variables.localFinance < 45 && (selected.has("fiscalSpending") || selected.has("householdSubsidy") || selected.has("corporateTaxCut"))) reckless += 1;

  const adjustment = round1(reckless * 1.7 - defensive * 1.8);
  const playerMove = defensive > reckless ? "针对风险的防守落子" : reckless > defensive ? "放大脆弱性的进攻落子" : "中性政策落子";
  return { adjustment, playerMove };
}

function triggeredEvent(variables: EconomyVariables): EventDefinition | null {
  const byKey = (key: EventDefinition["key"]) => eventDefinitions.find((event) => event.key === key) ?? null;
  if (variables.badDebtRisk >= 58 || (variables.debtPressure >= 72 && variables.creditExpansion >= 70)) return byKey("financialRisk");
  if (variables.housePriceIndex <= 48 || (variables.housePriceIndex >= 75 && variables.debtPressure >= 75)) return byKey("realEstateDownturn");
  if (variables.externalDemand <= 42 && variables.enterpriseOrders <= 50) return byKey("exportDrop");
  if (variables.externalDemand >= 68 && variables.enterpriseOrders >= 60) return byKey("exportBoost");
  if (variables.longTermEfficiency >= 78 && variables.enterpriseProfit >= 60) return byKey("techBreakthrough");
  return null;
}

function applyOpponentMoves(variables: EconomyVariables, risk: number): OpponentMove[] {
  const moves: OpponentMove[] = [];
  const severity = risk >= 90 ? "critical" : risk >= 70 ? "pressure" : "watch";
  const strength = risk >= 90 ? 7 : risk >= 80 ? 5 : risk >= 60 ? 3 : 2;

  if (risk >= 58 || variables.badDebtRisk >= 50) {
    addVariableEffects(variables, { creditExpansion: -strength, investmentIntent: -Math.max(2, strength - 1), badDebtRisk: Math.max(1, strength - 2) });
    moves.push({ actor: "bank", label: "银行惜贷", severity, transmission: ["坏账暴露", "银行惜贷", "企业融资收缩", "投资走弱"] });
  }
  if (risk >= 62 || variables.residentExpectation < 52) {
    addVariableEffects(variables, { savingsTendency: strength, consumptionIntent: -Math.max(2, strength - 1), residentExpectation: -2 });
    moves.push({ actor: "household", label: "居民去杠杆", severity, transmission: ["预期转弱", "居民增储", "消费收缩", "订单下降"] });
  }
  if (risk >= 68 || variables.enterpriseProfit < 50) {
    addVariableEffects(variables, { investmentIntent: -strength, employmentLevel: -Math.max(1, strength - 2), enterpriseOrders: -1 });
    moves.push({ actor: "enterprise", label: "企业削减投资", severity, transmission: ["现金流承压", "削减投资", "就业回落", "居民收入走弱"] });
  }
  if (risk >= 72 || (variables.debtPressure >= 70 && variables.housePriceIndex >= 70)) {
    addVariableEffects(variables, { housePriceIndex: -strength, residentExpectation: -Math.max(2, strength - 2), localFinance: -Math.max(1, strength - 3) });
    moves.push({ actor: "market", label: "市场抛售", severity, transmission: ["资产价格下跌", "抵押品缩水", "坏账上升", "银行进一步收缩"] });
  }
  if (risk >= 82 || variables.localFinance < 45) {
    addVariableEffects(variables, { localFinance: -Math.max(2, strength - 1), enterpriseOrders: -1, employmentLevel: -1 });
    moves.push({ actor: "localFinance", label: "地方财政承压", severity, transmission: ["财政收入走弱", "公共支出受限", "订单与就业回落"] });
  }
  return moves;
}

function phaseThreat(phase: CrisisPhase, risk: number, opponentMoves: OpponentMove[]) {
  if (phase === "collapsed") return "系统已崩盘，传导链不可逆。";
  if (opponentMoves.length > 0) return opponentMoves[opponentMoves.length - 1].label;
  if (phase === "warning") return "债务和坏账共同抬升";
  if (phase === "liquidity") return "流动性紧张";
  if (phase === "cascade") return "连锁抛售";
  return risk >= 60 ? "资产与信用脆弱性上升" : null;
}

function nextThreat(phase: CrisisPhase, risk: number) {
  if (phase === "collapsed") return null;
  if (phase === "cascade") return "下一轮若仍高于 90，将形成将死并提前终局。";
  if (phase === "liquidity") return "下一轮未把风险压回 80 以下，将进入连锁抛售。";
  if (phase === "warning") return "两回合内未把风险压回 70 以下，将转为流动性紧张。";
  return risk >= 60 ? "风险再升至 70 将进入预警。" : "维持稳健组合，避免累积信用与资产泡沫。";
}

function resolveCrisis(
  previous: EconomyState,
  variables: EconomyVariables,
  metrics: EconomyMetrics,
  profile: PolicyRiskProfile,
  opponentMoves: OpponentMove[],
): CrisisData {
  const risk = systemicRisk(variables, metrics, previous.systemicRisk, profile.adjustment);
  const repeatedCascade = previous.crisisPhase === "cascade" && risk >= 90;
  const stabilityCollapse = metrics.stabilityIndex < 25;
  const collapseReason = stabilityCollapse
    ? "稳定指数跌破 25，实体、信用和预期同时失去缓冲。"
    : repeatedCascade
      ? "连续两轮未解除连锁抛售，信用与资产价格形成自我强化的崩盘链。"
      : null;
  const phase: CrisisPhase = collapseReason ? "collapsed" : risk >= 90 ? "cascade" : risk >= 80 ? "liquidity" : risk >= 70 ? "warning" : "normal";
  const warningRoundsLeft = phase === "warning"
    ? previous.crisisPhase === "warning" ? Math.max((previous.warningRoundsLeft ?? 2) - 1, 0) : 2
    : phase === "liquidity" || phase === "cascade" ? 1 : phase === "collapsed" ? 0 : null;
  const collapseChain = phase === "collapsed"
    ? opponentMoves.flatMap((move) => move.transmission).slice(0, 8)
    : [];

  return {
    systemicRisk: risk,
    crisisPhase: phase,
    currentThreat: phaseThreat(phase, risk, opponentMoves),
    nextThreat: nextThreat(phase, risk),
    opponentMoves,
    warningRoundsLeft,
    cascadeRounds: phase === "cascade" ? previous.crisisPhase === "cascade" ? previous.cascadeRounds + 1 : 1 : 0,
    collapseReason,
    collapseChain,
  };
}

function diffMap<T extends string>(previous: Record<T, number>, next: Record<T, number>, keys: readonly T[]) {
  const deltas: Partial<Record<T, number>> = {};
  for (const key of keys) {
    const delta = round1(next[key] - previous[key]);
    if (delta !== 0) deltas[key] = delta;
  }
  return deltas;
}

function buildFeedback(previous: EconomyState, next: EconomyState, decision: PolicyDecision, event: EventDefinition | null) {
  const policies = decision.selectedPolicies.map((key) => policyDefinitions[key]);
  const feedback: string[] = [];
  feedback.push(`玩家落子：${policies.map((policy) => policy.label).join("、")}；经济状态从“${previous.status}”变为“${next.status}”。`);
  feedback.push(`系统性风险 ${previous.systemicRisk.toFixed(1)} → ${next.systemicRisk.toFixed(1)}，危机阶段为“${crisisPhaseLabels[next.crisisPhase]}”。`);
  if (event) feedback.push(`条件触发外部事件“${event.label}”：${event.transmission.join(" → ")}。`);
  if (next.currentThreat) feedback.push(`最强反制：${next.currentThreat}。${next.nextThreat ?? ""}`);
  if (next.crisisPhase === "normal" && previous.crisisPhase !== "normal") feedback.push("本轮已解除将军，风险重新回到可控区间。");
  if (next.crisisPhase === "collapsed") feedback.push(`终局：${next.collapseReason}`);
  if (feedback.length < 4) feedback.push(`主要矛盾：${next.mainContradiction}。${statusInfo[next.status].suggestion}`);
  return feedback;
}

function emptyCrisisSettlement(state: EconomyState, decision: PolicyDecision): CrisisSettlement {
  return {
    previousPhase: state.crisisPhase,
    phase: state.crisisPhase,
    systemicRiskDelta: 0,
    playerMove: "模拟已结束",
    strongestThreat: state.currentThreat,
    nextThreat: state.nextThreat,
    warningRoundsLeft: state.warningRoundsLeft,
    checkResolved: false,
    collapseReason: state.collapseReason,
    collapseChain: state.collapseChain,
    opponentMoves: [],
  };
}

export function simulateRound(previous: EconomyState, decision: PolicyDecision): { state: EconomyState; result: RoundResult } {
  if (previous.round >= MAX_ROUNDS || previous.crisisPhase === "collapsed") {
    return {
      state: previous,
      result: {
        title: previous.crisisPhase === "collapsed" ? "系统崩盘，模拟终局" : "模拟已结束",
        selectedPolicies: decision.selectedPolicies,
        event: previous.lastEvent,
        variableDeltas: {},
        metricDeltas: {},
        sideEffects: [],
        feedback: [previous.crisisPhase === "collapsed" ? "崩盘后不能继续推进，请重置后复盘关键决策。" : "已完成 12 个季度模拟，可以重置后尝试另一组政策路径。"],
        statusReason: previous.collapseReason ?? statusInfo[previous.status].reason,
        crisis: emptyCrisisSettlement(previous, decision),
      },
    };
  }

  const nextRound = previous.round + 1;
  const variables = cloneVariables(previous.variables);
  const metricImpulse: Partial<Record<MetricKey, number>> = {};
  const sideEffects = new Set<string>();
  const profile = policyRiskProfile(previous, decision);

  for (const key of decision.selectedPolicies) {
    const policy = policyDefinitions[key];
    addVariableEffects(variables, policy.variableEffects);
    for (const metricKey of metricKeys) {
      metricImpulse[metricKey] = round1((metricImpulse[metricKey] ?? 0) + (policy.metricEffects?.[metricKey] ?? 0));
    }
    policy.sideEffects.forEach((effect) => sideEffects.add(effect));
  }

  const event = triggeredEvent(variables);
  if (event) {
    addVariableEffects(variables, event.variableEffects);
    for (const metricKey of metricKeys) {
      metricImpulse[metricKey] = round1((metricImpulse[metricKey] ?? 0) + (event.metricEffects?.[metricKey] ?? 0));
    }
  }

  applyTransmission(previous, variables);
  const preliminaryMetrics = metricBase(variables);
  addMetricEffects(preliminaryMetrics, metricImpulse);
  const preliminaryRisk = systemicRisk(variables, preliminaryMetrics, previous.systemicRisk, profile.adjustment);
  const opponentMoves = applyOpponentMoves(variables, preliminaryRisk);
  applyTransmission(previous, variables);

  const finalMetrics = metricBase(variables);
  addMetricEffects(finalMetrics, metricImpulse);
  const crisis = resolveCrisis(previous, variables, finalMetrics, profile, opponentMoves);
  const state = enrichState(nextRound, variables, metricImpulse, event, crisis);
  const feedback = buildFeedback(previous, state, decision, event);
  const crisisSettlement: CrisisSettlement = {
    previousPhase: previous.crisisPhase,
    phase: state.crisisPhase,
    systemicRiskDelta: round1(state.systemicRisk - previous.systemicRisk),
    playerMove: profile.playerMove,
    strongestThreat: state.currentThreat,
    nextThreat: state.nextThreat,
    warningRoundsLeft: state.warningRoundsLeft,
    checkResolved: previous.crisisPhase !== "normal" && state.crisisPhase === "normal",
    collapseReason: state.collapseReason,
    collapseChain: state.collapseChain,
    opponentMoves,
  };

  return {
    state,
    result: {
      title: `${state.quarterLabel}：${state.status}`,
      selectedPolicies: decision.selectedPolicies,
      event,
      variableDeltas: diffMap(previous.variables, state.variables, variableKeys),
      metricDeltas: diffMap(previous.metrics, state.metrics, metricKeys),
      sideEffects: Array.from(sideEffects),
      feedback,
      statusReason: state.collapseReason ?? statusInfo[state.status].reason,
      crisis: crisisSettlement,
    },
  };
}

export function toHistoryPoint(state: EconomyState): HistoryPoint {
  return {
    round: state.round,
    quarterLabel: state.quarterLabel,
    status: state.status,
    growth: state.metrics.growth,
    employment: state.metrics.employment,
    inflationPressure: state.metrics.inflationPressure,
    debtPressure: state.metrics.debtPressure,
    badDebtRisk: state.metrics.badDebtRisk,
    stabilityIndex: state.metrics.stabilityIndex,
    systemicRisk: state.systemicRisk,
    crisisPhase: state.crisisPhase,
  };
}
