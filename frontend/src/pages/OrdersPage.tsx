import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { listOrders } from "../api/orders";
import type { Order } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export function OrdersPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      try {
        const res = await listOrders(accessToken);
        setOrders(res.orders);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load orders");
      }
    };

    void load();
  }, [accessToken]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const bulkArchive = async () => {
    setActionMenuOpen(false);
    setSelectedIds([]);
  };

  return (
    <section className="max-w-5xl">
       <div className="flex items-center justify-between mb-6 pb-2 border-b border-[var(--c-border)]">
        <div className="flex items-center gap-4 pt-2">
          {isAdmin && (
            <Link to="/pos" className="text-sm font-semibold px-4 py-1.5 rounded bg-[var(--c-panel-2)] text-[var(--c-ink)] hover:bg-[var(--c-border)] transition-colors opacity-50 cursor-not-allowed" title="Create order from POS">
              New
            </Link>
          )}
          <span className="text-xl font-bold font-head text-[var(--c-ink)]">Orders</span>
        </div>

        {isAdmin && selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
             <span className="text-sm font-medium bg-blue-900/30 text-blue-400 px-3 py-1 rounded-sm">
              x {selectedIds.length} Selected
            </span>
            <div className="relative" ref={actionMenuRef}>
              <button 
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                className="text-sm font-semibold bg-[var(--c-panel-2)] text-[var(--c-ink)] px-3 py-1 rounded border border-[var(--c-border)] hover:bg-[var(--c-border)] flex items-center gap-2"
              >
                <span>⚙</span> Action
              </button>
              {actionMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--c-panel)] border border-[var(--c-border)] rounded-md shadow-lg z-50">
                  <button onClick={bulkArchive} className="w-full text-left px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-panel-2)] transition-colors">
                    Archive
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="border-t border-[var(--c-border)] mt-4">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--c-border)] text-[var(--c-muted)]">
              <th className="px-2 py-3 font-semibold text-[var(--c-ink)]">Select</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Order No</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Total</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Status</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Source</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-[var(--c-border)] hover:bg-[var(--c-panel-2)] transition-colors">
                 <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={selectedIds.includes(o.id)}
                    onChange={() => toggleSelect(o.id)}
                    className="rounded border-[var(--c-border)] bg-transparent focus:ring-1 focus:ring-[var(--c-accent)] text-[var(--c-accent)]"
                  />
                </td>
                <td className="px-3 py-3 font-medium text-[var(--c-ink)]">{o.order_number}</td>
                <td className="px-3 py-3 text-[var(--c-muted)]">${Number(o.total).toFixed(2)}</td>
                <td className="px-3 py-3 capitalize">
                   <span 
                      className="px-2 py-1 rounded text-xs font-medium border"
                      style={{ 
                        backgroundColor: o.status === 'paid' ? '#00b89420' : o.status === 'draft' ? '#fdcb6e20' : '#b2bec320', 
                        borderColor: o.status === 'paid' ? '#00b894' : o.status === 'draft' ? '#fdcb6e' : '#b2bec3',
                        color: o.status === 'paid' ? '#00b894' : o.status === 'draft' ? '#fdcb6e' : '#b2bec3'
                      }}
                    >
                      {o.status}
                    </span>
                </td>
                <td className="px-3 py-3 text-[var(--c-muted)] uppercase text-xs tracking-wider">{o.source}</td>
                <td className="px-3 py-3 text-[var(--c-muted)]">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="px-2 py-6 text-sm text-[var(--c-muted)] text-center">No orders found.</p>}
      </div>
    </section>
  );
}
