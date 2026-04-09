import { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import { listPosConfigs } from "../api/posConfig";
import type { PosConfig } from "../api/types";
import { Link } from "react-router-dom";
import { MoreHorizontal, Power, Settings, Monitor, MonitorPlay, Activity, Plus, LayoutDashboard } from "lucide-react";

function PosConfigCard({ config }: { config: PosConfig }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Use real stats from backend if available, fallback to session data
  const lastOpenStr = config._stats?.lastOpenedAt
    ? new Date(config._stats.lastOpenedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
    : "Never opened";

  const totalRevenue = config._stats?.totalRevenue ?? 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border border-border/80 bg-panel p-6 shadow-sm shadow-border hover:shadow-[var(--shadow-artisanal)] hover:border-accent/30 transition-all duration-300 min-h-[200px]">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
           <div className="flex items-center justify-center h-10 w-10 rounded-full bg-accent/10 border border-accent/20">
              <Monitor size={20} className="text-accent" />
           </div>
           <h2 className="text-xl font-bold tracking-tight text-ink">{config.name}</h2>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-ink transition-colors"
            aria-label="Options"
          >
            <MoreHorizontal size={18} />
          </button>

          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-border bg-panel/95 backdrop-blur-xl shadow-[var(--shadow-artisanal)] py-2 z-20">
              <Link
                to="/pos-config"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-bg hover:text-ink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={14} /> Session Setup
              </Link>
              <Link
                to="/kitchen-display"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-bg hover:text-ink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <MonitorPlay size={14} /> Kitchen Board
              </Link>
              <Link
                to="/customer-display"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-bg hover:text-ink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <MonitorPlay size={14} /> Guest Screen
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-end gap-3 text-sm text-muted mb-8">
        <div className="flex justify-between items-center px-4 py-2 rounded-lg bg-bg/50 border border-border/50">
           <span className="font-medium text-ink">Last Opened</span>
           <span className="font-semibold text-accent">{lastOpenStr}</span>
        </div>
        <div className="flex justify-between items-center px-4 py-2 rounded-lg bg-bg/50 border border-border/50">
           <span className="font-medium text-ink">Previous Sales</span>
           <span className="font-bold text-ink">${totalRevenue.toFixed(2)}</span>
        </div>
      </div>

      <div>
        <Link
          to="/pos"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink text-panel hover:bg-ink/90 transition-all px-4 py-3 font-semibold text-sm shadow-md"
        >
          <Power size={16} /> Open Session
        </Link>
      </div>
    </div>
  );
}

export function HomePage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [configs, setConfigs] = useState<PosConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!accessToken) return;
      try {
        const res = await listPosConfigs(accessToken);
        setConfigs(res.posConfigs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Activity className="animate-spin text-accent" size={32} />
           <p className="text-muted font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Terminal Overview</h1>
        <p className="text-muted text-lg">Manage your registers and access active sessions.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-panel p-6 shadow-[var(--shadow-artisanal)]">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative flex items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">Session Dock</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-ink">One place for the live shift tools.</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
                Keep the busy session flows out of the global navigation. Open the terminal, kitchen board, guest display, or setup from here.
              </p>
            </div>
            <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <LayoutDashboard size={22} />
            </div>
          </div>

          <div className="relative mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: "Open Terminal", to: "/pos", icon: Power, tone: "bg-ink text-panel" },
              { title: "Kitchen Board", to: "/kitchen-display", icon: MonitorPlay, tone: "bg-bg text-ink" },
              { title: "Guest Screen", to: "/customer-display", icon: Monitor, tone: "bg-bg text-ink" },
              { title: "Setup", to: "/pos-config", icon: Settings, tone: "bg-bg text-ink" },
            ].map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className={`group flex items-center justify-between rounded-2xl border border-border px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-accent/40 ${item.tone}`}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] opacity-60">Quick Open</p>
                  <h3 className="mt-1 font-bold">{item.title}</h3>
                </div>
                <item.icon size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-panel p-6 shadow-[var(--shadow-artisanal)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">Admin Tools</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-ink">Terminals</h3>
            </div>
            {isAdmin && (
              <Link
                to="/pos-config"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold text-ink transition-colors hover:border-accent/40 hover:text-accent"
              >
                <Plus size={14} /> New POS
              </Link>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {configs.slice(0, 3).map((cfg) => (
              <div key={cfg.id} className="flex items-center justify-between rounded-2xl border border-border bg-bg/45 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-ink">{cfg.name}</p>
                  <p className="text-xs text-muted">{cfg._stats?.sessionCount ?? 0} sessions · {cfg._stats?.orderCount ?? 0} orders</p>
                </div>
                <Link to="/pos-config" className="text-xs font-bold uppercase tracking-widest text-accent hover:underline">
                  Manage
                </Link>
              </div>
            ))}
            {!configs.length && (
              <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                No terminals yet. Create one from POS Setup.
              </p>
            )}
          </div>
        </div>
      </section>

      {configs.length === 0 ? (
        <div className="py-20 px-6 border border-dashed border-border/80 bg-panel/30 rounded-[2rem] text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-inner">
          <div className="h-16 w-16 mb-4 rounded-full bg-bg border border-border flex items-center justify-center">
             <Settings className="text-muted" size={24} />
          </div>
          <p className="text-ink font-semibold text-lg mb-2">No terminals available</p>
          <p className="text-muted mb-6">Before you can start taking orders, you need to configure a local representation of your POS device.</p>
          <Link to="/pos-config" className="rounded-xl px-6 py-2.5 bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/20">
            Configure Terminal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
          {configs.map((cfg) => (
            <PosConfigCard key={cfg.id} config={cfg} />
          ))}
        </div>
      )}
    </div>
  );
}
