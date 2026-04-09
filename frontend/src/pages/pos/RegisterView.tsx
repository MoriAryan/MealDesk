import { useMemo, useState } from "react";
import type { Product, Category } from "../../api/types";
import type { CartItem } from "../../layouts/PosTerminalLayout";
import { Trash2, Plus, Minus, ChefHat, CreditCard, ShoppingBag } from "lucide-react";

interface Props {
  activeTableId: string | null;
  activeTableLabel?: string;
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
  activeTableLabel,
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    let prods = products.filter(p => p.active);
    if (activeCategoryId !== "ALL") {
      prods = prods.filter(p => p.category_id === activeCategoryId);
    }
    return prods;
  }, [products, activeCategoryId]);

  const handleProductClick = (product: Product) => {
    if (product.product_variants && product.product_variants.length > 0) {
      setSelectedProduct(product);
    } else {
      addToCart(product);
    }
  };

  const addToCart = (product: Product, variant?: import("../../api/types").ProductVariant) => {
    setHasSentToKitchen(false);
    setSelectedProduct(null);
    setCartItems(prev => {
       const existing = prev.find(item => item.product.id === product.id && item.variant?.id === variant?.id);
       if (existing) {
         return prev.map(item => item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item);
       }
       return [...prev, { id: crypto.randomUUID(), product, variant, quantity: 1 }];
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
      const basePrice = Number(item.product.price) + (item.variant ? Number(item.variant.extra_price) : 0);
      const lineSub = basePrice * item.quantity;
      const rate = item.product.tax_rates?.rate ? Number(item.product.tax_rates.rate) : 0;
      sub += lineSub;
      tax += lineSub * (rate / 100);
    });
    return { subtotal: sub, taxTotal: tax, total: sub + tax };
  }, [cartItems]);

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-bg">
      {/* Left Menu (Products) */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden pr-2">
         {/* Categories Bar */}
         <div className="z-10 flex shrink-0 items-center gap-2 overflow-x-auto bg-bg px-5 pb-3 pt-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <button 
              onClick={() => setActiveCategoryId("ALL")}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold text-xs transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                activeCategoryId === "ALL" 
                  ? "bg-ink text-panel shadow-sm" 
                  : "bg-panel text-muted hover:text-ink border border-border/60 hover:border-border"
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full font-semibold text-xs transition-all focus:outline-none border ${
                  activeCategoryId === cat.id 
                    ? "bg-accent text-white border-accent shadow-sm" 
                    : "bg-panel text-muted hover:text-ink border-border/60 hover:border-border"
                }`}
              >
                {cat.name}
              </button>
            ))}
         </div>

         {/* Product Grid */}
        <div className="min-w-0 flex-1 overflow-y-auto px-5 pb-8 custom-scrollbar">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
               {filteredProducts.map(product => {
                  const cat = categories.find(c => c.id === product.category_id);
                  const color = cat?.color || '#cbd5e1';
                  return (
                    <button 
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="group relative flex h-[208px] flex-col overflow-hidden rounded-2xl border border-border/60 bg-panel text-left shadow-sm transition-all duration-200 hover:border-accent/45 hover:shadow-[var(--shadow-artisanal)] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <div 
                        className="relative flex w-full flex-1 items-center justify-center overflow-hidden"
                        style={{ background: `linear-gradient(145deg, ${color}33, ${color}11)` }}
                      >
                         {product.image_url ? (
                           <img
                             src={product.image_url}
                             alt={product.name}
                             className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                           />
                         ) : (
                           <div className="absolute inset-0 bg-gradient-to-br from-panel via-bg/80 to-border/40" />
                         )}
                         
                         {/* Fallback Letter if image doesn't load or is mostly transparent */}
                         <span className="relative z-0 text-[72px] font-black leading-none tracking-tighter opacity-15 mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-105" style={{ color }}>
                           {product.name.charAt(0).toUpperCase()}
                         </span>
                         
                         {cat && (
                            <div 
                              className="absolute left-3 top-3 z-10 rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-widest shadow-sm"
                              style={{ backgroundColor: `${color}EE`, color: '#fff', borderColor: `${color}40` }}
                            >
                              {cat.name}
                            </div>
                         )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="z-10 flex w-full shrink-0 flex-col justify-between border-t border-border/50 bg-panel p-3.5">
                        <span className="line-clamp-2 text-[14px] font-semibold leading-tight text-ink transition-colors group-hover:text-accent">
                           {product.name}
                        </span>
                        <div className="mt-2 flex w-full items-center justify-between">
                           <span className="text-[15px] font-bold text-ink">
                             ${Number(product.price).toFixed(2)}
                           </span>
                           {product.product_variants && product.product_variants.length > 0 && (
                             <span className="shrink-0 rounded-full border border-border/80 bg-bg px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-muted">
                               Variants
                             </span>
                           )}
                        </div>
                      </div>
                    </button>
                  );
               })}
            </div>
            {filteredProducts.length === 0 && (
               <div className="flex w-full h-full flex-col items-center justify-center p-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-border/40 mb-4">
                     <ShoppingBag size={24} className="text-muted" />
                  </div>
                 <p className="text-lg font-semibold text-ink">No products found</p>
                 <p className="text-sm text-muted mt-1">Change your category filter or add products securely.</p>
               </div>
            )}
         </div>
      </div>

      {/* Right Cart (Order Lines) */}
      <div className="z-20 flex h-full w-[410px] shrink-0 flex-col border-l border-border bg-panel 2xl:w-[450px]">
        <div className="flex items-center justify-between border-b border-border/60 bg-panel px-5 py-4">
          <div>
            <h3 className="font-bold text-lg text-ink tracking-tight">Active Order</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest ${activeTableId ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted'}`}>
                {activeTableLabel || (activeTableId ? activeTableId.replace('-', ' ') : 'Takeaway')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setCartItems([])} 
            disabled={cartItems.length === 0}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
          >
            <Trash2 size={14} />
            Discard
          </button>
        </div>
        
          <div className="flex-1 space-y-2.5 overflow-y-auto bg-bg/20 px-4 py-3 custom-scrollbar">
          {cartItems.map(item => (
             <div key={item.id} className="group flex flex-col rounded-xl border border-border/80 bg-panel p-3 transition-colors hover:border-accent/35">
                <div className="mb-2.5 flex items-start justify-between gap-3">
                   <div className="flex flex-col pr-2">
                  <div className="line-clamp-2 text-sm font-semibold leading-tight text-ink">{item.product.name}</div>
                     {item.variant && (
                        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted">
                          {item.variant.attribute_name}: <span className="text-accent">{item.variant.value}</span>
                        </span>
                     )}
                   </div>
                   <div className="whitespace-nowrap text-sm font-bold text-ink">
                     ${((Number(item.product.price) + (item.variant ? Number(item.variant.extra_price) : 0)) * item.quantity).toFixed(2)}
                   </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-[11px] font-medium text-muted/80">
                     ${(Number(item.product.price) + (item.variant ? Number(item.variant.extra_price) : 0)).toFixed(2)}
                   </span>
                   
                   <div className="flex items-center gap-1 rounded-md border border-border/50 bg-bg/80 p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded bg-panel text-muted transition-colors hover:bg-border/50"
                      >
                        {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                      </button>
                      <span className="w-6 select-none text-center font-bold text-ink">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded bg-panel text-ink transition-colors hover:bg-border/50"
                      >
                        <Plus size={14} />
                      </button>
                   </div>
                </div>
             </div>
          ))}

          {cartItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
               <div className="flex h-20 w-20 items-center justify-center rounded-full bg-bg mb-4 border border-border/40 shadow-inner">
                 <ShoppingBag size={28} className="text-muted opacity-50" />
               </div>
               <p className="font-medium text-ink">Your cart is empty</p>
               <p className="text-sm text-muted mt-1 max-w-[200px]">Select items from the catalog to begin.</p>
            </div>
          )}
        </div>

        {/* Cart Totals & Checkout Actions */}
        <div className="border-t border-border bg-panel p-5">
          <div className="mb-5 flex flex-col gap-2 text-sm font-medium text-muted">
             <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-ink">${subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
                <span>Tax</span>
                <span className="text-ink">${taxTotal.toFixed(2)}</span>
             </div>
             <div className="mt-2 flex items-end justify-between border-t border-border/60 pt-4">
                <span className="text-sm font-bold uppercase tracking-widest text-ink">Total</span>
                <span className="text-3xl font-black tracking-tight text-ink">${total.toFixed(2)}</span>
             </div>
          </div>
          
          <div className="flex gap-2.5">
            {!hasSentToKitchen && (
              <button 
                disabled={cartItems.length === 0}
                onClick={onSendToKitchen}
                className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-ink py-3 text-[10px] font-semibold uppercase tracking-widest text-panel transition-all hover:bg-ink/90 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
              >
                <ChefHat size={20} />
                <span>Kitchen</span>
              </button>
            )}
            <button 
              disabled={cartItems.length === 0}
              onClick={onProceedToPayment}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              <CreditCard size={18} />
              <span>Checkout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Variant Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="bg-panel w-full max-w-md rounded-3xl shadow-2xl border border-border/80 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-border/80 flex justify-between items-center bg-bg/50">
              <div>
                <h3 className="font-bold text-xl text-ink">Select Variant</h3>
                <p className="text-sm text-muted">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="h-8 w-8 flex items-center justify-center rounded-full bg-border/50 text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex flex-col gap-3">
                {selectedProduct.product_variants?.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => addToCart(selectedProduct, variant)}
                    className="flex justify-between items-center p-4 rounded-xl border border-border bg-bg/30 hover:border-accent hover:bg-accent/5 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent group"
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-ink group-hover:text-accent">{variant.value}</span>
                      <span className="text-xs font-medium text-muted">{variant.attribute_name}</span>
                    </div>
                    {Number(variant.extra_price) !== 0 && (
                      <span className="font-bold text-sm bg-panel border-border border px-2 py-1 rounded-lg text-ink">
                        {Number(variant.extra_price) > 0 ? '+' : ''}${Number(variant.extra_price).toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
