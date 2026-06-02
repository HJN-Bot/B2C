# Spec — 保存本次到 Library（客户端持久化）

> 2026-06-02 · 对应 TODO：P3·保存 / P4 · 文件：`src/lib/session-history.ts`, `TakeawayPage.tsx`, `MyPage.tsx` · 状态：✅ 已实现 🧪 待验证

## 修改建议
练习内容没被保存/转录成第四页 Library 的一项。要把本次 transcript + 评分存下来，在 MyPage 历史里看到。

## 解决思路
先做**客户端 localStorage 持久化**（后台 Supabase 落库以后替换）：Takeaway 打开时保存本次 run；MyPage 读取真实历史替换 mock。

## 技术方案
1. 新增 `src/lib/session-history.ts`：`SessionRecord`（id/createdAt/mode/duration/wordCount/highlightWords/ktvScore/transcript）、`getSessions()`、`saveSession()`（按 transcript+duration 去重，最多 50 条）。
2. `TakeawayPage`：mount 时（有 session 数据）`saveSession(...)` 一次（`savedRef` 守卫）。
3. `MyPage`：`getSessions()` 替换 mock `history`，渲染标题(transcript 前 6 词)/相对日期/mode/时长/词数；空态提示。

## 验证测试
tsc + build；手动：`#/practice` 练一次 → `#/session-end`（自动保存）→ `#/my` 看到这条记录；再练一次出现第二条；刷新后仍在。
