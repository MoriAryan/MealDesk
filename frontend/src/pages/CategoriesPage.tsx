import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createCategory, deleteCategory, listCategories, updateCategory } from "../api/categories";
import { listPosConfigs } from "../api/posConfig";
import type { Category, PosConfig } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export function CategoriesPage() {
  const { accessToken } = useAuth();
  const isAdmin = true; // Temporary prototype unlock

  const [posConfigs, setPosConfigs] = useState<PosConfig[]>([]);
  const [activePosConfigId, setActivePosConfigId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const fixedColors = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
  const [newColor, setNewColor] = useState('#ffffff');
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(null);
  const [openNewColorPicker, setOpenNewColorPicker] = useState(false);


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
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(accessToken, id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete category. Note: Cannot delete categories in use.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Categories</h1>
          <p className="text-muted text-sm border-l-2 border-accent pl-2">Create tags to group your products cleanly on the POS terminal.</p>
        </div>

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
                <th className="px-6 py-4 w-12 text-center">≡</th>
                <th className="px-6 py-4">Product Category</th>
                <th className="px-6 py-4">Color</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {categories.map((category) => (
                <tr key={category.id} className="transition-colors hover:bg-bg/30">
                  <td className="px-6 py-4 font-bold text-muted/50 cursor-grab active:cursor-grabbing text-xl select-none">
                    ::
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
                    <div className="flex items-center gap-3 relative">
                      <button
                        type="button"
                        disabled={!isAdmin}
                        onClick={() => setOpenColorPickerId(openColorPickerId === category.id ? null : category.id)}
                        className="h-6 w-6 rounded-full border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                        style={{ backgroundColor: category.color }}
                      />
                      {openColorPickerId === category.id && (
                        <div className="absolute top-8 left-0 z-10 bg-panel border border-border rounded-xl shadow-lg p-2 flex gap-2 w-max">
                          {fixedColors.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setCategories((prev) => prev.map((item) => (item.id === category.id ? { ...item, color: c } : item)));
                                setOpenColorPickerId(null);
                              }}
                              className="h-6 w-6 rounded-full border border-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
                      
                      <span 
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border"
                        style={{ 
                          backgroundColor: `${category.color}15`, 
                          borderColor: category.color === '#ffffff' ? '#e2e8f0' : `${category.color}40`,
                          color: category.color === '#ffffff' ? '#64748b' : category.color 
                        }}
                      >
                        {category.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={!isAdmin || savingId === category.id}
                        onClick={() => void handleSave(category)}
                        className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-panel border border-border/80 hover:border-accent hover:text-accent text-ink transition-all shadow-sm disabled:opacity-40"
                      >
                        {savingId === category.id ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        disabled={!isAdmin || savingId === category.id}
                        onClick={() => void handleDelete(category.id)}
                        className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Category"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Inline Add Row */}
              {isAdmin && (
                <tr className="bg-bg/20">
                  <td className="px-6 py-4 font-bold text-muted/50 text-xl">
                    ::
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
                    <div className="flex flex-col gap-2 relative">
                      <button
                        type="button"
                        onClick={() => setOpenNewColorPicker(!openNewColorPicker)}
                        className="h-6 w-6 rounded-full border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                        style={{ backgroundColor: newColor }}
                      />
                      {openNewColorPicker && (
                        <div className="absolute top-8 left-0 z-10 bg-panel border border-border rounded-xl shadow-lg p-2 flex gap-2 w-max">
                          {fixedColors.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                setNewColor(c);
                                setOpenNewColorPicker(false);
                              }}
                              className="h-6 w-6 rounded-full border border-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      )}
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
