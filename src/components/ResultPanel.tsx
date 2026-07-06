import { Building2, CircleDollarSign, Landmark, LineChart, ScrollText } from "lucide-react";
import type { RoundResult } from "../game/types";

type ResultPanelProps = {
  result: RoundResult;
};

const items = [
  { key: "financing", label: "企业融资变化", icon: Building2 },
  { key: "consumption", label: "居民消费变化", icon: CircleDollarSign },
  { key: "bankingRisk", label: "银行风险变化", icon: Landmark },
  { key: "market", label: "市场价格变化", icon: LineChart },
] as const;

const deltaItems: Array<{ key: keyof RoundResult["deltas"]; label: string; unit: string }> = [
  { key: "gdpGrowth", label: "GDP", unit: "pct" },
  { key: "inflation", label: "通胀", unit: "pct" },
  { key: "unemployment", label: "失业", unit: "pct" },
  { key: "badDebtRate", label: "坏账", unit: "pct" },
  { key: "stockIndex", label: "股票", unit: "点" },
];

function formatDelta(value: number | undefined, unit: string) {
  if (value === undefined) return "0";
  const sign = value > 0 ? "+" : "";
  if (unit === "pct") return `${sign}${value.toFixed(1)}pct`;
  return `${sign}${Math.round(value)}${unit}`;
}

export function ResultPanel({ result }: ResultPanelProps) {
  return (
    <section className="panel result-panel" aria-labelledby="result-title">
      <div className="panel-heading">
        <div>
          <h2 id="result-title">本轮结果</h2>
          <p>{result.title}</p>
        </div>
        <ScrollText size={22} aria-hidden="true" />
      </div>

      <div className="result-list">
        {items.map(({ key, label, icon: Icon }) => (
          <article key={key} className="result-item">
            <Icon size={18} aria-hidden="true" />
            <div>
              <h3>{label}</h3>
              <p>{result[key]}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="delta-strip" aria-label="关键指标增减值">
        {deltaItems.map((item) => (
          <div key={item.key}>
            <span>{item.label}</span>
            <strong>{formatDelta(result.deltas[item.key], item.unit)}</strong>
          </div>
        ))}
      </div>

      <div className="department-flow" aria-label="五部门传导结果">
        {result.departments.map((department) => (
          <article key={department.key} className={`department-flow-item status-${department.status}`}>
            <div className="department-flow-head">
              <h3>{department.name}</h3>
              <span>{department.status}</span>
            </div>
            <div className="department-metrics">
              {department.metrics.map((metric) => (
                <small key={metric}>{metric}</small>
              ))}
            </div>
            <p>{department.explanation}</p>
          </article>
        ))}
      </div>

      <div className="summary-box">
        <h3>系统总结</h3>
        <p>{result.summary}</p>
      </div>
    </section>
  );
}
