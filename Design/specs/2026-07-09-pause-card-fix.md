# Spec（proposal，暂不实施）— 停顿提示卡：逻辑捋顺 + bug 修复

> 2026-07-09 · Owner 真机反馈（练习页停顿卡）· 文件：`src/pages/PracticeRoom.tsx`
> **状态：proposal / 存档，先不做进去。** 先厘清逻辑与工程/延时问题，确认后再实施。

## 现象（Owner 反馈）
1. 点击卡片（chip）后没有"拼接到页面上"（像没反应）。
2. 开始停顿时 AI 出卡片慢。
3. 想 Skip 跳不掉。
4. 整体体验怪。

## 现状逻辑（先捋清）
- **触发有两条并存的路**（核心问题）：
  - **路 A**：`useEffect` 里的 **250ms interval**（`beginPauseCoaching` 的调度）——`!showBottleneck && !pauseHandledRef && silence≥BOTTLENECK_SILENCE_MS(2500)` 即触发，**无冷却**。
  - **路 B**：VAD 音频回调里——`silence>2500 && canAskFollowUp（lastFollowUpAtRef + 5000 冷却）&& !bottleneckTimer && !showBottleneck` → `setTimeout(…,0)` → `beginPauseCoaching`。**有 5s 冷却**。
- **卡片内容**：`beginPauseCoaching` 先取 `bufferedReplyRef`（说话时预缓冲的 AI follow-up）；没有就 `localPauseReply` 立刻出本地 chips（`buildPauseSuggestions` 恒 ≥2），再 `resolvePauseReply()` 抢 2.8s AI，成功则 `enterReply` **再渲染一次**（替换 chips）。
- **点 chip**：`collapseFollowUpToTag()`（设 `miniCoachTip` 9s）+ 关卡 + `pauseHandledRef=false`。
- **Skip**：关卡 + `pauseHandledRef=false`。

## 诊断（根因）
1. **#3 Skip 跳不掉**：Skip/chip 把 `pauseHandledRef=false` 且**不更新 `lastVoiceAtRef`**；用户仍静默 → 路 A（无冷却）在 250ms 内再次满足 → 卡片秒回。→ 看起来 Skip/Use 无效。
2. **#1 点 chip 不上屏**：`collapseFollowUpToTag` 只写 `miniCoachTip`，但该文本**没有任何可见渲染**（仅让 `coachSecondaryLine` 变成 "One small prompt is parked below"）。选中的句子没被"拼接"到页面。叠加 #3 卡片秒回 → 更迷惑。
3. **#2 慢**：① 2.5s 阈值；② 本地 chips 秒显后被 2.8s 的 AI 结果**替换一次**（reflow/跳动），像没 settle。
4. **#4 怪** = 上述叠加 + 两条触发路时序不一致。
5. **架构味**：两套触发 + 两套冷却是乱象根源；`miniCoachTip` 是个"设了但没画"的半成品。

## 解决思路（proposal）
- **统一为单一触发**：留一条（建议留 250ms interval 那条，可读性好），删掉 VAD 里的 `bottleneckTimer` 触发路；**给它加统一冷却**（读 `lastFollowUpAtRef`）。
- **关卡要有冷却/防秒回**：Skip/Use 时**不要**把 `pauseHandledRef` 置回 false；改为**保持 true，直到用户重新开口**（VAD 检到语音时已有 `pauseHandledRef=false` 的复位，line ~1252）——即"处理过这次停顿，说话前不再弹"。或退一步：dismiss 时 `lastVoiceAtRef=Date.now()` 重置静默，至少给 2.5s 缓冲。
- **明确"点 chip 到底干嘛"（业务逻辑）**：推荐 = **选中的句子变成一条页面上可见、常驻的"教练提问"**（钉在字幕上方或猫下固定槽位），学生对着它继续说；开口或再点 X 才消。→ 真正"拼接到页面"，并把没渲染的 `miniCoachTip` 补上真实 UI。
- **消除内容跳动**：卡片出现后**不再中途替换 chips**。两种做法二选一：(a) 只用"说话时预缓冲好的 AI follow-up"（`bufferedReplyRef`）——出即是终态；缓冲没好就纯本地、且**不再**用 `resolvePauseReply` 覆盖；(b) 若要 AI，则在**触发前**就备好，不在卡片显示后替换。
- **延时**：`BOTTLENECK_SILENCE_MS` 2500 → 试 **2000** 左右（更跟手，但别太低触发到句中）；真机手感微调。

## 技术方案（待确认后实施，不在本次）
1. 删 VAD 内 `bottleneckTimer` 触发段（line ~1285-1294），停顿触发只保留 interval 那条；interval 内加 `Date.now()-lastFollowUpAtRef.current > 冷却` 判断。
2. Skip/Use 的 onClick：去掉 `pauseHandledRef.current=false`（保持 true，靠 VAD 开口复位）；或加 `lastVoiceAtRef.current=Date.now()`。
3. 定义"选中即钉住"：新增可见的 `pinnedPrompt` 渲染（固定槽位），替代半成品 `miniCoachTip`；点 chip → 设 pinnedPrompt + 关卡；开口/点 X 清除。
4. `beginPauseCoaching`：不再在显示后 `resolvePauseReply` 覆盖；改为出即终态（见解决思路）。
5. `BOTTLENECK_SILENCE_MS` 调参 + 真机验证。

## 验证测试（实施时）
tsc+build；真机：①停顿到卡片出现的耗时可接受、内容不再中途跳变；②点 chip → 选中句**可见地钉在页面**、能对着答；③Skip → 卡片**不再秒回**（要等重新开口后、且冷却后才可能再弹）；④连续停顿不会疯狂弹卡。

---

## 附：debate 模式想法（存档，先不做）
Owner 设想：一个更"结构化质疑"的教练模式——停顿卡不只温和追问，而是**像辩论对手一样质疑**："凭什么？给个例子？这里逻辑漏洞在哪？"
- 归位：这其实是 **场景/教练风格（`practice-mode` 的 coachStyle）+ 停顿 prompt 语气**的变体，可挂在 Debate 场景下。
- 与本 spec 关系：**先把停顿卡的工程 bug 修好、逻辑跑顺**，debate 语气是之后在稳定基座上加的一层 prompt/preset，不急。
