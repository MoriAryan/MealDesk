import { useEffect, useMemo, useState, useRef } from "react";
import {
  listPaymentMethods,
  savePaymentMethod,
  updatePaymentMethod,
} from "../api/paymentMethods";
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

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      try {
        const pos = await listPosConfigs(accessToken);
        setPosConfigs(pos.posConfigs);
        setActivePosConfigId(
          (current) => current || pos.posConfigs[0]?.id || "",
        );
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load POS terminals",
        );
      }
    };

    void load();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !activePosConfigId) return;

    const load = async () => {
      try {
        const response = await listPaymentMethods(
          accessToken,
          activePosConfigId,
        );
        setItems(response.paymentMethods);
        const upi = response.paymentMethods.find(
          (method) => method.method === "upi",
        );
        setUpiId(upi?.upi_id || "");
        setSelectedIds([]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load payment methods",
        );
      }
    };

    void load();
  }, [accessToken, activePosConfigId]);

  const byMethod = useMemo(() => {
    const map = new Map<PaymentMethod["method"], PaymentMethod>();
    items.forEach((method) => map.set(method.method, method));
    return map;
  }, [items]);

  const toggleSelect = (id: string) => {
    if (!id) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const saveMethodInfo = async (
    method: PaymentMethod["method"],
    isEnabled: boolean,
    newUpiId?: string,
  ) => {
    if (!accessToken || !isAdmin || !activePosConfigId) return;

    try {
      const existing = byMethod.get(method);
      if (existing) {
        const response = await updatePaymentMethod(accessToken, existing.id, {
          enabled: isEnabled,
          upiId: method === "upi" ? newUpiId : undefined,
        });
        setItems((prev) =>
          prev.map((item) =>
            item.id === existing.id ? response.paymentMethod : item,
          ),
        );
        if (method === "upi") setUpiId(response.paymentMethod.upi_id || "");
      } else {
        const response = await savePaymentMethod(accessToken, {
          posConfigId: activePosConfigId,
          method,
          enabled: isEnabled,
          upiId: method === "upi" ? newUpiId : undefined,
        });
        setItems((prev) => [...prev, response.paymentMethod]);
        if (method === "upi") setUpiId(response.paymentMethod.upi_id || "");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to save payment method",
      );
    }
  };

  const bulkDisable = async () => {
    if (!accessToken || !isAdmin || !selectedIds.length) return;
    try {
      for (const methodId of selectedIds) {
        const existing = items.find((i) => i.id === methodId);
        if (existing) {
          await updatePaymentMethod(accessToken, existing.id, {
            enabled: false,
            upiId:
              existing.method === "upi"
                ? (existing.upi_id ?? undefined)
                : undefined,
          });
        }
      }
      setItems((prev) =>
        prev.map((item) =>
          selectedIds.includes(item.id) ? { ...item, enabled: false } : item,
        ),
      );
      setSelectedIds([]);
      setActionMenuOpen(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to bulk disable methods.",
      );
    }
  };

  return (
    <section className="max-w-5xl">
      {/* Standard Header */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
        <div className="flex items-center gap-4 pt-2">
          {isAdmin && (
            <button
              type="button"
              className="text-sm font-semibold px-4 py-1.5 rounded bg-panel text-ink hover:bg-border transition-colors opacity-50 cursor-not-allowed"
              title="Payment methods are predefined. You cannot add new ones."
            >
              New
            </button>
          )}
          <span className="text-xl font-bold font-head text-ink">Payment</span>
        </div>

        {/* Action Right Menu */}
        {isAdmin && selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium bg-blue-900/30 text-blue-400 px-3 py-1 rounded-sm">
              x {selectedIds.length} Selected
            </span>
            <div className="relative" ref={actionMenuRef}>
              <button
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                className="text-sm font-semibold bg-panel text-ink px-3 py-1 rounded border border-border hover:bg-border flex items-center gap-2"
              >
                <span>⚙</span> Action
              </button>
              {actionMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-panel border border-border rounded-md shadow-lg z-50">
                  <button
                    onClick={bulkDisable}
                    className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-panel transition-colors"
                  >
                    Disable
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-4 mb-4">
        <select
          className="text-sm bg-transparent border-0 border-b border-border px-1 py-1 focus:ring-0 text-muted"
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

      <div className="border-t border-border">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="px-2 py-3 font-semibold text-ink">Select</th>
              <th className="px-3 py-3 font-semibold text-ink">Method</th>
              <th className="px-3 py-3 font-semibold text-ink">Status</th>
              <th className="px-3 py-3 font-semibold text-ink">
                Configuration
              </th>
              <th className="px-3 py-3 font-semibold text-ink">Actions</th>
            </tr>
          </thead>
          <tbody>
            {methodOrder.map((method) => {
              const current = byMethod.get(method);
              const enabled = current?.enabled || false;
              const hasId = !!current?.id;

              return (
                <tr
                  key={method}
                  className="border-b border-border transition-colors hover:bg-panel"
                >
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      disabled={!isAdmin || !hasId}
                      checked={hasId && selectedIds.includes(current.id)}
                      onChange={() => hasId && toggleSelect(current.id)}
                      className="themed-checkbox"
                    />
                  </td>
                  <td className="px-3 py-3 capitalize font-medium">{method}</td>
                  <td className="px-3 py-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={!isAdmin}
                        onChange={(event) =>
                          saveMethodInfo(
                            method,
                            event.target.checked,
                            method === "upi" ? upiId : undefined,
                          )
                        }
                        className="themed-checkbox"
                      />
                      <span className="text-xs text-muted">
                        {enabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </td>
                  <td className="px-3 py-3">
                    {method === "upi" ? (
                      <input
                        value={upiId}
                        disabled={!isAdmin}
                        onChange={(event) => setUpiId(event.target.value)}
                        placeholder="merchant@upi"
                        className="bg-transparent border-0 border-b border-border focus:border-accent px-1 py-1 w-full max-w-50 text-ink focus:ring-0 text-sm"
                      />
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {method === "upi" && isAdmin && (
                      <button
                        onClick={() => saveMethodInfo("upi", enabled, upiId)}
                        className="text-xs font-semibold px-3 py-1 rounded border border-border hover:bg-panel text-ink transition-colors"
                      >
                        Save UPI
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
