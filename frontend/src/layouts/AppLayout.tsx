import { Outlet, Link, useLocation } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../theme/ThemeProvider";
import { Sun, Moon, LogOut, Coffee } from "lucide-react";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isPos = location.pathname === "/pos" || location.pathname === "/pos/";

  return (
    <div className={`bg-bg text-ink selection:bg-accent/20 flex flex-col ${isPos ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"}`}>

      <header className="sticky top-0 z-50 border-b border-border bg-panel/80 backdrop-blur-md shrink-0">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-accent shadow-sm">
              <Coffee size={16} className="text-white" />
            </div>
            <span className="text-[15px] font-black tracking-tight text-ink">
              POS<span className="text-accent">Cafe</span>
            </span>
          </Link>

          {/* Centre nav */}
          <div className="hidden md:block">
            <TopNav />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-border bg-panel text-muted hover:border-accent hover:text-accent transition-all"
              aria-label="Toggle Theme"
            >
              {theme === "dark"
                ? <Sun size={15} className="transition-transform hover:rotate-45" />
                : <Moon size={15} className="transition-transform hover:-rotate-12" />}
            </button>
            <div className="h-5 w-px bg-border" />
            <span className="text-xs font-medium text-muted hidden sm:inline">
              {user?.name || user?.email?.split('@')[0]}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-full border border-border bg-panel px-3 py-1.5 text-xs font-semibold text-ink transition-all hover:bg-accent hover:border-accent hover:text-white"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="border-t border-border px-4 py-3 md:hidden">
          <TopNav />
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
