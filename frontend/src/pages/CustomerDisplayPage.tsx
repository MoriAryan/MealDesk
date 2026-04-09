import { useEffect, useState } from "react";
import { requestJson } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import type { Order } from "../api/types";
import { listPosConfigs } from "../api/posConfig";
import { getActiveSession, type PosSession } from "../api/sessions";
import type { PosConfig } from "../api/types";
import { MealDeskWordmark } from "../components/MealDeskBrand";

interface LatestOrderResponse {
  order: Order & { order_lines: Array<{ product_name: string; qty: number; unit_price: number }> } | null;
}

export function CustomerDisplayPage() {
  const { accessToken } = useAuth();
  const [posConfigs, setPosConfigs] = useState<PosConfig[]>([]);
  const [selectedPosConfigId, setSelectedPosConfigId] = useState("");
  const [activeSession, setActiveSession] = useState<PosSession | null>(null);
  const [order, setOrder] = useState<LatestOrderResponse["order"]>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    const loadConfigs = async () => {
      try {
        const response = await listPosConfigs(accessToken);
        setPosConfigs(response.posConfigs);
        setSelectedPosConfigId((current) => current || response.posConfigs[0]?.id || "");
      } catch {
        // best effort for display page
      }
    };

    void loadConfigs();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !selectedPosConfigId) return;
    const loadSession = async () => {
      try {
        const session = await getActiveSession(accessToken, selectedPosConfigId);
        setActiveSession(session);
      } catch {
        setActiveSession(null);
      }
    };

    void loadSession();
  }, [accessToken, selectedPosConfigId]);

  const fetchLatest = async () => {
    if (!accessToken) return;
    try {
      const params = new URLSearchParams();
      if (selectedPosConfigId) params.set("pos_config_id", selectedPosConfigId);
      if (activeSession?.id) params.set("pos_session_id", activeSession.id);

      const suffix = params.toString() ? `?${params.toString()}` : "";

      const res = await requestJson<LatestOrderResponse>(`/customer-display/latest${suffix}`, {
        token: accessToken,
      });
      setOrder(res.order);

      // If just transitioned to paid → flash thank you
      if (res.order?.status === "paid" && prevStatus === "draft") {
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 4000);
      }
      setPrevStatus(res.order?.status ?? null);
    } catch {
      // silently fail — polling is best effort
    }
  };

  useEffect(() => {
    if (!selectedPosConfigId) return;
    void fetchLatest();
    const interval = setInterval(() => void fetchLatest(), 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, selectedPosConfigId, activeSession?.id]);

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{
        background: "radial-gradient(circle at top, rgba(193,91,61,0.16), transparent 36%), var(--color-bg)",
        color: "var(--color-ink)",
      }}
    >
      {/* Thank You overlay */}
      {showThankYou && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-green-600 animate-pulse"
          onClick={() => setShowThankYou(false)}
        >
          <div className="text-9xl mb-6 animate-bounce">✓</div>
          <h1 className="text-5xl font-black tracking-tight mb-3">Payment Successful!</h1>
          <p className="text-2xl font-semibold text-green-100">Thank you for your order</p>
          <p className="mt-4 text-green-200 text-sm">Click anywhere to dismiss</p>
        </div>
      )}

      {/* Header */}
      <header className="bg-panel/90 backdrop-blur-md border-b border-border px-6 md:px-10 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <MealDeskWordmark size="text-2xl" showTagline={false} />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPosConfigId}
            onChange={(event) => setSelectedPosConfigId(event.target.value)}
            className="bg-bg border border-border rounded-full px-3 py-1.5 text-xs text-ink"
          >
            {posConfigs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted">
            {activeSession ? "Session Active" : "No Active Session"}
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-muted font-semibold">Guest Screen</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-6 items-start justify-center">
        {order ? (
          <>
            {/* Order Summary */}
            <div className="w-full max-w-xl bg-panel rounded-[2rem] border border-border shadow-[var(--shadow-artisanal)] overflow-hidden">
              <div className="bg-bg/60 px-6 py-4 flex items-center justify-between border-b border-border">
                <div>
                  <p className="text-xs text-muted uppercase tracking-widest font-bold">Order</p>
                  <h2 className="text-2xl font-black tracking-tight">{order.order_number}</h2>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    order.status === "paid"
                      ? "bg-green-500/10 text-green-600 border border-green-500/20"
                      : "bg-orange-500/10 text-accent border border-accent/20"
                  }`}
                >
                  {order.status === "paid" ? "✓ Paid" : "⏳ Pending"}
                </span>
              </div>

              {/* Order Lines */}
              <div className="divide-y divide-border">
                {order.order_lines && order.order_lines.length > 0 ? (
                  order.order_lines.map((line, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-black border border-accent/20">
                          {line.qty}
                        </span>
                        <span className="text-base font-semibold text-ink">
                          {line.product_name}
                        </span>
                      </div>
                      <span className="text-base font-bold text-ink">
                        ${(Number(line.unit_price) * line.qty).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="px-6 py-8 text-center text-gray-500">No items yet...</p>
                )}
              </div>
            </div>

            {/* Total Panel */}
            <div className="w-full max-w-xs bg-panel rounded-[2rem] border border-border shadow-[var(--shadow-artisanal)] p-8 flex flex-col gap-6">
              <div>
                <p className="text-xs text-muted uppercase tracking-widest font-bold mb-2">Subtotal</p>
                <p className="text-2xl font-bold text-ink">${Number(order.subtotal).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-widest font-bold mb-2">Taxes</p>
                <p className="text-2xl font-bold text-ink">${Number(order.tax_total).toFixed(2)}</p>
              </div>
              <div className="border-t border-border pt-6">
                <p className="text-xs text-muted uppercase tracking-widest font-bold mb-3">Total Due</p>
                <p className="text-6xl font-black tracking-tighter text-ink leading-none">
                  ${Number(order.total).toFixed(2)}
                </p>
              </div>

              {order.status === "paid" && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                  <p className="text-green-700 font-black text-xl">✓ Payment Complete</p>
                  <p className="text-green-700/80 text-sm mt-1">Thank you!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Idle screen */
          <div className="flex flex-col items-center justify-center h-full flex-1 text-center py-24">
            <div className="text-8xl mb-8 opacity-20">◔</div>
            <h2 className="text-3xl font-black text-ink mb-3">Welcome!</h2>
            <p className="text-muted text-lg font-medium">
              Your order will appear here once placed.
            </p>
            <div className="mt-8 flex gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-10 py-3 text-center">
        <p className="text-xs text-gray-600">
          Updates every 3 seconds · Odoo POS Cafe System
        </p>
      </footer>
    </div>
  );
}
