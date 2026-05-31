# Spec — 停顿时的真实 AI 反馈

> 2026-05-31 · 对应 TODO：[R1](../dev-memory/TODO.md) · 文件：`src/pages/PracticeRoom.tsx` · 状态：待开工

## 修改建议
停顿 ≥4.8s 时，教练要基于我刚说的内容反应（追问 or 指方向），别套话。手感：**先应一声，再真问**。

## 解决思路
真实 AI 追问代码已存在，但停顿后只等 900ms 就抢先显示本地套话，盖住了 1–3s 才回来的 Gemini。→ 删掉抢先兜底，先 thinking 占位，等真实回复；仅出错/超时(~4s)才本地兜底。

## 技术方案
1. `FOLLOW_UP_PROMPT` 返回 `{ kind: "question"|"nudge", follow_up, feedback }`，必须引用原话、≤16 词。
2. 卡片两阶段：thinking（猫猫 thinking + "…" + 微回应轮换）→ reply（人话观察 + 按 kind 渲染 + Use it/Skip）。
3. 改造 `showPendingOrAskFollowUp`：删 900ms 定时器 → await Gemini → 失败/超时才 `buildLocalFollowUp`（中性）。
4. 保留现有冷却/防重复/说话恢复收起逻辑。

## 验证测试
tsc + build 通过；手动：说话后停顿→thinking→真实追问；空停→启动式问题；断网→~4s 中性兜底；停顿后续说→收起回 listening。
