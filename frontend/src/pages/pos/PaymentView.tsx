import { useState, useMemo } from "react";
import type { CartItem } from "../../layouts/PosTerminalLayout";

interface Props {
  cartItems: CartItem[];
  onCancel: () => void;
  onPaymentSuccess: (method: "cash" | "digital" | "upi") => Promise<void>;
}

export function PaymentView({ cartItems, onCancel, onPaymentSuccess }: Props) {
  const [selectedMethod, setSelectedMethod] = useState<"cash" | "digital" | "upi">("cash");
  const [processing, setProcessing] = useState(false);

  const total = useMemo(() => {
    let sub = 0;
    cartItems.forEach((item) => {
      const lineSub = Number(item.product.price) * item.quantity;
      const rate = item.product.tax_rates?.rate ? Number(item.product.tax_rates.rate) : 0;
      sub += lineSub + lineSub * (rate / 100);
    });
    return sub;
  }, [cartItems]);

  const handleValidate = async () => {
    if (processing) return;
    setProcessing(true);
    try {
      await onPaymentSuccess(selectedMethod);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-bg p-4 md:p-8 justify-center items-center overflow-y-auto">
      <div className="w-full max-w-4xl bg-panel/80 backdrop-blur-3xl rounded-[2rem] border border-border/80 shadow-[var(--shadow-artisanal)] overflow-hidden flex flex-col md:flex-row min-h-[500px]">

        {/* Left Side: Methods */}
        <div className="w-full md:w-1/3 bg-bg/50 border-r border-border/50 p-6 xl:p-8 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted mb-6">Payment Method</h3>
          <div className="flex flex-col gap-3">
            {(["cash", "digital", "upi"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                disabled={processing}
                className={`py-4 px-6 rounded-2xl font-bold text-lg text-left transition-all duration-300 disabled:opacity-50 relative overflow-hidden group ${
                  selectedMethod === method
                    ? "bg-accent text-white shadow-lg shadow-accent/20 scale-[1.02] border-transparent"
                    : "bg-panel text-muted hover:bg-bg border border-border/60 hover:border-border hover:shadow-sm"
                }`}
              >
                {selectedMethod === method && (
                   <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                )}
                <div className="flex items-center gap-3 relative z-10">
                   <span className="text-xl">
                      {method === "cash" ? "💵" : method === "digital" ? "💳" : "📱"}
                   </span>
                   <span>
                      {method === "cash" ? "Cash" : method === "digital" ? "Digital / Card" : "UPI QR"}
                   </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Total & Confirmation */}
        <div className="flex-1 flex flex-col p-8 xl:p-10 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="text-3xl font-black text-ink mb-10 text-center tracking-tight z-10">Complete Checkout</h2>

          <div className="bg-bg/40 p-10 rounded-[2rem] mb-auto text-center border border-border/50 shadow-inner z-10 backdrop-blur-sm">
            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-3">Total Due</p>
            <p className="text-7xl font-black text-ink tracking-tighter drop-shadow-sm">${total.toFixed(2)}</p>
          </div>

          {/* Dynamic Content based on Method */}
          <div className="min-h-[140px] flex flex-col items-center justify-center z-10">
             {selectedMethod === "upi" ? (
               <div className="flex flex-col items-center justify-center my-6">
                 <div className="p-4 bg-white rounded-3xl shadow-xl border border-gray-100 mb-5 inline-block transform hover:scale-105 transition-transform duration-500">
                   <img
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(`upi://pay?pa=merchant@ybl&pn=CafePOS&am=${total.toFixed(2)}&cu=INR&tn=CafeOrder`)}`}
                     alt="UPI QR Code"
                     width={160}
                     height={160}
                     className="rounded-xl"
                   />
                 </div>
                 <p className="text-xl font-black text-ink mb-1">Scan to Pay via UPI</p>
                 <p className="text-sm font-semibold text-muted mb-4 opacity-70">merchant@ybl · ₹{total.toFixed(2)}</p>
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] uppercase tracking-wider bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-bold">BHIM</span>
                   <span className="text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full font-bold">PhonePe</span>
                   <span className="text-[10px] uppercase tracking-wider bg-sky-500/10 text-sky-500 px-3 py-1 rounded-full font-bold">GPay</span>
                   <span className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-bold">Paytm</span>
                 </div>
               </div>
             ) : (
               <div className="text-center w-full">
                 {processing ? (
                   <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-accent border-r-transparent rounded-full animate-spin" />
                      <p className="text-lg text-accent font-bold tracking-tight">Processing payment…</p>
                   </div>
                 ) : (
                   <p className="text-lg font-medium text-muted/70">Awaiting validation for <span className="text-ink font-bold">{selectedMethod}</span> payment...</p>
                 )}
               </div>
             )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 z-10 w-full">
            <button
              onClick={onCancel}
              disabled={processing}
              className="w-1/3 py-4 md:py-5 px-4 rounded-2xl border-2 border-border/80 bg-panel hover:bg-bg text-ink font-bold text-sm md:text-base tracking-wide uppercase transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              onClick={handleValidate}
              disabled={processing}
              className="flex-1 py-4 md:py-5 px-4 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-black text-lg md:text-xl tracking-widest uppercase transition-all shadow-[0_8px_30px_rgb(34,197,94,0.3)] hover:shadow-[0_8px_40px_rgb(34,197,94,0.5)] border border-green-400/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {processing ? "Processing…" : selectedMethod === "upi" ? "Confirm QR Scanned" : "Validate Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
