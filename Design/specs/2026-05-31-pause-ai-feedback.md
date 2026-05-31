# Spec — 停顿时的真实 AI 反馈（A / R1）

> 日期：2026-05-31 · 范围：`src/pages/PracticeRoom.tsx` · 优先级：🔴 高（用户说"比较严重，先改"）

## 修改建议

练习时停顿 ≥4.8s，教练应该像真人一样**基于我刚说的内容**反应——要么追问、要么指一个改进方向。现在看到的几乎都是本地套话（"Can you add one real example?"），没有真人感。

期望手感（用户已选）：**先应一声，再真问**——停下来先有个"我在、我在想"的微回应，1–3 秒后换成真实的、引用原话的回复。

## 解决思路

真实 AI 追问的代码其实已存在（`askGeminiForFollowUp` 走 Gemini + transcript），但 `showPendingOrAskFollowUp` 只等 **900ms** 就把本地兜底抢先显示——而 Gemini 往返 1–3s，所以真实回复总被盖住。

思路：
1. 删掉 900ms 抢先兜底；停顿先进入 **thinking 微回应**阶段。
2. 等 Gemini 真实回复回来再替换；**仅在出错或超时（~4s）才用本地兜底**，且文案中性。
3. 让 AI 自己判断**追问 vs 指方向**两种回复，且必须引用学生原话。

## 技术方案

**文件**：只动 `src/pages/PracticeRoom.tsx`（+ 少量 `src/index.css` thinking dots）。

1. **Prompt**（`FOLLOW_UP_PROMPT`）：返回结构改为
   `{ "kind": "question" | "nudge", "follow_up": "...", "feedback": "引用原话的一句人话观察", "mood": "thinking" }`
   约束：≤16 词、必须引用学生说过的词/观点、不准泛泛夸。
2. **两阶段卡片**（复用现 "Pause helper" 卡，新增 `bottleneckPhase: "thinking" | "reply"` 状态）：
   - thinking：猫猫 `thinking` + 跳动 "…" + 微回应轮换文案（"mm… let me think" / "okay, hold on" / "I'm with you…"）。
   - reply：`feedback` 人话观察 + 按 `kind` 渲染（`question`→"Coach asks:" / `nudge`→"Try this next:"）+ 保留 Use it / Skip。
3. **流程改造**（`showPendingOrAskFollowUp`）：进入 thinking 阶段 → `await askGeminiForFollowUp()`；成功则进 reply；失败/超时(~4s) 才 `buildLocalFollowUp`（中性化）。删除 900ms 定时器与"pending 预生成问题当主回复"。
4. **边界**：说话恢复时取消待出回复（现有 collapse 逻辑）；冷却 `lastFollowUpAtRef`、不重复触发、说话/处理中不问——保留。

## 验证测试

- `npx tsc --noEmit` + `npm run build` 通过。
- 手动（`#/practice`，需 Chrome/Edge 麦克风）：
  - 说一句话后停顿 → 先看到 thinking 微回应 → 1–3s 后出现引用原话的真实追问/指方向。
  - 没说话直接停 → 给一个启动式问题（不报错）。
  - 断网/Gemini 失败 → ~4s 后出现中性本地兜底，不是红色失败感。
  - 停顿出回复后立刻继续说 → 回复收起、回到 listening。
