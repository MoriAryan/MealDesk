import { Outlet } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import { appEnv } from "../config/env";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--c-bg)] text-[var(--c-ink)]">
      <header className="border-b border-[var(--c-border)] bg-[var(--c-panel)]/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--c-muted)]">Odoo POS Cafe</p>
              <h1 className="text-xl font-semibold md:text-2xl">Phase 1 Foundation</h1>
            </div>
            <div className="rounded-lg border border-[var(--c-border)] bg-[var(--c-panel-2)] px-3 py-2 text-right text-xs text-[var(--c-muted)]">
              <p>API: {appEnv.apiBaseUrl}</p>
              <p>Socket: {appEnv.socketBaseUrl}</p>
            </div>
          </div>
          <TopNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
        <Outlet />
      </main>
    </div>
  );
}
