# Spec — 移动端云端 STT（替换 Web Speech API）

> 2026-06-23 · P0 🔴 · 阻塞真实用户测试 · 新建 `src/lib/cloud-stt.ts` + 修改 `PracticeRoom.tsx`

## 问题

`SpeechRecognition` (Web Speech API) 在移动端 Safari / 微信浏览器 / iOS WKWebView 均不可用。目标用户（11-15 岁学生 + 家长）大概率用手机访问 → 直接无法开口练习。这是跑真实用户测试的最高阻塞项。

## 现有架构

```
PracticeRoom → MediaRecorder (Web Audio API) → 音频 chunk
                ↓
           Gemini 2.5 Flash (via gemini-proxy Edge Function) → transcript + feedback + highlight_words
```

当前 Gemini 接收 audio part 做转录+反馈，但前端字幕仍依赖 `SpeechRecognition` 的 `onresult` 输出。移动端该接口不存在。

## 修改建议

### 方案 A：Gemini 纯 STT 模式
在 gemini-proxy 增加纯 STT 模式：接收短音频 base64，返回 `{ transcript }`。
- ✅ 复用现有 infra，零新增依赖
- ❌ Gemini 转录精度不是最佳；每段音频一个 HTTP 请求

### 方案 B：Deepgram STT（推荐）
Nova-2 实时 STT，延迟 <300ms，免费 200h/月。
- ✅ 延迟最低、精度高、实时 WebSocket
- ✅ 免费额度足够验证阶段
- ⚠️ 需要 DEEPGRAM_API_KEY

### 方案 C：Google Cloud STT
- ❌ 需额外 Google Cloud 项目 + 计费 + 国内访问问题

**选定：B（Deepgram），理由见下。**

## 技术方案

### 文件变更

**1. 新建 `src/lib/cloud-stt.ts`**

```ts
export interface CloudSTTOptions {
  apiKey: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (err: Error) => void;
}

export function createCloudSTT(opts: CloudSTTOptions) {
  // Deepgram WebSocket: wss://api.deepgram.com/v1/listen
  // model: nova-2, language: en, interim_results: true, endpointing: 300
  // 返回 { send(audio: Blob): void, close(): void }
}
```

**2. 修改 `PracticeRoom.tsx`**

```ts
// 检测移动端 → 走 Deepgram；桌面端 → 保留 SpeechRecognition
const supportsSR = typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

if (!supportsSR) {
  // 移动端：Deepgram WebSocket
  const stt = createCloudSTT({
    apiKey: import.meta.env.VITE_DEEPGRAM_API_KEY,
    onTranscript: (text, isFinal) => { /* 同上 */ }
  });
  mediaRecorder.ondataavailable = (e) => stt.send(e.data);
}
```

桌面端不动现有逻辑。字幕渲染统一走 onTranscript 回调，不感知 STT 来源。

### Deepgram 配置

```
model: nova-2
language: en
interim_results: true    // 实时中间结果 = 替代 SpeechRecognition interim
endpointing: 300         // 300ms 静音 = 句子结束
smart_format: true       // 自动大小写+标点
```

### 环境变量

`VITE_DEEPGRAM_API_KEY` — .env 文件，不提交 git。Deepgram Console 设 domain 白名单 `*.vercel.app` + `localhost`。

### 成本

免费 200h/月（$200 credit）。15min session × 20次/月 = 5h → 免费额度跑完整个验证阶段绰绰有余。

## 验证测试

- [ ] tsc --noEmit + npm run build 通过
- [ ] iPhone Safari → 允许麦克风 → 说话 → 字幕实时更新
- [ ] 桌面端 Chrome → 仍走 SpeechRecognition（不退化）
- [ ] 移动端停顿 → 停顿检测仍工作 → follow-up 触发
- [ ] network throttle → Deepgram 断开 → reconnect 不 crash
