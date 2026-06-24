# Spec — P1 Suggested prompts 稳定化（停顿恒给 ≥2 可点 chip + 静态兜底）

> 2026-06-24 · 反馈 [user-testing-1 #4](../user-feedback/submissions/2026-06-24-user-testing-1-analysis.md)（档位 A）· 文件：`src/pages/PracticeRoom.tsx`

## 修改建议
停顿提示词飘忽：当前停顿卡只在"停顿计时器触发 **且** 恰好缓冲到一条 AI follow-up"时出**一个**问题（[PracticeRoom.tsx:1641-1664](../../src/pages/PracticeRoom.tsx#L1641-L1664)）。条件不满足就不出 → 用户"不知道接下来说什么 → 不录第二次"。

## 解决思路
停顿触发就**恒给 ≥2 个建议、永不空、不做条件判断**：AI 缓冲的 follow-up（若有）放第一个，再用上下文静态题库补足到 ≥2；AI 没命中就纯静态。做成可点 chip，点一个=采纳继续，Skip=全部跳过。⚠️ 记录：补 prompt 是治"不知道说什么"的标，深层"任务感缺失"另案。

## 技术方案
1. **数据模型**：把单条 follow-up 改成列表。新增 `followUpChips: { text: string; kind: "question" | "nudge" }[]`（长度 ≥2）。保留 `bufferedReplyRef`（line 539）作为第一个候选。
2. **组装函数**：`beginPauseCoaching`（line 1041）改为产出 `followUpChips`：
   - 候选①：`bufferedReplyRef.current?.follow_up`（AI 预缓冲，若有）。
   - 候选②③：扩展 `localPauseReply`（line 376）为产**多条**上下文相关项（基于 `lastWord` / `topicKeywords` / 句子），不足再用 `UNIVERSAL_PAUSE`（line 363）静态库补。
   - 去重、取前 2–3 条，保证 `length >= 2`。
3. **渲染**：停顿卡（line 1641-1664）由"单条 followUpQ + Use it/Skip"改为"列出 2–3 个可点 chip + 一个 Skip"。点某 chip = 现 `collapseFollowUpToTag()` 后续行为；Skip = 现 Skip 行为。`thinking` 态（line 1632）保留，但因为有静态兜底，可缩短/直接进 chip。
4. **不依赖 buffer 命中**：只要停顿触发（bottleneck timer），就一定渲染 ≥2 chip。
5. 扩充 `UNIVERSAL_PAUSE` 静态题库到足够多样（科普演讲通用："What's one example?" / "Why does that matter?" / "How would you explain it to a friend?" 等）。

## 验证测试
tsc + build；手动：①每次停顿都见 **≥2** 个可点 chip；②断网 / AI 失败（琥珀 offline）时仍出静态 ≥2；③点 chip 后流程正常、Skip 正常；④快速多次停顿不重复堆叠、不空白。
