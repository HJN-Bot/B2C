# Spec — Takeaway 重排：精简鼓励 → Level up → 详情 → Coach

> 2026-06-15 · 文件：`src/pages/TakeawayPage.tsx` · 状态：✅ 已实现 🧪 待验证（commit 见下）
> 决策依据：用户 + reviewer PDF Page 4 ③（"best product value first"）。从留存看：情绪钩子要早、但**价值钩子（下一步该试什么）不能被埋**。

## 修改建议
原 Takeaway 块① 太长（鼓励 + 讲了什么 + 完整做得好 + 4 条进步分值），把 Level up 压下去。重排为：顶部精简鼓励 → Level up 提前 → 详细证据下移 → Coach。

## 解决思路 / 技术方案
四块：
1. **① Your run（精简）**：Practice complete + headline + AI 鼓励 + coach-mode pill + （失败时）诚实提示 + **一个 quick win**（`what_worked[0]` 带引用）。其余详情下移。
2. **② Level up**：Amplify + Change + Next Run Plan（"Next time, say it like this"）——紧接精简鼓励，成为视觉 hero。AI 失败时仍走诚实卡（不塞模板）。
3. **③ Your run in detail**：What you talked about + More you did well（`what_worked.slice(1)`）+ Your progress this run（4 条 KTV 分值/What moved）。
4. **④ Coach**：Chatbox + Practice Again / Start。

## 验证测试
tsc + build；手动 `#/session-end`：顶部短鼓励 + 1 个 quick win → 紧接 Level up（放大/改掉/下次怎么说）→ 再往下才是讲了什么/更多做得好/进步条 → Coach。
