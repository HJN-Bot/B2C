# CHANGELOG — SpeakSpark

> 格式：日期 · Sprint · 变更原因 · 影响文件 · 测试状态

---

## [2026-05-02] Sprint 2 — AI Takeaway Builder + Real Coach Chatbox

### 背景与原因

- **试用反馈**：`Next practice script` 像是在重复用户原稿，过于繁琐，不像“下一次马上能用”的建议。
- **运行问题**：结束页出现 `AI plan did not load`；需要区分“无 session 数据直接进入 Takeaway”和“Gemini 返回格式/调用失败”。
- **App 结构问题**：底部四栏没有形成一个正统手机 App 的页面切换感。
- **产品判断**：`Next Run Plan` 应该是主 takeaway，不能藏进 Chatbox；但它必须由 AI 基于本次练习内容思考生成。
- **交互升级**：Chatbox 不是静态展示区，而是用户继续追问词汇、故事线、内容深度和例子的真实 AI 操作区。

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `src/components/AppTabBar.tsx` | 新增 | 新增四栏底部导航：Start / Practice / Takeaway / My |
| `src/pages/Home.tsx` | 更新 | 接入四栏 App Tab，并为底部导航留出安全空间 |
| `src/pages/PracticeRoom.tsx` | 更新 | 接入四栏 App Tab，并为底部导航留出安全空间 |
| `public/assets/cat-coach/cat_*_motion_alpha.png` | 新增 | 接入用户提供的透明多帧猫猫动作图：listening / thinking / coaching / excited |
| `public/assets/cat-coach/reference/*` | 新增 | 存档分层/动作设计图，作为后续透明多帧动画的美术参考 |
| `public/assets/cat-coach/README.md` | 新增 | 记录生产资产、参考资产、状态映射和下一版透明多帧导出规范 |
| `src/pages/PracticeRoom.tsx` | 更新 | AI 陪练从 CSS 机器人替换为透明多帧猫猫 motion sheet，并新增 `coaching` 状态 |
| `src/pages/PracticeRoom.tsx` | 更新 | 结束练习时把本次 session 写入 `sessionStorage`，供 Takeaway tab/刷新后复用 |
| `src/index.css` | 更新 | 新增 4x2 motion sheet 播放动画：听、思考、开心、举提示卡 |
| `src/pages/TakeawayPage.tsx` | 新增 | 新建稳定 Takeaway 页面，绕开旧 `SessionEnd.tsx` 文件读卡顿 |
| `src/pages/TakeawayPage.tsx` | 更新 | 接入 Gemini：优先读取练习页缓存的 Gemini key，Edge Function 只做兜底 |
| `src/pages/TakeawayPage.tsx` | 更新 | `Next practice script` 改为 `Next Run Plan`：focus / say this next / reuse words / one move |
| `src/pages/TakeawayPage.tsx` | 更新 | Coach Chatbox 预设按钮和输入框真实调用 Gemini，基于 transcript、highlight words、KTV events 和当前 takeaway 回答 |
| `src/pages/TakeawayPage.tsx` | 更新 | 无 session 数据时不再硬调 Gemini；真实练习数据下使用 Gemini JSON schema 降低解析失败 |
| `src/pages/TakeawayPage.tsx` | 更新 | Next Run Plan 的长文本区域固定高度并可滚动，避免内容变长撑破页面 |
| `supabase/functions/get-gemini-api-key/index.ts` | 新增 | 补齐本地 Edge Function 源码，便于部署/同步远端函数 |
| `src/pages/MyPage.tsx` | 新增 | 新增 My Page：历史、Trying Point、能力画像、综合进步和用户管理入口 |
| `src/App.tsx` | 更新 | 新增 `/my` 路由，并将 `/session-end` 指向新的 `TakeawayPage` |
| `Design/PRD.md` | 更新 | 升级到 v0.9.3，明确 Next Run Plan 与 Chatbox 都必须由 AI 基于 session context 生成 |

### 测试状态

| 测试项 | 结果 |
|--------|------|
| 代码实现 | ✅ `npm run build` 通过 |
| 真实 Gemini 结束页生成 | 🔲 待用户手动验证 |

---

## [2026-05-02] Sprint 2 — PracticeRoom v2 + Takeaway Chatbox

### 背景与原因

- **试用反馈**：字幕、AI 角色、音浪、停顿提示分散，用户感到“系统在听”的对象感不够强。
- **交互判断**：启发问题不能一闪而过；用户继续说后应收缩成小标签，作为轻提示保留几秒。
- **复盘需求**：Takeaway 需要先鼓励用户，再给进度、做得好的部分、可优化方向，并提供一个固定区域继续追问词汇/故事线/深度。

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `src/pages/PracticeRoom.tsx` | 更新 | 将字幕和 AI 角色合并为中间 “AI is listening” 主板块，加入 pixel buddy 状态占位 |
| `src/pages/PracticeRoom.tsx` | 更新 | 音浪移到底部，成为持续麦克风同步反馈 |
| `src/pages/PracticeRoom.tsx` | 更新 | 停顿追问卡在用户继续说后收缩为小标签，并保留约 9 秒 |
| `src/pages/PracticeRoom.tsx` | 更新 | 新增 1 分钟坚持轻闪奖励；phrase spark 展示时间略延长，降低“看不见”的问题 |
| `src/pages/SessionEnd.tsx` | 重构 | Takeaway 顺序调整为 You made it → progress stats → progress map → worked/stronger/script → Coach Chatbox → CTA |
| `src/index.css` | 更新 | 新增 pixel buddy 的 listening/thinking/excited 动画 |
| `Design/PRD.md` | 更新 | 升级到 v0.9.2，记录中间主板块、提示收缩标签、低频闪光、Chatbox 复盘结构 |

### 测试状态

| 测试项 | 结果 |
|--------|------|
| 代码实现 | ✅ `npm run build` 通过 |
| 真实麦克风试用 | 🔲 待用户手动验证 |

---

## [2026-05-02] Sprint 2 — Gap-Driven Implementation Pass 1

### 背景与原因

- **优先级**：按照 PRD v0.9 的基础功能 → 核心功能 → 哇哦功能顺序反推代码 gap。
- **本轮目标**：先让用户能试到更稳定的停顿追问、更准的高价值词句抓取，以及更有训练目的的 KTV v2。

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `src/pages/PracticeRoom.tsx` | 更新 | 新增独立 `PauseWatcher`：每 250ms 检查真实静默，Gemini 忙时也先给本地兜底 follow-up |
| `src/pages/PracticeRoom.tsx` | 更新 | 升级 `HighValuePhraseEngine`：优先抓 `unique` / `incredible` / `sustainable` 等高价值词，降低普通长词误抓 |
| `src/pages/PracticeRoom.tsx` | 更新 | 高亮数量限制：现场 chips 只展示最近 5 个，session 最多保留 8 个 |
| `src/pages/PracticeRoom.tsx` | 更新 | 新增基础句型识别：情态句、因果句、从句、被动、比较句会推动 Sentences 分数 |
| `src/pages/PracticeRoom.tsx` | 更新 | KTV v2 改为 `Flow / Words / Sentences / Story` |
| `src/pages/SessionEnd.tsx` | 更新 | 结束页 KTV breakdown 同步为 `Flow / Words / Sentences / Story` |
| `Design/PRD.md` | 更新 | 更新当前代码 gap 状态和 Sprint 2.1 完成情况 |

### 测试状态

| 测试项 | 结果 |
|--------|------|
| 代码实现 | ✅ `npm run build` 通过 |
| 真实麦克风试用 | 🔲 待用户手动验证 |

---

## [2026-05-01] Sprint 2 — PRD v0.9 Product Direction Reset

### 背景与原因

- **试用反馈**：词句抓取、停顿追问、KTV 指标和 Takeaway 仍然没有完全服务核心目标。
- **产品重心**：SpeakSpark 的核心不是评分，而是帮助学生把内容说完整、继续说下去，并把本次表达变成下一次可复用素材。
- **依据补充**：引入 IELTS / TOEFL 口语评价维度作为反馈依据，结合竞品痛点和用户留存节点，重构 PRD。

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `Design/PRD.md` | 重构 | 升级到 v0.9；新增评分依据、三层功能、四页工作流、Takeaway、Growth Memory、转化留存指标和代码 gap |

### 测试状态

| 测试项 | 结果 |
|--------|------|
| 文档更新 | ✅ 已完成 |
| 代码实现 | 未开始，本轮只改 PRD |

---

## [2026-05-02] Sprint 2 — Purposeful KTV + Growth Memory

### 背景与原因

- **试用反馈**：顶部 KTV 四指标像死功能，用户不知道为什么涨分、和当前内容有什么关系。
- **产品目标重排**：核心不是打分，而是帮助用户把内容说完整、继续说下去，并把收获复用到下一次演讲。
- **新增长期体验判断**：需要第四板块承接长期记忆，包括能力画像、topic memory、phrase reuse、coach settings，以及一个可视化成长 Wow Moment。

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `src/pages/PracticeRoom.tsx` | 更新 | 新增 `ktvEvents`，KTV 每次涨分都绑定具体原因 |
| `src/pages/PracticeRoom.tsx` | 更新 | KTV 指标增加目的标签：keep talking / strong phrases / complete point / stay with it |
| `src/pages/PracticeRoom.tsx` | 更新 | 最新涨分事件显示在 KTV 条下方，例如 `+2 Words · Captured "renewable energy"` |
| `src/pages/SessionEnd.tsx` | 更新 | 结束页展示 KTV 事件来源、可复用词汇，并根据最低维度生成 next tip |
| `Design/PRD.md` | 更新 | 升级到 v0.8；新增第四板块 Growth Memory / Progress 和 Growth Pulse Wow Moment |
| `Design/Architecture.md` | 更新 | 升级到 v0.7；新增 `KTVEventScorer`、长期记忆路径和数据表草案 |

### 测试状态

| 测试项 | 结果 |
|--------|------|
| 代码实现 | ✅ `npm run build` 通过 |
| KTV 事件涨分与原因展示 | 🔲 待手动试用 |

---

## [2026-05-02] Sprint 2 — Coach Turn Policy + Phrase Spark

### 背景与原因

- **试用反馈**：AI 在用户说了 10–20 秒、内容还没完整展开时就开始问 topic，像抢话。
- **产品判断**：讲话中需要"被听见"的反馈，但不应该主动追问；追问必须等 4–5 秒真实卡壳。
- **Grill-me 式需求拷问结论**：把实时体验拆成两类事件：被动感知（字幕、高亮、闪光）和主动介入（follow-up）。前者可以讲话中出现，后者必须有明确停顿门槛。

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `src/pages/PracticeRoom.tsx` | 更新 | 取消讲话中主动 FastTopicCue；新增 PassivePhraseHighlight，本地识别基础科学 phrase 并高亮 |
| `src/pages/PracticeRoom.tsx` | 更新 | 新增 phrase spark 飘出闪光 chip；字幕内 final/interim 都可高亮；Vocabulary 小幅涨分 |
| `src/pages/PracticeRoom.tsx` | 更新 | Coach Turn Policy：`follow_up` 先缓存，只有静默 ≥4.8s 且用户未恢复讲话时展示 |
| `src/index.css` | 更新 | 新增 `phrase-spark` 和 `phrase-glow` 动画 |
| `Design/PRD.md` | 更新 | 升级到 v0.7；基础功能改为 Passive Phrase Highlight + 4.8s Bottleneck |
| `Design/Architecture.md` | 更新 | 升级到 v0.6；新增 CoachTurnPolicy 和 PassivePhraseHighlight 架构约束 |

### 测试状态

| 测试项 | 结果 |
|--------|------|
| 代码实现 | ✅ `npm run build` 通过 |
| 真实麦克风卡壳 4.8s 触发 | 🔲 待手动试用 |

---

## [2026-05-02] Sprint 2 — LiveCaption + Feedback Latency Tuning

### 背景与原因

- **试用反馈**：interim 字幕蓝色显示正确，但字幕框偏窄，阅读压力大。
- **反馈慢诊断**：实时字幕已证明麦克风/字幕链路在工作；慢点主要来自 AI 分段触发策略过保守，以及 Gemini 处理期间 VAD 早退导致新音频片段被丢。
- **连续讲话问题**：`MAX_PHRASE_SECONDS` 已下调到 3s，但旧逻辑只在静音分支处理，用户不停顿时依旧不会及时切 chunk。
- **产品梳理**：结合 ELSA / Yoodli / Speeko / Duolingo / Cake 的定位，明确 SpeakSpark 当前要先打穿"初中生科普演讲实时陪练"基础体验，再叠加高光爆炸等 Wow Moments。

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `src/pages/PracticeRoom.tsx` | 更新 | 字幕框提升到 132px；外边距略收紧，阅读宽度更大；interim 字幕继续蓝色高亮 |
| `src/pages/PracticeRoom.tsx` | 更新 | KTV 指标露出文字标签，避免只看图标不知道维度 |
| `src/pages/PracticeRoom.tsx` | 更新 | VAD 触发更快：静音阈值 650ms、最长 chunk 3s；连续讲话超过 3s 也会切 chunk；Gemini 处理时继续收音 |
| `src/pages/PracticeRoom.tsx` | 更新 | 新增 FastTopicCue：Gemini 返回前，先基于 live captions 抽取最近 topic 给轻量引导 |
| `src/pages/PracticeRoom.tsx` | 更新 | KTV 指标从 Flow 对齐为 Logic，与 PRD 保持一致 |
| `src/pages/SessionEnd.tsx` | 更新 | 结束页 KTV 维度同步为 Fluency / Vocabulary / Logic / Duration |
| `Design/PRD.md` | 更新 | 升级到 v0.6；刷新竞品痛点地图；基础功能改为可验收标准 |
| `Design/Architecture.md` | 更新 | 升级到 v0.5；新增 FastTopicCue 分层和连续讲话 chunk 修正 |

### 当前基础功能优先级

1. LiveCaptionLayer：稳定、可读、可滚动。
2. FastTopicCue：1–2 秒内先给低风险 topic 引导。
3. Audio-first AI feedback：约 3 秒内给内容相关反馈。
4. Bottleneck：停顿 ≥4s 后基于最近 topic 追问。
5. KTV：四指标清楚、分数变化有事件来源。
6. SessionEnd：完整 transcript、高光词汇、polished script、juicy next move。

### 测试状态

| 测试项 | 结果 |
|--------|------|
| 代码实现 | 🔲 待构建验证 |
| Chrome/Edge 麦克风 + 字幕 | 🔲 待手动试用 |

---

## [2026-04-27] Sprint 2 Planning — Audio-first AI 体验契约锁定

### 背景与原因

- **试用反馈**：当前 PracticeRoom 的 transcript 没有稳定出现，导致用户说话时没有"它真的在听我"的第一反馈。
- **体验判断**：实时字幕不能依赖 Gemini 分段返回；字幕必须先由本地即时链路显示，AI 理解则应直接分析用户音频。
- **产品原则**：AI 反应必须强相关、内容具体、实时接住停顿，并能触发高光爆炸。禁止默认使用 "Good point" / "Nice job" 这类泛化反馈。

### 文档变更

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `Design/PRD.md` | 更新 | 升级到 v0.4；新增实时 AI 体验原则；明确三条并行链路：即时可见、实时理解、结束总结 |
| `Design/Architecture.md` | 更新 | 升级到 v0.3；新增 Audio-first AI 调用链、LiveCaptionLayer、AudioFirstReactionScheduler、ADR-006 |
| `Design/CHANGELOG.md` | 更新 | 记录 Sprint 2 的体验契约、技术方向和下一步实现顺序 |
| `Design/ Architecture.md` | 更新 | 在旧架构笔记中补充 SpeakSpark 的实时字幕/音频优先 AI 原则，避免旧描述误导 |

### 锁定的功能契约

| 模块 | 必须达到的体验 |
|------|---------------|
| 实时字幕 | 用户说话时立刻出字；固定高度；最多两行/Karaoke 风格滚动；不被 AI 调用阻塞 |
| 音浪 | 和麦克风同步；沉默时有呼吸；界面深色沉浸，不能出现突兀白色大框 |
| Gemini 实时理解 | 直接分析滚动音频片段；字幕只是辅助上下文；目标 1.5–3s 内产生具体反应 |
| AI 气泡 | 必须引用用户刚说过的词、观点、例子或数据 |
| 卡壳追问 | 停顿 ≥4s 后基于最近主题追问；Gemini 超时才使用本地兜底 prompt |
| 自动高光 | 检测强观点、例子、数据、高质量词汇；触发金色爆炸和 KTV 分数跳动 |
| KTV 指标 | 固定为 Fluency / Vocabulary / Logic / Duration；每次分数变化必须有事件来源 |
| 结束页 | 显示完整 transcript、高光词汇、润色后的下一次练习稿、可立即使用的 juicy next move |

### 下一步实现顺序

1. `LiveCaptionLayer`：移植 prototype 的 SpeechRecognition/Karaoke captions，先保证 transcript 可见。
2. 恢复沉浸式深色视觉：去掉突兀白色框架，音浪和字幕作为空间层存在。
3. `AudioFirstReactionScheduler`：滚动音频片段直接发 Gemini，返回 reaction / highlight / follow_up / score_delta。
4. `HighlightDetector`：自动高光 + 爆炸动画 + KTV 事件日志。
5. SessionEnd：完整转录复核、润色练习稿、下一步建议。

### 测试状态

| 测试项 | 结果 |
|--------|------|
| 文档一致性检查 | ✅ 已同步 PRD / Architecture / CHANGELOG |
| 代码实现 | 🔲 暂停，等待体验契约确认后再动手 |

---

## [2026-04-27] Sprint 1 — 三页骨架 + 深色主题 + Wow #1/4

### 背景与原因

- **用户研究**：明确目标用户为 6–9 年级初中生（11–15 岁），这个群体有手机、可自主练习，对即时反馈极度敏感，设计必须 mobile-first + 深色背景（TikTok/Spotify 语境）。
- **竞品分析**：ELSA Speak、Yoodli、Duolingo 等均无「高光即时捕捉 + KTV 多维实时积分 + 科普演讲专项」的组合，SpeakSpark 有明确白色地带。
- **平台迁移**：从 Lovable 迁移到 localhost 自主开发，获得完整 Web Audio API 访问权限和更精细的 UI 控制。

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `src/index.css` | 重写 | 替换 Lovable 默认主题为 SpeakSpark 深色主题（CSS 变量）；新增 keyframes：`slide-up` / `bubble-rise` / `highlight-burst` / `score-jump` / `trophy-reveal` / `float-in` |
| `tailwind.config.ts` | 更新 | 新增 8 个 keyframe 定义 + animation 工具类；保留原 shadcn/ui 颜色系统 |
| `vite.config.ts` | 更新 | 移除 `lovable-tagger` 插件（脱离 Lovable 平台）；改为标准 `@vitejs/plugin-react-swc` 配置 |
| `src/App.tsx` | 重写 | 路由从 7 页（Lovable 旧结构）简化为 3 页：`/`→Home，`/practice`→PracticeRoom，`/session-end`→SessionEnd |
| `src/pages/Home.tsx` | 新建 | 首页：SpeakSpark 品牌 + 打招呼 + Streak 计数 + XP 进度 + 高光预览卡（迷你波形图）+ 4 成就徽章 + Start Speaking CTA |
| `src/pages/PracticeRoom.tsx` | 新建 | 练习房间：Web Audio API 实时音浪（Canvas 40 柱）+ KTV 4 维分数条 + 卡壳检测（≥4s）+ Follow-up 卡底部滑入 + 手动高光标记 + 金色光晕动画 + 随机鼓励气泡 |
| `src/pages/SessionEnd.tsx` | 新建 | 结束页：🏆 分数 count-up 动画 + KTV 分维度详情 + 高光卡横向滑动 + 下次练习建议 + Streak 提醒 + 双 CTA |

### 关键技术决策

- **Web Audio API 直接用 `AnalyserNode`**：不用外部库，60fps Canvas 渲染，音量 < 阈值时柱子呈正弦呼吸（不是死板直线）。
- **卡壳检测纯客户端**：沉默 ≥ 4s 触发 Follow-up 卡，不走 AI，< 50ms 响应。
- **麦克风被拒 fallback**：自动切换为 demo 呼吸波形，用户感知不到断裂。
- **Sprint 1 不拆组件**：PracticeRoom 内联所有逻辑，先验证 Wow 效果，Sprint 2 再做组件拆分和 hook 抽象。

### 测试状态

| 测试项 | 结果 |
|--------|------|
| TypeScript 编译 `tsc --noEmit` | ✅ 0 errors |
| 首页 → PracticeRoom → SessionEnd 路由跳转 | 🔲 待手动验证 |
| Web Audio API 麦克风权限正常路径 | 🔲 待手动验证 |
| 麦克风权限被拒时 demo 模式 fallback | 🔲 待手动验证 |
| 卡壳检测（沉默 4s 触发 Follow-up 卡） | 🔲 待手动验证 |
| 高光标记 → 金色动画 → 积分跳动 | 🔲 待手动验证 |
| SessionEnd 分数 count-up 动画 | 🔲 待手动验证 |
| 移动端视口（max-width: 430px）布局 | 🔲 待手动验证（Chrome DevTools 模拟） |

---

## [2026-04-21] Sprint 0 — 设计文档完成

### 变更文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| `Design/PRD.md` v0.2 | 新建 | 产品需求：三页用户旅程、游戏化机制、MVP 范围、成功指标 |
| `Design/Architecture.md` v0.1 | 新建 | 技术架构：Harness 决策矩阵、Wow Moment 实现路径、数据模型、接口契约、Sprint 计划 |
| `Design/PROJECT.md` v0.1 | 新建 | 项目锚点：技术栈锁定、目录结构目标态、ADR |
| `Design/prototype.html` | 新建 | 静态 HTML 原型（Lovable 生成） |

---

## 待办（Sprint 2 变更预告）

- [ ] `LiveCaptionLayer` 实时字幕层（SpeechRecognition + Karaoke 两行滚动）
- [ ] `AudioFirstReactionScheduler` 音频优先 Gemini 实时反应调度
- [ ] `HighlightDetector` 高光识别引擎（Gemini 音频判断 + 规则兜底 + 结束后复核）
- [ ] 内容相关 Bottleneck：停顿 ≥4s 后基于最近主题追问
- [ ] SessionEnd：完整 transcript、高光词汇、润色练习稿、juicy next move
- [ ] Supabase 数据写入（sessions + highlights 表）
- [ ] PracticeRoom → 拆分为子组件（WaveformCompanion、KTVScoreBar、BottleneckCard 等）
- [ ] `usePracticeSession` hook 抽象录音逻辑
- [ ] E2E 测试（Playwright）：核心用户流程


