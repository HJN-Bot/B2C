# Architecture.md — SpeakSpark 技术架构设计

> 版本: v0.3 | 日期: 2026-04-27  
> 对应 PRD: v0.4

---

## 核心设计哲学

### Harness Engineering 原则应用

| 原则 | 在 SpeakSpark 的体现 |
|------|----------------------|
| **Harness（驾驭）** | 复用 Meaningfully 已有能力，不重复造轮子 |
| **Must-Build** | 只自建差异化的核心竞争力（音浪、高光、KTV） |
| **接口契约** | `harness/interfaces/` 定义所有模块边界 |
| **可观测** | 高光时间戳、积分日志、气泡触发日志均可追踪 |

---

## 技术栈（锁定）

| 层 | 技术 | 版本 | 备注 |
|----|------|------|------|
| 前端框架 | React + TypeScript + Vite | 18.x / 5.x | |
| UI | Tailwind CSS + shadcn/ui | 3.x | 深色主题，CSS 变量驱动 |
| 状态管理 | React useState/useRef + React Query | — | 不引入 Redux/Zustand（规模不需要）|
| 音频处理 | Web Audio API（AnalyserNode + Canvas） | 浏览器原生 | 客户端实时，0 延迟 |
| 实时字幕 | Web Speech API / SpeechRecognition | 浏览器原生 | UI 即时字幕，不作为 AI 唯一输入 |
| 实时反馈 AI | Google Gemini 1.5/2.5 Flash | audio-first streaming / rolling chunks | 直接分析音频片段，目标 1.5–3s 有反应 |
| 完整转录 | OpenAI Whisper 或现有 `analyze-voice` | via Supabase Edge Function | session 结束后复核 |
| 语音分析 | OpenAI GPT-4o | via Supabase Edge Function | session 结束后批处理 |
| TTS（二期）| OpenAI TTS `tts-1` | via Edge Function | |
| 数据库 | Supabase PostgreSQL | — | |
| 文件存储 | Supabase Storage | — | 音频片段 bucket |
| 动画 | CSS Keyframes + Tailwind Animate | — | 不引入 Three.js / Framer Motion |
| 构建工具 | Vite（已移除 lovable-tagger） | 5.x | |

> ⚠️ 红线：不引入 Three.js / WebGL（复杂度过高）；不引入 Redux（项目规模不需要）；不依赖 Lovable 平台（2026-04-27 迁移至 localhost 开发）。

---

## Must-Build vs Harness 决策矩阵

### ✅ HARNESS — 直接复用或轻量适配

| 能力 | 来源 | 适配工作量 |
|------|------|-----------|
| 录音引擎（MediaRecorder + 格式兼容） | `audioRecorder.ts` | 封装为 hook，~2h |
| VAD + 停顿检测（≥4s） | `audioRecorder.ts` VAD 逻辑 | 提取参数，~1h |
| 即时字幕（Karaoke captions） | `prototype.html` Web Speech 逻辑 | 移植为 hook，~2h |
| 实时反馈气泡框架 | `LiveReactionFeedback.tsx` | 升级调度逻辑，~3h |
| 完整转录（Whisper） | `analyze-voice` Edge Function | 扩展入参 highlights，~2h |
| 语音分析（GPT-4o） | `analyze-voice` Edge Function | 同上 |
| Supabase Auth + PostgreSQL | 现有集成 | 无需改动 |
| Supabase Storage | 现有集成 | 新增 highlights bucket |
| UI 组件库 | shadcn/ui + Tailwind | 已迁移至 SpeakSpark 深色主题 |

### 🔨 MUST-BUILD — 核心差异化，必须自建

| 能力 | 为什么必须自建 | 状态 |
|------|--------------|------|
| **WaveformCompanion** | 陪伴感核心体验，市面无现成方案 | ✅ Sprint 1 完成 |
| **KTVScoreBar** | 多维实时积分系统，游戏化核心 | ✅ Sprint 1 完成（客户端模拟）|
| **BottleneckCard** | 底部滑入 + 卡壳引导 | ✅ Sprint 1 完成 |
| **SessionEnd Trophy Room** | 高光回顾 + 分数揭晓，UX 差异化 | ✅ Sprint 1 完成 |
| **LiveCaptionLayer** | 字幕必须即时、稳定、可滚动，不能依赖网络模型 | 🔲 Sprint 2 |
| **AudioFirstReactionScheduler** | AI 反应需要直接听音频、节奏足够实时、非随机 | 🔲 Sprint 2 |
| **HighlightDetector** | 高光识别算法需匹配演讲评分维度，并能触发爆炸动画 | 🔲 Sprint 2 |

---

## Wow Moment 技术实现

### Wow #1 — "It's Listening to Me"（音浪 + 字幕伴侣）🔲 Sprint 2 升级

**实现位置**：`src/pages/PracticeRoom.tsx` → `canvasRef + analyserRef`

**核心逻辑**：
- `navigator.mediaDevices.getUserMedia` → `AudioContext` → `AnalyserNode (fftSize=256)`
- `requestAnimationFrame` 60fps 循环读取 `getByteFrequencyData`
- 40 根圆角矩形柱，颜色映射：音量低 → 紫色，中 → 蓝绿，高 → 橙色
- Web Speech API / SpeechRecognition 负责 Karaoke 字幕的即时显示（最多 2 行，底部向上滚动）
- 无麦克风时降级为呼吸正弦波 demo 模式

**Wow 关键点**：学生开口后，音浪和字幕必须立刻动起来。字幕是 UI 状态，不是 AI 分析主链路；AI 仍直接分析音频片段。

---

### Wow #2 — 内容相关 AI 反应 🔲 Sprint 2

**实现位置**：`src/pages/PracticeRoom.tsx` → `AudioFirstReactionScheduler`

**触发流程**：
```
VAD 识别 1.5–3s 有效语音片段 / 句末停顿
  → 发送 rolling audio chunk 给 Gemini
  → 返回 reaction JSON：
      {
        reaction: "You mentioned renewable energy...",
        cited_words: ["renewable energy"],
        follow_up: "",
        highlight_words: [],
        highlight_moment: false,
        score_delta: { fluency: 2, vocabulary: 4, logic: 3 }
      }
  → ReactionScheduler 判断是否展示气泡
```

**约束**：
- Gemini 直接拿音频片段做分析；字幕文本只作为辅助上下文和兜底。
- 气泡必须引用用户刚刚说过的词、观点、数据、例子或表达行为。
- 禁止泛化反馈：`Good point` / `Nice job` / `Keep going` 不能作为默认输出。

---

### Wow #3 — 高光爆炸动画 ✅（手动完成，自动检测 Sprint 2）

**实现位置**：`src/pages/PracticeRoom.tsx` → `highlights` state + `HighlightDetector`

**触发流程**：
```
自动：Gemini 判定 highlight_moment=true 或规则检测到数据/例子/高级词
手动：点击 "Mark Highlight"
  → highlights[] push HighlightFlash { id, points }
  → 渲染：金色粒子/径向光晕 + "+N ⭐ Strong evidence!" 跳动文字
  → 1.6s 后自动 remove
  → ktvScore 对应维度跳动
```

---

### Wow #4 — KTV 积分条 ✅（客户端模拟，AI 接入 Sprint 2）

**实现位置**：`src/pages/PracticeRoom.tsx` → `ktvScore` state

**颜色系统**：
- 0–40：`#FF4444`（红，需要努力）
- 40–70：`#FFB930`（橙黄，不错）
- 70–90：`#00E67A`（绿，很棒）
- 90–100：`#FFD700`（金，完美）

---

### Wow #5 — Session Trophy Room ✅

**实现位置**：`src/pages/SessionEnd.tsx`

**动画序列（stagger）**：
1. 0ms — 🏆 图标 + 分数 count-up (60帧，约1s)
2. 800ms — KTV 分维度条 + 高光卡横向滑动出现（`animate-float-in`）
3. 1400ms — Next Tip 卡片
4. 1900ms — Streak 提醒

---

## 卡壳检测逻辑 🔲 Sprint 2 升级为内容相关

**实现位置**：`src/pages/PracticeRoom.tsx` → `silenceTimeoutRef`

```
drawLoop() 每帧检查：
  avgVolume = Σ dataArray / bufferLength
  if (avgVolume > 12) → 重置 lastSoundRef，清除 silenceTimeout，setShowBottleneck(false)
  else if (Date.now() - lastSoundRef > 4000 && !silenceTimeout) →
    askGeminiForFollowUp({ recentAudio?, transcriptSnapshot, lastTopic })
    setShowBottleneck(true)
```

兜底 Follow-up 提示语仍保留，但只有在 Gemini 不可用或超时时使用。正常路径必须基于学生刚才的内容追问：举例 / 引数据 / 生活影响 / 令人惊讶的事实 / 换一种说法 / 受益群体。

---

## AI 调用链设计

### 实时路径（练习中）

```
本地即时层（0–300ms）
  ├── VAD → 检测停顿（本地，0延迟）
  ├── 音量/频率 → WaveformEngine（本地，0延迟）
  └── SpeechRecognition → Karaoke 字幕（即时可见，非最终真相）

AI 实时理解层（目标 1.5–3s，最长不超过 5s）
  ├── 输入主链路：滚动音频片段 audio/webm 或 wav
  ├── 输入辅助：当前字幕快照、上一个主题、最近一次 AI 反应
  ├── 输出：
      - 内容相关 reaction
      - highlight_words（必须来自用户真实表达）
      - follow_up（停顿/卡壳时）
      - highlight_moment + reason
      - score_delta: fluency / vocabulary / logic
  └── → ReactionScheduler 决策是否触发气泡
```

**为什么不让 Gemini 单独承担实时字幕主链路**：
- 字幕是学生判断"它正在听我"的第一反馈，不能被网络、模型排队、JSON 解析失败阻塞。
- Gemini 仍直接听音频做理解；并不是先把音频转文字再分析。
- 字幕层是体验层和辅助上下文，最终 transcript 由 session 结束后的 Whisper / analyze-voice 复核。

### 批处理路径（练习结束后）

```
录音结束
  └→ [1] Whisper 转录（完整录音）
  └→ [2] GPT-4o 分析（转录全文）
          ├── 逻辑得分（补全 KTV 逻辑维度）
          ├── 词汇精准得分
          ├── 高光片段确认（验证客户端标记）
          ├── 润色练习稿（保留学生原意，适合下次直接跟练）
          └── juicy 下一步建议（表达升级 + 内容补强，立刻可用）
  └→ [3] 写入 Supabase（highlights + session_result）
  └→ [4] 跳转 SessionEnd 页
```

---

## 数据模型

### highlights 表

```sql
CREATE TABLE highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  user_id UUID REFERENCES auth.users(id),
  timestamp_start FLOAT NOT NULL,
  timestamp_end FLOAT NOT NULL,
  transcript TEXT NOT NULL,
  score_vocabulary INT,
  score_fluency INT,
  audio_url TEXT,
  trigger_type TEXT CHECK (trigger_type IN ('auto', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### sessions 表

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  duration_seconds INT NOT NULL,
  score_total INT NOT NULL,
  score_fluency INT,
  score_vocabulary INT,
  score_logic INT,
  score_duration INT,
  highlight_count INT DEFAULT 0,
  transcript_full TEXT,
  transcript_polished TEXT,
  tip_next TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### user_streaks 表

```sql
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_practice_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 实际目录结构（Sprint 2 目标态）

```
src/
├── pages/
│   ├── Home.tsx            ✅ 首页（打招呼 + 高光预览 + 大 CTA）
│   ├── PracticeRoom.tsx    ✅ 练习房间（Web Audio + KTV + 卡壳检测）
│   ├── SessionEnd.tsx      ✅ 结束页（分数揭晓 + 高光卡 + 建议）
│   └── NotFound.tsx
│
├── components/             （Sprint 2 拆分 PracticeRoom 子组件）
│   ├── room/
│   │   ├── WaveformCompanion.tsx   🔲 待拆分
│   │   ├── KTVScoreBar.tsx         🔲 待拆分
│   │   ├── ReactionBubble.tsx      🔲 待拆分
│   │   ├── HighlightFlash.tsx      🔲 待拆分
│   │   └── BottleneckCard.tsx      🔲 待拆分
│   └── session-end/
│       ├── HighlightCard.tsx       🔲 待拆分
│       └── ScoreBreakdown.tsx      🔲 待拆分
│
├── engines/                🔲 Sprint 2
│   ├── waveform.ts
│   ├── live-caption.ts
│   ├── reaction-scheduler.ts
│   ├── highlight-detector.ts
│   ├── ktv-scorer.ts
│   └── bottleneck-detector.ts
│
├── hooks/                  🔲 Sprint 2
│   ├── usePracticeSession.ts
│   ├── useLiveCaptions.ts
│   ├── useAudioFirstAI.ts
│   └── useHighlights.ts
│
├── data/
│   └── followup-prompts.ts 🔲 Sprint 2（当前内联在 PracticeRoom）
│
└── harness/                🔲 Sprint 2
    └── interfaces/
        ├── HighlightEvent.ts
        └── SessionResult.ts
```

---

## Sprint 计划

### ✅ Sprint 1（已完成 2026-04-27）— 骨架 + 深色主题 + Wow #1/4

- [x] 三页路由（Home / PracticeRoom / SessionEnd）
- [x] SpeakSpark 深色主题（CSS 变量 + keyframes）
- [x] Web Audio API 实时音浪（Canvas, 40 根圆角柱，颜色随音量变化）
- [x] 麦克风被拒时 demo 模式 fallback
- [x] KTV 积分条（4 维度，客户端模拟）
- [x] 卡壳检测（沉默 ≥4s）+ Follow-up 卡底部滑入
- [x] 手动高光标记 + 金色光晕爆炸动画
- [x] 随机鼓励气泡（每 8-12s）
- [x] 练习结束页：分数 count-up + 高光卡横向滑动 + 下次建议 + Streak
- [x] 移除 lovable-tagger，vite.config.ts 清理

### 🔲 Sprint 2 — 实时字幕 + 音频优先 AI + 高光引擎

- [ ] `LiveCaptionLayer`：Web Speech 即时字幕，固定高度、最多两行、可滚动
- [ ] `AudioFirstReactionScheduler`：Gemini 直接分析滚动音频片段，1.5–3s 反馈
- [ ] `HighlightDetector` 引擎（Gemini 音频判断 + 规则兜底 + 结束后复核）
- [ ] 内容相关 Bottleneck：停顿 4s 后基于最近主题追问
- [ ] SessionEnd：完整 transcript、高光词汇、润色练习稿、juicy 下一步建议
- [ ] Supabase 数据写入（sessions + highlights 表）
- [ ] 组件拆分（PracticeRoom → 子组件）
- [ ] `usePracticeSession` hook 抽象

### 🔲 Sprint 3 — 游戏化 + 素材库

- [ ] 成就系统动画（4 个徽章）
- [ ] 素材库页面（高光试听 + 转录文本）
- [ ] 音效系统
- [ ] 首页 Streak 实际数据接入

---

## ADR（架构决策记录）

### ADR-001: 使用 Canvas + Web Audio API，不用 SVG
**决定**: 音浪用 Canvas requestAnimationFrame 渲染，不用 SVG 或 div。  
**原因**: 60fps 下 40 根柱子更新，SVG DOM 操作开销太大；Canvas 是天花板级性能。

### ADR-002: KTV 词汇/逻辑维度实时估算，结束后复核
**决定**: 练习中由 Gemini 音频片段返回 `score_delta`，实时推动 Vocabulary / Logic；session 结束后由完整分析复核。  
**原因**: 用户需要看到分数和具体事件绑定；但最终报告仍需要完整上下文保证准确。

### ADR-003: 不重写 audioRecorder.ts，只做接口适配
**决定**: 对 Meaningfully 的音频引擎做适配器包装，不从头重写。  
**原因**: 现有引擎已处理多格式兼容（WebM/MP4/WAV）和 VAD 逻辑，重写风险高收益低。

### ADR-004: 从 Lovable 迁移到 localhost 自主开发（2026-04-27）
**决定**: 不再依赖 Lovable 平台，直接在本地 Vite 开发服务器运行。  
**原因**: 需要更精细的 UI 控制、真实 Web Audio API 访问权限、以及针对初中生的完整深色主题设计。已移除 `lovable-tagger` 插件依赖。

### ADR-005: Sprint 1 不拆分组件，Sprint 2 再抽象
**决定**: PracticeRoom.tsx 当前内联所有逻辑，Sprint 2 再拆分子组件和 hooks。  
**原因**: 先让 Wow 效果跑通验证体验，避免过早抽象导致 UI 与逻辑解耦困难。三次相似代码再抽象原则。

### ADR-006: 实时字幕与实时 AI 理解分离
**决定**: SpeechRecognition 负责即时字幕；Gemini 直接分析滚动音频片段做内容理解、气泡、高光、追问。  
**原因**: 字幕必须毫秒级可见，不能被模型调用阻塞；同时 AI 反馈必须真正听音频，不能只依赖字幕文本。
