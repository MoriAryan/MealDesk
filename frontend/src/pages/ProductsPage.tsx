import { useEffect, useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");
  const [activePosConfigId, setActivePosConfigId] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      posConfigId: activePosConfigId || undefined,
      categoryId: activeCategoryId || undefined,
      search: search.trim() || undefined,
    }),
    [activePosConfigId, activeCategoryId, search]
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete products");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Products</h2>
          <p className="text-sm text-[var(--c-muted)]">Manage product catalog and variants with terminal-specific filters.</p>
        </div>
        {isAdmin && (
          <Link to="/products/new" className="rounded-lg bg-[var(--c-accent)] px-4 py-2 font-medium text-white">
            New Product
          </Link>
        )}
      </div>

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4 md:grid-cols-3">
        <select
          className="rounded-lg border border-[var(--c-border)] bg-white px-3 py-2"
          value={activePosConfigId}
          onChange={(event) => setActivePosConfigId(event.target.value)}
        >
          {posConfigs.map((pos) => (
            <option key={pos.id} value={pos.id}>
              {pos.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-[var(--c-border)] bg-white px-3 py-2"
          value={activeCategoryId}
          onChange={(event) => setActiveCategoryId(event.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Search product"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-lg border border-[var(--c-border)] bg-white px-3 py-2"
        />
      </div>

      {isAdmin && selectedIds.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] p-3">
          <button onClick={() => void bulkArchive()} className="rounded-md border border-[var(--c-border)] bg-white px-3 py-2 text-sm">
            Archive Selected
          </button>
          <button onClick={() => void bulkDelete()} className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            Delete Selected
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--c-panel-2)] text-left">
            <tr>
              <th className="px-3 py-2">Select</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Tax</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-t border-[var(--c-border)]">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={selectedIds.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                  />
                </td>
                <td className="px-3 py-2 font-medium">
                  <Link to={`/products/${product.id}`} className="underline decoration-[var(--c-accent)] decoration-2 underline-offset-2">
                    {product.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{product.categories?.name || "-"}</td>
                <td className="px-3 py-2">Rs {Number(product.price).toFixed(2)}</td>
                <td className="px-3 py-2">{product.tax_rates?.label || "-"}</td>
                <td className="px-3 py-2">{product.active ? "Active" : "Archived"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!products.length && <p className="px-3 py-6 text-sm text-[var(--c-muted)]">No products found for the selected filters.</p>}
      </div>
    </section>
  );
}
