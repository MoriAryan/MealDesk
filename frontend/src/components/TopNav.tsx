import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type NavItem = {
  to: string;
  label: string;
  adminOnly?: boolean;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "Overview", end: true },
  { to: "/orders", label: "Order Log" },
  { to: "/payments", label: "Payments" },
  { to: "/reports", label: "Insights", adminOnly: true },
  { to: "/customers", label: "Guests", adminOnly: true },
  { to: "/products", label: "Menu", adminOnly: true },
  { to: "/categories", label: "Categories", adminOnly: true },
  { to: "/payment-methods", label: "Tender Types", adminOnly: true },
];

export function TopNav() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const visibleItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <nav className="w-full overflow-x-auto scrollbar-cafe">
      <div className="flex min-w-max items-center gap-1 py-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-3 py-2 text-[12px] font-semibold tracking-wide transition-all duration-200 ${
                isActive
                  ? "border-accent text-ink"
                  : "border-transparent text-muted hover:border-border hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
