import { useEffect, useMemo, useState, useRef } from "react";
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
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        setSelectedIds([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load categories");
      }
    };

    void loadCategories();
  }, [accessToken, activePosConfigId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

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

  const bulkDelete = async () => {
    if (!accessToken || !isAdmin || !selectedIds.length) return;
    try {
      for (const id of selectedIds) {
        await deleteCategory(accessToken, id);
      }
      setCategories((prev) => prev.filter((category) => !selectedIds.includes(category.id)));
      setSelectedIds([]);
      setActionMenuOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to bulk delete categories. Note: Cannot delete categories in use.");
    }
  };

  return (
    <section className="max-w-5xl">
      {/* Header Standardized */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-[var(--c-border)]">
        <div className="flex items-center gap-4 pt-2">
          {isAdmin && (
            <button 
              type="button"
              className="text-sm font-semibold px-4 py-1.5 rounded bg-[var(--c-panel-2)] text-[var(--c-ink)] hover:bg-[var(--c-border)] transition-colors opacity-50 cursor-not-allowed"
              title="Add Category using the inline form below"
            >
              New
            </button>
          )}
          <span className="text-xl font-bold font-head text-[var(--c-ink)]">Category</span>
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
                className="text-sm font-semibold bg-[var(--c-panel-2)] text-[var(--c-ink)] px-3 py-1 rounded border border-[var(--c-border)] hover:bg-[var(--c-border)] flex items-center gap-2"
              >
                <span>⚙</span> Action
              </button>
              {actionMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-[var(--c-panel)] border border-[var(--c-border)] rounded-md shadow-lg z-50">
                  <button onClick={bulkDelete} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-4 mb-4">
        <select
           className="text-sm bg-transparent border-0 border-b border-[var(--c-border)] px-1 py-1 focus:ring-0 text-[var(--c-muted)]"
          value={activePosConfigId}
          onChange={(event) => setActivePosConfigId(event.target.value)}
        >
          {posConfigs.map((pos) => (
            <option key={pos.id} value={pos.id}>{pos.name}</option>
          ))}
        </select>
      </div>

      <div className="border-t border-[var(--c-border)]">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b border-[var(--c-border)] text-[var(--c-muted)]">
              <th className="px-2 py-3 font-semibold text-[var(--c-ink)]">Select</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Name</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Color Pill</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className={`border-b border-[var(--c-border)] transition-colors hover:bg-[var(--c-panel-2)]`}>
                <td className="px-2 py-3">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={selectedIds.includes(category.id)}
                    onChange={() => toggleSelect(category.id)}
                    className="rounded border-[var(--c-border)] bg-transparent focus:ring-1 focus:ring-[var(--c-accent)] text-[var(--c-accent)]"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    value={category.name}
                    disabled={!isAdmin}
                    onChange={(event) =>
                      setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, name: event.target.value } : item)))
                    }
                    className="bg-transparent border-0 border-b border-transparent focus:border-[var(--c-border)] px-1 py-1 w-full text-[var(--c-ink)] focus:ring-0"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      disabled={!isAdmin}
                      value={category.color}
                      onChange={(event) =>
                        setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, color: event.target.value } : item)))
                      }
                      className="h-8 w-12 cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium border"
                      style={{ 
                        backgroundColor: `${category.color}20`, 
                        borderColor: category.color,
                        color: category.color 
                      }}
                    >
                      {category.name}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={!isAdmin || savingId === category.id}
                    onClick={() => void handleSave(category)}
                    className="text-xs font-semibold px-3 py-1 rounded border border-[var(--c-border)] hover:bg-[var(--c-panel-2)] text-[var(--c-ink)] disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                </td>
              </tr>
            ))}
            
            {/* Inline Add Row */}
            {isAdmin && (
              <tr className="border-b border-dashed border-[var(--c-border)] bg-[var(--c-panel)]">
                <td className="px-2 py-3">
                </td>
                <td className="px-3 py-3">
                  <input
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="New category..."
                    className="bg-transparent border-0 border-b border-[var(--c-border)] focus:border-[var(--c-accent)] px-1 py-1 w-full text-[var(--c-ink)] focus:ring-0"
                  />
                </td>
                <td className="px-3 py-3">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(event) => setNewColor(event.target.value)}
                    className="h-8 w-12 cursor-pointer bg-transparent border-0 p-0"
                  />
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={!canCreate}
                    onClick={handleCreate}
                    className="text-xs font-semibold px-3 py-1 rounded bg-[var(--c-accent)] text-white disabled:opacity-50"
                  >
                    Add Category
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!categories.length && !isAdmin && <p className="px-2 py-6 text-sm text-[var(--c-muted)] text-center">No categories found.</p>}
      </div>
    </section>
  );
}
