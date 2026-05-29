# PROJECT MEMORY — SpeakSpark（长期记忆）

> 这是项目的"长期记忆"。只放不会随某次 session 变化的稳定事实。
> 易变的"这次做到哪了"放 [SESSION-WIP.md](./SESSION-WIP.md)；待办清单放 [TODO.md](./TODO.md)。

## 一句话定位
SpeakSpark = 面向 6–9 年级（11–15 岁）中学生的**英文科普演讲实时陪练**。
核心立场（已锁死）：**它是私人练习教练，不是评分 / 比赛 / 评价工具。**
> Position SpeakSpark as a private practice coach, not an evaluator.

## 产品红线（LAUNCH RULE，来自设计走查 PDF）
- 只做 coach process：prompts / frames / vocabulary choices / one next-run plan。
- 避免：完整演讲生成、比赛分数、排名语言、实时错误标注、暴露具体 AI provider 报错。
- 说话中的界面只放"帮用户继续说下去"的东西，其余移到结束后作为 private evidence。

## 技术栈 / 结构
- Vite + React + TS + TailwindCSS + shadcn/ui，包管理见 `bun.lockb` / `package-lock.json`。
- 路由：**HashRouter**（为 Vercel 静态托管，刷新子页不 404）。路由要带 `#`，如 `#/session-end`。
- 没有单元 / E2E 测试。"跑测试" = `npx tsc --noEmit` + `npm run build` + `npm run dev` 手动验证。
- 部署：Vercel，`vercel.json`（build=vite, output=dist, SPA rewrites）。

## 后台（Supabase）
- project_id：`jyofoabobuwfowpctbfd`
- Gemini API key 存在 Supabase，**不暴露到前端 / 日志 / 提交**。
- 前端所有 Gemini 调用走 Edge Function 代理 `gemini-proxy`（不再前端直连）。
  - 封装：`src/lib/gemini-proxy.ts`（支持 `systemInstruction` / `responseMimeType` / `temperature` / `maxOutputTokens`）。
  - 函数：`supabase/functions/gemini-proxy/index.ts`，默认模型 `gemini-2.5-flash`。
- 其它函数：`get-gemini-api-key`（兜底取 key）、`analyze-voice`。
- ⚠️ 本机**没装 supabase CLI** → Edge Function 源码改了无法在本机 `deploy`，需用户那边部署。

## 关键页面
- `src/pages/Home.tsx` — 首页（Start / 证据 / 主题活动方向待做）
- `src/pages/PracticeRoom.tsx` — 练习房（实时字幕 / KTV / 猫猫教练 / 停顿追问），SpeakSpark 主练习页
- `src/pages/TakeawayPage.tsx` — 结束复盘页（路由 `/session-end`），**今天 walkthrough 的主战场**
- `src/pages/MyPage.tsx` — My / 成长页
- 旧 `SessionEnd.tsx` 已被 `TakeawayPage.tsx` 取代（路由不再指向它）。

## KTV 四指标（当前命名）
Flow / Words / Sentences / Story（每次涨分都要绑定具体事件原因）。

## 重要文档
- `Design/PRD.md`、`Design/Architecture.md`、`Design/CHANGELOG.md`
- `Design/iterations/feedback-2026-05-06.md` — 外部 reviewer 5 条反馈 + 7 页设计走查 PDF 转写（**今天改动的依据**）
