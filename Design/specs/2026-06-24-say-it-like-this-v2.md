# Spec — "Say it like this" v2：storytelling-architecture 语言引擎

> 2026-06-24 · 承接已上线的 [v1](./2026-06-24-takeaway-say-it-like-this.md) · 文件：`src/pages/TakeawayPage.tsx`、新 `src/lib/language-library.ts`、新 `src/lib/saved-lines.ts`、`src/pages/PracticeRoom.tsx`
> Owner 拍板：结构=**三层嵌套（故事/句式/词汇）**；范围=**全套**（金句库 + AI 选填重写 + pin→下次练习闭环）。

## 修改建议（v1 的三个窟窿）
1. **金句没出处**：v1 的 5 句 `SENTENCE_FRAMES` 是手写占位，非权威来源，质量/可维护性差。
2. **AI 不感知金句、不会"讲故事架构"**：`buildTakeawayPrompt` 只按 IELTS 四维产 `reuse_words`/`say_this`，与金句库脱节，没有 hook/arc/landing 的概念。
3. **没有"带到下次练习"的闭环**：用户看到好句式后，下次练习页无法把它"钉"在眼前去照着说。

## 解决思路
**表达力 = 三层嵌套**，故事架构是骨架，往下逐层填充（架构划槽位 → 强句式填槽位 → 强词砌句式）：
- ① 词汇：精准 / 生动 / 学科语域 / 搭配短语（拿他用过的词升级）。
- ② 句式：可复用的**功能化金句框架**（hook / claim / example / causal / contrast / emphasis / closing）。
- ③ 故事：科普微演讲脊柱 **Hook → Claim → Example → Why it matters → Landing**，指出他缺的槽位。

维护方式：**手工维护一个"功能标签金句库"（质量可控、来源可查）+ AI 负责"选对框架并用他的内容填空"**。AI 失败时纯静态库兜底，永不空。

## 技术方案

### 1. 新建 `src/lib/language-library.ts`（可维护的金句库）
```ts
export type FrameFn = "hook" | "claim" | "example" | "causal" | "contrast" | "emphasis" | "closing";
export interface Frame { id: string; fn: FrameFn; template: string; example: string; whenToUse: string; source: string; }
export const STORY_SPINE = ["hook", "claim", "example", "why", "landing"] as const;
export const FRAMES: Frame[] = [ /* 见下方 v1 草案 */ ];
export function framesByFn(fn: FrameFn): Frame[] { ... }
export function fillFrame(t: string, vars: { topic?: string; word?: string }): string { ... }
```

**v1 金句库草案（请你逐条 vet / 增删——这就是"维护金句"的入口）**：

| fn | template | 来源依据 |
|---|---|---|
| hook | "Ever wondered why {topic} ___?" | 短视频/TED 设问钩子 |
| hook | "Most people think {topic} is ___ — but actually ___." | 反转钩子（antithesis） |
| claim | "My main point is that ___." | IELTS 连贯-主张 |
| claim | "What's really going on is ___." | signposting |
| example | "For instance, ___." / "One striking example is ___." | Academic Phrasebank（举例） |
| causal | "This matters because ___." / "As a result, ___." | IELTS band-7 连接词 |
| contrast | "It's not ___, it's ___." | 修辞对比 |
| emphasis | "The surprising part is ___." / "Here's the key: ___." | 强调 |
| closing | "So next time you ___, remember ___." | 落点/号召 |

（每条都标 `source`，方便后续替换成更权威的版本；可从 Manchester Academic Phrasebank、IELTS 口语高分连接词、经典修辞格扩充。）

### 2. 重写 AI prompt（`buildTakeawayPrompt`）—— 按故事架构思考 + 选填
- 在 prompt 里**注入按 fn 分组的候选 frames**，要求 AI：①判断他故事脊柱缺哪个槽位 ②从候选 frames 选 2–3 个最贴他内容的、用他的 topic/原话填空 ③给 2–4 个 "他的词→更强词(+可选短语)"。
- 新增输出字段（同时改 `AiTakeaway` interface）：
```ts
say_it_like_this?: {
  story: { missing_slot: string; note: string };      // 缺哪段 + 一句话怎么补
  lines: { fn: FrameFn; filled: string }[];           // 选中并填好的金句
  words: { from: string; to: string; phrase?: string }[];
}
```
- ⚠️ token：`gemini-2.5-flash` thinking 吃 ~700-800 token，已知坑。Takeaway 走 `maxOutputTokens: 4000`（保留 thinking，非实时），加字段后留意是否要再调高/精简别处。

### 3. 兜底（AI 失败 / 字段缺失）
- `normalizeTakeaway` + `createLocalTakeaway`：缺 `say_it_like_this` 时，用 `language-library` 按"最弱 KTV 维度→对应槽位"选 frames 填 `topicWord`；`words` 用现有 `reuse_words`/`getUsefulWords`。保证三层都不空。

### 4. 整份报告信息架构（IA 重排 + 分区惊艳度）—— Owner 2026-06-24
现状问题：分区不够明显，用户"不能一下子明白每块让我干嘛"；三点（词汇/句式/故事）不清晰。
新 5 段，每段**带编号大标题 + 一句"这块干嘛"副标**，视觉界限分明：

```
① Your run        你刚才讲了什么（AI summary 1–2 句）+ 时长/词数        〔总结表现，无分〕
② What you nailed  最好的一句(原文引用) + Strong/Growing 词性标签        〔做得好，无数字分〕
③ Level up         三张界限分明的卡：✨Words / 🧱Sentences / 🎬Storytelling 〔需要提升=本 spec 三层〕
④ In detail        折叠：完整 summary / 更多做得好 / KTV 0–100 进步条       〔细致表现〕
⑤ Coach            折叠：问答 chatbox                                       〔Coach〕
```

- 首屏 = ①+②（短，回应"报告太长"）；③ 默认展开（明星）；④⑤ `<details>` 默认折叠。
- ② 用**词性标签**（Strong/Growing，非裸数字）当"做得好的证据"；裸 0–100 数字只留 ④。
- ③ 三张卡**配色/图标各异**（Words=绿、Sentences=蓝、Storytelling=紫），每卡一句 purpose 副标，解决"三点不清晰"。

### 4b. ③ Level up 三张卡内容（= 三层嵌套语言引擎）
- **✨ Words**：`say_it_like_this.words` 的「弱词→强词(+短语)」chip。
- **🧱 Sentences（Steal these lines）**：`say_it_like_this.lines` 列表（每条带 fn 小标签），每条一个 **☆ Use this next time**。
- **🎬 Storytelling（Shape your story）**：脊柱五段可视化 + 高亮 `story.missing_slot` + `story.note`。
- `make_stronger[0]` 不再单列首屏，并入 ③ 的 Storytelling/相应卡作为"这次最该补的一点"。

### 5. pin → 下次练习闭环
- 新建 `src/lib/saved-lines.ts`：`saveLine(text)` / `getSavedLines()` / `removeLine(id)`（localStorage，仿 `trying-point.ts`，上限如 5 条、去重）。
- Takeaway 的 ☆ → `saveLine`。
- `PracticeRoom.tsx` **开录前的 Ready 卡**（P0 那张）里加一条 "Lines to try" 区，列出已存句式（只读、可单条移除）。⚠️ **只在开录前显示，录音中不变化**（守⑤"录音时不看屏"）。
- 闭环：结果页教 → ☆ pin → 下次 Ready 卡看到 → 照着说 → 成 highlight。

## 验证测试
tsc + build；手动：①结果页三层 takeaway 都在、Shape your story 正确高亮缺失槽位；②`lines` 是用本次 topic/原话填好的、不是空模板；③断网/AI 失败时三层仍有静态库内容、不空；④点 ☆ 存一句 → 进 `/#/practice` 的 Ready 卡能看到、可移除、录音中不跳变；⑤全页仍**无数字总评分**；⑥token 不截断（结果页正常出 AI 版而非频繁退本地）。

## 待你 vet
- 上面的 **v1 金句库草案**逐条看：哪些留、哪些换、要不要加中文学生常见的"想说但说不好"的场景句式。这是这个功能的内容内核，值得你亲自定调。
