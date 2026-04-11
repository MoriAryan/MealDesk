import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { LayoutDashboard, ReceiptText, ChefHat, BarChart3, FolderTree } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  end?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/orders", label: "Records", icon: ReceiptText },
  { to: "/categories", label: "Categories", icon: FolderTree, adminOnly: true },
  { to: "/products", label: "Catalog", icon: ChefHat, adminOnly: true },
  { to: "/reports", label: "Insights", icon: BarChart3, adminOnly: true },
];

export function TopNav() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const visibleItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  return (
    <nav className="w-auto overflow-x-auto scrollbar-cafe bg-panel py-2 px-2 rounded-xl border border-border/60 shadow-sm inline-flex max-w-full">
      <div className="flex items-center gap-1.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-ink text-panel shadow-sm"
                  : "text-muted hover:bg-bg hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent/50"
              }`
            }
          >
            {({ isActive }) => (
               <>
                 <item.icon size={16} strokeWidth={isActive ? 3 : 2} className={isActive ? "text-panel" : "text-muted group-hover:text-ink transition-colors"} />
                 {item.label}
               </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
