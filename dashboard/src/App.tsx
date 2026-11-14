import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import demoEnvelope from "./data/demo-runs.json";
import { LocalStorageRunRepository } from "./data-access/MemoryRunRepository";
import { parseRunEnvelope } from "./lib/importRunJson";
import { DashboardPage } from "./pages/DashboardPage";
import { RunDetailsPage } from "./pages/RunDetailsPage";

function getBrowserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function App() {
  const [repository] = useState(
    () =>
      new LocalStorageRunRepository(
        parseRunEnvelope(JSON.stringify(demoEnvelope)).records,
        getBrowserStorage(),
      ),
  );
  const [, setRevision] = useState(0);
  const refresh = () => setRevision((value) => value + 1);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={<DashboardPage refresh={refresh} repository={repository} />}
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
