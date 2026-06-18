# Spec — 自定义 coaching prompt + 历史按时间筛选

> 2026-06-18 · 文件：`lib/coach-prefs.ts`(新)、`MyPage.tsx`、`TakeawayPage.tsx`、`PracticeRoom.tsx` · 状态：实现中 · 纯前端

## 架构结论（记一笔）
- **录音回放 + 跨设备/绑定用户的存储** → 需 Supabase Storage + **登录系统(auth)**。现 app 无 auth（mock "Alex"），历史/短语仅 localStorage。该模块待后台恢复 + 账号体系决策。
- 本 spec 两项纯前端、存本机，不依赖后台。

## 修改建议 / 技术方案
1. **自定义 coaching prompt**（Settings 的 Prompt 行可编辑）
   - 新 `src/lib/coach-prefs.ts`：`getCustomPrompt()/setCustomPrompt(v)`（key `speakspark.customPrompt`）。
   - MyPage Prompt 行 → 点开展开 `<textarea>`，输入"我想练什么/教练怎么帮我"，即时存 localStorage；行尾显示 Custom/Default。
   - **注入 AI**：`buildTakeawayPrompt` + `buildChatSystemPrompt`（TakeawayPage）和 Practice 的 Gemini 调用，把自定义 prompt 作为额外 instruction 追加（仍受 coach 边界约束：不写完整演讲/不打分）。AI 后台恢复后即生效。
2. **历史按时间筛选**（History 右上日期图标）
   - MyPage 加 `range` 状态：all / week / month；日期图标变成可点按钮，循环切换并显示当前标签；按 `createdAt` 过滤历史列表。

## 验证测试
tsc + build；手动：My 的 Prompt 行可展开编辑并持久（刷新还在）；日期图标点击在 全部/本周/本月 间切换、列表随之过滤。
