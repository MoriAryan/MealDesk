import { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import { listPosConfigs } from "../api/posConfig";
import type { PosConfig } from "../api/types";
import { Link } from "react-router-dom";

// Component for a single POS Card
function PosConfigCard({ config }: { config: PosConfig }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute session stats based on provided pos_sessions relation
  let lastOpenStr = "Never";
  let lastSellAmt = 0;

  if (config.pos_sessions && config.pos_sessions.length > 0) {
    // Grab the most recently opened session
    const recentSession = [...config.pos_sessions]
      .sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime())[0];
    
    lastOpenStr = new Date(recentSession.opened_at).toLocaleDateString();
    lastSellAmt = recentSession.closing_sale_total || 0;
  }

  return (
    <div className="bg-[var(--c-panel)] border border-[var(--c-border)] rounded-xl p-5 shadow-sm relative flex flex-col min-h-[160px]">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-xl font-head font-bold text-[var(--c-ink)]">{config.name}</h2>
        
        {/* Kebab Menu */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-md text-[var(--c-muted)] hover:bg-[var(--c-panel-2)] hover:text-[var(--c-ink)] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-[var(--c-panel)] border border-[var(--c-border)] shadow-md rounded-lg py-1 z-10 flex flex-col">
              <Link 
                to="/pos-config" 
                className="px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-panel-2)] hover:text-[var(--c-accent)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Setting
              </Link>
              <Link 
                to="/kitchen-display" 
                className="px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-panel-2)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Kitchen Display
              </Link>
              <Link 
                to="/customer-display" 
                className="px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-panel-2)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Customer Display
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 text-sm text-[var(--c-muted)] mb-6">
        <div><span className="font-medium">Last open:</span> {lastOpenStr}</div>
        <div><span className="font-medium">Last Sell:</span> ${Number(lastSellAmt).toFixed(2)}</div>
      </div>

      <div>
        <Link 
          to="/pos" 
          className="inline-block bg-[var(--c-panel-2)] text-[var(--c-ink)] border border-[var(--c-border)] hover:bg-[var(--c-border)] transition-colors px-4 py-1.5 rounded-md font-medium text-sm"
        >
          Open Session
        </Link>
      </div>
    </div>
  );
}

export function DashboardPage() {
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
    return <div className="text-[var(--c-muted)] animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-head text-[var(--c-ink)]">Dashboard</h1>
      </div>

      {configs.length === 0 ? (
        <div className="p-8 border border-dashed border-[var(--c-border)] rounded-xl text-center">
          <p className="text-[var(--c-muted)] mb-4">No POS Terminals configured yet.</p>
          <Link to="/pos-config" className="text-[var(--c-accent)] hover:underline font-medium">Create your first POS Terminal</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configs.map((cfg) => (
            <PosConfigCard key={cfg.id} config={cfg} />
          ))}
        </div>
      )}
    </div>
  );
}
