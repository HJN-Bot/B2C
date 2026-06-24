

> 2026-06-24 · 反馈 [user-testing-1 #2/#3 + Owner 愿景](../user-feedback/submissions/2026-06-24-user-testing-1-analysis.md)（档位 A，③升级）· 文件：`src/pages/TakeawayPage.tsx`

## 修改建议
1. **报告过长、无层次**："skimmed and left"（行为信号）。当前四大块全展开、长页（[TakeawayPage.tsx](../../src/pages/TakeawayPage.tsx)）。
2. **词汇被埋没**：用户**主动夸**的唯一模块（liked vocabulary feedback），但 reuse_words 现在只是 Change 块里的几个 chip。
3. **Owner 愿景**：Takeaway 不只评估，要**教用户怎么把话说漂亮**——对标高赞英语视频里"一看就想记下来"的句式/词汇 takeaway。

## 解决思路
- **首屏瘦身、无分**（红线：coach not evaluator，**不出现数字总评分**）：headline（鼓励）+ Your best line（带引用）+ One thing to level up。
- **新增默认展开的明星模块 "Say it like this"**（= ③"独立词汇模块默认展开"的最终形态），含三小块：Steal these lines（句式模板）/ Power up your words（词汇升级）/ Build out your idea（怎么展开）。
- **句式走「精选库 + AI 填空 + 静态兜底」**（Owner 拍板）：稳、抓人靠精选模板本身，AI 只把用户 topic/词填进去；AI 失败纯静态展示模板。
- **其余折叠**：Your run in detail（讲了什么/更多做得好/进步条）、Coach chatbox 默认收起、可点开。

## 技术方案
1. **精选句式库常量** `SENTENCE_FRAMES`（静态，对标高赞金句）：如
   - `"When it comes to {topic}, what most people miss is ___"`
   - `"The crazy part is ___"`
   - `"Here's why that matters: ___"`
   `power_words` 升级表也可备静态兜底（their word → stronger word + 例句）。
2. **数据结构**：`AiTakeaway`（interface 见 line 29-48）新增
   ```ts
   say_it_like_this?: {
     patterns: { template: string; filled: string }[];   // 句式：AI 用 topic 填空
     power_words: { from: string; to: string; example: string }[];
     build_out: { weak_quote: string; skeleton: string[] }; // claim→example→why→so what
   }
   ```
3. **AI 生成**：扩 takeaway 的 Gemini prompt，要求产出 `say_it_like_this`（patterns 从给定 frames 里挑并填、power_words 基于用户原词、build_out 取用户磕巴/单薄的一段）。`normalizeTakeaway`（line 169）补默认：patterns 缺 → 用 `SENTENCE_FRAMES` 填 topic；power_words 缺 → 从 `getUsefulWords`（line 187）升级；build_out 缺 → 用 best/weakest quote + 通用骨架。
4. **本地兜底**：`createLocalTakeaway`（line 198）也产 `say_it_like_this`（纯静态 frames + getUsefulWords），保证 AI 失败时该模块仍满。
5. **渲染重排**（render，line 560-877）：
   - **首屏**：`celebrationHeadline`（已有，line 110）+ "Your best line"（复用 what_worked[0] + quote，line 579-589）+ "One thing to level up"（make_stronger[0] 精简）。**移除任何数字总评分**（本就无，确认不引入）。
   - **明星模块 "Say it like this"**：默认展开，三小块卡片，视觉做漂亮（金句感）。
   - **折叠区**：Block③ Your run in detail（summary / more did well / 进度条 line 717-799）、Block④ Coach（line 801-867）改为受控折叠（`<details>` 或 state，默认收起）。
   - 保留 `takeawayError` 诚实兜底提示（line 562-575）；折叠不影响"AI 失败显示基础版"逻辑。
6. **红线自查**：进步条（KTV 0–100 数字，line 780）属"私人证据"放在折叠的"详情"里，不进首屏、不叫"总评分"——保持私人信号而非成绩。

## 验证测试
tsc + build；手动：①练一次→报告**首屏**只见 headline + best line + one-to-level-up + "Say it like this"（默认展开），无需长滑；②Your run in detail / Coach **默认折叠**、点开正常；③句式模板套到了本次 topic；④AI 失败（断网/琥珀提示）时 "Say it like this" 仍有静态模板+词汇、不空；⑤全页**无数字总评分**；⑥"Practice Again / Start" 按钮仍在。
