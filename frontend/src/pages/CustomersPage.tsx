import { useEffect, useState, useRef } from "react";
import { X, Search, ChevronDown } from "lucide-react";
import { listCustomers, createCustomer } from "../api/customers";
import type { Customer } from "../api/types";
import { useAuth } from "../auth/AuthProvider";

// Indian states list
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "UAE",
  "Canada",
  "Australia",
  "Other",
];

// ─── New Customer Modal ────────────────────────────────────────────────────────

function CustomerFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (customer: Customer) => void;
}) {
  const { accessToken } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    country: "India",
  });
  const [stateSearch, setStateSearch] = useState("");
  const [stateDropOpen, setStateDropOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const stateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        stateRef.current &&
        !stateRef.current.contains(event.target as Node)
      ) {
        setStateDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStates = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase()),
  );

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setErr("Customer name is required.");
      return;
    }
    if (!accessToken) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await createCustomer(accessToken, form);
      onSave(res.customer);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-panel shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-ink">New Customer</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-bg hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-3 overflow-y-auto max-h-[70vh]">
          {err && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-400/30 rounded-lg px-3 py-2">
              {err}
            </p>
          )}

          {/* Name */}
          <input
            type="text"
            placeholder="e.g. Eric Smith"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent transition-colors"
          />

          {/* Email */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5">
            <span className="text-muted text-sm">✉</span>
            <input
              type="email"
              placeholder="eric@odoo.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="flex-1 bg-transparent text-sm text-ink placeholder-muted focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5">
            <span className="text-muted text-sm">📞</span>
            <input
              type="tel"
              placeholder="+91 98989898989"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="flex-1 bg-transparent text-sm text-ink placeholder-muted focus:outline-none"
            />
          </div>

          <p className="text-xs font-semibold text-muted uppercase tracking-wider pt-1">
            Address
          </p>

          {/* Street 1 */}
          <input
            type="text"
            placeholder="St, 1"
            value={form.street1}
            onChange={(e) => handleChange("street1", e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent transition-colors"
          />

          {/* Street 2 */}
          <input
            type="text"
            placeholder="St, 2"
            value={form.street2}
            onChange={(e) => handleChange("street2", e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent transition-colors"
          />

          {/* City + State */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="City"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink placeholder-muted focus:outline-none focus:border-accent transition-colors"
            />

            {/* State dropdown with autocomplete */}
            <div className="relative" ref={stateRef}>
              <button
                type="button"
                onClick={() => setStateDropOpen(!stateDropOpen)}
                className="w-full flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-accent transition-colors"
              >
                <span className={form.state ? "text-ink" : "text-muted"}>
                  {form.state || "State"}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-muted transition-transform ${stateDropOpen ? "rotate-180" : ""}`}
                />
              </button>

              {stateDropOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-panel border border-border rounded-xl shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <input
                      type="text"
                      placeholder="Search state…"
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      autoFocus
                      className="w-full text-sm bg-bg rounded-md px-2 py-1.5 text-ink placeholder-muted border border-border focus:outline-none"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredStates.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          handleChange("state", s);
                          setStateDropOpen(false);
                          setStateSearch("");
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          form.state === s
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-ink hover:bg-bg"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    {filteredStates.length === 0 && (
                      <p className="px-3 py-4 text-xs text-muted text-center">
                        No results
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Country */}
          <select
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-accent transition-colors"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-border bg-bg/30">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border text-sm font-medium text-muted py-2.5 hover:bg-bg hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-accent text-white text-sm font-semibold py-2.5 hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customers Page ────────────────────────────────────────────────────────────

export function CustomersPage() {
  const { accessToken } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await listCustomers(accessToken);
      setCustomers(res.customers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [accessToken]);

  const handleSave = (newCustomer: Customer) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setShowForm(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section className="max-w-5xl">
      {showForm && (
        <CustomerFormModal
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-1.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            New
          </button>
          <span className="text-xl font-bold text-ink">Customer</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search Customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 rounded-lg border border-border bg-bg text-sm text-ink placeholder-muted focus:outline-none focus:border-accent transition-colors w-52"
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-400 bg-red-400/10 px-3 py-2 text-sm text-red-500">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted text-sm">
          Loading customers…
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-bg/60 border-b border-border">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="themed-checkbox" readOnly />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider text-right">
                  Total Sales
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border hover:bg-panel transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="themed-checkbox"
                      readOnly
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      {c.email && (
                        <span className="text-sm text-muted flex items-center gap-1">
                          <span className="text-[10px]">✉</span> {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="text-sm text-muted flex items-center gap-1">
                          <span className="text-[10px]">📞</span> {c.phone}
                        </span>
                      )}
                      {!c.email && !c.phone && (
                        <span className="text-muted">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">
                    ${Number(c.total_sales ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-16 text-center text-muted text-sm"
                  >
                    {search
                      ? "No customers match your search."
                      : "No customers yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
