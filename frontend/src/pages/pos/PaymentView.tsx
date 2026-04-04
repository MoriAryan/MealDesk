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
    <div className="flex h-full w-full bg-bg p-8 justify-center items-center overflow-y-auto">
      <div className="w-full max-w-4xl bg-panel rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">

        {/* Left Side: Methods */}
        <div className="w-full md:w-1/3 border-r border-border bg-panel p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-6">Payment Method</h3>
          <div className="flex flex-col gap-3">
            {(["cash", "digital", "upi"] as const).map((method) => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                disabled={processing}
                className={`py-4 px-4 rounded-xl font-bold text-lg text-left transition-all disabled:opacity-50 ${
                  selectedMethod === method
                    ? "bg-[var(--color-accent)] text-white shadow-md scale-105"
                    : "bg-white text-ink border border-border hover:border-[var(--color-accent)]"
                }`}
              >
                {method === "cash" ? "💵 Cash" : method === "digital" ? "💳 Digital / Card" : "📱 UPI QR"}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Total & Confirmation */}
        <div className="flex-1 flex flex-col p-8">
          <h2 className="text-2xl font-bold text-ink mb-8 text-center">Complete Checkout</h2>

          <div className="bg-panel p-8 rounded-2xl mb-auto text-center border border-border shadow-inner">
            <p className="text-muted text-sm font-bold uppercase tracking-widest mb-2">Total Due</p>
            <p className="text-6xl font-black text-ink tracking-tight">${total.toFixed(2)}</p>
          </div>

          {/* Dynamic Content based on Method */}
          {selectedMethod === "upi" ? (
            <div className="flex flex-col items-center justify-center my-6">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-gray-100 mb-4 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=6&data=${encodeURIComponent(`upi://pay?pa=merchant@ybl&pn=CafePOS&am=${total.toFixed(2)}&cu=INR&tn=CafeOrder`)}`}
                  alt="UPI QR Code"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
              </div>
              <p className="text-lg font-bold text-ink">Scan to Pay via UPI</p>
              <p className="text-sm text-muted mb-3">merchant@ybl · ₹{total.toFixed(2)}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">BHIM</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">PhonePe</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">GPay</span>
                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-semibold">Paytm</span>
              </div>
            </div>
          ) : (
            <div className="my-10 text-center">
              {processing ? (
                <p className="text-lg text-accent font-semibold animate-pulse">Processing payment…</p>
              ) : (
                <p className="text-lg text-muted">Awaiting validation for {selectedMethod} payment...</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={onCancel}
              disabled={processing}
              className="w-1/3 py-4 px-4 rounded-xl border-2 border-border hover:bg-panel text-ink font-bold text-lg transition-colors active:scale-95 disabled:opacity-50"
            >
              Go Back
            </button>
            <button
              onClick={handleValidate}
              disabled={processing}
              className="flex-1 py-4 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-xl tracking-wider uppercase transition-all shadow-md shadow-green-500/20 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {processing ? "Processing…" : selectedMethod === "upi" ? "Confirm QR Scanned" : "Validate Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
