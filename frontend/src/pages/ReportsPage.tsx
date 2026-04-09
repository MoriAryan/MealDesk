import { useEffect, useMemo, useState } from "react";
import { requestJson } from "../api/client";
import { listPosConfigs } from "../api/posConfig";
import { getSessions, type PosSession } from "../api/sessions";
import { listProducts } from "../api/products";
import type { PosConfig } from "../api/types";
import type { Product } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

interface ReportSummary {
  totalOrders: number;
  paidOrders?: number;
  draftOrders?: number;
  totalRevenue: number;
  totalTax: number;
  avgOrder: number;
  pctRevenue?: number | null;
  pctOrders?: number | null;
  pctAvg?: number | null;
  topProducts: { name: string; qty: number; revenue: number }[];
  recentOrders?: { id: string; total: number; created_at: string; source: string; status?: string }[];
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
  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedOpenedBy, setSelectedOpenedBy] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listPosConfigs(accessToken)
      .then(res => setPosConfigs(res.posConfigs))
      .catch(() => {});
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !selectedConfigId) {
      setSessions([]);
      setProducts([]);
      setSelectedSessionId("");
      setSelectedOpenedBy("");
      setSelectedProductId("");
      return;
    }

    const loadFilterData = async () => {
      try {
        const [sessionsRes, productsRes] = await Promise.all([
          getSessions(accessToken, selectedConfigId),
          listProducts(accessToken, { posConfigId: selectedConfigId }),
        ]);
        setSessions(sessionsRes);
        setProducts(productsRes.products);
      } catch {
        // best effort
      }
    };

    void loadFilterData();
  }, [accessToken, selectedConfigId]);

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
      if (selectedSessionId) params.set("pos_session_id", selectedSessionId);
      if (selectedOpenedBy) params.set("opened_by", selectedOpenedBy);
      if (selectedProductId) params.set("product_id", selectedProductId);

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
  }, [accessToken, period, selectedConfigId, selectedSessionId, selectedOpenedBy, selectedProductId]);

  const responsibleUsers = useMemo(() => {
    const seen = new Set<string>();
    const items: string[] = [];
    for (const s of sessions) {
      if (!s.opened_by || seen.has(s.opened_by)) continue;
      seen.add(s.opened_by);
      items.push(s.opened_by);
    }
    return items;
  }, [sessions]);

  const exportReportCsv = () => {
    if (!report) return;
    const rows: string[][] = [
      ["Metric", "Value"],
      ["Total Orders", String(report.totalOrders)],
      ["Paid Orders", String(report.paidOrders ?? 0)],
      ["Draft Orders", String(report.draftOrders ?? 0)],
      ["Total Revenue", String(report.totalRevenue.toFixed(2))],
      ["Total Tax", String(report.totalTax.toFixed(2))],
      ["Average Order", String(report.avgOrder.toFixed(2))],
      [],
      ["Top Products", "Qty", "Revenue"],
      ...report.topProducts.map((p) => [p.name, String(p.qty), String(p.revenue.toFixed(2))]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report-${period}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportXls = () => {
    if (!report) return;
    const xlsRows = [
      ["Metric", "Value"],
      ["Total Orders", report.totalOrders],
      ["Paid Orders", report.paidOrders ?? 0],
      ["Draft Orders", report.draftOrders ?? 0],
      ["Total Revenue", report.totalRevenue.toFixed(2)],
      ["Total Tax", report.totalTax.toFixed(2)],
      ["Average Order", report.avgOrder.toFixed(2)],
    ];

    const tableHtml = `
      <table>
        ${xlsRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}
      </table>
    `;

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report-${period}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportPdf = () => {
    window.print();
  };

  const maxQty = useMemo(
    () => Math.max(1, ...(report?.topProducts.map(p => p.qty) ?? [1])),
    [report]
  );

  return (
    <section className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-xl font-bold font-head text-ink">Reports & Analytics</span>
        <div className="flex items-center gap-2">
          <button onClick={exportReportCsv} disabled={!report} className="text-xs font-semibold px-3 py-1.5 rounded border border-border text-ink disabled:opacity-50">CSV</button>
          <button onClick={exportReportXls} disabled={!report} className="text-xs font-semibold px-3 py-1.5 rounded border border-border text-ink disabled:opacity-50">XLS</button>
          <button onClick={exportReportPdf} disabled={!report} className="text-xs font-semibold px-3 py-1.5 rounded border border-border text-ink disabled:opacity-50">PDF</button>
          <button
            onClick={() => void fetchReport()}
            disabled={loading}
            className="text-sm font-semibold px-4 py-1.5 rounded bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Period Tabs */}
        <div className="flex bg-panel rounded-lg p-1 border border-border gap-1">
          {(["today", "week", "month", "custom"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-colors ${
                period === p
                  ? "bg-[var(--color-ink)] text-white shadow"
                  : "text-muted hover:text-ink"
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
          className="text-sm bg-panel border border-border rounded-lg px-3 py-1.5 text-ink focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          <option value="">All Terminals</option>
          {posConfigs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
          className="text-sm bg-panel border border-border rounded-lg px-3 py-1.5 text-ink focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          <option value="">All Sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {new Date(s.opened_at).toLocaleString()} ({s.status})
            </option>
          ))}
        </select>

        <select
          value={selectedOpenedBy}
          onChange={(e) => setSelectedOpenedBy(e.target.value)}
          className="text-sm bg-panel border border-border rounded-lg px-3 py-1.5 text-ink focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          <option value="">All Responsible</option>
          {responsibleUsers.map((uid) => (
            <option key={uid} value={uid}>User {uid.slice(0, 8)}</option>
          ))}
        </select>

        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="text-sm bg-panel border border-border rounded-lg px-3 py-1.5 text-ink focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          <option value="">All Products</option>
          {products.map((p) => (
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
              className="text-sm bg-panel border border-border rounded-lg px-3 py-1.5 text-ink"
            />
            <span className="text-muted">→</span>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className="text-sm bg-panel border border-border rounded-lg px-3 py-1.5 text-ink"
            />
            <button
              onClick={() => void fetchReport()}
              className="text-sm font-semibold px-3 py-1.5 rounded bg-[var(--color-accent)] text-white"
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
              { label: "Paid Orders", value: String(report.paidOrders ?? 0), suffix: "" },
              { label: "Draft Orders", value: String(report.draftOrders ?? 0), suffix: "" },
              { label: "Total Revenue", value: `$${report.totalRevenue.toFixed(2)}`, suffix: "" },
              { label: "Avg Order", value: `$${report.avgOrder.toFixed(2)}`, suffix: "" },
            ].map(kpi => (
              <div
                key={kpi.label}
                className="bg-panel border border-border rounded-xl p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">{kpi.label}</p>
                <p className="text-3xl font-black text-ink tracking-tight">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Top Products Table */}
          <div className="bg-panel border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-bold text-ink">Top Products</h3>
              <p className="text-xs text-muted mt-0.5">Ranked by quantity sold in selected period</p>
            </div>
            {report.topProducts.length === 0 ? (
              <p className="px-6 py-8 text-center text-muted text-sm">No sales data for this period.</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {report.topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-4 px-6 py-3 hover:bg-panel transition-colors">
                    <span className="w-7 h-7 rounded-full bg-panel border border-border flex items-center justify-center text-xs font-black text-muted">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink truncate">{p.name}</p>
                      <div className="mt-1.5 h-1.5 rounded-full bg-panel overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                          style={{ width: `${Math.round((p.qty / maxQty) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-ink">{p.qty} sold</p>
                      <p className="text-xs text-muted">${p.revenue.toFixed(2)}</p>
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
