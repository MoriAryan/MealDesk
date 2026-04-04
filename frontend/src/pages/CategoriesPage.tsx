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
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Categories</h1>
          <p className="text-muted text-sm border-l-2 border-accent pl-2">Create tags to group your products cleanly on the POS terminal.</p>
        </div>

        {/* Action Right Menu */}
        {isAdmin && selectedIds.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold tracking-widest uppercase bg-accent/10 text-accent px-3 py-1.5 rounded-lg border border-accent/20">
              {selectedIds.length} Selected
            </span>
            <div className="relative" ref={actionMenuRef}>
              <button 
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                className="text-sm font-semibold bg-panel text-ink px-4 py-2 rounded-xl border border-border/80 shadow-[var(--shadow-artisanal)] hover:border-accent hover:text-accent transition-all flex items-center gap-2"
              >
                <span>⚙</span> Action
              </button>
              {actionMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-32 bg-panel/95 backdrop-blur-xl border border-border rounded-xl shadow-[var(--shadow-artisanal)] z-50 p-1">
                  <button onClick={bulkDelete} className="w-full text-left px-3 py-2 text-sm font-medium text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">{error}</p>}

      <div className="flex gap-4">
        <select
          className="text-sm bg-panel border border-border/80 px-4 py-2 rounded-xl font-medium focus:ring-2 focus:ring-accent focus:border-accent text-ink shadow-sm"
          value={activePosConfigId}
          onChange={(event) => setActivePosConfigId(event.target.value)}
        >
          {posConfigs.map((pos) => (
            <option key={pos.id} value={pos.id}>{pos.name}</option>
          ))}
        </select>
      </div>

      <div className="rounded-[1.5rem] border border-border/80 bg-panel shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-bg/50 border-b border-border">
              <tr className="text-muted/80 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4 w-12">Select</th>
                <th className="px-6 py-4">Category Name</th>
                <th className="px-6 py-4">Color Tag</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {categories.map((category) => (
                <tr key={category.id} className="transition-colors hover:bg-bg/30">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={selectedIds.includes(category.id)}
                      onChange={() => toggleSelect(category.id)}
                      className="h-4 w-4 rounded border-border bg-transparent text-accent focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      value={category.name}
                      disabled={!isAdmin}
                      onChange={(event) =>
                        setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, name: event.target.value } : item)))
                      }
                      className="bg-transparent border border-transparent focus:bg-white focus:border-border/80 px-3 py-1.5 rounded-lg w-full font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-panel shadow-sm overflow-hidden p-0 relative focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1">
                        <input
                          type="color"
                          disabled={!isAdmin}
                          value={category.color}
                          onChange={(event) =>
                            setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, color: event.target.value } : item)))
                          }
                          className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer bg-transparent border-0"
                        />
                      </div>
                      <span 
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border"
                        style={{ 
                          backgroundColor: `${category.color}15`, 
                          borderColor: `${category.color}40`,
                          color: category.color 
                        }}
                      >
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      disabled={!isAdmin || savingId === category.id}
                      onClick={() => void handleSave(category)}
                      className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-panel border border-border/80 hover:border-accent hover:text-accent text-ink transition-all shadow-sm disabled:opacity-40"
                    >
                      {savingId === category.id ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Inline Add Row */}
              {isAdmin && (
                <tr className="bg-bg/20">
                  <td className="px-6 py-4">
                     <span className="text-xl font-bold text-muted/30">+</span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      placeholder="Add new category..."
                      className="bg-white border border-border/80 focus:border-accent px-3 py-1.5 rounded-lg w-full font-medium text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all shadow-inner"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-8 w-8 rounded-full border-2 border-panel shadow-sm overflow-hidden p-0 relative">
                       <input
                         type="color"
                         value={newColor}
                         onChange={(event) => setNewColor(event.target.value)}
                         className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer border-0"
                       />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      disabled={!canCreate}
                      onClick={handleCreate}
                      className="text-xs font-bold tracking-wide uppercase px-5 py-2 rounded-xl bg-accent text-white shadow-md shadow-accent/20 hover:bg-accent-hover transition-all disabled:opacity-40 disabled:shadow-none"
                    >
                      Create
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!categories.length && !isAdmin && <div className="px-6 py-12 flex items-center justify-center text-sm font-medium text-muted">No categories available.</div>}
      </div>
    </div>
  );
}
