import { useState, type FormEvent } from "react";

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  configured: boolean;
}

export function AuthPage({ onSignIn, configured }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSignIn(email.trim(), password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "登录失败，请检查账号配置。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-mark">SL</div>
        <span className="eyebrow">IOS SECURITY LAB</span>
        <h1>安全实验室控制台</h1>
        <p>使用 Supabase 账户登录，访问已保存的测试记录。</p>
        {!configured ? (
          <div className="auth-error">尚未配置 Supabase 环境变量。请先在 Vercel 项目设置中添加 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，然后重新部署。</div>
        ) : (
          <>
            <label>邮箱<input autoComplete="username" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
            <label>密码<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" disabled={busy} type="submit">{busy ? "正在登录…" : "登录控制台"}</button>
          </>
        )}
        <small>仅使用 Supabase 公共 anon key；请勿将 service_role 密钥放入前端。</small>
      </form>
    </main>
  );
}
