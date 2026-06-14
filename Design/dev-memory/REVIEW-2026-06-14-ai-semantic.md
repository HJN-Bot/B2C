# 审阅清单 · 2026-06-14 AI 真听懂 + Navigator 空槽 + 停顿卡优先真 AI

> tsc + build 通过，**未浏览器验证**。Spec：[2026-06-14-ai-semantic-and-card](../specs/2026-06-14-ai-semantic-and-card.md)。
> ⚠️ 最关键的"真 AI 是否跑通"我在本机无法验证（需真机 + 已部署的 `gemini-proxy`）。

## 根因（已定位）
用户截图的 Takeaway 整屏（到处 `definitely`、`My main point is about definitely…`、`Reuse 2-3 stronger science words`）**全是本地兜底模板** `createLocalTakeaway`/`createLocalChatAnswer`。说明 AI takeaway/chat 对该用户**在静默失败回退**，界面却伪装成正常结果，所以"显得笨"。

## 改动（全部前端，无需重新部署 edge function）

| 项 | 改动 | 🧪 验证点 | ⚠️ |
|---|------|-----------|----|
| 截断 | takeaway `maxOutputTokens` 900→**1600**、chat 600→**900** | 若失败原因是 JSON 被截断，这步应让 AI 正常返回 | 截断只是最可能根因之一 |
| **失败可见** | `takeawayError` 现在**渲染成琥珀提示条**（图标 + "Coach AI didn't respond — showing a basic version" + **具体 reason** + Try again） | AI 失败时顶部出现该条；**把 reason 截图给开发**就能判定是截断/代理/未部署 | 这是本次最重要的诊断手段 |
| prompt 升级 | 要求：summary=完整句讲真实主题（非词表）；reuse_words=「你的词 → 升级同义词」3-5 个；say_this=把学生**真实那句**升级（不复读关键词）；focus/one_move/make_stronger **点名最弱 KTV 维度**给定制建议；amplify=最强维度怎么放大 | AI 成功时：总结是主题句、建议对准 KTV、给同义词、say_this 连贯 | 仅在 AI 真跑通时体现 |
| 本地去套路 | 兜底 summary/say_this 改成**明显的占位**（"Basic recap — the AI summary couldn't load"、填空 frame），不再编造假具体 | AI 失败时兜底不再假装懂你 | — |
| Navigator 空槽 | 开练后第二步 spotlight 从空卡槽 `coachSlotRef` 改指**猫 `coachRef`**（始终可见）+ 改文案；删除无用 `coachSlotRef` | `#/practice`→Start→第二步高亮**猫**、不再指空地方 | — |
| 停顿卡优先真 AI | 重写 `beginPauseCoaching`：有预生成缓冲→0 等待弹真 AI；无缓冲→猫显示 thinking + 实时 AI（≤2.8s）→ 成功用 AI、失败才本地。`resolvePauseReply` 去掉旧的 700ms 抢先本地（复活原死代码 `resolvePauseReply`/`fetchFollowUpReply`） | 停顿：有缓冲秒弹；无缓冲先 thinking 再弹 AI；断网才本地通用问题 | ⚠️ 无缓冲时多了最多 2.8s thinking 等待（换来相关性）；首次停顿通常无缓冲 |

## 下一步（需用户）
- 真机跑一次 `#/session-end`：**若出现琥珀提示条，把 reason 文案发我** → 据此判定：
  - reason 像 "unreadable takeaway format" → 之前是截断，1600 token 应已修复，再试应正常。
  - reason 像 proxy/function/网络错误 → edge function 未部署或 key 问题，需用户侧部署 `gemini-proxy`。
- 语音识别本身的错词（definitely→finitely）是另一层（浏览器 SpeechRecognition 精度），AI 跑通后再评估要不要纠错。
