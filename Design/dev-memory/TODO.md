# TODO — 之前跟你说过的所有修改

> 来源：`Design/iterations/feedback-2026-05-06.md`（5 条反馈 + 7 页设计走查 PDF）+ CHANGELOG 已知问题。
> 状态标记：`[x]` 已实现并自测(tsc+build 通过)、**🧪待你浏览器验证**；`[ ]` 未做；`⏸` 暂缓。优先级：高 🔴 / 中 🟡。

---

## 📋 明天审阅清单（2026-05-29 当天改动）

> 以下都已 `tsc --noEmit` + `npm run build` 通过，但**未在浏览器人工验证**，请逐项 🧪。
> dev 启动：`npm run dev` → http://127.0.0.1:5173/（路由带 `#`）。看完整复盘页要先去 `#/practice` 练一次。

| 提交 | 内容 | 看哪里 | 🧪 验证点 |
|------|------|--------|-----------|
| `e81c406` | HashRouter + vercel.json | 全站 | 刷新子页面不 404 |
| `bce2179` | Chatbox 多轮对话 | `#/session-end` | 连续追问是否带上下文 |
| `fa5b2c2` | Takeaway walkthrough P4-1/2/4、P5-1/2/4、#4 | `#/session-end` | headline 文案 / 去成绩单 / 中性 fallback / 新 preset / What's growing 文字趋势 / Coach mode pill / summary + 原文引用 |
| `9410ca1` | 三个 Mode | Home → Practice → Takeaway | 选 Mode 是否记住、各页是否显示、复盘语气是否贴合 |

**暂缓 / 待你拍板**：P4-3（Next Run Plan 置顶 hero）；「先录后生成 coaching」概念待当面演示；Mode 与 #5 主题卡片的 Home 排版协调。

---

## 🎯 Takeaway walkthrough（`src/pages/TakeawayPage.tsx`）—— 2026-05-29 完成大部分

来自 PDF Page 4（顶部）/ Page 5（下半部）+ feedback #4。

### Page 4 — Takeaway 顶部
- [x] **P4-1** 奖杯 🏆 → 祝贺 emoji 🎉 + eyebrow "Practice complete"
- [x] **P4-2** 去掉 4 格成绩单；headline 改 `celebrationHeadline()` 可爱轮换文案（"Your spark stayed lit for 41s! 🎉" 等）
- [ ] **P4-3** 🔴 Next Run Plan 提为 hero card 置顶 —— **用户先放着，再说（暂缓）**
- [x] **P4-4** 红色 fallback → 中性 "Coach plan is ready from this run"；去掉 raw provider error；badge 改 "From this run"；离线提示气泡由红 system 改中性 coach/amber

### Page 5 — Takeaway 下半部
- [x] **P5-1** preset 扩为教练式短提问：Ask me one question / My highlight / Level up my words / Make my story fun / Shape my story（system prompt 加 "coach 只问不答、不写完整稿"）
- [x] **P5-2** Progress map → "What's growing" 文字趋势 + Strong/Growing/Just starting 标签（去掉分数条和数字）
- [x] **P5-3** 保留 Practice Again CTA（双按钮循环不动）
- [x] **P5-4** 顶部加常驻 pill "Coach mode · practice feedback only"（ShieldCheck 图标）

### feedback #4 — 自上而下 + 原文引用
- [x] **#4** 新增 "What you talked about" summary 区放在建议之前；what_worked/make_stronger 改 `Evidence{point,quote}`，每条附 "You said: '…'" 原文引用（schema/prompt/normalize/local fallback 全改）

### Takeaway 待跟进
- [ ] 浏览器用真实 session 数据验证（先练一次再看 `#/session-end`）
- [ ] P4-3 hero card 置顶（暂缓中）
- [x] **三个练习 Mode（已实现，2026-05-29）**：**Free Talk / Exam Prep / Story**（全英文）。共享模块 `src/lib/practice-mode.ts`（localStorage `speakspark.practiceMode`，默认 Free Talk）。
  - Home：greeting 下方新增 3 格 Mode 选择器，持久化。
  - PracticeRoom：顶部 header 显示当前 Mode 标签（emoji + label）。
  - TakeawayPage：常驻 pill 显示 `{emoji} {Mode} · practice feedback only`；`coachStyle` 注入 takeaway prompt + chat system prompt。
  - 待跟进：Mode 选择器以后要和 #5 主题活动卡片在 Home 上排版协调。

---

## 练习页 PracticeRoom（进行中，2026-05-29）

- [x] **#1 / P3** 字幕：多行滚动 → **单行 Karaoke**（`lastLine()` 取最后一句、上方 `.karaoke-mask` 渐隐淡出）🧪
- [x] **#1** **End 按钮**：结构上本就在独立顶部栏（与字幕区分离），不会被字幕挤动 → 已满足，无需改 🧪确认
- [x] **P3 文案** "AI is listening" → **"Coach is following your story"**；`aiState` 那句也改 "Following your last phrase" 🧪
- [x] **#2** 音浪**弱化**：去掉卡片框/标签，slim 34px + opacity 0.45/0.25，保留波动但不抢注意力 🧪
- [ ] **#3** 🔴 顶部**常驻 TopicHeader**：目前 topic 只在路由 state 有值时显示，Home 还没传 topic → 需 Home 选话题时带过来 + header 常驻
- [ ] **#3** 🔴 冷启动**关键词提示**；讲过的关键词**微微变色**（现有 highlightWords chips + 蓝色高亮算半个，缺"冷启动建议关键词"）
- [ ] 猫猫动画 🔴 **保留且重要**：做得好看、**消除漂移风险**、**状态自动切换**（speaking→listening / 处理中→thinking / Use it→excited→listening）—— 下一步做
- [ ] **P3 指标** 🟡 说话中隐藏详细 KTV 指标，结束后才作为 private evidence
- [ ] **P3 加载** 🟡 「先录后生成 coaching，AI 就绪不阻塞」= 用户开口就能录音/出字幕，AI 反馈晚点到也不挡练习；不要"等 AI ready 才能说"。**用户说没太看懂，下次当面演示这条**

---

## 首页 Home（下一批，用户已确认方向）

- [ ] **#5 / P2** 🟡 新增「主题活动」卡片区：科普英语 / TOEFL / 旅游 / 日常对话（用户赞同新增）
- [ ] **P2** 🔴 情感钩子改为**学习证据 / 历史 / 一条 Coach Note**，和 Takeaway 最后那些东西**闭环**起来（用户明确：首页 ↔ 结束页打通）
- [ ] **P2** 🟡 CTA "Start Speaking"（比赛感）→ 测 "Start Practice" / "Practice this topic"

---

## 成长 / 设置页 MyPage（之后做）

- [ ] **P6** 🟡 "Ability Portrait"（成绩单感）→ "Practice growth"，偏叙述证据
- [ ] **P7** 🔴 "User Management"（内部感）→ "Settings"
- [ ] **P6/P7** 🟡 Trying Point 概念推广到全 app；coach-mode 边界显式化 "Practice feedback only" / "Contest-safe coaching on"

---

## 工程 / 后台（积压）

- [ ] Supabase 数据写入（sessions + highlights 表）
- [ ] PracticeRoom 拆子组件（WaveformCompanion / KTVScoreBar / BottleneckCard …）
- [ ] `usePracticeSession` hook 抽象录音逻辑
- [ ] E2E 测试（Playwright）覆盖核心流程
