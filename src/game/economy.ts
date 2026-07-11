import { metricLabels } from "./policy";
import type { EconomyState, MetricKey } from "./types";

const metricOrder: MetricKey[] = ["growth", "employment", "inflationPressure", "debtPressure", "badDebtRisk", "stabilityIndex"];

export function summarizeMetrics(state: EconomyState) {
  return metricOrder.map((key) => ({
    key,
    label: metricLabels[key],
    value: state.metrics[key],
  }));
}
