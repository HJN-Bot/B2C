# Spec — Trying Point 全 app 推广（首页 + My + 结束页闭环）

> 2026-06-16 · 文件：`src/lib/trying-point.ts`(新)、`Home.tsx`、`MyPage.tsx`、`TakeawayPage.tsx` · 状态：✅ 已实现 🧪 待验证
> 依据：PDF Page 6 ②「Trying Point 概念很好，推广到全 app —— one private upgrade at a time，降低焦虑」。

## 修改建议
Trying Point 原来只躺在 My 页且硬编码。推广成"同一个 trying point 在旅程里反复出现 + 闭环"。

## 解决思路 / 技术方案
1. **共享源** `src/lib/trying-point.ts`：导出 `TRYING_POINTS`（数组）+ `currentTryingPoint()`（按周稳定取一个）。
2. **My 页**：删本地硬编码，改读 `TRYING_POINTS`。
3. **首页 Home**：问候下方加一张可点卡「🎯 This week's trying point」+ `currentTryingPoint()`，点击进 `/practice`——把本周焦点连到练习。
4. **结束页 Takeaway**：Next Run Plan 的 "One move" 改标签为「🎯 Your next trying point」——练完即把下一步设定成 trying point，与首页/My 形成闭环。

## 验证测试
tsc + build；手动：首页有 trying point 卡且点击进练习；My 的列表与共享源一致；Takeaway 的 "下一步" 现叫 "Your next trying point"（需后台出真 AI plan 才有内容，否则走诚实卡）。
