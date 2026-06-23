# Spec — Session 数据从 localStorage 迁移到 Supabase

> 2026-06-23 · P2a 🟢 · 依赖 P1 (Auth) · 新建 migration + 改 `session-history.ts`

## 问题

当前 `session-history.ts` 纯 localStorage：换设备丢数据、清缓存丢数据、无法关联到用户。Auth 做完后必须把 session/highlights 迁移到 Supabase PostgreSQL。

## 修改建议

在 Supabase 建 `sessions` 表 + RLS，把 `saveSession`/`getSessions` 改为调 Supabase。localStorage 保留为本地缓存（快速渲染 MyPage 历史列表），Supabase 为 source of truth。

## 技术方案

### 1. 建表（SQL Migration）

```sql
-- sessions 表
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode TEXT NOT NULL DEFAULT 'free',
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  transcript TEXT NOT NULL DEFAULT '',
  highlight_words TEXT[] DEFAULT '{}',
  ktv_flow INTEGER NOT NULL DEFAULT 0,
  ktv_words INTEGER NOT NULL DEFAULT 0,
  ktv_sentences INTEGER NOT NULL DEFAULT 0,
  ktv_story INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: 用户只能读写自己的 sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 索引：按用户+时间查最近的 sessions
CREATE INDEX sessions_user_created ON sessions(user_id, created_at DESC);
```

### 2. 修改 `src/lib/session-history.ts`

```ts
import { supabase } from "@/integrations/supabase/client";

// 保留 localStorage 缓存
const CACHE_KEY = "speakspark.history";

// 从 Supabase 读（source of truth）
export async function getSessions(): Promise<SessionRecord[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch sessions:", error);
    return getLocalSessions(); // fallback
  }

  // 同步到本地缓存
  if (data) syncLocal(data);
  return data.map(mapRow);
}

// 保存到 Supabase
export async function saveSession(record: Omit<SessionRecord, "id" | "createdAt">): Promise<SessionRecord[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return getLocalSessions();

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      mode: record.mode,
      duration_seconds: record.durationSeconds,
      word_count: record.wordCount,
      transcript: record.transcript.slice(0, 4000),
      highlight_words: record.highlightWords,
      ktv_flow: record.ktvScore.flow,
      ktv_words: record.ktvScore.words,
      ktv_sentences: record.ktvScore.sentences,
      ktv_story: record.ktvScore.story,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to save session:", error);
    return getLocalSessions();
  }

  return getSessions(); // 刷新列表
}

// 本地缓存作为快速读取层
function getLocalSessions(): SessionRecord[] { /* 现有逻辑 */ }
function syncLocal(rows: any[]) { /* 写 localStorage */ }
```

### 3. 渐近迁移策略

```
Phase A（Auth 做完后）: getSessions 先读 Supabase → 失败再读 localStorage
Phase B（稳定后）: 完全去掉 localStorage 读写，改用 React Query 缓存
```

### 4. 更新 Supabase types

修改 `src/integrations/supabase/types.ts`，在 `Database["public"]["Tables"]` 中加入：

```ts
sessions: {
  Row: {
    id: string;
    user_id: string;
    mode: string;
    duration_seconds: number;
    word_count: number;
    transcript: string;
    highlight_words: string[];
    ktv_flow: number;
    ktv_words: number;
    ktv_sentences: number;
    ktv_story: number;
    created_at: string;
  };
  Insert: { /* ... */ };
  Update: { /* ... */ };
};
```

## 影响范围

- `session-history.ts` — 核心改动
- `MyPage.tsx` — `getSessions()` 现在是 async
- `TakeawayPage.tsx` — `saveSession()` 现在是 async
- `Home.tsx` — `getSessions()[0]` → `await getSessions()` 或首次渲染用缓存

## 验证测试

- [ ] tsc + build 通过
- [ ] 完成一次练习 → Supabase Table Editor 中看到新行
- [ ] MyPage → 显示当前用户的 sessions
- [ ] 换设备（或清 localStorage）→ 用同一账号登录 → 历史还在
- [ ] 另一用户登录 → 看不到上一个用户的 sessions（RLS 生效）
- [ ] Supabase 不可用时 → fallback 到 localStorage 不崩溃
