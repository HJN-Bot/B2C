# SpeakPeak · 主交接文档 (HANDOVER-MASTER)

> **单一入口。** 换 agent 接手先读这份。最后更新：2026-07-26。
> 稳定事实见 [PROJECT-MEMORY.md](./PROJECT-MEMORY.md)，历史流水见 [SESSION-WIP.md](./SESSION-WIP.md)，
> 完整待办见 [TODO.md](./TODO.md)，昨日快照见 [HANDOFF-2026-07-25.md](./HANDOFF-2026-07-25.md)。

---

## 0. TL;DR
**SpeakPeak**（代码里仍叫 `speakspark`，别改）是一个手机端网页 App：面向中国 6–9 年级
（11–15 岁）学生的**英文演讲 / 辩论实时陪练教练**。已上线可用
（https://speakpeak.vercel.app ），Owner 正在做"跑出第一个付费用户"的验证。
当前唯一在飞的代码任务：**Takeaway 复盘页 4 项修复**（schema 层已做完并推送，UI 层待接线）。
主要 block 都在**基建**（.cn 备案、国内加速、自有后端），代码本身没有卡死点。

---

## 1. 产品定位与红线（不可动摇）
- **一句话**：私人练习教练，**不是评分 / 比赛 / 评价工具**。
- **核心用户**：有演讲/辩论目标的中学生（周末辩论赛、科普演讲、考试口语）。
- **红线（来自设计走查）**：
  - 只做 coach process：prompts / frames / 词汇选择 / 一条下次计划。
  - **禁止**：生成整篇演讲、比赛分数、排名话术、说话中实时纠错、暴露具体 AI provider 报错。
  - 说话过程中界面只放"帮用户继续说下去"的东西；其余（分数等）挪到结束页当私有证据。
- **Takeaway 已升级为"教你说得漂亮"**：最好的一句 → Level up（Words / Sentences / Storytelling）→ Coach 追问。

## 2. 战略锁定（Owner 已定，别重开）
- 押**场景 A = 有准备的演讲/辩论陪练**。
- Upside 阶梯：**小闭环 → 第一个付费用户 → 清晰市场**。
- **冻结**以下直到拿到 1 个付费信号：自建 Supabase 迁移、ICP 备案投入、小程序。
  （即：先用免费/借来的基建把闭环跑通，别提前砸后端。）
- 决策：**不引入 LangGraph / LangChain** —— 纯前端 SPA 无服务端可跑 agent 图，
  且与"冻结自建后端"冲突；"问题笼统"是 prompt/上下文问题，不是编排问题。

---

## 3. 仓库 / 访问 / 部署
| 项 | 值 |
|---|---|
| 工作目录 | `/Users/jianan/Documents/个人开发/B2C/B2C`（注意嵌套 `B2C/B2C`） |
| 当前分支 | **`jianan/speakspark`**（在这上面干活，已推送并跟踪 origin） |
| remote origin | github.com/HJN-Bot/B2C（**我们的，push 这里**） |
| remote meaningfully | github.com/dounan1/meaningfully（朋友原仓，只读） |
| 海外部署 | Vercel（`vercel --prod --yes`） |
| 国内部署 | 腾讯云 EdgeOne Pages（`edgeone makers deploy dist -n speakspark -t <token> -e production`，ProjectId `makers-uefwmvwbhogy`） |

### 线上地址
- **https://speakpeak.vercel.app** — 已上线（iOS Safari 可用）
- **https://speakpeak.vercel.app/guide.html** — 中文用户手册页（英文界面截图）
- **speakpeak.cn** — 已买，**未解析**（待 .cn 实名认证 + 备案），Owner 任务

### 命令（我们的"测试" = tsc + build + 浏览器手验，**无单测/E2E**）
```bash
cd "/Users/jianan/Documents/个人开发/B2C/B2C"
npm install
npm run dev            # 本地开发
npx tsc --noEmit       # 类型检查，必须干净
npm run build          # 必须过再部署
vercel --prod --yes    # 部署（token 过期就先 vercel login）
```

---

## 4. 架构
- **Vite + React 18 + TS + Tailwind + shadcn/ui**（Radix 全家桶 + lucide-react + recharts + react-hook-form + zod + sonner）。
- **HashRouter**（为静态托管刷新不 404，路由带 `#`，如 `#/session-end`）。
- **状态全在 local/sessionStorage，无数据库**。存储键前缀 `speakspark.*` 和 `meaningfully.*`。
- **AI 全走 Supabase Edge Function 代理**：前端 `callGeminiProxy`（`src/lib/gemini-proxy.ts`）→ 函数 `supabase/functions/gemini-proxy`（默认 `gemini-2.5-flash`）。Key 存 Supabase，不进前端。
- **iOS 语音识别**：Deepgram Nova-2 云端 STT（`src/lib/cloud-stt.ts`）。

### 关键文件地图
| 文件 | 作用 |
|---|---|
| `src/pages/Home.tsx` | 首页：4 场景选择器（Debate/Science/Exam/Free）+ 今日话题卡 + 上次高光 + 单一 Start |
| `src/pages/PracticeRoom.tsx` | 练习房：实时字幕 / KTV 四指标 / 猫猫教练 / 停顿追问卡 |
| `src/pages/TakeawayPage.tsx` | **复盘页**（`/session-end`）：最好的一句 + Level up 三卡 + Coach chatbox。**当前在改的主战场** |
| `src/pages/MyPage.tsx` | 我的：成长地图 / 尝试点 / 词汇库 / 金句库 / 设置（含语言切换） |
| `src/lib/i18n.ts` | UI 中英切换（Context + `useI18n()`）。**只译界面 chrome，练习内容保持英文** |
| `src/lib/practice-mode.ts` | 4 场景定义：各自 `topics[]` + `coachStyle` + `topicNoun`；`pickTopic()` |
| `src/lib/gemini-proxy.ts` | AI 代理封装 |
| `src/lib/cloud-stt.ts` | Deepgram 云端 STT |
| `src/lib/saved-lines.ts` | 金句库（`toggleLine`/`isLineSaved`，localStorage，下次练习 Ready 卡带回） |
| `src/lib/vocab-bank.ts` | 词汇库（`toggleVocab`/`isVocabSaved`） |
| `src/lib/trying-point.ts` | 下次尝试点（复盘 one_move → 首页尝试点） |
| `src/lib/coach-prefs.ts` | 用户自定义教练指令 `getCustomPrompt()` |
| `src/lib/session-history.ts` | 练习历史 |
| `src/data/quoteLibrary.ts` | 20 条毕业演讲金句 + `pickStealLines(n)`（**Sentences 改造后将弃用名人名言部分**） |
| `supabase/functions/{gemini-proxy,get-gemini-api-key,analyze-voice}` | Edge Functions（本机**无 supabase CLI**，改了要 Owner 那边部署） |

> 注：`src/pages/` 还有一批旧页（Index/Lessons/Practice/Profile/Progress/SessionEnd 等）是早期版本，**当前路由不指向它们**，别被误导。活跃路由见 `src/App.tsx`：`/` `/practice` `/session-end` `/my`。

---

## 5. 密钥与后端状态
- `.env` **已 gitignore**，含 `VITE_DEEPGRAM_API_KEY`（Deepgram，注意 VITE_ 会进公开 bundle，裸奔——验证期靠免费额度+盯用量，正式前改临时 token/服务端代理）。
- **AI 现跑在朋友 Dounan 的 Supabase**（`jyofoabobuwfowpctbfd`，`gemini-proxy` 实测 AI_OK）。
- 自有项目 `mgufxtpqbcjoyadqcxzg` 已建好但**暂缓迁移**（Plan A：拿到付费信号后切自有 Supabase + 换 DeepSeek key）。
- EdgeOne 部署 token、`.mcp.json`（Supabase MCP）在本机。
- **换机器 clone 会缺 `.env` 和 token** —— 需手动带过去。

---

## 6. 已知坑（别踩/别回退）
1. **EdgeOne 默认域名 `*.edgeone.cool` 不能做公开链接** —— 强制带 `eo_token`，链接仅 3h 有效、不可关，过期 401。公开访问唯一解 = 绑自定义域名。
2. **`.cn` 域名未实名认证前 NXDOMAIN**（打不开是这个原因，不是 DNS 配错）。
3. **gemini-2.5-flash 思考吃 ~700–800 token 且计入 `maxOutputTokens`** —— 大 JSON 输出务必留足（takeaway 已设 4000）；不够会截断 → 退本地兜底。
4. **Deepgram 没有域名白名单功能**（旧文档误写）—— 别去平台找那个开关。
5. **Vercel SPA rewrite 会吞真实静态文件** —— `vercel.json` 里 `/guide.html`、`/guide/*` 的放行规则必须在 catch-all **之前**；以后往 `public/` 加真实文件同理。
6. **本机无 supabase CLI** —— Edge Function 源码改了本机 deploy 不了。

---

## 7. 当前进展 / 状态
最近提交（`jianan/speakspark`，已推 origin）：
```
c46bdb8 wip(takeaway): AI schema（word-paging/own-line-rewrites/dynamic-Qs/run-cache）—— schema 层
89c5fde docs(guide): 用户手册页 + PDF + 修 Vercel rewrite
ffa0524 feat(i18n): 中英 UI 切换（nav+Home+My+toggle）
7d3a3c7 fix(home): 话题卡加高，长辩题 3 行不截断
4037a81 feat(takeaway): 真实金句 + Words/Sentences shuffle + coach presets
c97499f fix(practice): 停顿卡修复
```
**已上线且验证**：i18n 中英切换、首页 4 场景重构、金句 pin 闭环、词汇库、Takeaway Level up、用户手册页。

---

## 8. Block points（卡点）
### 基建（Owner 侧，非代码）——这是主要瓶颈
- ⛔ **speakpeak.cn 未解析** → 需 .cn 实名认证 → DNS 通 → EdgeOne 绑海外加速（免备案）；大陆加速需 ICP 备案（买轻量服务器做备案服务号，周期以周计）。
- ⛔ **国内直达链接** 依赖上一条。当前国内只能用 Vercel（慢/可能不稳）。
- ⏸️ **自有后端 / DeepSeek** —— 战略上冻结，等付费信号。

### 代码（可立即推进）
- 🔧 **Takeaway 4 项修复的 UI 层**（详见第 9 节）—— schema 已就绪，接线即可，不阻塞构建。

---

## 9. 在飞的代码任务：Takeaway 复盘页 4 项修复
**完整 spec（四板块：现象/思路/方案/验证）**：`Design/specs/2026-07-13-takeaway-fixes.md`（先读它）。
全部改动在 **`src/pages/TakeawayPage.tsx`**。四个问题：
1. Words shuffle 只重排同样 3 个 → 从更大池子**翻页**。
2. Sentences 硬塞不相关名人名言 → 换成**你原话的 3 张可存改写卡**。
3a. Coach 问题笼统 → AI 生成**针对本次原话**的问题（**不上 LangGraph**）。
3b. 每次回复盘页都**重新生成** → 按 session 签名**缓存**。

### ✅ 已完成（已提交、编译干净）—— schema/后端层
- `AiTakeaway` 接口 += `base_sentence` / `sentence_rewrites[]` / `follow_up_questions[]`
- `normalizeList(value, fallback, max=4)` 加 max 参数；`normalizeTakeaway` 解析新字段；`reuse_words` 上限 4→10
- `createLocalTakeaway`（离线兜底）返回新字段
- `buildTakeawayPrompt` + JSON schema 块要求 6–10 个 reuse_words、base_sentence、3 条 rewrites、3 条 follow-up questions（grounding 规则已写）
- 缓存脚手架：`TAKEAWAY_CACHE` 键、`TakeawayCache` 接口、`sessionSignature()`、`readTakeawayCache`/`writeTakeawayCache`、`sessionSig` memo、`generateTakeaway` 顶部**缓存命中读取**分支

### ⛔ 待做（下个 agent 从这开始，按序）
1. **3b 缓存"写"缺失** → 现在只读不写，永远命中不了。在 AI 生成成功后、本地兜底后、以及 `askCoach` 每轮后调 `writeTakeawayCache({ sig: sessionSig, takeaway, chatMessages, chatHistory })`；并把 `sessionSig` 加进 `generateTakeaway` 的 deps。
2. **Words UI**（约 L580 `shownWords`）：现在是 `sort(random).slice(0,3)`，Shuffle 按钮 gated `reuse_words.length>3`。改为 `wordPage` 状态；`shownWords = reuse_words.slice(page*3, page*3+3)`（环绕）；Shuffle 累加页码。
3. **Sentences UI**（约 L746）：删掉 `pickStealLines(2)` 名人名言块。改为 `You said: "{base_sentence}"` + 遍历 `takeaway.sentence_rewrites` 出 3 张卡，每张 pin 调 `toggleLine(rewrite, "Your line")`。移除 `stealLines` state 和 `pickStealLines` import。
4. **Coach presets**（约 L66 `PRESETS`）：快捷问题从 `takeaway.follow_up_questions` 动态生成；为空时回退到 2 条静态。
5. `tsc --noEmit` + `npm run build` + `vercel --prod` + 浏览器验证（用 `/tmp/spk/seed.js` 模式塞演示数据，或真跑一次练习）。

> 当前状态安全：新字段还没渲染，页面仍是旧 Words/Sentences 行为，**不影响构建**。

---

## 10. Prompt 总结
### App 内的 AI prompt（都在 `src/pages/TakeawayPage.tsx` 与 `PracticeRoom.tsx`）
- **`buildTakeawayPrompt(context, coachStyle)`** —— 生成结构化 JSON 复盘。人设："SpeakSpark，温暖鼓励型 IELTS 风格口语教练，面向 11–15 岁中国中学生"。约束：每字段一句话、纯文本无 Markdown、只用 transcript 支持的内容不编话题、绑 IELTS 维度但用词友好。输出 JSON：`encouragement/summary/next_run_plan{focus,say_this,reuse_words,one_move}/what_worked/amplify/make_stronger` +（新）`base_sentence/sentence_rewrites/follow_up_questions`。
- **`buildChatSystemPrompt(context, takeaway, coachStyle)`** —— Coach chatbox 系统提示。"仅练习反馈，绝不写整篇演讲/代答；被要求提问就只问一个不自答"。输出 `{answer}`。
- **`practiceMode.coachStyle`**（`src/lib/practice-mode.ts`）—— 每个场景（debate/science/exam/free）注入不同教练风格串。
- **停顿追问**（`PracticeRoom.tsx`）—— 说话卡住时的"接下来说什么"迷你提示。
- **`getCustomPrompt()`**（`coach-prefs.ts`）—— 用户自定义 focus，拼进上面两个 prompt。
- 模型：`gemini-2.5-flash`，`temperature 0.68`，takeaway `maxOutputTokens 4000` / chat `2000`。

### 给下一个 agent 的启动 prompt（可直接粘贴）
```
你接手 SpeakPeak —— 面向中国 6–9 年级学生的英文演讲/辩论实时陪练网页 App
（Vite+React+TS+Tailwind，代码里仍叫 speakspark）。

先做这些：
1. cd "/Users/jianan/Documents/个人开发/B2C/B2C"，git 在分支 jianan/speakspark。
2. 读 Design/dev-memory/HANDOVER-MASTER.md（本文），再读
   Design/specs/2026-07-13-takeaway-fixes.md。
3. 我们的"测试" = npx tsc --noEmit + npm run build + 浏览器手验，没有单测。
   每个修改点先按四板块写/更新 spec 再动手（修改建议/解决思路/技术方案/验证）。

当前任务：完成 Takeaway 复盘页 4 项修复的 UI 层（schema 层已在 commit c46bdb8 做完）。
按 HANDOVER-MASTER 第 9 节"待做"清单顺序做：缓存写 → Words 翻页 → Sentences
换成"你原话的 3 张改写卡" → Coach 动态问题 → tsc+build+部署+验证。

红线：这是练习教练不是评分器；不生成整篇演讲/分数/排名；不引入 LangGraph；
i18n 只译界面不译练习内容；改 Edge Function 本机部署不了要交给我。
```

---

## 11. 约定
- **Spec-first**：每个修改点先在 `Design/specs/YYYY-MM-DD-*.md` 写四板块 spec 再写代码。
- **反馈透镜**：信现象 / 疑药方，分 A/B/C 档，标注 n（样本量）。
- **i18n scope**：只有界面 chrome 中英切换（`i18n.ts`）；练习内容（话题、AI 教练、金句）**保持英文**。
- **Commit**：只在被要求时提交/推送；co-author 结尾
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。
```
