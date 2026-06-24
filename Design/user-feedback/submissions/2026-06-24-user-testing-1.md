# SpeakSpark 用户测试反馈 #1

## 基本信息
- 测试日期：2026-06-24（推测，基于上下文日期）
- 测试人：未署名（用户测试参与者）
- 测试环境：手机端
- 使用场景：CIL 口语练习

## 任务完成度
- [ ] 能成功进入练习页面 ❌ — Start Practice 需要点击两次
- [x] 完成了一次录音练习
- [ ] 看到了练习反馈报告 ❌ — 报告太长，被 skim 掉了
- [ ] 理解了报告里每个模块的含义 ❌ — 不知道 focus 在哪里
- [x] 愿意再做一次练习 — 但 suggested prompts 不稳定，不知道该说什么

## 详细发现

### 1. Start Practice 双重点击（最大阻塞）

用户期望的路径：点 Practice tab → 开始录音。实际路径：点 Practice tab → 看到页面 → 滑到底部 → 再点 Start Practice。

这是语音产品最大的转化杀手。用户对语音产品的直觉是即时性——"我点了就该开始说"。两跳认知负载让用户在开始之前就困惑了。

### 2. 报告信息过载

原话："End report felt too long; required lots of scrolling and the participant did not know where to focus, so they skimmed."

所有反馈维度（发音、词汇、流利度、语法）平铺在一页里，没有优先级。用户真实行为：录完音 → 想看"我说得怎么样" → 打开报告 → 被信息淹没 → 扫一眼走了。

### 3. 词汇反馈最有价值但被埋没

用户明确表示 "liked the amount of feedback on words and vocabulary"，说明词汇反馈模块有真实价值。但它在报告里和其他维度混在一起，没有优先级展示。

### 4. 建议提示词不稳定

原话："Suggested prompts appeared inconsistently (not reliably triggered)."

用户录完音之后不知道接下来说什么 → 不录第二次。prompt 依赖某种触发条件（可能时长/得分/主题识别），条件不满足就不出。

### 5. 录音时屏幕是"盲区"

原话："Many people avoid looking at the phone while speaking to keep the mic close to their mouth."

这是语音产品的物理约束——录音过程中用户不看屏幕。所以不能在录音过程中放关键 UI 变化（倒计时、提示词弹出等）。关键引导必须在录音开始前完成。

### 6. 害怕开口 + 缺少紧迫感

参与者在开口说话前有心理阻力；没有"不练就会怎样"的感知后果。这个问题可能是产品早期的最大瓶颈——不解决"为什么要练"，"怎么练得好"就没有意义。

## 分类标签

- 类别：产品测试反馈
- 严重程度：P0（Start Practice）、P1（报告过载、prompt 不稳定）、P2（屏幕盲区、害怕开口）
- 涉及模块：UI/UX、动机设计、报告系统、练习流
