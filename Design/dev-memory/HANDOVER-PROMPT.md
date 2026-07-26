# SpeakPeak · Handover Prompt（直接粘给接手 agent）

> 复制下面代码块整段发给另一个 agent 即可。它会去读仓库里对应的文件。

```
你将接手 SpeakPeak（代码库里仍叫 speakspark）—— 一个面向中国 6–9 年级学生的
英文演讲 / 辩论实时陪练教练网页 App（Vite + React + TS + Tailwind，手机端，
HashRouter，状态存 local/sessionStorage，AI 走 Supabase Edge Function 代理）。
已上线：https://speakpeak.vercel.app

【仓库】
- GitHub: https://github.com/HJN-Bot/B2C  分支 jianan/speakspark
- 本地目录（若同机）: /Users/jianan/Documents/个人开发/B2C/B2C （注意嵌套 B2C/B2C）
- 拉取: git clone -b jianan/speakspark https://github.com/HJN-Bot/B2C.git
- ⚠️ .env（Deepgram key）和 EdgeOne token 不在仓库里，需 Owner 另外给。

【开工先读，按顺序】
1. Design/dev-memory/PROJECT-BRIEF-交接.md —— 设计思考 / 目前进展 / Owner 的 concern
   （先读这份，理解"为什么做、在哪、担心什么"）
2. Design/dev-memory/HANDOVER-MASTER.md —— 技术全景：架构、文件地图、密钥、已知坑、
   Takeaway 待办（第 9 节有精确断点）、App 内 AI prompt、启动细节
3. Design/specs/2026-07-13-takeaway-fixes.md —— 当前在飞任务的四板块 spec
4. Design/specs/2026-07-26-spike-go-no-go.md —— 评估"要不要继续投入"的验证 spike
   （Owner 正在权衡，别越过它闷头做重活）

【关键背景，务必先懂】
- 定位：练习"教练"，不是评分器 / 比赛。红线：不生成整篇演讲、不打分 / 排名、说话时不实时纠错。
- Owner 真正的问号是 go/no-go（能不能推广出去、值不值得继续投入）。
  "后端依赖别人""国内访问没解决"都是这个根因的下游 —— 拿到用户信号前不碰重基建
  （.cn 备案 / 自建后端），也不上 LangGraph。
- 分销走 IP 化（Owner 小红书 + 现有群），验证阶段几乎不依赖国内基建，Vercel 链接够用。

【近期任务（Owner 仍在评估，先做低成本、能提升产品的部分）】
1. 修 Takeaway 复盘页 AI 反馈质量（4 项：换词多样性 / 把"你自己原话"改写 / 针对本次内容的
   追问 / 不每次重生成）。schema 层已在 commit c46bdb8 做完，UI 待接线——见 HANDOVER-MASTER
   第 9 节精确断点。
2. 换 AI API 到 DeepSeek（OpenAI 兼容，国内更稳更省）——改 supabase/functions/gemini-proxy，
   本机无 supabase CLI，部署交给 Owner。

【工作方式】
- 没有单测：我们的"测试" = npx tsc --noEmit + npm run build + 浏览器手验。
- 每个修改点先在 Design/specs/YYYY-MM-DD-*.md 写四板块 spec
  （修改建议 / 解决思路 / 技术方案 / 验证）再动手。
- i18n 只译界面 chrome，练习内容保持英文。
- 只在 Owner 要求时提交 / 推送；commit 结尾加
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```
