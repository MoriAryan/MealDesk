import { useEffect, useState, type FormEvent } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  Eye, EyeOff, ArrowLeft, ArrowRight,
  Sparkles, CheckCircle, ChefHat, QrCode, BarChart3,
  Layers, Shield,
} from "lucide-react";
import { MealDeskWordmark, MealDeskSplitReveal } from "../components/MealDeskBrand";

type AuthTab = "login" | "signup";

/* ─────────────────────────────────────────────
   POST-LOGIN SPLASH — Initials to Wordmark
───────────────────────────────────────────── */
const GatheringSplash = () => (
  <div
    className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
    style={{ background: "var(--color-bg)" }}
  >
    <style>{`
      @keyframes md-soft-pulse {
        0%, 100% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.08); opacity: 0.18; }
      }
    `}</style>

    <div
      className="absolute h-[340px] w-[340px] rounded-full"
      style={{
        background: "radial-gradient(circle, rgba(217,119,54,0.2) 0%, rgba(217,119,54,0) 68%)",
        animation: "md-soft-pulse 2.8s ease-in-out infinite",
      }}
    />

    <div className="relative flex flex-col items-center">
      <MealDeskSplitReveal size={120} />
      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--color-muted)" }}>
        Preparing your workspace
      </p>
      <div className="mt-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-ink">
        <CheckCircle size={16} color="var(--color-accent)" /> Session ready
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   ANIMATED BACKGROUND GRID
───────────────────────────────────────────── */
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Radial glow */}
      <div
        className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, var(--color-accent) 0%, transparent 65%)" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
        style={{ background: "radial-gradient(circle, #f97316 0%, transparent 65%)" }}
      />

      {/* Fine grid lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-ink)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LEFT PANEL — Visual story
───────────────────────────────────────────── */
const FEATURE_PILLS = [
  { icon: Layers,  text: "Visual floor plan", color: "#6366f1" },
  { icon: ChefHat, text: "Kitchen display",   color: "#f97316" },
  { icon: QrCode,  text: "UPI QR payments",   color: "#22c55e" },
  { icon: BarChart3, text: "Live reporting",  color: "#a855f7" },
  { icon: Shield,  text: "Role-based access", color: "#0ea5e9" },
];

function LeftPanel() {
  const [pillsVisible, setPillsVisible] = useState(false);
  const [typedChars, setTypedChars] = useState(0);
  const typedText = "Table 5: 2 Cappuccino, 1 Croissant";

  useEffect(() => {
    const t = setTimeout(() => setPillsVisible(true), 300);
    const typeTimer = setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= typedText.length) return 0;
        return prev + 1;
      });
    }, 80);
    return () => { clearTimeout(t); clearInterval(typeTimer); };
  }, []);

  return (
    <div
      className="hidden lg:flex flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(150deg, #1a0e08 0%, #2d1a0f 40%, #1c1208 100%)",
        flex: "0 0 46%",
        minHeight: "100dvh",
      }}
    >
      <AnimatedGrid />

      {/* Central content */}
      <div className="relative z-10 flex flex-col flex-1 justify-center px-10 py-10">
        {/* Badge */}
        <div
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest"
          style={{ borderColor: "rgba(249,115,22,0.3)", background: "rgba(249,115,22,0.12)", color: "#f97316" }}
        >
          <Sparkles size={10} /> Your cafe command centre
        </div>

        {/* Headline */}
        <h1
          className="mb-4 text-4xl xl:text-5xl font-black leading-[1.08] tracking-tight text-white"
        >
          Every order, every
          <br />
          table, every{" "}
          <span style={{
            background: "linear-gradient(135deg, #c15b3d, #f97316)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            rupee.
          </span>
        </h1>

        <p className="mb-8 text-[15px] font-medium leading-relaxed text-white/50 max-w-sm">
          Cleaner login, faster access, and a workflow that feels human instead of mechanical.
        </p>

        {/* Feature pills */}
        <div className="flex flex-col gap-3 mb-10">
          {FEATURE_PILLS.map(({ icon: Icon, text, color }, i) => (
            <div
              key={text}
              className="flex items-center gap-3"
              style={{
                opacity: pillsVisible ? 1 : 0,
                transform: pillsVisible ? "translateX(0)" : "translateX(-20px)",
                transition: `opacity 0.5s ${i * 80}ms ease, transform 0.5s ${i * 80}ms ease`,
              }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
                style={{ background: `${color}22` }}
              >
                <Icon size={14} style={{ color }} />
              </div>
              <span className="text-sm font-semibold text-white/70">{text}</span>
            </div>
          ))}
        </div>

        {/* Simple interactive scene */}
        <div
          className="relative rounded-2xl border p-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20" />
            <div className="h-6 w-20 rounded-full bg-orange-400/20 border border-orange-300/30" />
          </div>

          <div className="rounded-xl bg-[#1f1712] border border-white/10 px-4 py-3 min-h-[56px]">
            <p className="text-sm font-semibold text-orange-100/90">
              {typedText.slice(0, typedChars)}
              <span className="animate-pulse">|</span>
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Live queue synced with kitchen screen
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="relative z-10 px-10 pb-8">
        <div className="flex items-center gap-3 flex-wrap">
          {["Supabase Secured", "GST Ready", "Works Offline"].map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 uppercase tracking-widest"
            >
              <CheckCircle size={10} style={{ color: "#22c55e" }} />
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   INPUT FIELD COMPONENT
───────────────────────────────────────────── */
function InputField({
  label, type, value, onChange, placeholder, autoComplete, minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  minLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPass ? "text" : "password") : type;

  return (
    <div className="relative">
      <label className="block text-xs font-bold uppercase tracking-widest mb-2"
        style={{ color: "var(--color-muted)" }}>
        {label}
      </label>
      <div
        className="relative flex items-center overflow-hidden rounded-2xl border transition-all duration-300"
        style={{
          borderColor: focused ? "var(--color-accent)" : "var(--color-border)",
          background: "var(--color-bg)",
          boxShadow: focused ? "0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent)" : "none",
        }}
      >
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required
          className="w-full bg-transparent px-4 py-3.5 text-sm font-medium outline-none placeholder:font-normal"
          style={{ color: "var(--color-ink)" }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="pr-4 text-muted hover:text-ink transition-colors shrink-0"
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN LOGIN PAGE
───────────────────────────────────────────── */
export function LoginPage() {
  const { login, signup, user } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showSplash, setShowSplash]           = useState(false);
  const [readyToRedirect, setReadyToRedirect] = useState(false);
  const [formVisible, setFormVisible]         = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFormVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  if (user && !showSplash)  return <Navigate to="/" replace />;
  if (readyToRedirect)       return <Navigate to="/" replace />;
  if (showSplash)            return <GatheringSplash />;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (activeTab === "login") await login(email, password);
      else                       await signup(name, email, password);
      setShowSplash(true);
      setTimeout(() => setReadyToRedirect(true), 3200);
    } catch (err) {
      setShowSplash(false);
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <div className="flex min-h-[100dvh] overflow-hidden" style={{ background: "var(--color-bg)" }}>
      {/* ─── LEFT VISUAL PANEL ─── */}
      <LeftPanel />

      {/* ─── RIGHT AUTH PANEL ─── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
        <AnimatedGrid />

        {/* Back to landing — top left (mobile only, lg hidden since it's on left panel) */}
        <div className="absolute top-6 left-6 lg:hidden z-10">
          <Link
            to="/landing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
          >
            <ArrowLeft size={13} />
            Back
          </Link>
        </div>

        {/* Logo — shown only on mobile (no tagline, static) */}
        <div className="lg:hidden mb-8 relative z-10">
          <MealDeskWordmark size="text-2xl" showTagline={false} />
        </div>

        {/* Auth card */}
        <div
          className="relative z-10 w-full max-w-md"
          style={{
            opacity: formVisible ? 1 : 0,
            transform: formVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2" style={{ color: "var(--color-ink)" }}>
              {activeTab === "login" ? "Welcome back." : "Start your journey."}
            </h2>
            <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
              {activeTab === "login"
                ? "Sign in to open your POS session and manage your cafe."
                : "Create your manager account. It takes less than a minute."}
            </p>
          </div>

          {/* Tab switcher */}
          <div
            className="relative mb-7 flex w-full rounded-2xl p-1 border"
            style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
          >
            {/* Slider */}
            <div
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl shadow-sm transition-transform duration-300 ease-out"
              style={{
                background: "var(--color-panel)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                transform: activeTab === "login" ? "translateX(4px)" : "translateX(calc(100% + 0px))",
              }}
            />
            {(["login", "signup"] as AuthTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchTab(tab)}
                className="relative z-10 flex-1 py-2.5 text-xs font-bold tracking-widest uppercase transition-colors duration-200"
                style={{ color: activeTab === tab ? "var(--color-accent)" : "var(--color-muted)" }}
              >
                {tab === "login" ? "Sign in" : "Register"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {activeTab === "signup" && (
              <div
                style={{
                  animation: "slideDown 0.35s ease",
                  overflow: "hidden",
                }}
              >
                <style>{`
                  @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-12px); max-height: 0; }
                    to   { opacity: 1; transform: translateY(0);     max-height: 120px; }
                  }
                `}</style>
                <InputField
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <InputField
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="manager@cafe.com"
              autoComplete="email"
            />

            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete={activeTab === "login" ? "current-password" : "new-password"}
              minLength={8}
            />

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-3 rounded-2xl p-4 border text-sm"
                style={{
                  background: "rgba(239,68,68,0.06)",
                  borderColor: "rgba(239,68,68,0.2)",
                  animation: "slideDown 0.3s ease",
                }}
              >
                <span className="shrink-0 mt-0.5">⚠️</span>
                <p className="font-medium text-red-500">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl px-6 py-4 text-sm font-black text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-xl active:scale-[0.99]"
              style={{
                background: loading
                  ? "var(--color-accent)"
                  : "linear-gradient(135deg, var(--color-accent) 0%, #f97316 100%)",
                boxShadow: "0 8px 32px rgba(193,91,61,0.35)",
              }}
            >
              {/* Shimmer effect */}
              {!loading && (
                <div
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                  }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Authenticating…
                  </>
                ) : activeTab === "login" ? (
                  <>
                    Open Your Session
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-xs font-medium" style={{ color: "var(--color-muted)" }}>
            {activeTab === "login" ? (
              <>
                New to MealDesk?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("signup")}
                  className="font-bold hover:underline transition-all"
                  style={{ color: "var(--color-accent)" }}
                >
                  Create a free account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="font-bold hover:underline transition-all"
                  style={{ color: "var(--color-accent)" }}
                >
                  Sign in here
                </button>
              </>
            )}
          </p>

          {/* Security note */}
          <div
            className="mt-8 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-muted)" }}
          >
            <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
            <span>Secured by Supabase Auth</span>
            <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
          </div>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              to="/landing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors"
            >
              <ArrowLeft size={12} />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
