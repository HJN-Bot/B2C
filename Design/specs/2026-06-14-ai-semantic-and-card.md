# Spec — AI 真听懂（Takeaway/Coach）+ Navigator 空槽 + 停顿卡优先真 AI

> 2026-06-14 · 文件：`src/pages/TakeawayPage.tsx`、`src/pages/PracticeRoom.tsx` · 状态：✅ 已实现 🧪 待浏览器验证（⚠️ 真 AI 是否跑通需真机+已部署 edge function 才能确认）
> 触发：用户反馈 Takeaway 总结/建议"不智能、套路化、牛头不对马嘴"，Coach 问答也要语义理解。

## 修改建议
1. **核心：Takeaway 与 Coach 现在经常静默回退到本地关键词模板**（用户看到的 `definitely / swimming` 词堆、`My main point is about definitely…`、`Reuse 2-3 stronger science words` 全是 `createLocalTakeaway`/`createLocalChatAnswer`）。要让真 AI 真正跑起来、且输出是"基于语义理解的定制建议"。
2. **Navigator**：开练后第二步 spotlight 指向了"还没出现的小卡空槽位"，要修。
3. **停顿小卡**：照常弹，但优先真 AI；本地仅兜底。

## 解决思路
### A. 让 AI 真跑成功（全部前端，无需重新部署 edge function）
- **截断**是最可能根因：takeaway 大 JSON 在 `maxOutputTokens:900` 下易被截 → 解析失败 → 退本地。调大：takeaway 900→1600、chat 600→900。
- **失败要可见**：现在 `takeawayError` 抓到却不渲染，兜底伪装成正常结果。→ 当 `takeawayError` 非空时显示琥珀色提示条「Coach AI didn't respond — showing a basic version」+ 具体 reason（用于判断到底是截断 / 代理 / 未部署）。
- **本地兜底去套路化**：失败时不再编造"假具体"（如把单个关键词当主题、`My main point is about {word}`），改成中性、明显是"基础版"的占位，避免误导。

### B. 输出要"语义理解 + 定制"（强化 prompt）
- `summary`：用 1-2 句**完整句**说清学生**实际在讲什么主题/论点**（例："You explained how renewable energy could replace coal."），不是词表。
- `reuse_words`：给**同义词/升级替换**——针对学生用过的词给更高级的替代（synonym upgrades），而非泛词。
- `say_this`：必须是学生**那个真实论点**的连贯升级版（带真连接词/结构），绝不回声单个关键词。
- `make_stronger` / `amplify` / `focus` / `one_move`：明确**对准四个 KTV 计分维度**（flow/words/sentences/story）给定制建议，并点名是哪个维度最弱、怎么补。

### C. Navigator 空槽（PracticeRoom）
- 开练后第二步 `ref` 从 `coachSlotRef`（空卡槽）改为 `coachRef`（猫，始终可见）；文案讲清"停顿时这里下方会冒出一个针对你刚说内容的小问题/提示"。删除不再使用的 `coachSlotRef`。

### D. 停顿卡优先真 AI（PracticeRoom）
- 重写 `beginPauseCoaching`：有 `bufferedReplyRef`（说话时预生成的真 AI follow-up）→ 0 等待直接弹；无缓冲 → 进入 thinking 态 + 调 `resolvePauseReply` 走**实时 AI（≤2.8s）**，成功用 AI、失败才用本地。
- `resolvePauseReply` 去掉旧的 700ms"抢先本地"（与"优先真 AI"冲突）：thinking → `fetchFollowUpReply` race 2.8s → AI 或 本地。
- 复活 `fetchFollowUpReply`/`resolvePauseReply`（原为死代码）。

## 技术方案
- TakeawayPage：改两处 `callGeminiProxy` 的 `maxOutputTokens`；render 顶部加 error banner；改 `buildTakeawayPrompt` 文案与 schema 注释；软化 `createLocalTakeaway` summary/say_this。
- PracticeRoom：navigator step ref + 文案；`beginPauseCoaching` + `resolvePauseReply` 重写。

## 验证测试
- tsc + build。
- 手动 `#/session-end`（先练一次）：若 AI 成功 → 总结是完整句主题、建议对准 KTV 维度、reuse_words 是同义升级、say_this 连贯不复读关键词；若失败 → 顶部出现琥珀提示条 + reason（把 reason 反馈给开发以定位是截断还是代理/部署）。
- `#/practice`：停顿→有缓冲立刻弹真 AI；无缓冲先 thinking 再弹（≤2.8s）AI，断网才本地。Navigator 第二步指向猫、不再指空槽。
