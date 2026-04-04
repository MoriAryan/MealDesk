import { useState, useMemo } from "react";
import type { CartItem } from "../../layouts/PosTerminalLayout";

interface Props {
  cartItems: CartItem[];
  onCancel: () => void;
  onPaymentSuccess: () => void;
}

export function PaymentView({ cartItems, onCancel, onPaymentSuccess }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "digital" | "upi">("cash");

  const total = useMemo(() => {
    let sub = 0;
    cartItems.forEach(item => {
      const lineSub = Number(item.product.price) * item.quantity;
      const rate = item.product.tax_rates?.rate ? Number(item.product.tax_rates.rate) : 0;
      sub += lineSub + (lineSub * (rate / 100));
    });
    return sub;
  }, [cartItems]);

  return (
    <div className="flex h-full w-full bg-[var(--c-bg)] p-8 justify-center items-center overflow-y-auto">
      <div className="w-full max-w-4xl bg-[var(--c-panel)] rounded-2xl border border-[var(--c-border)] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
         
         {/* Left Side: Methods */}
         <div className="w-full md:w-1/3 border-r border-[var(--c-border)] bg-[var(--c-panel-2)] p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--c-muted)] mb-6">Payment Method</h3>
            <div className="flex flex-col gap-3">
               <button 
                 onClick={() => setSelectedMethod("cash")}
                 className={`py-4 px-4 rounded-xl font-bold text-lg text-left transition-all ${
                   selectedMethod === "cash" 
                     ? "bg-[var(--c-accent)] text-white shadow-md scale-105" 
                     : "bg-white text-[var(--c-ink)] border border-[var(--c-border)] hover:border-[var(--c-accent)]"
                 }`}
               >
                 💵 Cash
               </button>
               <button 
                 onClick={() => setSelectedMethod("digital")}
                 className={`py-4 px-4 rounded-xl font-bold text-lg text-left transition-all ${
                   selectedMethod === "digital" 
                     ? "bg-[var(--c-accent)] text-white shadow-md scale-105" 
                     : "bg-white text-[var(--c-ink)] border border-[var(--c-border)] hover:border-[var(--c-accent)]"
                 }`}
               >
                 💳 Digital / Card
               </button>
               <button 
                 onClick={() => setSelectedMethod("upi")}
                 className={`py-4 px-4 rounded-xl font-bold text-lg text-left transition-all ${
                   selectedMethod === "upi" 
                     ? "bg-[var(--c-accent)] text-white shadow-md scale-105" 
                     : "bg-white text-[var(--c-ink)] border border-[var(--c-border)] hover:border-[var(--c-accent)]"
                 }`}
               >
                 📱 UPI QR
               </button>
            </div>
         </div>

         {/* Right Side: Total & Confirmation */}
         <div className="flex-1 flex flex-col p-8">
            <h2 className="text-2xl font-bold text-[var(--c-ink)] mb-8 text-center">Complete Checkout</h2>
            
            <div className="bg-[var(--c-panel-2)] p-8 rounded-2xl mb-auto text-center border border-[var(--c-border)] shadow-inner">
               <p className="text-[var(--c-muted)] text-sm font-bold uppercase tracking-widest mb-2">Total Due</p>
               <p className="text-6xl font-black text-[var(--c-ink)] tracking-tight">${total.toFixed(2)}</p>
            </div>

            {/* Dynamic Content based on Method */}
            {selectedMethod === "upi" ? (
               <div className="flex flex-col items-center justify-center my-6">
                  <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 mb-4 inline-block">
                     {/* Dummy SVG QR Code */}
                     <svg width="150" height="150" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                       <rect width="100" height="100" fill="white"/>
                       <rect width="40" height="40" x="5" y="5" fill="black"/>
                       <rect width="20" height="20" x="15" y="15" fill="white"/>
                       <rect width="40" height="40" x="55" y="5" fill="black"/>
                       <rect width="20" height="20" x="65" y="15" fill="white"/>
                       <rect width="40" height="40" x="5" y="55" fill="black"/>
                       <rect width="20" height="20" x="15" y="65" fill="white"/>
                       <path d="M55,55 h10 v10 h-10 z M75,55 h20 v20 h-20 z M65,75 h30 v20 h-30 z" fill="black"/>
                     </svg>
                  </div>
                  <p className="text-lg font-bold text-[var(--c-ink)]">Scan to Pay via UPI</p>
                  <p className="text-sm text-[var(--c-muted)]">Terminal ID: merchant@ybl</p>
               </div>
            ) : (
               <div className="my-10 text-center text-[var(--c-muted)]">
                  <p className="text-lg">Awaiting validation for {selectedMethod} payment...</p>
               </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
               <button 
                 onClick={onCancel}
                 className="w-1/3 py-4 px-4 rounded-xl border-2 border-[var(--c-border)] hover:bg-[var(--c-panel-2)] text-[var(--c-ink)] font-bold text-lg transition-colors active:scale-95"
               >
                 Go Back
               </button>
               <button 
                 onClick={onPaymentSuccess}
                 className="flex-1 py-4 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-xl tracking-wider uppercase transition-all shadow-md shadow-green-500/20 active:scale-95"
               >
                 {selectedMethod === "upi" ? "Confirm QR Scanned" : "Validate Payment"}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
