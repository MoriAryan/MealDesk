import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../api/categories";
import { listPosConfigs } from "../api/posConfig";
import type { Category, PosConfig } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export function CategoriesPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [posConfigs, setPosConfigs] = useState<PosConfig[]>([]);
  const [activePosConfigId, setActivePosConfigId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#c65f1a");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const canCreate = useMemo(() => isAdmin && !!activePosConfigId && !!newName.trim(), [isAdmin, activePosConfigId, newName]);

  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      try {
        const pos = await listPosConfigs(accessToken);
        setPosConfigs(pos.posConfigs);
        setActivePosConfigId((current) => current || pos.posConfigs[0]?.id || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load POS terminals");
      }
    };

    void load();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !activePosConfigId) return;

    const loadCategories = async () => {
      try {
        setError(null);
        const response = await listCategories(accessToken, activePosConfigId);
        setCategories(response.categories);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load categories");
      }
    };

    void loadCategories();
  }, [accessToken, activePosConfigId]);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !canCreate) return;

    try {
      const response = await createCategory(accessToken, {
        posConfigId: activePosConfigId,
        name: newName,
        color: newColor,
      });
      setCategories((prev) => [...prev, response.category]);
      setNewName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create category");
    }
  };

  const handleSave = async (category: Category) => {
    if (!accessToken || !isAdmin) return;
    setSavingId(category.id);
    try {
      await updateCategory(accessToken, category.id, {
        name: category.name,
        color: category.color,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken || !isAdmin) return;
    setSavingId(id);
    try {
      await deleteCategory(accessToken, id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Category Management</h2>
        <p className="text-sm text-[var(--c-muted)]">Create and maintain product categories for each terminal.</p>
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

      {isAdmin && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4 md:grid-cols-[1fr_140px_auto]">
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="New category name"
            className="rounded-lg border border-[var(--c-border)] bg-white px-3 py-2"
          />
          <input
            type="color"
            value={newColor}
            onChange={(event) => setNewColor(event.target.value)}
            className="h-11 w-full rounded-lg border border-[var(--c-border)] bg-white px-2"
          />
          <button disabled={!canCreate} className="rounded-lg bg-[var(--c-accent)] px-4 py-2 font-medium text-white disabled:opacity-50">
            Add Category
          </button>
        </form>
      )}

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="grid gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4 md:grid-cols-[1fr_160px_auto]">
            <input
              value={category.name}
              disabled={!isAdmin}
              onChange={(event) =>
                setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, name: event.target.value } : item)))
              }
              className="rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
            />
            <input
              type="color"
              disabled={!isAdmin}
              value={category.color}
              onChange={(event) =>
                setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, color: event.target.value } : item)))
              }
              className="h-11 rounded-lg border border-[var(--c-border)] bg-white px-2 disabled:bg-[var(--c-panel-2)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!isAdmin || savingId === category.id}
                onClick={() => void handleSave(category)}
                className="rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 text-sm disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                disabled={!isAdmin || savingId === category.id}
                onClick={() => void handleDelete(category.id)}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!categories.length && <p className="text-sm text-[var(--c-muted)]">No categories configured yet.</p>}
      </div>
    </section>
  );
}
