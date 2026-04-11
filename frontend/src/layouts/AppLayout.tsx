import { Outlet, Link, useLocation } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../theme/ThemeProvider";
import { Sun, Moon, LogOut } from "lucide-react";
import { MealDeskWordmark } from "../components/MealDeskBrand";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isPos = location.pathname === "/pos" || location.pathname === "/pos/";

  return (
    <div className={`bg-bg text-ink selection:bg-accent/20 flex flex-col ${isPos ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"}`}>

      <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md shrink-0">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-4 md:px-7">
          {/* Logo */}
          <Link to="/" className="flex items-center transition-opacity hover:opacity-85">
            <MealDeskWordmark size="text-xl" showTagline={false} />
          </Link>

          {/* Primary Nav inline if possible, or just below within header */}
          <div className="hidden md:flex flex-1 justify-center items-center">
             <TopNav />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel text-muted transition-colors hover:border-accent hover:text-accent shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === "dark"
                ? <Sun size={15} className="transition-transform hover:rotate-45" />
                : <Moon size={15} className="transition-transform hover:-rotate-12" />}
            </button>
            <div className="h-6 w-px bg-border/80" />
            <div className="flex items-center gap-2">
              <span className="hidden text-sm font-semibold text-ink sm:inline">
                {user?.name || user?.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex items-center justify-center p-2 rounded-full border border-border bg-panel text-muted hover:border-danger hover:text-danger hover:bg-danger/10 transition-colors shadow-sm"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-border px-4 pb-3">
            <TopNav />
        </div>
      </header>

      <main className={
        isPos
          ? "w-full flex-1 flex overflow-hidden min-h-0"
          : "mx-auto w-full flex-1 max-w-7xl px-4 py-6 md:px-6 md:py-10"
      }>
        <Outlet />
      </main>
    </div>
  );
}
