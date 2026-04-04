import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createPosConfig, listPosConfigs, updatePosConfig } from "../api/posConfig";
import type { PosConfig } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export function PosConfigPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState<PosConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [terminalName, setTerminalName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      try {
        const response = await listPosConfigs(accessToken);
        setItems(response.posConfigs);
        setSelectedId((current) => current || response.posConfigs[0]?.id || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load terminals");
      }
    };

    void load();
  }, [accessToken]);

  const selected = items.find((item) => item.id === selectedId) || null;

  const mutateSelected = (patch: Partial<PosConfig>) => {
    setItems((prev) => prev.map((item) => (item.id === selectedId ? { ...item, ...patch } : item)));
  };

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !isAdmin || !terminalName.trim()) return;

    try {
      const response = await createPosConfig(accessToken, terminalName.trim());
      setItems((prev) => [...prev, response.posConfig]);
      setSelectedId(response.posConfig.id);
      setTerminalName("");
      setIsCreateModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create terminal");
    }
  };

  const saveSelected = async () => {
    if (!accessToken || !isAdmin || !selected) return;

    try {
      const response = await updatePosConfig(accessToken, selected.id, {
        name: selected.name,
        cashEnabled: selected.cash_enabled,
        digitalEnabled: selected.digital_enabled,
        upiEnabled: selected.upi_enabled,
        upiId: selected.upi_id || "",
        selfOrderingEnabled: selected.self_ordering_enabled,
        selfOrderingMode: selected.self_ordering_mode,
        bgColor: selected.bg_color || "",
      });
      mutateSelected(response.posConfig);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save terminal config");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">POS Terminal Config</h2>
          <p className="text-sm text-muted">Configure payment toggles, self-ordering mode, and terminal appearance.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setIsCreateModalOpen(true)} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-white">
            Create Terminal
          </button>
        )}
      </div>

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="space-y-2 rounded-2xl border border-border bg-panel p-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                selectedId === item.id ? "bg-[var(--color-accent)] text-white" : "bg-panel"
              }`}
            >
              {item.name}
            </button>
          ))}
          {!items.length && <p className="px-2 py-3 text-sm text-muted">No terminals configured.</p>}
        </div>

        {selected && (
          <div className="space-y-4 rounded-2xl border border-border bg-panel p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Terminal Name</span>
              <input
                disabled={!isAdmin}
                value={selected.name}
                onChange={(event) => mutateSelected({ name: event.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 disabled:bg-panel"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
                Cash Enabled
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={selected.cash_enabled}
                  onChange={(event) => mutateSelected({ cash_enabled: event.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
                Digital Enabled
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={selected.digital_enabled}
                  onChange={(event) => mutateSelected({ digital_enabled: event.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
                UPI Enabled
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={selected.upi_enabled}
                  onChange={(event) => mutateSelected({ upi_enabled: event.target.checked })}
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
                Self Ordering
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={selected.self_ordering_enabled}
                  onChange={(event) => mutateSelected({ self_ordering_enabled: event.target.checked })}
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">UPI ID</span>
                <input
                  disabled={!isAdmin}
                  value={selected.upi_id || ""}
                  onChange={(event) => mutateSelected({ upi_id: event.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 disabled:bg-panel"
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Self Ordering Mode</span>
                <select
                  disabled={!isAdmin}
                  value={selected.self_ordering_mode || ""}
                  onChange={(event) => mutateSelected({ self_ordering_mode: (event.target.value || null) as "qr" | "token" | null })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 disabled:bg-panel"
                >
                  <option value="">Disabled</option>
                  <option value="qr">QR</option>
                  <option value="token">Token</option>
                </select>
              </label>
            </div>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Background Color</span>
              <input
                type="color"
                disabled={!isAdmin}
                value={selected.bg_color || "#f6f2ea"}
                onChange={(event) => mutateSelected({ bg_color: event.target.value })}
                className="h-11 w-40 rounded-lg border border-border bg-white px-2 disabled:bg-panel"
              />
            </label>

            {isAdmin && (
              <button onClick={() => void saveSelected()} className="rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-white">
                Save Terminal
              </button>
            )}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/35 p-4">
          <form onSubmit={onCreate} className="w-full max-w-md rounded-2xl border border-border bg-panel p-5">
            <h3 className="text-xl font-semibold">Create POS Terminal</h3>
            <p className="mt-1 text-sm text-muted">This creates a new terminal profile with default settings.</p>
            <input
              autoFocus
              value={terminalName}
              onChange={(event) => setTerminalName(event.target.value)}
              placeholder="Counter 1"
              className="mt-4 w-full rounded-lg border border-border bg-white px-3 py-2"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="rounded-lg border border-border px-4 py-2">
                Cancel
              </button>
              <button type="submit" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 font-medium text-white">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
