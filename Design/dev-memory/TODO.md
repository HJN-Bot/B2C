# TODO — 之前跟你说过的所有修改

> 来源：`Design/iterations/feedback-2026-05-06.md`（5 条反馈 + 7 页设计走查 PDF）+ CHANGELOG 已知问题。
> 勾掉 = 已落地并验证。优先级：高 🔴 / 中 🟡。

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

## 练习页 PracticeRoom（下一批，用户已确认方向）

- [ ] **#1 / P3** 🔴 字幕：多行滚动 → **单行 Karaoke**（已说完淡出）
- [ ] **#1** 🔴 **End 按钮固定**，不随字幕/转录抖动移动
- [ ] **#3** 🔴 顶部**常驻 TopicHeader**（用户赞同）
- [ ] **#3** 🔴 冷启动**关键词提示**；讲过的关键词**微微变色**（用户赞同）
- [ ] **P3 文案** 🔴 "AI is listening" → 固定用 **"Coach is following your story"**（用户选定）
- [ ] **#2** 🟡 音浪**弱化**：保留能波动，但不那么吸引注意力（不是完全删，是降级）
- [ ] 猫猫动画 🔴 **保留且重要**：做得好看、**消除漂移风险**、**状态自动切换**（speaking→listening / 处理中→thinking / Use it→excited→listening）—— 用户明确要做
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
