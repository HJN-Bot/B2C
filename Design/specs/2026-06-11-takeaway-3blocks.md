# Spec — Takeaway 重构为 3 大块（长页）

> 2026-06-11 · 对应 TODO：P3·Takeaway 重构 · 文件：`src/pages/TakeawayPage.tsx` · 状态：✅ 已实现 🧪 待浏览器验证（2026-06-14）
> 经确认：长页可下滑；核心增强分「放大 / 改掉」两桶。

## 修改建议
现在 Takeaway 层级混乱（Next Run Plan / What worked / Make stronger 平铺、看不清重点）。改成 3 大块、可下滑长页：
1. **总结与鼓励**：鼓励话 + 你讲了什么 + 你做得好的部分（含进步分值）。
2. **Takeaway · 核心增强**：放大（值得做更多的）+ 改掉（一个要改的）+ 下一次怎么说。
3. **Coach**：追问 Chatbox + Try Again。

## 解决思路
保留现有片段，按 3 块重排 + 加清晰分区标题；AI 结构加一个 `amplify`（放大）字段，与 `what_worked`(做得好→块1) / `make_stronger`(改掉→块2) 区分。页面本就 `overflow-y-auto`，做成长页即可。

## 技术方案
1. `AiTakeaway` 接口加 `amplify: Evidence[]`；`normalizeTakeaway` + `createLocalTakeaway` 补 amplify；`buildTakeawayPrompt` schema/规则加 amplify（"一个值得做更多的强项 + 怎么放大"）。
2. 渲染重排为 3 个带标题的 section：
   - 块1 总结与鼓励：hero + coach-mode pill + What you talked about + What you did well(what_worked+引用) + ②进步分值。
   - 块2 核心增强：Amplify(放大) + Change(改掉=make_stronger) + Next Run Plan(focus/say_this/reuse_words/one_move)。
   - 块3 Coach：Chatbox + Practice Again/Start。
3. 每块加大号分区标题（① 总结与鼓励 / ② 核心增强 / ③ Coach），长页下滑。

## 验证测试
tsc + build；手动 `#/session-end`（先练一次）：三大块从上到下清晰、可下滑；块1 有鼓励+讲了什么+做得好(带引用)+分值；块2 有放大/改掉/下一次怎么说；块3 有 Chatbox+Try Again。
