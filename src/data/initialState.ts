import { enrichState, toHistoryPoint } from "../game/simulation";
import type { EconomyVariables, PolicyDecision, RoundResult } from "../game/types";

const initialVariables: EconomyVariables = {
  residentIncome: 58,
  consumptionIntent: 56,
  savingsTendency: 52,
  enterpriseOrders: 57,
  enterpriseProfit: 55,
  investmentIntent: 54,
  employmentLevel: 60,
  creditExpansion: 52,
  debtPressure: 45,
  badDebtRisk: 38,
  housePriceIndex: 55,
  localFinance: 54,
  externalDemand: 53,
  residentExpectation: 57,
  longTermEfficiency: 50,
};

export const initialDecision: PolicyDecision = {
  selectedPolicies: [],
};

export const initialState = enrichState(1, initialVariables);

export const initialResult: RoundResult = {
  title: "第 1 年 / 第 1 季度：初始观察",
  selectedPolicies: [],
  event: null,
  variableDeltas: {},
  metricDeltas: {},
  sideEffects: [],
  feedback: [
    "先观察 6 个结果指标，再判断状态、主要矛盾和政策杠杆。",
    "本沙盘是学习模拟器，所有数值都是 0-100 指数，不代表真实预测。",
    "请选择 2-3 个政策进入下一季度。",
  ],
  statusReason: "初始状态接近平衡，可用于观察不同政策路径如何传导。",
  crisis: {
    previousPhase: initialState.crisisPhase,
    phase: initialState.crisisPhase,
    systemicRiskDelta: 0,
    playerMove: "等待玩家落子",
    strongestThreat: initialState.currentThreat,
    nextThreat: initialState.nextThreat,
    warningRoundsLeft: initialState.warningRoundsLeft,
    checkResolved: false,
    collapseReason: null,
    collapseChain: [],
    opponentMoves: [],
  },
};

export const initialHistory = [toHistoryPoint(initialState)];
