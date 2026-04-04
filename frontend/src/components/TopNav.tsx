import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";

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
      { to: "/orders", label: "Orders" },
      { to: "/payments", label: "Payments" },
      { to: "/customers", label: "Customer" },
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
    title: "Dashboard",
    items: [
      { to: "/", label: "Dashboard" },
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
    <nav ref={navRef} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-8">
      {menus.map((menu) => (
        <div key={menu.title} className="relative group">
          <button
            onClick={() => setOpenMenu(openMenu === menu.title ? null : menu.title)}
            className={`flex w-full items-center justify-between md:justify-center gap-1.5 py-2.5 md:py-2 text-sm font-medium tracking-wide transition-colors ${openMenu === menu.title ? 'text-accent' : 'text-ink hover:text-accent'}`}
          >
            {menu.title}
            <ChevronDown 
              size={14} 
              className={`transition-transform duration-300 ${openMenu === menu.title ? 'rotate-180' : 'opacity-70 group-hover:opacity-100'}`} 
            />
          </button>

          {openMenu === menu.title && (
            <div className="md:absolute top-full left-0 mt-2 w-full md:w-48 rounded-xl border border-border bg-panel/95 backdrop-blur-xl shadow-[var(--shadow-artisanal)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {menu.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setOpenMenu(null)}
                  className={({ isActive }) =>
                    `block px-4 py-2.5 text-sm transition-all relative ${
                      isActive
                        ? "text-accent font-semibold bg-accent/5"
                        : "text-muted hover:text-ink hover:bg-bg/80"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent rounded-r-md"></span>}
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
