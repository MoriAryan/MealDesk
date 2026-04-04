import { Outlet, Link } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../theme/ThemeProvider";
import { Sun, Moon, LogOut } from "lucide-react";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg text-ink selection:bg-accent/20">
      <header className="sticky top-0 z-50 border-b border-border bg-panel/75 backdrop-blur-md transition-colors duration-400">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <Link to="/" className="group flex items-baseline gap-2 hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">
                Logo
              </h1>
            </Link>
          </div>

          <div className="hidden md:block">
            <TopNav />
          </div>

          <div className="flex items-center gap-5">
            <button
              onClick={toggleTheme}
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-panel text-muted transition-all hover:border-accent hover:text-accent shadow-[var(--shadow-artisanal)]"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={16} className="transition-transform group-hover:rotate-45" /> : <Moon size={16} className="transition-transform group-hover:-rotate-12" />}
            </button>
            <div className="h-6 w-px bg-border"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted">
                {user?.name || user?.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1.5 text-xs font-medium text-ink transition-all hover:bg-accent hover:text-white"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <div className="border-t border-border px-4 py-3 md:hidden">
            <TopNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <Outlet />
      </main>
    </div>
  );
}
