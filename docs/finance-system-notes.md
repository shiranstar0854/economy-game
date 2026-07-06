# 金融系统概念映射

本项目第一版只围绕 10 个概念建模：

| 概念 | 游戏变量 | 含义 |
| --- | --- | --- |
| 利率 | `baseRate` | 影响借贷成本 |
| 通胀 | `inflation` | 反映经济是否过热 |
| 信用 | `creditGrowth` | 反映贷款扩张速度 |
| 杠杆 | `householdDebt`、`corporateDebt` | 债务压力来源 |
| 流动性 | `liquidity` | 市场资金宽松程度 |
| 坏账 | `badDebtRate` | 银行资产质量压力 |
| 银行资本 | `bankCapital` | 银行吸收损失的缓冲 |
| 资产价格 | `stockIndex` | 市场风险偏好的结果 |
| 经济周期 | `round` 与历史指标 | 观察多轮变化 |
| 系统性风险 | `systemicRisk` | 综合通胀、坏账、失业和市场波动 |

## 五个部门

### 居民部门

对应变量：`householdIncome`、`householdConsumption`、`householdSavings`、`householdDebt`、`confidence`。

居民收入和信心越稳，消费越强；债务越高，消费越容易被利息和还款压力压制。

### 企业部门

对应变量：`corporateRevenue`、`corporateDebt`、`corporateProfit`、`corporateDefaultRisk`。

企业通过融资扩大生产，短期能拉动收入和就业；债务过高或利润转弱时，违约风险会上升。

### 银行部门

对应变量：`deposits`、`loans`、`badDebtRate`、`bankCapital`、`liquidity`。

银行通过放贷把储蓄转化为信用，但坏账会侵蚀资本缓冲，进而影响系统流动性。

### 金融市场

对应变量：`stockIndex`、`bondYield`、`riskAppetite`、`volatility`。

市场价格受利率、流动性、企业利润和风险预期共同影响；它不是单独运行的交易盘。

### 政府/央行政策

对应变量：`baseRate`、`creditGrowth`、`liquidity`。

第一版只开放三类政策选择：基准利率、银行放贷标准、流动性投放。
