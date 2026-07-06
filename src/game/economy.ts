import { clamp, round1 } from "./policy";
import type { EconomyState } from "./types";

export type MacroState = {
  gdpGrowth: number;
  inflation: number;
  unemployment: number;
};

export type HouseholdState = {
  confidence: number;
  householdIncome: number;
  householdDebt: number;
  householdConsumption: number;
  householdSavings: number;
};

export function calculateMacro(
  previous: EconomyState,
  creditGrowth: number,
  liquidityPressure: number,
  demandPressure: number,
): MacroState {
  const overheating = Math.max(0, creditGrowth - 7) + Math.max(0, liquidityPressure / 3);
  const gdpGrowth = clamp(previous.gdpGrowth + creditGrowth * 0.13 + demandPressure * 0.16 - previous.badDebtRate * 0.08, -3, 9);
  const inflation = clamp(previous.inflation + overheating * 0.08 + liquidityPressure * 0.03 - previous.baseRate * 0.015, -1, 9);
  const unemployment = clamp(previous.unemployment - gdpGrowth * 0.12 + previous.corporateDefaultRisk * 0.05, 2.5, 14);

  return {
    gdpGrowth: round1(gdpGrowth),
    inflation: round1(inflation),
    unemployment: round1(unemployment),
  };
}

export function calculateHousehold(previous: EconomyState, macro: MacroState, creditGrowth: number): HouseholdState {
  const { gdpGrowth, inflation, unemployment } = macro;
  const confidence = clamp(previous.confidence + gdpGrowth * 0.7 - inflation * 0.55 - unemployment * 0.25, 20, 90);
  const householdIncome = clamp(previous.householdIncome + gdpGrowth * 0.45 - unemployment * 0.12, 75, 145);
  const householdDebt = clamp(previous.householdDebt + Math.max(0, creditGrowth) * 0.28 - previous.baseRate * 0.08, 20, 95);
  const householdConsumption = clamp(
    previous.householdConsumption + confidence * 0.035 + householdIncome * 0.025 - householdDebt * 0.035 - inflation * 0.12,
    45,
    105,
  );

  return {
    confidence: round1(confidence),
    householdIncome: round1(householdIncome),
    householdDebt: round1(householdDebt),
    householdConsumption: round1(householdConsumption),
    householdSavings: round1(clamp(householdIncome - householdConsumption * 0.55, 15, 70)),
  };
}

export function calculateEconomy(
  previous: EconomyState,
  creditGrowth: number,
  liquidityPressure: number,
  demandPressure: number,
) {
  const macro = calculateMacro(previous, creditGrowth, liquidityPressure, demandPressure);
  const household = calculateHousehold(previous, macro, creditGrowth);

  return {
    ...macro,
    ...household,
  };
}
