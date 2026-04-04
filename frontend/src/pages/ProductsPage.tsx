import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { listCategories } from "../api/categories";
import { listPosConfigs } from "../api/posConfig";
import { archiveProducts, deleteProducts, listProducts } from "../api/products";
import type { Category, PosConfig, Product } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export function ProductsPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [posConfigs, setPosConfigs] = useState<PosConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePosConfigId, setActivePosConfigId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filters = useMemo(
    () => ({
      posConfigId: activePosConfigId || undefined,
    }),
    [activePosConfigId]
  );

  useEffect(() => {
    if (!accessToken) return;

    const boot = async () => {
      try {
        const pos = await listPosConfigs(accessToken);
        setPosConfigs(pos.posConfigs);
        const resolvedId = pos.posConfigs[0]?.id || "";
        setActivePosConfigId((current) => current || resolvedId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to initialize products screen");
      }
    };

    void boot();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !activePosConfigId) return;

    const load = async () => {
      try {
        const [cats, prods] = await Promise.all([
          listCategories(accessToken, activePosConfigId),
          listProducts(accessToken, filters),
        ]);
        setCategories(cats.categories);
        setProducts(prods.products);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load products");
      }
    };

    void load();
  }, [accessToken, activePosConfigId, filters]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const bulkArchive = async () => {
    if (!accessToken || !selectedIds.length) return;
    try {
      await archiveProducts(accessToken, selectedIds);
      setProducts((prev) => prev.map((product) => (selectedIds.includes(product.id) ? { ...product, active: false } : product)));
      setSelectedIds([]);
      setActionMenuOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to archive products");
    }
  };

  const bulkDelete = async () => {
    if (!accessToken || !selectedIds.length) return;
    try {
      await deleteProducts(accessToken, selectedIds);
      setProducts((prev) => prev.filter((product) => !selectedIds.includes(product.id)));
      setSelectedIds([]);
      setActionMenuOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete products");
    }
  };

  return (
    <section className="max-w-5xl">
      {/* Header matching the mock */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-[var(--c-border)]">
        <div className="flex items-center gap-4 pt-2">
          {isAdmin && (
            <Link to="/products/new" className="text-sm font-semibold px-4 py-1.5 rounded bg-[var(--c-panel-2)] text-[var(--c-ink)] hover:bg-[var(--c-border)] transition-colors">
              New
            </Link>
          )}
          <span className="text-xl font-bold font-head text-[var(--c-ink)]">Products</span>
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
                  <button onClick={bulkArchive} className="w-full text-left px-4 py-2 text-sm text-[var(--c-ink)] hover:bg-[var(--c-panel-2)] transition-colors">
                    Archive
                  </button>
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
        {/* POS filter just to maintain functionality, but styled minimally so it doesn't break table design */}
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
              <th className="px-2 py-3 font-semibold text-[var(--c-ink)]">Product</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Sale Prices</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Tax</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">UOM</th>
              <th className="px-3 py-3 font-semibold text-[var(--c-ink)]">Category</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={`border-b border-[var(--c-border)] hover:bg-[var(--c-panel-2)] transition-colors ${!product.active ? "opacity-50" : ""}`}>
                <td className="px-2 py-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                    className="rounded border-[var(--c-border)] bg-transparent focus:ring-1 focus:ring-[var(--c-accent)] text-[var(--c-accent)]"
                  />
                  <Link to={`/products/${product.id}`} className="font-medium hover:text-[var(--c-accent)] transition-colors">
                    {product.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-[var(--c-muted)]">${Number(product.price).toFixed(2)}</td>
                <td className="px-3 py-3 text-[var(--c-muted)]">{product.tax_rates?.rate || "0"}%</td>
                <td className="px-3 py-3 text-[var(--c-muted)] capitalize">{product.uom === "kg" ? "K.G" : product.uom}</td>
                <td className="px-3 py-3">
                  {product.categories ? (
                    <span 
                      className="px-2 py-1 rounded text-xs font-medium border"
                      style={{ 
                        backgroundColor: `${product.categories.color}20` || 'transparent', 
                        borderColor: product.categories.color,
                        color: product.categories.color 
                      }}
                    >
                      {product.categories.name}
                    </span>
                  ) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && <p className="px-2 py-6 text-sm text-[var(--c-muted)] text-center">No products found.</p>}
      </div>
    </section>
  );
}
