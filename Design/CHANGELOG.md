# CHANGELOG — SpeakSpark

> 格式：日期 · Sprint · 变更原因 · 影响文件 · 测试状态

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
