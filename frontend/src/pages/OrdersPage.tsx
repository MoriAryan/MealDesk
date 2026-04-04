import { useEffect, useState, useRef } from "react";
import { X, ChevronDown } from "lucide-react";
import { listOrders } from "../api/orders";
import { appEnv } from "../config/env";
import type { Order, OrderLine } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

// ─── Order Detail Modal ────────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"product" | "extrainfo">("product");

  const lines: OrderLine[] = order.order_lines || [];

  const statusColor =
    order.status === "paid"
      ? { bg: "bg-green-500/10 border-green-500 text-green-500" }
      : order.status === "draft"
      ? { bg: "bg-amber-500/10 border-amber-500 text-amber-500" }
      : { bg: "bg-muted/10 border-border text-muted" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-border bg-panel shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-ink">Order #{order.order_number}</h2>
            <p className="text-xs text-muted mt-0.5">
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border capitalize ${statusColor.bg}`}
            >
              {order.status}
            </span>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-ink transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {[
            { label: "Order No", value: order.order_number },
            { label: "Date", value: new Date(order.created_at).toLocaleDateString("en-IN") },
            {
              label: "Session",
              value: order.pos_sessions
                ? new Date(order.pos_sessions.opened_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
                : "—",
            },
            { label: "Customer", value: order.customers?.name || "Walk-in" },
          ].map((item) => (
            <div key={item.label} className="bg-panel px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-0.5">
                {item.label}
              </p>
              <p className="text-sm font-medium text-ink">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["product", "extrainfo"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors capitalize ${
                activeTab === tab
                  ? "border-b-2 border-accent text-accent"
                  : "text-muted hover:text-ink"
              }`}
            >
              {tab === "product" ? "Product" : "Extra Info"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-auto max-h-64">
          {activeTab === "product" ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  {["Product", "QTY", "Amount", "Tax", "UOM", "Sub-Total", "Total"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted text-xs">
                      No items
                    </td>
                  </tr>
                ) : (
                  lines.map((line) => (
                    <tr key={line.id} className="border-b border-border/50 hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-accent">{line.product_name} →</td>
                      <td className="px-4 py-2.5 text-ink">{line.qty}</td>
                      <td className="px-4 py-2.5 text-ink">${Number(line.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-muted">{Number(line.tax_rate).toFixed(0)}%</td>
                      <td className="px-4 py-2.5 text-muted capitalize">{line.uom}</td>
                      <td className="px-4 py-2.5 text-ink">${Number(line.subtotal).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-ink font-medium">${Number(line.total).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted">Source</span>
                <span className="text-ink uppercase text-xs font-semibold">{order.source}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted">Invoice</span>
                <span className="text-ink">{order.is_invoice ? "Yes" : "No"}</span>
              </div>
              {order.notes && (
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted">Notes</span>
                  <span className="text-ink max-w-xs text-right">{order.notes}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Totals footer */}
        <div className="border-t border-border p-5 bg-bg/30">
          <div className="max-w-xs ml-auto space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Total w/t Tax</span>
              <span className="text-ink font-medium">${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Tax</span>
              <span className="text-ink">${Number(order.tax_total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-bold text-ink">Final Total</span>
              <span className="font-bold text-accent text-base">${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Orders Page ───────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { accessToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listOrders(accessToken);
      setOrders(res.orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => { void load(); }, 10_000);
    return () => clearInterval(interval);
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [accessToken]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const draftSelectedIds = selectedIds.filter(
    (id) => orders.find((o) => o.id === id)?.status === "draft"
  );

  const bulkArchive = async () => {
    setActionMenuOpen(false);
    if (draftSelectedIds.length === 0) return;
    await Promise.allSettled(
      draftSelectedIds.map((id) =>
        fetch(`${appEnv.apiBaseUrl}/orders/${id}/archive`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      )
    );
    setSelectedIds([]);
    void load();
  };

  const bulkDelete = async () => {
    setActionMenuOpen(false);
    if (draftSelectedIds.length === 0) return;
    await Promise.allSettled(
      draftSelectedIds.map((id) =>
        fetch(`${appEnv.apiBaseUrl}/orders/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      )
    );
    setSelectedIds([]);
    void load();
  };

  return (
    <section className="max-w-6xl">
      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-ink">Orders</span>
          {selectedIds.length > 0 && (
            <span className="text-xs font-semibold bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/20">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                className="flex items-center gap-2 text-sm font-semibold bg-panel text-ink px-3 py-1.5 rounded-lg border border-border hover:bg-bg transition-colors"
              >
                <span>⚙</span> Action
                <ChevronDown size={12} className={`transition-transform ${actionMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {actionMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-panel border border-border rounded-xl shadow-lg z-50 py-1">
                  <button
                    onClick={bulkArchive}
                    className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-bg transition-colors"
                  >
                    ↓ Archive
                  </button>
                  <button
                    onClick={bulkDelete}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    🗑 Delete
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => void load()}
            title="Refresh now"
            className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors border border-border px-3 py-1.5 rounded-lg hover:border-accent/40"
          >
            ↻ Refresh
          </button>
        </div>
      </div>
      {error && (
        <p className="mb-4 rounded-lg border border-red-400 bg-red-400/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted text-sm">Loading orders…</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-bg/60 border-b border-border">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === orders.length && orders.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-border accent-[var(--color-accent)]"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Order No</th>
                <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Session</th>
                <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-border hover:bg-panel transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(o)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(o.id)}
                      onChange={() => toggleSelect(o.id)}
                      className="rounded border-border accent-[var(--color-accent)]"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{o.order_number}</td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {o.pos_sessions
                      ? new Date(o.pos_sessions.opened_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "2-digit" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(o.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit"
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">${Number(o.total).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted">{o.customers?.name || "Walk-in"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${
                        o.status === "paid"
                          ? "bg-green-500/10 border-green-500/40 text-green-500"
                          : o.status === "draft"
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-500"
                          : "bg-muted/10 border-border text-muted"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted text-sm">
                    No orders found for this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
