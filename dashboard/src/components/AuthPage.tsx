import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface AuthPageProps {
  client: SupabaseClient;
}

export function AuthPage({ client }: AuthPageProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setIsError(false);

    try {
      if (mode === "signup") {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        if (!data.session) {
          setMessage("账户已创建。请检查邮箱并完成确认，然后回到这里登录。");
        } else {
          setMessage("账户创建成功，正在进入 Dashboard…");
        }
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "身份验证失败，请重试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">IOS SECURITY LAB</span>
        <h1>SECURITY LAB</h1>
        <p className="auth-intro">登录后访问你的云端测试记录。每个账户只能读取和管理自己的记录。</p>
        <div className="auth-tabs" role="tablist" aria-label="账户操作">
          <button
            aria-selected={mode === "login"}
            className={mode === "login" ? "active" : ""}
            onClick={() => { setMode("login"); setMessage(""); }}
            role="tab"
            type="button"
          >
            登录
          </button>
          <button
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "active" : ""}
            onClick={() => { setMode("signup"); setMessage(""); }}
            role="tab"
            type="button"
          >
            创建账户
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">邮箱</label>
          <input
            autoComplete="email"
            id="auth-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            required
            type="email"
            value={email}
          />
          <label htmlFor="auth-password">密码</label>
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            id="auth-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 个字符"
            required
            type="password"
            value={password}
          />
          <button className="button button-primary auth-submit" disabled={busy} type="submit">
            {busy ? "正在处理…" : mode === "login" ? "登录 Dashboard" : "创建账户"}
          </button>
        </form>
        {message && (
          <p aria-live="polite" className={isError ? "auth-message error" : "auth-message"}>
            {message}
          </p>
        )}
        <p className="auth-security-note">
          账户验证由 Supabase Auth 处理；数据访问由数据库 RLS 策略按账户隔离。
        </p>
      </section>
    </main>
  );
}
