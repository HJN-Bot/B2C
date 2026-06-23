# Spec — Supabase Auth（邮箱登录 + AuthProvider）

> 2026-06-23 · P1 🟡 · 阻塞用户区分/留存测量 · 新建 `AuthProvider` + `SignIn` 页 + 改所有 mock "Alex" 引用

## 问题

当前全 app 硬编码 `MOCK_USER: "Alex"` + localStorage。无法区分真实用户、看不到谁回来练了第二次、无法绑定家长付费。Auth 是数据落库和留存测量的前提。

## 修改建议

使用 Supabase Auth 内置方案：
- **邮箱 + Magic Link 登录**（最低摩擦：输入邮箱 → 点邮件链接 → 自动登录）
- 可选加 Google OAuth（家长更方便，但需要配置 OAuth consent screen）
- 先只做 Magic Link，Google OAuth 等有需求再说

## 技术方案

### 新建文件

**1. `src/integrations/supabase/AuthProvider.tsx`**

```tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>(...);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string) => {
    await supabase.auth.signInWithOtp({ email });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return <AuthContext.Provider value={{ user, session: null, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}
```

**2. `src/pages/SignIn.tsx`** — 登录页

```
┌─────────────────────────┐
│  🎙️ SpeakSpark          │
│  Your private practice   │
│  coach for English       │
│  science presentations   │
│                         │
│  ┌─────────────────────┐│
│  │ your@email.com      ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │   Send Magic Link   ││
│  └─────────────────────┘│
│                         │
│  We'll email you a link │
│  — no password needed.  │
└─────────────────────────┘
```

状态机：输入邮箱 → 发送 → 显示 "Check your email ✉️" → 跳转回首页

### 修改文件

**3. `App.tsx`** — 包裹 AuthProvider + 路由守卫

```tsx
<AuthProvider>
  <Routes>
    <Route path="/signin" element={<SignIn />} />
    <Route path="/*" element={<ProtectedRoutes />} />
  </Routes>
</AuthProvider>

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/signin" />;
  return <Routes>...现有路由...</Routes>;
}
```

**4. 所有引用 `MOCK_USER` 的地方** → 改为 `useAuth().user`

涉及文件：
- `Home.tsx` — 问候 `Hey Alex` → `Hey {user.email}`
- `MyPage.tsx` — mock + history 绑定 user_id
- `TakeawayPage.tsx` — session 保存时带上 user_id

### Supabase 配置

在 Supabase Dashboard → Authentication → Providers → Email:
- 开启 Email provider
- 取消 "Confirm email"（Magic Link 本身就是确认）

### 用户 onboarding 流程

```
首次访问 → /signin → 输入邮箱 → Magic Link → 点击链接 → 自动登录 → /
```

已登录用户访问 / → 直接到首页。

## 验证测试

- [ ] tsc + build 通过
- [ ] 未登录访问 / → 重定向到 /signin
- [ ] 输入邮箱 → 收到 Magic Link → 点击 → 自动登录 → 跳回首页
- [ ] 首页显示用户邮箱
- [ ] 刷新页面 → 保持登录
- [ ] 退出登录 → 回到 /signin
- [ ] 已登录访问 /signin → 自动跳回 /
