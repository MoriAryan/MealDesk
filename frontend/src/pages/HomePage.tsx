import { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import { listPosConfigs } from "../api/posConfig";
import type { PosConfig } from "../api/types";
import { Link } from "react-router-dom";
import { MoreHorizontal, Power, Settings, Monitor, MonitorPlay, Activity } from "lucide-react";

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

  let lastOpenStr = "Never opened";
  let lastSellAmt = 0;

  if (config.pos_sessions && config.pos_sessions.length > 0) {
    const recentSession = [...config.pos_sessions]
      .sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime())[0];

    lastOpenStr = new Date(recentSession.opened_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    lastSellAmt = recentSession.closing_sale_total || 0;
  }

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
            <div className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-border bg-panel/95 backdrop-blur-xl shadow-[var(--shadow-artisanal)] py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
              <Link
                to="/pos-config"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-bg hover:text-ink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={14} /> Settings
              </Link>
              <Link
                to="/kitchen-display"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-bg hover:text-ink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <MonitorPlay size={14} /> Kitchen Display
              </Link>
              <Link
                to="/customer-display"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-bg hover:text-ink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <MonitorPlay size={14} /> Customer Display
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
           <span className="font-bold text-ink">${Number(lastSellAmt).toFixed(2)}</span>
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
  const { accessToken } = useAuth();
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
