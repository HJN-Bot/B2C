# Spec — 练习页"说话板块"重设计（A/B/C/D）

> 2026-06-11 · 对应 TODO：P2·说话板块 · 文件：`src/pages/PracticeRoom.tsx` (+ `index.css`) · 状态：✅ 已实现 🧪 待验证
> 注：练习页有一批同方向的未提交 JSX 重构（cat-stage/bubble-stack/transcript-reel/prompt-card，CSS 缺失）。本次"接着完成"：补全 `practice-*` CSS + 接 A/B/C/D 逻辑。
> 经 Grill Me 走完设计树，4 个分叉已锁定。

## 修改建议
练习中"说话板块"效率不够：字幕越说越长、AI 停顿反应慢且不知问什么、布局散、对话内容多。要做成低延迟、低噪音、当前句锁中间的提词器 + 停顿即接的 AI。

## 解决思路
- **A 字幕**：固定 5 行提词器窗口，当前句锁**中间**高亮，旧句上滚淡出，高度不随说话增长。
- **B AI 实时（核心洞察）**：现在 `processPhrase` 每段语音已在调 Gemini、返回里本就有 `follow_up`，只是没用好。→ 让每段顺带准备好"若现在停会问什么"，存成 **ready 缓冲**；停顿直接弹队头（0 等待）；缓冲空→本地题库秒出；可后台再刷新升级。几乎不增加 API 调用。
- **C 触发**：停顿阈值 4.8s → **3s**。
- **D 布局**：竖排（移动端左右两列把字幕挤太窄）。猫猫不缩小、**居中** → 中间 5 行字幕主视觉 → 下方**一张精简反馈卡**（合并原气泡/停顿卡/miniCoachTip，砍冗余）。

## 技术方案
1. **A**：新增 `recentLines(transcript, n=3)`（按句切，取末 3）。字幕容器固定高 `~8.5rem`、`flex-col justify-center`、上下渐隐：渲染 prev(灰) → current(粗高亮，居中) → interim(蓝)。去掉无限滚动。
2. **B**：
   - `SYSTEM_PROMPT` 的 `follow_up` 改为**总是**给一个"若现在停"的候选问题/提示，并加 `follow_up_kind`。
   - `processPhrase` 把 `result.follow_up`/kind 存进 `bufferedReplyRef`。
   - `beginPauseCoaching`：有缓冲→直接 `enterReply`（跳过 thinking，0 等待）；无→`localPauseReply` 秒出；后台 `fetchFollowUpReply` ≤2.5s 命中则升级。
3. **C**：`BOTTLENECK_SILENCE_MS` 4800 → 3000（相关 cooldown 同步）。
4. **D**：猫居中（去掉并排 bubble 的喧宾夺主）；删 `miniCoachTip` 元素；停顿反馈只留一张卡。

## 验证测试
tsc + build；手动 `#/practice`（Chrome/Edge+麦克风）：连续说→字幕固定 5 行、当前句锁中间、旧句上滚不撑高；停 3s→**立刻**弹出基于刚说内容的问题（不再等 1-3s）；版面只剩 猫(居中)+字幕+一张反馈卡，不杂。
