import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import type { HistoryPoint } from "../game/types";

type ChartPanelProps = {
  history: HistoryPoint[];
};

export function ChartPanel({ history }: ChartPanelProps) {
  return (
    <section className="chart-section" aria-labelledby="chart-title">
      <div className="chart-heading">
        <div>
          <h2 id="chart-title">历史走势图</h2>
          <p>观察政策和事件如何传导到增长、就业、债务、坏账和稳定指数。</p>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>增长、就业与稳定</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history} margin={{ top: 12, right: 18, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#d9ded6" strokeDasharray="3 3" />
              <XAxis dataKey="round" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={(round) => `第 ${round} 季度`} />
              <Line type="monotone" dataKey="growth" name="增长" stroke="#167c56" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="employment" name="就业" stroke="#1f4fb3" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="stabilityIndex" name="稳定指数" stroke="#6b3fb3" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>通胀、债务、坏账与系统性风险</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={history} margin={{ top: 12, right: 18, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#d9ded6" strokeDasharray="3 3" />
              <XAxis dataKey="round" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
              <Tooltip labelFormatter={(round) => `第 ${round} 季度`} />
              <Line type="monotone" dataKey="inflationPressure" name="通胀压力" stroke="#c57a18" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="debtPressure" name="债务压力" stroke="#d16b36" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="badDebtRisk" name="坏账风险" stroke="#9f3c2f" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="systemicRisk" name="系统性风险" stroke="#4e3c8a" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
