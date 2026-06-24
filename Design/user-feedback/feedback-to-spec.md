# 反馈 → Spec 追踪

> 框架见 [测试#1分析](./submissions/2026-06-24-user-testing-1-analysis.md)：**信现象、疑药方；行为信号 > 主观药方；标注 n；先问是不是目标用户。**
> 档位：A=确信要改 / B=先想清楚 / C=先验证别建功能。

| # | 来源 | 日期 | 现象（信） | 用户药方（疑） | 决策 | 档位 | 对应 Spec | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | user-testing-1 | 06-24 | Start 按钮在面板底部、要滑到底 | "点 tab 自动录音" | 保留一次点击 + 按钮显眼上半屏 + Ready 感 + 高亮 Topic（不自动录） | A | [p0-one-tap-start](../specs/2026-06-24-p0-one-tap-start.md) | ✅🧪 已实现 |
| 2 | user-testing-1 | 06-24 | 报告太长、skim 就走 | "首屏放总评分" | 层次化照做；总评分否决（红线）；首屏=headline+最好一句+最该改一句 | A | [takeaway-say-it-like-this](../specs/2026-06-24-takeaway-say-it-like-this.md) | ✅🧪 已实现 |
| 3 | user-testing-1 | 06-24 | 主动夸词汇反馈 | （纯肯定） | 词汇/句式抬一等公民默认展开 → 升级成"教你说漂亮"新方向 | A | [takeaway-say-it-like-this](../specs/2026-06-24-takeaway-say-it-like-this.md) | ✅🧪 已实现 |
| 4 | user-testing-1 | 06-24 | prompts 飘忽、不出就不录第二次 | "每次≥2 不判断 + 兜底" | 停顿卡恒给 ≥2 可点 chip + 静态题库兜底 | A | [p1-prompts-stable](../specs/2026-06-24-p1-prompts-stable.md) | ✅🧪 已实现 |
| 5 | user-testing-1 | 06-24 | 录音时不看屏（靠近麦） | （别在录音中放关键UI） | 现象不准（多在家、能看屏）→ 待其他用户验证，不动 live 北极星 | C | — | 待验证 |
| 6 | user-testing-1 | 06-24 | 怕开口、没紧迫感 | （加动机/游戏化） | 很可能测错了人；核心=有演讲目标/口语压力学生 → 拿目标用户再测 | C | — | 待验证 |

## 衍生产品方向（非单条反馈，由 ③ 升级）

| 方向 | 来源 | 描述 | 状态 |
|---|---|---|---|
| Takeaway "教你说漂亮" | ③ + Owner 愿景 | Build out your idea（怎么展开 claim→example→why）+ Steal these lines（抓人句式模板 + 词汇升级），用用户自己内容做底 | 待确认呈现形态 → 写 spec |

## 分类统计（本批 n=1）

| 档位 | 数量 | 代表 |
|---|---|---|
| A 确信要改 | 4 | Start 布局 / 报告瘦身 / 词汇升级 / prompts 稳定 |
| C 先验证 | 2 | 屏幕盲区 / 动机 |
