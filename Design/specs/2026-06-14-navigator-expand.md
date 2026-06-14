# Spec — Navigator 扩展（Practice 开练后第二段 + Home 首页引导）

> 2026-06-14 · 对应 TODO：P1 首页 Navigator + P2 Practice Navigator 覆盖 Script/反馈卡 · 文件：`src/components/CoachmarkTour.tsx`(原 PracticeOnboarding)、`src/pages/PracticeRoom.tsx`、`src/pages/Home.tsx` · 状态：✅ 已实现 🧪 待浏览器验证

## 修改建议
现在引导只有两处缺口：
1. **Practice 引导只讲了开练前能看到的元素**（KTV / 猫 / Start）。字幕(Script)和停顿反馈卡是"开练后才出现"的，新用户第一次说完不知道这两块是什么。
2. **Home 首页完全没有引导**，新用户进来不知道 mode 选择 / 今日话题 / Start 各是什么。

## 解决思路
- 复用现有 spotlight 组件（挖洞高亮 + 气泡 + Skip/Next，已在练习页用）。当前它叫 `PracticeOnboarding` 且写死单一 localStorage key，不能给 Home / 第二段复用 → **泛化为 `CoachmarkTour`**，接受 `storageKey` prop，导出 `hasSeenTour(key)`。各页用各自的 key，互不影响、各只出一次。
- **Practice 第二段**：监听 `started` 翻为 true，延迟 ~600ms（等布局/首句落定）后，若该 key 未看过就弹 2 步：① 字幕(transcriptScrollRef) ② 反馈卡槽位(coachSlotRef)。这两块只有开练后才挂载，所以必须等 started。
- **Home**：进页若未看过就弹 3 步：① Practice mode ② Today's Starter ③ Start Speaking。

## 技术方案
1. `src/components/PracticeOnboarding.tsx` → 重命名为 `CoachmarkTour.tsx`：
   - `export default function CoachmarkTour({ steps, storageKey, onDone })`；`finish()` 写 `storageKey`。
   - `export function hasSeenTour(key): boolean`（storage 被禁时返回 true，不打扰）。
   - 保留 `CoachStep` 接口（ref/title/body）。气泡顶部文案保持 "Quick tour i/n"（通用）。
2. `PracticeRoom.tsx`：
   - import 改 `CoachmarkTour, { hasSeenTour }`。
   - keys：`PRESTART_TOUR = "speakspark.practiceOnboarded"`（沿用，老用户不重弹）、`STARTED_TOUR = "speakspark.practiceStartedTour"`。
   - 新增 `coachSlotRef` 挂到 `.practice-coach-slot`（line ~1453）；字幕复用已有 `transcriptScrollRef`。
   - 新增 `showStartedTour` state + `useEffect([started])`：started && !hasSeenTour(STARTED_TOUR) → setTimeout 600ms → 显示第二段。
   - 渲染两个 `CoachmarkTour`（pre-start 三步沿用；started 两步：字幕/反馈卡）。
3. `Home.tsx`：
   - import `CoachmarkTour, { hasSeenTour }`；key `"speakspark.homeOnboarded"`。
   - 加 `modeRef`/`topicRef`/`startRef`；`showTour` 初始 `!hasSeenTour(key)`；渲染 3 步 tour。

## 验证测试
tsc + build；手动：
- Home：清 localStorage `speakspark.homeOnboarded` → 进首页弹 3 步（mode→话题→Start），Skip/Next，看完不再弹。
- Practice：清 `speakspark.practiceStartedTour` → `#/practice`→Start→约 0.6s 后弹 2 步（字幕→反馈卡槽位），高亮锚定正确；看完不再弹。pre-start 三步沿用不变。
