import { ArrowDown, ArrowRight, ArrowUp, Landmark, Play } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { lendingImpact, liquidityImpact, rateImpact } from "../game/policy";
import type {
  DepartmentResult,
  LendingDecision,
  LiquidityDecision,
  PolicyDecision,
  RateDecision,
} from "../game/types";

type DecisionPanelProps = {
  decision: PolicyDecision;
  onChange: Dispatch<SetStateAction<PolicyDecision>>;
  onNextRound: () => void;
  canContinue: boolean;
  departmentPreview: DepartmentResult[];
};

type Option<T extends string> = {
  value: T;
  label: string;
  note: string;
};

const rateOptions: Option<RateDecision>[] = [
  { value: "cut", label: "降息", note: "刺激借贷" },
  { value: "hold", label: "不变", note: "维持观察" },
  { value: "raise", label: "加息", note: "压制通胀" },
];

const lendingOptions: Option<LendingDecision>[] = [
  { value: "loose", label: "宽松", note: "信用扩张" },
  { value: "normal", label: "正常", note: "稳健放贷" },
  { value: "strict", label: "严格", note: "控制坏账" },
];

const liquidityOptions: Option<LiquidityDecision>[] = [
  { value: "inject", label: "投放", note: "提振市场" },
  { value: "hold", label: "不变", note: "保持中性" },
  { value: "tighten", label: "收紧", note: "降温去杠杆" },
];

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onSelect: (value: T) => void;
}) {
  return (
    <div className="decision-group">
      <h3>{label}</h3>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            className={value === option.value ? "selected" : ""}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onSelect(option.value)}
          >
            <span>{option.label}</span>
            <small>{option.note}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DecisionPanel({
  decision,
  onChange,
  onNextRound,
  canContinue,
  departmentPreview,
}: DecisionPanelProps) {
  const rate = rateImpact[decision.rate];
  const lending = lendingImpact[decision.lending];
  const liquidity = liquidityImpact[decision.liquidity];

  return (
    <section className="panel decision-panel" aria-labelledby="decision-title">
      <div className="panel-heading">
        <div>
          <h2 id="decision-title">玩家决策区</h2>
          <p>选择本轮政策组合</p>
        </div>
        <Landmark size={22} aria-hidden="true" />
      </div>

      <SegmentedControl
        label="基准利率"
        value={decision.rate}
        options={rateOptions}
        onSelect={(rateValue) => onChange((current) => ({ ...current, rate: rateValue }))}
      />
      <SegmentedControl
        label="银行放贷标准"
        value={decision.lending}
        options={lendingOptions}
        onSelect={(lendingValue) => onChange((current) => ({ ...current, lending: lendingValue }))}
      />
      <SegmentedControl
        label="流动性"
        value={decision.liquidity}
        options={liquidityOptions}
        onSelect={(liquidityValue) => onChange((current) => ({ ...current, liquidity: liquidityValue }))}
      />

      <div className="policy-preview">
        <div>
          <ArrowDown size={16} aria-hidden="true" />
          <span>利率变化</span>
          <strong>{rate.rateDelta > 0 ? "+" : ""}{rate.rateDelta.toFixed(2)}%</strong>
        </div>
        <div>
          <ArrowRight size={16} aria-hidden="true" />
          <span>信用影响</span>
          <strong>{(rate.credit + lending.credit).toFixed(1)}</strong>
        </div>
        <div>
          <ArrowUp size={16} aria-hidden="true" />
          <span>流动性影响</span>
          <strong>{liquidity.liquidity > 0 ? "+" : ""}{liquidity.liquidity}</strong>
        </div>
      </div>

      <div className="decision-department-preview" aria-label="五部门预判">
        <h3>{canContinue ? "下一轮五部门预判" : "最终五部门状态"}</h3>
        <div className="decision-department-list">
          {departmentPreview.map((department) => (
            <div key={department.key} className={`decision-department-row status-${department.status}`}>
              <div>
                <strong>{department.name}</strong>
                <span>{department.status}</span>
              </div>
              <p>{department.metrics.slice(0, 2).join(" / ")}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="next-button" type="button" onClick={onNextRound} disabled={!canContinue}>
        <Play size={18} fill="currentColor" aria-hidden="true" />
        {canContinue ? "下一轮" : "模拟结束"}
      </button>
    </section>
  );
}
