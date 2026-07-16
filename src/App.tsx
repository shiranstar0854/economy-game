import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { ChartPanel } from "./components/ChartPanel";
import { Dashboard } from "./components/Dashboard";
import { DecisionPanel } from "./components/DecisionPanel";
import { ResultPanel } from "./components/ResultPanel";
import { initialDecision, initialHistory, initialResult, initialState } from "./data/initialState";
import { learningConcepts, sandboxDepartments } from "./data/events";
import { MAX_POLICIES, MAX_ROUNDS } from "./game/policy";
import { simulateRound, toHistoryPoint } from "./game/simulation";
import type { EconomyState, HistoryPoint, PolicyDecision, PolicyKey, RoundResult } from "./game/types";

function App() {
  const [state, setState] = useState<EconomyState>(initialState);
  const [decision, setDecision] = useState<PolicyDecision>(initialDecision);
  const [result, setResult] = useState<RoundResult>(initialResult);
  const [history, setHistory] = useState<HistoryPoint[]>(initialHistory);

  const canContinue = state.round < MAX_ROUNDS && state.crisisPhase !== "collapsed";
  const currentFocus = useMemo(() => learningConcepts[(state.round - 1) % learningConcepts.length], [state.round]);
  const selectedCount = decision.selectedPolicies.length;
  const validSelection = selectedCount >= 2 && selectedCount <= MAX_POLICIES;

  function togglePolicy(policy: PolicyKey) {
    setDecision((current) => {
      if (current.selectedPolicies.includes(policy)) {
        return { selectedPolicies: current.selectedPolicies.filter((item) => item !== policy) };
      }
      if (current.selectedPolicies.length >= MAX_POLICIES) return current;
      return { selectedPolicies: [...current.selectedPolicies, policy] };
    });
  }

  function handleNextRound() {
    if (!canContinue || !validSelection) return;
    const next = simulateRound(state, decision);
    setState(next.state);
    setResult(next.result);
    setHistory((items) => [...items, toHistoryPoint(next.state)]);
    setDecision(initialDecision);
  }

  function resetGame() {
    setState(initialState);
    setDecision(initialDecision);
    setResult(initialResult);
    setHistory(initialHistory);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">经</div>
          <div>
            <h1>经济系统学习沙盘</h1>
            <p>看指标 → 判状态 → 找矛盾 → 选政策 → 看副作用 → 再反馈</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="round-counter">
            <span>当前季度</span>
            <strong>{state.round} / {MAX_ROUNDS}</strong>
          </div>
          <div className="focus-line">
            <span>本轮任务</span>
            <strong>{currentFocus}</strong>
          </div>
          <button type="button" className="ghost-button" onClick={resetGame}>
            <RotateCcw size={16} aria-hidden="true" />
            重置
          </button>
        </div>
      </header>

      <section className="department-strip" aria-label="沙盘主体">
        {sandboxDepartments.map((department) => (
          <article key={department.name}>
            <h2>{department.name}</h2>
            <p>{department.summary}</p>
          </article>
        ))}
      </section>

      <div className="main-grid">
        <Dashboard state={state} />
        <DecisionPanel
          decision={decision}
          state={state}
          onTogglePolicy={togglePolicy}
          onNextRound={handleNextRound}
          canContinue={canContinue}
          validSelection={validSelection}
        />
        <ResultPanel result={result} />
      </div>

      {!canContinue && (
        <div className="end-banner" role="status">
          {state.crisisPhase === "collapsed"
            ? `系统崩盘：${state.collapseReason ?? "风险传导失控"}。请重置后复盘最后的传导链。`
            : "已完成 12 个季度模拟。可以重置后尝试另一组政策路径。"}
        </div>
      )}

      <ChartPanel history={history} />
    </main>
  );
}

export default App;
