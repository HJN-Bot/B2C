# SESSION WIP — 当前进行中

> 这次 session "做到哪了"。每次开工先看这里。稳定事实放 [PROJECT-MEMORY.md](./PROJECT-MEMORY.md)，完整待办放 [TODO.md](./TODO.md)。

## 本 session 日期
2026-05-29

## 今天的目标
**Takeaway walkthrough** —— 把设计走查 PDF（Page 4 / Page 5）+ feedback #4 里关于结束复盘页的内容，逐条改进 `src/pages/TakeawayPage.tsx`。

## 已完成 ✅
- 在途改动收尾并提交（工作树已 clean）：
  - `chore: switch to HashRouter + add Vercel config`（HashRouter + vercel.json + .gitignore）
  - `fix: make Takeaway Coach Chatbox a real multi-turn conversation`（chatHistoryRef + systemInstruction，后台 gemini-proxy 已支持，无需改后台）
- 创建 `Design/dev-memory/`（本文件 + PROJECT-MEMORY + TODO）
- **Takeaway walkthrough 大部分完成**（`src/pages/TakeawayPage.tsx`，tsc+build 通过）：P4-1 / P4-2 / P4-4 / P5-1 / P5-2 / P5-3 / P5-4 / #4 全部落地。详见 TODO.md。
- **三个练习 Mode 落地**（Free Talk / Exam Prep / Story）：新建 `src/lib/practice-mode.ts`；Home 选择器；PracticeRoom 顶部标签；TakeawayPage pill + coachStyle 注入 prompt。全英文，默认 Free Talk。tsc+build 通过。
- **PracticeRoom 批次大部分完成**（commits `9e8cb75` + topic + cat）：单行 Karaoke 字幕（`lastLine`+`.karaoke-mask`）/ End 已结构分离 / 音浪弱化 / 文案 "Coach is following your story" / TopicHeader + 冷启动关键词(讲到变绿) / 猫猫 thinking 状态 + 漂移容差 88px。剩"彻底消除漂移=重做 sprite 资产"待拍板。
- **新建 Skill** `~/.claude/skills/dev-memory-and-todos/`（未做 subagent 压力测试，待授权）。

## 进行中 🔧
- 提交 Takeaway 改动。

## 待验证 🔲（需用户在浏览器手动确认）
- Takeaway：先练一次再看 `#/session-end`，确认 headline 文案 / summary / 原文引用 / What's growing 文字趋势 / 新 preset / coach-mode pill。
- 多轮 Chatbox 在真实 session 数据下连续追问是否带上下文。
- HashRouter 后各页路由 / 刷新是否正常。

## 2026-06-02 — 全面反馈，TODO 已重排
- 用户给了大量练习页/Takeaway 抱怨，并要求"结合 PDF 重排 TODO、对准抱怨方向"。
- [TODO.md](./TODO.md) 已重写为：北极星（转录稳/KTV真/AI实时懂）→ 按页主计划（P2/P3/P4/P1/跨页/后台）→ 建议执行顺序 → 已完成 → 原话归档。
- **下一步等用户确认从哪个开始**（建议顺序：转录卡顿 → KTV真实化 → 布局/字幕 → AI实时感 → Takeaway拆块+落库）。
- 待复查：A2 的"删顶部状态条/字幕填满"用户说仍有问题，可能没生效或方案不对。

## 暂缓 / 待决定 ⏸️
- **P4-3**：Next Run Plan 提为 hero card 置顶 —— 用户说先放着再说。
- **加什么 Mode**：候选 Gentle / Exam-prep(TOEFL-safe) / Free-talk / Story mode，待用户定。
- **「先录后生成 coaching」** 这条用户没看懂，下次当面演示。

## 下一批（用户已确认方向，见 TODO.md）
- PracticeRoom：单行 Karaoke 字幕 + 固定 End + 常驻 TopicHeader + 关键词微变色 + 文案 "Coach is following your story" + 音浪弱化 + 猫猫动画(好看/不漂移/自动切状态)。
- Home：主题活动卡片 + 用证据/历史/Coach Note 做钩子，和结束页闭环。
- 后台：PracticeRoom 拆子组件。

## 下次接手提示
- dev server 起法：`npm run dev` → http://127.0.0.1:5173/ （记得加 `#`）。
- 改 Edge Function 需要用户侧部署（本机无 supabase CLI）。
