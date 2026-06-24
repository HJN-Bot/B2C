# Spec — P0 一键开始（练习页进入即可见、显眼、可一点即录）

> 2026-06-24 · 反馈 [user-testing-1 #1](../user-feedback/submissions/2026-06-24-user-testing-1-analysis.md)（档位 A）· 文件：`src/pages/PracticeRoom.tsx`

## 修改建议
进 `/practice` 后，"🎙️ Start Practice" 按钮在 ≥520px 面板的**底部**（[PracticeRoom.tsx:1728](../../src/pages/PracticeRoom.tsx#L1728)），手机上要**滑到底**才点得到；上一页选的 Topic 只在 KTV 条下方一行小字（line 1512-1517），不显眼。用户期望"点 Practice tab 就能立刻看到并开始"。

## 解决思路
**不做进页自动录音**（保留一次点击——怕开口的用户需要一个准备的瞬间；且 ① 与 ⑥"害怕开口"自相矛盾，真问题是"没准备好"，不是"步数多"）。改为：**未开始时**用一个专门的、占满首屏、不需滚动的 pre-start 视图——大号 Start 在视口上半部、Topic 醒目高亮、加一句"准备感"文案。开录后过渡到现有 started 布局（保持"录音前完成引导"的原则，⑤虽降级仍遵守）。

## 技术方案
`PracticeRoom.tsx` 的 `!started` 分支（当前 line 1712-1739）重构为独立 pre-start 布局，**不复用** started 的 ≥520px 面板占位（line 1716-1726 的占位 coach-slot / transcript-reel 移除或下沉，避免把按钮顶出屏外）：
1. **Topic 高亮**：pre-start 顶部放一张醒目卡 —— `🎯 {topic || practiceMode.label}`，topic 来自 `location.state.topic`（已有，line 479）。从 Home "Use this topic" 进来时这里要明显呈现选中的题目。
2. **准备感**：Start 上方一句轻文案，如 `Take a breath — start when you're ready`（不强迫、降低开口压力）。
3. **大 Start，上半屏、不滚动**：`🎙️ Start Practice` 大按钮放在视口上半部居中；整屏内容控制在 `min-h-dvh` 首屏内。`apiStatus==="loading"` 时禁用并显示 `Loading AI...`（沿用现逻辑）。`Practice feedback only` 信任 chip 保留。
4. **KTV 条 / 猫 / 字幕预览**：作为下方淡淡预览，或开录后才显著——不抢 Start 的视觉位。
5. **过渡**：点击仍调用现有 `startSession()`（line 1302），started 后布局与当前一致（top bar + 面板 + KTV）。
6. 首次引导 `CoachmarkTour`（PRESTART_TOUR，line 1438）的 `startBtnRef`/`ktvBarRef`/`coachRef` 锚点随新布局更新位置即可，不删引导。

## 验证测试
tsc + build；手动：①进 `/practice` **不滚动**即见 Topic + 大 Start；②从 Home "Use this topic 🎙️" 进来，pre-start 顶部高亮显示该 topic；③点 Start 正常进入录音、started 布局与之前一致；④`apiStatus=loading` 时按钮禁用文案正确；⑤首次进入引导仍能锚到 Start/KTV/猫。
