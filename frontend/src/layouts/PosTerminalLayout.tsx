import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { FloorView } from "../pages/pos/FloorView";
import { RegisterView } from "../pages/pos/RegisterView";
import { PaymentView } from "../pages/pos/PaymentView";
import type { Product, Category, Customer, ProductVariant } from "../api/types";
import { listProducts } from "../api/products";
import { listCategories } from "../api/categories";
import { listPosConfigs } from "../api/posConfig";
import { listCustomers } from "../api/customers";
import { submitPosOrder, payDraftOrder } from "../api/posTerminal";
import { Search, X, UserRound } from "lucide-react";

export type CartItem = {
  id: string; // unique cart entry id
  product: Product;
  variant?: ProductVariant;
  quantity: number;
};

export type PosView = "FLOOR" | "REGISTER" | "PAYMENT";

// ─── Customer Picker ──────────────────────────────────────────────────────────
function CustomerPicker({
  customers,
  selectedCustomer,
  onSelect,
  onClear,
}: {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelect: (c: Customer) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
          selectedCustomer
            ? "bg-accent/10 border-accent/30 text-accent"
            : "bg-bg border-border text-muted hover:text-ink hover:border-border"
        }`}
      >
        <UserRound size={13} />
        {selectedCustomer ? selectedCustomer.name : "Guest"}
        {selectedCustomer && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              setOpen(false);
            }}
            className="ml-1 hover:text-red-500 cursor-pointer"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-border bg-panel shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-bg rounded-lg px-2 py-1.5 border border-border">
              <Search size={12} className="text-muted shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-ink placeholder-muted focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              onClick={() => { onClear(); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 text-xs text-muted hover:bg-bg transition-colors italic"
            >
              No customer (Guest)
            </button>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelect(c);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                  selectedCustomer?.id === c.id
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-ink hover:bg-bg"
                }`}
              >
                <div className="font-medium">{c.name}</div>
                {c.phone && <div className="text-muted">{c.phone}</div>}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted text-center">No customers found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── POS Terminal Layout ───────────────────────────────────────────────────────

export function PosTerminalLayout() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // Global POS Session States
  const [currentView, setCurrentView] = useState<PosView>("FLOOR");
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  // Track whether kitchen send happened (if true, look for existing draft to pay)
  const [hasSentToKitchen, setHasSentToKitchen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Loaded Data
  const [activePosConfigId, setActivePosConfigId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const posRes = await listPosConfigs(accessToken);
      const configId = posRes.posConfigs[0]?.id || null;
      setActivePosConfigId(configId);

      const [prodsRes, catsRes, custs] = await Promise.all([
        listProducts(accessToken),
        listCategories(accessToken, configId || ""),
        listCustomers(accessToken),
      ]);
      setProducts(prodsRes.products);
      setCategories(catsRes.categories);
      setCustomers(custs.customers);
    } catch (e) {
      console.error("Failed to load POS data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [accessToken]);

  // Reset session state when table changes
  useEffect(() => {
    setHasSentToKitchen(false);
  }, [activeTableId]);

  const closeRegister = () => {
    if (cartItems.length > 0) {
      if (!window.confirm("You have active items in your cart. Are you sure you want to close?")) {
        return;
      }
    }
    navigate("/");
  };

  // ── Handle Send to Kitchen ──────────────────────────────────────────────────
  const handleSendToKitchen = async () => {
    if (!activePosConfigId || !accessToken) return alert("Terminal not configured");
    try {
      await submitPosOrder(accessToken, {
        posConfigId: activePosConfigId,
        tableId: activeTableId,
        items: cartItems,
        status: "draft",
        createKitchenTicket: true,
        customerId: selectedCustomer?.id ?? null,
      });
      setHasSentToKitchen(true);
      alert("Ticket sent to Kitchen!");
    } catch (e) {
      alert("Failed to send to kitchen: " + String(e));
    }
  };

  // ── Handle Payment ──────────────────────────────────────────────────────────
  const handlePaymentSuccess = async (paymentMethod: "cash" | "digital" | "upi") => {
    if (!activePosConfigId || !accessToken) return alert("Terminal not configured");
    try {
      // STRATEGY: Always try to find & pay the existing draft order for this table first.
      // This works whether or not "Send to Kitchen" was pressed, and avoids stale UUID bugs.
      let paid = false;

      if (hasSentToKitchen) {
        try {
          await payDraftOrder(
            accessToken,
            activePosConfigId,
            activeTableId,
            paymentMethod,
            selectedCustomer?.id ?? null
          );
          paid = true;
        } catch {
          // No draft found — fall through to create fresh paid order
        }
      }

      if (!paid) {
        // No kitchen order exists — create a new paid order directly
        await submitPosOrder(accessToken, {
          posConfigId: activePosConfigId,
          tableId: activeTableId,
          items: cartItems,
          status: "paid",
          createKitchenTicket: false,
          customerId: selectedCustomer?.id ?? null,
          paymentMethod,
        });
      }

      // Reset entire session
      setCartItems([]);
      setHasSentToKitchen(false);
      setActiveTableId(null);
      setSelectedCustomer(null);
      setCurrentView("FLOOR");
    } catch (e) {
      alert("Failed to process payment: " + String(e));
    }
  };


  return (
    <div className="flex h-screen w-full flex-col bg-bg overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-panel px-6 shadow-sm z-10">
        {/* Left: view tabs */}
        <div className="flex h-full items-center gap-6">
          <span className="text-xl font-bold tracking-tight text-ink">Terminal</span>

          <div className="flex bg-bg/50 p-1 rounded-xl shadow-inner border border-border/50 items-center ml-4">
            <button
              onClick={() => setCurrentView("FLOOR")}
              className={`relative flex items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold tracking-wide transition-all ${
                currentView === "FLOOR"
                  ? "bg-panel text-accent shadow-sm pointer-events-none"
                  : "text-muted hover:text-ink cursor-pointer"
              }`}
            >
              Floor Plan
            </button>
            <button
              onClick={() => setCurrentView("REGISTER")}
              disabled={!activeTableId && currentView !== "REGISTER"}
              className={`relative flex items-center justify-center rounded-lg px-6 py-2 text-sm font-semibold tracking-wide transition-all ${
                currentView !== "FLOOR"
                  ? "bg-panel text-accent shadow-sm pointer-events-none"
                  : "text-muted hover:text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Right: customer picker + utility buttons */}
        <div className="flex items-center gap-3">
          {/* Customer picker — visible only in REGISTER view */}
          {(currentView === "REGISTER" || currentView === "PAYMENT") && (
            <CustomerPicker
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
              onClear={() => setSelectedCustomer(null)}
            />
          )}

          <button
            onClick={loadData}
            title="Reload Data"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-muted transition-colors hover:bg-panel hover:text-accent hover:shadow-[var(--shadow-artisanal)] border border-transparent hover:border-border"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>

          <Link
            to="/"
            className="flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-1.5 text-xs font-semibold text-muted transition-all hover:bg-accent hover:text-white"
          >
            Dashboard
          </Link>
          <div className="h-5 w-px bg-border mx-1" />
          <button
            onClick={closeRegister}
            className="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500 hover:text-white"
          >
            Close Session
          </button>
        </div>
      </header>

      {/* Main Working Area */}
      <main className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-muted font-medium">Loading POS Terminal...</span>
          </div>
        ) : (
          <>
            {currentView === "FLOOR" && (
              <FloorView
                activeTableId={activeTableId}
                setActiveTableId={(id) => {
                  setActiveTableId(id);
                  setCurrentView("REGISTER");
                }}
              />
            )}

            {currentView === "REGISTER" && (
              <RegisterView
                activeTableId={activeTableId}
                products={products}
                categories={categories}
                cartItems={cartItems}
                setCartItems={setCartItems}
                hasSentToKitchen={hasSentToKitchen}
                setHasSentToKitchen={setHasSentToKitchen}
                onProceedToPayment={() => setCurrentView("PAYMENT")}
                onSendToKitchen={handleSendToKitchen}
              />
            )}

            {currentView === "PAYMENT" && (
              <PaymentView
                cartItems={cartItems}
                onCancel={() => setCurrentView("REGISTER")}
                onPaymentSuccess={handlePaymentSuccess}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
