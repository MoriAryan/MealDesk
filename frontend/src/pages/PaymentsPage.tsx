import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { listPayments } from "../api/payments";
import type { Payment } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

type PaymentGroup = {
  method: string;
  total: number;
  payments: Payment[];
};

function groupPayments(payments: Payment[]): PaymentGroup[] {
  const map: Record<string, PaymentGroup> = {};
  for (const p of payments) {
    const key = p.payment_method;
    if (!map[key]) map[key] = { method: key, total: 0, payments: [] };
    map[key].total += Number(p.amount);
    map[key].payments.push(p);
  }
  return Object.values(map);
}

const methodLabel: Record<string, string> = {
  cash: "Cash",
  digital: "Card / Digital",
  upi: "UPI",
};

export function PaymentsPage() {
  const { accessToken } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMethods, setExpandedMethods] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!accessToken) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await listPayments(accessToken);
        setPayments(res.payments);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load payments");
      } finally {
        setLoading(false);
      }
    };
    void load();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => { void load(); }, 10_000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const toggleMethod = (method: string) => {
    setExpandedMethods((prev) => {
      const next = new Set(prev);
      if (next.has(method)) next.delete(method);
      else next.add(method);
      return next;
    });
  };

  const groups = groupPayments(payments);

  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const manualRefresh = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listPayments(accessToken);
      setPayments(res.payments);
      setLastRefreshed(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-5xl">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
        <span className="text-xl font-bold text-ink">Payments</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">
            Updated {lastRefreshed.toLocaleTimeString()}
          </span>
          <button
            onClick={() => void manualRefresh()}
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
        <div className="flex items-center justify-center py-20 text-muted text-sm">Loading payments…</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_160px_140px] bg-bg/60 border-b border-border">
            <div className="px-4 py-3 w-10" />
            <div className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Payment Method</div>
            <div className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Date</div>
            <div className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">Amount</div>
          </div>

          {groups.length === 0 && (
            <div className="px-4 py-16 text-center text-muted text-sm">No payments recorded yet.</div>
          )}

          {groups.map((group) => {
            const isOpen = expandedMethods.has(group.method);
            return (
              <div key={group.method}>
                {/* Group header row */}
                <div
                  className="grid grid-cols-[auto_1fr_160px_140px] border-b border-border hover:bg-panel cursor-pointer transition-colors"
                  onClick={() => toggleMethod(group.method)}
                >
                  <div className="px-4 py-3.5 w-10 flex items-center justify-center">
                    <ChevronRight
                      size={16}
                      className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                    />
                  </div>
                  <div className="px-4 py-3.5 font-semibold text-ink flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          group.method === "cash"
                            ? "bg-green-500"
                            : group.method === "upi"
                            ? "bg-purple-500"
                            : "bg-blue-500"
                        }`}
                      />
                      {methodLabel[group.method] ?? group.method}
                    </span>
                  </div>
                  <div className="px-4 py-3.5 text-muted text-sm flex items-center">—</div>
                  <div className="px-4 py-3.5 text-ink font-bold text-right flex items-center justify-end">
                    ${Number(group.total).toFixed(2)}
                  </div>
                </div>

                {/* Expanded rows */}
                {isOpen &&
                  group.payments.map((p) => (
                    <div
                      key={p.id}
                      className="grid grid-cols-[auto_1fr_160px_140px] border-b border-border/50 bg-bg/30 hover:bg-bg/60 transition-colors"
                    >
                      <div className="px-4 py-2.5 w-10 flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="rounded border-border accent-[var(--color-accent)]"
                          readOnly
                        />
                      </div>
                      <div className="px-4 py-2.5 text-muted text-sm flex items-center capitalize">
                        {methodLabel[p.payment_method] ?? p.payment_method}
                      </div>
                      <div className="px-4 py-2.5 text-muted text-sm flex items-center">
                        {new Date(p.paid_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "2-digit",
                        })}
                      </div>
                      <div className="px-4 py-2.5 text-ink text-sm font-medium text-right flex items-center justify-end">
                        ${Number(p.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
