import { useState, useMemo } from "react";
import type { CartItem } from "../../layouts/PosTerminalLayout";
import type { PaymentMethod } from "../../api/types";

interface Props {
  cartItems: CartItem[];
  paymentMethods?: PaymentMethod[];
  onCancel: () => void;
  onPaymentSuccess: (method: "cash" | "digital" | "upi") => Promise<void>;
}

export function PaymentView({ cartItems, paymentMethods, onCancel, onPaymentSuccess }: Props) {
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

  const upiMethod = paymentMethods?.find((method) => method.method === "upi" && method.enabled);
  const upiId = upiMethod?.upi_id || "merchant@ybl";

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
    <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-bg px-4 py-6 md:px-6 md:py-8">
      <div className="flex min-h-[560px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-panel shadow-[var(--shadow-artisanal)] md:flex-row">

        {/* Left Side: Methods */}
        <div className="flex w-full flex-col border-b border-border/60 bg-bg/45 p-5 md:w-[320px] md:border-b-0 md:border-r md:p-6">
          <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-muted">Payment Method</h3>
          <div className="flex flex-col gap-2.5">
            {(["cash", "digital", "upi"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                disabled={processing}
                className={`group relative overflow-hidden rounded-lg border px-4 py-3.5 text-left text-base font-semibold transition-all duration-200 disabled:opacity-50 ${
                  selectedMethod === method
                    ? "border-accent bg-accent text-white"
                    : "border-border/70 bg-panel text-muted hover:border-accent/35 hover:text-ink"
                }`}
              >
                {selectedMethod === method && (
                   <div className="absolute inset-0 bg-white/20 blur-md rounded-full -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                )}
                <div className="flex items-center gap-3 relative z-10">
                   <span className="text-lg">
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
        <div className="relative flex flex-1 flex-col overflow-hidden p-5 md:p-8">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="z-10 mb-7 text-center text-3xl font-black tracking-tight text-ink">Complete Checkout</h2>

          <div className="z-10 mb-6 rounded-2xl border border-border/60 bg-bg/35 p-8 text-center shadow-inner backdrop-blur-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">Total Due</p>
            <p className="text-6xl font-black tracking-tight text-ink md:text-7xl">${total.toFixed(2)}</p>
          </div>

          {/* Dynamic Content based on Method */}
          <div className="z-10 flex min-h-[170px] flex-col items-center justify-center rounded-xl border border-border/40 bg-panel/45 px-4 py-6">
             {selectedMethod === "upi" ? (
               <div className="my-2 flex flex-col items-center justify-center">
                 <div className="mb-4 inline-block rounded-2xl border border-gray-100 bg-white p-3 shadow-lg transition-transform duration-300 hover:scale-105">
                   <img
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=4&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=CafePOS&am=${total.toFixed(2)}&cu=INR&tn=CafeOrder`)}`}
                     alt="UPI QR Code"
                     width={160}
                     height={160}
                     className="rounded-xl"
                   />
                 </div>
                 <p className="mb-1 text-xl font-black text-ink">Scan to Pay via UPI</p>
                 <p className="mb-3 text-sm font-semibold text-muted/80">{upiId} · ₹{total.toFixed(2)}</p>
                 <div className="flex flex-wrap items-center justify-center gap-2">
                   <span className="text-[10px] uppercase tracking-wider bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-bold">BHIM</span>
                   <span className="text-[10px] uppercase tracking-wider bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full font-bold">PhonePe</span>
                   <span className="text-[10px] uppercase tracking-wider bg-sky-500/10 text-sky-500 px-3 py-1 rounded-full font-bold">GPay</span>
                   <span className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full font-bold">Paytm</span>
                 </div>
               </div>
             ) : (
               <div className="w-full text-center">
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
          <div className="z-10 mt-6 flex w-full gap-3">
            <button
              onClick={onCancel}
              disabled={processing}
              className="w-[180px] rounded-lg border border-border/80 bg-panel px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:border-accent/30 hover:bg-bg active:scale-95 disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              onClick={handleValidate}
              disabled={processing}
              className="flex-1 rounded-lg border border-green-400/50 bg-green-500 px-4 py-3.5 text-base font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-green-400 hover:shadow-[0_6px_24px_rgb(34,197,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
            >
              {processing ? "Processing…" : selectedMethod === "upi" ? "Confirm QR Scanned" : "Validate Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
