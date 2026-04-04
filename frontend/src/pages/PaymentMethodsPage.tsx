import { useEffect, useMemo, useState } from "react";
import { listPaymentMethods, savePaymentMethod, updatePaymentMethod } from "../api/paymentMethods";
import { listPosConfigs } from "../api/posConfig";
import type { PaymentMethod, PosConfig } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

const methodOrder: Array<PaymentMethod["method"]> = ["cash", "digital", "upi"];

export function PaymentMethodsPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [posConfigs, setPosConfigs] = useState<PosConfig[]>([]);
  const [activePosConfigId, setActivePosConfigId] = useState("");
  const [items, setItems] = useState<PaymentMethod[]>([]);
  const [upiId, setUpiId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      try {
        const response = await listPosConfigs(accessToken);
        setPosConfigs(response.posConfigs);
        setActivePosConfigId((current) => current || response.posConfigs[0]?.id || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load POS terminals");
      }
    };

    void load();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !activePosConfigId) return;

    const load = async () => {
      try {
        const response = await listPaymentMethods(accessToken, activePosConfigId);
        setItems(response.paymentMethods);
        const upi = response.paymentMethods.find((method) => method.method === "upi");
        setUpiId(upi?.upi_id || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load payment methods");
      }
    };

    void load();
  }, [accessToken, activePosConfigId]);

  const byMethod = useMemo(() => {
    const map = new Map<PaymentMethod["method"], PaymentMethod>();
    items.forEach((method) => map.set(method.method, method));
    return map;
  }, [items]);

  const toggleMethod = async (method: PaymentMethod["method"], enabled: boolean) => {
    if (!accessToken || !isAdmin || !activePosConfigId) return;

    try {
      const existing = byMethod.get(method);
      if (existing) {
        const response = await updatePaymentMethod(accessToken, existing.id, {
          enabled,
          upiId: method === "upi" ? upiId : undefined,
        });
        setItems((prev) => prev.map((item) => (item.id === existing.id ? response.paymentMethod : item)));
      } else {
        const response = await savePaymentMethod(accessToken, {
          posConfigId: activePosConfigId,
          method,
          enabled,
          upiId: method === "upi" ? upiId : undefined,
        });
        setItems((prev) => [...prev, response.paymentMethod]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update payment method");
    }
  };

  const saveUpiId = async () => {
    if (!accessToken || !isAdmin || !activePosConfigId) return;

    try {
      const existing = byMethod.get("upi");
      if (existing) {
        const response = await updatePaymentMethod(accessToken, existing.id, { upiId, enabled: existing.enabled });
        setItems((prev) => prev.map((item) => (item.id === existing.id ? response.paymentMethod : item)));
      } else {
        const response = await savePaymentMethod(accessToken, {
          posConfigId: activePosConfigId,
          method: "upi",
          enabled: true,
          upiId,
        });
        setItems((prev) => [...prev, response.paymentMethod]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save UPI ID");
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Payment Methods</h2>
        <p className="text-sm text-[var(--c-muted)]">Configure cash, digital, and UPI acceptance per terminal.</p>
      </div>

      <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
        <label className="mb-2 block text-xs uppercase tracking-wider text-[var(--c-muted)]">POS Terminal</label>
        <select
          className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2"
          value={activePosConfigId}
          onChange={(event) => setActivePosConfigId(event.target.value)}
        >
          {posConfigs.map((pos) => (
            <option key={pos.id} value={pos.id}>
              {pos.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-3">
        {methodOrder.map((method) => {
          const current = byMethod.get(method);
          const enabled = current?.enabled || false;
          return (
            <label key={method} className="flex items-center justify-between rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-3">
              <span className="text-sm font-medium capitalize">{method}</span>
              <input
                type="checkbox"
                checked={enabled}
                disabled={!isAdmin}
                onChange={(event) => void toggleMethod(method, event.target.checked)}
              />
            </label>
          );
        })}
      </div>

      <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
        <label className="block text-sm">
          <span className="mb-2 block text-xs uppercase tracking-wider text-[var(--c-muted)]">UPI ID</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={upiId}
              disabled={!isAdmin}
              onChange={(event) => setUpiId(event.target.value)}
              placeholder="merchant@upi"
              className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
            />
            {isAdmin && (
              <button onClick={() => void saveUpiId()} className="rounded-lg bg-[var(--c-accent)] px-4 py-2 font-medium text-white">
                Save UPI
              </button>
            )}
          </div>
        </label>
      </div>
    </section>
  );
}
