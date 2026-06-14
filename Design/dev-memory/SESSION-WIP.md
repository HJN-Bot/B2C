# SESSION WIP — 当前进行中

> 这次 session "做到哪了"。每次开工先看这里。稳定事实放 [PROJECT-MEMORY.md](./PROJECT-MEMORY.md)，完整待办放 [TODO.md](./TODO.md)。

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
