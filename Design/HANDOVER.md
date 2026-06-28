# SpeakSpark — Ownership Handover（交接文档）

> 交接日期：2026-06-22
> 用途：把项目从「创始团队委托开发」交接为「我作为实际 Owner 长期维护 + 跑通付费用户验证」。
> 这份是**所有权 / GTM 视角**的总览；逐 session 的开发记忆见 `Design/dev-memory/`（开工先读）。

> **给接手的 openclaw agent**：
> 1. 读取顺序：本文件 → `Design/dev-memory/PROJECT-MEMORY.md`（稳定事实）→ `SESSION-WIP.md`（上次做到哪）→ `TODO.md`（待办，已分「现在能改 / 待拍板 / 后台相关」三档）。
> 2. 仓库约定：每个改动点先在 `Design/specs/` 写四板块 Spec（修改建议/解决思路/技术方案/验证测试），spec ↔ TODO 双向 link。
> 3. 当前阶段不是「狂加功能」，而是**为付费用户验证补齐最小工程门槛**（§4）+ 跑测试循环（§5）。动手前先对齐 §4 优先级。

---

## 📍 最新状态 · 2026-06-29（国内稳定公开链接）

**Claude Code / SAM 调研结论**：
- SpeakSpark 当前前端是静态 SPA，后端继续用 Supabase `jyofoabobuwfowpctbfd`；本阶段不需要改成动态网页，也不迁移后端。
- Vercel `https://speakspark-one.vercel.app` 是稳定海外链接，国内访问不稳定。
- EdgeOne Pages 已能承载最新静态构建，但默认 `edgeone.cool` 链接带 3h `eo_token`，不能作为长期公开分享链接。
- 真正缺口是：**一个自定义域名 + EdgeOne 绑定 + HTTPS + 后续可选 ICP 大陆加速**。

**推荐路线**：
1. 立即：EdgeOne Pages 绑定自定义域名，先走海外加速，拿稳定可分享链接。
2. 同步：如果需要大陆原生速度，启动 ICP 备案；可能需要腾讯云低价资源获取备案服务号。
3. 不推荐 Cloudflare 作为本次主方案：Cloudflare Pages 默认域名在大陆同样不稳，真正大陆加速门槛更高。

**Owner 待决策**：
1. 使用哪个域名：新买 `.com` / 活动域名 / 借已备案子域名。
2. 是否现在启动 ICP。
3. DNSPod / EdgeOne 控制台权限挂在哪个账号。
4. 备案等待期是否需要借已备案子域名过桥。

详细方案见 `Design/specs/2026-06-29-china-public-link-options.md`。

---

## 📍 最新状态 · 2026-06-24（开工先看这条）

**今天 shipped**（已 commit + push 到 `origin/jianan/speakspark`，commits `2456a82`/`ee999bf`/`4a2b0cc`，tsc+build 绿、未浏览器验证）：
- P0 练习页一键开始：未开始=毛玻璃 Ready 卡（高亮 topic + 大 Start，不滑、不自动录）。
- P1 停顿提示词：恒给 ≥2 个可点 chip + 静态题库兜底，永不空。
- **修 End 按钮卡顿**：点击即「Ending…」+ Gemini flush 限 0.8s，必跳转。
- Takeaway 重排：首屏浓缩成「单条最好金句」→ Level up 三色卡（Words/Sentences/Storytelling）→ In detail / Coach 折叠；金句换自然口语版（占位，待权威库）。

**已部署上线**（今天这版）：
- Vercel 生产 **https://speakspark-one.vercel.app**（稳定可分享，海外，国内能开稍慢）。
- EdgeOne 已传最新 dist，但默认域名 3h token 不可分享（见 §2 注 + [[speakspark-edgeone-domain]]）。

**基建实测**：Supabase `jyofoabobuwfowpctbfd` + `gemini-proxy` 正常返回；Deepgram key 有效、已进本地 `.env`（gitignored）。

**待 Owner 决策 / 操作**：
1. 公开链接：买自定义域名 → 绑 EdgeOne **海外加速（免备案）**本周可用；要大陆好性能则启动 ICP 备案（长杆）。
2. Deepgram key 安全：✅ `VITE_DEEPGRAM_API_KEY` 已设进 Vercel 生产环境（iOS STT 可用）。⚠️ **Deepgram 没有"域名白名单"功能**（2026-06-25 查证，之前文档写错了）——raw key 在公开 bundle 里裸奔。验证期就用（免费额度，盯用量、异常即轮换）；正式前改 **临时 token**（Supabase Edge Function 持真 key 发 30s JWT）或服务端代理。
3. **vet 金句库**（内容内核）：`Design/specs/2026-06-24-say-it-like-this-v2.md` 第 1 节。
4. 定 **pin 功能**要不要做：`Design/specs/2026-06-24-pin-lines-to-practice.md`（探索性，含自我反驳）。

**反馈处理流程**（新）：`Design/user-feedback/`（原文+模板+追踪表），分析用「信现象/疑药方 + A/B/C 档」框架，见 `submissions/2026-06-24-user-testing-1-analysis.md`。
**本 session 审阅清单**：`Design/dev-memory/REVIEW-2026-06-24.md`。

---

## 0. 这次交接的本质（必须先对齐）

和创始团队聊完后，我的角色变了：**从「写功能的人」变成「这个产品的实际 owner」。**

新的北极星不再是「做完某个功能」，而是：

> **招募真实用户 → 做多轮测试 → 找到真实使用场景的 pinpoint → 持续打磨产品 → 直到出现愿意付费的 paying user。**

所以这份文档的组织顺序是：先讲清产品是什么、跑在哪（基础设施）、现在能用到什么程度，然后重点讲**挡在「真实付费用户」前面的关键缺口**，以及**作为 owner 接下来该怎么跑测试循环**。

---

## 1. 产品一句话

**SpeakSpark = 面向 6–9 年级（11–15 岁）中学生的「英文科普演讲实时陪练」。**

核心立场（已锁死，不能动摇）：**它是私人练习教练，不是评分 / 比赛 / 评价工具。**
> Position SpeakSpark as a private practice coach, not an evaluator.

核心体验闭环：**零摩擦开口 → 被听见 → 卡住被接住 → 拿到能复用的 takeaway → 下次更会说**。

- **用户**（使用者）：11–15 岁学生。
- **买单方**（payer）：家长 / 老师 / 机构 —— 这一点对「找 paying user」至关重要，见 §5。

---

## 2. 基础设施 / 框架（交接清单）

| 项 | 地址 / 标识 | 说明 |
|----|------------|------|
| **GitHub（主仓库）** | https://github.com/HJN-Bot/B2C.git （remote `origin`） | 当前活跃分支 `jianan/speakspark` |
| GitHub（旧 remote） | https://github.com/dounan1/meaningfully.git （remote `meaningfully`） | 项目前身 meaningfully，保留备查 |
| **部署（海外 · Vercel）** | 生产别名 **https://speakspark-one.vercel.app**（项目 `speakspark`，projectId `prj_2ClAaZSum8Rc4AC2QVML9vA3sJg3`） | `vercel --prod --yes` 部署。**稳定、不过期、可分享**（海外节点，国内能开稍慢）。⚠️ iOS STT 需在 Vercel 设 `VITE_DEEPGRAM_API_KEY` |
| **部署（国内 · 腾讯云 EdgeOne Pages）** | https://speakspark-0zgkikod.edgeone.cool（ProjectId `makers-uefwmvwbhogy`） | `edgeone makers deploy dist -n speakspark -t <token> -e production`。⚠️ **默认域名带 3h token、不可做公开分享链接**（过期 401）；公开访问要**绑自定义域名**（大陆加速需 ICP 备案，海外加速免备案）。详见 [[speakspark-edgeone-domain]] |
| **后端（Supabase · 当前在用）** | 项目 ref `jyofoabobuwfowpctbfd`（创始团队，前端指向它） | Postgres + Edge Functions + Gemini key broker。**暂时沿用旧后端**（Gemini 可用，China→海外有延迟） |
| 后端（自有 · 待迁） | 项目 ref `mgufxtpqbcjoyadqcxzg`（已建好，前端**未**指向） | 阶段二再迁：部署函数 + 设 GEMINI_API_KEY 后切过去。现在切过去 Gemini 会断 |
| AI（教练） | Google Gemini（`gemini-2.5-flash`，走 Edge Function 代理） | key 存 Supabase，不暴露前端 |
| AI（移动端 STT） | **Deepgram Nova-2**（实时 WebSocket，`src/lib/cloud-stt.ts`） | 免费 200h/月；key 走 `VITE_DEEPGRAM_API_KEY`（⚠️ 客户端注入，见 §4 #2） |
| 来源平台 | Lovable project `77aef02a-...`（README 里） | 最初用 Lovable 生成，已迁出本地开发 |

**技术栈**：Vite + React 18 + TypeScript + TailwindCSS + shadcn/ui；路由用 **HashRouter**（带 `#`，刷新子页不 404）。

**本地跑**：`npm install` → `npm run dev` → http://127.0.0.1:5173/（路由记得带 `#`，如 `#/practice`）。
**"跑测试" 的定义**：无单测/E2E。验证 = `npx tsc --noEmit` + `npm run build` + `npm run dev` 手动走查。

**部署链路注意**：
- 前端改动 push → Vercel 自动构建。
- **Edge Function 改动本机无法部署**（本机没装 supabase CLI），需在有 CLI / Supabase 权限的环境部署。目前有一处 **延迟优化（`thinkingBudget:0`）等待部署才生效**（见 §4）。

---

## 3. 当前产品状态（已经能做到什么）

四页 App 结构已完成：**Start / Practice / Takeaway / My**。

| 页面 | 文件 | 状态 |
|------|------|------|
| Start（首页） | `src/pages/Home.tsx` | ✅ 一键开始、今日 starter、上次真实高光、三种 Practice Mode 入口、首次 Navigator 引导 |
| Practice（练习房） | `src/pages/PracticeRoom.tsx` | ✅ 实时字幕(Web Speech) + Web Audio 音浪 + 独立 PauseWatcher 停顿检测 + 高价值 phrase 高亮 + KTV v2 事件分(Flow/Words/Sentences/Story) + 猫猫陪练动画 + 停顿后真实 AI 追问 |
| Takeaway（复盘） | `src/pages/TakeawayPage.tsx` | ✅ 3 大块长页：① Your run ② Level up（Amplify + Change/Next + Next Run Plan）③ Coach（多轮 Chatbox + Go again）；Gemini 生成真实总结 |
| My（成长） | `src/pages/MyPage.tsx` | ⚠️ 真实历史走 localStorage（calendar 视角、固定高度滚动）；能力画像/趋势部分仍是原型 |

**练习的三种 Mode**：Free Talk（默认）/ Exam Prep / Story —— `src/lib/practice-mode.ts`，会注入到 coach prompt。

**AI 真实性**：Supabase 恢复 + token 截断 bug 修复后，Takeaway 真实主题总结 / 同义词升级 / 温和 growth-area 建议 / Coach 真回复 **已验证跑通**。Gemini 不可用时有本地兜底（demo 不卡死，但不是真 AI）。

**核心 lib**：`gemini-proxy.ts`（AI 代理封装）、`session-history.ts`（本地落库）、`trying-point.ts`（首页↔Takeaway 闭环）、`coach-prefs.ts`、`practice-mode.ts`。

---

## 4. 挡在「真实付费用户」前面的关键缺口（Owner 最该关心）

这些是从「demo 能跑」到「真实用户能持续用、能付费」之间的硬门槛。按阻塞程度排序：

| # | 缺口 | 为什么挡住付费用户 | 现状 | 决策/行动 |
|---|------|--------------------|------|-----------|
| 1 | **没有真账号体系（auth）** | 现在全是 localStorage + mock "Alex"。无法绑定一个真实用户、跨设备、绑定家长、绑定付费。**没有它就没有"谁在用、谁来付钱"。** | 🔲 未做 | 推荐 Supabase Auth（邮箱/手机/OAuth）→ `user_id` → 表加 user_id + RLS。这是落库和录音的前置。 |
| 2 | **移动端语音识别** | 浏览器 `SpeechRecognition` 移动端 Safari/微信/WKWebView 不支持，会劝退大批手机测试用户。 | 🟡 **代码已实施（`945a1ae`）**，待 key + 部署配置才能真跑 | 已接 **Deepgram Nova-2**（`src/lib/cloud-stt.ts` + PracticeRoom 双路）。**落地三件事**：① 注册 Deepgram 拿 key 配 `.env` 的 `VITE_DEEPGRAM_API_KEY`；② EdgeOne/Vercel 构建环境也要设这个变量（CI 没有本地 .env）；③ Deepgram Console domain 白名单加 `*.edgeone.cool` + `*.vercel.app` + `localhost`。⚠️ key 客户端注入会被公开 → 验证期靠免费额度+白名单+可轮换兜底，正式前应改服务端代理。✅ **iOS 强制走云端 + 桌面路径致命错误自动 fallback 已在代码落地**（`PracticeRoom.tsx` 的 `isIOSDevice()` + onerror→`startCloudCaptions`）。⚠️ 仍需真机确认 iOS `MediaRecorder` 输出格式（可能 `audio/mp4` 不可流式，控制台已打 `recorder.mimeType` 日志，risk B）。 |
| 3 | **录音 + 未成年人合规** | 11–15 岁未成年人，隐私/同意/留存/删除是硬合规问题，也是家长付费前会问的第一件事。 | 🔲 未决 | 先决定要不要存音频（Supabase Storage）+ 同意流程，再开发。 |
| 4 | **数据未真·落库** | sessions/highlights 仍在 localStorage → 换设备/清缓存就没了，"系统记得我"的留存承诺立不住。 | 🔲 未做 | Supabase `sessions` + `highlights` 表，依赖 #1 auth。 |
| 5 | **AI 延迟 <3s 优化未上线** | 练习中停顿后 AI 反应慢会破坏"真人陪练"体感。代码已就绪（`thinkingBudget:0`），但 **Edge Function 需部署才生效**。 | 🟡 待部署 | 在有 supabase CLI 的环境 deploy `gemini-proxy`。 |
| 6 | **埋点/分析缺失** | 跑用户测试却不记录行为事件 = 看不到漏斗/留存，无法判断"打磨有没有用"。 | 🔲 未做 | 接 PostHog 或 Supabase 自建事件表，记录：完成练习 / Try Again / 停顿弹卡 等。 |

> 一句话：**#1 auth + #2 移动端 STT 是跑真实用户测试的两个硬前提**；#3 合规是家长付费的前提；#6 埋点是「判断打磨是否有效」的眼睛。

---

## 5. Owner 视角：怎么跑「找到付费用户」这件事

### 5.1 谁是付费用户？
使用者（学生）≠ 付费者（家长/老师）。招募和验证要**同时**抓两端：
- **学生端验证**：开口率、完成率、次日是否回来 → 产品是否真有用。
- **家长/老师端验证**：愿不愿意为「成长报告 / 能力画像 / 可复用素材」付费 → 商业闭环。

### 5.2 建议的测试招募循环（multi-round）
1. **招募**：先找 5–10 个真实 11–15 岁学生（+ 家长）做第一轮。渠道：留学/英语机构、家长群、学校演讲社团、自己的人脉。
2. **观察单次**：陪同/录屏看一次完整练习，重点抓 §6 的关键节点是否达标（开口、被听见、被接住、拿到 takeaway）。
3. **找 pinpoint**：记录"哪一步用户卡住/皱眉/退出"——这就是真实使用场景的痛点。不要自己脑补。
4. **快速打磨**：把痛点转成 `Design/specs/` 的四板块 spec → 改 → 验证（见仓库约定）。
5. **多轮复测**：同一批用户 3–5 天后回来，看留存 + 是否复用上次的词句（这是产品价值的硬证据）。
6. **问付费意愿**：在用户感到"真的变好"的那一刻（Growth Pulse moment），向家长验证付费意愿和价格锚点。

### 5.3 验证前必须先补的最小工程（MVP-for-testing）
要让上面循环跑起来，**至少**先解决：#2 移动端 STT（否则手机用户测不了）+ #1 简易 auth（否则区分不了用户、留存测不了）+ #6 基础埋点（否则看不到漏斗）。
#3 合规和 #4 完整落库可在第一轮小范围测试时用"知情同意 + 本地数据"过渡，但**收费前必须补齐**。

---

## 6. 北极星指标（判断"打磨有没有用"的尺子）

来自 PRD §8，作为每轮测试的验收线：

| 节点 | 目标 |
|------|------|
| Start 后 10 秒内开口率 | ≥ 75% |
| 首次 session 完成率 | ≥ 65% |
| 第一次 phrase 高亮触发时间 | ≤ 8 秒 |
| 真实停顿 follow-up 成功触发率 | ≥ 80% |
| Takeaway 页 Practice Again 点击率 | ≥ 35% |
| 次日留存率 | ≥ 40% |
| 7 日内复用高亮词比例 | ≥ 30% |

**AARRR 里最关键的两个**：Activation = Start 后 10 秒内说出第一句（不是注册）；Retention = 次日回来练同一 topic 或复用一句话。先把这两个跑到目标线，再谈 Revenue。

---

## 7. 产品红线（任何打磨都不能越界）

来自外部 reviewer 设计走查 PDF：

- 只做 **coach process**：prompts / frames / vocabulary choices / one next-run plan。
- **避免**：完整演讲代写、比赛分数、排名语言、实时错误标注、暴露具体 AI provider 报错。
- 说话中的界面**只放「帮用户继续说下去」的东西**，其余移到结束后作为 private evidence。
- 全程 **coach not scorer**，去评分化 / 比赛化文案。

---

## 8. 已知坑 / 维护备忘

- **Supabase 免费版不活动会被暂停**（曾 2026-06-14 NXDOMAIN 失效 → 全程本地兜底，看起来像"AI 不智能"）。若再失效：控制台 Restore，或重建后改 `client.ts` + `config.toml` 并重新部署函数 + `supabase secrets set GEMINI_API_KEY`。
- **token 截断坑**：`gemini-2.5-flash` 的"思考"吃约 700–800 token 且计入 `maxOutputTokens`。复杂 JSON 输出务必留足（takeaway 现 4000、chat 2000），或加 `thinkingConfig:{thinkingBudget:0}`。
- **Edge Function 改动需在有 supabase CLI 的环境部署**，本机部署不了。
- 旧 `SessionEnd.tsx` 已被 `TakeawayPage.tsx` 取代；`Practice.tsx`/`Lessons*`/`Progress.tsx` 等是旧页面，主流程不走。
- KTV 当前是**本地启发式**（参考 IELTS/TOEFL 维度，非真打分），是否要用真人录音校准或改 AI 评分待定。

---

## 9. 接手第一周建议动作

1. **拿全访问权**：GitHub（origin）、Vercel（speakspark）、Supabase（`jyofoabobuwfowpctbfd`）、Gemini key —— 确认我都有 owner 级权限。
2. **本地跑通 + 真机自测**：`npm run dev`，手机开一次练习，亲身确认移动端 STT 的实际状况（§4 #2）。
3. **定 MVP-for-testing 范围**：auth + 移动端 STT + 埋点，三选一先动哪个（建议先 STT，因为它直接决定能不能招手机用户）。
4. **招募第一批 5–10 个真实用户**，按 §5.2 循环跑第一轮。
5. **每轮把 pinpoint 写进 `Design/specs/`**，保持 spec ↔ TODO 双向 link 的既有约定。

---

## 10. 决策与分阶段路线图（2026-06-23 定）

### 已定决策

| 主题 | 决策 | 要点 |
|------|------|------|
| 移动端 STT | **Deepgram Nova-2** | 验证期免费（$200 credit / 200h 月）；不需先绑卡。超量约 $0.0043/min |
| iOS STT 坑 | **已修（代码）** | iOS 强制走云端 + 桌面致命错误 fallback；待真机确认 mp4 格式坑 |
| Supabase | ⏸ **暂缓迁移**：前端切回旧后端 `jyofoabobuwfowpctbfd`，保 Gemini 可用 | 自有项目 `mgufxtpqbcjoyadqcxzg` 已建好，但部署函数+设 key 之前不切过去。当前重点=国内能直接打开的链接 |
| 认证 | **Supabase Auth Magic Link，建在我自己的新项目上** | 认证绑 Supabase 项目 → 必须和「Supabase 接管」一起做，否则做两遍 |
| 教练 LLM / API | **下一里程碑换国内便宜模型**（DeepSeek / Qwen / GLM-4-Flash） | STT 已交 Deepgram，LLM 只需文本 → 重写 `gemini-proxy` 为 OpenAI 兼容即可。现在先沿用 Gemini key |
| 埋点 | **PostHog 或 Supabase 自建 events 表**（现在做） | 匿名 id 起步，Auth 后 alias 到 user_id。事件表见 `Design/specs/2026-06-23-analytics-events.md` |

### 分阶段优先级

**阶段一 · 让手机能测 + 认得出用户（现在，高优先）**
1. ✅ iOS STT 修复（本轮已落地代码）
2. ⏸ **Supabase 自有化暂缓**（前端仍用旧后端保 Gemini）。自有项目 `mgufxtpqbcjoyadqcxzg` 已建好，阶段二再切（部署函数 + GEMINI_API_KEY 后）
3. 🔲 **认证**（Supabase Auth Magic Link，建在我的新项目上）
4. 🔲 **埋点**（事件 + 匿名 id，Auth 后 alias）
   - Gemini key：先把现值拷进我的新项目 secret，不阻塞

**阶段二 · 完全接管技术栈（下一里程碑）**
5. 🔲 **API / 模型接管**：换 DeepSeek / Qwen / GLM-4-Flash，重写 `gemini-proxy` 为文本 LLM 代理
6. 🔲 **DB 落库**：sessions / highlights 进 Supabase，替 localStorage（依赖阶段一认证）
7. 🔲 **录音 + 未成年人合规**

> 阶段一的唯一硬 KR：**一台真 iPhone 上字幕能实时出来**（配好 Deepgram key + 真机确认 mp4 坑没踩）。它没绿之前，认证/埋点做了也没人能用。

---

*本文档是活的。每完成一轮用户测试或一次重大决策，更新 §4 缺口状态、§5 招募进展、§6 实测指标。*
