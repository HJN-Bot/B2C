# Spec — 高光加强 (C) + 猫猫去圆框 (D)

> 2026-06-02 · 对应 TODO：P2·C / P2·D · 文件：`src/pages/PracticeRoom.tsx` + `src/index.css` · 状态：✅ 已实现 🧪 待验证

## 修改建议
- C：高光/"好的部分"效果太弱，要更有冲击。
- D：猫猫被圆形框遮住，去框或居中。

## 解决思路
- C：放大奖励闪光——分数字号 2xl→5xl + 发光、加外扩光环(animate-ping)、加强背景径向渐变 alpha。
- D：上轮把 clip 收到 88px 圆形反而遮更多。改为 clip = 帧大小 112px、去掉 border-radius 与 overflow:hidden。sprite 是 alpha PNG，周围透明，不会出现方框，也不再被圆切。

## 技术方案
- C：`flashes.map` 渲染块——`text-2xl`→`text-5xl`、加 `textShadow` 辉光、新增 `animate-ping` 光环 `<span>`、渐变 alpha 0.22→0.4 / 0.2→0.34、label 加大加 `shadow-lg`。
- D：`src/index.css .cat-motion-clip` → 112×112、移除 `border-radius:50%` 和 `overflow:hidden`。

## 验证测试
tsc + build；手动 `#/practice`：触发高光（"Save this moment"/强词）时闪光明显更抢眼、有光环；猫猫完整可见、不被圆框裁切。
