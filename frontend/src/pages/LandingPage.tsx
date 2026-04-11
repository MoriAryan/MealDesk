import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useTheme } from "../theme/ThemeProvider";
import { MealDeskWordmark } from "../components/MealDeskBrand";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChefHat,
  Clock3,
  CreditCard,
  Layers,
  MonitorSmartphone,
  Moon,
  QrCode,
  Shield,
  Sparkles,
  Sun,
  TimerReset,
  Check,
  X,
} from "lucide-react";

type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

type ComparisonRow = {
  label: string;
  mealDesk: string;
  traditional: string;
};

const FEATURES: Feature[] = [
  {
    icon: Layers,
    title: "Table-first workflow",
    description:
      "Select a floor, open the exact table, and move from seating to billing without losing context.",
  },
  {
    icon: ChefHat,
    title: "Kitchen clarity",
    description:
      "Draft orders and prepared items stay visible on the kitchen board so prep feels controlled during rush hours.",
  },
  {
    icon: QrCode,
    title: "UPI-friendly checkout",
    description:
      "Cash, digital, and UPI payment modes are built in, with QR flows that keep queues moving.",
  },
  {
    icon: MonitorSmartphone,
    title: "Guest-facing display",
    description:
      "Show the live bill and payment state on a separate customer screen so the counter can stay focused.",
  },
  {
    icon: BarChart3,
    title: "Decision-ready reporting",
    description:
      "Filter by terminal, session, person, or product and get reports that are actually useful for the next shift.",
  },
  {
    icon: Shield,
    title: "Role-based controls",
    description:
      "Managers configure critical actions while staff only see the flows they need to finish service safely.",
  },
];

const COMPARISON: ComparisonRow[] = [
  {
    label: "Kitchen updates",
    mealDesk: "Live board and ticket state",
    traditional: "Manual calls or delayed sync",
  },
  {
    label: "Table handling",
    mealDesk: "Floor plan with active tables",
    traditional: "Static list or paper register",
  },
  {
    label: "Payments",
    mealDesk: "Cash, digital, and UPI in one flow",
    traditional: "Separate processor workflow",
  },
  {
    label: "Reports",
    mealDesk: "Session, product, and terminal filters",
    traditional: "Basic daily totals only",
  },
  {
    label: "Access",
    mealDesk: "Role-aware controls",
    traditional: "Shared admin login",
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-accent">
      <Sparkles size={10} />
      {children}
    </div>
  );
}

export function LandingPage() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  const productProof = useMemo(
    () => [
      { value: "1 flow", label: "for floor, kitchen, and billing" },
      { value: "3 surfaces", label: "terminal, guest display, reports" },
      { value: "Role-aware", label: "controls for admin and staff" },
    ],
    []
  );

  if (!loading && user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-bg text-ink">
      <style>{`
        @keyframes lp-rise {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lp-float-soft {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes lp-glow-breathe {
          0%, 100% { opacity: 0.45; }
          50%       { opacity: 0.72; }
        }
        @keyframes lp-wordmark-in {
          0%   { opacity:0; transform: translateY(14px) scale(0.94); filter:blur(4px); }
          100% { opacity:1; transform: translateY(0) scale(1);    filter:blur(0); }
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
          animation: "lp-glow-breathe 6s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -right-20 top-56 h-64 w-64 rounded-full blur-3xl"
        aria-hidden="true"
        style={{
          background: "rgba(249,115,22,0.18)",
          animation: "lp-glow-breathe 7.5s ease-in-out infinite",
        }}
      />

      <header className="sticky top-0 z-50 border-b border-border/80 bg-panel/88 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3.5">
          <Link to="/landing" className="flex items-center transition-opacity hover:opacity-85">
            <MealDeskWordmark size="text-xl" showTagline={false} />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-muted md:flex">
            <a href="#why" className="transition-colors hover:text-ink">
              Why MealDesk
            </a>
            <a href="#comparison" className="transition-colors hover:text-ink">
              Compare
            </a>
            <a href="#workflow" className="transition-colors hover:text-ink">
              Workflow
            </a>
            <a href="#features" className="transition-colors hover:text-ink">
              Capabilities
            </a>
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
              className="hidden rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black text-white"
              style={{
                background: "linear-gradient(135deg, var(--color-accent), #f97316)",
                boxShadow: "0 8px 24px rgba(193,91,61,0.3)",
              }}
            >
              Open demo <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pt-16 pb-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:pt-24 lg:pb-32">
          <div
            style={{
              opacity: ready ? 1 : 0,
              animation: ready ? "lp-rise 0.7s ease both" : "none",
            }}
          >
            <SectionLabel>Built for cafes, counters, and kitchens</SectionLabel>

            {/* Premium wordmark entrance — clean fade-up, no animation jank */}
            <div
              className="mt-6 mb-6"
              style={{
                animation: ready ? "lp-wordmark-in 0.8s 0.18s cubic-bezier(0.22,1,0.36,1) both" : "none",
                opacity: ready ? undefined : 0,
              }}
            >
              <span
                className="text-[2.75rem] md:text-[3.5rem] font-black leading-none tracking-tight select-none"
                style={{ color: "var(--color-ink)" }}
              >
                Meal
                <span
                  style={{
                    background: "linear-gradient(135deg, #c15b3d 0%, #f97316 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Desk
                </span>
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">
              Run your cafe in one live order flow.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              MealDesk replaces separate POS, kitchen, and guest-display tools with one product that keeps the counter fast, the kitchen calm, and the reports useful.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white"
                style={{
                  background: "linear-gradient(135deg, var(--color-accent), #f97316)",
                  boxShadow: "0 10px 28px rgba(193,91,61,0.33)",
                }}
              >
                Launch the demo
                <ArrowRight size={16} />
              </Link>
              <a
                href="#comparison"
                className="rounded-2xl border border-border px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                See why it wins
              </a>
              <a
                href="#workflow"
                className="rounded-2xl border border-border px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Watch the flow
              </a>
            </div>

            <div className="mt-12 grid max-w-2xl gap-4 sm:grid-cols-3">
              {productProof.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-panel/85 p-4 shadow-[var(--shadow-artisanal)]">
                  <p className="text-3xl font-black tracking-tight text-ink">{item.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted/80">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-wider text-muted">
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
              animation: ready ? "lp-rise 0.8s 0.12s ease both" : "none",
              willChange: "transform",
            }}
          >
            <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2 text-xs font-semibold text-muted">mealdesk.live/terminal</span>
            </div>

            <div className="grid grid-cols-5 gap-3" style={{ animation: "lp-float-soft 6.5s ease-in-out infinite" }}>
              <div className="col-span-3 rounded-2xl border border-border bg-bg p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-accent">Live terminal</p>
                    <p className="text-sm font-bold text-ink">Counter, kitchen, and payment in one place</p>
                  </div>
                  <div className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                    2 secs
                  </div>
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
                <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                  {[
                    [Clock3, "Live"],
                    [TimerReset, "Fast"],
                    [CreditCard, "Ready"],
                  ].map(([Icon, label]) => (
                    <div key={label as string} className="flex items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1.5">
                      <Icon size={11} className="text-accent" />
                      {label as string}
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

        <section id="why" className="border-y border-border bg-panel/70 py-16 lg:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 md:grid-cols-3">
            {[
              ["One operator flow", "Counter staff can run floor, billing, and payment from one place."],
              ["Less training overhead", "Clear layouts shorten onboarding and reduce accidental actions."],
              ["Consistent visual language", "Shared surfaces and controls make every module feel connected."],
            ].map(([title, copy]) => (
              <article key={title} className="rounded-3xl border border-border bg-bg/65 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/45">
                <h3 className="text-base font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="comparison" className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <div className="mb-10 max-w-2xl lg:mb-14">
            <SectionLabel>Positioning</SectionLabel>
            <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">Why MealDesk over a traditional POS?</h2>
            <p className="mt-4 text-muted text-lg">Users need a reason to switch. This section makes the difference explicit.</p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border bg-panel shadow-[var(--shadow-artisanal)]">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] border-b border-border bg-bg/60 px-6 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-muted">
              <div>Capability</div>
              <div className="text-accent">MealDesk</div>
              <div>Traditional POS</div>
            </div>
            {COMPARISON.map((row, index) => (
              <div key={row.label} className={`grid grid-cols-[1.1fr_1fr_1fr] gap-4 px-6 py-4 ${index !== COMPARISON.length - 1 ? "border-b border-border/70" : ""}`}>
                <div className="text-sm font-bold text-ink pr-4 self-center">{row.label}</div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 mt-0.5">
                     <Check size={12} className="text-success" strokeWidth={3} />
                  </div>
                  <div className="text-sm font-semibold text-ink leading-relaxed">{row.mealDesk}</div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-border/40 mt-0.5">
                     <X size={12} className="text-muted" strokeWidth={2.5} />
                  </div>
                  <div className="text-sm text-muted leading-relaxed">{row.traditional}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="mx-auto w-full max-w-7xl px-6 py-16 lg:py-24">
          <div className="mb-10 max-w-2xl lg:mb-14">
            <SectionLabel>Story</SectionLabel>
            <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">A practical workflow from order to payout</h2>
            <p className="mt-4 text-muted text-lg">The page should tell a story in the same order the restaurant experiences it.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              ["01", "Choose table", "Open floor map and select active table."],
              ["02", "Build order", "Tap menu items and review live totals."],
              ["03", "Send kitchen", "Dispatch ticket instantly to prep queue."],
              ["04", "Collect payment", "Settle via cash, UPI, or digital mode."],
            ].map(([step, title, copy]) => (
              <article key={step} className="rounded-3xl border border-border bg-panel p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent/45">
                <p className="text-xs font-black tracking-widest text-accent">{step}</p>
                <h3 className="mt-2 text-base font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="border-t border-border bg-panel/70 py-16 lg:py-24">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="mb-10 max-w-2xl lg:mb-14">
              <SectionLabel>Capabilities</SectionLabel>
              <h2 className="mt-5 text-3xl font-black tracking-tight md:text-5xl">Core capabilities, presented clearly</h2>
              <p className="mt-4 text-muted text-lg">This needs to feel like product value, not a feature dump.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }, i) => {
                const iconColors = [
                  "linear-gradient(135deg, #c15b3d, #f97316)", // Brand orange
                  "linear-gradient(135deg, #3b82f6, #60a5fa)", // Info blue
                  "linear-gradient(135deg, #16a34a, #4ade80)", // Success green
                  "linear-gradient(135deg, #f59e0b, #fbbf24)", // Warning amber
                ];
                const glowColors = [
                  "rgba(249,115,22,0.12)",
                  "rgba(59,130,246,0.12)",
                  "rgba(22,163,74,0.12)",
                  "rgba(245,158,11,0.12)",
                ];
                return (
                <article key={title} className="rounded-3xl border border-border bg-bg p-6 transition-colors hover:border-accent/40 group shadow-sm hover:shadow-md">
                  <div 
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: glowColors[i % glowColors.length] }}
                  >
                    <div style={{ background: iconColors[i % iconColors.length], WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
                </article>
              )})}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-16 lg:py-32 text-center">
          <SectionLabel>CTA</SectionLabel>
          <h2 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight md:text-6xl text-balance mx-auto">
            MealDesk makes busy service feel controlled.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Launch a demo that shows the full restaurant flow instead of just a static dashboard.
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
              href="#comparison"
              className="rounded-2xl border border-border px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Compare the difference
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
