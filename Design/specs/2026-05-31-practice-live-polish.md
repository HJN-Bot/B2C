# Spec — 练习页活态打磨（A2）

> 2026-05-31 · 对应 TODO：[A2](../dev-memory/TODO.md) · 文件：`src/pages/PracticeRoom.tsx` + `src/index.css` · 状态：✅ 已实现，🧪 待验证（点3：reply 卡 pin 住手动关，已确认）

## 修改建议
试用截图发现 4 个练习中状态的小问题：
1. 顶部 `Brain + aiState` 状态条 和 猫猫旁边的 "AI [mood]" 重复 → 删掉顶部那条。
2. "Now saying" 字幕被压在底部一条窄带里，框框大半空着 → 让字幕填满框。
3. AI 教练反馈太短暂，用户一继续说就自动消失 → 给用户控制权，别自动消失。
4. 猫猫动得太快、抢注意力；文字/猫猫位置要相对固定 → 放慢动画、稳住布局。

## 解决思路
- 1：直接删顶部状态条（`Brain` pill），保留猫猫旁 mood 标签作为唯一状态。
- 2：字幕区从"末句单行 + `max-h-3.6rem` 贴底"改为**填满 flex 区的近段 transcript**（底对齐 + 顶部渐隐），当前句仍最显眼。完整"单行+可滚+毛玻璃"留给 B。
- 3：reply 卡在用户**继续说话时不再自动消失**，pin 住直到用户点 Use it / Skip；只有 thinking 阶段（还没出真实回复）才在恢复说话时取消。
- 4：放慢猫猫活跃动画周期（thinking 1.3→2.4s、coaching 2.0→3.0s、excited 1.0→1.8s；listening 维持 4.8s 平静）。

## 技术方案
1. 删 `src/pages/PracticeRoom.tsx` 顶部 `Brain + {aiState}` 那个 `<div>`（约 1291–1296）。
2. 字幕：`max-h-[3.6rem] items-end` → `flex-1`，渲染 transcript 近段（末 ~45 词）填满，保留 `.karaoke-mask` 顶部渐隐 + interim 蓝字。
3. VAD 恢复说话处（rms>阈值）：仅当 `bottleneckPhase==="thinking"` 才隐藏卡片；`reply` 阶段保持显示，不 collapse 成 tag。
4. `src/index.css`：调 `cat-motion-coach-thinking/coaching/excited` 的 `animation-duration`。

## 验证测试
tsc + build 通过；手动（`#/practice`）：顶部状态条消失；字幕填满框不再压底；停顿出反馈后继续说话，反馈仍在、只能手动 Use it/Skip 关；猫猫动作明显变慢、不抢眼。
