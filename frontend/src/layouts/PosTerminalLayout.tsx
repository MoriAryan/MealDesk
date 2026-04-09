import { useCallback, useEffect, useState } from "react";
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
import { listPaymentMethods } from "../api/paymentMethods";
import { listFloors } from "../api/floors";
import { listTables } from "../api/tables";
import { Search, X, UserRound } from "lucide-react";
import type { DiningTable, Floor, PaymentMethod } from "../api/types";

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
        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
          selectedCustomer
            ? "border-accent/30 bg-accent/10 text-accent"
            : "border-border bg-bg text-muted hover:border-accent/40 hover:text-ink"
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
        <div className="absolute top-full left-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-panel shadow-xl">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2">
              <Search size={12} className="text-muted shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none"
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
  const [activePosSessionId, setActivePosSessionId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getDefaultTableId = (floorList: Floor[], tableList: DiningTable[]) => {
    const mainFloor = floorList.find((floor) => /main/i.test(floor.name)) || floorList[0] || null;
    const mainCounter = tableList.find((table) => /counter|main/i.test(table.table_number));
    const defaultTable = mainCounter || (mainFloor ? tableList.find((table) => table.floor_id === mainFloor.id) : null) || tableList[0] || null;
    return defaultTable?.id ?? null;
  };

  const loadData = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const posRes = await listPosConfigs(accessToken);
      const firstConfig = posRes.posConfigs[0] || null;
      const configId = firstConfig?.id || null;
      setActivePosConfigId(configId);
      const sessionId = firstConfig?.pos_sessions?.find((session) => session.status === "active")?.id || null;
      setActivePosSessionId(sessionId);

      const [prodsRes, catsRes, custs] = await Promise.all([
        listProducts(accessToken),
        listCategories(accessToken, configId || ""),
        listCustomers(accessToken),
      ]);
      setProducts(prodsRes.products);
      setCategories(catsRes.categories);
      setCustomers(custs.customers);

      if (configId) {
        const [floorsRes, tablesRes, paymentRes] = await Promise.all([
          listFloors(accessToken, configId),
          listTables(accessToken, { posConfigId: configId, active: true }),
          listPaymentMethods(accessToken, configId),
        ]);
        setFloors(floorsRes.floors);
        setTables(tablesRes.tables);
        setPaymentMethods(paymentRes.paymentMethods);
        setActiveTableId((current) => current ?? getDefaultTableId(floorsRes.floors, tablesRes.tables));
      } else {
        setFloors([]);
        setTables([]);
        setPaymentMethods([]);
        setActivePosSessionId(null);
      }
    } catch (e) {
      console.error("Failed to load POS data", e);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, setActiveTableId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Reset session state when table changes
  useEffect(() => {
    setHasSentToKitchen(false);
  }, [activeTableId]);

  const activeTable = activeTableId ? tables.find((table) => table.id === activeTableId) || null : null;
  const activeTableLabel = activeTable ? `Main Counter · Table ${activeTable.table_number}` : "Main Counter";

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
    if (!activePosConfigId || !activePosSessionId || !accessToken) return alert("Terminal not configured");
    try {
      await submitPosOrder(accessToken, {
        posConfigId: activePosConfigId,
        posSessionId: activePosSessionId,
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
    if (!activePosConfigId || !activePosSessionId || !accessToken) return alert("Terminal not configured");
    try {
      // STRATEGY: Always try to find & pay the existing draft order for this table first.
      // This works whether or not "Send to Kitchen" was pressed, and avoids stale UUID bugs.
      let paid = false;

      if (hasSentToKitchen) {
        try {
          await payDraftOrder(
            accessToken,
            activePosConfigId,
            activePosSessionId,
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
          posSessionId: activePosSessionId,
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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-bg">
      {/* Top Navigation Bar */}
      <header className="z-10 flex h-[68px] shrink-0 items-center justify-between border-b border-border bg-panel px-4 md:px-6">
        {/* Left: view tabs */}
        <div className="flex h-full items-center gap-4 md:gap-6">
          <span className="text-2xl font-bold tracking-tight text-ink">Terminal</span>

          <div className="flex h-full items-center gap-1 ml-0 md:ml-2">
            <button
              onClick={() => setCurrentView("FLOOR")}
              className={`flex h-full items-center justify-center border-b-2 px-4 text-sm font-semibold tracking-wide transition-colors md:px-6 ${
                currentView === "FLOOR"
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:border-border hover:text-ink"
              }`}
            >
              Floor Plan
            </button>
            <button
              onClick={() => setCurrentView("REGISTER")}
              disabled={!activeTableId && currentView !== "REGISTER"}
              className={`flex h-full items-center justify-center border-b-2 px-4 text-sm font-semibold tracking-wide transition-colors md:px-6 ${
                currentView !== "FLOOR"
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:border-border hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Right: customer picker + utility buttons */}
        <div className="flex items-center gap-2 md:gap-3">
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
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-bg text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>

          <Link
            to="/"
            className="hidden items-center gap-2 rounded-md border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-accent/40 hover:text-accent sm:flex"
          >
            Dashboard
          </Link>
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <button
            onClick={closeRegister}
            className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/20"
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
                floors={floors}
                tables={tables}
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
                activeTableLabel={activeTableLabel}
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
                paymentMethods={paymentMethods}
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
