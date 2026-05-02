# SpeakSpark 技术架构设计

> 当前版本：Hybrid AI Setup  
> 项目 ref：`jyofoabobuwfowpctbfd`

## 技术栈

| 层 | 技术 | 当前用途 |
|----|------|----------|
| 前端 | React 18 + TypeScript + Vite | 四页 App、实时练习、Takeaway、My Page |
| UI | Tailwind CSS + shadcn-ui | 移动端 App 风格界面 |
| 实时音频 | Web Audio API | 音浪、VAD、停顿检测、音频 chunk |
| 实时字幕 | Web Speech API / SpeechRecognition | 即时字幕，不作为 AI 唯一输入 |
| 后端 | Supabase PostgreSQL + Edge Functions | 数据、函数、AI key broker |
| 主 AI | Google Gemini | 实时反馈、Next Run Plan、Coach Chatbox |
| Legacy AI | OpenAI via `analyze-voice` | 旧语音分析备用链路，不阻塞当前主流程 |

## AI 链路

### 当前主链路：Gemini

- `PracticeRoom` 把滚动音频片段交给 Gemini，用于内容相关反馈、卡壳追问、高光词和 KTV 分数增量。
- `TakeawayPage` 基于 `transcript / highlightWords / ktvEvents / ktvScore` 调 Gemini 生成 Next Run Plan。
- Coach Chatbox 的预设按钮和输入框都基于同一份 session context 调 Gemini。
- 前端优先使用 `sessionStorage["meaningfully.geminiApiKey"]`，也支持本地 `VITE_GEMINI_API_KEY`；没有缓存时调用 `get-gemini-api-key` Edge Function。

### Key Broker：Supabase Edge Function

- 本地源码：`supabase/functions/get-gemini-api-key/index.ts`
- 远端部署命令：

```bash
npx supabase functions deploy get-gemini-api-key --project-ref jyofoabobuwfowpctbfd
```

- 远端必需 secret：

```bash
npx supabase secrets set GEMINI_API_KEY=GoogleGeminiKey --project-ref jyofoabobuwfowpctbfd
```

### Legacy 备用链路：OpenAI analyze-voice

- 本地源码：`supabase/functions/analyze-voice/index.ts`
- 这是旧项目保留的语音分析函数，依赖 `OPENAI_API_KEY`。
- 当前四页 App 主流程不依赖它；只有继续调用旧 `Practice.tsx` / legacy 分析流程时才需要。
- 如果要启用，需要确认远端 secret：

```bash
npx supabase secrets set OPENAI_API_KEY=OpenAIKey --project-ref jyofoabobuwfowpctbfd
```

## 当前功能状态

- 四页结构已完成：Start / Practice / Takeaway / My。
- Practice 页已接入实时字幕、Web Audio 音浪、VAD、猫猫陪练、Gemini 实时分析入口。
- Takeaway 页已接 sessionStorage，支持刷新后读取 last session，并提供 Gemini 生成的 Next Run Plan 与 Coach Chatbox。
- My Page 是 UI 原型，暂未接真实数据库。
- Gemini 不可用时，Takeaway 有本地 fallback，demo 不会卡死，但这不代表真实 Gemini 已成功。

## 当前缺口

- `meaningfully-main` 只确认有 `OPENAI_API_KEY`，没有看到 `GEMINI_API_KEY`。
- 当前机器没有 Supabase access token，无法直接部署远端 function 或设置 remote secrets。
- 需要项目 owner 在 Supabase 远端部署 `get-gemini-api-key` 并配置 `GEMINI_API_KEY`。

## 朋友需要提供

1. Supabase 项目权限，或可用的 Supabase access token。
2. Google Gemini API key。
3. 执行或协助执行：

```bash
npx supabase secrets set GEMINI_API_KEY=GoogleGeminiKey --project-ref jyofoabobuwfowpctbfd
npx supabase functions deploy get-gemini-api-key --project-ref jyofoabobuwfowpctbfd
```

4. 如果还要保留旧 `analyze-voice` 线上可用，再确认远端有 `OPENAI_API_KEY`。
