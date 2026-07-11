import { AlertTriangle, ArrowRightLeft, CalendarClock, ReceiptText, ScrollText } from "lucide-react";
import { metricLabels, policyDefinitions, variableLabels } from "../game/policy";
import type { MetricKey, RoundResult, VariableKey } from "../game/types";

type ResultPanelProps = {
  result: RoundResult;
};

function formatDelta(value: number | undefined) {
  if (value === undefined) return "0";
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

function topDeltas<T extends string>(deltas: Partial<Record<T, number>>, limit = 8) {
  return Object.entries(deltas)
    .filter(([, value]) => typeof value === "number" && value !== 0)
    .sort((a, b) => Math.abs(b[1] as number) - Math.abs(a[1] as number))
    .slice(0, limit) as Array<[T, number]>;
}

export function ResultPanel({ result }: ResultPanelProps) {
  const selectedPolicies = result.selectedPolicies.map((key) => policyDefinitions[key]);
  const variableDeltas = topDeltas<VariableKey>(result.variableDeltas);
  const metricDeltas = topDeltas<MetricKey>(result.metricDeltas, 6);

  return (
    <section className="panel result-panel" aria-labelledby="result-title">
      <div className="panel-heading">
        <div>
          <h2 id="result-title">系统反馈</h2>
          <p>{result.title}</p>
        </div>
        <ScrollText size={22} aria-hidden="true" />
      </div>

      <div className="result-block">
        <div className="result-block-title">
          <ReceiptText size={18} aria-hidden="true" />
          <h3>本轮政策</h3>
        </div>
        {selectedPolicies.length > 0 ? (
          <div className="policy-chip-list">
            {selectedPolicies.map((policy) => (
              <span key={policy.key}>{policy.label}</span>
            ))}
          </div>
        ) : (
          <p className="muted-copy">尚未推进回合。请选择 2-3 个政策。</p>
        )}
      </div>

      {result.event && (
        <div className="event-box">
          <div className="result-block-title">
            <CalendarClock size={18} aria-hidden="true" />
            <h3>{result.event.label}</h3>
          </div>
          <p>{result.event.description}</p>
          <small>{result.event.transmission.join(" → ")}</small>
        </div>
      )}

      <div className="delta-strip" aria-label="结果指标增减值">
        {metricDeltas.length > 0 ? (
          metricDeltas.map(([key, value]) => (
            <div key={key}>
              <span>{metricLabels[key]}</span>
              <strong>{formatDelta(value)}</strong>
            </div>
          ))
        ) : (
          <div>
            <span>结果指标</span>
            <strong>等待选择</strong>
          </div>
        )}
      </div>

      <div className="result-block">
        <div className="result-block-title">
          <ArrowRightLeft size={18} aria-hidden="true" />
          <h3>变量传导</h3>
        </div>
        <div className="variable-delta-grid">
          {variableDeltas.length > 0 ? (
            variableDeltas.map(([key, value]) => (
              <div key={key}>
                <span>{variableLabels[key]}</span>
                <strong>{formatDelta(value)}</strong>
              </div>
            ))
          ) : (
            <p className="muted-copy">推进下一季度后显示变量变化。</p>
          )}
        </div>
      </div>

      <div className="result-block">
        <div className="result-block-title">
          <AlertTriangle size={18} aria-hidden="true" />
          <h3>副作用</h3>
        </div>
        {result.sideEffects.length > 0 ? (
          <ul className="side-effect-list">
            {result.sideEffects.map((effect) => (
              <li key={effect}>{effect}</li>
            ))}
          </ul>
        ) : (
          <p className="muted-copy">当前没有新的政策副作用。</p>
        )}
      </div>

      <div className="summary-box">
        <h3>反馈修正</h3>
        <p>{result.statusReason}</p>
        <ul>
          {result.feedback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
