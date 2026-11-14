import type { RunRecord } from "../types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email?: string };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function requireConfig(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("尚未配置 Supabase。请在 Vercel 环境变量中设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。");
  }
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
}

const SESSION_KEY = "security-lab.supabase-session";

export function readSession(): SupabaseSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as SupabaseSession;
    if (!session.access_token || !session.refresh_token || !session.user?.id) return null;
    return session;
  } catch {
    return null;
  }
}

function saveSession(session: SupabaseSession | null): void {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

async function authRequest(path: string, body: Record<string, string>): Promise<SupabaseSession> {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "msg" in payload
      ? String((payload as { msg: unknown }).msg)
      : typeof payload === "object" && payload !== null && "message" in payload
        ? String((payload as { message: unknown }).message)
        : "Supabase 身份验证失败。";
    throw new Error(message);
  }
  const data = payload as { access_token: string; refresh_token: string; expires_in: number; user: { id: string; email?: string } };
  const session: SupabaseSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    user: data.user,
  };
  saveSession(session);
  return session;
}

export async function signIn(email: string, password: string): Promise<SupabaseSession> {
  return authRequest("token?grant_type=password", { email, password });
}

export async function restoreSession(): Promise<SupabaseSession | null> {
  const current = readSession();
  if (!current) return null;
  if (current.expires_at > Date.now() + 60_000) return current;
  try {
    return await authRequest("token?grant_type=refresh_token", { refresh_token: current.refresh_token });
  } catch {
    saveSession(null);
    return null;
  }
}

export function signOut(): void {
  const session = readSession();
  saveSession(null);
  if (!session || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  void fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${session.access_token}` },
  });
}

async function databaseRequest<T>(path: string, session: SupabaseSession, init: RequestInit = {}): Promise<T> {
  const { url, key } = requireConfig();
  const activeSession = await restoreSession() ?? session;
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${activeSession.access_token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { message?: string; details?: string };
    throw new Error(payload.message ?? payload.details ?? `数据库请求失败（${response.status}）。`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

interface StoredRun {
  run_id: string;
  record: RunRecord;
}

export async function loadStoredRuns(session: SupabaseSession): Promise<RunRecord[]> {
  const rows = await databaseRequest<StoredRun[]>(
    "lab_runs?select=run_id,record&order=created_at.desc",
    session,
  );
  return rows.map((row) => row.record);
}

export async function insertStoredRuns(session: SupabaseSession, records: RunRecord[]): Promise<void> {
  await databaseRequest<unknown>("lab_runs", session, {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(records.map((record) => ({ run_id: record.runId, record }))),
  });
}

export async function deleteStoredRuns(session: SupabaseSession): Promise<void> {
  await databaseRequest<unknown>("lab_runs?run_id=not.is.null", session, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}
