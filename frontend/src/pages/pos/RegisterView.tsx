import { useMemo, useState } from "react";
import type { Product, Category } from "../../api/types";
import type { CartItem } from "../../layouts/PosTerminalLayout";

interface Props {
  activeTableId: string | null;
  products: Product[];
  categories: Category[];
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onProceedToPayment: () => void;
  onSendToKitchen: () => void;
  hasSentToKitchen: boolean;
  setHasSentToKitchen: (val: boolean) => void;
}

export function RegisterView({ 
  activeTableId, 
  products, 
  categories, 
  cartItems, 
  setCartItems, 
  onProceedToPayment,
  onSendToKitchen,
  hasSentToKitchen,
  setHasSentToKitchen
}: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | "ALL">("ALL");

  const filteredProducts = useMemo(() => {
    // Only show active products
    let prods = products.filter(p => p.active);
    if (activeCategoryId !== "ALL") {
      prods = prods.filter(p => p.category_id === activeCategoryId);
    }
    return prods;
  }, [products, activeCategoryId]);

  const addToCart = (product: Product) => {
    setHasSentToKitchen(false);
    setCartItems(prev => {
       const existing = prev.find(item => item.product.id === product.id);
       if (existing) {
         return prev.map(item => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item);
       }
       return [...prev, { id: crypto.randomUUID(), product, quantity: 1 }];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setHasSentToKitchen(false);
    setCartItems(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const { subtotal, taxTotal, total } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    cartItems.forEach(item => {
      const lineSub = Number(item.product.price) * item.quantity;
      const rate = item.product.tax_rates?.rate ? Number(item.product.tax_rates.rate) : 0;
      sub += lineSub;
      tax += lineSub * (rate / 100);
    });
    return { subtotal: sub, taxTotal: tax, total: sub + tax };
  }, [cartItems]);

  return (
    <div className="flex h-full w-full">
      {/* Left Menu (Products) */}
      <div className="flex-1 bg-[var(--c-bg)] flex flex-col border-r border-[var(--c-border)] relative">
         {/* Categories Bar */}
         <div className="flex bg-[var(--c-panel)] p-4 border-b border-[var(--c-border)] gap-2 overflow-x-auto shrink-0 shadow-sm z-10">
            <button 
              onClick={() => setActiveCategoryId("ALL")}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-sm transition-all ${
                activeCategoryId === "ALL" 
                  ? "bg-[var(--c-ink)] text-white shadow-md transform scale-105" 
                  : "bg-[var(--c-panel-2)] text-[var(--c-muted)] hover:bg-[var(--c-border)]"
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`whitespace-nowrap px-6 py-2 rounded-full font-bold text-sm transition-all border ${
                  activeCategoryId === cat.id 
                    ? "text-white shadow-md transform scale-105" 
                    : "bg-[var(--c-panel-2)] hover:bg-[var(--c-border)]"
                }`}
                style={{
                  backgroundColor: activeCategoryId === cat.id ? cat.color : undefined,
                  borderColor: activeCategoryId === cat.id ? cat.color : `${cat.color}40`,
                  color: activeCategoryId !== cat.id ? cat.color : undefined
                }}
              >
                {cat.name}
              </button>
            ))}
         </div>

         {/* Product Grid */}
         <div className="flex-1 overflow-y-auto p-6 bg-[var(--c-panel-2)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
               {filteredProducts.map(product => {
                  const cat = categories.find(c => c.id === product.category_id);
                  const color = cat?.color || "var(--c-accent)";
                  return (
                    <button 
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="flex flex-col text-left aspect-square bg-white rounded-xl shadow-sm border border-[var(--c-border)] overflow-hidden hover:shadow-md hover:border-gray-400 transition-all active:scale-95 group relative"
                    >
                      {/* Product Image Placeholder / Color Banner */}
                      <div className="h-[45%] w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: `${color}15` }}>
                         <div className="absolute inset-0 opacity-20 bg-gradient-to-t from-black/20 to-transparent" />
                         <span className="text-3xl font-black opacity-40 mix-blend-overlay uppercase overflow-hidden whitespace-nowrap text-ellipsis max-w-[90%] pointer-events-none" style={{ color }}>
                           {product.name.substring(0, 3)}
                         </span>
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 p-3 flex flex-col justify-between w-full h-full">
                        <span className="font-bold text-[var(--c-ink)] leading-snug break-words line-clamp-2">
                           {product.name}
                        </span>
                        <div className="flex justify-between items-end mt-1 w-full">
                           <span className="font-black text-lg text-[var(--c-ink)] group-hover:text-[var(--c-accent)] transition-colors">
                             ${Number(product.price).toFixed(2)}
                           </span>
                           {cat && (
                             <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                           )}
                        </div>
                      </div>
                    </button>
                  );
               })}
            </div>
            {filteredProducts.length === 0 && (
               <div className="flex w-full h-full items-center justify-center p-12 text-center text-[var(--c-muted)]">
                 No products available. Add products safely from the Backend settings!
               </div>
            )}
         </div>
      </div>

      {/* Right Cart (Order Lines) */}
      <div className="w-[420px] flex shrink-0 flex-col bg-white border-l border-[var(--c-border)] shadow-xl z-20">
        <div className="p-4 border-b border-[var(--c-border)] bg-[var(--c-panel)] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-[var(--c-ink)] tracking-tight">Current Order</h3>
            <p className="text-sm font-semibold text-[var(--c-accent)] mt-0.5 uppercase tracking-wider">
               {activeTableId ? `${activeTableId.replace('-', ' ')}` : "Takeaway"}
            </p>
          </div>
          <button 
            onClick={() => setCartItems([])} 
            disabled={cartItems.length === 0}
            className="text-xs font-bold text-[var(--c-muted)] hover:text-red-500 disabled:opacity-30 disabled:hover:text-[var(--c-muted)] transition-colors"
          >
            Clear All
          </button>
        </div>
        
        <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50/50">
          {cartItems.map(item => (
             <div key={item.id} className="flex flex-col bg-white border border-[var(--c-border)] rounded-lg p-3 shadow-sm hover:border-[var(--c-accent)] transition-colors">
                <div className="flex justify-between items-start mb-2">
                   <div className="font-bold text-[var(--c-ink)] text-base pr-2">{item.product.name}</div>
                   <div className="font-bold text-[var(--c-ink)] whitespace-nowrap">
                     ${(Number(item.product.price) * item.quantity).toFixed(2)}
                   </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-[var(--c-muted)]">${Number(item.product.price).toFixed(2)} / {item.product.uom}</span>
                   
                   <div className="flex items-center gap-3 bg-[var(--c-panel-2)] rounded-full p-1 border border-[var(--c-border)]">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 text-[var(--c-ink)] font-bold text-lg leading-none select-none"
                      >
                        -
                      </button>
                      <span className="font-bold w-4 text-center select-none">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 text-[var(--c-accent)] font-bold text-lg leading-none select-none"
                      >
                        +
                      </button>
                   </div>
                </div>
             </div>
          ))}

          {cartItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[var(--c-muted)]">
               <div className="text-4xl mb-3 opacity-20">🛒</div>
               <p className="font-medium">The cart is empty.</p>
               <p className="text-sm mt-1">Select a product from the left to start processing.</p>
            </div>
          )}
        </div>

        {/* Cart Totals & Checkout Actions */}
        <div className="p-5 border-t-2 border-[var(--c-border)] bg-gray-50">
          <div className="flex flex-col gap-1.5 mb-5 text-sm font-semibold text-[var(--c-muted)]">
             <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
                <span>Taxes</span>
                <span>${taxTotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center pt-3 border-t border-[var(--c-border)] mt-2">
                <span className="text-base text-[var(--c-ink)] font-bold uppercase tracking-wider">Total</span>
                <span className="text-4xl text-[var(--c-ink)] font-black tracking-tight">${total.toFixed(2)}</span>
             </div>
          </div>
          
          <div className="flex gap-3">
            {!hasSentToKitchen && (
              <button 
                disabled={cartItems.length === 0}
                onClick={onSendToKitchen}
                className="w-1/3 py-4 px-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-1"
              >
                Kitchen
              </button>
            )}
            <button 
              disabled={cartItems.length === 0}
              onClick={onProceedToPayment}
              className={`${hasSentToKitchen ? 'w-full' : 'w-2/3'} flex items-center justify-center gap-2 py-4 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-lg tracking-wider uppercase transition-all shadow-md shadow-green-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:active:scale-100`}
            >
              Pay Now <span className="text-xl">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
