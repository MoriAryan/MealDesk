import { useEffect, useState, useMemo } from "react";
import { requestJson } from "../api/client";
import { listPosConfigs } from "../api/posConfig";
import type { PosConfig } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

interface ReportSummary {
  totalOrders: number;
  totalRevenue: number;
  totalTax: number;
  avgOrder: number;
  topProducts: { name: string; qty: number; revenue: number }[];
}

type Period = "today" | "week" | "month" | "custom";

function getPeriodRange(period: Period, customFrom: string, customTo: string) {
  const now = new Date();
  if (period === "today") {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: now.toISOString() };
  }
  if (period === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 7);
    return { from: from.toISOString(), to: now.toISOString() };
  }
  if (period === "month") {
    const from = new Date(now);
    from.setMonth(now.getMonth() - 1);
    return { from: from.toISOString(), to: now.toISOString() };
  }
  return { from: customFrom ? new Date(customFrom).toISOString() : "", to: customTo ? new Date(customTo).toISOString() : "" };
}

export function ReportsPage() {
  const { accessToken } = useAuth();
  const [posConfigs, setPosConfigs] = useState<PosConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState("");
  const [period, setPeriod] = useState<Period>("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listPosConfigs(accessToken)
      .then(res => setPosConfigs(res.posConfigs))
      .catch(() => {});
  }, [accessToken]);

  const fetchReport = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getPeriodRange(period, customFrom, customTo);
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (selectedConfigId) params.set("pos_config_id", selectedConfigId);

      const res = await requestJson<ReportSummary>(`/reports/summary?${params.toString()}`, {
        token: accessToken,
      });
      setReport(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, period, selectedConfigId]);

  const maxQty = useMemo(
    () => Math.max(1, ...(report?.topProducts.map(p => p.qty) ?? [1])),
    [report]
  );

  return (
    <section className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--c-border)]">
        <span className="text-xl font-bold font-head text-[var(--c-ink)]">Reports & Analytics</span>
        <button
          onClick={() => void fetchReport()}
          disabled={loading}
          className="text-sm font-semibold px-4 py-1.5 rounded bg-[var(--c-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Period Tabs */}
        <div className="flex bg-[var(--c-panel-2)] rounded-lg p-1 border border-[var(--c-border)] gap-1">
          {(["today", "week", "month", "custom"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors ${
                period === p
                  ? "bg-[var(--c-ink)] text-white shadow"
                  : "text-[var(--c-muted)] hover:text-[var(--c-ink)]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* POS Terminal filter */}
        <select
          value={selectedConfigId}
          onChange={e => setSelectedConfigId(e.target.value)}
          className="text-sm bg-[var(--c-panel)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-[var(--c-ink)] focus:ring-1 focus:ring-[var(--c-accent)]"
        >
          <option value="">All Terminals</option>
          {posConfigs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Custom Range */}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className="text-sm bg-[var(--c-panel)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-[var(--c-ink)]"
            />
            <span className="text-[var(--c-muted)]">→</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="text-sm bg-[var(--c-panel)] border border-[var(--c-border)] rounded-lg px-3 py-1.5 text-[var(--c-ink)]"
            />
            <button
              onClick={() => void fetchReport()}
              className="text-sm font-semibold px-3 py-1.5 rounded bg-[var(--c-accent)] text-white"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {report && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: report.totalOrders.toString(), suffix: "" },
              { label: "Total Revenue", value: `$${report.totalRevenue.toFixed(2)}`, suffix: "" },
              { label: "Avg Order", value: `$${report.avgOrder.toFixed(2)}`, suffix: "" },
              { label: "Total Tax", value: `$${report.totalTax.toFixed(2)}`, suffix: "" },
            ].map(kpi => (
              <div
                key={kpi.label}
                className="bg-[var(--c-panel)] border border-[var(--c-border)] rounded-xl p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--c-muted)] mb-2">{kpi.label}</p>
                <p className="text-3xl font-black text-[var(--c-ink)] tracking-tight">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Top Products Table */}
          <div className="bg-[var(--c-panel)] border border-[var(--c-border)] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--c-border)]">
              <h3 className="font-bold text-[var(--c-ink)]">Top Products</h3>
              <p className="text-xs text-[var(--c-muted)] mt-0.5">Ranked by quantity sold in selected period</p>
            </div>
            {report.topProducts.length === 0 ? (
              <p className="px-6 py-8 text-center text-[var(--c-muted)] text-sm">No sales data for this period.</p>
            ) : (
              <div className="divide-y divide-[var(--c-border)]">
                {report.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-4 px-6 py-3 hover:bg-[var(--c-panel-2)] transition-colors">
                    <span className="w-7 h-7 rounded-full bg-[var(--c-panel-2)] border border-[var(--c-border)] flex items-center justify-center text-xs font-black text-[var(--c-muted)]">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--c-ink)] truncate">{p.name}</p>
                      <div className="mt-1.5 h-1.5 rounded-full bg-[var(--c-panel-2)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--c-accent)] transition-all"
                          style={{ width: `${Math.round((p.qty / maxQty) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-[var(--c-ink)]">{p.qty} sold</p>
                      <p className="text-xs text-[var(--c-muted)]">${p.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
