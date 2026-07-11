import {
  addMetricEffects,
  addVariableEffects,
  clamp,
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
  EconomyMetrics,
  EconomyState,
  EconomyStatus,
  EconomyVariables,
  EventDefinition,
  HistoryPoint,
  MetricKey,
  PolicyDecision,
  RoundResult,
  VariableKey,
} from "./types";

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

export function enrichState(round: number, variables: EconomyVariables, metricImpulse: Partial<Record<MetricKey, number>> = {}, event: EventDefinition | null = null): EconomyState {
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
  };
}

function triggeredEvent(nextRound: number): EventDefinition | null {
  const triggerRounds = [3, 6, 9, 12];
  const index = triggerRounds.indexOf(nextRound);
  if (index < 0) return null;
  return eventDefinitions[index % eventDefinitions.length];
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
  feedback.push(`本轮选择了 ${policies.map((policy) => policy.label).join("、")}，系统从“${previous.status}”变为“${next.status}”。`);
  feedback.push(`主要矛盾：${next.mainContradiction}。${statusInfo[next.status].suggestion}`);
  if (event) feedback.push(`外部事件“${event.label}”触发：${event.transmission.join(" → ")}。`);

  if (next.metrics.debtPressure > previous.metrics.debtPressure + 2) feedback.push("债务压力上升，后续要观察是否进入债务驱动增长。");
  if (next.metrics.badDebtRisk > previous.metrics.badDebtRisk + 2) feedback.push("坏账风险上升，信用链条可能开始变弱。");
  if (next.metrics.growth > previous.metrics.growth + 2 && next.metrics.inflationPressure > previous.metrics.inflationPressure + 1) {
    feedback.push("增长改善的同时价格压力抬头，说明刺激已经产生副作用。");
  }
  if (next.metrics.stabilityIndex < previous.metrics.stabilityIndex - 3) feedback.push("稳定指数下降，本轮政策组合或外部冲击带来了新的失衡。");
  if (feedback.length < 4) feedback.push("当前变化仍在可观察区间，下一轮重点看副作用是否继续累积。");

  return feedback;
}

export function simulateRound(previous: EconomyState, decision: PolicyDecision): { state: EconomyState; result: RoundResult } {
  if (previous.round >= MAX_ROUNDS) {
    return {
      state: previous,
      result: {
        title: "模拟已结束",
        selectedPolicies: decision.selectedPolicies,
        event: previous.lastEvent,
        variableDeltas: {},
        metricDeltas: {},
        sideEffects: [],
        feedback: ["已完成 12 个季度模拟，可以重置后尝试另一组政策路径。"],
        statusReason: statusInfo[previous.status].reason,
      },
    };
  }

  const nextRound = previous.round + 1;
  const variables = cloneVariables(previous.variables);
  const metricImpulse: Partial<Record<MetricKey, number>> = {};
  const sideEffects = new Set<string>();

  for (const key of decision.selectedPolicies) {
    const policy = policyDefinitions[key];
    addVariableEffects(variables, policy.variableEffects);
    for (const metricKey of metricKeys) {
      metricImpulse[metricKey] = round1((metricImpulse[metricKey] ?? 0) + (policy.metricEffects?.[metricKey] ?? 0));
    }
    policy.sideEffects.forEach((effect) => sideEffects.add(effect));
  }

  const event = triggeredEvent(nextRound);
  if (event) {
    addVariableEffects(variables, event.variableEffects);
    for (const metricKey of metricKeys) {
      metricImpulse[metricKey] = round1((metricImpulse[metricKey] ?? 0) + (event.metricEffects?.[metricKey] ?? 0));
    }
  }

  applyTransmission(previous, variables);
  const state = enrichState(nextRound, variables, metricImpulse, event);
  const feedback = buildFeedback(previous, state, decision, event);

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
      statusReason: statusInfo[state.status].reason,
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
  };
}
