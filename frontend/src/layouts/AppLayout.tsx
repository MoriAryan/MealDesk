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

      <header className="sticky top-0 z-50 border-b border-border bg-panel/90 backdrop-blur-md shrink-0">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-3 md:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center transition-opacity hover:opacity-85">
            <MealDeskWordmark size="text-xl" showTagline={false} />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg text-muted transition-colors hover:border-accent/40 hover:text-accent"
              aria-label="Toggle Theme"
            >
              {theme === "dark"
                ? <Sun size={15} className="transition-transform hover:rotate-45" />
                : <Moon size={15} className="transition-transform hover:-rotate-12" />}
            </button>
            <div className="h-5 w-px bg-border/80" />
            <span className="hidden text-xs font-medium text-muted sm:inline">
              {user?.name || user?.email?.split('@')[0]}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-md border border-border bg-bg px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-accent/40 hover:text-accent"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Primary Nav */}
        <div className="border-t border-border">
          <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6">
            <TopNav />
          </div>
        </div>
      </header>

      <main className={
        isPos
          ? "w-full flex-1 flex overflow-hidden min-h-0"
          : "mx-auto w-full flex-1 max-w-7xl px-4 py-8 md:px-6 md:py-10"
      }>
        <Outlet />
      </main>
    </div>
  );
}
