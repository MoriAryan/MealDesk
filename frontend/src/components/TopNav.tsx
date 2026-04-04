import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/categories", label: "Categories" },
  { to: "/payment-methods", label: "Payment Methods" },
  { to: "/pos-config", label: "POS Config" },
  { to: "/pos", label: "POS Terminal" },
  { to: "/kitchen-display", label: "Kitchen Display" },
  { to: "/customer-display", label: "Customer Display" },
  { to: "/self-ordering", label: "Self Ordering" },
  { to: "/reports", label: "Reports" },
];

export function TopNav() {
  return (
    <nav className="flex flex-wrap items-center gap-3">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `rounded-full px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--c-accent)] text-white"
                : "bg-[var(--c-panel)] text-[var(--c-ink)] hover:bg-[var(--c-panel-2)]"
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
