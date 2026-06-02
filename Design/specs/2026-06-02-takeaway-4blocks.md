# Spec — Takeaway 拆 4 块 + 高级建议 (G / R7)

> 2026-06-02 · 对应 TODO：P3·G · 文件：`src/pages/TakeawayPage.tsx` · 状态：✅ 已实现 🧪 待验证

## 修改建议
Takeaway 杂乱、不知道看哪；没按指标给建议；"下一次尝试"太像、太简单。要：① 鼓励 → ② 分值/进步 → ③ Coach → ④ 再试；按指标建议；下次给高级句式/词汇。

## 解决思路
- 重排为 4 块、加段标 ②③④（① 即顶部 hero）。
- 新增 **② Your progress this run** 块：四指标分数条+数字+趋势标签 + "What moved"（来自 `ktvEvents` 的涨分原因）。回应"看不到进步/冲击分"。
- 升级 takeaway prompt：`say_this`=更高级的模型句（带连接词，不复述原话）；`reuse_words`=升级词汇；`make_stronger` 针对最低 KTV 指标并点名。

## 技术方案
1. 在 summary 后插入 ② 进步块（`ktvScore` 条 + `ktvEvents.slice(0,4)`）；删底部重复的 "What's growing"。
2. 加纯文字段标 "③ Coach · what to try next"（Next Run Plan 前）、"④ Go again"（按钮前）。
3. `buildTakeawayPrompt` 规则补：say_this 升级不复述、reuse_words 升级词、make_stronger 对准最低指标（读 ktv_score）。

## 验证测试
tsc + build；手动 `#/session-end`（先练一次）：四块从上到下清晰；② 显示分数+"+N 指标·原因"；Next Run Plan 的 say_this 是更高级的句子而非复述；make_stronger 对准最弱项。
