import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listCategories } from "../api/categories";
import { listPosConfigs } from "../api/posConfig";
import {
  createProduct,
  getProduct,
  listTaxRates,
  updateProduct,
} from "../api/products";
import type {
  Category,
  PosConfig,
  Product,
  ProductVariant,
  TaxRate,
} from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import { Upload, Image as ImageIcon, X } from "lucide-react";

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
  const [price, setPrice] = useState<number | "">(0);
  const [uom, setUom] = useState<Product["uom"]>("unit");
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      !!name.trim() &&
      !!categoryId &&
      !!taxRateId &&
      !!posConfigId &&
      price !== "",
    [name, categoryId, taxRateId, posConfigId, price],
  );

  useEffect(() => {
    if (!accessToken) return;

    const loadBase = async () => {
      try {
        const [pos, tax] = await Promise.all([
          listPosConfigs(accessToken),
          listTaxRates(accessToken),
        ]);
        setPosConfigs(pos.posConfigs);
        setTaxRates(tax.taxRates);
        const defaultPos = pos.posConfigs[0]?.id || "";
        setPosConfigId((current) => current || defaultPos);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load product metadata",
        );
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
        setImageUrl(product.image_url || null);
        setVariants(
          response.variants.map((variant) => ({
            id: variant.id,
            attributeName: variant.attribute_name,
            value: variant.value,
            unit: variant.unit,
            extraPrice: Number(variant.extra_price),
          })),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load product");
      }
    };

    void loadProduct();
  }, [accessToken, isCreate, productId]);

  const readImageFile = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });

    return dataUrl;
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file) return;

    try {
      const nextImageUrl = await readImageFile(file);
      setImageUrl(nextImageUrl);

      if (!isCreate && accessToken && productId && isAdmin) {
        await updateProduct(accessToken, productId, { imageUrl: nextImageUrl });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load image");
    }
  };

  const removeImage = async () => {
    setImageUrl(null);
    if (!isCreate && accessToken && productId && isAdmin) {
      try {
        await updateProduct(accessToken, productId, { imageUrl: null });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to clear image");
      }
    }
  };

  const effectiveTaxRateId = taxRateId || taxRates[0]?.id || "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !isAdmin || !canSubmit) return;

    const payload = {
      posConfigId,
      categoryId,
      taxRateId: effectiveTaxRateId,
      name,
      description,
      price: Number(price),
      uom,
      active,
      imageUrl,
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

  const inputClass =
    "w-full bg-transparent border-0 border-b border-border px-1 py-1.5 focus:ring-0 focus:border-[var(--color-accent)] disabled:opacity-50 text-ink placeholder-[var(--color-muted)] rounded-none";
  const selectClass =
    "w-full bg-transparent border-0 border-b border-border px-1 py-1.5 focus:ring-0 focus:border-[var(--color-accent)] disabled:opacity-50 text-ink rounded-none";

  return (
    <section className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8 border-b border-border pb-2 pt-2">
        <Link
          to="/products"
          className="text-xl font-bold font-head text-muted hover:text-ink transition-colors"
        >
          Products
        </Link>
        <span className="text-xl font-bold font-head text-muted">/</span>
        <span className="text-xl font-bold font-head text-ink">
          {isCreate ? "New" : name || "Unnamed Product"}
        </span>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="flex flex-col gap-6">
        <div className="rounded-3xl border border-border bg-panel p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Media</p>
              <h3 className="mt-1 text-lg font-bold text-ink">Product image</h3>
            </div>
            {imageUrl && isAdmin && (
              <button
                type="button"
                onClick={() => void removeImage()}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-red-500/40 hover:text-red-500"
              >
                <X size={12} /> Remove
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-bg/40">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name || "Product preview"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-muted">
                  <ImageIcon size={28} />
                  <span className="text-xs font-semibold uppercase tracking-widest">No image</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-dashed border-border bg-bg/35 px-4 py-5 transition-colors hover:border-accent/40 hover:bg-bg/55">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <Upload size={14} className="text-accent" /> Upload or replace image
                </span>
                <span className="text-xs text-muted">
                  PNG, JPG, or WEBP. Existing products save the image immediately.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!isAdmin}
                  className="hidden"
                  onChange={(event) => void handleImageUpload(event.target.files?.[0] || null)}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                  Or paste an image URL
                </span>
                <input
                  disabled={!isAdmin}
                  value={imageUrl || ""}
                  onChange={(event) => setImageUrl(event.target.value || null)}
                  className={inputClass}
                  placeholder="https://..."
                />
              </label>
            </div>
          </div>
        </div>

        {/* Global Product Name (Above Tabs) */}
        <div>
          <label className="block text-sm font-semibold text-ink mb-1">
            Product
          </label>
          <input
            disabled={!isAdmin}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g Eric Smith"
            className={inputClass + " text-lg font-medium"}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("general")}
            className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${tab === "general" ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            General Info
          </button>
          <button
            type="button"
            onClick={() => setTab("variants")}
            className={`pb-2 text-sm font-semibold transition-colors border-b-2 ${tab === "variants" ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            Variant
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-75">
          {tab === "general" && (
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-8 mt-4">
              {/* Left Column */}
              <div className="flex flex-col gap-8">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Category
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Product Description
                  </label>
                  <input
                    disabled={!isAdmin}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="e.g Burger with cheese"
                    className={inputClass}
                  />
                </div>

                {/* Admin/Internal Settings placed here so they aren't totally lost, but styled cleanly */}
                <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-border border-dashed">
                  <div className="text-xs uppercase tracking-widest text-muted font-bold mb-2">
                    Internal Info
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink mb-1">
                      POS Terminal
                    </label>
                    <select
                      disabled={!isAdmin || !isCreate}
                      value={posConfigId}
                      onChange={(event) => setPosConfigId(event.target.value)}
                      className={selectClass + " text-sm"}
                    >
                      {posConfigs.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      disabled={!isAdmin}
                      checked={active}
                      onChange={(event) => setActive(event.target.checked)}
                      className="themed-checkbox"
                    />
                    Active Product
                  </label>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-8">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-ink mb-1">
                      Prices
                    </label>
                    <div className="flex items-baseline">
                      <span className="text-muted mr-1">$</span>
                      <input
                        type="number"
                        step="0.01"
                        disabled={!isAdmin}
                        value={price}
                        onChange={(event) =>
                          setPrice(
                            event.target.value === ""
                              ? ""
                              : Number(event.target.value),
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="w-24">
                    <select
                      disabled={!isAdmin}
                      value={uom}
                      onChange={(event) => {
                        const newUom = event.target.value as Product["uom"];
                        setUom(newUom);
                        setVariants((prev) =>
                          prev.map((v) => ({ ...v, unit: newUom })),
                        );
                      }}
                      className={selectClass + " font-medium uppercase"}
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit === "unit"
                            ? "Unit"
                            : unit === "kg"
                              ? "K.G"
                              : unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1">
                    Tax
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={effectiveTaxRateId}
                    onChange={(event) => setTaxRateId(event.target.value)}
                    className={selectClass}
                  >
                    <option value="" disabled>
                      Select tax
                    </option>
                    {taxRates.map((tax) => (
                      <option key={tax.id} value={tax.id}>
                        {tax.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === "variants" && (
            <div className="mt-4 flex flex-col gap-2">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-border text-sm font-semibold text-ink mb-2 px-1">
                <div className="col-span-3">Attributes</div>
                <div className="col-span-3">Value</div>
                <div className="col-span-3">Unit</div>
                <div className="col-span-2">Extra Prices</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {variants.map((variant, index) => (
                <div
                  key={variant.id || `new-${index}`}
                  className="grid grid-cols-12 gap-4 items-center group px-1"
                >
                  <div className="col-span-3">
                    <input
                      disabled={!isAdmin}
                      value={variant.attributeName}
                      onChange={(event) =>
                        setVariants((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index
                              ? { ...row, attributeName: event.target.value }
                              : row,
                          ),
                        )
                      }
                      placeholder="e.g Pack"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      disabled={!isAdmin}
                      value={variant.value}
                      onChange={(event) =>
                        setVariants((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index
                              ? { ...row, value: event.target.value }
                              : row,
                          ),
                        )
                      }
                      placeholder="e.g 6"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      disabled={true}
                      value={variant.unit}
                      onChange={(event) =>
                        setVariants((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  unit: event.target
                                    .value as ProductVariant["unit"],
                                }
                              : row,
                          ),
                        )
                      }
                      className={selectClass + " capitalize"}
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit === "unit"
                            ? "Unit"
                            : unit === "kg"
                              ? "K.G"
                              : unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 relative">
                    <span className="absolute left-0 top-2.5 text-muted text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isAdmin}
                      value={variant.extraPrice}
                      onChange={(event) =>
                        setVariants((prev) =>
                          prev.map((row, rowIndex) =>
                            rowIndex === index
                              ? {
                                  ...row,
                                  extraPrice: Number(event.target.value),
                                }
                              : row,
                          ),
                        )
                      }
                      className={inputClass + " pl-3"}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          setVariants((prev) =>
                            prev.filter((_, rowIndex) => rowIndex !== index),
                          )
                        }
                        className="text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                        title="Delete Variant"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
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
                    )}
                  </div>
                </div>
              ))}

              {/* Add New Variant Button */}
              {isAdmin && (
                <div className="mt-2 text-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((prev) => [
                        ...prev,
                        {
                          attributeName: "",
                          value: "",
                          unit: uom,
                          extraPrice: 0,
                        },
                      ])
                    }
                    className="px-1 font-medium text-accent transition-colors hover:text-accent-hover"
                  >
                    New
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Save Button */}
        {isAdmin && (
          <div className="pt-6 border-t border-border flex justify-end">
            <button
              disabled={!canSubmit}
              type="submit"
              className="rounded-lg bg-accent px-8 py-2 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
            >
              Save Product
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
