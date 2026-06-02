# Spec — AI 实时感（多层 fallback）

> 2026-06-02 · 对应 TODO：P2·AI 实时感 · 文件：`src/pages/PracticeRoom.tsx` · 状态：✅ 已实现 🧪 待验证

## 修改建议
停顿后 AI 反应慢。按你的思路：常见上下文**本地秒答**，深度思考**留到第三页**交互。

## 解决思路
A 把停顿回复改成等 Gemini（1–3s），实时感不足。改成**多层**：
- Layer 1：~700ms 出**内容相关的本地快答**（不是套话）。
- Layer 2：Gemini 在 **2.5s 预算**内回来就升级替换；超时/失败就保留本地。
- 深度探讨交给第三页 Takeaway 的 Coach Chatbox（已走 Gemini）。

## 技术方案
1. `buildLocalFollowUp` → `localPauseReply()`：用 transcript 尾段/最近高光词/连接词产生相关的 question/nudge（返回 `{follow_up, feedback, kind}`）。
2. `resolvePauseReply` 重写：`setTimeout(showLocal, 700)` + `Promise.race([fetchFollowUpReply(), 2500ms→null])`；Gemini 命中则升级，否则保留本地；说话恢复/卡片关则放弃。

## 验证测试
tsc + build；手动 `#/practice`：停顿约 0.7s 就出一句相关的本地反馈（秒答感）；网络好时 1–2s 内被更准的 Gemini 版替换一次；断网时本地反馈稳定不变。
