import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  fetchKitchenTickets,
  updateTicketStage,
  updateItemPrepared,
  generateMockTicket,
} from "../api/kitchen";
import type { KitchenTicket, KitchenTicketItem } from "../api/kitchen";

export const KitchenDisplayPage = () => {
  const { user, accessToken } = useAuth();
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [activeTab, setActiveTab] = useState<"All" | "to_cook" | "preparing" | "completed">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 6; // Fits nicely

  const loadTickets = async () => {
    if (!accessToken) return;
    try {
      const res = await fetchKitchenTickets(accessToken);
      setTickets(res.tickets);
      
      // Auto-populate mockup data if completely empty
      if (res.tickets.length === 0) {
        // Generate 3 mock tickets
        await Promise.all([
          generateMockTicket(accessToken, ""),
          generateMockTicket(accessToken, ""),
          generateMockTicket(accessToken, "")
        ]);
        const refreshed = await fetchKitchenTickets(accessToken);
        setTickets(refreshed.tickets);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000); 
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSendTestTicket = async () => {
    if (!accessToken) return;
    try {
      await generateMockTicket(accessToken, "");
      loadTickets();
    } catch (err: any) {
      alert("Failed: " + err.message);
    }
  };

  // Derive filters from current tickets
  const availableProducts = useMemo(() => {
    const prods = new Set<string>();
    tickets.forEach(t => t.kitchen_ticket_items.forEach(i => prods.add(i.product_name)));
    return Array.from(prods).sort();
  }, [tickets]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    tickets.forEach(t => t.kitchen_ticket_items.forEach(i => {
      const cname = i.order_lines?.products?.categories?.name;
      if (cname) cats.add(cname);
    }));
    return Array.from(cats).sort();
  }, [tickets]);

  // Apply filters
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (activeTab !== "All" && t.stage !== activeTab) return false;
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        const matchNumber = t.order_number.toLowerCase().includes(lowerQ);
        const matchProduct = t.kitchen_ticket_items.some(i => i.product_name.toLowerCase().includes(lowerQ));
        if (!matchNumber && !matchProduct) return false;
      }
      if (selectedProducts.size > 0) {
        if (!t.kitchen_ticket_items.some(i => selectedProducts.has(i.product_name))) return false;
      }
      if (selectedCategories.size > 0) {
        if (!t.kitchen_ticket_items.some(i => {
          const cname = i.order_lines?.products?.categories?.name;
          return cname && selectedCategories.has(cname);
        })) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, activeTab, searchQuery, selectedProducts, selectedCategories]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery, selectedProducts, selectedCategories]);

  const toggleProduct = (p: string) => {
    const ns = new Set(selectedProducts);
    if (ns.has(p)) ns.delete(p);
    else ns.add(p);
    setSelectedProducts(ns);
  };

  const toggleCategory = (c: string) => {
    const ns = new Set(selectedCategories);
    if (ns.has(c)) ns.delete(c);
    else ns.add(c);
    setSelectedCategories(ns);
  };

  const clearFilters = () => {
    setSelectedProducts(new Set());
    setSelectedCategories(new Set());
  };

  const handleItemClick = async (e: React.MouseEvent, tId: string, item: KitchenTicketItem) => {
    e.stopPropagation();
    if (!accessToken) return;
    try {
      setTickets(prev => prev.map(t => {
        if (t.id === tId) {
          return { ...t, kitchen_ticket_items: t.kitchen_ticket_items.map(i => i.id === item.id ? { ...i, prepared: !i.prepared } : i) };
        }
        return t;
      }));
      await updateItemPrepared(accessToken, tId, item.id, !item.prepared);
      loadTickets();
    } catch (err) {
      console.error(err);
      loadTickets();
    }
  };

  const handleCardClick = async (t: KitchenTicket) => {
    if (!accessToken) return;
    let nextStage: typeof t.stage | null = null;
    if (t.stage === "to_cook") nextStage = "preparing";
    else if (t.stage === "preparing") nextStage = "completed";
    
    if (nextStage) {
      try {
        setTickets(prev => prev.map(pt => pt.id === t.id ? { ...pt, stage: nextStage as any } : pt));
        await updateTicketStage(accessToken, t.id, nextStage);
        loadTickets();
      } catch (err) {
        console.error(err);
        loadTickets();
      }
    }
  };

  const countToCook = tickets.filter(t => t.stage === 'to_cook').length;
  const countPreparing = tickets.filter(t => t.stage === 'preparing').length;
  const countCompleted = tickets.filter(t => t.stage === 'completed').length;

  if (loading) return <div className="text-muted">Loading Kitchen Display...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[75vh]">
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
        <div className="bg-panel rounded-xl border border-border shadow-sm overflow-hidden flex flex-col p-4">
          <button 
            onClick={clearFilters}
            className="text-[var(--color-accent)] hover:text-orange-700 flex items-center justify-between w-full text-sm font-semibold mb-4 border-b border-border pb-3"
          >
            Clear Filters <span>✕</span>
          </button>
          
          <div className="flex-1 overflow-y-auto pr-1">
            {/* Categories Filter */}
            {availableCategories.length > 0 && (
              <div className="mb-6">
                <div className="text-xs uppercase tracking-widest text-muted font-bold mb-2">Categories</div>
                <div className="flex flex-col gap-1.5">
                  {availableCategories.map(c => (
                    <label key={c} className="flex items-center cursor-pointer group">
                      <input type="checkbox" className="hidden" checked={selectedCategories.has(c)} onChange={() => toggleCategory(c)} />
                      <div className={`text-sm py-1.5 px-3 rounded-lg w-full font-medium transition-colors border ${selectedCategories.has(c) ? 'bg-panel border-[var(--color-accent)] text-ink' : 'border-transparent text-muted hover:bg-panel hover:text-ink'}`}>
                        {c}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Products Filter */}
            {availableProducts.length > 0 && (
              <div>
                <div className="text-xs uppercase tracking-widest text-muted font-bold mb-2">Products</div>
                <div className="flex flex-col gap-1.5">
                  {availableProducts.map(p => (
                    <label key={p} className="flex items-center cursor-pointer group">
                      <input type="checkbox" className="hidden" checked={selectedProducts.has(p)} onChange={() => toggleProduct(p)} />
                      <div className={`text-sm py-1.5 px-3 rounded-lg w-full font-medium transition-colors border ${selectedProducts.has(p) ? 'bg-panel border-[var(--color-accent)] text-ink' : 'border-transparent text-muted hover:bg-panel hover:text-ink'}`}>
                        {p}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="bg-panel rounded-xl border border-border shadow-sm px-5 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <button 
              onClick={() => setActiveTab("All")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${activeTab === 'All' ? 'bg-[var(--color-ink)] text-white' : 'text-muted hover:bg-panel text-ink'}`}
            >
              All <span className="bg-white/20 px-1.5 rounded text-xs">{tickets.length}</span>
            </button>
            <button 
              onClick={() => setActiveTab("to_cook")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${activeTab === 'to_cook' ? 'bg-blue-600 text-white' : 'text-muted hover:bg-panel hover:text-blue-600'}`}
            >
              To Cook <span className="bg-white/20 px-1.5 rounded text-xs">{countToCook}</span>
            </button>
            <button 
              onClick={() => setActiveTab("preparing")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${activeTab === 'preparing' ? 'bg-[var(--color-accent)] text-white' : 'text-muted hover:bg-panel hover:text-[var(--color-accent)]'}`}
            >
              Preparing <span className="bg-white/20 px-1.5 rounded text-xs">{countPreparing}</span>
            </button>
            <button 
              onClick={() => setActiveTab("completed")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${activeTab === 'completed' ? 'bg-green-600 text-white' : 'text-muted hover:bg-panel hover:text-green-600'}`}
            >
              Completed <span className="bg-white/20 px-1.5 rounded text-xs">{countCompleted}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={handleSendTestTicket}
              className="bg-panel text-ink border border-border hover:bg-[var(--color-border)] px-3 py-1.5 rounded font-medium text-sm shadow-sm transition-colors flex items-center gap-2"
            >
              Send <span className="text-xs font-normal opacity-70">(Mock)</span>
            </button>

            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-bg border border-border rounded-md px-3 py-1.5 text-sm w-40 focus:outline-none focus:border-[var(--color-accent)] text-ink placeholder-[var(--color-muted)]"
              />
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted font-medium bg-bg rounded-md border border-border px-1 py-1">
              <span className="w-12 text-center text-xs">{filteredTickets.length === 0 ? '0' : `${Math.min((page - 1) * itemsPerPage + 1, filteredTickets.length)}-${Math.min(page * itemsPerPage, filteredTickets.length)}`}</span>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="hover:text-ink disabled:opacity-30 px-1.5">{'<'}</button>
              <button disabled={page >= totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)} className="hover:text-ink disabled:opacity-30 px-1.5">{'>'}</button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 w-full relative">
          {paginatedTickets.length === 0 ? (
            <div className="text-center justify-center flex items-center h-40 bg-panel border border-dashed border-border rounded-xl">
              <p className="text-muted font-medium">No tickets found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {paginatedTickets.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => handleCardClick(t)}
                  className={`bg-panel rounded-xl p-5 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all border shadow-sm flex flex-col gap-4 relative overflow-hidden
                    ${t.stage === 'to_cook' ? 'border-blue-300' : 
                      t.stage === 'preparing' ? 'border-[var(--color-accent)]' : 
                      'border-green-400 opacity-80'}`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1.5 
                    ${t.stage === 'to_cook' ? 'bg-blue-500' : t.stage === 'preparing' ? 'bg-[var(--color-accent)]' : 'bg-green-500'}`} />
                    
                  <div className="flex items-center justify-between border-b border-border pb-2 pt-1">
                    <h3 className="text-xl font-bold tracking-wide text-ink font-head">
                      #{t.order_number.replace('MOCK-', '')}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                      ${t.stage === 'to_cook' ? 'bg-blue-100 text-blue-800' : 
                        t.stage === 'preparing' ? 'bg-orange-100 text-[var(--color-accent)]' : 
                        'bg-green-100 text-green-800'}`}>
                      {t.stage.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 flex-1">
                    {t.kitchen_ticket_items.map(item => (
                      <div 
                        key={item.id} 
                        onClick={(e) => handleItemClick(e, t.id, item)}
                        className={`flex items-start text-[14px] hover:bg-bg py-1.5 px-2 -mx-2 rounded transition-colors group ${item.prepared ? 'text-muted' : 'text-ink'}`}
                      >
                        <span className={`mr-2 font-bold w-5 text-right ${item.prepared ? 'opacity-40' : 'text-[var(--color-accent)]'}`}>
                          {item.qty}
                        </span>
                        <span className="mr-2 text-muted opacity-50 font-sans">×</span>
                        <span className={`flex-1 break-words font-medium ${item.prepared ? 'line-through decoration-[var(--color-muted)] decoration-2 opacity-60' : ''}`}>
                          {item.product_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
