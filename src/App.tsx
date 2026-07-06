import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { ChartPanel } from "./components/ChartPanel";
import { Dashboard } from "./components/Dashboard";
import { DecisionPanel } from "./components/DecisionPanel";
import { ResultPanel } from "./components/ResultPanel";
import { initialDecision, initialHistory, initialResult, initialState } from "./data/initialState";
import { learningConcepts, sandboxDepartments } from "./data/events";
import { simulateRound, toHistoryPoint } from "./game/simulation";
import type { EconomyState, HistoryPoint, PolicyDecision, RoundResult } from "./game/types";

function App() {
  const [state, setState] = useState<EconomyState>(initialState);
  const [decision, setDecision] = useState<PolicyDecision>(initialDecision);
  const [result, setResult] = useState<RoundResult>(initialResult);
  const [history, setHistory] = useState<HistoryPoint[]>(initialHistory);

  const canContinue = state.round < 10;
  const currentFocus = useMemo(() => learningConcepts[(state.round - 1) % learningConcepts.length], [state.round]);

  function handleNextRound() {
    if (!canContinue) return;
    const next = simulateRound(state, decision);
    setState(next.state);
    setResult(next.result);
    setHistory((items) => [...items, toHistoryPoint(next.state)]);
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
          <div className="brand-mark" aria-hidden="true">沙</div>
          <div>
            <h1>金融系统沙盘</h1>
            <p>资金流动模拟器</p>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="round-counter">
            <span>当前回合</span>
            <strong>{state.round} / 10</strong>
          </div>
          <div className="focus-line">
            <span>本轮观察</span>
            <strong>{currentFocus}</strong>
          </div>
          <button type="button" className="ghost-button" onClick={resetGame}>
            <RotateCcw size={16} aria-hidden="true" />
            重置
          </button>
        </div>
      </header>

      <section className="department-strip" aria-label="沙盘部门">
        {sandboxDepartments.map((department) => (
          <article key={department.name}>
            <h2>{department.name}</h2>
            <p>{department.summary}</p>
          </article>
        ))}
      </section>

      <div className="main-grid">
        <Dashboard state={state} />
        <DecisionPanel decision={decision} onChange={setDecision} onNextRound={handleNextRound} canContinue={canContinue} />
        <ResultPanel result={result} />
      </div>

      {!canContinue && (
        <div className="end-banner" role="status">
          已完成 10 轮模拟。可以重置后尝试另一组政策路径。
        </div>
      )}

      <ChartPanel history={history} />
    </main>
  );
}

export default App;
