# Spec — 字幕融合一个面板（B / R2）

> 2026-06-02 · 对应 TODO：P2·B · 文件：`src/pages/PracticeRoom.tsx` · 状态：✅ 已实现 🧪 待验证

## 修改建议
字幕逻辑怪、铺不满，中间大白区 90% 空着。要：单面板里 = 历史可上滚 + 当前句高亮；非说话态用毛玻璃盖住；填满中间区。

## 解决思路
把"Now saying"面板从"末段贴底单行"改为**填满 flex 的可滚动全量历史**：历史灰、当前句（`lastLine`）深色高亮、interim 蓝色；底部 `transcriptEndRef` 自动滚到底。再叠一层**毛玻璃 overlay**，由 `speakingActive` 控制——不说话时盖住（页面只在说话时"显现"），解决空白大白区。

## 技术方案
1. 新增 `speakingActive` state + `speakingActiveRef`：VAD `rms>阈值` 置 true；静音 >1200ms 置 false（变化时才 setState）。session 起始重置。
2. 面板：`relative flex-1 overflow-hidden`；内层 `flex-1 overflow-y-auto` 渲染 history(灰)+current(高亮)+interim(蓝)。
3. `!speakingActive` 时渲染绝对定位毛玻璃层（`backdropFilter blur(6px)` + `rgba(255,255,255,.72)`）+ 居中提示。

## 验证测试
tsc + build；手动 `#/practice`：说话时字幕铺满框、当前句高亮、可上滚看历史；停下来→毛玻璃盖住+提示；不再有大片空白。
