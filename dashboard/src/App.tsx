import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import demoEnvelope from "./data/demo-runs.json";
import { AuthPage } from "./components/AuthPage";
import { SupabaseRunRepository } from "./data-access/SupabaseRunRepository";
import { parseRunEnvelope } from "./lib/importRunJson";
import { supabase, supabaseConfigReady } from "./lib/supabaseClient";
import { DashboardPage } from "./pages/DashboardPage";
import { RunDetailsPage } from "./pages/RunDetailsPage";

const demoRecords = parseRunEnvelope(JSON.stringify(demoEnvelope)).records;

function StatusScreen({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="eyebrow">IOS SECURITY LAB</span>
        <h1>{title}</h1>
        <p className="auth-intro">{detail}</p>
      </section>
    </main>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [, setRevision] = useState(0);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setDataError(error.message);
      setSession(data.session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setDataError("");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const repository = useMemo(() => {
    if (!supabase || !session) return null;
    return new SupabaseRunRepository(supabase, session.user.id, demoRecords);
  }, [session?.user.id]);

  useEffect(() => {
    if (!repository) {
      setDataLoading(false);
      return;
    }

    let active = true;
    setDataLoading(true);
    void repository.load().then(() => {
      if (!active) return;
      setDataError("");
      setDataLoading(false);
      setRevision((value) => value + 1);
    }).catch((error: unknown) => {
      if (!active) return;
      setDataError(error instanceof Error ? error.message : "云端记录读取失败。");
      setDataLoading(false);
    });

    return () => { active = false; };
  }, [repository]);

  async function handleSignOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setDataError(error.message);
  }

  if (!supabaseConfigReady || !supabase) {
    return (
      <StatusScreen
        title="等待连接 Supabase"
        detail="部署配置尚未完成。请在 Vercel 为 dashboard 项目设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY，然后重新部署。"
      />
    );
  }

  if (authLoading) {
    return <StatusScreen title="正在验证登录状态" detail="正在安全连接 Supabase…" />;
  }

  if (!session) {
    return <AuthPage client={supabase} />;
  }

  if (!repository || dataLoading) {
    return <StatusScreen title="正在加载云端记录" detail="正在读取当前账户的测试记录…" />;
  }

  if (dataError) {
    return (
      <StatusScreen
        title="云端连接遇到问题"
        detail={dataError}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <DashboardPage
              onSignOut={() => void handleSignOut()}
              refresh={() => setRevision((value) => value + 1)}
              repository={repository}
              userEmail={session.user.email ?? ""}
            />
          }
          path="/"
        />
        <Route
          element={<RunDetailsPage repository={repository} />}
          path="/runs/:runId"
        />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}
