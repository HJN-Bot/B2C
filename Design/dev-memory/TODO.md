# Roadmap / TODO — SpeakSpark

> 状态图例：`✅`已实现+自测(tsc/build)、`🧪`待浏览器验证、`⬜`待 spec、`⏸`暂缓。优先级 🔴高 / 🟡中 / 🟢低。
> 约定：每个改动点先在 `Design/specs/` 写四板块 Spec（修改建议/解决思路/技术方案/验证测试），spec ↔ 本 TODO 双向 link。
> 原始反馈原话见底部「📦 归档」；本表是经过整理的执行计划。

---

## 🎯 Gap TODO（对照设计走查 · 2026-06-15）

> 来源：[报告](../reports/iteration-report-2026-06-14.html) 里标 🟡/⛔ 的项 = 还没改的。按"能不能现在动手"分三档。

### 🟢 现在就能改（纯前端，不依赖后台）—— 2026-06-15 批次已做 `87a6cd6`
- [x] 🟡 **首页 streak 去压力**（P2-1）：→ "5 practices this week"。`✅🧪` [spec](../specs/2026-06-15-gap-batch.md)
- [x] 🟡 **首页 "92 pts" 去分数**（P2-2）：→ "Phrase saved · … win" 证据。`✅🧪`
- [x] 🟡 **首页 CTA 改词**（P2-3）：`Start Speaking` → `Start Practice`（首页+练习页）。`✅🧪`
- [x] 🟡 **My 页改名**（P6-3）：`Ability portrait` → `Practice growth`。`✅🧪`
- [x] 🟡 **My 页改名**（P7-2）：`User management` → `Settings`。`✅🧪`
- [x] 🟡 **My 页文案**（P7-3）：Coach mode → `Practice feedback only`。`✅🧪`
- [x] 🟡 **coach-mode 标签推广**（P1/跨页）：信任 chip 推到练习页(开练前)+My 头部。`✅🧪`
- [~] 🟡 **首页主题活动**（#5/P5）：曾加 4 张主题卡，但与 Practice Mode + Today's Starter 重复 → **已移除主题卡**（保留模式选择 + 今日话题覆盖"练什么"）。如需独立主题入口再单开。
- [x] 🟢 清死代码：删 `recentLines` + 无用 `practice-coach-strip/bubble-stack/listening-bubble*`。`✅`
- [x] 🟡 **Trying Point 概念推广**（P6-2）：抽共享源 `lib/trying-point.ts`；首页加「本周 trying point」卡（点击进练习）；My 读共享源；Takeaway 的 one move 改叫「Your next trying point」——闭环。`✅🧪` [spec](../specs/2026-06-16-trying-point-propagation.md)

### 🟠 需要你先拍板（取舍/决定）
- [x] 🟡 **说话中 KTV 露出 vs 隐藏**（P3-2）：**定调=保留作鼓励框架**，未得分弱化/灰、得分上色、刚加分高亮。`✅🧪`
- [x] 🟡 **Next Run Plan 提前**（P4-3）：定调=不置顶裸 hero，而是 Takeaway 重排为「精简鼓励 → ② Level up（含 Next Run Plan）→ ③ 详情 → ④ Coach」，价值不再被埋。`✅🧪` [spec](../specs/2026-06-15-takeaway-reorder.md)

### 🔵 后台相关
- [x] 🔴 **Supabase 后台已恢复**（2026-06-18，`jyofoabobuwfowpctbfd`）；`gemini-proxy` 实测真实返回。
- [x] ⛔ **验证真 AI**：Takeaway 真实主题总结/同义词/对准最弱 KTV 维度建议/连贯 say_this，Coach 真回复——已验证。**并修了 token 截断 bug**（thinking 吃 token，maxOutputTokens 1600→4000）`ef98cbf`。
- [ ] 🔴 Supabase `sessions` + `highlights` 真·落库（替 localStorage）——依赖账号体系，见下。

---

## 🧪 PM 走查 backlog（2026-06-18 · 一点点改）

> 来源：以最严格 PM 视角走查 + 用户反馈。配套 [报告](../reports/iteration-report-2026-06-14.html) 决策项。

### 已做（今天）
- [x] 练习页**开练前 faint 占位框**（coach 卡 + Transcript 框浅浅框出位置，不再像空页）`1f5b195`
- [x] **Trying Point 真闭环**：Takeaway 的 one_move → 存 `speakspark.nextTryingPoint` → 首页显示那一个、练完更新（`lib/trying-point` set/getNextTryingPoint）`1f5b195`

### P0 · 决定项（report 里作为"待你拍板"）
- [ ] 🔴 **真账号体系（auth）**：现全是 localStorage + mock "Alex"。要绑定用户/跨设备/家长/付费都靠它。推荐 Supabase Auth（邮箱/手机/OAuth）→ 拿 `user_id` → 表加 user_id + RLS。这是 `sessions/highlights` 落库 + 录音的前置。
- [ ] 🔴 **录音 + 合规**（checkpoint，一起想）：要不要录音/存音频（Supabase Storage）；11–15 岁未成年人隐私/同意/留存/删除。先决定再开发。
- [ ] 🟡 **移动端语音识别**：现用浏览器 SpeechRecognition（移动端 Safari 不支持）。备选：① 走 `analyze-voice` Edge Function 把音频发云端 STT（仓库已有该函数雏形）；② 接第三方 STT（如 Deepgram / Google STT / Whisper API）。需选型。
- [ ] 🟡 **KTV 计分校准**：当前是本地启发式（参考 IELTS/TOEFL 维度，非真打分）。要不要拿真人录音校准阈值、或改成 AI 评分。

### P1 · 体验
- [~] 🟡 **AI 延迟 < 3s**：代码已就绪——`gemini-proxy` 转发 `thinkingConfig`、lib 加字段、练习页两处实时调用传 `thinkingBudget:0`（gemini-2.5-flash thinking 吃 700-800 token + 延时）。`2026-06-19` ⚠️ **edge function 需用户侧部署才生效**（本机无 CLI）。Takeaway 保留 thinking。[spec](../specs/2026-06-19-polish-batch.md)
- [x] 🟢 首次/空数据态更鼓励：**首页 Last Highlight 接真实历史 + 首次空状态**（删了写死的假 highlight）。`✅🧪`（My 的空历史/0 phrases 文案此前已有）
- [ ] 🟢 **埋点/分析**：不在 UI 显示，是后台记录用户行为事件（如"完成练习/点了 Try Again/停顿弹卡"）→ 看漏斗/留存。可接 PostHog / Supabase 自建表。"用数据鼓励" = 用真实证据（练了几次、进步在哪、存了哪些词）做正向反馈，而非压力型 streak。
- [x] 🟢 Practice 麦克风拒绝/无语音/断网兜底文案过一遍：不支持/出错/麦克风关 三种文案改友好可操作。`✅🧪`

---

## 🧭 北极星（核心痛点 · 2026-06-02）

> 用户原话精炼：**"说和交互时重点会偏移，不知道该看哪里。真实的 KTV 指标、语音转录、AI 实时听懂——这些核心都没做好，没有眼前一亮的感觉。"**

**北极星 = 练习中「我一眼知道该看哪 + 它真的听懂了我说的」。** 下面所有事都服务这一句。三根支柱：
1. **转录稳**（说快了也不卡、不一次性吐字）
2. **KTV 真**（指标含义清楚、和我说的内容强相关、有丝滑的分值冲击）
3. **AI 实时懂**（反应快、像真人、多层 fallback）

---

## 📄 Specs 索引（改动 ↔ 方案 ↔ 状态）

| Spec | 对应 | 状态 |
|------|------|------|
| [2026-05-31 停顿 AI 反馈](../specs/2026-05-31-pause-ai-feedback.md) | A / R1 | ✅🧪 |
| [2026-05-31 练习页活态打磨](../specs/2026-05-31-practice-live-polish.md) | A2 | ✅🧪 |
| [2026-06-02 转录卡顿](../specs/2026-06-02-transcription-lag.md) | P2·转录 | ✅🧪 |
| [2026-06-02 KTV 真实化](../specs/2026-06-02-ktv-real.md) | P2·KTV | ✅🧪 |
| [2026-06-02 字幕融合 B](../specs/2026-06-02-caption-merge.md) | P2·B | ✅🧪 |
| [2026-06-02 高光+猫猫 C/D](../specs/2026-06-02-highlight-and-cat.md) | P2·C/D | ✅🧪 |
| [2026-06-02 多层 fallback](../specs/2026-06-02-realtime-fallback.md) | P2·AI实时感 | ✅🧪 |
| [2026-06-02 Takeaway 拆4块](../specs/2026-06-02-takeaway-4blocks.md) | P3·G | ✅🧪 |
| [2026-06-02 保存到 Library](../specs/2026-06-02-save-to-library.md) | P3·保存/P4 | ✅🧪 |
| → 全部见 [审阅清单 REVIEW-2026-06-02](./REVIEW-2026-06-02.md) | P2+P3 自动批次 | ✅🧪 |
| [2026-06-11 说话板块重设计](../specs/2026-06-11-speaking-panel.md) | P2·说话板块(A/B/C/D) | ✅🧪 |

---

## 🗺️ 主计划（按页 · 含优先级）

### P2 · 练习页（问题最集中，先攻这里）

**转录质量（🔴 最底层，先修）**
- [x] 🔴 **转录卡顿**：根因=`onresult` 每次 interim 都跑句型识别+全量扫描 → 节流(≥700ms/final)+只扫末200字。`✅🧪` [spec](../specs/2026-06-02-transcription-lag.md)
- [x] 🔴 **AI 实时感慢**：多层 fallback——700ms 本地秒答 + Gemini 2.5s 预算升级，深度留第三页。`✅🧪`
- [x] 🔴 **顶部 Coach 栏还在动** → A2 已删顶部状态条（请硬刷新确认）。

**KTV（🔴 核心"眼前一亮"）**
- [x] 🔴 **指标定义不明**：Flow（持续说）/Story（连接词）现在本地实时涨且带原因；四指标都动。`✅🧪`
- [x] 🟡 **卡拉OK 分值冲击**：沿用 bar transition + activeKtvMetric 高亮 + score-jump；C 高光也加强了。`✅🧪`
- [x] 🟡 练习**导航**：开练后第二段引导补上字幕+反馈卡（Start 后 0.6s 弹）。`✅🧪` [spec](../specs/2026-06-14-navigator-expand.md)
- [ ] 🟡 KTV 在**首页也要露出**（导航已做，KTV 露出仍待）。
- [ ] 🟡 说话中隐藏细节指标、结束后作为 private evidence（PDF P3）——与"露出"权衡，待定。

**布局 / 注意力（🔴 不知道看哪）**
- [x] 🔴 **中间大白区 + B 字幕**：合并面板——历史可滚、当前句高亮、铺满 flex；非说话态毛玻璃覆盖。`✅🧪`

**高光 & 猫猫**
- [x] 🔴 **C 高光加强**（R3）：5xl 发光分数 + 外扩 ping 光环 + 更强渐变。`✅🧪`
- [x] 🔴 **D 猫猫去圈**（R4）：clip 88→112px、去圆角/overflow，不再被裁。`✅🧪`（彻底居中仍需重做 sprite 资产）
- [ ] 🟡 **E 更跟手/灵动**（R5）：随情景对应效果——部分由 KTV/高光/多层 fallback 改善，剩余待评估。

### P3 · 结束页 Takeaway（很杂、不言之有物）

- [x] 🔴 **G 拆 4 块**（R7）：① 鼓励 → ② 进步(分数+什么涨了) → ③ Coach → ④ 再试。`✅🧪`
- [x] 🔴 **按指标建议 + 高级句式/词汇**：prompt 升级——make_stronger 对准最低指标，say_this 给高级模型句、reuse_words 给升级词。`✅🧪`
- [x] 🔴 **引用原对话**：#4 的 summary + "You said: …" 引用保留。`✅🧪`
- [x] 🔴 **Takeaway 重构为 3 大块（长页）**：① Your run（鼓励+讲了什么+做得好+分值）② Level up（**Amplify**+Change+Next Run Plan）③ Coach（Chatbox+Go again）；KTV 图标 emoji→lucide 上色。`✅🧪` [spec](../specs/2026-06-11-takeaway-3blocks.md) · [审阅](./REVIEW-2026-06-14.md)
- [ ] ⏸ P4-3 Next Run Plan 置顶 hero（仍暂缓）。
- [ ] 🟡 更"懂我过去说了什么"——可在 prompt 里带入历史 sessions，下一轮做。

### P4 · 资料库 / 历史

- [x] 🔴 **数据落库（客户端）**：`session-history.ts` localStorage 保存本次，MyPage 真实历史。`✅🧪`（真·Supabase 落库见后台）
- [ ] 🟢 **H 历史回放**（R8）：听录音/演播 + 点开看详情，未做（低优先）。

### P1 · 首页

- [ ] 🟡 **#5/P2 主题活动卡**：科普英语 / TOEFL / 旅游 / 日常对话。
- [x] 🟡 **首页 Navigator 引导**：进首页弹 3 步（mode / 今日话题 / Start），只出一次。`✅🧪` [spec](../specs/2026-06-14-navigator-expand.md)
- [ ] 🔴 **P2 情感钩子**：streak/分数 → 学习证据 / 历史 / 一条 Coach Note，与 Takeaway **闭环**。
- [ ] 🟡 CTA "Start Speaking" → 测 "Start Practice"。
- [ ] 🟡 首页露出 KTV（见 P2·KTV）。

### 跨页原则（PDF 7 页走查）

- [ ] 🔴 coach not scorer：全程去评分化/比赛化文案。
- [ ] 🔴 MyPage "User Management" → "Settings"（P7）；🟡 "Ability Portrait" → "Practice growth"（P6）。
- [ ] 🟡 常驻 coach-mode 边界标签（Takeaway 已有，推广到全 app）。

### 工程 / 后台

- [ ] 🔴 Supabase `sessions` + `highlights` 落库（与 P3/P4 联动）。
- [ ] 🟡 PracticeRoom 拆子组件（字幕层 / KTV 条 / Bottleneck 卡 / 猫猫）——文件已很大，借重构同时改。
- [ ] 🟡 `usePracticeSession` hook 抽录音逻辑。
- [ ] 🟢 E2E（Playwright）核心流程。

---

## ▶️ 建议执行顺序（待你确认）

1. **P2 转录卡顿**（🔴 bug，最底层，其它都依赖words稳）
2. **P2 KTV 真实化**（核心"眼前一亮" + 解决"不知道看哪"）
3. **P2 布局/字幕 B + 中间区用满 + C 高光**（注意力聚焦）
4. **P2 AI 实时感 / 多层 fallback**
5. **P3 Takeaway 拆 4 块 + 落库** → 带出 **P4 Library**
6. **P1 首页 / 跨页文案 / 后台**

---

## ✅ 已完成（自测过 🧪 待你浏览器验证）

| 提交 | 内容 | 看哪里 |
|------|------|--------|
| `e81c406` | HashRouter + vercel.json | 全站刷新不 404 |
| `bce2179` | Chatbox 多轮对话 | `#/session-end` |
| `fa5b2c2` | Takeaway walkthrough（P4-1/2/4、P5-1/2/4、#4） | `#/session-end` |
| `9410ca1` | 三个 Mode（Free Talk/Exam Prep/Story） | Home→Practice→Takeaway |
| `9e8cb75` | 单行 Karaoke 字幕 + 音浪弱化 + coach 文案 | `#/practice` |
| `dee6b0f` | TopicHeader + 冷启动关键词 | `#/practice` |
| `a2f2af1` | 猫猫 thinking 状态 + 漂移容差 88px | `#/practice` |
| `0c9d4d7` | **A** 停顿真实 AI 反馈（应一声→真问，删 900ms 兜底） | `#/practice` 停顿 |
| `10bcc8f` | **A2** 删顶部状态条 / 字幕填满 / 反馈 pin 住 / 猫猫放慢 | `#/practice` |

> 注：A2 的"字幕填满 / 删顶部状态条"用户反馈仍有问题（见 P2），需复查是否生效或方案不对。

---

## 📦 归档 · 原始反馈原话（可追溯）

### PDF 7 页走查 + 5 条反馈
见 `Design/iterations/feedback-2026-05-06.md`（#1 单行字幕 / #2 去音浪 / #3 话题提示 / #4 自上而下+引用 / #5 主题活动；7 页：coach not scorer 等）。

### 2026-05-31（R1–R8 原话）
- **R1** 停顿没真实 AI 反馈，要像真人、基于内容给问题/方向 → ✅A
- **R2** 字幕融合一个面板、单行高亮+可上滚、非说话态毛玻璃 → B
- **R3** "好的部分/高光"太弱 → C
- **R4** 猫猫被圆框遮，去框或居中 → D
- **R5** 整体卡、不灵动、不能按情景对应 → E
- **R6** 卡拉OK 分值冲击不丝滑；首页没 KTV；练习没导航 → F
- **R7** Takeaway 拆 4 块 → G
- **R8** 历史回放/Last Library 听不到（低优先） → H

### 2026-06-02（本次抱怨原话）
- 顶部 Coach 栏还在动。
- 中间字幕最严重：不是铺满全屏，只在窄边框操作；猫猫下面那块大白区 90% 没内容、利用不到（是给 AI 提示预留的吗？）。
- 转录速度卡顿：说快了会停 20–30s 再一次性吐字。
- AI Coaching 实时感慢：能不能做多层 fallback？常见上下文本地快速答，深度的留到第三页交互。
- 四个 KTV 指标定义非常不明确：只有一直说 sentence 才有动静，其它变化非常慢，不确定评分标准；story 到底怎么算？
- Takeaway 没针对指标/评分给建议；"下一次尝试"太像、太简单，没有高分句式/词汇；很杂乱不知道看哪；不直接引用原对话和框架；不像懂我过去说了什么；内容没保存/转录成第四页 Library 一项。
- 核心：说/交互时重点偏移、不知道看哪；真实 KTV + 转录 + AI 实时听懂这三个核心没做出眼前一亮。

### 2026-06-11（练习页"说话板块"原话）
- 字幕会随说话频次越扩越大，不要；现在 ~8 行要压成 3/4 ≈ 5 行。
- 说话内容要往上滚，当前句一直保持在中间那一行。
- 整体效率不够好；猫猫还在动，可以放中间一点；下面对话框可左右两列灵动一点；对话内容太多。
- 停顿≥3s 反应还是特别慢，AI 不知道下面问什么——大问题。能不能迅速给上下文、预先准备 follow-up 留缓冲。
- AI 怎样灵活实时跟上：3s 内返回就用模型，不行就多做 use case 用本地仿出问答感。
- Practice 版面问题大，怎样效率最好？（用 Grill Me / 竞对参考）
- **Grill 已定**：A 字幕 5 行·当前句居中·固定上滚；B 预生成缓冲；C 停顿 3s；D 竖排·猫居中·一张精简反馈卡（左右两列移动端不划算）。
