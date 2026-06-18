# Spec — 干掉死按钮（Home Last Highlight + My Settings）

> 2026-06-18 · 文件：`Home.tsx`、`MyPage.tsx` · 状态：实现中 · 纯前端
> 用户选了 3 项；My 历史条目"点开重看"本次不做（用户未选）。

## 修改建议
几处看起来可点却无反应的死按钮，要么接上、要么改成诚实的静态信息行。

## 解决思路 / 技术方案
1. **Home · Last Highlight**：整张卡 + "Library" → `navigate("/my")`（练习历史就在 My）。**去掉假播放键**（Volume2）——没有录音存储，不放假播放；右侧换成 ChevronRight 表示"可点开"。
2. **My · Saved phrase bank**：不再写死 "12 phrases"。从 `getSessions()` 聚合所有 `highlightWords` 去重 → 显示真实数量；点击**就地展开**列出短语 chips（空则提示）。
3. **My · Coach mode / Prompt settings**：固定项，改成**诚实静态信息行**（去掉假 chevron/button 外观）。顶部 ⚙️ 齿轮 → 点击**滚动到 Settings 区**（functional，不再死）。

## 不做（用户未选）
- My 练习历史条目点开重看 Takeaway（数据具备，留作下次）。
- 音频播放（无录音存储，需独立录音功能）。

## 验证测试
tsc + build；手动：首页点 Last Highlight/Library → 跳 My；My 短语库数量真实、点开列出；Coach mode/Prompt settings 不再像可点按钮；齿轮点击滚到 Settings。
