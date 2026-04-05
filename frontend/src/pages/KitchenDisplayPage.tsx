import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  fetchKitchenTickets,
  updateTicketStage,
  updateItemPrepared,
  generateMockTicket,
} from "../api/kitchen";
import type { KitchenTicket, KitchenTicketItem } from "../api/kitchen";
import { RefreshCw, Plus } from "lucide-react";

// ─── Sticky Note Colors per stage ─────────────────────────────────────────────
const STAGE_STYLES = {
  to_cook: {
    bg: "#fef9c3",       // warm yellow
    border: "#fde047",
    tape: "#fbbf24",
    label: "Pending",
    labelColor: "#92400e",
    labelBg: "#fef3c7",
    shadow: "4px 5px 12px rgba(0,0,0,0.13), 0 1px 3px rgba(0,0,0,0.08)",
  },
  preparing: {
    bg: "#fce7f3",       // rose pink
    border: "#f9a8d4",
    tape: "#ec4899",
    label: "Preparing",
    labelColor: "#831843",
    labelBg: "#fce7f3",
    shadow: "4px 5px 12px rgba(0,0,0,0.13), 0 1px 3px rgba(0,0,0,0.08)",
  },
  completed: {
    bg: "#dcfce7",       // mint green
    border: "#86efac",
    tape: "#22c55e",
    label: "Done ✓",
    labelColor: "#14532d",
    labelBg: "#dcfce7",
    shadow: "4px 5px 12px rgba(0,0,0,0.10)",
  },
};

// ─── Sticky Note Tape ──────────────────────────────────────────────────────────
function Tape({ color }: { color: string }) {
  return (
    <div
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 rounded-sm z-10 opacity-70"
      style={{
        backgroundColor: color,
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transform: "translateX(-50%) rotate(-1deg)",
      }}
    />
  );
}

// ─── Single Sticky Note ────────────────────────────────────────────────────────
function StickyNote({
  ticket,
  onStageChange,
  onItemToggle,
}: {
  ticket: KitchenTicket;
  onStageChange: (t: KitchenTicket, next: string) => void;
  onItemToggle: (e: React.MouseEvent, tId: string, item: KitchenTicketItem) => void;
}) {
  const style = STAGE_STYLES[ticket.stage as keyof typeof STAGE_STYLES] ?? STAGE_STYLES.to_cook;
  const isCompleted = ticket.stage === "completed";
  const allPrepared = ticket.kitchen_ticket_items.every(i => i.prepared);
  const someStarted = ticket.kitchen_ticket_items.some(i => i.prepared);

  // Time since created
  const sentAgo = (() => {
    const sent = ticket.sent_at ? new Date(ticket.sent_at) : null;
    if (!sent) return null;
    const mins = Math.floor((Date.now() - sent.getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  })();

  return (
    <div
      className="relative mt-5 select-none"
      style={{
        transform: `rotate(${Math.random() * 2 - 1}deg)`,
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = "rotate(0deg) scale(1.01)")}
      onMouseLeave={e => (e.currentTarget.style.transform = `rotate(${Math.random() * 2 - 1}deg)`)}
    >
      {/* Tape */}
      <Tape color={style.tape} />

      {/* Note body */}
      <div
        className="relative rounded-sm pt-8 pb-5 px-5 flex flex-col gap-3 overflow-hidden"
        style={{
          backgroundColor: style.bg,
          border: `1px solid ${style.border}`,
          boxShadow: style.shadow,
          minHeight: 200,
          // subtle paper texture via gradient
          backgroundImage: `linear-gradient(${style.bg} 28px, #e5e7eb33 28px)`,
          backgroundSize: "100% 29px",
        }}
      >
        {/* Ruled lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(transparent, transparent 28px, rgba(0,0,0,0.06) 28px, rgba(0,0,0,0.06) 29px)`,
          backgroundPositionY: "57px",
        }} />

        {/* Header */}
        <div className="flex items-start justify-between mb-1 relative z-10">
          <div>
            <p
              className="font-bold leading-tight"
              style={{ fontFamily: "'Caveat', cursive", fontSize: 26, color: "#1c1917", letterSpacing: 0.5 }}
            >
              #{ticket.order_number.replace("MOCK-", "").replace("POS-", "")}
            </p>
            {sentAgo && (
              <p style={{ fontFamily: "'Caveat', cursive", fontSize: 13, color: "#78716c" }}>{sentAgo}</p>
            )}
          </div>
          {/* Stage badge */}
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0"
            style={{ backgroundColor: style.labelBg, color: style.labelColor, fontFamily: "DM Sans, sans-serif", border: `1px solid ${style.border}` }}
          >
            {style.label}
          </span>
        </div>

        {/* Item list */}
        <div className="flex flex-col gap-2 flex-1 relative z-10">
          {ticket.kitchen_ticket_items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={(e) => onItemToggle(e, ticket.id, item)}
            >
              {/* Handwritten checkbox */}
              <div
                className="shrink-0 flex items-center justify-center transition-all"
                style={{
                  width: 22, height: 22,
                  border: `2px solid ${item.prepared ? "#16a34a" : "#78716c"}`,
                  borderRadius: 3,
                  backgroundColor: item.prepared ? "#dcfce7" : "transparent",
                  fontFamily: "'Caveat', cursive",
                  fontSize: 18,
                  color: "#15803d",
                  lineHeight: 1,
                  transform: item.prepared ? "rotate(-3deg)" : "none",
                }}
              >
                {item.prepared ? "✓" : ""}
              </div>
              {/* Quantity + name */}
              <div className="flex items-baseline gap-1.5 flex-1">
                <span
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 20,
                    fontWeight: 700,
                    color: item.prepared ? "#86efac" : "#b45309",
                    minWidth: 20,
                    textDecoration: item.prepared ? "none" : "none",
                  }}
                >
                  {item.qty}×
                </span>
                <span
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 20,
                    color: item.prepared ? "#78716c" : "#1c1917",
                    textDecoration: item.prepared ? "line-through wavy #6b7280" : "none",
                    transition: "color 0.3s, text-decoration 0.3s",
                  }}
                >
                  {item.product_name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {ticket.kitchen_ticket_items.length > 0 && (
          <div className="relative z-10 mt-1">
            <div className="h-1 w-full rounded-full" style={{ backgroundColor: `${style.border}` }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(ticket.kitchen_ticket_items.filter(i => i.prepared).length / ticket.kitchen_ticket_items.length) * 100}%`,
                  backgroundColor: style.tape,
                }}
              />
            </div>
          </div>
        )}

        {/* Stage action buttons */}
        {!isCompleted && (
          <div className="flex gap-2 mt-1 relative z-10">
            {ticket.stage === "to_cook" && (
              <button
                onClick={(e) => { e.stopPropagation(); onStageChange(ticket, "preparing"); }}
                className="flex-1 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80"
                style={{ fontFamily: "DM Sans, sans-serif", backgroundColor: style.tape, color: style.labelColor, opacity: 0.85 }}
              >
                Start Cooking →
              </button>
            )}
            {ticket.stage === "preparing" && (
              <button
                onClick={(e) => { e.stopPropagation(); onStageChange(ticket, "completed"); }}
                className="flex-1 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80"
                style={{ fontFamily: "DM Sans, sans-serif", backgroundColor: "#22c55e", color: "#fff", opacity: allPrepared ? 1 : 0.7 }}
              >
                Mark Done ✓
              </button>
            )}
          </div>
        )}

        {isCompleted && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: "rotate(-12deg)" }}
          >
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 52,
                fontWeight: 700,
                color: "#16a34a",
                opacity: 0.18,
                letterSpacing: -1,
              }}
            >
              DONE!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Kitchen Display Page ─────────────────────────────────────────────────
export const KitchenDisplayPage = () => {
  const { accessToken } = useAuth();
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | "to_cook" | "preparing" | "completed">("All");

  const loadTickets = async () => {
    if (!accessToken) return;
    try {
      const res = await fetchKitchenTickets(accessToken);
      setTickets(res.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleStageChange = async (t: KitchenTicket, next: string) => {
    if (!accessToken) return;
    setTickets(prev => prev.map(pt => pt.id === t.id ? { ...pt, stage: next as typeof t.stage } : pt));
    try {
      await updateTicketStage(accessToken, t.id, next);
      loadTickets();
    } catch { loadTickets(); }
  };

  const handleItemToggle = async (e: React.MouseEvent, tId: string, item: KitchenTicketItem) => {
    e.stopPropagation();
    if (!accessToken) return;
    const newPrepared = !item.prepared;
    // Optimistic update
    setTickets(prev => prev.map(t => {
      if (t.id !== tId) return t;
      const updatedItems = t.kitchen_ticket_items.map(i => i.id === item.id ? { ...i, prepared: newPrepared } : i);
      const allDone = updatedItems.every(i => i.prepared);
      return { ...t, kitchen_ticket_items: updatedItems, stage: allDone ? "completed" : t.stage };
    }));
    try {
      await updateItemPrepared(accessToken, tId, item.id, newPrepared);
      // Small delay then refresh to get server truth
      setTimeout(loadTickets, 600);
    } catch { loadTickets(); }
  };

  const filteredTickets = useMemo(() => {
    if (activeTab === "All") return tickets;
    return tickets.filter(t => t.stage === activeTab);
  }, [tickets, activeTab]);

  const counts = useMemo(() => ({
    all: tickets.length,
    to_cook: tickets.filter(t => t.stage === "to_cook").length,
    preparing: tickets.filter(t => t.stage === "preparing").length,
    completed: tickets.filter(t => t.stage === "completed").length,
  }), [tickets]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <RefreshCw className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  const TAB_LABELS = [
    { key: "All", label: "All", count: counts.all, color: "#1c1917", bg: "#e7e5e4" },
    { key: "to_cook", label: "Pending", count: counts.to_cook, color: "#92400e", bg: "#fef3c7" },
    { key: "preparing", label: "Preparing", count: counts.preparing, color: "#831843", bg: "#fce7f3" },
    { key: "completed", label: "Done", count: counts.completed, color: "#14532d", bg: "#dcfce7" },
  ] as const;

  return (
    <div className="flex flex-col gap-6 min-h-[75vh]">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-black text-ink tracking-tight">Kitchen Display</h1>
          <p className="text-sm text-muted mt-0.5">Tap an item to mark it prepared · Tap a button to advance the stage</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void generateMockTicket(accessToken!, "").then(loadTickets)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-xl text-sm font-semibold text-muted hover:text-ink hover:border-ink transition-all"
          >
            <Plus size={15} /> Add Test Ticket
          </button>
          <button
            onClick={loadTickets}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-muted hover:text-accent hover:border-accent transition-all"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Stage Tab Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {TAB_LABELS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border"
            style={{
              backgroundColor: activeTab === tab.key ? tab.bg : "transparent",
              color: activeTab === tab.key ? tab.color : "#8b8074",
              borderColor: activeTab === tab.key ? tab.bg : "#e8e2d9",
              boxShadow: activeTab === tab.key ? "inset 0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            {tab.label}
            <span
              className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-black"
              style={{ backgroundColor: activeTab === tab.key ? tab.color + "22" : "#e7e5e4", color: tab.color }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sticky notes grid */}
      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border/80 rounded-2xl">
          <p style={{ fontFamily: "'Caveat', cursive", fontSize: 28, color: "#a8a29e" }}>
            No tickets here yet…
          </p>
          <p className="text-sm text-muted mt-2">Orders sent to kitchen will appear as sticky notes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredTickets.map(ticket => (
            <StickyNote
              key={ticket.id}
              ticket={ticket}
              onStageChange={handleStageChange}
              onItemToggle={handleItemToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
