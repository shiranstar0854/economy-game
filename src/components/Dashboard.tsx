import { Activity, BarChart3, BriefcaseBusiness, CircleGauge, ShieldAlert, TrendingUp } from "lucide-react";
import { metricLabels, statusInfo, variableLabels } from "../game/policy";
import type { EconomyState, MetricKey, VariableKey } from "../game/types";
import { MetricCard } from "./MetricCard";

type DashboardProps = {
  state: EconomyState;
};

const metricOrder: Array<{ key: MetricKey; helper: string; icon: React.ReactNode }> = [
  { key: "growth", helper: "经济活跃度", icon: <TrendingUp size={18} /> },
  { key: "employment", helper: "就业与收入基础", icon: <BriefcaseBusiness size={18} /> },
  { key: "inflationPressure", helper: "价格压力", icon: <Activity size={18} /> },
  { key: "debtPressure", helper: "系统杠杆风险", icon: <BarChart3 size={18} /> },
  { key: "badDebtRisk", helper: "金融系统风险", icon: <ShieldAlert size={18} /> },
  { key: "stabilityIndex", helper: "综合运行状态", icon: <CircleGauge size={18} /> },
];

const variableOrder: VariableKey[] = [
  "residentIncome",
  "consumptionIntent",
  "enterpriseOrders",
  "investmentIntent",
  "creditExpansion",
  "debtPressure",
  "badDebtRisk",
  "housePriceIndex",
  "externalDemand",
  "residentExpectation",
];

function metricTone(key: MetricKey, value: number) {
  if (key === "stabilityIndex") return value >= 65 ? "good" : value < 45 ? "danger" : "warn";
  if (key === "growth" || key === "employment") return value >= 60 ? "good" : value < 45 ? "danger" : "neutral";
  return value > 70 ? "danger" : value > 55 ? "warn" : "good";
}

function statusTone(status: EconomyState["status"]) {
  if (status === "健康扩张") return "good";
  if (status === "经济过热" || status === "债务驱动") return "warn";
  return "danger";
}

export function Dashboard({ state }: DashboardProps) {
  const info = statusInfo[state.status];

  return (
    <section className="panel economy-panel" aria-labelledby="economy-title">
      <div className="panel-heading">
        <div>
          <h2 id="economy-title">当前经济指标</h2>
          <p>{state.quarterLabel}</p>
        </div>
        <span className={`risk-chip status-chip-${statusTone(state.status)}`}>{state.status}</span>
      </div>

      <div className="state-summary">
        <div>
          <span>主要矛盾</span>
          <strong>{state.mainContradiction}</strong>
        </div>
        <p>{info.reason}</p>
      </div>

      <div className="metric-grid">
        {metricOrder.map((item) => (
          <MetricCard
            key={item.key}
            label={metricLabels[item.key]}
            value={state.metrics[item.key].toFixed(1)}
            helper={item.helper}
            tone={metricTone(item.key, state.metrics[item.key])}
            icon={item.icon}
          />
        ))}
      </div>

      <div className="variable-list" aria-label="核心变量">
        <h3>核心变量</h3>
        {variableOrder.map((key) => (
          <div key={key} className="variable-row">
            <span>{variableLabels[key]}</span>
            <div className="variable-track" aria-hidden="true">
              <i style={{ width: `${state.variables[key]}%` }} />
            </div>
            <strong>{state.variables[key].toFixed(0)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
