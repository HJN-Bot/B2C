# Spec · Takeaway 复盘页四处修复（2026-07-13）

来源：Owner 测试反馈——Words 换不出新词 / Sentences 硬塞名人名言 / Coach 问题笼统 / 每次回页面重新生成。

---

## 1. Words 只在同一小池里洗牌

**修改建议**：Shuffle 要真的换出新的升级词，不是把那 3 个重排。

**解决思路**：池子太小是根因——AI 只返 3–5 个 `reuse_words`，Shuffle 从里面随机取 3。把池子做大 + Shuffle 改成翻页轮播。

**技术方案**：
- `buildTakeawayPrompt`：`reuse_words` 由 3–5 改为 **6–10** 个"原词 → 升级词"。
- `normalizeTakeaway`：`reuse_words` 上限从 4 提到 10。
- UI：`wordPage` 状态，`shownWords = reuse_words.slice(page*3, page*3+3)`（不足补开头，环绕）；Shuffle 令 `page = (page+1) % ceil(len/3)`。`reuse_words.length > 3` 就显示 Shuffle。

**验证**：连点 Shuffle，3 组词轮换且覆盖全部升级词后回到第一组；只有 ≤3 个时不显示按钮。

---

## 2. Sentences 硬塞名人名言 → 改写「你自己的原话」

**修改建议**：删掉不相关的名人名言，换成"针对我这句原话，给我 3 个改写版"，每张可收藏。

**解决思路**：AI 已经会产 `say_this`（一句改写）。扩成"锁定我一句真实原话 + 给 3 个升级改写"，可 pin 存进金句库。

**技术方案**：
- AI 新增字段：`base_sentence`（它要改写的、我真实说过的那句）、`sentence_rewrites`（3 个升级版，保义、升结构/连接词）。
- `normalizeTakeaway`：解析这两个字段；AI 失败的本地兜底用 `say_this` + 简单 frame 拼 2–3 条。
- UI：移除 `pickStealLines` 名人名言块。改为：`You said: "{base_sentence}"` + 3 张 rewrite 卡，每张 pin 图标 `toggleLine(rewrite, "Your line")` 存入 saved-lines（下次练习 Ready 卡带回）。

**验证**：复盘页 Sentences 区不再出现名人名言；显示我原话 + 3 条改写；点 pin 变蓝、My 页金句库出现。

---

## 3a. Coach 问题笼统（不引入 LangGraph/LangChain）

**修改建议**：把写死的 6 个通用快捷问题，换成针对我这次原话的具体追问。

**解决思路**：病因是 prompt/上下文，不是缺 agent 编排框架。纯前端 SPA 无服务端跑 LangGraph，且与"冻结自建后端"策略冲突。让复盘 AI 一次性顺带产出针对性问题即可。

**技术方案**：
- AI 新增 `follow_up_questions`（3 条，基于我原话的具体问题，如"你说社媒伤睡眠——证据是什么？"）。
- UI：coach 快捷键由这 3 条动态生成（点击 = 让 coach 就这条给我一个提示框架并追问，不代答）；AI 失败时回退到原静态 PRESETS 中的 2 条通用项。

**验证**：复盘后 coach 快捷键显示与本次话题相关的问题；点击后 coach 回复紧扣原话。

---

## 3b. 每次回 Takeaway 都重新生成

**修改建议**：复盘生成一次后缓存；去 My 页再回来不该重新生成。

**解决思路**：组件 remount → `useEffect` 无条件 `generateTakeaway`，state 全丢。按 session 签名缓存结果到 sessionStorage，命中就直接读。

**技术方案**：
- `sessionSig = hash(timer|wordCount|transcript 前 80 字)`。
- 缓存键 `meaningfully.takeawayCache = { sig, takeaway, chatMessages, chatHistory }`。
- 挂载时：`cache.sig === sessionSig && cache.takeaway` → 直接恢复 takeaway/chat，**跳过 AI**；否则生成并写缓存。
- 每轮 chat 后更新缓存里的 chatMessages/history（对话也持久）。
- 新练习（带新 state）签名不同 → 正常重生成。

**验证**：复盘生成后切 My 再回，秒开且无 loading、无二次网络调用；开始新一次练习则重新生成。
