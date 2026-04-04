import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listCategories } from "../api/categories";
import { listPosConfigs } from "../api/posConfig";
import { createProduct, getProduct, listTaxRates, updateProduct } from "../api/products";
import type { Category, PosConfig, Product, ProductVariant, TaxRate } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

const units: Product["uom"][] = ["unit", "kg", "liter", "gram", "ml"];

type VariantInput = {
  id?: string;
  attributeName: string;
  value: string;
  unit: ProductVariant["unit"];
  extraPrice: number;
};

export function ProductEditorPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navigate = useNavigate();
  const { productId } = useParams();
  const isCreate = productId === "new";

  const [tab, setTab] = useState<"general" | "variants">("general");
  const [posConfigs, setPosConfigs] = useState<PosConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);

  const [posConfigId, setPosConfigId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [taxRateId, setTaxRateId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [uom, setUom] = useState<Product["uom"]>("unit");
  const [active, setActive] = useState(true);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => !!name.trim() && !!categoryId && !!taxRateId && !!posConfigId && Number.isFinite(price),
    [name, categoryId, taxRateId, posConfigId, price]
  );

  useEffect(() => {
    if (!accessToken) return;

    const loadBase = async () => {
      try {
        const [pos, tax] = await Promise.all([listPosConfigs(accessToken), listTaxRates(accessToken)]);
        setPosConfigs(pos.posConfigs);
        setTaxRates(tax.taxRates);
        const defaultPos = pos.posConfigs[0]?.id || "";
        setPosConfigId((current) => current || defaultPos);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product metadata");
      }
    };

    void loadBase();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !posConfigId) return;

    const loadCategoriesForPos = async () => {
      try {
        const response = await listCategories(accessToken, posConfigId);
        setCategories(response.categories);
        setCategoryId((current) => current || response.categories[0]?.id || "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load categories");
      }
    };

    void loadCategoriesForPos();
  }, [accessToken, posConfigId]);

  useEffect(() => {
    if (!accessToken || isCreate || !productId) return;

    const loadProduct = async () => {
      try {
        const response = await getProduct(accessToken, productId);
        const product = response.product;
        setPosConfigId(product.pos_config_id);
        setCategoryId(product.category_id);
        setTaxRateId(product.tax_rate_id);
        setName(product.name);
        setDescription(product.description || "");
        setPrice(Number(product.price));
        setUom(product.uom);
        setActive(product.active);
        setVariants(
          response.variants.map((variant) => ({
            id: variant.id,
            attributeName: variant.attribute_name,
            value: variant.value,
            unit: variant.unit,
            extraPrice: Number(variant.extra_price),
          }))
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product");
      }
    };

    void loadProduct();
  }, [accessToken, isCreate, productId]);

  useEffect(() => {
    if (!taxRates.length || taxRateId) return;
    setTaxRateId(taxRates[0].id);
  }, [taxRates, taxRateId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !isAdmin || !canSubmit) return;

    const payload = {
      posConfigId,
      categoryId,
      taxRateId,
      name,
      description,
      price,
      uom,
      active,
      variants,
    };

    try {
      if (isCreate) {
        await createProduct(accessToken, payload);
      } else if (productId) {
        await updateProduct(accessToken, productId, payload);
      }
      navigate("/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save product");
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{isCreate ? "New Product" : "Edit Product"}</h2>
          <p className="text-sm text-[var(--c-muted)]">Use General Info and Variants tabs to maintain catalog details.</p>
        </div>
        <Link to="/products" className="rounded-lg border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2 text-sm">
          Back to Products
        </Link>
      </div>

      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => setTab("general")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "general" ? "bg-[var(--c-accent)] text-white" : "bg-[var(--c-panel)]"}`}
        >
          General Info
        </button>
        <button
          onClick={() => setTab("variants")}
          className={`rounded-lg px-4 py-2 text-sm ${tab === "variants" ? "bg-[var(--c-accent)] text-white" : "bg-[var(--c-panel)]"}`}
        >
          Variants
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[var(--c-border)] bg-[var(--c-panel)] p-4">
        {tab === "general" && (
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--c-muted)]">POS Terminal</span>
              <select
                disabled={!isAdmin || !isCreate}
                value={posConfigId}
                onChange={(event) => setPosConfigId(event.target.value)}
                className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
              >
                {posConfigs.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--c-muted)]">Category</span>
              <select
                disabled={!isAdmin}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--c-muted)]">Tax Rate</span>
              <select
                disabled={!isAdmin}
                value={taxRateId}
                onChange={(event) => setTaxRateId(event.target.value)}
                className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
              >
                {taxRates.map((tax) => (
                  <option key={tax.id} value={tax.id}>
                    {tax.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--c-muted)]">UOM</span>
              <select
                disabled={!isAdmin}
                value={uom}
                onChange={(event) => setUom(event.target.value as Product["uom"])}
                className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--c-muted)]">Name</span>
              <input
                disabled={!isAdmin}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
              />
            </label>

            <label className="text-sm md:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--c-muted)]">Description</span>
              <textarea
                disabled={!isAdmin}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
              />
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-[var(--c-muted)]">Base Price</span>
              <input
                type="number"
                step="0.01"
                disabled={!isAdmin}
                value={price}
                onChange={(event) => setPrice(Number(event.target.value))}
                className="w-full rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 disabled:bg-[var(--c-panel-2)]"
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />
              Active Product
            </label>
          </div>
        )}

        {tab === "variants" && (
          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={variant.id || `new-${index}`} className="grid gap-2 rounded-xl border border-[var(--c-border)] bg-white p-3 md:grid-cols-4">
                <input
                  disabled={!isAdmin}
                  value={variant.attributeName}
                  onChange={(event) =>
                    setVariants((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, attributeName: event.target.value } : row)))
                  }
                  placeholder="Attribute (size)"
                  className="rounded-lg border border-[var(--c-border)] px-2 py-1.5"
                />
                <input
                  disabled={!isAdmin}
                  value={variant.value}
                  onChange={(event) =>
                    setVariants((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, value: event.target.value } : row)))
                  }
                  placeholder="Value (small)"
                  className="rounded-lg border border-[var(--c-border)] px-2 py-1.5"
                />
                <select
                  disabled={!isAdmin}
                  value={variant.unit}
                  onChange={(event) =>
                    setVariants((prev) =>
                      prev.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, unit: event.target.value as ProductVariant["unit"] } : row
                      )
                    )
                  }
                  className="rounded-lg border border-[var(--c-border)] px-2 py-1.5"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    disabled={!isAdmin}
                    value={variant.extraPrice}
                    onChange={(event) =>
                      setVariants((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, extraPrice: Number(event.target.value) } : row
                        )
                      )
                    }
                    placeholder="Extra"
                    className="w-full rounded-lg border border-[var(--c-border)] px-2 py-1.5"
                  />
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setVariants((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                      className="rounded-lg border border-red-300 bg-red-50 px-2 py-1.5 text-red-700"
                    >
                      X
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setVariants((prev) => [...prev, { attributeName: "", value: "", unit: "unit", extraPrice: 0 }])
                }
                className="rounded-lg border border-[var(--c-border)] bg-white px-3 py-2 text-sm"
              >
                Add Variant
              </button>
            )}
          </div>
        )}

        {isAdmin && (
          <button
            disabled={!canSubmit}
            className="rounded-lg bg-[var(--c-accent)] px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            Save Product
          </button>
        )}
      </form>
    </section>
  );
}
