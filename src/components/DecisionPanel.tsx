import { Check, Landmark, Play } from "lucide-react";
import { MAX_POLICIES, MIN_POLICIES, metricLabels, policyDefinitions, variableLabels } from "../game/policy";
import type { PolicyDecision, PolicyKey } from "../game/types";

type DecisionPanelProps = {
  decision: PolicyDecision;
  onTogglePolicy: (policy: PolicyKey) => void;
  onNextRound: () => void;
  canContinue: boolean;
  validSelection: boolean;
};

const policyOrder = Object.keys(policyDefinitions) as PolicyKey[];

function effectText(policy: PolicyKey) {
  const definition = policyDefinitions[policy];
  const strongEffects = Object.entries({ ...definition.variableEffects, ...definition.metricEffects })
    .filter(([, value]) => Math.abs(value ?? 0) >= 2)
    .slice(0, 3);
  return strongEffects.map(([key]) => variableLabels[key as keyof typeof variableLabels] ?? metricLabels[key as keyof typeof metricLabels]).join(" / ");
}

export function DecisionPanel({ decision, onTogglePolicy, onNextRound, canContinue, validSelection }: DecisionPanelProps) {
  const selected = decision.selectedPolicies;
  const selectionText =
    selected.length < MIN_POLICIES
      ? `还需选择 ${MIN_POLICIES - selected.length} 个政策`
      : selected.length > MAX_POLICIES
        ? "政策数量过多"
        : `已选择 ${selected.length} 个政策`;

  return (
    <section className="panel decision-panel" aria-labelledby="decision-title">
      <div className="panel-heading">
        <div>
          <h2 id="decision-title">政策杠杆</h2>
          <p>每回合选择 2-3 个政策</p>
        </div>
        <Landmark size={22} aria-hidden="true" />
      </div>

      <div className="selection-rule" data-valid={validSelection}>
        <strong>{selectionText}</strong>
        <span>选择过多会放大副作用，选择过少无法推进。</span>
      </div>

      <div className="policy-card-grid">
        {policyOrder.map((key) => {
          const policy = policyDefinitions[key];
          const isSelected = selected.includes(key);
          const locked = !isSelected && selected.length >= MAX_POLICIES;
          return (
            <button
              key={key}
              type="button"
              className={`policy-card ${isSelected ? "selected" : ""}`}
              onClick={() => onTogglePolicy(key)}
              disabled={locked}
              aria-pressed={isSelected}
            >
              <span className="policy-card-head">
                <strong>{policy.label}</strong>
                <small>{policy.category}</small>
              </span>
              <span>{policy.description}</span>
              <em>影响：{effectText(key)}</em>
              {isSelected && <Check size={18} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="policy-guidance">
        <h3>使用提醒</h3>
        <p>先根据当前状态找到主要矛盾，再选择政策。政策不是越多越好，副作用会在后续回合累积。</p>
      </div>

      <button className="next-button" type="button" onClick={onNextRound} disabled={!canContinue || !validSelection}>
        <Play size={18} fill="currentColor" aria-hidden="true" />
        {canContinue ? "进入下一季度" : "模拟结束"}
      </button>
    </section>
  );
}
