import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";

type DropdownItem = {
  to: string;
  label: string;
};

type MenuConfig = {
  title: string;
  items: DropdownItem[];
};

const menus: MenuConfig[] = [
  {
    title: "Orders",
    items: [
      { to: "/pos", label: "Orders" },
      { to: "/payment-methods", label: "Payment" },
      { to: "/customers", label: "Customer" }, // Optional link for later
    ],
  },
  {
    title: "Products",
    items: [
      { to: "/products", label: "Products" },
      { to: "/categories", label: "Category" },
    ],
  },
  {
    title: "Reporting",
    items: [
      { to: "/", label: "Dashboard" },
      { to: "/reports", label: "Reports" }, // Optional link for later
    ],
  },
];

export function TopNav() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav ref={navRef} className="flex items-center gap-6">
      {menus.map((menu) => (
        <div key={menu.title} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === menu.title ? null : menu.title)}
            className="flex items-center gap-1 py-2 text-sm font-semibold tracking-wide text-[var(--c-ink)] hover:text-[var(--c-accent)] transition-colors"
          >
            {menu.title}
          </button>

          {openMenu === menu.title && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-[var(--c-border)] bg-[var(--c-panel)] shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {menu.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpenMenu(null)}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-[var(--c-panel-2)] text-[var(--c-accent)] font-medium"
                        : "text-[var(--c-ink)] hover:bg-[var(--c-bg)]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
