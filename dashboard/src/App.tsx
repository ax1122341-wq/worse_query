import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import demoEnvelope from "./data/demo-runs.json";
import { MemoryRunRepository } from "./data-access/MemoryRunRepository";
import { parseRunEnvelope } from "./lib/importRunJson";
import { DashboardPage } from "./pages/DashboardPage";
import { RunDetailsPage } from "./pages/RunDetailsPage";

export default function App() {
  const [repository] = useState(
    () =>
      new MemoryRunRepository(
        parseRunEnvelope(JSON.stringify(demoEnvelope)).records,
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
