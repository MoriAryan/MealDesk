import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ChevronDown, GripVertical } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../api/categories";
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
  const fixedColors = [
    "#ffffff",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#3b82f6",
    "#a855f7",
  ];
  const [newColor, setNewColor] = useState("#ffffff");
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openColorPickerId, setOpenColorPickerId] = useState<string | null>(
    null,
  );
  const [openNewColorPicker, setOpenNewColorPicker] = useState(false);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(
    null,
  );
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<
    string | null
  >(null);
  const [isPosMenuOpen, setIsPosMenuOpen] = useState(false);
  const posMenuRef = useRef<HTMLDivElement | null>(null);

  const canCreate = useMemo(
    () => isAdmin && !!activePosConfigId && !!newName.trim(),
    [isAdmin, activePosConfigId, newName],
  );
  const activePosName = useMemo(
    () =>
      posConfigs.find((pos) => pos.id === activePosConfigId)?.name ||
      "Select POS",
    [activePosConfigId, posConfigs],
  );

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

  useEffect(() => {
    if (!isPosMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!posMenuRef.current?.contains(event.target as Node)) {
        setIsPosMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [isPosMenuOpen]);

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
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;
    try {
      await deleteCategory(accessToken, id);
      setCategories((prev) => prev.filter((category) => category.id !== id));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to delete category. Note: Cannot delete categories in use.",
      );
    }
  };

  const moveCategory = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setCategories((prev) => {
      const fromIndex = prev.findIndex((category) => category.id === fromId);
      const toIndex = prev.findIndex((category) => category.id === toId);
      if (fromIndex < 0 || toIndex < 0) return prev;

      const reordered = [...prev];
      const [movedItem] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, movedItem);
      return reordered;
    });
  };

  const isInteractiveDragTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return !!target.closest("input, button, select, textarea, a, label");
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Categories
          </h1>
          <p className="text-muted text-sm border-l-2 border-accent pl-2">
            Create tags to group your products cleanly on the POS terminal.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-4">
        <div className="relative" ref={posMenuRef}>
          <button
            type="button"
            onClick={() => setIsPosMenuOpen((open) => !open)}
            className="inline-flex min-w-48 items-center justify-between gap-3 rounded-xl border border-border/80 bg-panel px-4 py-2 text-sm font-medium text-ink shadow-sm transition-all hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
            aria-haspopup="listbox"
            aria-expanded={isPosMenuOpen}
          >
            <span>{activePosName}</span>
            <ChevronDown
              size={16}
              className={`text-muted/80 transition-transform ${isPosMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isPosMenuOpen && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-panel shadow-lg">
              <ul role="listbox" className="py-1">
                {posConfigs.map((pos) => {
                  const isActive = pos.id === activePosConfigId;

                  return (
                    <li key={pos.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePosConfigId(pos.id);
                          setIsPosMenuOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          isActive
                            ? "bg-accent/20 text-ink font-semibold"
                            : "text-ink hover:bg-bg/60"
                        }`}
                      >
                        {pos.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-border/80 bg-panel shadow-sm overflow-visible">
        <div className="overflow-x-auto overflow-y-visible scrollbar-cafe">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-bg/50 border-b border-border">
              <tr className="text-muted/80 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4 w-12 text-center">≡</th>
                <th className="px-6 py-4">Product Category</th>
                <th className="px-6 py-4">Color</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 align-top">
              {categories.map((category) => {
                const isDraggingRow = draggingCategoryId === category.id;

                return (
                  <tr
                    key={category.id}
                    draggable={isAdmin}
                    onDragStart={(event) => {
                      if (!isAdmin || isInteractiveDragTarget(event.target)) {
                        event.preventDefault();
                        return;
                      }

                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", category.id);
                      setDraggingCategoryId(category.id);
                      setDropTargetCategoryId(category.id);
                    }}
                    onDragOver={(event) => {
                      if (!isAdmin || !draggingCategoryId) return;
                      event.preventDefault();
                      if (
                        draggingCategoryId !== category.id &&
                        dropTargetCategoryId !== category.id
                      ) {
                        moveCategory(draggingCategoryId, category.id);
                        setDropTargetCategoryId(category.id);
                      }
                    }}
                    onDrop={(event) => {
                      if (!isAdmin || !draggingCategoryId) return;
                      event.preventDefault();
                      setDraggingCategoryId(null);
                      setDropTargetCategoryId(null);
                    }}
                    onDragEnd={() => {
                      setDraggingCategoryId(null);
                      setDropTargetCategoryId(null);
                    }}
                    className={`transition-colors hover:bg-bg/30 ${
                      isDraggingRow ? "bg-panel/95" : ""
                    } ${
                      dropTargetCategoryId === category.id ? "bg-accent/10" : ""
                    }`}
                    style={
                      isDraggingRow
                        ? {
                            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
                            transform: "scale(1.01)",
                            opacity: 0.96,
                          }
                        : undefined
                    }
                  >
                    <td className="px-6 py-4">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-bg/50 text-muted/60 cursor-grab active:cursor-grabbing select-none transition-colors hover:text-ink hover:border-border"
                        title={isAdmin ? "Drag to reorder" : undefined}
                      >
                        <GripVertical size={16} />
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        value={category.name}
                        disabled={!isAdmin}
                        onChange={(event) =>
                          setCategories((prev) =>
                            prev.map((item) =>
                              item.id === category.id
                                ? { ...item, name: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="bg-transparent border border-transparent focus:bg-white focus:border-border/80 px-3 py-1.5 rounded-lg w-full font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 relative">
                        <button
                          type="button"
                          disabled={!isAdmin}
                          onClick={() =>
                            setOpenColorPickerId(
                              openColorPickerId === category.id
                                ? null
                                : category.id,
                            )
                          }
                          className="h-6 w-6 rounded-full border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                          style={{ backgroundColor: category.color }}
                        />
                        {openColorPickerId === category.id && (
                          <div className="absolute top-8 left-0 z-10 bg-panel border border-border rounded-xl shadow-lg p-2 flex gap-2 w-max">
                            {fixedColors.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setCategories((prev) =>
                                    prev.map((item) =>
                                      item.id === category.id
                                        ? { ...item, color: c }
                                        : item,
                                    ),
                                  );
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
                            borderColor:
                              category.color === "#ffffff"
                                ? "#e2e8f0"
                                : `${category.color}40`,
                            color:
                              category.color === "#ffffff"
                                ? "#64748b"
                                : category.color,
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
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Inline Add Row */}
              {isAdmin && (
                <tr className="bg-bg/20 align-top">
                  <td className="px-6 py-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/80 bg-panel text-muted/60 select-none">
                      <GripVertical size={16} />
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 ${openNewColorPicker ? "pb-10" : ""}`}
                  >
                    <div className="rounded-xl border border-border/80 bg-panel/70 shadow-sm transition-all focus-within:border-accent/70 focus-within:shadow-md focus-within:shadow-accent/10">
                      <input
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Name your next category..."
                        className="w-full rounded-xl bg-transparent px-3.5 py-3 font-medium text-ink placeholder:text-muted/70 focus:outline-none"
                      />
                    </div>
                  </td>
                  <td
                    className={`px-6 py-4 ${openNewColorPicker ? "pb-10" : ""}`}
                  >
                    <div
                      className={`relative flex flex-col gap-2 ${openNewColorPicker ? "pb-14" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenNewColorPicker(!openNewColorPicker)
                        }
                        className="h-6 w-6 rounded-full border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
                        style={{ backgroundColor: newColor }}
                      />
                      {openNewColorPicker && (
                        <div className="absolute left-0 top-10 z-10 w-max rounded-xl border border-border bg-panel p-2 shadow-lg">
                          <div className="flex gap-2">
                            {fixedColors.map((c) => (
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
        {!categories.length && !isAdmin && (
          <div className="px-6 py-12 flex items-center justify-center text-sm font-medium text-muted">
            No categories available.
          </div>
        )}
      </div>
    </div>
  );
}
