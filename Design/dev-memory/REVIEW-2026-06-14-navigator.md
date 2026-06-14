# 审阅清单 · 2026-06-14 Navigator 扩展（Practice 开练后 + Home 首页）

> tsc + build 通过，**未浏览器验证**。Spec：[2026-06-14-navigator-expand](../specs/2026-06-14-navigator-expand.md)。⚠️ = 需你拍板。
> 重置引导：DevTools→Application→Local Storage 删对应 key。

| 项 | 改动 | 🧪 验证点 | ⚠️ |
|---|------|-----------|----|
| 组件泛化 | `PracticeOnboarding.tsx` → **`CoachmarkTour.tsx`**：加 `storageKey` prop、导出 `hasSeenTour(key)`；删旧文件 | 练习页原三步引导照常（key 沿用 `speakspark.practiceOnboarded`，老用户不重弹） | 纯重命名+泛化，行为不变 |
| Practice 第二段 | Start 后约 0.6s 弹 **2 步**：① 字幕(transcriptScrollRef) ② 反馈卡槽位(coachSlotRef)。key=`speakspark.practiceStartedTour` 只出一次 | `#/practice`→Start→稍候高亮**字幕→反馈卡槽位** + 气泡解释 | ⚠️ 反馈卡此刻通常还没弹（停顿才出），引导锚定的是它**将出现的固定槽位**并预告；spotlight 用 getBoundingClientRect，元素位置变动需 resize 重测 |
| Home 首页 | 进首页弹 **3 步**：① Practice mode(modeRef) ② Today's Starter(topicRef) ③ Start Speaking(startRef)。key=`speakspark.homeOnboarded` 只出一次 | 清 key→进首页依次高亮 mode→话题→Start；Skip/Next；看完不再弹 | — |

**结构说明**
- 三处引导各用独立 localStorage key，互不影响、各只出一次。
- Practice pre-start 三步（KTV/猫/Start）与 started 两步（字幕/反馈卡）天然串行：pre-start 遮罩盖住 Start 按钮，关掉后才点得到 Start，再触发第二段。
- Home 引导与 Practice 引导独立：新用户首页看一次、进练习页再看一次。

**后台**：纯前端，无需部署。
