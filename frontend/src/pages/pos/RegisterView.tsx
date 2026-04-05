import { useMemo, useState } from "react";
import type { Product, Category } from "../../api/types";
import type { CartItem } from "../../layouts/PosTerminalLayout";
import { Trash2, Plus, Minus, ChefHat, CreditCard, ShoppingBag } from "lucide-react";

const getDummyImage = (id: string, name: string) => {
  // Picsum guarantees rendering and generates a unique image per product seed
  const seed = encodeURIComponent((id + name).replace(/\s+/g, '')).substring(0, 20);
  return `https://picsum.photos/seed/${seed}/400/400`;
};

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
    <div className="flex h-full w-full bg-bg overflow-hidden relative">
      {/* Left Menu (Products) */}
      <div className="flex-1 flex flex-col relative pr-2 min-w-0 overflow-hidden">
         {/* Categories Bar */}
         <div className="flex bg-bg pt-6 pb-4 px-6 gap-3 overflow-x-auto shrink-0 z-10 custom-scrollbar-hide items-center">
            <button 
              onClick={() => setActiveCategoryId("ALL")}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                activeCategoryId === "ALL" 
                  ? "bg-ink text-panel shadow-sm" 
                  : "bg-panel text-muted hover:text-ink border border-border/60 hover:border-border"
              }`}
            >
              All Items
            </button>
            <div className="h-6 w-px bg-border/80 mx-1 shrink-0" />
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-all focus:outline-none border ${
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
         <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-8">
               {filteredProducts.map(product => {
                  const cat = categories.find(c => c.id === product.category_id);
                  const color = cat?.color || '#cbd5e1';
                  return (
                    <button 
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="flex flex-col text-left h-[300px] bg-panel rounded-[24px] shadow-[var(--shadow-artisanal)] border border-border/60 overflow-hidden hover:border-accent/50 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 active:scale-[0.97] group focus:outline-none focus:ring-2 focus:ring-accent relative"
                    >
                      {/* Massive Breathing Room for Image */}
                      <div 
                        className="flex-1 w-full flex flex-col items-center justify-center p-8 relative overflow-hidden"
                        style={{ background: `linear-gradient(145deg, ${color}33, ${color}11)` }}
                      >
                         {/* ---> INSERT IMAGE LINK HERE <--- */}
                         {/* Remove the dummy string and uncomment product.image_url when your API returns images */}
                         <img 
                           src={/* product.image_url || */ getDummyImage(product.id, product.name)}
                           alt={product.name}
                           className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                         />
                         
                         {/* Fallback Letter if image doesn't load or is mostly transparent */}
                         <span className="text-[120px] opacity-15 font-black tracking-tighter mix-blend-multiply leading-none relative z-0 transition-transform duration-500 ease-out group-hover:scale-110" style={{ color }}>
                           {product.name.charAt(0).toUpperCase()}
                         </span>
                         
                         {cat && (
                            <div 
                              className="absolute top-4 left-4 px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-widest uppercase shadow-sm z-10"
                              style={{ backgroundColor: `${color}EE`, color: '#fff', borderColor: `${color}40` }}
                            >
                              {cat.name}
                            </div>
                         )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex shrink-0 p-5 flex-col justify-between w-full bg-panel z-10 border-t border-border/50">
                        <span className="font-bold text-ink leading-tight line-clamp-2 group-hover:text-accent transition-colors text-[16px]">
                           {product.name}
                        </span>
                        <div className="flex items-center justify-between w-full mt-2">
                           <span className="font-black text-[18px] text-ink drop-shadow-sm">
                             ${Number(product.price).toFixed(2)}
                           </span>
                           {product.product_variants && product.product_variants.length > 0 && (
                             <span className="text-[9px] font-bold text-ink bg-bg px-2 py-1.5 rounded-lg uppercase tracking-widest border border-border/80 shadow-sm shrink-0">
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
      <div className="w-[400px] xl:w-[440px] flex shrink-0 flex-col bg-panel border-l border-border shadow-[var(--shadow-artisanal)] z-20 h-full">
        <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between bg-panel/50 backdrop-blur-sm">
          <div>
            <h3 className="font-bold text-xl text-ink tracking-tight">Active Order</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${activeTableId ? 'bg-accent/10 text-accent' : 'bg-muted/10 text-muted'}`}>
                {activeTableId ? activeTableId.replace('-', ' ') : 'Takeaway'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setCartItems([])} 
            disabled={cartItems.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted transition-colors"
          >
            <Trash2 size={14} />
            Discard
          </button>
        </div>
        
        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3 custom-scrollbar bg-bg/20">
          {cartItems.map(item => (
             <div key={item.id} className="flex flex-col bg-panel border border-border/80 rounded-xl p-4 shadow-sm hover:border-accent/40 transition-colors group">
                <div className="flex gap-3 justify-between items-start mb-3">
                   <div className="flex flex-col pr-2">
                     <div className="font-semibold text-ink text-sm leading-tight line-clamp-2">{item.product.name}</div>
                     {item.variant && (
                        <span className="text-muted text-[10px] uppercase font-bold tracking-widest mt-0.5">
                          {item.variant.attribute_name}: <span className="text-accent">{item.variant.value}</span>
                        </span>
                     )}
                   </div>
                   <div className="font-bold text-ink whitespace-nowrap text-base">
                     ${((Number(item.product.price) + (item.variant ? Number(item.variant.extra_price) : 0)) * item.quantity).toFixed(2)}
                   </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-muted/80 text-xs font-medium">
                     ${(Number(item.product.price) + (item.variant ? Number(item.variant.extra_price) : 0)).toFixed(2)}
                   </span>
                   
                   <div className="flex items-center gap-1 bg-bg/80 rounded-lg p-1 border border-border/50">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-panel shadow-sm hover:bg-border/50 text-muted transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                      </button>
                      <span className="font-bold w-6 text-center select-none text-ink">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-panel shadow-sm hover:bg-border/50 text-ink transition-colors"
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
        <div className="p-6 border-t border-border bg-panel">
          <div className="flex flex-col gap-2 mb-6 text-sm font-medium text-muted">
             <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-ink">${subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
                <span>Tax</span>
                <span className="text-ink">${taxTotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-end pt-4 border-t border-border/60 mt-2">
                <span className="text-sm font-bold uppercase tracking-widest text-ink">Total</span>
                <span className="text-4xl text-ink font-black tracking-tighter">${total.toFixed(2)}</span>
             </div>
          </div>
          
          <div className="flex gap-3">
            {!hasSentToKitchen && (
              <button 
                disabled={cartItems.length === 0}
                onClick={onSendToKitchen}
                className="w-24 shrink-0 flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-ink hover:bg-ink/90 text-panel font-semibold text-[10px] tracking-widest uppercase transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:active:scale-100 disabled:shadow-none"
              >
                <ChefHat size={20} />
                <span>Kitchen</span>
              </button>
            )}
            <button 
              disabled={cartItems.length === 0}
              onClick={onProceedToPayment}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold text-sm tracking-widest uppercase transition-all shadow-lg shadow-accent/20 active:scale-97 disabled:opacity-40 disabled:shadow-none disabled:active:scale-100`}
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
