import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import demoEnvelope from "./data/demo-runs.json";
import { AuthPage } from "./components/AuthPage";
import { SupabaseRunRepository } from "./data-access/SupabaseRunRepository";
import {
  isSupabaseConfigured,
  loadStoredRuns,
  readSession,
  restoreSession,
  signIn,
  signOut,
  type SupabaseSession,
} from "./lib/supabase";
import { parseRunEnvelope } from "./lib/importRunJson";
import { DashboardPage } from "./pages/DashboardPage";
import { RunDetailsPage } from "./pages/RunDetailsPage";

const demoRecords = parseRunEnvelope(JSON.stringify(demoEnvelope)).records;

export default function App() {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [repository, setRepository] = useState<SupabaseRunRepository | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState("");

  const connect = async (nextSession: SupabaseSession) => {
    const imported = await loadStoredRuns(nextSession);
    setSession(nextSession);
    setRepository(new SupabaseRunRepository(demoRecords, imported, nextSession));
    setStartupError("");
  };

  useEffect(() => {
    let active = true;
    void restoreSession()
      .then(async (restored) => {
        if (restored) {
          const imported = await loadStoredRuns(restored);
          if (active) {
            setSession(restored);
            setRepository(new SupabaseRunRepository(demoRecords, imported, restored));
          }
        }
      })
      .catch((error: unknown) => {
        if (active) setStartupError(error instanceof Error ? error.message : "无法读取云端记录。");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const nextSession = await signIn(email, password);
    await connect(nextSession);
  };

  if (loading) {
    return <main className="auth-shell"><div className="auth-card">正在连接 SECURITY LAB…</div></main>;
  }

  if (!session || !repository) {
    return (
      <>
        {startupError && <div className="startup-error" role="alert">{startupError}</div>}
        <AuthPage configured={isSupabaseConfigured()} onSignIn={handleSignIn} />
      </>
    );
  }

  const logout = () => {
    signOut();
    setSession(null);
    setRepository(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={<DashboardPage onSignOut={logout} refresh={() => setRepository(new SupabaseRunRepository(demoRecords, repository.list().filter((run) => run.loadedFrom === "json-import").map((run) => run.record), session))} repository={repository} />}
          path="/"
        />
        <Route element={<RunDetailsPage repository={repository} />} path="/runs/:runId" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </BrowserRouter>
  );
}
