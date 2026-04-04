import { useEffect, useState } from "react";
import { requestJson } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import type { Order } from "../api/types";

interface LatestOrderResponse {
  order: Order & { order_lines: Array<{ product_name: string; qty: number; unit_price: number }> } | null;
}

export function CustomerDisplayPage() {
  const { accessToken } = useAuth();
  const [order, setOrder] = useState<LatestOrderResponse["order"]>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [prevStatus, setPrevStatus] = useState<string | null>(null);

  const fetchLatest = async () => {
    if (!accessToken) return;
    try {
      const res = await requestJson<LatestOrderResponse>("/customer-display/latest", {
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
    void fetchLatest();
    const interval = setInterval(() => void fetchLatest(), 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div className="relative min-h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
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
      <header className="bg-gray-900 border-b border-gray-800 px-10 py-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-black tracking-tight text-white font-head">
            Odoo <span className="text-orange-400">POS</span> Cafe
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-gray-400 font-semibold">Customer Display</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-10 gap-8 items-start justify-center">
        {order ? (
          <>
            {/* Order Summary */}
            <div className="w-full max-w-xl bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
              <div className="bg-gray-800 px-6 py-4 flex items-center justify-between border-b border-gray-700">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Order</p>
                  <h2 className="text-2xl font-black tracking-tight">{order.order_number}</h2>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    order.status === "paid"
                      ? "bg-green-500/20 text-green-400 border border-green-400/30"
                      : "bg-orange-500/20 text-orange-400 border border-orange-400/30"
                  }`}
                >
                  {order.status === "paid" ? "✓ Paid" : "⏳ Pending"}
                </span>
              </div>

              {/* Order Lines */}
              <div className="divide-y divide-gray-800">
                {order.order_lines && order.order_lines.length > 0 ? (
                  order.order_lines.map((line, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-black border border-orange-400/30">
                          {line.qty}
                        </span>
                        <span className="text-base font-semibold text-gray-100">
                          {line.product_name}
                        </span>
                      </div>
                      <span className="text-base font-bold text-gray-300">
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
            <div className="w-full max-w-xs bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-8 flex flex-col gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Subtotal</p>
                <p className="text-2xl font-bold text-gray-200">${Number(order.subtotal).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Taxes</p>
                <p className="text-2xl font-bold text-gray-200">${Number(order.tax_total).toFixed(2)}</p>
              </div>
              <div className="border-t border-gray-700 pt-6">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-3">Total Due</p>
                <p className="text-6xl font-black tracking-tighter text-white leading-none">
                  ${Number(order.total).toFixed(2)}
                </p>
              </div>

              {order.status === "paid" && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                  <p className="text-green-400 font-black text-xl">✓ Payment Complete</p>
                  <p className="text-green-300 text-sm mt-1">Thank you!</p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Idle screen */
          <div className="flex flex-col items-center justify-center h-full flex-1 text-center py-24">
            <div className="text-8xl mb-8 opacity-20">☕</div>
            <h2 className="text-3xl font-black text-gray-300 mb-3">Welcome!</h2>
            <p className="text-gray-500 text-lg font-medium">
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
