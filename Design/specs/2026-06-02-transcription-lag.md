# Spec — 转录卡顿（说快了停顿再一次性吐字）

> 2026-06-02 · 对应 TODO：P2·转录质量 · 文件：`src/pages/PracticeRoom.tsx` · 状态：✅ 已实现 🧪 待验证

## 修改建议
说快一点时，字幕会停 20–30s 再一次性把字吐出来。要让连续/快速讲话也能实时、平滑地出字。

## 解决思路
根因（代码层）：`recognition.onresult` 在**每一次 interim 结果**都做重活——
- `detectSentencePattern(captionSnapshot)` 每次都跑（4500ms 守卫在它**之后**才判断，挡不住计算本身）；
- `captionSnapshot` 是「全量 final + interim」拼接，越说越长，正则扫描是 O(n)；
- interim 高频触发 → 主线程被不断变长的字符串扫描占满 → 字幕 state 更新/绘制被饿死 → 看起来卡住，缓过来再一次性刷新。

字幕本身（`setTranscript`/`setInterimTranscript`）很轻，应留在快路径；把分析（句型识别、高光、KTV 涨分）**节流 + 只扫最近尾段**。

## 技术方案
1. 新增 `lastCaptionAnalysisAtRef`。`onresult` 里先无条件更新字幕（final + interim），再**节流**分析：距上次 < 700ms 且非 final 就跳过。
2. 分析只针对**最近尾段**（如末 200 字符），不扫全量：`detectSentencePattern(tail)` / `promotePassiveHighlights(tail)`。
3. `detectSentencePattern` 移到节流之后再调用（别每次 interim 都算）。
4. （记录，不在本次）`ScriptProcessorNode` 已废弃且跑在主线程，与 SpeechRecognition 抢资源；后续可迁 AudioWorklet —— 列入后台重构。

## 验证测试
tsc + build 通过；手动（`#/practice`，Chrome/Edge）：**快速连续讲一长段**，字幕应持续滚动出字、不再停 20–30s 后一次性吐；KTV/高光仍会涨（频率略降但不影响）。
