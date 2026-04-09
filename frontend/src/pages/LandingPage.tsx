import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../theme/ThemeProvider";
import { MealDeskWordmark, MealDeskSplitReveal } from "../components/MealDeskBrand";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Layers,
  MonitorSmartphone,
  Moon,
  QrCode,
  Shield,
  Sun,
} from "lucide-react";

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    icon: Layers,
    title: "Table-first workflow",
    description:
      "See floor status instantly, open any table in one tap, and move from seating to billing without context switching.",
  },
  {
    icon: ChefHat,
    title: "Kitchen dispatch clarity",
    description:
      "Tickets appear in real time on kitchen display so prep flow stays calm even during rush hours.",
  },
  {
    icon: QrCode,
    title: "UPI-friendly checkout",
    description:
      "Cash, UPI, and digital methods are all native, with fast settlement and fewer counter delays.",
  },
  {
    icon: MonitorSmartphone,
    title: "Live customer-facing view",
    description:
      "Let guests follow order totals and status updates on a dedicated display screen.",
  },
  {
    icon: BarChart3,
    title: "Decision-ready reporting",
    description:
      "Track best sellers, session revenue, and payment mix in dashboards your team can actually use.",
  },
  {
    icon: Shield,
    title: "Role-based controls",
    description:
      "Managers configure critical settings while day-to-day operations remain safe and focused for staff.",
  },
];

export function LandingPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-bg text-ink">
      <style>{`
        @keyframes md-rise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes md-float-soft {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes md-glow-breathe {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.72; }
        }
      `}</style>

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(1200px 600px at -10% -20%, rgba(193,91,61,0.18), transparent 60%), radial-gradient(1100px 500px at 110% 10%, rgba(249,115,22,0.14), transparent 58%), linear-gradient(180deg, color-mix(in srgb, var(--color-panel) 82%, transparent) 0%, transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute -left-16 top-28 h-56 w-56 rounded-full blur-3xl"
        aria-hidden="true"
        style={{
          background: "rgba(193,91,61,0.22)",
          animation: "md-glow-breathe 6s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 top-56 h-64 w-64 rounded-full blur-3xl"
        aria-hidden="true"
        style={{
          background: "rgba(249,115,22,0.18)",
          animation: "md-glow-breathe 7.5s ease-in-out infinite",
        }}
      />

      <header className="sticky top-0 z-50 border-b border-border/80 bg-panel/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/landing" className="flex items-center hover:opacity-85 transition-opacity">
            <MealDeskWordmark size="text-xl" showTagline={false} />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted">
            <a href="#why" className="hover:text-ink transition-colors">Why MealDesk</a>
            <a href="#workflow" className="hover:text-ink transition-colors">Workflow</a>
            <a href="#features" className="hover:text-ink transition-colors">Capabilities</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-flex rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, var(--color-accent), #f97316)",
                boxShadow: "0 8px 24px rgba(193,91,61,0.3)",
              }}
            >
              Start Now <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24">
          <div
            style={{
              opacity: ready ? 1 : 0,
              animation: ready ? "md-rise 0.7s ease both" : "none",
            }}
          >
            <div className="mb-7">
              <MealDeskSplitReveal size={132} />
            </div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent">
              Built for modern cafe teams
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.04] tracking-tight md:text-6xl">
              A premium POS that feels calm at peak hours.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              MealDesk gives your counter, kitchen, and floor team one coherent system. Faster service, cleaner handoff, and a UI that stays focused under pressure.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3.5">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent), #f97316)",
                  boxShadow: "0 10px 28px rgba(193,91,61,0.33)",
                }}
              >
                Open MealDesk
                <ArrowRight size={16} />
              </Link>
              <a
                href="#features"
                className="rounded-2xl border border-border px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Explore Product
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold uppercase tracking-wider text-muted">
              {[
                "Role-aware access",
                "Fast table turnover",
                "Live kitchen queue",
                "UPI-first checkout",
              ].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-accent" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            className="rounded-[2rem] border border-border bg-panel/90 p-5 shadow-[var(--shadow-artisanal)]"
            style={{
              opacity: ready ? 1 : 0,
              animation: ready ? "md-rise 0.8s 0.12s ease both" : "none",
              willChange: "transform",
            }}
          >
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2 text-xs font-semibold text-muted">mealdesk.live/terminal</span>
            </div>

            <div className="grid grid-cols-5 gap-3" style={{ animation: "md-float-soft 6.5s ease-in-out infinite" }}>
              <div className="col-span-3 rounded-2xl border border-border bg-bg p-3">
                <div className="mb-3 flex flex-wrap gap-2">
                  {["Coffee", "Food", "Desserts", "Quick"].map((chip, i) => (
                    <span
                      key={chip}
                      className="rounded-full px-3 py-1 text-[11px] font-bold"
                      style={
                        i === 0
                          ? { background: "var(--color-accent)", color: "white" }
                          : { background: "var(--color-panel)", color: "var(--color-muted)", border: "1px solid var(--color-border)" }
                      }
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  {[
                    ["Espresso", "180"],
                    ["Cold Brew", "190"],
                    ["Croissant", "120"],
                    ["Brownie", "90"],
                  ].map(([name, amount]) => (
                    <div key={name} className="rounded-xl border border-border bg-panel px-3 py-2.5">
                      <p className="font-semibold text-ink">{name}</p>
                      <p className="text-muted">INR {amount}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 rounded-2xl border border-border bg-bg p-3">
                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-ink">Table 04</p>
                <div className="space-y-2 text-xs">
                  {[
                    ["Espresso x2", "360"],
                    ["Cold Brew x1", "190"],
                    ["Croissant x1", "120"],
                  ].map(([line, amount]) => (
                    <div key={line} className="flex items-center justify-between rounded-lg border border-border px-2 py-1.5">
                      <span className="text-ink">{line}</span>
                      <span className="font-bold text-ink">INR {amount}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-border pt-2">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span>Total</span>
                    <span>INR 670</span>
                  </div>
                  <button
                    className="mt-2 w-full rounded-lg py-2 text-[11px] font-black text-white"
                    style={{ background: "linear-gradient(135deg, var(--color-accent), #f97316)" }}
                  >
                    Collect Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="border-y border-border bg-panel/70 py-14">
          <div className="mx-auto grid w-full max-w-7xl gap-5 px-6 md:grid-cols-3">
            {[
              ["Single operator flow", "Counter staff can run floor, billing, and payment from one place."],
              ["Less training overhead", "Clear layouts shorten onboarding and reduce accidental actions."],
              ["Consistent visual language", "Shared surfaces and controls make every module feel connected."],
            ].map(([title, copy]) => (
              <article key={title} className="rounded-2xl border border-border bg-bg/65 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/45">
                <h3 className="text-base font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="mx-auto w-full max-w-7xl px-6 py-18">
          <div className="mb-7 max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">A practical workflow from order to payout</h2>
            <p className="mt-3 text-muted">MealDesk keeps each step obvious so your team can move faster without visual overload.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["01", "Choose table", "Open floor map and select active table."],
              ["02", "Build order", "Tap menu items and review live totals."],
              ["03", "Send kitchen", "Dispatch ticket instantly to prep queue."],
              ["04", "Collect payment", "Settle via cash, UPI, or digital mode."],
            ].map(([step, title, copy]) => (
              <article key={step} className="rounded-2xl border border-border bg-panel p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/45">
                <p className="text-xs font-black tracking-widest text-accent">{step}</p>
                <h3 className="mt-2 text-base font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="border-t border-border bg-panel/70 py-18">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight md:text-4xl">Core capabilities, presented clearly</h2>
              <p className="mt-3 text-muted">Premium does not mean noisy. Every block below has a clear operational purpose.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <article key={title} className="rounded-2xl border border-border bg-bg p-5 transition-colors hover:border-accent/45">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon size={18} />
                  </div>
                  <h3 className="text-base font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-6 py-20 text-center">
          <h2 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">MealDesk makes busy service feel controlled.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
            Launch your next shift on a UI designed for speed, readability, and confident operations.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg, var(--color-accent), #f97316)" }}
            >
              Enter MealDesk
              <ArrowRight size={16} />
            </Link>
            <a
              href="#why"
              className="rounded-2xl border border-border px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              See why teams switch
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
