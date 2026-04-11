import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { listPosConfigs } from "../api/posConfig";
import type { PosConfig } from "../api/types";
import { Link } from "react-router-dom";
import { Power, Settings, Monitor, MonitorPlay, Plus, ChefHat } from "lucide-react";
import { MealDeskLoader } from "../components/MealDeskBrand";

function PosConfigCard({ config }: { config: PosConfig }) {
  // Use real stats from backend if available, fallback to session data
  const lastOpenStr = config._stats?.lastOpenedAt
    ? new Date(config._stats.lastOpenedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  const totalRevenue = config._stats?.totalRevenue ?? 0;

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-[2rem] border border-border/80 bg-panel p-5 shadow-sm hover:shadow-[var(--shadow-artisanal)] hover:border-accent/40 transition-all duration-300">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Monitor size={22} strokeWidth={2.5} />
           </div>
           <div>
             <h2 className="text-xl font-black tracking-tight text-ink">{config.name}</h2>
             <p className="text-xs font-semibold uppercase tracking-widest text-muted mt-0.5">Terminal</p>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 text-sm text-muted mb-6">
        <div className="flex justify-between items-center rounded-xl bg-bg/50 px-3 py-2 border border-border/50">
           <span className="font-semibold text-ink">Last Session</span>
           <span className={`font-bold ${lastOpenStr ? "text-accent" : "text-muted/50"}`}>{lastOpenStr ?? "\u2014"}</span>
        </div>
        <div className="flex justify-between items-center rounded-xl bg-bg/50 px-3 py-2 border border-border/50">
           <span className="font-semibold text-ink">Previous Sales</span>
           <span className="font-bold text-ink">${totalRevenue.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          to={`/pos?config_id=${config.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl text-white py-3 font-black text-sm shadow-md transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, var(--color-accent), #f97316)" }}
        >
          <Power size={16} /> Open Register
        </Link>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <Link
            to={`/kitchen-display?config_id=${config.id}`}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-bg py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:border-accent/40 hover:text-ink transition-colors"
          >
            <ChefHat size={16} /> Kitchen
          </Link>
          <Link
            to={`/customer-display?config_id=${config.id}`}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-bg py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:border-accent/40 hover:text-ink transition-colors"
          >
            <MonitorPlay size={16} /> Guest
          </Link>
          <Link
            to={`/pos-config?config_id=${config.id}`}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-bg py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:border-accent/40 hover:text-ink transition-colors"
          >
            <Settings size={16} /> Setup
          </Link>
        </div>
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
    let active = true;
    
    async function load() {
      if (!accessToken) return;
      try {
        const res = await listPosConfigs(accessToken);
        if (!active) return;
        
        // Force "Main Counter" to always be first, then fallback to original order
        const sortedConfigs = [...res.posConfigs].sort((a, b) => {
          const aIsMain = a.name.toLowerCase().includes("main");
          const bIsMain = b.name.toLowerCase().includes("main");
          if (aIsMain && !bIsMain) return -1;
          if (!aIsMain && bIsMain) return 1;
          return 0; // maintain original created_at ASC order generally
        });
        
        setConfigs(sortedConfigs);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    }
    
    load();
    // Poll every 5 seconds so revenue and time update in real-time after checkout
    const interval = setInterval(load, 5000);
    
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <MealDeskLoader label="Syncing Terminalsâ€¦" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 md:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink md:text-4xl">Registers</h1>
          <p className="text-muted text-base mt-2">Select a terminal to open its cash register or dedicated displays.</p>
        </div>
        {isAdmin && (
          <Link 
            to="/pos-config" 
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-sm font-bold text-panel shadow-lg hover:bg-ink/85 transition-all"
          >
            <Plus size={16} /> New POS
          </Link>
        )}
      </div>

      {configs.length === 0 ? (
        <div className="py-24 px-6 border border-dashed border-border/80 bg-panel/30 rounded-[2rem] text-center flex flex-col items-center justify-center max-w-2xl mx-auto shadow-inner">
          <div className="h-20 w-20 mb-6 rounded-[2rem] bg-bg border border-border flex items-center justify-center shadow-sm">
             <Settings className="text-muted" size={32} />
          </div>
          <h2 className="text-2xl font-black text-ink tracking-tight mb-3">No terminals mapped</h2>
          <p className="text-muted mb-8 text-base leading-relaxed">Before you can start taking orders, you need to configure a local representation of your POS device.</p>
          <Link 
            to="/pos-config" 
            className="rounded-2xl px-8 py-3.5 font-black text-sm text-white shadow-lg transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--color-accent), #f97316)" }}
          >
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
