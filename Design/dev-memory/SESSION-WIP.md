# SESSION WIP — 当前进行中

> 这次 session "做到哪了"。每次开工先看这里。稳定事实放 [PROJECT-MEMORY.md](./PROJECT-MEMORY.md)，完整待办放 [TODO.md](./TODO.md)。

---

## 📌 2026-06-24 — 用户测试#1 反馈 → P0/P1 落地（待浏览器/真机验证）
- **反馈处理新流程**：原文+模板+追踪表在 `Design/user-feedback/`；分析用「信现象/疑药方」框架，区分现象 vs 决策，分 A/B/C 档。本次 A 档 4 项已做，C 档（⑤屏幕盲区/⑥动机）降级待验证。详见 [user-testing-1 分析](../user-feedback/submissions/2026-06-24-user-testing-1-analysis.md)。
- **基建实测通过**：EdgeOne 站点 HTTP 200 公开可达；老 Supabase+Gemini `gemini-proxy` 实测真实返回；Deepgram key（用户提供）有效，写入本地 `.env`。
- ✅🧪 **P0 一键开始**（`PracticeRoom.tsx`）：未开始改成毛玻璃模糊背景 + 中间 Ready 卡（高亮 Topic + 准备感 + 大 Start），不用滑、不自动录。[spec](../specs/2026-06-24-p0-one-tap-start.md)
- ✅🧪 **P1 prompts 稳定**（`PracticeRoom.tsx`）：停顿卡恒给 2–3 个可点 chip（`buildPauseSuggestions`）+ 静态题库兜底，永不空；无缓冲立刻出本地 chip，AI 回来再升级。[spec](../specs/2026-06-24-p1-prompts-stable.md)
- ✅🧪 **Takeaway 瘦身 + Say it like this**（`TakeawayPage.tsx`）：首屏无分（headline+best+level-up）；新明星模块默认展开（Steal these lines 精选金句库填词 / Power up words / Build out idea / trying point）；详情+Coach 折成 `<details>` 默认收起；KTV 数字保留在折叠详情。[spec](../specs/2026-06-24-takeaway-say-it-like-this.md)
- tsc+build 全绿，**未浏览器验证**。审阅清单：[REVIEW-2026-06-24.md](./REVIEW-2026-06-24.md)。

### 2026-06-24 晚 · 二轮微调（同 session，tsc+build 绿）
- ✅🧪 **End 按钮卡顿修复**（`PracticeRoom.tsx`）：根因=`endSession` `await processPhrase(true)` 里有 Gemini 网络调用阻塞导航、按钮无反馈→像没反应。改：点击即 `setEnding(true)` 显示「Ending…」并禁用 + 用 `Promise.race(flush, 800ms)` 兜底，最多 0.8s 必跳转。
- ✅🧪 **Takeaway 再瘦身 + IA 重排**（Owner 指示，`TakeawayPage.tsx`）：首屏合成**一个短 Hero**（庆祝一行 + ⭐ 最好的一句，删 phrases/words 行和单独 encouragement/level-up 卡）；明星模块从"Say it like this"改成 **Level up = 三张界限分明的色卡**（✨Words 绿 / 🧱Sentences 蓝 / 🎬Storytelling 紫，各带一句 purpose），make_stronger + trying point 并入 Storytelling 卡；In detail / Coach 仍折叠。
- ✅🧪 **金句换自然口语版**（`SENTENCE_FRAMES`）：从教科书模板换成 YouTube/采访/TED 那种自然金句（"Here's the thing about…","What really blew my mind is…" 等）。⚠️ 仍是占位，**待换权威/有出处版本**（v2 spec 的金句库）。
- ✅ **EdgeOne 已部署上线**（2026-06-24 晚，用 Jianan 给的 token `edgeone makers deploy dist -n speakspark -t <token> -e production`，Deployment ID `dpmobne7s650`）。实测线上 JS hash 与本地新构建一致、HTTP 200 → 今天全部改动已上线 https://speakspark-0zgkikod.edgeone.cool 。token 仅用于该次命令，未落任何文件。
- ⚠️ **Deepgram 安全**：key 已进客户端 bundle（公开可见）→ 部署前/后尽快在 Deepgram 控制台域名白名单加 `*.edgeone.cool` + `localhost`。
- ⏳ 仍未 git 提交（等用户发话）。
- ✅ 已提交+推送+部署（Vercel `speakspark-one.vercel.app` + EdgeOne）。Words 卡改成「2–3 词上下文短语 + 弱词划掉换强词」(`3f19c7a`)。Vercel 已设 `VITE_DEEPGRAM_API_KEY`。
- **决策（2026-06-25）**：Deepgram key 安全**暂不动**（验证期用免费额度，盯用量、异常轮换）；临时 token 改造押后。Deepgram **无域名白名单功能**（查证纠正）。
- ⚠️ **国内可访问性卡点**：Vercel `*.vercel.app` 国内无 VPN 不可靠/常被挡；EdgeOne 默认域名 3h token 不可分享。**无 VPN 可在大陆稳定打开的链接 = 必须 ICP 备案的自定义域名（EdgeOne 大陆加速）**。
- **决策（2026-06-25）路线 = web + 立刻启动 ICP 备案**（用户：微信+海外都有；海外用 Vercel，国内走备案）。小程序作为中期分发候选（微信渠道），暂不投。
  - 备案清单（Owner 操作）：① 腾讯云/DNSPod 买 `.com` 并**域名实名**；② 腾讯云"备案"→ 个人主体 + 该域名 + **备案服务号**（⚠️ EdgeOne Pages 免费版能否给备案授权码待确认，可能需买个最便宜的腾讯云资源如轻量服务器拿服务号）；③ 管局审核 ~7–20 天；④ 通过后 EdgeOne 绑自定义域名（大陆加速）+ CNAME + 证书；⑤ 我复测大陆节点 + redeploy。备案期间大陆测试仍靠 VPN/Vercel。

---

## 📌 版本总结 · 2026-06-11（推远端前）

### 这一版改了什么
**练习页（Practice）**
- 猫猫动画：去圆框裁切（clip 88→112，不再被遮）+ 动画放慢、状态自动切；最终 AICharacter 只画猫。
- 字幕（Transcript / 你说的"Chatbot"）：连续记录、当前行锁中间、固定提词器窗口（不再越说越长 / 不再按句跳行）。
- 提示小卡：预生成缓冲（每段 Gemini 顺带备好 follow-up）→ 停顿**立刻弹**；与猫下状态**合并到一个固定槽位**，尺寸固定不跳。
- 暂停可靠性：阈值 4.8s→2.5s；`ENERGY_THRESHOLD` 0.003→0.006（环境噪音不再误判成说话）。
- KTV：flow/story 本地实时涨分（带原因）；emoji→lucide **彩色**图标；含义(purpose)显示完整；删"AI moments"；顶部加 🎯topic/mode；删常驻提示句、空事件框。
- 首次 **Navigator 引导**（锚定高亮 KTV/猫/Start，localStorage 只对新用户出一次）。
- 高光加强、音浪弱化、"Coach is following your story" 文案、白屏修复 + App 级 ErrorBoundary。

**结束页（Takeaway）**
- 早前：4 块结构、进步分值、按最弱指标建议、保存到 Library、原文引用。
- 本次：加了 `amplify`（放大）字段到 AI 结构 —— **3 大块渲染重排尚未完成**（见下）。

## 📌 2026-06-14 — Takeaway 3 大块渲染落地
- ✅🧪 **Takeaway 3 大块渲染重排完成**（`src/pages/TakeawayPage.tsx`，tsc+build 通过，未浏览器验证）：① Your run（Hero+鼓励+talked-about+What you did well+进步分值）② Level up（**Amplify 新上墙**+Change+Next Run Plan）③ Coach（Chatbox+Go again）。带数字徽标的大分区标题、长页下滑。审阅清单：[REVIEW-2026-06-14.md](./REVIEW-2026-06-14.md)。
- ✅🧪 顺手 🟢：TakeawayPage KTV 图标 emoji→lucide 并上色，与练习页统一。

## 📌 2026-06-15 — Gap 批次 + Takeaway 重排
- ✅🧪 Gap 批次 `87a6cd6`：首页去 streak/去裸分/CTA 改 Start Practice + 主题活动卡；My 改名（Practice growth / Settings / Practice feedback only）；coach-mode 信任 chip 推广；KTV 未得分弱化+得分高亮；清死代码。[spec](../specs/2026-06-15-gap-batch.md)
- ✅🧪 **Takeaway 重排**：精简鼓励(+1 quick win) → ② Level up（含 Next Run Plan，提前）→ ③ Your run in detail（讲了什么/更多做得好/进步条下移）→ ④ Coach。回应 PDF P4③"价值别被埋"。[spec](../specs/2026-06-15-takeaway-reorder.md)
- 报告对应项已翻 ✅。剩：Trying Point 全 app 推广（待定方案）、Supabase 后台恢复（总开关）。

## 🚨 2026-06-14 — 根因确诊：Supabase 后台没了
- 用户反馈"AI 不智能"。诊断琥珀条 reason = `Failed to send a request to the Edge Function`。
- 实测 `nslookup jyofoabobuwfowpctbfd.supabase.co` → **NXDOMAIN**（域名不解析），`supabase.com` 正常 → **后台项目已失效**（暂停/回收）。
- 结论：前端所有 Gemini 调用网络层失败 → 全程本地兜底。**代码无问题，需用户恢复/重建 Supabase**（步骤见 PROJECT-MEMORY 后台节）。本次前端改动（防截断/诚实兜底/prompt 升级/停顿优先 AI）在后台恢复后才会体现真效果。
- ⏸ 等用户：控制台看项目能否 Restore，或重建后给我新 URL+key（我来改 client.ts/config.toml + 写部署步骤）。

## 📌 2026-06-14 — AI 真听懂 + Navigator 空槽 + 停顿卡优先真 AI
- 🔍 **根因定位**：用户看到的 Takeaway "不智能"其实是 **AI 静默失败 → 本地关键词模板**（`createLocalTakeaway`）。Coach 问答同理。两者都走 `callGeminiProxy`。
- ✅🧪 **修**（全前端，无需部署）：①token 调大防截断（takeaway 1600/chat 900）②`takeawayError` 渲染成琥珀提示条 + reason（失败可见、可诊断）③prompt 升级（真实主题句/同义词升级/KTV 维度定制/连贯 say_this）④本地兜底去套路化。
- ✅🧪 **Navigator 空槽**：开练后第二步从指空卡槽改指**猫**(coachRef)，删 coachSlotRef。
- ✅🧪 **停顿卡优先真 AI**：有缓冲秒弹；无缓冲 thinking + 实时 AI(≤2.8s)→失败才本地（复活 resolvePauseReply/fetchFollowUpReply）。
- 审阅：[REVIEW-2026-06-14-ai-semantic.md](./REVIEW-2026-06-14-ai-semantic.md)。⚠️ **真 AI 是否跑通需用户真机看琥珀条 reason 反馈**。

## 📌 2026-06-14 — Navigator 扩展
- ✅🧪 **Practice 开练后第二段引导**（字幕 + 反馈卡槽位，Start 后 0.6s 弹，2 步）。
- ✅🧪 **Home 首页引导**（mode / 今日话题 / Start，3 步）。
- 🔧 组件 `PracticeOnboarding` → 泛化为 **`CoachmarkTour`**（`storageKey` prop + `hasSeenTour(key)`），三处引导各用独立 key。审阅：[REVIEW-2026-06-14-navigator.md](./REVIEW-2026-06-14-navigator.md)。

### 将来接着改（下次）
- 🟡 暂停阈值/ENERGY_THRESHOLD 按真机手感微调（需真机，本机无法实测麦克风）。
- 🟢 清理无用 CSS/函数（PracticeRoom 的 recentLines/resolvePauseReply/fetchFollowUpReply、index.css 的 practice-coach-strip/bubble-stack/listening-bubble*）。
- 🟢 后台 Supabase 落库（替 localStorage，需用户侧部署）、PracticeRoom 拆组件。

---

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

## 2026-06-02（晚）— 自动批次跑完 P2 + P3
全部 tsc+build 通过，**未浏览器验证**。审阅清单：[REVIEW-2026-06-02.md](./REVIEW-2026-06-02.md)（7 项 + ⚠️ 关键点）。
- P2：转录卡顿、KTV 真实化、字幕融合 B、C 高光、D 猫猫去框、AI 多层 fallback。
- P3：Takeaway 拆 4 块+按指标/高级建议、保存到 Library（localStorage + MyPage）。
- 每项都有 `Design/specs/2026-06-02-*.md`，TODO Specs 索引已全部挂上。
- 明天用户审阅；重点看 ⚠️ 项（KTV 启发式阈值、停顿毛玻璃遮历史、Takeaway 重新出现分数、多层 fallback 会换一次词、Library 仅本地）。

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
