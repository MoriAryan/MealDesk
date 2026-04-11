import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { listPosConfigs } from "../api/posConfig";
import { archiveProducts, deleteProducts, listProducts } from "../api/products";
import type { PosConfig, Product } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

export function ProductsPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [posConfigs, setPosConfigs] = useState<PosConfig[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activePosConfigId, setActivePosConfigId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [posMenuOpen, setPosMenuOpen] = useState(false);

  const actionMenuRef = useRef<HTMLDivElement>(null);
  const posMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
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
    function handleClickOutside(event: MouseEvent) {
      if (
        posMenuRef.current &&
        !posMenuRef.current.contains(event.target as Node)
      ) {
        setPosMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activePosConfigName =
    activePosConfigId === "" 
      ? "All Terminals"
      : posConfigs.find((pos) => pos.id === activePosConfigId)?.name || "All Terminals";

  const filters = useMemo(
    () => ({
      posConfigId: activePosConfigId || undefined,
    }),
    [activePosConfigId],
  );

  useEffect(() => {
    if (!accessToken) return;

    const boot = async () => {
      try {
        const pos = await listPosConfigs(accessToken);
        setPosConfigs(pos.posConfigs);
        // Default to "" to show all products globally unless previously set
        setActivePosConfigId((current) => current || "");
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to initialize products screen",
        );
      }
    };

    void boot();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const load = async () => {
      try {
        const prods = await listProducts(accessToken, filters);
        setProducts(prods.products);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load products");
      }
    };

    void load();
  }, [accessToken, filters]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const bulkArchive = async () => {
    if (!accessToken || !selectedIds.length) return;
    try {
      await archiveProducts(accessToken, selectedIds);
      setProducts((prev) =>
        prev.map((product) =>
          selectedIds.includes(product.id)
            ? { ...product, active: false }
            : product,
        ),
      );
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
      setProducts((prev) =>
        prev.filter((product) => !selectedIds.includes(product.id)),
      );
      setSelectedIds([]);
      setActionMenuOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete products");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Products
          </h1>
          <p className="text-muted text-sm border-l-2 border-accent pl-2">
            Manage the catalog of offerings on your POS terminals.
          </p>
        </div>

        {/* Action Right Menu */}
        <div className="flex items-center gap-3">
          {isAdmin && selectedIds.length > 0 && (
            <>
              <span className="text-xs font-bold tracking-widest uppercase bg-accent/10 text-accent px-3 py-1.5 rounded-lg border border-accent/20">
                {selectedIds.length} Selected
              </span>
              <div className="relative" ref={actionMenuRef}>
                <button
                  onClick={() => setActionMenuOpen(!actionMenuOpen)}
                  className="text-sm font-semibold bg-panel text-ink px-4 py-2 rounded-xl border border-border/80 shadow-sm hover:border-accent hover:text-accent flex items-center gap-2 transition-all"
                >
                  <span>⚙</span> Action
                </button>
                {actionMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-36 bg-panel/95 backdrop-blur-xl border border-border rounded-xl shadow-artisanal z-50 p-1">
                    <button
                      onClick={bulkArchive}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-ink rounded-lg hover:bg-bg transition-colors"
                    >
                      Archive Items
                    </button>
                    <button
                      onClick={bulkDelete}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-red-500 rounded-lg hover:bg-red-500/10 transition-colors mt-1"
                    >
                      Delete Selected
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {isAdmin && (
            <Link
              to="/products/new"
              className="text-sm tracking-wide font-bold uppercase px-5 py-2.5 rounded-xl bg-accent text-white shadow-md shadow-accent/20 hover:bg-accent-hover transition-all"
            >
              + New Product
            </Link>
          )}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
          {error}
        </p>
      )}

      <div className="flex gap-4">
        <div className="relative" ref={posMenuRef}>
          <button
            type="button"
            onClick={() => setPosMenuOpen((open) => !open)}
            className="inline-flex min-w-56 items-center justify-between gap-4 rounded-xl border border-border bg-panel px-4 py-2 text-sm font-medium text-ink shadow-sm transition-all hover:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/40"
            aria-haspopup="listbox"
            aria-expanded={posMenuOpen}
          >
            <span className="truncate">{activePosConfigName}</span>
            <ChevronDown
              size={18}
              className={`shrink-0 text-muted transition-transform ${posMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {posMenuOpen && (
            <div className="absolute z-20 mt-2 min-w-full overflow-hidden rounded-xl border border-border bg-panel shadow-lg">
              <ul role="listbox" className="py-1">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePosConfigId("");
                      setPosMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${activePosConfigId === "" ? "bg-accent/20 font-semibold text-ink" : "text-ink hover:bg-bg/60"}`}
                  >
                    All Terminals
                  </button>
                </li>
                {posConfigs.map((pos) => (
                  <li key={pos.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePosConfigId(pos.id);
                        setPosMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${activePosConfigId === pos.id ? "bg-accent/20 font-semibold text-ink" : "text-ink hover:bg-bg/60"}`}
                    >
                      {pos.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-border/80 bg-panel shadow-sm overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-bg/50 border-b border-border">
              <tr className="text-muted/80 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4 w-12">Select</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Tax</th>
                <th className="px-6 py-4">UOM</th>
                <th className="px-6 py-4">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {products.map((product) => (
                <tr
                  key={product.id}
                  className={`transition-colors hover:bg-bg/30 ${!product.active ? "opacity-40 grayscale" : ""}`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="themed-checkbox"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {!product.active && (
                        <span className="px-1.5 py-0.5 rounded bg-muted/20 text-[9px] uppercase font-bold text-muted">
                          Archived
                        </span>
                      )}
                      <Link
                        to={`/products/${product.id}`}
                        className="font-semibold text-ink hover:text-accent transition-colors text-base"
                      >
                        {product.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-ink">
                    ${Number(product.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-muted">
                    {product.tax_rates?.rate || "0"}%
                  </td>
                  <td className="px-6 py-4 text-muted capitalize">
                    {product.uom === "kg" ? "K.G" : product.uom}
                  </td>
                  <td className="px-6 py-4">
                    {product.categories ? (
                      <span
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border"
                        style={{
                          backgroundColor: product.categories.color
                            ? `${product.categories.color}15`
                            : "transparent",
                          borderColor: `${product.categories.color}40`,
                          color: product.categories.color,
                        }}
                      >
                        {product.categories.name}
                      </span>
                    ) : (
                      <span className="text-muted/50 italic font-medium">
                        Uncategorized
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!products.length && (
          <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
            <span className="text-4xl mb-4 opacity-20">🏷️</span>
            <p className="text-lg font-semibold text-ink">No products found.</p>
            <p className="text-sm text-muted mt-1">
              Add items to populate your terminal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
