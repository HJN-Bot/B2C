# Spec — 继续改：真实 Last Highlight + 兜底文案 + AI 延迟(thinking)

> 2026-06-19 · 对应 [PM backlog](../dev-memory/TODO.md) P1 · 文件：`Home.tsx`、`PracticeRoom.tsx`、`lib/gemini-proxy.ts`、`supabase/functions/gemini-proxy/index.ts`

## 修改建议
1. **首页 Last Highlight 是写死假数据**（所有人都看到同一句），不真实也没空状态。→ 接真实历史 + 首次空状态。
2. **练习页兜底文案**（无麦克风/不支持/断网）过一遍，更友好、可操作、安抚。
3. **AI 延迟**：实时调用关掉 gemini-2.5-flash 的 thinking（吃 700-800 token + 延时），目标 1–3s。

## 技术方案
1. **Home.tsx**：读 `getSessions()[0]`。有 → 卡片显示该次 transcript 摘要 + "{N} phrases saved · {mode}"，点击进 `/my`；无 → 空状态卡"Finish your first practice to save a highlight here."，点击进 `/practice`。波形保留为装饰常量。删 `MOCK_LAST_HIGHLIGHT` 文本/分数。
2. **PracticeRoom.tsx**：
   - 不支持：`Live captions work best in Chrome or Edge — you can still talk, scores keep going.`
   - 出错：`Captions paused — keep talking, the coach still hears you.`
   - 麦克风被拒：面板里加一行可操作提示（allow mic）。
3. **thinking（延迟）**：
   - `lib/gemini-proxy.ts`：`GeminiProxyRequest` 加 `thinkingConfig?`。
   - `gemini-proxy/index.ts`：把 `body.thinkingConfig` 转进 `generationConfig.thinkingConfig`。
   - `PracticeRoom` 的两处实时调用（`sendToGemini` / `fetchFollowUpReply`）传 `thinkingConfig:{ thinkingBudget: 0 }`。Takeaway 保留 thinking（非实时、重质量）。
   - ⚠️ edge function 改完**需用户侧部署**才生效（本机无 supabase CLI）。

## 验证测试
tsc + build；手动：首页有历史→显示真实摘要，无历史→空状态；练习页麦克风拒绝/不支持文案友好；部署后停顿追问更快。
