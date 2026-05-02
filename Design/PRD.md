# PRD — SpeakSpark 英语口语科普演讲练习平台

**版本**: v0.9.3
**日期**: 2026-05-02
**状态**: Sprint 2.2 AI Takeaway Builder + 可追问 Coach Chatbox

---

## 1. 产品定义

### 1.1 一句话定位

SpeakSpark 是一款面向 **6–9 年级初中生（11–15 岁）** 的英语科普演讲 AI 陪练工具。

它不是考试评分器，也不是通用聊天机器人，而是帮助学生：

1. 开口说出来。
2. 卡住时继续说下去。
3. 把这次说出来的内容变成下一次能直接复用的演讲素材。
4. 长期看到自己在变强。

核心体验哲学：**零摩擦开口 → 被听见 → 被接住 → 有 takeaway → 下次更会说**。

### 1.2 当前真实需求

| 真实需求 | 解释 | 产品响应 |
|----------|------|----------|
| 低门槛启动 | 目标用户可能英语基础弱，开口前压力大 | 打开即练，不要求先选题、看教程、设置参数 |
| 能继续说 | 用户常常不是发音不准，而是不知道下一句说什么 | 4–5 秒真实停顿后给 content-aware follow-up |
| 被看见 | 用户需要知道系统真的听到了自己的内容 | 字幕、音浪、phrase 高亮、事件分数即时反馈 |
| 可复用收获 | 练完不能只给分，要给下次能用的词、句、稿 | Takeaway：高亮词、可改进点、polished script、next move |
| 长期成长感 | 用户需要感到系统记得自己，而不是每次从零开始 | Growth Memory：能力画像、topic memory、phrase reuse、卡壳画像 |

### 1.3 很棒但不是当前刚需

| 功能 | 为什么好 | 为什么不是第一优先级 |
|------|----------|----------------------|
| 音素级发音纠错 | 对发音训练有价值 | 会把产品带向 ELSA 赛道，偏离“科普演讲内容表达” |
| 完整游戏成就系统 | 能增强长期留存 | 必须先有真实 takeaway，否则成就只是皮肤 |
| TTS 跟读包 | 很适合素材复用 | 需要先沉淀稳定的高光句和 polished script |
| 多角色 AI 陪练 | 有陪伴感 | 当前更急的是停顿检测和内容相关反馈 |
| 教师/班级管理 | 商业化潜力强 | MVP 应先验证学生单人练习闭环 |

---

## 2. 评分与反馈依据

### 2.1 口语评价参考

SpeakSpark 不照搬考试评分，但需要借鉴成熟口语 rubrics，避免反馈变成泛泛的 “Good point”。

| 来源 | 关键维度 | 对 SpeakSpark 的启发 |
|------|----------|----------------------|
| IELTS Speaking | Fluency and Coherence / Lexical Resource / Grammatical Range and Accuracy / Pronunciation[^ielts-criteria] | 说明口语不只是发音，还包括流畅度、词汇资源、语法范围、话题展开 |
| IELTS Band Descriptors | 高分强调 topic development、less common vocabulary、complex structures、cohesive features[^ielts-band] | 可转化为：继续说、好词、好句型、完整观点 |
| TOEFL iBT Speaking | Delivery / Language Use / Topic Development[^toefl-rubric] | 更适合产品化为三类反馈：表达是否持续、语言是否有效、内容是否展开 |
| Progressive Disclosure | 复杂功能分层展示，先显示当前任务需要的信息[^progressive-disclosure] | 首页/练习页不能塞满报告；高级设置、历史画像放第四板块 |

### 2.2 SpeakSpark 自定义训练指标

当前 KTV 四指标应从“死分数”改成“训练目标”。建议从 `Fluency / Vocabulary / Logic / Duration` 升级为：

| 产品指标 | 对应 rubric | 目标 | 可检测事件 |
|----------|-------------|------|------------|
| **Flow** | IELTS Fluency / TOEFL Delivery | 帮用户连续说下去 | 连续讲话、少停顿、从卡壳后恢复 |
| **Words** | IELTS Lexical Resource | 抓住可复用高级词和准确搭配 | unique / incredible / sustainable / renewable energy 等 |
| **Sentences** | IELTS Grammar Range / TOEFL Language Use | 鼓励更强句型 | 情态句、从句、被动、比较、因果句 |
| **Story** | IELTS Coherence / TOEFL Topic Development | 让内容完整展开 | claim → example → evidence → impact |

`Duration` 不应作为核心主指标，而应降级为 `Stamina milestone`：例如 “你这次坚持讲了 42 秒”，作为奖励和留存反馈。

### 2.3 反馈语言原则

| 反馈类型 | 可以出现 | 不应该出现 |
|----------|----------|------------|
| 讲话中 | “Caught ‘incredible’” / “Strong phrase saved” | “Can you talk about this topic?” |
| 真停顿后 | “You mentioned renewable energy. Can you give one real example?” | “Keep going” |
| 结束页 | “Use this sentence next time: …” | 只给总分 |
| 长期画像 | “You are getting better at examples.” | 空泛 badge |

---

## 3. 竞品分析

### 3.1 竞品对照

| 竞品 | 强项 | 痛点/空白 | SpeakSpark 机会 |
|------|------|-----------|----------------|
| **ELSA Speak** | 发音纠错、音节级反馈、AI pronunciation coach[^elsa] | 强在“说得准”，弱在原创演讲内容展开和素材复用 | 不拼音素纠错，专注“科学观点讲清楚、讲完整” |
| **Yoodli** | 成人 AI speech coach，覆盖 presentation / interview，提供 pacing、filler、follow-up 和报告[^yoodli] | 成人职场感强，学生练习的游戏反馈、情绪奖励和下次可练稿弱 | 做更轻、更即时、更适合 11–15 岁的练习体验 |
| **Speeko / Speakio** | pace、tone、fillers、clarity、word choice 等 public speaking 指标[^speeko] | 多是表现纠错，缺少把用户自己的内容沉淀为下一轮素材 | 把指标变成事件分数和 reusable bank |
| **Duolingo Max** | AI roleplay / video call，强游戏化和低压力对话[^duolingo] | 偏课程和对话，不是 3–5 分钟原创演讲排练 | 借鉴陪伴感，但服务“我的科普演讲” |
| **Cake / Speakerly** | native clips、跟读、role-play、AI pronunciation feedback[^cake] | 固定内容消费多，原创表达沉淀少 | 让学生自己的表达成为素材 |

### 3.2 白色地带

市面上缺少同时满足以下条件的产品：

- 针对 **K-12 科普演讲**，不是成人会议或泛语言学习。
- 练习中能 **接住停顿**，而不是只在结束后出报告。
- 能 **即时点亮高质量词句**，给用户成就感。
- 结束后能给 **可直接复用的 polished script / next move**。
- 长期形成 **能力画像和素材记忆**。

---

## 4. 三层功能设计

### 4.1 基础功能：没有就不能试用

| 模块 | 目的 | 当前状态 | Gap |
|------|------|----------|-----|
| Live Caption | 让用户知道系统在听 | 已接 Web Speech API | 需提升跨浏览器提示和滚动体验 |
| Waveform | 0 延迟听觉存在感 | 已有 Canvas 音浪 | 视觉仍偏普通，需要和状态更强绑定 |
| True Pause Detection | 真卡住时接住用户 | 已有 VAD，但不稳定 | 需要独立 `lastVoiceAt` 检测，不被 Gemini processing 阻塞 |
| Passive Phrase Highlight | 讲话中点亮好词好句 | 已有基础词句高亮 | 词表太粗，抓取不准，需高价值词优先 + 数量限制 |
| KTV Event Score | 指标服务训练目标 | 已开始事件化 | 需要从 Flow / Words / Sentences / Story 重构 |
| Session End | 练完有真实总结 | 目前仍有 mock | 需要真实 transcript、真实 highlights、真实 next move |

### 4.2 核心功能：产品差异化

| 模块 | 用户价值 | 验收标准 |
|------|----------|----------|
| Content-aware Follow-up | 基础弱用户能继续展开 topic | 停顿 4–5 秒后，问题必须引用用户刚说过的内容 |
| High-value Phrase Engine | 用户知道自己哪里说得好 | 抓 `unique`, `incredible`, `sustainable` 这类词优先于 `interesting` |
| Sentence Pattern Feedback | 鼓励更成熟表达 | 能识别情态句、从句、因果句、比较句、被动句 |
| Story Builder | 帮用户说完整 | 反馈围绕 claim / example / evidence / impact |
| Takeaway Builder | 下次能直接用 | 给可复用词、可改进点、polished script、juicy next move |
| Reward Moment | 练完感觉 “I made it” | 结束页先给情绪奖励，再给报告 |

### 4.3 增值功能：留存和扩展

| 模块 | 价值 | 时机 |
|------|------|------|
| Growth Memory | 系统长期认识用户 | Sprint 3 |
| Topic Memory | 下次 follow-up 更贴合 | Sprint 3 |
| Phrase Reuse Bank | 好词好句反复复用 | Sprint 3 |
| Coach Settings | 调整追问风格和 prompt | Sprint 3 |
| Growth Pulse | 可视化进步 Wow Moment | Sprint 3 |
| TTS Voice Pack | 跟读自己的高光句 | 二期 |
| Teacher View | 教师查看练习报告 | 二期 |

---

## 5. 页面结构与动态工作流

### 5.1 四个板块

| 页面 | 目标 | 关键内容 | 截图占位 |
|------|------|----------|----------|
| Page 1 Start / Loading | 启动开口 | 上次进步、今日 starter、一键开始 | `[截图：Start]` |
| Page 2 Practice | 实时伴练 | “AI 正在听”中间板块、像素陪练、字幕、高亮、KTV 事件、底部音浪、停顿追问标签 | `[截图：Practice]` |
| Page 3 Takeaway | 练完有收获 | Reward、progress stats、Next Run Plan、what worked、make stronger、Coach Chatbox | `[截图：Takeaway]` |
| Page 4 My | 长期画像 | 历史、Trying Point、能力趋势、topic memory、phrase bank、coach settings、用户管理 | `[截图：My]` |

底部 App Tab 固定为四栏：

| Tab | 路由 | 作用 |
|-----|------|------|
| Start | `/` | Loading / Launch page，低摩擦启动 |
| Practice | `/practice` | 实时练习房间 |
| Takeaway | `/session-end` | 本次练习复盘；无 session 时提示先完成练习 |
| My | `/my` | 历史、Trying Point、能力画像、综合进步、用户管理 |

### 5.2 用户前 10 步

1. 打开 App，看到 “上次你讲得更久了 / 上次高光句”。
2. 看到一个可跳过的 starter，不强制选题。
3. 点击 `Start Speaking`，立即进入录音。
4. 1 秒内看到音浪和字幕，确认系统在听。
5. 讲话中看到 1–2 个高价值 phrase 被高亮。
6. 如果卡住 4–5 秒，AI 给一个具体 follow-up。
7. 用户继续说，KTV 事件分数变化并显示原因。
8. 点击结束，先出现 “You made it” 奖励反馈。
9. 看到本次 takeaway：亮点、可改进点、可复用稿。
10. 点击 `Practice Again` 或进入 Growth Memory，系统记住这次成果。

### 5.3 减少使用痛感

| 痛感 | 设计策略 |
|------|----------|
| 不知道说什么 | starter 只做轻提示，不做必选流程 |
| 怕被评价 | 讲话中优先点亮，不先纠错 |
| 害怕卡住 | 4–5 秒后温柔接力，而不是立刻打断 |
| 练完没用 | 结束页必须给下一次可直接使用的稿子和句子 |
| 感觉每次从零开始 | 第四板块展示长期记忆和成长 |

### 5.4 PracticeRoom v2 实时编排

| 元素 | 编排规则 | 目的 |
|------|----------|------|
| 中间主板块 | 字幕和 AI 角色合并为一个 “AI is listening” 大板块 | 用户感到是在和一个对象互动，不是看散落组件 |
| 像素陪练 | 先用轻量 pixel buddy 占位，状态包含 ready / listening / thinking / excited | 增加陪伴感，但不抢主任务 |
| 字幕 | 固定高度，可上下滚动；interim 仍用蓝色显示 | 保持实时感，同时避免字幕吞掉页面 |
| 停顿追问 | 大卡片只在真停顿后出现；用户继续说后收缩成小标签保留数秒 | 不打断讲话，也不让启发问题一闪而过 |
| 音浪 | 放在页面底部，作为持续的麦克风同步反馈 | 让“系统在听”的感觉一直存在 |
| 闪光频次 | phrase spark 可短暂出现；完整 punchline / 1 分钟坚持才触发全屏轻闪 | Wow Moment 要可见但不能抢戏 |
| 像素陪练 | 当前用 CSS cat coach 实现：耳机猫、麦克风、hoodie、尾巴、耳朵、提示卡；下一步可替换为透明背景 sprite 资产 | 降低人机感，让用户看到“它在听、在想、为我开心” |

---

## 6. Takeaway 设计

### 6.1 Takeaway 页面结构

1. **Reward Moment**
   先给完成感：`You made it. You kept your idea alive for 42 seconds.`

2. **Progress Stats**
   展示本次跑了多久、说了多少词、pace、保存了多少高光。

3. **What Worked**
   展示本次最好的 2–3 个点：好词、好句型、好故事结构。

4. **Make It Stronger**
   给 1–2 个具体可改进方向：补例子、补数据、加因果句、换更准确词。

5. **Next Run Plan**
   由 Gemini 基于本次 transcript、highlight words、KTV events 生成：下一轮 focus、一句可直接说的句型、可复用词、一个最小动作。它不是复述全文。

6. **Coach Chatbox**
   固定宽高、可滚动；预设按钮和输入框都基于同一份 session context 调 Gemini，用户可以继续问 “vocabulary upgrade / storyline / go deeper / more examples”。

7. **Juicy Next Move**
   给一条立刻能用的下一步：例如 “下次把这句加到开头第二句”。

8. **Save to Memory**
   将词句和 topic 写入长期画像。

### 6.2 Takeaway 内容来源

| 内容 | 来源 |
|------|------|
| 完整 transcript | Web Speech 实时字幕 + Gemini session 复核；legacy `analyze-voice` 仅作备用 |
| 高光词 | 实时 phrase engine + Gemini 复核 |
| 好句型 | Grammar / sentence pattern detector |
| 内容结构 | Story Builder 判断 claim/example/evidence/impact |
| Next Run Plan | Gemini：完整 transcript + highlight words + KTV events + 本次最低维度 |
| Chatbox reply | Gemini：session context + 当前 takeaway + 用户预设按钮/输入问题 |

所有 script / plan 型内容必须固定容器高度并可滚动，避免用户说得越多，Takeaway 页面越长、越难扫读。

### 6.3 Pixel Buddy 资产方向

像素陪练需要拟人化，但不能幼稚或杂乱。当前代码已接入透明背景 4x2 motion sheets：`public/assets/cat-coach/cat_*_motion_alpha.png`，状态如下：

| 状态 | 动画 |
|------|------|
| `listening` | 播放 `cat_listening_motion_alpha.png`；耳朵/尾巴/眨眼有轻微生命感 |
| `thinking` | 播放 `cat_thinking_motion_alpha.png`；思考托腮、轻微摆动 |
| `coaching` | 播放 `cat_coaching_motion_alpha.png`；举提示卡、尾巴轻动 |
| `excited` | 播放 `cat_excited_motion_alpha.png`；庆祝、轻跳、星星闪 |

本轮新增的 alpha 分层/动作图已存入 `public/assets/cat-coach/` 和 `public/assets/cat-coach/reference/`，作为生产动画和美术参考。旧 2x2 sprite 保留为 fallback。

1. `listening`：身体微微前倾，眼睛看向用户，耳机/小麦克风发光。
2. `thinking`：一只手托腮或头顶小灯亮起。
3. `excited`：眼睛变亮，有小星星，但不要大爆炸。
4. `coach`：举起一张小提示卡。

生成提示词建议：

`A charming pixel art AI speaking coach mascot, small friendly humanoid robot with expressive face, soft blue and fresh green accents, wearing a tiny headset microphone, transparent background, 64x64 game sprite, clean silhouette, high-end mobile app mascot, warm and encouraging, subtle facial expression, readable eyes, not childish, not noisy, no text, no logo. Create four consistent poses: listening, thinking, excited, holding a small coaching card.`

---

## 7. Growth Memory 第四板块

### 7.1 目标

让用户感觉系统长期认识自己：

> “它知道我常在哪里卡住，也知道我最近真的变好了。”

### 7.2 模块

| 模块 | 内容 |
|------|------|
| Ability Portrait | Flow / Words / Sentences / Story 趋势 |
| Topic Memory | 常练 topic、未展开 topic、可继续挖掘 topic |
| Phrase Bank | 高亮词、复用次数、适合放到下次稿子的句子 |
| Bottleneck Pattern | 常在开头、例子、结尾或词汇搜索时卡住 |
| Coach Settings | 温柔引导 / 挑战式 / 少打断 / 更像 IELTS coach |

### 7.3 Growth Pulse Wow Moment

进入第四板块或结束页时展示：

`Last week you stopped after 18s. Today you held your idea for 42s and reused 3 stronger phrases.`

这个 moment 的作用是留存，不是报告。它回答用户心里的问题：**我练这个到底有没有变好？**

---

## 8. 转化与留存指标

### 8.1 AARRR 映射

| 阶段 | SpeakSpark 指标 | 为什么重要 |
|------|-----------------|------------|
| Acquisition | 首页到 Start 点击率 | 用户是否被“一键开口”吸引 |
| Activation | Start 后 10 秒内是否说出第一句话 | 真正激活不是注册，是开口 |
| Retention | 次日是否回来练同一 topic 或复用一句话 | 是否形成长期练习习惯 |
| Revenue | 家长/教师是否愿意为报告和成长画像付费 | 长期商业化 |
| Referral | 用户是否愿意分享高光句或成长图 | 可传播资产 |

### 8.2 核心节点

| 节点 | 目标 |
|------|------|
| T0 点击 Start 后 1 秒 | 音浪和字幕必须动 |
| T1 第一次 phrase 高亮 | 用户感到 “它听懂我了” |
| T2 第一次卡住 | AI 接住用户，不抢话也不沉默 |
| T3 结束页 | 用户看到真实 takeaway |
| T4 Practice Again | 用户愿意立刻复练 |
| T5 第二天回来 | 系统记住昨天的成果 |

### 8.3 成功指标

| 指标 | 目标 |
|------|------|
| Start 后 10 秒内开口率 | ≥ 75% |
| 首次 session 完成率 | ≥ 65% |
| 第一次 phrase 高亮触发时间 | ≤ 8 秒 |
| 真实停顿 follow-up 成功触发率 | ≥ 80% |
| Takeaway 页 Practice Again 点击率 | ≥ 35% |
| 次日留存率 | ≥ 40% |
| 7 日内复用高亮词比例 | ≥ 30% |

---

## 9. 当前代码功能与 Gap

### 9.1 已有代码能力

| 文件 | 已有能力 |
|------|----------|
| `src/pages/Home.tsx` | 首页、starter、上次高光、一键开始 |
| `src/pages/PracticeRoom.tsx` | Web Audio 音浪、Web Speech 字幕、Gemini 音频 chunk、独立 PauseWatcher、高价值 phrase engine、sentence pattern detector、KTV v2 events |
| `src/pages/TakeawayPage.tsx` | AI Next Run Plan、AI Coach Chatbox、Flow / Words / Sentences / Story breakdown、固定高度滚动复盘 |
| `src/pages/Progress.tsx` | 旧版 Progress，可演进成 Growth Memory |
| `supabase/functions/get-gemini-api-key` | Gemini key 获取机制 |

### 9.2 关键 Gap

| Gap | 影响 | 当前状态 | 下一步 |
|-----|------|----------|--------|
| 词句抓取不准 | 抓到 `interesting`，漏掉 `unique` / `incredible` | ✅ 第一轮完成：高价值词表优先，普通长词降权 | 接 CEFR/IELTS 词汇等级 + Gemini 结束后复核 |
| 高亮数量无上限 | 页面会被 chips 挤满 | ✅ 第一轮完成：现场展示最近 5 个，session 保留 8 个 | 完整进素材库 |
| 停顿检测不稳定 | 用户故意停顿但 AI 不接 | ✅ 第一轮完成：独立 `PauseWatcher`，Gemini 忙时给本地兜底 | 手动试用校准 4.8s 阈值 |
| KTV 指标仍未完全重构 | 还不像训练目标 | ✅ 第一轮完成：Flow / Words / Sentences / Story | 用 Gemini 复核 story / sentences 质量 |
| Takeaway 仍有 mock | 练完不够真实 | 🔲 未做 | 接入完整 transcript + AI summary |
| 长期记忆未落库 | 没有“系统认识我”的感觉 | 🔲 未做 | 新增 ability profile / phrase memory / topic memory |
| Progress 页面还是旧 CommuniLingo 风格 | 第四板块不统一 | 🔲 未做 | 改造成 Growth Memory |

---

## 10. 下一步实施计划

### Sprint 2.1：修真实体验

1. ✅ `PauseWatcher`：稳定检测 4–5 秒真实停顿。
2. ✅ `HighValuePhraseEngine`：优先抓高级词、短语、句型，限制展示数量。
3. ✅ `KTVScorer v2`：改成 Flow / Words / Sentences / Story。
4. ✅ `TakeawayBuilder`：结束页接真实 transcript、highlights、KTV events，并由 Gemini 生成 Next Run Plan。

### Sprint 2.2：让用户愿意再练

1. ✅ Reward Moment：先给 “You made it” 情绪反馈。
2. ✅ PracticeRoom v2：中间 “AI 正在听”板块 + 像素陪练 + 底部音浪。
3. ✅ Follow-up Persistence：用户继续说后，启发问题收缩成小标签保留数秒。
4. ✅ Low-frequency Shine：phrase spark + 1 分钟坚持轻闪奖励。
5. ✅ AI Coach Chatbox：固定高度可滚动，预设按钮和输入框真实调用 Gemini。
6. ✅ Next Run Plan：替代繁琐 script，输出 focus / say this next / reuse words / one move。
7. 🔲 Practice Again Memory：把本次高光词自动带入下一轮。

### Sprint 3：长期记忆

1. Growth Memory 第四板块。
2. Ability Portrait。
3. Phrase Bank / Topic Memory。
4. Coach Settings。
5. Growth Pulse 可视化进步。

---

## 11. 版本记录

*v0.9.3 — 2026-05-02：Takeaway 从本地拼接升级为 Gemini 生成：Next Run Plan 不再复述全文，而是输出下一轮 focus、可直接说的一句、复用词和 one move；Coach Chatbox 的预设按钮与输入框也接入 Gemini，基于本次 session context 继续追问。*

*v0.9.2 — 2026-05-02：落实 PracticeRoom v2 体验编排：字幕与 AI 角色合成中间“AI 正在听”板块，音浪下移，停顿追问可收缩为标签，新增低频坚持奖励；Takeaway 增加 progress stats、可滚动 Coach Chatbox 原型和下一次练习稿区域。*

*v0.9.1 — 2026-05-02：按基础功能 → 核心功能顺序完成第一轮代码反推：PauseWatcher、高价值词句抓取、Flow / Words / Sentences / Story KTV v2，并更新 Gap 状态。*

*v0.9 — 2026-05-02：重构 PRD，补充口语评分依据、竞品分析、三层功能、四页动态工作流、转化留存节点、当前代码 gap 和下一步实施计划。*

*v0.8 — 2026-05-02：把 KTV 从静态分数改为事件驱动训练指标；新增第四板块 Growth Memory / Progress 的长期画像和 Growth Pulse Wow Moment。*

*v0.7 — 2026-05-02：根据试用反馈收紧 Coach Turn Policy；取消讲话中主动 topic cue，改成 Passive Phrase Highlight + 4.8s 真停顿后追问。*

*v0.6 — 2026-05-02：重新梳理竞品痛点地图；把基础功能写成可验收标准；明确 Fast Topic Cue + Audio-first AI Feedback 双层实时反应。*

*v0.5 — 2026-05-02：刷新竞品分析；把项目拆成基础功能和 Wow Moments；明确字幕框、反馈速度、KTV 四指标、结束页 polished script 是当前基础体验门槛。*

*v0.4 — 2026-04-27：锁定 Sprint 2 实时 AI 体验契约：实时字幕独立于 AI、Gemini 音频优先理解、内容相关追问/高光、结束页润色练习稿和 juicy 下一步建议。*

*v0.3 — 2026-04-27：明确目标用户为 6–9 年级初中生，新增竞品分析、用户心理分析、前5步旅程。从 Lovable 迁移到 localhost，Sprint 1 三页骨架完成。*

---

## 12. Sources

[^ielts-criteria]: IELTS official Speaking key assessment criteria describe four criteria: Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation. https://ielts.org/cdn/Guides/ielts-speaking-key-assessment-criteria.pdf
[^ielts-band]: IELTS official Speaking Band Descriptors. https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf
[^toefl-rubric]: ETS TOEFL iBT Speaking Rubrics describe Delivery, Language Use, and Topic Development. https://www.ets.org/pdfs/toefl/toefl-ibt-speaking-rubrics.pdf
[^progressive-disclosure]: Progressive disclosure is a UX pattern for reducing complexity by showing essential information first and revealing advanced detail later. https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/
[^elsa]: ELSA official pages describe AI pronunciation coaching, syllable-level correction, instant feedback, and lesson practice. https://vn.elsaspeak.com/en/homepage/
[^yoodli]: Yoodli official support and use-case pages describe AI speech coaching for presentations/interviews/conversations, real-time/private feedback, pacing/filler analytics, and follow-up questions. https://support.yoodli.ai/en/articles/9550461-yoodli-overview and https://toastmasters.yoodli.ai/use-cases/toastmasters
[^speeko]: Speeko and Speakio official pages describe real-time alerts or detailed analysis across pace, tone, fillers, intonation, sentiment, talk time, energy, pauses, clarity, and word choice. https://www.speeko.co/home and https://www.speakio.ai/
[^duolingo]: Duolingo official pages describe Max Roleplay and Video Call as AI-powered real-time conversation practice with characters and post-call transcripts. https://blog.duolingo.com/duolingo-max/ and https://blog.duolingo.com/video-call/
[^cake]: Cake and Speakerly pages describe native clips, Speak courses, role-play, pronunciation evaluation, conversation practice, accent training, and instant AI feedback. https://blog.cake.day/en/how-to-practice-english-conversations/ and https://www.speakerly.ai/
