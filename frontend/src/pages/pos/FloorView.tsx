import { useState } from "react";

// For the hackathon scale, we'll hardcode 5 generic tables for instant display.
const DEFAULT_TABLES = [
  { id: "table-1", name: "Table 1", seats: 2 },
  { id: "table-2", name: "Table 2", seats: 2 },
  { id: "table-3", name: "Table 3", seats: 4 },
  { id: "table-4", name: "Table 4", seats: 4 },
  { id: "table-5", name: "Table 5", seats: 6 },
];

interface Props {
  activeTableId: string | null;
  setActiveTableId: (id: string) => void;
}

export function FloorView({ activeTableId, setActiveTableId }: Props) {
  return (
    <div className="h-full w-full p-8 bg-bg">
      <h2 className="mb-6 font-head text-2xl font-bold text-ink">Main Floor Layout</h2>
      
      <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5">
        {DEFAULT_TABLES.map((table) => {
          const isActive = activeTableId === table.id;
          return (
            <button
              key={table.id}
              onClick={() => setActiveTableId(table.id)}
              className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 transition-all hover:-translate-y-1 ${
                isActive 
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-4 ring-[var(--color-accent)]/20 shadow-lg" 
                  : "border-border bg-panel text-ink hover:border-[var(--color-accent)]/50 hover:shadow-md"
              }`}
            >
              <span className="text-xl font-bold">{table.name}</span>
              <span className="mt-2 text-sm text-muted">{table.seats} Seats</span>
              {isActive && (
                <span className="mt-2 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
                  Active
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
