import { useState } from "react";
import { Users, Info, MousePointerClick, LayoutDashboard } from "lucide-react";

type TableShape = "round" | "square" | "rectangle";

interface TableDef {
  id: string;
  name: string;
  seats: number;
  shape: TableShape;
  status?: "occupied" | "free";
  floor: string;
}

const DEFAULT_TABLES: TableDef[] = [
  { id: "table-1", name: "Table 1", seats: 2, shape: "round", status: "free", floor: "Main Floor" },
  { id: "table-2", name: "Table 2", seats: 2, shape: "round", status: "free", floor: "Main Floor" },
  { id: "table-3", name: "Table 3", seats: 4, shape: "square", status: "free", floor: "Main Floor" },
  { id: "table-4", name: "Table 4", seats: 4, shape: "square", status: "free", floor: "Main Floor" },
  { id: "table-7", name: "Bar 1", seats: 2, shape: "rectangle", status: "free", floor: "Main Floor" },
  { id: "table-5", name: "Patio 1", seats: 6, shape: "rectangle", status: "free", floor: "Patio" },
  { id: "table-6", name: "Patio 2", seats: 2, shape: "round", status: "free", floor: "Patio" },
];

interface Props {
  activeTableId: string | null;
  setActiveTableId: (id: string) => void;
}

// Sub-component to render the graphical table + chairs
function GraphicTable({ shape, seats, isActive }: { shape: TableShape; seats: number; isActive: boolean }) {
  const tableColor = isActive 
    ? "bg-accent border-accent shadow-accent/30" 
    : "bg-panel border-border/80 shadow-black/10 group-hover:border-accent/60 group-hover:shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.3)]";
    
  const chairColor = isActive 
    ? "bg-accent/80 border-accent shadow-accent/20" 
    : "bg-border/50 border-border shadow-black/10 group-hover:bg-accent/30 group-hover:border-accent/50";

  const renderChairs = () => {
    const chairs = [];
    if (shape === "round" || shape === "square") {
       chairs.push(<div key="t" className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-t-full border-t border-x transition-colors duration-500 ${chairColor}`} />);
       chairs.push(<div key="b" className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-b-full border-b border-x transition-colors duration-500 ${chairColor}`} />);
       if (seats >= 4) {
          chairs.push(<div key="l" className={`absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-l-full border-l border-y transition-colors duration-500 ${chairColor}`} />);
          chairs.push(<div key="r" className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-r-full border-r border-y transition-colors duration-500 ${chairColor}`} />);
       }
    } else if (shape === "rectangle") {
       if (seats === 6) {
          chairs.push(<div key="t1" className={`absolute -top-3 left-1/3 -translate-x-1/2 w-8 h-3 rounded-t-full border-t border-x transition-colors duration-500 ${chairColor}`} />);
          chairs.push(<div key="t2" className={`absolute -top-3 left-2/3 -translate-x-1/2 w-8 h-3 rounded-t-full border-t border-x transition-colors duration-500 ${chairColor}`} />);
          chairs.push(<div key="b1" className={`absolute -bottom-3 left-1/3 -translate-x-1/2 w-8 h-3 rounded-b-full border-b border-x transition-colors duration-500 ${chairColor}`} />);
          chairs.push(<div key="b2" className={`absolute -bottom-3 left-2/3 -translate-x-1/2 w-8 h-3 rounded-b-full border-b border-x transition-colors duration-500 ${chairColor}`} />);
          chairs.push(<div key="l" className={`absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-l-full border-l border-y transition-colors duration-500 ${chairColor}`} />);
          chairs.push(<div key="r" className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-r-full border-r border-y transition-colors duration-500 ${chairColor}`} />);
       } else {
          chairs.push(<div key="t1" className={`absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-t-full border-t border-x transition-colors duration-500 ${chairColor}`} />);
          chairs.push(<div key="b1" className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-3 rounded-b-full border-b border-x transition-colors duration-500 ${chairColor}`} />);
       }
    }
    return chairs;
  };

  return (
    <div className={`relative flex items-center justify-center transition-all duration-500 shadow-xl ${
        shape === "round" ? "w-24 h-24 rounded-full" :
        shape === "square" ? "w-28 h-28 rounded-[2rem]" :
        "w-48 h-28 rounded-[2rem]"
      } border-[3px] ${tableColor}`}
    >
        <div className={`absolute inset-1 rounded-[inherit] border transition-colors duration-500 ${isActive ? "border-white/20 bg-white/10" : "border-ink/5 bg-ink/5 group-hover:border-accent/10"} `}></div>
        {renderChairs()}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-white/20 blur-md rounded-full pointer-events-none transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
    </div>
  );
}

export function FloorView({ activeTableId, setActiveTableId }: Props) {
  const floors = Array.from(new Set(DEFAULT_TABLES.map(t => t.floor)));

  return (
    <div className="h-full w-full p-6 md:p-10 lg:p-12 bg-bg overflow-y-auto">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-baseline justify-between mb-8 gap-4">
          <div>
             <h2 className="text-4xl font-black text-ink tracking-tight">Main Floor Plan</h2>
             <p className="text-muted mt-2 font-medium flex items-center gap-2">
                <MousePointerClick size={16} /> Select a table to open the register.
             </p>
          </div>
          <div className="flex items-center gap-6 text-sm font-bold uppercase tracking-widest bg-panel px-6 py-3 border border-border shadow-sm rounded-full">
             <div className="flex items-center gap-2 text-ink">
                <div className="w-3 h-3 rounded-full bg-border border border-border/80" /> Free
             </div>
             <div className="flex items-center gap-2 text-accent">
                <div className="w-3 h-3 rounded-full bg-accent border border-white/20 shadow-sm shadow-accent/50" /> Selected
             </div>
          </div>
        </div>
        
        {/* Render sections by Floor */}
        <div className="flex flex-col gap-12">
          {floors.map(floorName => (
            <div key={floorName} className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                 <LayoutDashboard className="text-accent" size={24} />
                 <h3 className="text-2xl font-black text-ink tracking-tight uppercase border-b-2 border-border/50 pb-1 pr-6">{floorName}</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-12 gap-y-16 mt-4">
                {DEFAULT_TABLES.filter(t => t.floor === floorName).map((table) => {
                  const isActive = activeTableId === table.id;
                  return (
                    <button
                      key={table.id}
                      onClick={() => setActiveTableId(table.id)}
                      className={`flex flex-col items-center justify-center p-8 rounded-[3rem] transition-all duration-500 group relative border-2 ${
                        isActive 
                          ? "border-accent/40 bg-accent/5 ring-[6px] ring-accent/10 shadow-[0_20px_40px_rgba(var(--color-accent-rgb),0.15)] scale-105 z-10" 
                          : "border-transparent bg-panel hover:bg-bg hover:border-accent/30 hover:ring-[6px] hover:ring-accent/5 hover:shadow-[0_20px_40px_rgba(var(--color-accent-rgb),0.1)] hover:-translate-y-2 hover:scale-[1.02] hover:z-10"
                      }`}
                    >
                      <div className="mb-10 pointer-events-none origin-bottom group-hover:scale-105 transition-transform duration-500">
                         <GraphicTable shape={table.shape} seats={table.seats} isActive={isActive} />
                      </div>

                      <div className="flex flex-col items-center pointer-events-none">
                        <span className={`text-2xl font-black tracking-tight transition-colors duration-300 ${isActive ? "text-accent" : "text-ink group-hover:text-accent/80"}`}>
                          {table.name}
                        </span>
                        
                        <div className="flex items-center gap-2 mt-2 bg-bg/50 px-3 py-1 rounded-full border border-border group-hover:border-accent/20 transition-colors">
                           <Users size={12} className="text-muted" />
                           <span className="text-xs font-bold text-muted uppercase tracking-widest">{table.seats} Seats</span>
                        </div>
                      </div>

                      {isActive && (
                         <div className="absolute top-6 right-6 ">
                           <span className="animate-pulse rounded-full bg-accent px-3 py-1 text-[10px] font-black text-white uppercase tracking-widest border border-white/20 shadow-md">
                             Active
                           </span>
                         </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
