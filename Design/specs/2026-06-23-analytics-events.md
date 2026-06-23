# Spec — 埋点事件与验证仪表盘

> 2026-06-23 · 阶段一 🔴 · 对应 HANDOVER §4 #6、§6 北极星 · 工具无关（PostHog / Supabase events）

## 修改建议

跑真实用户多轮测试却不记录行为事件 = 看不到漏斗/留存，无法判断「打磨有没有用」。需要一套**每个事件都对应一个北极星指标或漏斗步骤**的埋点，而不是随便记日志。

## 解决思路

1. 先定**事件表**（名字 + 触发时机 + 关键属性），每条标注它服务哪个指标。
2. 指标 = 事件的**公式**，全部可从事件算出。
3. **身份**：现在无 auth → 用匿名 id（localStorage uuid / PostHog 匿名 id）；Auth 落地后 `alias` 到 `user_id`（留存/复用必须有稳定身份）。
4. 工具：推荐 PostHog（自带漏斗/留存/Dashboard，免费额度够）。国内访问 PostHog Cloud 偏慢 → 早期也可 Supabase 自建 `events` 表 + 飞书多维表格看。事件定义与工具解耦，换工具不改埋点。

## 技术方案

### 事件表

| 事件 | 触发时机 | 关键属性 | 服务指标 |
|------|---------|---------|---------|
| `app_opened` | App 加载 | device, is_returning, days_since_last | 留存 |
| `practice_started` | 点 Start、开始录音 | mode, topic, stt_engine(webspeech/deepgram/none) | 漏斗起点 |
| `first_word_detected` | 首次收到非空字幕 | latency_ms, device | 10秒开口率 / STT 工作率 |
| `caption_unavailable` | STT 静默 / 不支持 | reason(no_key/unsupported/error/ios_mp4), device | 诊断手机端失败 |
| `phrase_highlighted` | 高价值词点亮 | word, is_first, latency_ms | 首次高亮 ≤8s |
| `pause_detected` | PauseWatcher 真停顿 | silence_ms | follow-up 分母 |
| `followup_shown` | 停顿后追问卡出现 | source(gemini/local/buffer), latency_ms | 停顿 follow-up 成功率 |
| `practice_ended` | 点 End | duration_s, words_count, completed | 完成率 |
| `takeaway_viewed` | 到达 `/session-end` | had_real_ai(真AI/本地兜底) | 复盘到达 / AI 健康 |
| `coach_chat_sent` | Coach Chatbox 发问 | preset(vocab/storyline/...) or freeform | 互动深度 |
| `practice_again_clicked` | Takeaway 的 Go again | — | Practice Again 率 |
| `highlight_reused` | 下一轮说出上次保存的词 | word, days_since_saved | 7日复用率 |
| `error_shown` | 任何用户可见报错 | where, reason | 系统健康度 |

### 指标公式

| 北极星指标 | 公式 |
|-----------|------|
| 10秒开口率 | `first_word_detected(latency≤10s)` ÷ `practice_started` |
| 首次 session 完成率 | `practice_ended(completed)` ÷ `practice_started` |
| 首次高亮触发时间 | `median(phrase_highlighted[is_first].latency_ms)` |
| 停顿 follow-up 成功率 | `followup_shown(source=gemini)` ÷ `pause_detected` |
| Practice Again 率 | `practice_again_clicked` ÷ `takeaway_viewed` |
| 次日留存 | D1 回访用户 ÷ D0 用户（`app_opened` + 稳定身份） |
| 7日复用率 | 7天内有 `highlight_reused` 的用户 ÷ 存过高光的用户 |

### 验证仪表盘（4 区块）

- **A 激活漏斗**（最重要）：`app_opened → practice_started → first_word(≤10s) → practice_ended(completed) → takeaway_viewed → practice_again`，每步转化率 + 流失。
- **B 实时体验质量**：首次高亮中位延迟(≤8s)；follow-up 成功率(≥80%)+延迟；**STT 工作率按 device 拆分**（手机 vs 桌面）；`caption_unavailable` 按 reason。
- **C 留存与复用**：次日/7日留存曲线；7日高亮复用率(≥30%)；人均练习次数。
- **D AI/系统健康度**：`error_shown` 按 reason；takeaway 真 AI 占比。

**全局筛选维度**：device（手机/桌面，最关键）、mode、is_returning、topic。

### 落地点（前端）

- 新建 `src/lib/analytics.ts`：`track(event, props)` 封装；首次生成并存匿名 id；Auth 后 `identify(user_id)`。
- 在各触发点插桩：`PracticeRoom`（started/first_word/caption_unavailable/phrase/pause/followup/ended）、`TakeawayPage`（viewed/coach_chat/practice_again）、`Home`（app_opened）、错误边界（error_shown）。

## 验证测试

- [ ] tsc --noEmit + build 通过
- [ ] 跑一次完整练习 → PostHog/events 表里能看到 started→first_word→ended→takeaway 全链路
- [ ] 手机端无字幕时 → `caption_unavailable(reason)` 上报
- [ ] 漏斗图能算出每步转化率；device 维度可拆分
- [ ] Auth 落地后匿名事件能 alias 到 user_id（留存不断档）
