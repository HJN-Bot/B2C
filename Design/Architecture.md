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

---

## 2026-06-23 更新：Owner Transition 决策

### P0 — 移动端云端 STT
- **决策：Deepgram Nova-2**（WebSocket 实时 STT）
- 桌面端保留 SpeechRecognition，移动端 fallback 到 Deepgram
- 详见 [spec](specs/2026-06-23-mobile-cloud-stt.md)

### P1 — Supabase Auth
- **决策：Supabase Auth Magic Link**（邮箱无密码登录）
- 新建 AuthProvider + SignIn 页 + 路由守卫
- 详见 [spec](specs/2026-06-23-supabase-auth.md)

### P2a — Session 落库
- **决策：Supabase PostgreSQL sessions 表 + RLS**
- localStorage 保留为本地缓存，Supabase 为 source of truth
- 详见 [spec](specs/2026-06-23-session-db-persistence.md)

### Infra 归属
- Supabase + Gemini key 待迁移到 Jianan 个人账户
- 详见 [基础设施决策文档](https://my.feishu.cn/wiki/OwcEwuBWsiTBfykY6o3cD2jinUb)（已删除，新文档在 [待决策专区](https://my.feishu.cn/wiki/LSsLwt1U6i2d7NkfebccHiu7nMh)）

---

## 2026-06-23 晚间更新

### 部署
- **Vercel（海外）：** https://speakspark.vercel.app
- **EdgeOne Pages（国内）：** https://speakspark-0zgkikod.edgeone.cool
- EdgeOne 部署通过 CLI (`edgeone makers deploy`)，Project ID: makers-uefwmvwbhogy

### 技术决策汇总
| 决策 | 选择 | 原因 |
|------|------|------|
| 移动端 STT | Deepgram Nova-2 | 实时 WebSocket、免费 200h/月 |
| 国内部署 | 腾讯云 EdgeOne Pages | 接 GitHub、国内 CDN、免费额度 |
| Auth | Supabase Auth Magic Link | 无密码、最低摩擦 |
| Session 存储 | Supabase PostgreSQL + RLS | 替换 localStorage |

### 书籍参考
- Crossing the Chasm — beachhead strategy
- Inside the Tornado — bowling alley + tornado phases
- Who Says Elephants Can't Dance — owner mindset + culture change
