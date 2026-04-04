import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { FloorView } from "../pages/pos/FloorView";
import { RegisterView } from "../pages/pos/RegisterView";
import { PaymentView } from "../pages/pos/PaymentView";
import type { Product, Category } from "../api/types";
import { listProducts } from "../api/products";
import { listCategories } from "../api/categories";
import { listPosConfigs } from "../api/posConfig";
import { submitPosOrder } from "../api/posTerminal";

export type CartItem = {
  id: string; // unique cart entry id
  product: Product;
  quantity: number;
};

export type PosView = "FLOOR" | "REGISTER" | "PAYMENT";

export function PosTerminalLayout() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // Global POS Session States
  const [currentView, setCurrentView] = useState<PosView>("FLOOR");
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Loaded Data
  const [activePosConfigId, setActivePosConfigId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // We'll mock the posConfig id for now, simply taking the first one
  const loadData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const posRes = await listPosConfigs(accessToken);
      const configId = posRes.posConfigs[0]?.id || null;
      setActivePosConfigId(configId);

      const [prodsRes, catsRes] = await Promise.all([
        listProducts(accessToken),
        listCategories(accessToken, configId || "") 
      ]);
      setProducts(prodsRes.products);
      setCategories(catsRes.categories);
    } catch (e) {
      console.error("Failed to load POS data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [accessToken]);

  const closeRegister = () => {
    if (cartItems.length > 0) {
      if (!window.confirm("You have active items in your cart. Are you sure you want to close the register?")) {
        return;
      }
    }
    navigate("/");
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[var(--c-bg)] overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--c-border)] bg-[var(--c-panel)] px-4">
        {/* Left Side: Navigation Tabs */}
        <div className="flex h-full items-center gap-1">
          <div className="mr-6 font-head text-lg font-bold text-[var(--c-ink)]">
            Odoo POS Cafe
          </div>
          <button
            onClick={() => setCurrentView("FLOOR")}
            className={`flex h-full items-center px-4 font-semibold text-sm transition-colors ${
              currentView === "FLOOR"
                ? "border-b-2 border-[var(--c-accent)] text-[var(--c-accent)]"
                : "text-[var(--c-muted)] hover:text-[var(--c-ink)]"
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setCurrentView("REGISTER")}
            disabled={!activeTableId && currentView !== "REGISTER"}
            className={`flex h-full items-center px-4 font-semibold text-sm transition-colors ${
              currentView !== "FLOOR"
                ? "border-b-2 border-[var(--c-accent)] text-[var(--c-accent)]"
                : "text-[var(--c-muted)] hover:text-[var(--c-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            Register
          </button>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="rounded px-3 py-1.5 text-xs font-semibold text-[var(--c-muted)] hover:bg-[var(--c-panel-2)] hover:text-[var(--c-ink)]"
          >
             ↻ Reload Data
          </button>
          <Link
            to="/"
            className="rounded px-3 py-1.5 text-xs font-semibold text-[var(--c-muted)] hover:bg-[var(--c-panel-2)] hover:text-[var(--c-ink)]"
          >
             Go to Back-end
          </Link>
          <div className="h-4 w-px bg-[var(--c-border)] mx-1" />
          <button
            onClick={closeRegister}
            className="rounded px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10"
          >
            Close Register
          </button>
        </div>
      </header>

      {/* Main Working Area */}
      <main className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-[var(--c-muted)] font-medium">Loading POS Terminal...</span>
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
                onProceedToPayment={() => setCurrentView("PAYMENT")}
                onSendToKitchen={async () => {
                  if (!activePosConfigId || !accessToken) return alert("Terminal not configured");
                  try {
                    await submitPosOrder(accessToken, {
                      posConfigId: activePosConfigId,
                      tableId: activeTableId,
                      items: cartItems,
                      status: "draft",
                      createKitchenTicket: true
                    });
                    setCartItems([]);
                    alert("Ticket sent to Kitchen!");
                  } catch (e) {
                    alert("Failed to send to kitchen: " + String(e));
                  }
                }}
              />
            )}

            {currentView === "PAYMENT" && (
              <PaymentView 
                cartItems={cartItems}
                onCancel={() => setCurrentView("REGISTER")}
                onPaymentSuccess={async () => {
                  if (!activePosConfigId || !accessToken) return alert("Terminal not configured");
                  try {
                    await submitPosOrder(accessToken, {
                      posConfigId: activePosConfigId,
                      tableId: activeTableId,
                      items: cartItems,
                      status: "paid",
                      createKitchenTicket: true // optionally still send to kitchen if paid immediately
                    });
                    setCartItems([]);
                    setActiveTableId(null);
                    setCurrentView("FLOOR");
                  } catch (e) {
                    alert("Failed to process payment: " + String(e));
                  }
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
